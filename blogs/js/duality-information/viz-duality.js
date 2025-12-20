import { COLORS, randomVector, normalize, dot, yat, magnitude } from './common.js';

export function initVizDuality() {
    const canvas = document.getElementById('viz-duality');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrame;
    let time = 0;
    let viewMode = 'particle';
    let transitionProgress = 0;
    let hoveredButton = null;

    const hexToRgba = (hex, alpha) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    // Views and presets
    const views = [
        { id: 'particle', label: 'Particle', icon: '⚛', color: COLORS.primary, desc: 'Independent' },
        { id: 'wave', label: 'Wave', icon: '〜', color: COLORS.wave, desc: 'Coupled' }
    ];

    const presets = [
        { label: '🎲 New', action: 'new' },
        { label: '≈ Similar', action: 'similar' },
        { label: '↔ Opposite', action: 'opposite' }
    ];

    // Two vectors to compare
    const dims = 20;
    let vectorA = randomVector(dims, 1.5);
    let vectorB = randomVector(dims, 1.5);

    // Particle trails
    const trailsA = [];
    const trailsB = [];
    for (let i = 0; i < dims; i++) {
        trailsA.push([]);
        trailsB.push([]);
    }

    function applyPreset(action) {
        if (action === 'new') {
            vectorA = randomVector(dims, 1.5);
            vectorB = randomVector(dims, 1.5);
        } else if (action === 'similar') {
            vectorA = randomVector(dims, 1.5);
            vectorB = vectorA.map(v => v + (Math.random() - 0.5) * 0.3);
        } else if (action === 'opposite') {
            vectorA = randomVector(dims, 1.5);
            vectorB = vectorA.map(v => -v + (Math.random() - 0.5) * 0.2);
        }
        // Reset trails
        for (let i = 0; i < dims; i++) {
            trailsA[i] = [];
            trailsB[i] = [];
        }
    }

    function resize() {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function drawParticleAtom(cx, cy, vector, trails, label, color) {
        const maxMag = Math.max(...vector.map(Math.abs), 0.1);
        const baseRadius = 30;

        // Glow
        const glowSize = 55;
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowSize);
        glow.addColorStop(0, hexToRgba(color, 0.4));
        glow.addColorStop(0.6, hexToRgba(color, 0.1));
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Nucleus
        const nucleusGrad = ctx.createRadialGradient(cx - 3, cy - 3, 0, cx, cy, 16);
        nucleusGrad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
        nucleusGrad.addColorStop(0.5, color);
        nucleusGrad.addColorStop(1, hexToRgba(color, 0.5));
        ctx.fillStyle = nucleusGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, 16, 0, Math.PI * 2);
        ctx.fill();

        // Label
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, cx, cy);

        // Particles with trails
        for (let i = 0; i < vector.length; i++) {
            const val = vector[i];
            const normMag = Math.abs(val) / maxMag;
            const radius = baseRadius + normMag * 30;
            const speed = 0.3 - normMag * 0.1;
            const angle = (i / vector.length) * Math.PI * 2 + time * speed;

            const px = cx + Math.cos(angle) * radius;
            const py = cy + Math.sin(angle) * radius * 0.8;

            // Update trail
            trails[i].unshift({ x: px, y: py });
            if (trails[i].length > 5) trails[i].pop();

            const pColor = val > 0.1 ? COLORS.proton : (val < -0.1 ? COLORS.electron : COLORS.neutral);
            const size = 3 + normMag * 5;

            // Trail
            for (let t = 1; t < trails[i].length; t++) {
                const alpha = (1 - t / trails[i].length) * 0.2;
                ctx.fillStyle = hexToRgba(pColor, alpha);
                ctx.beginPath();
                ctx.arc(trails[i][t].x, trails[i][t].y, size * (1 - t * 0.15), 0, Math.PI * 2);
                ctx.fill();
            }

            // Particle
            ctx.fillStyle = hexToRgba(pColor, 0.3);
            ctx.beginPath();
            ctx.arc(px, py, size * 1.8, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = pColor;
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawWaveform(cx, cy, vector, label, color) {
        const normVec = normalize(vector);
        const waveW = 120;
        const waveH = 45;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.roundRect(cx - waveW / 2 - 5, cy - waveH - 15, waveW + 10, waveH * 2 + 30, 5);
        ctx.fill();
        ctx.strokeStyle = hexToRgba(color, 0.4);
        ctx.lineWidth = 1;
        ctx.stroke();

        // Zero line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(cx - waveW / 2, cy);
        ctx.lineTo(cx + waveW / 2, cy);
        ctx.stroke();
        ctx.setLineDash([]);

        // Glow
        ctx.strokeStyle = hexToRgba(color, 0.2);
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        for (let i = 0; i < normVec.length; i++) {
            const x = cx - waveW / 2 + 8 + (i / (normVec.length - 1)) * (waveW - 16);
            const y = cy + normVec[i] * waveH * 0.8 + Math.sin(time * 2 + i * 0.1) * 2;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Main line
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let i = 0; i < normVec.length; i++) {
            const x = cx - waveW / 2 + 8 + (i / (normVec.length - 1)) * (waveW - 16);
            const y = cy + normVec[i] * waveH * 0.8 + Math.sin(time * 2 + i * 0.1) * 2;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Label
        ctx.fillStyle = color;
        ctx.font = 'bold 10px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(label, cx, cy - waveH - 5);
    }

    function draw() {
        const rect = canvas.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;
        const cx = w / 2;

        ctx.clearRect(0, 0, w, h);

        // Subtle grid
        ctx.strokeStyle = 'rgba(27, 153, 139, 0.04)';
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 30) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = 0; y < h; y += 30) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        // Transition
        const targetProgress = viewMode === 'wave' ? 1 : 0;
        transitionProgress += (targetProgress - transitionProgress) * 0.055;
        const easedProgress = easeInOutCubic(transitionProgress);

        // Positions
        const posAx = lerp(w * 0.22, w * 0.25, easedProgress);
        const posBx = lerp(w * 0.78, w * 0.75, easedProgress);
        const posY = h * 0.4;

        // Draw vectors
        if (easedProgress < 0.85) {
            ctx.globalAlpha = 1 - easedProgress * 1.15;
            drawParticleAtom(posAx, posY, vectorA, trailsA, 'A', COLORS.primary);
            drawParticleAtom(posBx, posY, vectorB, trailsB, 'B', COLORS.wave);
            ctx.globalAlpha = 1;
        }

        if (easedProgress > 0.15) {
            ctx.globalAlpha = (easedProgress - 0.15) * 1.2;
            drawWaveform(posAx, posY, vectorA, 'Signal A', COLORS.primary);
            drawWaveform(posBx, posY, vectorB, 'Signal B', COLORS.wave);
            ctx.globalAlpha = 1;
        }

        // Calculate Yat
        const yatValue = yat(vectorA, vectorB);
        const dotValue = dot(vectorA, vectorB);
        const yatNorm = Math.min((isFinite(yatValue) ? yatValue : 10) / 8, 1);

        // Connection particles
        for (let p = 0; p < 4; p++) {
            const t = ((time * 0.35 + p * 0.25) % 1);
            const px = posAx + (posBx - posAx) * t;
            const py = posY + Math.sin(t * Math.PI) * (-15 - yatNorm * 15);
            ctx.fillStyle = hexToRgba(COLORS.accent, 0.3 + yatNorm * 0.3);
            ctx.beginPath();
            ctx.arc(px, py, 2.5 + yatNorm * 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Connection arc
        ctx.strokeStyle = hexToRgba(COLORS.accent, 0.15 + yatNorm * 0.25);
        ctx.lineWidth = 1 + yatNorm * 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(posAx + 65, posY);
        ctx.quadraticCurveTo(cx, posY - 30 - yatNorm * 20, posBx - 65, posY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Center Yat display
        const meterW = 120;
        const meterH = 70;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.beginPath();
        ctx.roundRect(cx - meterW / 2, posY - meterH / 2, meterW, meterH, 5);
        ctx.fill();

        const meterGrad = ctx.createLinearGradient(cx - meterW / 2, posY, cx + meterW / 2, posY);
        meterGrad.addColorStop(0, COLORS.primary);
        meterGrad.addColorStop(0.5, COLORS.accent);
        meterGrad.addColorStop(1, COLORS.wave);
        ctx.strokeStyle = meterGrad;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = '9px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = COLORS.dim;
        ctx.fillText(viewMode === 'particle' ? 'YAT FORCE' : 'COHERENCE', cx, posY - 22);

        ctx.font = 'bold 24px "Courier New", monospace';
        ctx.fillStyle = COLORS.accent;
        ctx.fillText(isFinite(yatValue) ? yatValue.toFixed(1) : '∞', cx, posY + 5);

        ctx.font = '8px "Courier New", monospace';
        ctx.fillStyle = COLORS.dim;
        ctx.fillText(`dot = ${dotValue.toFixed(2)}`, cx, posY + 25);

        // View toggle (top center)
        const viewBtnW = 85;
        const viewBtnH = 32;
        const viewBtnGap = 10;
        const viewStartX = cx - (views.length * viewBtnW + (views.length - 1) * viewBtnGap) / 2;
        const viewY = 12;

        for (let i = 0; i < views.length; i++) {
            const x = viewStartX + i * (viewBtnW + viewBtnGap);
            const isActive = views[i].id === viewMode;
            const isHover = hoveredButton === `view_${i}`;

            ctx.fillStyle = isActive ? hexToRgba(views[i].color, 0.35) : (isHover ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.7)');
            ctx.beginPath();
            ctx.roundRect(x, viewY, viewBtnW, viewBtnH, 5);
            ctx.fill();

            ctx.strokeStyle = isActive ? views[i].color : (isHover ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.12)');
            ctx.lineWidth = isActive ? 2 : 1;
            ctx.stroke();

            ctx.font = '10px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = isActive ? views[i].color : (isHover ? COLORS.light : COLORS.dim);
            ctx.fillText(`${views[i].icon} ${views[i].label}`, x + viewBtnW / 2, viewY + viewBtnH / 2);
        }

        // Preset buttons (bottom)
        const presetBtnW = 75;
        const presetBtnH = 28;
        const presetBtnGap = 8;
        const presetStartX = cx - (presets.length * presetBtnW + (presets.length - 1) * presetBtnGap) / 2;
        const presetY = h - 42;

        for (let i = 0; i < presets.length; i++) {
            const x = presetStartX + i * (presetBtnW + presetBtnGap);
            const isHover = hoveredButton === `preset_${i}`;

            ctx.fillStyle = isHover ? hexToRgba(COLORS.primary, 0.25) : 'rgba(0, 0, 0, 0.7)';
            ctx.beginPath();
            ctx.roundRect(x, presetY, presetBtnW, presetBtnH, 4);
            ctx.fill();

            ctx.strokeStyle = isHover ? COLORS.primary : 'rgba(255,255,255,0.15)';
            ctx.lineWidth = isHover ? 1.5 : 1;
            ctx.stroke();

            ctx.font = '10px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = isHover ? COLORS.light : COLORS.dim;
            ctx.fillText(presets[i].label, x + presetBtnW / 2, presetY + presetBtnH / 2);
        }

        time += 0.02;
        animationFrame = requestAnimationFrame(draw);
    }

    function getHoverTarget(mouseX, mouseY) {
        const rect = canvas.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;
        const cx = w / 2;

        // View buttons
        const viewBtnW = 85, viewBtnH = 32, viewBtnGap = 10;
        const viewStartX = cx - (views.length * viewBtnW + (views.length - 1) * viewBtnGap) / 2;
        const viewY = 12;

        for (let i = 0; i < views.length; i++) {
            const x = viewStartX + i * (viewBtnW + viewBtnGap);
            if (mouseX >= x && mouseX <= x + viewBtnW && mouseY >= viewY && mouseY <= viewY + viewBtnH) {
                return { type: 'view', index: i };
            }
        }

        // Preset buttons
        const presetBtnW = 75, presetBtnH = 28, presetBtnGap = 8;
        const presetStartX = cx - (presets.length * presetBtnW + (presets.length - 1) * presetBtnGap) / 2;
        const presetY = h - 42;

        for (let i = 0; i < presets.length; i++) {
            const x = presetStartX + i * (presetBtnW + presetBtnGap);
            if (mouseX >= x && mouseX <= x + presetBtnW && mouseY >= presetY && mouseY <= presetY + presetBtnH) {
                return { type: 'preset', index: i };
            }
        }

        return null;
    }

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        hoveredButton = null;
        const target = getHoverTarget(mouseX, mouseY);

        if (target) {
            if (target.type === 'view') {
                hoveredButton = `view_${target.index}`;
                canvas.style.cursor = 'pointer';
            } else if (target.type === 'preset') {
                hoveredButton = `preset_${target.index}`;
                canvas.style.cursor = 'pointer';
            }
        } else {
            canvas.style.cursor = 'default';
        }
    });

    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const target = getHoverTarget(mouseX, mouseY);

        if (target) {
            if (target.type === 'view') {
                viewMode = views[target.index].id;
            } else if (target.type === 'preset') {
                applyPreset(presets[target.index].action);
            }
        }
    });

    canvas.addEventListener('mouseleave', () => {
        hoveredButton = null;
        canvas.style.cursor = 'default';
    });

    resize();
    draw();
    window.addEventListener('resize', resize);
}
