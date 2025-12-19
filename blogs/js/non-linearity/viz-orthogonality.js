import { COLORS } from './common.js';

export function initVizOrthogonality() {
    const canvasOrth = document.getElementById('viz-orthogonality');
    if (canvasOrth) {
        const ctxOrth = canvasOrth.getContext('2d');
        let orthAngle = Math.PI / 4; // Start at 45 degrees
        let isDragging = false;

        function resizeOrth() {
            const rect = canvasOrth.getBoundingClientRect();
            canvasOrth.width = rect.width * window.devicePixelRatio;
            canvasOrth.height = rect.height * window.devicePixelRatio;
            ctxOrth.scale(window.devicePixelRatio, window.devicePixelRatio);
        }

        function drawOrthogonality() {
            const w = canvasOrth.getBoundingClientRect().width;
            const h = canvasOrth.getBoundingClientRect().height;
            const cx = w / 2;
            const cy = h / 2;
            const len = 120;

            ctxOrth.clearRect(0, 0, w, h);

            // Grid
            ctxOrth.strokeStyle = COLORS.grid;
            ctxOrth.lineWidth = 1;
            for (let x = 0; x < w; x += 40) {
                ctxOrth.beginPath();
                ctxOrth.moveTo(x, 0);
                ctxOrth.lineTo(x, h);
                ctxOrth.stroke();
            }
            for (let y = 0; y < h; y += 40) {
                ctxOrth.beginPath();
                ctxOrth.moveTo(0, y);
                ctxOrth.lineTo(w, y);
                ctxOrth.stroke();
            }

            // Fixed vector (horizontal)
            const v1 = { x: len, y: 0 };

            // Draggable vector
            const v2 = {
                x: Math.cos(orthAngle) * len,
                y: -Math.sin(orthAngle) * len
            };

            // Calculate dot product and angle
            const dot = v1.x * v2.x + v1.y * v2.y;
            const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
            const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
            const cosAngle = dot / (mag1 * mag2);
            const angleDeg = Math.acos(Math.max(-1, Math.min(1, cosAngle))) * 180 / Math.PI;
            const orthogonality = Math.abs(90 - angleDeg) < 5 ? 1 : 1 - Math.abs(cosAngle);

            // Draw angle arc
            ctxOrth.strokeStyle = orthogonality > 0.9 ? COLORS.accent : COLORS.dim;
            ctxOrth.lineWidth = 2;
            ctxOrth.beginPath();
            ctxOrth.arc(cx, cy, 40, 0, -orthAngle, orthAngle > 0);
            ctxOrth.stroke();

            // Draw fixed vector (red/pink)
            ctxOrth.strokeStyle = COLORS.accent;
            ctxOrth.lineWidth = 3;
            ctxOrth.beginPath();
            ctxOrth.moveTo(cx, cy);
            ctxOrth.lineTo(cx + v1.x, cy + v1.y);
            ctxOrth.stroke();

            // Arrow head
            ctxOrth.fillStyle = COLORS.accent;
            ctxOrth.beginPath();
            ctxOrth.moveTo(cx + v1.x, cy + v1.y);
            ctxOrth.lineTo(cx + v1.x - 10, cy + v1.y - 5);
            ctxOrth.lineTo(cx + v1.x - 10, cy + v1.y + 5);
            ctxOrth.closePath();
            ctxOrth.fill();

            // Draw draggable vector (teal)
            ctxOrth.strokeStyle = COLORS.primary;
            ctxOrth.lineWidth = 3;
            ctxOrth.beginPath();
            ctxOrth.moveTo(cx, cy);
            ctxOrth.lineTo(cx + v2.x, cy + v2.y);
            ctxOrth.stroke();

            // Arrow head
            const arrowAngle = Math.atan2(v2.y, v2.x);
            ctxOrth.fillStyle = COLORS.primary;
            ctxOrth.beginPath();
            ctxOrth.moveTo(cx + v2.x, cy + v2.y);
            ctxOrth.lineTo(
                cx + v2.x - 10 * Math.cos(arrowAngle - 0.3),
                cy + v2.y - 10 * Math.sin(arrowAngle - 0.3)
            );
            ctxOrth.lineTo(
                cx + v2.x - 10 * Math.cos(arrowAngle + 0.3),
                cy + v2.y - 10 * Math.sin(arrowAngle + 0.3)
            );
            ctxOrth.closePath();
            ctxOrth.fill();

            // Drag handle
            ctxOrth.beginPath();
            ctxOrth.arc(cx + v2.x, cy + v2.y, 12, 0, Math.PI * 2);
            ctxOrth.fillStyle = 'rgba(27, 153, 139, 0.3)';
            ctxOrth.fill();
            ctxOrth.strokeStyle = COLORS.primary;
            ctxOrth.lineWidth = 2;
            ctxOrth.stroke();

            // Info panel
            ctxOrth.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctxOrth.fillRect(20, 20, 200, 80);
            ctxOrth.strokeStyle = COLORS.grid;
            ctxOrth.strokeRect(20, 20, 200, 80);

            ctxOrth.font = '12px "Courier New", monospace';
            ctxOrth.fillStyle = COLORS.light;
            ctxOrth.fillText(`Angle: ${angleDeg.toFixed(1)}°`, 35, 45);
            ctxOrth.fillText(`Dot product: ${(cosAngle).toFixed(3)}`, 35, 65);

            const independence = orthogonality > 0.9 ? 'ORTHOGONAL' :
                orthogonality > 0.5 ? 'Partially independent' : 'Correlated';
            ctxOrth.fillStyle = orthogonality > 0.9 ? COLORS.accent : COLORS.dim;
            ctxOrth.fillText(`Status: ${independence}`, 35, 85);
        }

        function getMouseAngle(e) {
            const rect = canvasOrth.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            return -Math.atan2(y, x);
        }

        canvasOrth.addEventListener('mousedown', (e) => {
            isDragging = true;
            orthAngle = getMouseAngle(e);
            drawOrthogonality();
        });

        canvasOrth.addEventListener('mousemove', (e) => {
            if (isDragging) {
                orthAngle = getMouseAngle(e);
                drawOrthogonality();
            }
        });

        canvasOrth.addEventListener('mouseup', () => isDragging = false);
        canvasOrth.addEventListener('mouseleave', () => isDragging = false);

        // Touch support
        canvasOrth.addEventListener('touchstart', (e) => {
            isDragging = true;
            orthAngle = getMouseAngle(e.touches[0]);
            drawOrthogonality();
            e.preventDefault();
        });

        canvasOrth.addEventListener('touchmove', (e) => {
            if (isDragging) {
                orthAngle = getMouseAngle(e.touches[0]);
                drawOrthogonality();
            }
            e.preventDefault();
        });

        canvasOrth.addEventListener('touchend', () => isDragging = false);

        resizeOrth();
        drawOrthogonality();
        window.addEventListener('resize', () => { resizeOrth(); drawOrthogonality(); });
    }
}
