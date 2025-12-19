import { COLORS } from './common.js';

export function initVizEntropy() {
    const canvasEntropy = document.getElementById('viz-entropy');
    if (canvasEntropy) {
        const ctxE = canvasEntropy.getContext('2d');
        let overlap = 0.7; // 0 = orthogonal (no overlap), 1 = fully overlapping - start at 0.7 to show overlap
        let isDragging = false;

        function resizeEntropy() {
            const rect = canvasEntropy.getBoundingClientRect();
            canvasEntropy.width = rect.width * window.devicePixelRatio;
            canvasEntropy.height = rect.height * window.devicePixelRatio;
            ctxE.scale(window.devicePixelRatio, window.devicePixelRatio);
        }

        function gaussian(x, mean, sigma) {
            return Math.exp(-0.5 * Math.pow((x - mean) / sigma, 2)) / (sigma * Math.sqrt(2 * Math.PI));
        }

        function drawEntropy() {
            const w = canvasEntropy.getBoundingClientRect().width;
            const h = canvasEntropy.getBoundingClientRect().height;

            ctxE.clearRect(0, 0, w, h);

            // Background grid
            ctxE.strokeStyle = COLORS.grid;
            ctxE.lineWidth = 1;
            for (let x = 0; x < w; x += 40) {
                ctxE.beginPath();
                ctxE.moveTo(x, 0);
                ctxE.lineTo(x, h);
                ctxE.stroke();
            }

            // Distribution parameters - wider sigma for better visibility
            const sigma = 50;
            // At overlap=1: means are at center, fully overlapping
            // At overlap=0: means are far apart, no overlap
            const centerX = w / 2;
            const maxSeparation = 180; // Max distance between means when overlap=0
            const separation = (1 - overlap) * maxSeparation;
            const mean1 = centerX - separation / 2;
            const mean2 = centerX + separation / 2;

            // Draw distributions
            const graphH = h * 0.5;
            const graphY = h * 0.15;

            // Distribution P (pink)
            ctxE.beginPath();
            ctxE.fillStyle = 'rgba(237, 33, 124, 0.4)';
            ctxE.moveTo(0, graphY + graphH);
            for (let x = 0; x <= w; x += 2) {
                const y = gaussian(x, mean1, sigma) * 3000;
                ctxE.lineTo(x, graphY + graphH - Math.min(y, graphH));
            }
            ctxE.lineTo(w, graphY + graphH);
            ctxE.closePath();
            ctxE.fill();

            // Distribution Q (teal)
            ctxE.beginPath();
            ctxE.fillStyle = 'rgba(27, 153, 139, 0.4)';
            ctxE.moveTo(0, graphY + graphH);
            for (let x = 0; x <= w; x += 2) {
                const y = gaussian(x, mean2, sigma) * 3000;
                ctxE.lineTo(x, graphY + graphH - Math.min(y, graphH));
            }
            ctxE.lineTo(w, graphY + graphH);
            ctxE.closePath();
            ctxE.fill();

            // Overlap region (purple)
            ctxE.beginPath();
            ctxE.fillStyle = 'rgba(155, 89, 182, 0.6)';
            ctxE.moveTo(0, graphY + graphH);
            for (let x = 0; x <= w; x += 2) {
                const y1 = gaussian(x, mean1, sigma) * 3000;
                const y2 = gaussian(x, mean2, sigma) * 3000;
                const minY = Math.min(y1, y2);
                ctxE.lineTo(x, graphY + graphH - Math.min(minY, graphH));
            }
            ctxE.lineTo(w, graphY + graphH);
            ctxE.closePath();
            ctxE.fill();

            // Labels
            ctxE.font = 'bold 12px "Courier New", monospace';
            ctxE.fillStyle = COLORS.accent;
            ctxE.fillText('P(x)', mean1 - 15, graphY - 5);
            ctxE.fillStyle = COLORS.primary;
            ctxE.fillText('Q(x)', mean2 - 15, graphY - 5);

            // Slider track
            const sliderY = h * 0.78;
            const sliderW = w - 100;
            const sliderX = 50;

            ctxE.fillStyle = 'rgba(100,100,100,0.3)';
            ctxE.fillRect(sliderX, sliderY - 3, sliderW, 6);

            // Slider handle
            const handleX = sliderX + overlap * sliderW;
            ctxE.beginPath();
            ctxE.arc(handleX, sliderY, 12, 0, Math.PI * 2);
            ctxE.fillStyle = overlap < 0.1 ? COLORS.primary : COLORS.accent;
            ctxE.fill();
            ctxE.strokeStyle = '#fff';
            ctxE.lineWidth = 2;
            ctxE.stroke();

            // Slider labels
            ctxE.font = '10px "Courier New", monospace';
            ctxE.fillStyle = COLORS.dim;
            ctxE.fillText('ORTHOGONAL', sliderX - 10, sliderY + 25);
            ctxE.fillText('OVERLAPPING', sliderX + sliderW - 50, sliderY + 25);

            // Info panel
            const mutualInfo = overlap * 2.5; // Approximate
            const isOrthogonal = overlap < 0.1;

            ctxE.fillStyle = 'rgba(0,0,0,0.8)';
            ctxE.fillRect(15, 15, 200, 70);
            ctxE.strokeStyle = isOrthogonal ? COLORS.primary : COLORS.accent;
            ctxE.lineWidth = 2;
            ctxE.strokeRect(15, 15, 200, 70);

            ctxE.font = '11px "Courier New", monospace';
            ctxE.fillStyle = COLORS.light;
            ctxE.fillText(`∫ P(x)Q(x)dx ≈ ${(overlap * 0.1).toFixed(3)}`, 25, 35);
            ctxE.fillText(`Mutual Info: ${mutualInfo.toFixed(2)} bits`, 25, 55);

            ctxE.fillStyle = isOrthogonal ? COLORS.primary : '#ffcc66';
            ctxE.font = 'bold 11px "Courier New", monospace';
            ctxE.fillText(isOrthogonal ? 'INDEPENDENT (Orthogonal)' : 'DEPENDENT', 25, 75);
        }

        canvasEntropy.addEventListener('mousedown', (e) => {
            isDragging = true;
            updateOverlap(e);
        });

        canvasEntropy.addEventListener('mousemove', (e) => {
            if (isDragging) updateOverlap(e);
        });

        canvasEntropy.addEventListener('mouseup', () => isDragging = false);
        canvasEntropy.addEventListener('mouseleave', () => isDragging = false);

        function updateOverlap(e) {
            const rect = canvasEntropy.getBoundingClientRect();
            const w = rect.width;
            const sliderX = 50;
            const sliderW = w - 100;
            const x = e.clientX - rect.left;
            overlap = Math.max(0, Math.min(1, (x - sliderX) / sliderW));
            drawEntropy();
        }

        resizeEntropy();
        drawEntropy();
        window.addEventListener('resize', () => { resizeEntropy(); drawEntropy(); });
    }
}
