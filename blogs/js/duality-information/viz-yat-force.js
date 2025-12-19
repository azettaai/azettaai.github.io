import { COLORS, randomVector, dot, euclideanDist, yat, magnitude } from './common.js';

export function initVizYatForce() {
    const canvas = document.getElementById('viz-yat-force');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrame;
    let time = 0;
    let isDragging = null;

    // Two atoms with their vectors
    let atoms = [
        { x: 0.3, y: 0.5, vector: randomVector(12, 1) },
        { x: 0.7, y: 0.5, vector: randomVector(12, 1) }
    ];

    // Field particles for visualization
    const fieldParticles = [];
    for (let i = 0; i < 80; i++) {
        fieldParticles.push({
            x: Math.random(),
            y: Math.random(),
            vx: 0,
            vy: 0
        });
    }

    const hexToRgba = (hex, alpha) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    function resize() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    function drawAtom(cx, cy, vector, label, isA) {
        const maxMag = Math.max(...vector.map(Math.abs));
        const color = isA ? COLORS.primary : COLORS.wave;

        // Nucleus glow
        const glowSize = 70;
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowSize);
        glow.addColorStop(0, hexToRgba(color, 0.5));
        glow.addColorStop(0.4, hexToRgba(color, 0.15));
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Nucleus with gradient
        const nucleusGrad = ctx.createRadialGradient(cx - 5, cy - 5, 0, cx, cy, 20);
        nucleusGrad.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        nucleusGrad.addColorStop(0.5, color);
        nucleusGrad.addColorStop(1, hexToRgba(color, 0.7));
        ctx.fillStyle = nucleusGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, 20, 0, Math.PI * 2);
        ctx.fill();

        // Label
        ctx.fillStyle = COLORS.light;
        ctx.font = 'bold 16px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, cx, cy);

        // Orbiting particles
        for (let i = 0; i < vector.length; i++) {
            const val = vector[i];
            const normalizedMag = Math.abs(val) / maxMag;
            const radius = 28 + normalizedMag * 30;
            const speed = 0.4 - normalizedMag * 0.2;
            const angle = (i / vector.length) * Math.PI * 2 + time * speed;

            const px = cx + Math.cos(angle) * radius;
            const py = cy + Math.sin(angle) * radius;

            const pColor = val > 0.1 ? COLORS.proton : (val < -0.1 ? COLORS.electron : COLORS.neutral);
            const size = 3 + normalizedMag * 5;

            // Particle glow
            ctx.fillStyle = hexToRgba(pColor, 0.3);
            ctx.beginPath();
            ctx.arc(px, py, size * 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = pColor;
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function draw() {
        const w = canvas.getBoundingClientRect().width;
        const h = canvas.getBoundingClientRect().height;

        ctx.clearRect(0, 0, w, h);

        // Background gradient
        const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.6);
        bgGrad.addColorStop(0, 'rgba(27, 153, 139, 0.03)');
        bgGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Grid
        ctx.strokeStyle = COLORS.grid;
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = 0; y < h; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        // Calculate positions
        const a1 = { x: atoms[0].x * w, y: atoms[0].y * h };
        const a2 = { x: atoms[1].x * w, y: atoms[1].y * h };

        // Calculate Yat
        const yatValue = yat(atoms[0].vector, atoms[1].vector);
        const dotValue = dot(atoms[0].vector, atoms[1].vector);
        const distValue = euclideanDist(atoms[0].vector, atoms[1].vector);
        const yatNorm = Math.min(yatValue / 8, 1);

        // Update and draw field particles
        const midX = (a1.x + a2.x) / 2;
        const midY = (a1.y + a2.y) / 2;

        for (const fp of fieldParticles) {
            const px = fp.x * w;
            const py = fp.y * h;

            // Calculate field direction (perpendicular to connection)
            const dx = a2.x - a1.x;
            const dy = a2.y - a1.y;
            const len = Math.sqrt(dx * dx + dy * dy);

            // Distance to midpoint
            const distToMid = Math.sqrt((px - midX) ** 2 + (py - midY) ** 2);
            const influence = Math.max(0, 1 - distToMid / (w * 0.4));

            // Flow along field lines
            const flowAngle = Math.atan2(dy, dx) + Math.PI / 2;
            const flowSpeed = influence * yatNorm * 0.003;

            fp.x += Math.cos(flowAngle + time * 0.5) * flowSpeed;
            fp.y += Math.sin(flowAngle + time * 0.5) * flowSpeed;

            // Wrap around
            if (fp.x < 0) fp.x = 1;
            if (fp.x > 1) fp.x = 0;
            if (fp.y < 0) fp.y = 1;
            if (fp.y > 1) fp.y = 0;

            // Draw
            const alpha = influence * yatNorm * 0.6;
            if (alpha > 0.05) {
                ctx.fillStyle = `rgba(237, 33, 124, ${alpha})`;
                ctx.beginPath();
                ctx.arc(fp.x * w, fp.y * h, 2 + influence * 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Draw force field lines between atoms
        const numLines = 12;
        for (let i = 0; i < numLines; i++) {
            const offset = ((i / numLines) - 0.5) * 80;
            const dx = a2.x - a1.x;
            const dy = a2.y - a1.y;
            const len = Math.sqrt(dx * dx + dy * dy);

            const nx = -dy / len;
            const ny = dx / len;

            const p1x = a1.x + nx * offset;
            const p1y = a1.y + ny * offset;
            const p2x = a2.x + nx * offset;
            const p2y = a2.y + ny * offset;

            // Animate the field lines
            const phase = time * 3 + i * 0.6;
            const alpha = (0.1 + yatNorm * 0.5) * (0.4 + 0.6 * Math.sin(phase));

            // Curved gradient line
            const gradient = ctx.createLinearGradient(p1x, p1y, p2x, p2y);
            gradient.addColorStop(0, hexToRgba(COLORS.primary, alpha));
            gradient.addColorStop(0.5, hexToRgba(COLORS.accent, alpha * 1.5));
            gradient.addColorStop(1, hexToRgba(COLORS.wave, alpha));

            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1 + yatNorm * 2.5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(p1x, p1y);

            // Curved line with animated bulge
            const curve = Math.sin(phase) * 25 * yatNorm;
            ctx.quadraticCurveTo(midX, midY + curve, p2x, p2y);
            ctx.stroke();
        }

        // Draw atoms
        drawAtom(a1.x, a1.y, atoms[0].vector, 'A', true);
        drawAtom(a2.x, a2.y, atoms[1].vector, 'B', false);

        // Central Yat display
        const meterW = 220;
        const meterH = 85;
        const meterX = w / 2 - meterW / 2;
        const meterY = 15;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(meterX, meterY, meterW, meterH);

        const meterGrad = ctx.createLinearGradient(meterX, meterY, meterX + meterW, meterY);
        meterGrad.addColorStop(0, COLORS.primary);
        meterGrad.addColorStop(1, COLORS.wave);
        ctx.strokeStyle = meterGrad;
        ctx.lineWidth = 2;
        ctx.strokeRect(meterX, meterY, meterW, meterH);

        ctx.font = '11px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = COLORS.dim;
        ctx.fillText('ELECTROMAGNETIC FORCE', w / 2, meterY + 18);

        ctx.font = 'bold 28px "Courier New", monospace';
        ctx.fillStyle = COLORS.accent;
        const yatDisplay = isFinite(yatValue) ? yatValue.toFixed(2) : '∞';
        ctx.fillText(`Yat = ${yatDisplay}`, w / 2, meterY + 50);

        ctx.font = '10px "Courier New", monospace';
        ctx.fillStyle = COLORS.dim;
        ctx.fillText(`⟨x·y⟩ = ${dotValue.toFixed(2)}   |   ‖x-y‖ = ${distValue.toFixed(2)}`, w / 2, meterY + 72);

        // Interpretation bar
        const interpretation = yatValue > 5 ? 'STRONG ATTRACTION' :
            yatValue > 2 ? 'Moderate force' :
                yatValue > 0.5 ? 'Weak interaction' : 'Near independence';
        const interpColor = yatValue > 2 ? COLORS.accent : (yatValue > 0.5 ? COLORS.primary : COLORS.dim);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(15, h - 45, 170, 30);
        ctx.strokeStyle = interpColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(15, h - 45, 170, 30);
        ctx.font = '11px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = interpColor;
        ctx.fillText(interpretation, 25, h - 25);

        time += 0.018;
        animationFrame = requestAnimationFrame(draw);
    }

    function getAtomAt(x, y) {
        const w = canvas.getBoundingClientRect().width;
        const h = canvas.getBoundingClientRect().height;

        for (let i = 0; i < atoms.length; i++) {
            const ax = atoms[i].x * w;
            const ay = atoms[i].y * h;
            const dist = Math.sqrt((x - ax) ** 2 + (y - ay) ** 2);
            if (dist < 70) return i;
        }
        return null;
    }

    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        isDragging = getAtomAt(x, y);
    });

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (isDragging !== null) {
            atoms[isDragging].x = Math.max(0.1, Math.min(0.9, x / rect.width));
            atoms[isDragging].y = Math.max(0.15, Math.min(0.85, y / rect.height));
        }

        canvas.style.cursor = getAtomAt(x, y) !== null ? 'grab' : 'crosshair';
    });

    canvas.addEventListener('mouseup', () => isDragging = null);
    canvas.addEventListener('mouseleave', () => isDragging = null);

    resize();
    draw();
    window.addEventListener('resize', resize);
}
