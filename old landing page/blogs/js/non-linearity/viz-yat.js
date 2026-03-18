import { COLORS } from './common.js';

export function initVizYat() {
    const canvasYat = document.getElementById('viz-yat');
    if (canvasYat) {
        const ctxYat = canvasYat.getContext('2d');
        let vec1 = { x: 80, y: -60 };
        let vec2 = { x: 100, y: 40 };
        let draggingVec = null;

        function resizeYat() {
            const rect = canvasYat.getBoundingClientRect();
            canvasYat.width = rect.width * window.devicePixelRatio;
            canvasYat.height = rect.height * window.devicePixelRatio;
            ctxYat.scale(window.devicePixelRatio, window.devicePixelRatio);
        }

        function drawYat() {
            const w = canvasYat.getBoundingClientRect().width;
            const h = canvasYat.getBoundingClientRect().height;
            const cx = w / 2;
            const cy = h / 2;

            ctxYat.clearRect(0, 0, w, h);

            // Grid
            ctxYat.strokeStyle = COLORS.grid;
            ctxYat.lineWidth = 1;
            for (let x = 0; x < w; x += 40) {
                ctxYat.beginPath();
                ctxYat.moveTo(x, 0);
                ctxYat.lineTo(x, h);
                ctxYat.stroke();
            }
            for (let y = 0; y < h; y += 40) {
                ctxYat.beginPath();
                ctxYat.moveTo(0, y);
                ctxYat.lineTo(w, y);
                ctxYat.stroke();
            }

            // Calculate Yat components
            const dotProduct = vec1.x * vec2.x + vec1.y * vec2.y;
            const diffX = vec2.x - vec1.x;
            const diffY = vec2.y - vec1.y;
            const distSq = diffX * diffX + diffY * diffY;
            const yat = distSq > 0 ? (dotProduct * dotProduct) / distSq : 0;

            // Draw origin
            ctxYat.fillStyle = COLORS.dim;
            ctxYat.beginPath();
            ctxYat.arc(cx, cy, 4, 0, Math.PI * 2);
            ctxYat.fill();

            // Draw vector 1 (pink/accent)
            ctxYat.strokeStyle = COLORS.accent;
            ctxYat.lineWidth = 3;
            ctxYat.beginPath();
            ctxYat.moveTo(cx, cy);
            ctxYat.lineTo(cx + vec1.x, cy + vec1.y);
            ctxYat.stroke();

            // Arrow head
            const angle1 = Math.atan2(vec1.y, vec1.x);
            ctxYat.fillStyle = COLORS.accent;
            ctxYat.beginPath();
            ctxYat.moveTo(cx + vec1.x, cy + vec1.y);
            ctxYat.lineTo(cx + vec1.x - 10 * Math.cos(angle1 - 0.3), cy + vec1.y - 10 * Math.sin(angle1 - 0.3));
            ctxYat.lineTo(cx + vec1.x - 10 * Math.cos(angle1 + 0.3), cy + vec1.y - 10 * Math.sin(angle1 + 0.3));
            ctxYat.closePath();
            ctxYat.fill();

            // Drag handle
            ctxYat.beginPath();
            ctxYat.arc(cx + vec1.x, cy + vec1.y, 12, 0, Math.PI * 2);
            ctxYat.fillStyle = 'rgba(237, 33, 124, 0.3)';
            ctxYat.fill();
            ctxYat.strokeStyle = COLORS.accent;
            ctxYat.lineWidth = 2;
            ctxYat.stroke();

            // Label
            ctxYat.fillStyle = COLORS.accent;
            ctxYat.font = 'bold 12px "Courier New", monospace';
            ctxYat.fillText('x', cx + vec1.x + 15, cy + vec1.y);

            // Draw vector 2 (teal/primary)
            ctxYat.strokeStyle = COLORS.primary;
            ctxYat.lineWidth = 3;
            ctxYat.beginPath();
            ctxYat.moveTo(cx, cy);
            ctxYat.lineTo(cx + vec2.x, cy + vec2.y);
            ctxYat.stroke();

            // Arrow head
            const angle2 = Math.atan2(vec2.y, vec2.x);
            ctxYat.fillStyle = COLORS.primary;
            ctxYat.beginPath();
            ctxYat.moveTo(cx + vec2.x, cy + vec2.y);
            ctxYat.lineTo(cx + vec2.x - 10 * Math.cos(angle2 - 0.3), cy + vec2.y - 10 * Math.sin(angle2 - 0.3));
            ctxYat.lineTo(cx + vec2.x - 10 * Math.cos(angle2 + 0.3), cy + vec2.y - 10 * Math.sin(angle2 + 0.3));
            ctxYat.closePath();
            ctxYat.fill();

            // Drag handle
            ctxYat.beginPath();
            ctxYat.arc(cx + vec2.x, cy + vec2.y, 12, 0, Math.PI * 2);
            ctxYat.fillStyle = 'rgba(27, 153, 139, 0.3)';
            ctxYat.fill();
            ctxYat.strokeStyle = COLORS.primary;
            ctxYat.lineWidth = 2;
            ctxYat.stroke();

            // Label
            ctxYat.fillStyle = COLORS.primary;
            ctxYat.font = 'bold 12px "Courier New", monospace';
            ctxYat.fillText('y', cx + vec2.x + 15, cy + vec2.y);

            // Draw distance line (dashed)
            ctxYat.strokeStyle = COLORS.dim;
            ctxYat.lineWidth = 1;
            ctxYat.setLineDash([4, 4]);
            ctxYat.beginPath();
            ctxYat.moveTo(cx + vec1.x, cy + vec1.y);
            ctxYat.lineTo(cx + vec2.x, cy + vec2.y);
            ctxYat.stroke();
            ctxYat.setLineDash([]);

            // Info panel
            ctxYat.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctxYat.fillRect(15, 15, 220, 130);
            ctxYat.strokeStyle = COLORS.grid;
            ctxYat.strokeRect(15, 15, 220, 130);

            ctxYat.font = '12px "Courier New", monospace';
            ctxYat.fillStyle = COLORS.light;
            ctxYat.fillText(`x · y = ${dotProduct.toFixed(1)}`, 30, 40);
            ctxYat.fillText(`(x · y)² = ${(dotProduct * dotProduct).toFixed(1)}`, 30, 60);
            ctxYat.fillText(`||x - y||² = ${distSq.toFixed(1)}`, 30, 80);

            ctxYat.fillStyle = COLORS.accent;
            ctxYat.font = 'bold 14px "Courier New", monospace';
            ctxYat.fillText(`Yat = ${yat.toFixed(3)}`, 30, 110);

            // Interpretation
            const interpretation = yat > 50 ? 'HIGH (Linear/Similar)' :
                yat > 5 ? 'MEDIUM' : 'LOW (Non-linear/Independent)';
            const interpColor = yat > 50 ? '#ff9966' : yat > 5 ? '#ffcc66' : COLORS.primary;
            ctxYat.fillStyle = interpColor;
            ctxYat.font = '11px "Courier New", monospace';
            ctxYat.fillText(interpretation, 30, 130);
        }

        function getMousePos(e) {
            const rect = canvasYat.getBoundingClientRect();
            return {
                x: (e.clientX - rect.left) - rect.width / 2,
                y: (e.clientY - rect.top) - rect.height / 2
            };
        }

        function isNearHandle(pos, vec) {
            const dx = pos.x - vec.x;
            const dy = pos.y - vec.y;
            return dx * dx + dy * dy < 400;
        }

        canvasYat.addEventListener('mousedown', (e) => {
            const pos = getMousePos(e);
            if (isNearHandle(pos, vec1)) draggingVec = 'vec1';
            else if (isNearHandle(pos, vec2)) draggingVec = 'vec2';
        });

        canvasYat.addEventListener('mousemove', (e) => {
            if (draggingVec) {
                const pos = getMousePos(e);
                if (draggingVec === 'vec1') {
                    vec1.x = pos.x;
                    vec1.y = pos.y;
                } else {
                    vec2.x = pos.x;
                    vec2.y = pos.y;
                }
                drawYat();
            }
        });

        canvasYat.addEventListener('mouseup', () => draggingVec = null);
        canvasYat.addEventListener('mouseleave', () => draggingVec = null);

        // Touch support
        canvasYat.addEventListener('touchstart', (e) => {
            const pos = getMousePos(e.touches[0]);
            if (isNearHandle(pos, vec1)) draggingVec = 'vec1';
            else if (isNearHandle(pos, vec2)) draggingVec = 'vec2';
            e.preventDefault();
        });

        canvasYat.addEventListener('touchmove', (e) => {
            if (draggingVec) {
                const pos = getMousePos(e.touches[0]);
                if (draggingVec === 'vec1') {
                    vec1.x = pos.x;
                    vec1.y = pos.y;
                } else {
                    vec2.x = pos.x;
                    vec2.y = pos.y;
                }
                drawYat();
            }
            e.preventDefault();
        });

        canvasYat.addEventListener('touchend', () => draggingVec = null);

        resizeYat();
        drawYat();
        window.addEventListener('resize', () => { resizeYat(); drawYat(); });
    }
}
