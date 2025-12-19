import { COLORS, randomVector, normalize, dot, yat, magnitude } from './common.js';

export function initVizDuality() {
    const canvas = document.getElementById('viz-duality');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrame;
    let time = 0;
    let viewMode = 'particle';
    let transitionProgress = 0;

    const hexToRgba = (hex, alpha) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    // Two vectors to compare
    const dims = 24;
    let vectorA = randomVector(dims, 1.5);
    let vectorB = randomVector(dims, 1.5);

    // Particle trails
    const trailsA = [];
    const trailsB = [];
    for (let i = 0; i < dims; i++) {
        trailsA.push([]);
        trailsB.push([]);
    }

    function resize() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function drawParticleAtom(cx, cy, vector, trails, label, color, isHovered) {
        const maxMag = Math.max(...vector.map(Math.abs), 0.1);
        const baseRadius = 35;

        // Glow
        const glowSize = isHovered ? 75 : 65;
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowSize);
        glow.addColorStop(0, hexToRgba(color, 0.4));
        glow.addColorStop(0.6, hexToRgba(color, 0.1));
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Nucleus with gradient
        const nucleusGrad = ctx.createRadialGradient(cx - 4, cy - 4, 0, cx, cy, 18);
        nucleusGrad.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        nucleusGrad.addColorStop(0.5, color);
        nucleusGrad.addColorStop(1, hexToRgba(color, 0.6));
        ctx.fillStyle = nucleusGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, 18, 0, Math.PI * 2);
        ctx.fill();

        // Label
        ctx.fillStyle = COLORS.light;
        ctx.font = 'bold 14px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, cx, cy);

        // Draw trails and particles
        for (let i = 0; i < vector.length; i++) {
            const val = vector[i];
            const normMag = Math.abs(val) / maxMag;
            const radius = baseRadius + normMag * 38;
            const speed = 0.35 - normMag * 0.15;
            const angle = (i / vector.length) * Math.PI * 2 + time * speed;

            const px = cx + Math.cos(angle) * radius;
            const py = cy + Math.sin(angle) * radius * 0.85;

            // Update trail
            trails[i].unshift({ x: px, y: py });
            if (trails[i].length > 6) trails[i].pop();

            const pColor = val > 0.1 ? COLORS.proton : (val < -0.1 ? COLORS.electron : COLORS.neutral);
            const size = 4 + normMag * 6;

            // Draw trail
            for (let t = 1; t < trails[i].length; t++) {
                const alpha = (1 - t / trails[i].length) * 0.25;
                const trailSize = size * (1 - t / trails[i].length) * 0.5;
                ctx.fillStyle = hexToRgba(pColor, alpha);
                ctx.beginPath();
                ctx.arc(trails[i][t].x, trails[i][t].y, trailSize, 0, Math.PI * 2);
                ctx.fill();
            }

            // Particle glow
            ctx.fillStyle = hexToRgba(pColor, 0.25);
            ctx.beginPath();
            ctx.arc(px, py, size * 2, 0, Math.PI * 2);
            ctx.fill();

            // Particle core
            const coreGrad = ctx.createRadialGradient(px - size * 0.3, py - size * 0.3, 0, px, py, size);
            coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
            coreGrad.addColorStop(0.4, pColor);
            coreGrad.addColorStop(1, hexToRgba(pColor, 0.7));
            ctx.fillStyle = coreGrad;
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawWaveform(cx, cy, vector, label, color) {
        const normVec = normalize(vector);
        const waveW = 140;
        const waveH = 55;

        // Background box with glow
        ctx.fillStyle = hexToRgba(color, 0.08);
        ctx.fillRect(cx - waveW / 2 - 5, cy - waveH - 5, waveW + 10, waveH * 2 + 10);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(cx - waveW / 2, cy - waveH, waveW, waveH * 2);
        ctx.strokeStyle = hexToRgba(color, 0.5);
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - waveW / 2, cy - waveH, waveW, waveH * 2);

        // Zero line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(cx - waveW / 2, cy);
        ctx.lineTo(cx + waveW / 2, cy);
        ctx.stroke();
        ctx.setLineDash([]);

        // Waveform glow
        ctx.strokeStyle = hexToRgba(color, 0.25);
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        for (let i = 0; i < normVec.length; i++) {
            const x = cx - waveW / 2 + 12 + (i / (normVec.length - 1)) * (waveW - 24);
            const y = cy + normVec[i] * waveH * 0.85;
            const phase = time * 2 + i * 0.12;
            const animated = y + Math.sin(phase) * 2;
            if (i === 0) ctx.moveTo(x, animated);
            else ctx.lineTo(x, animated);
        }
        ctx.stroke();

        // Main waveform
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let i = 0; i < normVec.length; i++) {
            const x = cx - waveW / 2 + 12 + (i / (normVec.length - 1)) * (waveW - 24);
            const y = cy + normVec[i] * waveH * 0.85;
            const phase = time * 2 + i * 0.12;
            const animated = y + Math.sin(phase) * 2;
            if (i === 0) ctx.moveTo(x, animated);
            else ctx.lineTo(x, animated);
        }
        ctx.stroke();

        // Label
        ctx.fillStyle = color;
        ctx.font = 'bold 11px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(label, cx, cy - waveH - 12);

        // Magnitude indicator
        ctx.font = '9px "Courier New", monospace';
        ctx.fillStyle = COLORS.dim;
        ctx.fillText('‖v̂‖ = 1.00', cx, cy + waveH + 18);
    }

    function draw() {
        const w = canvas.getBoundingClientRect().width;
        const h = canvas.getBoundingClientRect().height;
        const cx = w / 2;

        ctx.clearRect(0, 0, w, h);

        // Background
        const bgGrad = ctx.createRadialGradient(cx, h * 0.4, 0, cx, h * 0.4, w * 0.5);
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

        // Transition logic
        const targetProgress = viewMode === 'wave' ? 1 : 0;
        transitionProgress += (targetProgress - transitionProgress) * 0.045;
        const easedProgress = easeInOutCubic(transitionProgress);

        // Positions
        const posAx = lerp(w * 0.25, w * 0.28, easedProgress);
        const posBx = lerp(w * 0.75, w * 0.72, easedProgress);
        const posY = h * 0.42;

        // Draw vectors based on transition
        if (easedProgress < 0.8) {
            ctx.globalAlpha = 1 - easedProgress * 1.2;
            drawParticleAtom(posAx, posY, vectorA, trailsA, 'A', COLORS.primary, false);
            drawParticleAtom(posBx, posY, vectorB, trailsB, 'B', COLORS.wave, false);
            ctx.globalAlpha = 1;
        }

        if (easedProgress > 0.2) {
            ctx.globalAlpha = (easedProgress - 0.2) * 1.2;
            drawWaveform(posAx, posY, vectorA, 'Signal A', COLORS.primary);
            drawWaveform(posBx, posY, vectorB, 'Signal B', COLORS.wave);
            ctx.globalAlpha = 1;
        }

        // Calculate metrics
        const yatValue = yat(vectorA, vectorB);
        const dotValue = dot(vectorA, vectorB);

        // Connection between vectors
        const yatNorm = Math.min(yatValue / 6, 1);

        // Animated connection particles
        const numParticles = Math.floor(yatNorm * 5) + 2;
        for (let p = 0; p < numParticles; p++) {
            const t = ((time * 0.4 + p / numParticles) % 1);
            const px = posAx + (posBx - posAx) * t;
            const py = posY + Math.sin(t * Math.PI) * (-20 - yatNorm * 20);

            ctx.fillStyle = hexToRgba(COLORS.accent, 0.4 + yatNorm * 0.3);
            ctx.beginPath();
            ctx.arc(px, py, 3 + yatNorm * 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Connection arc
        ctx.strokeStyle = hexToRgba(COLORS.accent, 0.2 + yatNorm * 0.3);
        ctx.lineWidth = 1 + yatNorm * 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(posAx + 80, posY);
        ctx.quadraticCurveTo(cx, posY - 40 - yatNorm * 30, posBx - 80, posY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Yat display in center
        const meterW = 140;
        const meterH = 80;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(cx - meterW / 2, posY - meterH / 2, meterW, meterH);

        const meterGrad = ctx.createLinearGradient(cx - meterW / 2, posY, cx + meterW / 2, posY);
        meterGrad.addColorStop(0, COLORS.primary);
        meterGrad.addColorStop(0.5, COLORS.accent);
        meterGrad.addColorStop(1, COLORS.wave);
        ctx.strokeStyle = meterGrad;
        ctx.lineWidth = 2;
        ctx.strokeRect(cx - meterW / 2, posY - meterH / 2, meterW, meterH);

        ctx.font = '10px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = COLORS.dim;
        ctx.fillText(viewMode === 'particle' ? 'FORCE' : 'COHERENCE', cx, posY - 25);

        ctx.font = 'bold 26px "Courier New", monospace';
        ctx.fillStyle = COLORS.accent;
        ctx.fillText(isFinite(yatValue) ? yatValue.toFixed(2) : '∞', cx, posY + 5);

        ctx.font = '9px "Courier New", monospace';
        ctx.fillStyle = COLORS.dim;
        ctx.fillText(`⟨x·y⟩ = ${dotValue.toFixed(2)}`, cx, posY + 28);

        // Mode toggle buttons
        const btnY = h - 75;
        const btnW = 150;
        const btnH = 50;
        const btnGap = 30;

        // Particle mode box
        const particleActive = viewMode === 'particle';
        ctx.fillStyle = particleActive ? 'rgba(27, 153, 139, 0.25)' : 'rgba(50, 50, 50, 0.5)';
        ctx.fillRect(cx - btnW - btnGap / 2, btnY, btnW, btnH);
        ctx.strokeStyle = particleActive ? COLORS.primary : COLORS.dim;
        ctx.lineWidth = particleActive ? 2 : 1;
        ctx.strokeRect(cx - btnW - btnGap / 2, btnY, btnW, btnH);

        ctx.fillStyle = particleActive ? COLORS.primary : COLORS.dim;
        ctx.font = 'bold 13px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⚛ PARTICLE', cx - btnW / 2 - btnGap / 2, btnY + 22);
        ctx.font = '9px "Courier New", monospace';
        ctx.fillText('Independent dims', cx - btnW / 2 - btnGap / 2, btnY + 38);

        // Wave mode box
        const waveActive = viewMode === 'wave';
        ctx.fillStyle = waveActive ? 'rgba(155, 93, 229, 0.25)' : 'rgba(50, 50, 50, 0.5)';
        ctx.fillRect(cx + btnGap / 2, btnY, btnW, btnH);
        ctx.strokeStyle = waveActive ? COLORS.wave : COLORS.dim;
        ctx.lineWidth = waveActive ? 2 : 1;
        ctx.strokeRect(cx + btnGap / 2, btnY, btnW, btnH);

        ctx.fillStyle = waveActive ? COLORS.wave : COLORS.dim;
        ctx.font = 'bold 13px "Courier New", monospace';
        ctx.fillText('〜 WAVE', cx + btnW / 2 + btnGap / 2, btnY + 22);
        ctx.font = '9px "Courier New", monospace';
        ctx.fillText('Coupled signal', cx + btnW / 2 + btnGap / 2, btnY + 38);

        // Instructions
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(15, 15, 200, 30);
        ctx.strokeStyle = COLORS.grid;
        ctx.lineWidth = 1;
        ctx.strokeRect(15, 15, 200, 30);
        ctx.font = '10px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = COLORS.dim;
        ctx.fillText('Click modes • Click canvas for new', 25, 35);

        time += 0.02;
        animationFrame = requestAnimationFrame(draw);
    }

    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cx = rect.width / 2;
        const btnY = rect.height - 75;
        const btnW = 150;
        const btnH = 50;
        const btnGap = 30;

        // Check if clicked on mode boxes
        if (y >= btnY && y <= btnY + btnH) {
            if (x >= cx - btnW - btnGap / 2 && x <= cx - btnGap / 2) {
                viewMode = 'particle';
            } else if (x >= cx + btnGap / 2 && x <= cx + btnW + btnGap / 2) {
                viewMode = 'wave';
            }
        } else if (y < btnY - 10) {
            // Click elsewhere = new vectors
            vectorA = randomVector(dims, 1.5);
            vectorB = randomVector(dims, 1.5);
            // Reset trails
            for (let i = 0; i < dims; i++) {
                trailsA[i] = [];
                trailsB[i] = [];
            }
        }
    });

    resize();
    draw();
    window.addEventListener('resize', resize);
}
