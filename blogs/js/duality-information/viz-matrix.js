import { COLORS, randomVector, yat, clamp } from './common.js';

export function initVizMatrix() {
    const canvas = document.getElementById('viz-matrix');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let hoveredCell = null;
    let animationFrame;
    let time = 0;

    const hexToRgba = (hex, alpha) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

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

        const margin = 55;
        const bottomSpace = 50;
        const matrixSize = Math.min(w - margin * 2, h - margin - bottomSpace);
        const cellSize = matrixSize / numVectors;
        const startX = (w - matrixSize) / 2;
        const startY = margin;

        const maxYat = getMaxYat();

        // Draw cells with animation
        for (let i = 0; i < numVectors; i++) {
            for (let j = 0; j < numVectors; j++) {
                const x = startX + j * cellSize;
                const y = startY + i * cellSize;
                const val = yatMatrix[i][j];
                const isHovered = hoveredCell && hoveredCell.i === i && hoveredCell.j === j;

                let fillColor;
                if (!isFinite(val)) {
                    // Diagonal - self similarity with animated gradient
                    const diagGrad = ctx.createLinearGradient(x, y, x + cellSize, y + cellSize);
                    const shimmer = Math.sin(time * 2 + i * 0.3) * 0.1 + 0.9;
                    diagGrad.addColorStop(0, hexToRgba(COLORS.primary, shimmer));
                    diagGrad.addColorStop(1, hexToRgba(COLORS.wave, shimmer));
                    fillColor = diagGrad;
                } else {
                    // Color interpolation from dark to bright
                    const norm = clamp(val / maxYat, 0, 1);

                    // Multi-color gradient based on value
                    if (norm < 0.33) {
                        // Low: dark blue
                        const t = norm / 0.33;
                        const r = Math.floor(13 + t * 30);
                        const g = Math.floor(17 + t * 50);
                        const b = Math.floor(60 + t * 80);
                        fillColor = `rgb(${r}, ${g}, ${b})`;
                    } else if (norm < 0.66) {
                        // Medium: purple/magenta
                        const t = (norm - 0.33) / 0.33;
                        const r = Math.floor(43 + t * 150);
                        const g = Math.floor(67 + t * (-34));
                        const b = Math.floor(140 + t * (-16));
                        fillColor = `rgb(${r}, ${g}, ${b})`;
                    } else {
                        // High: bright accent
                        const t = (norm - 0.66) / 0.34;
                        const r = Math.floor(193 + t * 44);
                        const g = Math.floor(33 + t * 0);
                        const b = Math.floor(124 + t * 0);
                        fillColor = `rgb(${r}, ${g}, ${b})`;
                    }
                }

                ctx.fillStyle = fillColor;
                ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);

                // Highlight hovered cell
                if (isHovered) {
                    ctx.strokeStyle = COLORS.light;
                    ctx.lineWidth = 3;
                    ctx.strokeRect(x, y, cellSize, cellSize);

                    // Highlight row and column
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
                    ctx.fillRect(startX, y, matrixSize, cellSize);
                    ctx.fillRect(x, startY, cellSize, matrixSize);
                }
            }
        }

        // Row labels (left)
        ctx.font = 'bold 11px "Courier New", monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        for (let i = 0; i < numVectors; i++) {
            const isHighlighted = hoveredCell && hoveredCell.i === i;
            ctx.fillStyle = isHighlighted ? COLORS.accent : COLORS.light;
            ctx.fillText(labels[i], startX - 10, startY + i * cellSize + cellSize / 2);
        }

        // Column labels (top)
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        for (let j = 0; j < numVectors; j++) {
            const isHighlighted = hoveredCell && hoveredCell.j === j;
            ctx.fillStyle = isHighlighted ? COLORS.accent : COLORS.light;
            ctx.fillText(labels[j], startX + j * cellSize + cellSize / 2, startY - 8);
        }

        // Title
        ctx.fillStyle = COLORS.primary;
        ctx.font = 'bold 12px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('YAT SIMILARITY MATRIX', w / 2, 12);

        // Hover info panel
        if (hoveredCell) {
            const val = yatMatrix[hoveredCell.i][hoveredCell.j];
            const text = isFinite(val) ?
                `Yat(${labels[hoveredCell.i]}, ${labels[hoveredCell.j]}) = ${val.toFixed(3)}` :
                `Self-similarity = ∞`;

            const panelW = 220;
            const panelH = 32;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
            ctx.fillRect(w / 2 - panelW / 2, h - 42, panelW, panelH);
            ctx.strokeStyle = COLORS.accent;
            ctx.lineWidth = 2;
            ctx.strokeRect(w / 2 - panelW / 2, h - 42, panelW, panelH);
            ctx.fillStyle = COLORS.accent;
            ctx.font = 'bold 12px "Courier New", monospace';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, w / 2, h - 26);
        }

        // Color scale legend
        const legendY = startY + matrixSize + 18;
        const legendW = 180;
        const legendH = 14;
        const legendX = w / 2 - legendW / 2;

        // Multi-stop gradient for legend
        const grad = ctx.createLinearGradient(legendX, 0, legendX + legendW, 0);
        grad.addColorStop(0, 'rgb(13, 17, 60)');
        grad.addColorStop(0.33, 'rgb(73, 47, 140)');
        grad.addColorStop(0.66, 'rgb(193, 33, 124)');
        grad.addColorStop(1, COLORS.accent);
        ctx.fillStyle = grad;
        ctx.fillRect(legendX, legendY, legendW, legendH);
        ctx.strokeStyle = COLORS.dim;
        ctx.lineWidth = 1;
        ctx.strokeRect(legendX, legendY, legendW, legendH);

        ctx.font = '9px "Courier New", monospace';
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
        ctx.fillStyle = COLORS.dim;
        ctx.fillText('Low (orthogonal)', legendX, legendY + legendH + 4);
        ctx.textAlign = 'right';
        ctx.fillText('High (linear)', legendX + legendW, legendY + legendH + 4);

        // Instructions
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(w - 150, 15, 135, 25);
        ctx.font = '9px "Courier New", monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = COLORS.dim;
        ctx.fillText('Click for new vectors', w - 20, 28);

        time += 0.02;
        animationFrame = requestAnimationFrame(draw);
    }

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const w = rect.width;
        const h = rect.height;
        const margin = 55;
        const bottomSpace = 50;
        const matrixSize = Math.min(w - margin * 2, h - margin - bottomSpace);
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
    });

    canvas.addEventListener('click', () => {
        initVectors();
    });

    canvas.addEventListener('mouseleave', () => {
        hoveredCell = null;
    });

    resize();
    initVectors();
    draw();
    window.addEventListener('resize', () => { resize(); });
}
