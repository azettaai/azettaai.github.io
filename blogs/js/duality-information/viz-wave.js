import { COLORS, randomVector, normalize, magnitude } from './common.js';

export function initVizWave() {
    const canvas = document.getElementById('viz-wave');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrame;
    let time = 0;
    let isNormalized = false;
    let transitionProgress = 0;

    const hexToRgba = (hex, alpha) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    // Generate a sample vector
    const dims = 20;
    let vector = randomVector(dims, 2);

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

    function draw() {
        const w = canvas.getBoundingClientRect().width;
        const h = canvas.getBoundingClientRect().height;
        const cx = w / 2;
        const cy = h / 2;

        ctx.clearRect(0, 0, w, h);

        // Background
        const bgGrad = ctx.createLinearGradient(0, 0, w, 0);
        bgGrad.addColorStop(0, 'rgba(27, 153, 139, 0.03)');
        bgGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
        bgGrad.addColorStop(1, 'rgba(155, 93, 229, 0.03)');
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

        // Smooth transition
        const targetProgress = isNormalized ? 1 : 0;
        transitionProgress += (targetProgress - transitionProgress) * 0.06;
        const easedProgress = easeInOutCubic(transitionProgress);

        const rawVector = vector;
        const normVector = normalize(vector);
        const rawMag = magnitude(vector);

        // Interpolate between views
        const displayVector = rawVector.map((v, i) =>
            lerp(v, normVector[i] * 2.5, easedProgress)
        );

        const maxVal = Math.max(...rawVector.map(Math.abs), 0.1);
        const barWidth = (w - 100) / dims;
        const barMaxHeight = h * 0.32;
        const baseY = cy + 30;

        // Draw connecting wave line first (behind bars)
        if (easedProgress > 0.2) {
            ctx.strokeStyle = hexToRgba(COLORS.wave, easedProgress * 0.7);
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();

            const normMax = 2.5;
            for (let i = 0; i < dims; i++) {
                const x = 50 + i * barWidth + barWidth / 2;
                const val = lerp(rawVector[i], normVector[i] * 2.5, easedProgress);
                const barHeight = (val / normMax) * barMaxHeight;
                const y = baseY - barHeight;
                const phase = time * 2 + i * 0.15;
                const animated = y + Math.sin(phase) * (easedProgress * 3);

                if (i === 0) {
                    ctx.moveTo(x, animated);
                } else {
                    ctx.lineTo(x, animated);
                }
            }
            ctx.stroke();

            // Glow effect
            ctx.strokeStyle = hexToRgba(COLORS.wave, easedProgress * 0.2);
            ctx.lineWidth = 8;
            ctx.stroke();
        }

        // Draw bars
        for (let i = 0; i < dims; i++) {
            const val = displayVector[i];
            const barHeight = (Math.abs(val) / maxVal) * barMaxHeight;
            const x = 50 + i * barWidth;

            // Color based on transition
            let barColor;
            if (easedProgress < 0.5) {
                // Particle mode: red/blue based on sign
                barColor = val > 0 ? COLORS.proton : COLORS.electron;
            } else {
                // Wave mode: purple gradient based on position
                const hue = 260 + (i / dims) * 50;
                const saturation = 70 + easedProgress * 10;
                barColor = `hsl(${hue}, ${saturation}%, 55%)`;
            }

            // Bar glow
            const glowAlpha = 0.2 + Math.sin(time * 3 + i * 0.3) * 0.1;
            ctx.fillStyle = hexToRgba(barColor.startsWith('#') ? barColor : COLORS.wave, glowAlpha);
            const glowPad = 4;
            if (val >= 0) {
                ctx.fillRect(x - glowPad, baseY - barHeight - glowPad, barWidth + glowPad * 2, barHeight + glowPad * 2);
            } else {
                ctx.fillRect(x - glowPad, baseY - glowPad, barWidth + glowPad * 2, barHeight + glowPad * 2);
            }

            // Main bar with gradient
            const barGrad = ctx.createLinearGradient(x, baseY - barHeight, x, baseY + barHeight);
            if (val >= 0) {
                barGrad.addColorStop(0, barColor);
                barGrad.addColorStop(1, hexToRgba(barColor.startsWith('#') ? barColor : COLORS.wave, 0.5));
            } else {
                barGrad.addColorStop(0, hexToRgba(barColor.startsWith('#') ? barColor : COLORS.wave, 0.5));
                barGrad.addColorStop(1, barColor);
            }
            ctx.fillStyle = barGrad;

            if (val >= 0) {
                ctx.fillRect(x + 2, baseY - barHeight, barWidth - 4, barHeight);
            } else {
                ctx.fillRect(x + 2, baseY, barWidth - 4, barHeight);
            }

            // Dimension label
            ctx.fillStyle = COLORS.dim;
            ctx.font = '8px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(`d${i + 1}`, x + barWidth / 2, h - 25);
        }

        // Zero line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(50, baseY);
        ctx.lineTo(w - 50, baseY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Labels
        ctx.font = '10px "Courier New", monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = COLORS.dim;
        ctx.fillText('+', 42, baseY - barMaxHeight * 0.7);
        ctx.fillText('0', 42, baseY);
        ctx.fillText('−', 42, baseY + barMaxHeight * 0.7);

        // Info panels
        const leftPanel = { x: 20, y: 15, w: 155, h: 70 };
        const rightPanel = { x: w - 175, y: 15, w: 155, h: 70 };

        // Left panel - Particle view info
        const leftAlpha = 0.9 - easedProgress * 0.4;
        ctx.fillStyle = `rgba(0, 0, 0, ${leftAlpha})`;
        ctx.fillRect(leftPanel.x, leftPanel.y, leftPanel.w, leftPanel.h);
        ctx.strokeStyle = easedProgress < 0.5 ? COLORS.primary : COLORS.dim;
        ctx.lineWidth = easedProgress < 0.5 ? 2 : 1;
        ctx.strokeRect(leftPanel.x, leftPanel.y, leftPanel.w, leftPanel.h);

        ctx.font = 'bold 11px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillStyle = easedProgress < 0.5 ? COLORS.primary : COLORS.dim;
        ctx.fillText('⚛ PARTICLE VIEW', leftPanel.x + 12, leftPanel.y + 12);
        ctx.font = '9px "Courier New", monospace';
        ctx.fillStyle = COLORS.dim;
        ctx.fillText('Independent dims', leftPanel.x + 12, leftPanel.y + 30);
        ctx.fillText(`‖v‖ = ${rawMag.toFixed(2)}`, leftPanel.x + 12, leftPanel.y + 45);

        // Right panel - Wave view info
        const rightAlpha = 0.5 + easedProgress * 0.4;
        ctx.fillStyle = `rgba(0, 0, 0, ${rightAlpha})`;
        ctx.fillRect(rightPanel.x, rightPanel.y, rightPanel.w, rightPanel.h);
        ctx.strokeStyle = easedProgress > 0.5 ? COLORS.wave : COLORS.dim;
        ctx.lineWidth = easedProgress > 0.5 ? 2 : 1;
        ctx.strokeRect(rightPanel.x, rightPanel.y, rightPanel.w, rightPanel.h);

        ctx.font = 'bold 11px "Courier New", monospace';
        ctx.fillStyle = easedProgress > 0.5 ? COLORS.wave : COLORS.dim;
        ctx.fillText('〜 WAVE VIEW', rightPanel.x + 12, rightPanel.y + 12);
        ctx.font = '9px "Courier New", monospace';
        ctx.fillStyle = COLORS.dim;
        ctx.fillText('Coupled signal', rightPanel.x + 12, rightPanel.y + 30);
        ctx.fillText('‖v̂‖ = 1.00', rightPanel.x + 12, rightPanel.y + 45);

        // Toggle button
        const btnW = 200;
        const btnH = 35;
        const btnX = cx - btnW / 2;
        const btnY = h - 55;

        const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX + btnW, btnY);
        if (isNormalized) {
            btnGrad.addColorStop(0, 'rgba(155, 93, 229, 0.3)');
            btnGrad.addColorStop(1, 'rgba(27, 153, 139, 0.1)');
        } else {
            btnGrad.addColorStop(0, 'rgba(27, 153, 139, 0.1)');
            btnGrad.addColorStop(1, 'rgba(155, 93, 229, 0.3)');
        }
        ctx.fillStyle = btnGrad;
        ctx.fillRect(btnX, btnY, btnW, btnH);

        const btnBorderGrad = ctx.createLinearGradient(btnX, btnY, btnX + btnW, btnY);
        btnBorderGrad.addColorStop(0, isNormalized ? COLORS.wave : COLORS.primary);
        btnBorderGrad.addColorStop(1, isNormalized ? COLORS.primary : COLORS.wave);
        ctx.strokeStyle = btnBorderGrad;
        ctx.lineWidth = 2;
        ctx.strokeRect(btnX, btnY, btnW, btnH);

        ctx.fillStyle = COLORS.light;
        ctx.font = 'bold 12px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(isNormalized ? '← PARTICLES' : 'WAVES →', cx, btnY + btnH / 2);

        time += 0.018;
        animationFrame = requestAnimationFrame(draw);
    }

    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const h = rect.height;

        // Check if clicked on toggle button
        if (y > h - 60) {
            isNormalized = !isNormalized;
        } else {
            // New random vector
            vector = randomVector(dims, 2);
        }
    });

    resize();
    draw();
    window.addEventListener('resize', resize);
}
