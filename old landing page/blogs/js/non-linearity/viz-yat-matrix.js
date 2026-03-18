import { COLORS } from './common.js';

export function initVizYatMatrix() {
    const canvasMatrix = document.getElementById('viz-yat-matrix');
    if (canvasMatrix) {
        const ctxM = canvasMatrix.getContext('2d');
        const numObs = 8;
        let observations = [];
        let yatMatrix = [];

        function resizeMatrix() {
            const rect = canvasMatrix.getBoundingClientRect();
            canvasMatrix.width = rect.width * window.devicePixelRatio;
            canvasMatrix.height = rect.height * window.devicePixelRatio;
            ctxM.scale(window.devicePixelRatio, window.devicePixelRatio);
        }

        function generateObservations() {
            observations = [];
            const dim = 5; // 5-dimensional observations

            for (let i = 0; i < numObs; i++) {
                const vec = [];
                for (let d = 0; d < dim; d++) {
                    vec.push(Math.random() * 10 - 5);
                }
                observations.push(vec);
            }

            // Compute Yat matrix
            yatMatrix = [];
            for (let i = 0; i < numObs; i++) {
                yatMatrix[i] = [];
                for (let j = 0; j < numObs; j++) {
                    yatMatrix[i][j] = computeYatVec(observations[i], observations[j]);
                }
            }
        }

        function computeYatVec(v1, v2) {
            // Yat = (v1·v2)² / ||v1-v2||²
            let dot = 0, distSq = 0;
            for (let d = 0; d < v1.length; d++) {
                dot += v1[d] * v2[d];
                distSq += (v1[d] - v2[d]) ** 2;
            }
            if (distSq < 0.01) return 100; // Same point
            return (dot * dot) / distSq;
        }

        function drawMatrix() {
            const w = canvasMatrix.getBoundingClientRect().width;
            const h = canvasMatrix.getBoundingClientRect().height;

            ctxM.clearRect(0, 0, w, h);

            // Matrix dimensions
            const matrixSize = Math.min(w - 140, h - 80);
            const cellSize = matrixSize / numObs;
            const matrixX = 80;
            const matrixY = 50;

            // Find max Yat for normalization (excluding diagonal)
            let maxYat = 0.1;
            for (let i = 0; i < numObs; i++) {
                for (let j = 0; j < numObs; j++) {
                    if (i !== j && yatMatrix[i][j] > maxYat) {
                        maxYat = yatMatrix[i][j];
                    }
                }
            }

            // Draw cells
            for (let i = 0; i < numObs; i++) {
                for (let j = 0; j < numObs; j++) {
                    const x = matrixX + j * cellSize;
                    const y = matrixY + i * cellSize;
                    const yat = yatMatrix[i][j];

                    // Normalize and compute color
                    const normalized = i === j ? 1 : Math.min(yat / maxYat, 1);

                    // Color: dark teal (low Yat) to bright pink (high Yat)
                    const hue = 175 - normalized * 140; // teal to pink
                    const light = 20 + normalized * 50;
                    const sat = 50 + normalized * 30;

                    ctxM.fillStyle = `hsl(${hue}, ${sat}%, ${light}%)`;
                    ctxM.fillRect(x, y, cellSize - 2, cellSize - 2);

                    // Value text (for larger cells)
                    if (cellSize > 35) {
                        ctxM.fillStyle = normalized > 0.5 ? '#000' : '#fff';
                        ctxM.font = '9px "Courier New", monospace';
                        const text = i === j ? '∞' : yat.toFixed(1);
                        ctxM.fillText(text, x + cellSize / 2 - 10, y + cellSize / 2 + 3);
                    }
                }
            }

            // Row and column labels
            ctxM.font = '11px "Courier New", monospace';
            for (let i = 0; i < numObs; i++) {
                // Row labels
                ctxM.fillStyle = COLORS.light;
                ctxM.fillText(`Obs ${i + 1}`, matrixX - 55, matrixY + i * cellSize + cellSize / 2 + 4);

                // Column labels
                ctxM.save();
                ctxM.translate(matrixX + i * cellSize + cellSize / 2, matrixY - 8);
                ctxM.rotate(-Math.PI / 4);
                ctxM.fillText(`Obs ${i + 1}`, 0, 0);
                ctxM.restore();
            }

            // Color legend
            const legendX = matrixX + matrixSize + 20;
            const legendY = matrixY;
            const legendH = matrixSize;
            const legendW = 20;

            for (let i = 0; i < legendH; i++) {
                const normalized = 1 - i / legendH;
                const hue = 175 - normalized * 140;
                const light = 20 + normalized * 50;
                ctxM.fillStyle = `hsl(${hue}, 70%, ${light}%)`;
                ctxM.fillRect(legendX, legendY + i, legendW, 2);
            }

            ctxM.strokeStyle = COLORS.dim;
            ctxM.strokeRect(legendX, legendY, legendW, legendH);

            ctxM.font = '9px "Courier New", monospace';
            ctxM.fillStyle = COLORS.light;
            ctxM.fillText('High Yat', legendX + legendW + 5, legendY + 10);
            ctxM.fillText('(Linear)', legendX + legendW + 5, legendY + 22);
            ctxM.fillText('Low Yat', legendX + legendW + 5, legendY + legendH - 12);
            ctxM.fillText('(Independent)', legendX + legendW + 5, legendY + legendH);

            // Title
            ctxM.fillStyle = COLORS.dim;
            ctxM.font = '10px "Courier New", monospace';
            ctxM.fillText('Click to regenerate random observations', w / 2 - 120, h - 10);
        }

        generateObservations();

        canvasMatrix.addEventListener('click', () => {
            generateObservations();
            drawMatrix();
        });

        resizeMatrix();
        drawMatrix();
        window.addEventListener('resize', () => { resizeMatrix(); drawMatrix(); });
    }
}
