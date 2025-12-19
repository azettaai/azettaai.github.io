import { COLORS } from './common.js';

export function initVizGeometricTrap() {
    const canvas = document.getElementById('viz-geometric-trap');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrame;
    let time = 0;

    function resize() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
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

        // Draw axes fading into higher dimensions
        const maxDim = 12;
        const axisLen = 80;

        for (let d = 0; d < maxDim; d++) {
            const fade = Math.max(0, 1 - d * 0.15 - Math.sin(time * 0.5 + d * 0.3) * 0.1);
            const angle = (d / maxDim) * Math.PI * 2 + time * 0.1;

            // 3D rotation projection
            const rotX = Math.cos(angle) * axisLen;
            const rotY = Math.sin(angle) * axisLen * 0.6;
            const rotZ = Math.sin(angle + Math.PI / 4) * axisLen * 0.3;

            const projX = cx + rotX + rotZ * 0.5;
            const projY = cy + rotY + rotZ * 0.5;

            // Dimension label
            ctx.save();
            ctx.globalAlpha = fade;

            // Draw axis line
            ctx.strokeStyle = d < 3 ? COLORS.primary : (d < 6 ? COLORS.accent : COLORS.dim);
            ctx.lineWidth = d < 3 ? 3 : (d < 6 ? 2 : 1);
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(projX, projY);
            ctx.stroke();

            // Arrow head
            const arrowAngle = Math.atan2(projY - cy, projX - cx);
            ctx.fillStyle = ctx.strokeStyle;
            ctx.beginPath();
            ctx.moveTo(projX, projY);
            ctx.lineTo(projX - 8 * Math.cos(arrowAngle - 0.3), projY - 8 * Math.sin(arrowAngle - 0.3));
            ctx.lineTo(projX - 8 * Math.cos(arrowAngle + 0.3), projY - 8 * Math.sin(arrowAngle + 0.3));
            ctx.closePath();
            ctx.fill();

            // Dimension label
            ctx.fillStyle = COLORS.light;
            ctx.font = '11px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`d${d + 1}`, projX + 15 * Math.cos(arrowAngle), projY + 15 * Math.sin(arrowAngle));

            ctx.restore();
        }

        // Info panel
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(15, 15, 180, 70);
        ctx.strokeStyle = COLORS.grid;
        ctx.strokeRect(15, 15, 180, 70);

        ctx.font = '12px "Courier New", monospace';
        ctx.fillStyle = COLORS.primary;
        ctx.fillText('Dimensions: 1-3', 30, 38);
        ctx.fillStyle = COLORS.accent;
        ctx.fillText('Dimensions: 4-6', 30, 55);
        ctx.fillStyle = COLORS.dim;
        ctx.fillText('Dimensions: 7-12...', 30, 72);

        // Question mark for higher dims
        ctx.font = 'bold 48px "Courier New", monospace';
        ctx.fillStyle = 'rgba(237, 33, 124, 0.3)';
        ctx.textAlign = 'right';
        ctx.fillText('?', w - 30, h - 30);
        ctx.font = '12px "Courier New", monospace';
        ctx.fillStyle = COLORS.dim;
        ctx.fillText('...dimension 1000?', w - 20, h - 10);

        time += 0.02;
        animationFrame = requestAnimationFrame(draw);
    }

    resize();
    draw();

    window.addEventListener('resize', () => {
        resize();
    });

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        cancelAnimationFrame(animationFrame);
    });
}
