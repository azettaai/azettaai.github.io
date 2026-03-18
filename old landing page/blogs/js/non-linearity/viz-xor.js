import { COLORS } from './common.js';

export function initVizXOR() {
    const canvasXOR = document.getElementById('viz-xor');
    if (canvasXOR) {
        const ctxXOR = canvasXOR.getContext('2d');
        let selectedXORPoint = 0; // 0, 1, 2, 3

        const xorPoints = [
            { x: 1, y: 1, label: '(1, 1)', class: 'Class 0' },
            { x: -1, y: -1, label: '(-1, -1)', class: 'Class 0' },
            { x: -1, y: 1, label: '(-1, 1)', class: 'Class 1' },
            { x: 1, y: -1, label: '(1, -1)', class: 'Class 1' }
        ];

        function resizeXOR() {
            const rect = canvasXOR.getBoundingClientRect();
            canvasXOR.width = rect.width * window.devicePixelRatio;
            canvasXOR.height = rect.height * window.devicePixelRatio;
            ctxXOR.scale(window.devicePixelRatio, window.devicePixelRatio);
        }

        function drawXOR() {
            const w = canvasXOR.getBoundingClientRect().width;
            const h = canvasXOR.getBoundingClientRect().height;
            const cx = w > 600 ? w * 0.4 : w / 2; // Offset center if wide enough for side panel
            const cy = h / 2;
            const scale = Math.min(w, h) * 0.3; // Scale for vectors

            ctxXOR.clearRect(0, 0, w, h);

            // Grid
            ctxXOR.strokeStyle = COLORS.grid;
            ctxXOR.lineWidth = 1;
            drawGrid(ctxXOR, w, h); // Helper if available, else inline

            // Draw Axes
            ctxXOR.strokeStyle = COLORS.dim;
            ctxXOR.lineWidth = 2;
            ctxXOR.beginPath();
            ctxXOR.moveTo(cx - w, cy); ctxXOR.lineTo(cx + w, cy); // X axis
            ctxXOR.moveTo(cx, cy - h); ctxXOR.lineTo(cx, cy + h); // Y axis
            ctxXOR.stroke();

            // The Reference Vector (1, 1)
            const refScale = scale * 1.0;
            const refX = 1 * refScale;
            const refY = -1 * refScale; // Invert Y for canvas

            // Draw Reference Vector (faded if not highlighted)
            ctxXOR.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctxXOR.lineWidth = 4;
            drawArrow(ctxXOR, cx, cy, cx + refX, cy + refY);

            // Draw current selected point vector
            const p = xorPoints[selectedXORPoint];
            const px = p.x * scale;
            const py = -p.y * scale;

            // Determine relationship
            const dot = 1 * p.x + 1 * p.y;
            const isOrthogonal = Math.abs(dot) < 0.1;

            ctxXOR.strokeStyle = isOrthogonal ? COLORS.accent : COLORS.primary;
            ctxXOR.lineWidth = 3;
            drawArrow(ctxXOR, cx, cy, cx + px, cy + py);

            // Draw all points
            xorPoints.forEach((pt, i) => {
                const ptx = cx + pt.x * scale;
                const pty = cy - pt.y * scale;

                ctxXOR.beginPath();
                ctxXOR.arc(ptx, pty, i === selectedXORPoint ? 12 : 6, 0, Math.PI * 2);
                ctxXOR.fillStyle = pt.class === 'Class 0' ? COLORS.primary : COLORS.accent;
                ctxXOR.fill();

                if (i === selectedXORPoint) {
                    ctxXOR.strokeStyle = '#fff';
                    ctxXOR.lineWidth = 2;
                    ctxXOR.stroke();
                }

                // Small labels
                ctxXOR.fillStyle = COLORS.dim;
                ctxXOR.font = '10px monospace';
                ctxXOR.fillText(pt.label, ptx + 15, pty);
            });

            // Info Panel (Right side or overlay)
            const panelX = w > 600 ? w * 0.75 : w - 160;
            const panelY = 40;
            // Draw Angle Arc if orthogonal
            if (isOrthogonal) {
                ctxXOR.strokeStyle = COLORS.accent;
                ctxXOR.lineWidth = 2;
                ctxXOR.beginPath();
                // Draw a small right angle symbol
                // This is an approximation/hack for the visual
                const size = 20;
                // Calculate mid-angle between (1,1) and point
                // Not strictly 90 deg visually on screen unless aspect is 1:1, but conceptual
            }

            // Stats
            ctxXOR.fillStyle = 'rgba(0,0,0,0.8)';
            ctxXOR.fillRect(w > 600 ? w * 0.65 : 10, 10, 200, 140);
            ctxXOR.strokeStyle = COLORS.grid;
            ctxXOR.strokeRect(w > 600 ? w * 0.65 : 10, 10, 200, 140);

            ctxXOR.fillStyle = COLORS.light;
            ctxXOR.font = '12px "Courier New", monospace';
            const baseX = w > 600 ? w * 0.65 + 15 : 25;
            let currentY = 35;

            ctxXOR.fillText(`Ref Vector: (1, 1)`, baseX, currentY); currentY += 20;
            ctxXOR.fillText(`Target:     ${p.label}`, baseX, currentY); currentY += 25;

            ctxXOR.fillText(`Dot Product: ${dot}`, baseX, currentY); currentY += 20;
            const status = dot === 0 ? "ORTHOGONAL" : (dot > 0 ? "PARALLEL" : "ANTI-PARALLEL");
            const color = dot === 0 ? COLORS.accent : COLORS.primary;

            ctxXOR.fillStyle = color;
            ctxXOR.font = 'bold 12px "Courier New", monospace';
            ctxXOR.fillText(status, baseX, currentY); currentY += 25;

            ctxXOR.fillStyle = COLORS.light;
            const yatVal = dot === 0 ? "0.00" : (dot > 0 ? "High" : "High (Signed)");
            // Calculate Yat approx for display (infinite for 1,1)
            const diffSq = (1 - p.x) ** 2 + (1 - p.y) ** 2;
            const yat = diffSq === 0 ? "∞" : ((dot * dot) / diffSq).toFixed(2);

            ctxXOR.fillText(`Yat: ${yat}`, baseX, currentY);
        }

        function drawGrid(ctx, w, h) {
            for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
            for (let y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
        }

        function drawArrow(ctx, x1, y1, x2, y2) {
            const angle = Math.atan2(y2 - y1, x2 - x1);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            // Head
            ctx.beginPath();
            ctx.moveTo(x2, y2);
            ctx.lineTo(x2 - 10 * Math.cos(angle - 0.5), y2 - 10 * Math.sin(angle - 0.5));
            ctx.lineTo(x2 - 10 * Math.cos(angle + 0.5), y2 - 10 * Math.sin(angle + 0.5));
            ctx.closePath();
            ctx.fillStyle = ctx.strokeStyle;
            ctx.fill();
        }

        canvasXOR.addEventListener('click', () => {
            selectedXORPoint = (selectedXORPoint + 1) % 4;
            drawXOR();
        });

        resizeXOR();
        drawXOR();
        window.addEventListener('resize', () => { resizeXOR(); drawXOR(); });
    }
}
