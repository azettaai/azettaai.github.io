import { COLORS } from './common.js';

export function initVizDimensions() {
    const canvasDim = document.getElementById('viz-dimensions');
    if (canvasDim) {
        const ctxD = canvasDim.getContext('2d');
        let currentDim = 2;
        let angleData = [];
        let animating = false;

        function resizeDim() {
            const rect = canvasDim.getBoundingClientRect();
            canvasDim.width = rect.width * window.devicePixelRatio;
            canvasDim.height = rect.height * window.devicePixelRatio;
            ctxD.scale(window.devicePixelRatio, window.devicePixelRatio);
        }

        function generateAngleData(dim) {
            // Generate many pairs of random vectors and compute angles
            const angles = [];
            const numSamples = 500;

            for (let i = 0; i < numSamples; i++) {
                // Generate two random unit vectors in n dimensions
                let v1 = [], v2 = [];
                let mag1 = 0, mag2 = 0;

                for (let d = 0; d < dim; d++) {
                    const a = Math.random() * 2 - 1;
                    const b = Math.random() * 2 - 1;
                    v1.push(a);
                    v2.push(b);
                    mag1 += a * a;
                    mag2 += b * b;
                }

                // Normalize
                mag1 = Math.sqrt(mag1);
                mag2 = Math.sqrt(mag2);
                for (let d = 0; d < dim; d++) {
                    v1[d] /= mag1;
                    v2[d] /= mag2;
                }

                // Compute dot product (cosine of angle)
                let dot = 0;
                for (let d = 0; d < dim; d++) {
                    dot += v1[d] * v2[d];
                }

                // Clamp and convert to angle in degrees
                dot = Math.max(-1, Math.min(1, dot));
                const angle = Math.acos(dot) * 180 / Math.PI;
                angles.push(angle);
            }

            return angles;
        }

        function drawDimensions() {
            const w = canvasDim.getBoundingClientRect().width;
            const h = canvasDim.getBoundingClientRect().height;

            ctxD.clearRect(0, 0, w, h);

            // Histogram area
            const histX = 60, histY = 40;
            const histW = w - 120, histH = h - 120;

            // Axes
            ctxD.strokeStyle = COLORS.dim;
            ctxD.lineWidth = 2;
            ctxD.beginPath();
            ctxD.moveTo(histX, histY + histH);
            ctxD.lineTo(histX + histW, histY + histH);
            ctxD.moveTo(histX, histY + histH);
            ctxD.lineTo(histX, histY);
            ctxD.stroke();

            // Axis labels
            ctxD.fillStyle = COLORS.dim;
            ctxD.font = '11px "Courier New", monospace';
            ctxD.fillText('Angle (degrees)', histX + histW / 2 - 50, h - 20);
            ctxD.save();
            ctxD.translate(20, histY + histH / 2);
            ctxD.rotate(-Math.PI / 2);
            ctxD.fillText('Frequency', 0, 0);
            ctxD.restore();

            // X axis ticks
            ctxD.font = '9px "Courier New", monospace';
            for (let angle = 0; angle <= 180; angle += 30) {
                const x = histX + (angle / 180) * histW;
                ctxD.fillStyle = angle === 90 ? COLORS.accent : COLORS.dim;
                ctxD.fillText(angle + '°', x - 10, histY + histH + 18);

                if (angle === 90) {
                    // Highlight 90 degrees
                    ctxD.strokeStyle = 'rgba(237, 33, 124, 0.3)';
                    ctxD.lineWidth = 1;
                    ctxD.setLineDash([3, 3]);
                    ctxD.beginPath();
                    ctxD.moveTo(x, histY);
                    ctxD.lineTo(x, histY + histH);
                    ctxD.stroke();
                    ctxD.setLineDash([]);
                }
            }

            // Compute histogram
            const numBins = 36;
            const bins = new Array(numBins).fill(0);
            angleData.forEach(angle => {
                const bin = Math.min(numBins - 1, Math.floor(angle / 180 * numBins));
                bins[bin]++;
            });
            const maxBin = Math.max(...bins, 1);

            // Draw histogram bars
            const binWidth = histW / numBins;
            bins.forEach((count, i) => {
                const barH = (count / maxBin) * histH * 0.9;
                const x = histX + i * binWidth;
                const y = histY + histH - barH;

                // Color based on proximity to 90 degrees
                const binCenter = (i + 0.5) * 180 / numBins;
                const dist90 = Math.abs(binCenter - 90);
                const hue = dist90 < 20 ? 340 : 175 - (dist90 / 90) * 30;
                const light = 40 + (1 - dist90 / 90) * 20;

                ctxD.fillStyle = `hsl(${hue}, 60%, ${light}%)`;
                ctxD.fillRect(x + 1, y, binWidth - 2, barH);
            });

            // Mean angle
            const meanAngle = angleData.reduce((a, b) => a + b, 0) / angleData.length || 90;
            const meanX = histX + (meanAngle / 180) * histW;
            ctxD.strokeStyle = '#fff';
            ctxD.lineWidth = 2;
            ctxD.beginPath();
            ctxD.moveTo(meanX, histY);
            ctxD.lineTo(meanX, histY + histH);
            ctxD.stroke();

            // Info panel
            ctxD.fillStyle = 'rgba(0,0,0,0.85)';
            ctxD.fillRect(w - 185, 15, 170, 85);
            ctxD.strokeStyle = currentDim > 10 ? COLORS.primary : COLORS.accent;
            ctxD.lineWidth = 2;
            ctxD.strokeRect(w - 185, 15, 170, 85);

            ctxD.font = 'bold 14px "Courier New", monospace';
            ctxD.fillStyle = currentDim > 10 ? COLORS.primary : COLORS.accent;
            ctxD.fillText(`Dimensions: ${currentDim}D`, w - 175, 38);

            ctxD.font = '11px "Courier New", monospace';
            ctxD.fillStyle = COLORS.light;
            ctxD.fillText(`Mean angle: ${meanAngle.toFixed(1)}°`, w - 175, 58);

            const stdDev = Math.sqrt(angleData.reduce((sum, a) => sum + (a - meanAngle) ** 2, 0) / angleData.length) || 0;
            ctxD.fillText(`Std dev: ${stdDev.toFixed(1)}°`, w - 175, 75);

            const orthPct = (angleData.filter(a => a > 80 && a < 100).length / angleData.length * 100) || 0;
            ctxD.fillStyle = orthPct > 50 ? COLORS.primary : '#ffcc66';
            ctxD.fillText(`Near 90°: ${orthPct.toFixed(0)}%`, w - 175, 92);

            // Click instruction
            ctxD.fillStyle = COLORS.dim;
            ctxD.font = '10px "Courier New", monospace';
            ctxD.fillText(`Click to add dimensions (current: ${currentDim}D)`, w / 2 - 100, h - 5);
        }

        // Initialize
        angleData = generateAngleData(currentDim);

        canvasDim.addEventListener('click', () => {
            if (animating) return;
            currentDim = currentDim >= 100 ? 2 : (currentDim < 10 ? currentDim + 1 : currentDim + 10);
            angleData = generateAngleData(currentDim);
            drawDimensions();
        });

        resizeDim();
        drawDimensions();
        window.addEventListener('resize', () => { resizeDim(); drawDimensions(); });
    }
}
