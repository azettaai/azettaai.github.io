import { COLORS, randomVector, normalize, magnitude } from './common.js';

export function initVizWave() {
    const canvas = document.getElementById('viz-wave');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrame;
    let time = 0;
    let isNormalized = false;
    let transitionProgress = 0;

    // Generate a sample vector
    const dims = 16;
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

    function draw() {
        const w = canvas.getBoundingClientRect().width;
        const h = canvas.getBoundingClientRect().height;
        const cx = w / 2;
        const cy = h / 2;

        ctx.clearRect(0, 0, w, h);

        // Draw grid
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
        const targetProgress = isNormalized ? 1 : 0;
        transitionProgress += (targetProgress - transitionProgress) * 0.08;

        const rawVector = vector;
        const normVector = normalize(vector);

        // Interpolate between views
        const displayVector = rawVector.map((v, i) =>
            lerp(v, normVector[i] * 2, transitionProgress)
        );

        const maxVal = Math.max(...displayVector.map(Math.abs), 0.1);
        const barWidth = (w - 100) / dims;
        const barMaxHeight = h * 0.35;
        const baseY = cy + 20;

        // Draw bars
        for (let i = 0; i < dims; i++) {
            const val = displayVector[i];
            const barHeight = (Math.abs(val) / maxVal) * barMaxHeight;
            const x = 50 + i * barWidth;

            // Color based on sign and transition
            let color;
            if (transitionProgress < 0.5) {
                // Particle mode: red/blue
                color = val > 0 ? COLORS.proton : COLORS.electron;
            } else {
                // Wave mode: purple gradient
                const hue = 270 + (i / dims) * 60;
                color = `hsl(${hue}, 70%, 55%)`;
            }

            // Bar
            ctx.fillStyle = color;
            if (val >= 0) {
                ctx.fillRect(x + 2, baseY - barHeight, barWidth - 4, barHeight);
            } else {
                ctx.fillRect(x + 2, baseY, barWidth - 4, barHeight);
            }

            // Value label
            ctx.fillStyle = COLORS.dim;
            ctx.font = '9px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`d${i + 1}`, x + barWidth / 2, h - 20);
        }

        // Zero line
        ctx.strokeStyle = COLORS.light;
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(50, baseY);
        ctx.lineTo(w - 50, baseY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Wave overlay when normalized
        if (transitionProgress > 0.3) {
            ctx.strokeStyle = `rgba(155, 93, 229, ${transitionProgress * 0.8})`;
            ctx.lineWidth = 3;
            ctx.beginPath();

            for (let i = 0; i < dims; i++) {
                const val = displayVector[i];
                const barHeight = (val / maxVal) * barMaxHeight;
                const x = 50 + i * barWidth + barWidth / 2;
                const y = baseY - barHeight;

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    // Smooth curve through points
                    const prevVal = displayVector[i - 1];
                    const prevHeight = (prevVal / maxVal) * barMaxHeight;
                    const prevX = 50 + (i - 1) * barWidth + barWidth / 2;
                    const prevY = baseY - prevHeight;

                    const cpX = (prevX + x) / 2;
                    ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
                }
            }
            ctx.stroke();
        }

        // Info panels
        const leftPanel = { x: 20, y: 20, w: 140, h: 65 };
        const rightPanel = { x: w - 160, y: 20, w: 140, h: 65 };

        // Left panel - Particle view info
        ctx.fillStyle = `rgba(0, 0, 0, ${0.7 - transitionProgress * 0.3})`;
        ctx.fillRect(leftPanel.x, leftPanel.y, leftPanel.w, leftPanel.h);
        ctx.strokeStyle = transitionProgress < 0.5 ? COLORS.primary : COLORS.dim;
        ctx.lineWidth = transitionProgress < 0.5 ? 2 : 1;
        ctx.strokeRect(leftPanel.x, leftPanel.y, leftPanel.w, leftPanel.h);

        ctx.font = '11px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = transitionProgress < 0.5 ? COLORS.primary : COLORS.dim;
        ctx.fillText('PARTICLE VIEW', leftPanel.x + 10, leftPanel.y + 20);
        ctx.fillStyle = COLORS.dim;
        ctx.font = '9px "Courier New", monospace';
        ctx.fillText('Independent dims', leftPanel.x + 10, leftPanel.y + 38);
        ctx.fillText(`Magnitude: ${magnitude(vector).toFixed(2)}`, leftPanel.x + 10, leftPanel.y + 52);

        // Right panel - Wave view info
        ctx.fillStyle = `rgba(0, 0, 0, ${0.4 + transitionProgress * 0.4})`;
        ctx.fillRect(rightPanel.x, rightPanel.y, rightPanel.w, rightPanel.h);
        ctx.strokeStyle = transitionProgress > 0.5 ? COLORS.wave : COLORS.dim;
        ctx.lineWidth = transitionProgress > 0.5 ? 2 : 1;
        ctx.strokeRect(rightPanel.x, rightPanel.y, rightPanel.w, rightPanel.h);

        ctx.font = '11px "Courier New", monospace';
        ctx.fillStyle = transitionProgress > 0.5 ? COLORS.wave : COLORS.dim;
        ctx.fillText('WAVE VIEW', rightPanel.x + 10, rightPanel.y + 20);
        ctx.fillStyle = COLORS.dim;
        ctx.font = '9px "Courier New", monospace';
        ctx.fillText('Coupled dims', rightPanel.x + 10, rightPanel.y + 38);
        ctx.fillText('Magnitude: 1.00 (unit)', rightPanel.x + 10, rightPanel.y + 52);

        // Toggle button
        const btnW = 180;
        const btnH = 30;
        const btnX = cx - btnW / 2;
        const btnY = h - 55;

        ctx.fillStyle = isNormalized ? 'rgba(155, 93, 229, 0.3)' : 'rgba(27, 153, 139, 0.3)';
        ctx.fillRect(btnX, btnY, btnW, btnH);
        ctx.strokeStyle = isNormalized ? COLORS.wave : COLORS.primary;
        ctx.lineWidth = 1;
        ctx.strokeRect(btnX, btnY, btnW, btnH);

        ctx.fillStyle = COLORS.light;
        ctx.font = '12px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(isNormalized ? '← SHOW PARTICLES' : 'SHOW WAVE →', cx, btnY + 20);

        time += 0.02;
        animationFrame = requestAnimationFrame(draw);
    }

    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const y = e.clientY - rect.top;

        // Check if clicked on toggle button
        if (y > rect.height - 60) {
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
