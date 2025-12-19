import { COLORS, randomVector, yat, clamp } from './common.js';

export function initVizMatrix() {
    const canvas = document.getElementById('viz-matrix');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let hoveredCell = null;
    let sorted = false;

    // Generate vectors
    const numVectors = 10;
    let vectors = [];
    let labels = [];
    let yatMatrix = [];

    function initVectors() {
        vectors = [];
        labels = [];
        for (let i = 0; i < numVectors; i++) {
            vectors.push(randomVector(20, 1.5));
            labels.push(String.fromCharCode(65 + i));
        }
        calculateMatrix();
    }

    function calculateMatrix() {
        yatMatrix = [];
        for (let i = 0; i < vectors.length; i++) {
            const row = [];
            for (let j = 0; j < vectors.length; j++) {
                if (i === j) {
                    row.push(Infinity);
                } else {
                    row.push(yat(vectors[i], vectors[j]));
                }
            }
            yatMatrix.push(row);
        }
    }

    function getMaxYat() {
        let max = 0;
        for (let i = 0; i < yatMatrix.length; i++) {
            for (let j = 0; j < yatMatrix[i].length; j++) {
                if (isFinite(yatMatrix[i][j]) && yatMatrix[i][j] > max) {
                    max = yatMatrix[i][j];
                }
            }
        }
        return max;
    }

    function resize() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    function draw() {
        const w = canvas.getBoundingClientRect().width;
        const h = canvas.getBoundingClientRect().height;

        ctx.clearRect(0, 0, w, h);

        if (vectors.length === 0) initVectors();

        const margin = 50;
        const matrixSize = Math.min(w - margin * 2, h - margin * 2 - 40);
        const cellSize = matrixSize / numVectors;
        const startX = (w - matrixSize) / 2;
        const startY = margin;

        const maxYat = getMaxYat();

        // Draw cells
        for (let i = 0; i < numVectors; i++) {
            for (let j = 0; j < numVectors; j++) {
                const x = startX + j * cellSize;
                const y = startY + i * cellSize;
                const val = yatMatrix[i][j];

                let color;
                if (!isFinite(val)) {
                    // Diagonal - self similarity (white)
                    color = COLORS.light;
                } else {
                    // Color interpolation from dark to bright
                    const norm = clamp(val / maxYat, 0, 1);
                    const r = Math.floor(13 + norm * (237 - 13));
                    const g = Math.floor(17 + norm * (33 - 17));
                    const b = Math.floor(21 + norm * (124 - 21));
                    color = `rgb(${r}, ${g}, ${b})`;
                }

                ctx.fillStyle = color;
                ctx.fillRect(x, y, cellSize - 1, cellSize - 1);

                // Highlight hovered cell
                if (hoveredCell && hoveredCell.i === i && hoveredCell.j === j) {
                    ctx.strokeStyle = COLORS.light;
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x, y, cellSize - 1, cellSize - 1);
                }
            }
        }

        // Row labels (left)
        ctx.font = '11px "Courier New", monospace';
        ctx.textAlign = 'right';
        ctx.fillStyle = COLORS.light;
        for (let i = 0; i < numVectors; i++) {
            ctx.fillText(labels[i], startX - 8, startY + i * cellSize + cellSize / 2 + 4);
        }

        // Column labels (top)
        ctx.textAlign = 'center';
        for (let j = 0; j < numVectors; j++) {
            ctx.fillText(labels[j], startX + j * cellSize + cellSize / 2, startY - 8);
        }

        // Title
        ctx.fillStyle = COLORS.primary;
        ctx.font = '12px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('YAT SIMILARITY MATRIX', w / 2, 20);

        // Hover info
        if (hoveredCell) {
            const val = yatMatrix[hoveredCell.i][hoveredCell.j];
            const text = isFinite(val) ?
                `Yat(${labels[hoveredCell.i]}, ${labels[hoveredCell.j]}) = ${val.toFixed(3)}` :
                `Self-similarity (∞)`;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
            ctx.fillRect(w / 2 - 100, h - 35, 200, 25);
            ctx.strokeStyle = COLORS.accent;
            ctx.lineWidth = 1;
            ctx.strokeRect(w / 2 - 100, h - 35, 200, 25);
            ctx.fillStyle = COLORS.accent;
            ctx.font = '11px "Courier New", monospace';
            ctx.fillText(text, w / 2, h - 18);
        }

        // Color scale legend
        const legendY = startY + matrixSize + 15;
        const legendW = 150;
        const legendH = 12;
        const legendX = w / 2 - legendW / 2;

        const grad = ctx.createLinearGradient(legendX, 0, legendX + legendW, 0);
        grad.addColorStop(0, 'rgb(13, 17, 21)');
        grad.addColorStop(1, COLORS.accent);
        ctx.fillStyle = grad;
        ctx.fillRect(legendX, legendY, legendW, legendH);

        ctx.font = '9px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = COLORS.dim;
        ctx.fillText('Low', legendX, legendY + legendH + 12);
        ctx.textAlign = 'right';
        ctx.fillText('High', legendX + legendW, legendY + legendH + 12);
    }

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const w = rect.width;
        const h = rect.height;
        const margin = 50;
        const matrixSize = Math.min(w - margin * 2, h - margin * 2 - 40);
        const cellSize = matrixSize / numVectors;
        const startX = (w - matrixSize) / 2;
        const startY = margin;

        const j = Math.floor((x - startX) / cellSize);
        const i = Math.floor((y - startY) / cellSize);

        if (i >= 0 && i < numVectors && j >= 0 && j < numVectors) {
            hoveredCell = { i, j };
            canvas.style.cursor = 'pointer';
        } else {
            hoveredCell = null;
            canvas.style.cursor = 'crosshair';
        }

        draw();
    });

    canvas.addEventListener('click', () => {
        initVectors();
        draw();
    });

    canvas.addEventListener('mouseleave', () => {
        hoveredCell = null;
        draw();
    });

    resize();
    initVectors();
    draw();
    window.addEventListener('resize', () => { resize(); draw(); });
}
