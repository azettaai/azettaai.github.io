import { COLORS, randomVector, dot, euclideanDist, yat, normalize } from './common.js';

export function initVizYatForce() {
    const canvas = document.getElementById('viz-yat-force');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrame;
    let time = 0;
    let draggedAtom = null;
    let hoveredAtom = null;
    let hoveredButton = null;

    const hexToRgba = (hex, alpha) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    // Preset configurations
    const presets = [
        {
            label: 'Random',
            icon: '🎲',
            generate: () => [randomVector(8, 1), randomVector(8, 1)]
        },
        {
            label: 'Similar',
            icon: '≈',
            generate: () => {
                const base = randomVector(8, 1);
                const similar = base.map(v => v + (Math.random() - 0.5) * 0.3);
                return [base, similar];
            }
        },
        {
            label: 'Opposite',
            icon: '↔',
            generate: () => {
                const base = randomVector(8, 1);
                return [base, base.map(v => -v + (Math.random() - 0.5) * 0.2)];
            }
        },
        {
            label: 'Orthogonal',
            icon: '⟂',
            generate: () => {
                // Create two orthogonal vectors
                const a = randomVector(8, 1);
                const b = randomVector(8, 1);
                // Make b orthogonal to a using Gram-Schmidt
                const dotAB = a.reduce((sum, v, i) => sum + v * b[i], 0);
                const dotAA = a.reduce((sum, v) => sum + v * v, 0);
                const orthB = b.map((v, i) => v - (dotAB / dotAA) * a[i]);
                return [a, orthB];
            }
        }
    ];

    // Two atoms
    const atoms = [
        {
            x: 0.28, y: 0.5,
            vector: randomVector(8, 1),
            color: COLORS.primary,
            label: 'A',
            targetX: 0.28, targetY: 0.5
        },
        {
            x: 0.72, y: 0.5,
            vector: randomVector(8, 1),
            color: COLORS.wave,
            label: 'B',
            targetX: 0.72, targetY: 0.5
        }
    ];

    // Energy particles
    const energyParticles = [];
    for (let i = 0; i < 20; i++) {
        energyParticles.push({
            t: Math.random(),
            offset: (Math.random() - 0.5) * 40,
            speed: 0.003 + Math.random() * 0.003,
            size: 2 + Math.random() * 2.5
        });
    }

    // Button dimensions
    const btnW = 85;
    const btnH = 32;
    const btnGap = 10;

    function resize() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    function getButtonBounds(index, w, h) {
        const totalW = presets.length * btnW + (presets.length - 1) * btnGap;
        const startX = (w - totalW) / 2;
        return {
            x: startX + index * (btnW + btnGap),
            y: h - btnH - 15,
            w: btnW,
            h: btnH
        };
    }

    function drawAtom(atom, isHovered, isDragged) {
        const w = canvas.getBoundingClientRect().width;
        const h = canvas.getBoundingClientRect().height;
        const cx = atom.x * w;
        const cy = atom.y * h;
        const maxMag = Math.max(...atom.vector.map(Math.abs), 0.1);

        const scale = isDragged ? 1.12 : (isHovered ? 1.06 : 1);

        // Interaction ring
        if (isHovered || isDragged) {
            ctx.strokeStyle = hexToRgba(atom.color, isDragged ? 0.5 : 0.25);
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.arc(cx, cy, 70 * scale, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Glow
        const glowSize = 65 * scale;
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowSize);
        glow.addColorStop(0, hexToRgba(atom.color, isDragged ? 0.6 : 0.45));
        glow.addColorStop(0.5, hexToRgba(atom.color, 0.12));
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Orbiting particles with trails
        for (let i = 0; i < atom.vector.length; i++) {
            const val = atom.vector[i];
            const normalizedMag = Math.abs(val) / maxMag;
            const radius = (25 + normalizedMag * 28) * scale;
            const speed = 0.35 - normalizedMag * 0.15;
            const angle = (i / atom.vector.length) * Math.PI * 2 + time * speed;

            const px = cx + Math.cos(angle) * radius;
            const py = cy + Math.sin(angle) * radius;

            const pColor = val > 0.1 ? COLORS.proton : (val < -0.1 ? COLORS.electron : COLORS.neutral);
            const size = (3 + normalizedMag * 4) * scale;

            // Trail
            for (let t = 1; t <= 3; t++) {
                const ta = angle - t * 0.1;
                ctx.fillStyle = hexToRgba(pColor, 0.12 - t * 0.03);
                ctx.beginPath();
                ctx.arc(cx + Math.cos(ta) * radius, cy + Math.sin(ta) * radius, size * (1 - t * 0.2), 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.fillStyle = hexToRgba(pColor, 0.35);
            ctx.beginPath();
            ctx.arc(px, py, size * 1.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = pColor;
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Nucleus
        const nucleusSize = 20 * scale;
        const nucleusGrad = ctx.createRadialGradient(cx - 3, cy - 3, 0, cx, cy, nucleusSize);
        nucleusGrad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
        nucleusGrad.addColorStop(0.4, atom.color);
        nucleusGrad.addColorStop(1, hexToRgba(atom.color, 0.55));
        ctx.fillStyle = nucleusGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, nucleusSize, 0, Math.PI * 2);
        ctx.fill();

        // Label
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${15 * scale}px "Courier New", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(atom.label, cx, cy);
    }

    function draw() {
        const w = canvas.getBoundingClientRect().width;
        const h = canvas.getBoundingClientRect().height;

        ctx.clearRect(0, 0, w, h);

        // Smooth position
        for (const atom of atoms) {
            atom.x += (atom.targetX - atom.x) * 0.12;
            atom.y += (atom.targetY - atom.y) * 0.12;
        }

        // Subtle grid
        ctx.strokeStyle = 'rgba(27, 153, 139, 0.06)';
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 50) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = 0; y < h; y += 50) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        // Calculate positions and Yat
        const a1 = { x: atoms[0].x * w, y: atoms[0].y * h };
        const a2 = { x: atoms[1].x * w, y: atoms[1].y * h };

        let yatValue = yat(atoms[0].vector, atoms[1].vector);
        if (!isFinite(yatValue) || isNaN(yatValue)) yatValue = 50;
        const dotValue = dot(atoms[0].vector, atoms[1].vector);

        const yatNorm = Math.min(yatValue / 6, 1);

        const midX = (a1.x + a2.x) / 2;
        const midY = (a1.y + a2.y) / 2;
        const dx = a2.x - a1.x;
        const dy = a2.y - a1.y;
        const angle = Math.atan2(dy, dx);
        const screenDist = Math.sqrt(dx * dx + dy * dy);

        // Force beam
        const beamWidth = 25 + yatNorm * 40;
        const beamGrad = ctx.createLinearGradient(a1.x, a1.y, a2.x, a2.y);
        beamGrad.addColorStop(0, hexToRgba(COLORS.primary, 0.08 + yatNorm * 0.12));
        beamGrad.addColorStop(0.5, hexToRgba(COLORS.accent, 0.12 + yatNorm * 0.18));
        beamGrad.addColorStop(1, hexToRgba(COLORS.wave, 0.08 + yatNorm * 0.12));

        ctx.save();
        ctx.translate(midX, midY);
        ctx.rotate(angle);
        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, screenDist / 2 - 55, beamWidth / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Arc lines
        for (let i = 0; i < 5; i++) {
            const phase = time * 2 + i * Math.PI / 2.5;
            const arcOffset = Math.sin(phase) * 20 * yatNorm;
            const alpha = (0.15 + yatNorm * 0.35) * (0.5 + 0.5 * Math.sin(phase));

            const grad = ctx.createLinearGradient(a1.x, a1.y, a2.x, a2.y);
            grad.addColorStop(0, hexToRgba(COLORS.primary, alpha * 0.4));
            grad.addColorStop(0.5, hexToRgba(COLORS.accent, alpha));
            grad.addColorStop(1, hexToRgba(COLORS.wave, alpha * 0.4));

            ctx.strokeStyle = grad;
            ctx.lineWidth = 1.2 + yatNorm * 1.8;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(a1.x + 65 * Math.cos(angle), a1.y + 65 * Math.sin(angle));
            ctx.quadraticCurveTo(midX, midY + arcOffset, a2.x - 65 * Math.cos(angle), a2.y - 65 * Math.sin(angle));
            ctx.stroke();
        }

        // Energy particles
        for (const p of energyParticles) {
            p.t += p.speed * (0.4 + yatNorm * 0.8);
            if (p.t > 1) p.t = 0;

            const px = a1.x + (a2.x - a1.x) * p.t;
            const py = a1.y + (a2.y - a1.y) * p.t + Math.sin(p.t * Math.PI) * p.offset * yatNorm;

            if (p.t > 0.12 && p.t < 0.88) {
                const alpha = Math.sin(p.t * Math.PI) * (0.35 + yatNorm * 0.35);
                ctx.fillStyle = hexToRgba(COLORS.accent, alpha);
                ctx.beginPath();
                ctx.arc(px, py, p.size * (0.4 + yatNorm * 0.5), 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Draw atoms
        const drawOrder = draggedAtom === 0 ? [1, 0] : [0, 1];
        for (const i of drawOrder) {
            drawAtom(atoms[i], hoveredAtom === i, draggedAtom === i);
        }

        // Yat meter
        const meterW = 160;
        const meterH = 75;
        const meterX = w / 2 - meterW / 2;
        const meterY = 12;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.beginPath();
        ctx.roundRect(meterX, meterY, meterW, meterH, 5);
        ctx.fill();

        const borderGrad = ctx.createLinearGradient(meterX, meterY, meterX + meterW, meterY);
        borderGrad.addColorStop(0, COLORS.primary);
        borderGrad.addColorStop(0.5, COLORS.accent);
        borderGrad.addColorStop(1, COLORS.wave);
        ctx.strokeStyle = borderGrad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(meterX, meterY, meterW, meterH, 5);
        ctx.stroke();

        ctx.font = '9px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = COLORS.dim;
        ctx.fillText('YAT FORCE', w / 2, meterY + 15);

        ctx.font = 'bold 26px "Courier New", monospace';
        ctx.fillStyle = COLORS.accent;
        ctx.fillText(yatValue.toFixed(1), w / 2, meterY + 42);

        // Strength bar
        const barW = meterW - 24;
        const barH = 6;
        const barX = meterX + 12;
        const barY = meterY + 56;

        ctx.fillStyle = 'rgba(50, 50, 50, 0.7)';
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW, barH, 3);
        ctx.fill();

        const fillGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
        fillGrad.addColorStop(0, COLORS.dim);
        fillGrad.addColorStop(0.5, COLORS.primary);
        fillGrad.addColorStop(1, COLORS.accent);
        ctx.fillStyle = fillGrad;
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW * yatNorm, barH, 3);
        ctx.fill();

        // Preset buttons
        for (let i = 0; i < presets.length; i++) {
            const b = getButtonBounds(i, w, h);
            const isHovered = hoveredButton === i;

            // Button background
            ctx.fillStyle = isHovered ? 'rgba(27, 153, 139, 0.3)' : 'rgba(0, 0, 0, 0.8)';
            ctx.beginPath();
            ctx.roundRect(b.x, b.y, b.w, b.h, 4);
            ctx.fill();

            // Button border
            ctx.strokeStyle = isHovered ? COLORS.primary : COLORS.dim;
            ctx.lineWidth = isHovered ? 2 : 1;
            ctx.beginPath();
            ctx.roundRect(b.x, b.y, b.w, b.h, 4);
            ctx.stroke();

            // Icon and label
            ctx.font = '12px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = isHovered ? COLORS.light : COLORS.dim;
            ctx.fillText(`${presets[i].icon} ${presets[i].label}`, b.x + b.w / 2, b.y + b.h / 2);
        }

        time += 0.02;
        animationFrame = requestAnimationFrame(draw);
    }

    function getAtomAt(x, y) {
        const w = canvas.getBoundingClientRect().width;
        const h = canvas.getBoundingClientRect().height;

        for (let i = atoms.length - 1; i >= 0; i--) {
            const ax = atoms[i].x * w;
            const ay = atoms[i].y * h;
            const dist = Math.sqrt((x - ax) ** 2 + (y - ay) ** 2);
            if (dist < 70) return i;
        }
        return null;
    }

    function getButtonAt(x, y) {
        const w = canvas.getBoundingClientRect().width;
        const h = canvas.getBoundingClientRect().height;

        for (let i = 0; i < presets.length; i++) {
            const b = getButtonBounds(i, w, h);
            if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
                return i;
            }
        }
        return null;
    }

    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const btnIdx = getButtonAt(x, y);
        if (btnIdx !== null) {
            // Apply preset
            const [vecA, vecB] = presets[btnIdx].generate();
            atoms[0].vector = vecA;
            atoms[1].vector = vecB;
            return;
        }

        draggedAtom = getAtomAt(x, y);
        if (draggedAtom !== null) {
            canvas.style.cursor = 'grabbing';
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (draggedAtom !== null) {
            atoms[draggedAtom].targetX = Math.max(0.15, Math.min(0.85, x / rect.width));
            atoms[draggedAtom].targetY = Math.max(0.15, Math.min(0.75, y / rect.height));
            canvas.style.cursor = 'grabbing';
        } else {
            hoveredButton = getButtonAt(x, y);
            hoveredAtom = hoveredButton === null ? getAtomAt(x, y) : null;

            if (hoveredButton !== null) {
                canvas.style.cursor = 'pointer';
            } else if (hoveredAtom !== null) {
                canvas.style.cursor = 'grab';
            } else {
                canvas.style.cursor = 'default';
            }
        }
    });

    canvas.addEventListener('mouseup', () => {
        draggedAtom = null;
    });

    canvas.addEventListener('mouseleave', () => {
        draggedAtom = null;
        hoveredAtom = null;
        hoveredButton = null;
        canvas.style.cursor = 'default';
    });

    resize();
    draw();
    window.addEventListener('resize', resize);
}
