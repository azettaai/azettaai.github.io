import { COLORS } from './common.js';

export function initVizPolarity() {
    const canvasPolarity = document.getElementById('viz-polarity');
    if (canvasPolarity) {
        const ctxPol = canvasPolarity.getContext('2d');
        let polAngle = 0; // 0 to PI
        let draggingPol = false;

        function resizePolarity() {
            const rect = canvasPolarity.getBoundingClientRect();
            canvasPolarity.width = rect.width * window.devicePixelRatio;
            canvasPolarity.height = rect.height * window.devicePixelRatio;
            ctxPol.scale(window.devicePixelRatio, window.devicePixelRatio);
        }

        function drawPolarity() {
            const w = canvasPolarity.getBoundingClientRect().width;
            const h = canvasPolarity.getBoundingClientRect().height;
            const cx = w * 0.3;
            const cy = h / 2;
            const r = Math.min(w, h) * 0.35;

            ctxPol.clearRect(0, 0, w, h);

            // 1. Draw Vector View (Left Side)
            // Reference Vector (Fixed Right)
            ctxPol.lineWidth = 4;
            ctxPol.strokeStyle = COLORS.dim;
            ctxPol.beginPath();
            ctxPol.moveTo(cx, cy);
            ctxPol.lineTo(cx + r, cy);
            ctxPol.stroke();

            // Moving Vector
            const vx = Math.cos(polAngle) * r;
            const vy = -Math.sin(polAngle) * r;

            // Dynamic color
            const isAntiParallel = Math.abs(polAngle - Math.PI) < 0.2;
            const isParallel = Math.abs(polAngle) < 0.2;
            const isOrthogonal = Math.abs(polAngle - Math.PI / 2) < 0.2;

            let vecColor = COLORS.dim;
            if (isParallel) vecColor = COLORS.primary;
            else if (isAntiParallel) vecColor = COLORS.primary; // Also primary!
            else if (isOrthogonal) vecColor = COLORS.accent;

            ctxPol.strokeStyle = vecColor;
            ctxPol.beginPath();
            ctxPol.moveTo(cx, cy);
            ctxPol.lineTo(cx + vx, cy + vy);
            ctxPol.stroke();

            // Vector Head
            const headIdx = Math.atan2(vy, vx);
            ctxPol.fillStyle = vecColor;
            ctxPol.beginPath();
            ctxPol.moveTo(cx + vx, cy + vy);
            ctxPol.lineTo(cx + vx - 10 * Math.cos(headIdx - 0.5), cy + vy - 10 * Math.sin(headIdx - 0.5));
            ctxPol.lineTo(cx + vx - 10 * Math.cos(headIdx + 0.5), cy + vy - 10 * Math.sin(headIdx + 0.5));
            ctxPol.fill();

            // Arc Handle
            ctxPol.strokeStyle = COLORS.grid;
            ctxPol.lineWidth = 1;
            ctxPol.beginPath();
            ctxPol.arc(cx, cy, r, -Math.PI, 0);
            ctxPol.stroke();

            // Drag Handle
            ctxPol.beginPath();
            ctxPol.arc(cx + vx, cy + vy, 10, 0, Math.PI * 2);
            ctxPol.fillStyle = 'rgba(255,255,255,0.2)';
            ctxPol.fill();
            ctxPol.strokeStyle = vecColor;
            ctxPol.stroke();

            // Labels
            ctxPol.fillStyle = COLORS.dim;
            ctxPol.font = '10px monospace';
            ctxPol.fillText("Fixed (1,0)", cx + r + 10, cy + 4);

            // 2. Draw Graph View (Right Side)
            const graphX = w * 0.65;
            const graphY = h * 0.2;
            const graphW = w * 0.30;
            const graphH = h * 0.6;
            const bottomY = graphY + graphH;

            // Axes
            ctxPol.strokeStyle = COLORS.dim;
            ctxPol.lineWidth = 1;
            ctxPol.beginPath();
            // Y-Axis
            ctxPol.moveTo(graphX, graphY); ctxPol.lineTo(graphX, bottomY);
            // X-Axis
            ctxPol.moveTo(graphX, bottomY); ctxPol.lineTo(graphX + graphW, bottomY);
            // Zero Line for Y
            ctxPol.moveTo(graphX, graphY + graphH / 2); ctxPol.lineTo(graphX + graphW, graphY + graphH / 2);
            ctxPol.stroke();

            // Labels
            ctxPol.fillStyle = COLORS.dim;
            ctxPol.fillText("180°", graphX + graphW - 20, bottomY + 15);
            ctxPol.fillText("0°", graphX, bottomY + 15);

            // Plot Cosine
            ctxPol.strokeStyle = 'rgba(150,150,150,0.5)';
            ctxPol.beginPath();
            for (let a = 0; a <= Math.PI; a += 0.1) {
                const x = graphX + (a / Math.PI) * graphW;
                const val = Math.cos(a);
                const y = graphY + (1 - val) / 2 * graphH;
                if (a === 0) ctxPol.moveTo(x, y); else ctxPol.lineTo(x, y);
            }
            ctxPol.stroke();
            ctxPol.fillStyle = 'rgba(150,150,150,0.5)';
            ctxPol.fillText("Cosine", graphX, graphY + graphH - 5);

            // Plot Yat
            ctxPol.strokeStyle = COLORS.primary;
            ctxPol.lineWidth = 2;
            ctxPol.beginPath();
            for (let a = 0.1; a <= Math.PI; a += 0.05) {
                const x = graphX + (a / Math.PI) * graphW;
                const cosA = Math.cos(a);
                const num = cosA * cosA;
                const den = 2 - 2 * cosA;
                let yat = num / den;
                if (yat > 5) yat = 5;
                const y = bottomY - (yat / 5) * graphH;
                if (a === 0.1) ctxPol.moveTo(x, y); else ctxPol.lineTo(x, y);
            }
            ctxPol.stroke();
            ctxPol.fillStyle = COLORS.primary;
            ctxPol.fillText("Yat (The Horseshoe)", graphX + 20, graphY + 10);

            // --- TRACKING DOTS ---
            const currX = graphX + (polAngle / Math.PI) * graphW;

            // Cosine Dot
            const curCos = Math.cos(polAngle);
            const curYCos = graphY + (1 - curCos) / 2 * graphH;
            ctxPol.beginPath();
            ctxPol.arc(currX, curYCos, 4, 0, Math.PI * 2);
            ctxPol.fillStyle = '#999';
            ctxPol.fill();

            // Yat Dot
            const den = 2 - 2 * Math.cos(polAngle);
            let curYat = den < 0.001 ? 5 : ((Math.cos(polAngle) ** 2) / den);
            if (curYat > 5) curYat = 5;
            const curYYat = bottomY - (curYat / 5) * graphH;

            ctxPol.beginPath();
            ctxPol.arc(currX, curYYat, 6, 0, Math.PI * 2);
            ctxPol.fillStyle = COLORS.primary;
            ctxPol.fill();
            ctxPol.strokeStyle = '#fff';
            ctxPol.stroke();

            // Value Display
            ctxPol.fillStyle = COLORS.light;
            ctxPol.font = '12px "Courier New", monospace';
            const yatDisplay = den < 0.001 ? "∞" : ((Math.cos(polAngle) ** 2) / den).toFixed(2);

            // Status text
            let status = "Mixed";
            if (isParallel) status = "Parallel (Linear)";
            else if (isAntiParallel) status = "Anti-Parallel (Linear)";
            else if (isOrthogonal) status = "Orthogonal (Non-Linear)";

            ctxPol.fillText(status, cx - 60, cy + r + 30);
            ctxPol.fillText(`Yat: ${yatDisplay}`, cx - 60, cy + r + 50);

        }

        canvasPolarity.addEventListener('mousedown', (e) => {
            const rect = canvasPolarity.getBoundingClientRect();
            const x = e.clientX - rect.left;
            if (x < rect.width * 0.6) draggingPol = true;
        });
        canvasPolarity.addEventListener('mousemove', (e) => {
            if (draggingPol) {
                const rect = canvasPolarity.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const w = rect.width;
                const h = rect.height;
                const cx = w * 0.3;
                const cy = h / 2;

                let angle = Math.atan2(-(y - cy), x - cx);
                if (angle < 0) angle = 0;
                if (angle > Math.PI) angle = Math.PI;
                if (x < cx && y > cy) angle = Math.PI;

                polAngle = angle;
                drawPolarity();
            }
        });
        window.addEventListener('mouseup', () => draggingPol = false);

        resizePolarity();
        drawPolarity();
        window.addEventListener('resize', () => { resizePolarity(); drawPolarity(); });
    }
}
