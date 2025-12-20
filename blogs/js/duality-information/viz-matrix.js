import { COLORS, randomVector, yat, clamp, normalize } from './common.js';

export function initVizMatrix() {
    const canvas = document.getElementById('viz-matrix');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let hoveredCell = null;
    let hoveredButton = null;
    let animationFrame;
    let time = 0;

    const hexToRgba = (hex, alpha) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    // Preset configurations
    const presets = [
        {
            label: 'Random',
            icon: '🎲',
            generate: () => {
                const vecs = [];
                for (let i = 0; i < 8; i++) {
                    vecs.push(randomVector(16, 1.5));
                }
                return vecs;
            }
        },
        {
            label: 'Clusters',
            icon: '◉',
            generate: () => {
                // 2 clusters of 4 similar vectors each
                const base1 = randomVector(16, 1);
                const base2 = randomVector(16, 1);
                const vecs = [];
                for (let i = 0; i < 4; i++) {
                    vecs.push(base1.map(v => v + (Math.random() - 0.5) * 0.4));
                }
                for (let i = 0; i < 4; i++) {
                    vecs.push(base2.map(v => v + (Math.random() - 0.5) * 0.4));
                }
                return vecs;
            }
        },
        {
            label: 'Gradient',
            icon: '→',
            generate: () => {
                // Vectors that gradually change
                const start = randomVector(16, 1);
                const end = randomVector(16, 1);
                const vecs = [];
                for (let i = 0; i < 8; i++) {
                    const t = i / 7;
                    vecs.push(start.map((v, j) => v * (1 - t) + end[j] * t));
                }
                return vecs;
            }
        },
        {
            label: 'Orthogonal',
            icon: '⟂',
            generate: () => {
                // Try to make vectors mostly orthogonal
                const vecs = [];
                for (let i = 0; i < 8; i++) {
                    const v = new Array(16).fill(0);
                    v[i % 16] = 1 + Math.random() * 0.5;
                    v[(i + 8) % 16] = Math.random() * 0.3;
                    vecs.push(v);
                }
                return vecs;
            }
        }
    ];

    // Button layout
    const btnW = 80;
    const btnH = 28;
    const btnGap = 8;

    // Vectors and matrix
    const numVectors = 8;
    let vectors = [];
    let labels = [];
    let yatMatrix = [];

    function initVectors(preset = null) {
        vectors = preset ? preset : presets[0].generate();
        labels = [];
        for (let i = 0; i < vectors.length; i++) {
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
        return Math.max(max, 0.1);
    }

    function resize() {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function getLayout() {
        const rect = canvas.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;

        // Reserve space: left for labels, top for labels+title, bottom for buttons+legend, right for info
        const topMargin = 45;
        const leftMargin = 35;
        const rightMargin = 20;
        const bottomMargin = 85;

        const availW = w - leftMargin - rightMargin;
        const availH = h - topMargin - bottomMargin;
        const matrixSize = Math.min(availW, availH);
        const cellSize = matrixSize / numVectors;

        const startX = leftMargin + (availW - matrixSize) / 2;
        const startY = topMargin;

        return { w, h, matrixSize, cellSize, startX, startY, topMargin, bottomMargin };
    }

    function getButtonBounds(index) {
        const { w, h } = getLayout();
        const totalW = presets.length * btnW + (presets.length - 1) * btnGap;
        const startX = (w - totalW) / 2;
        return {
            x: startX + index * (btnW + btnGap),
            y: h - 35,
            w: btnW,
            h: btnH
        };
    }

    function getYatColor(val, maxYat) {
        const norm = clamp(val / maxYat, 0, 1);

        // Smooth gradient: dark blue → purple → magenta → pink
        const r = Math.floor(20 + norm * 217);
        const g = Math.floor(25 + norm * 8);
        const b = Math.floor(80 + norm * 44);
        return `rgb(${r}, ${g}, ${b})`;
    }

    function draw() {
        const { w, h, matrixSize, cellSize, startX, startY, bottomMargin } = getLayout();

        ctx.clearRect(0, 0, w, h);

        if (vectors.length === 0) initVectors();

        const maxYat = getMaxYat();

        // Subtle background grid
        ctx.strokeStyle = 'rgba(27, 153, 139, 0.04)';
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 30) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = 0; y < h; y += 30) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        // Draw matrix cells
        for (let i = 0; i < numVectors; i++) {
            for (let j = 0; j < numVectors; j++) {
                const x = startX + j * cellSize;
                const y = startY + i * cellSize;
                const val = yatMatrix[i][j];
                const isHovered = hoveredCell && hoveredCell.i === i && hoveredCell.j === j;
                const isRowOrCol = hoveredCell && (hoveredCell.i === i || hoveredCell.j === j);

                // Cell color
                let fillColor;
                if (!isFinite(val)) {
                    // Diagonal - animated shimmer
                    const diagGrad = ctx.createLinearGradient(x, y, x + cellSize, y + cellSize);
                    const shimmer = Math.sin(time * 2.5 + i * 0.4) * 0.15 + 0.85;
                    diagGrad.addColorStop(0, hexToRgba(COLORS.primary, shimmer));
                    diagGrad.addColorStop(1, hexToRgba(COLORS.wave, shimmer));
                    fillColor = diagGrad;
                } else {
                    fillColor = getYatColor(val, maxYat);
                }

                // Row/column highlight
                if (isRowOrCol && !isHovered) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
                    ctx.fillRect(x, y, cellSize, cellSize);
                }

                ctx.fillStyle = fillColor;
                ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);

                // Hover highlight
                if (isHovered) {
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2.5;
                    ctx.strokeRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
                }
            }
        }

        // Matrix border
        ctx.strokeStyle = hexToRgba(COLORS.primary, 0.3);
        ctx.lineWidth = 1;
        ctx.strokeRect(startX, startY, matrixSize, matrixSize);

        // Row labels (left)
        ctx.font = 'bold 11px "Courier New", monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        for (let i = 0; i < numVectors; i++) {
            const isHighlighted = hoveredCell && hoveredCell.i === i;
            ctx.fillStyle = isHighlighted ? COLORS.accent : 'rgba(255,255,255,0.7)';
            ctx.fillText(labels[i], startX - 8, startY + i * cellSize + cellSize / 2);
        }

        // Column labels (top)
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        for (let j = 0; j < numVectors; j++) {
            const isHighlighted = hoveredCell && hoveredCell.j === j;
            ctx.fillStyle = isHighlighted ? COLORS.accent : 'rgba(255,255,255,0.7)';
            ctx.fillText(labels[j], startX + j * cellSize + cellSize / 2, startY - 6);
        }

        // Title
        ctx.fillStyle = COLORS.light;
        ctx.font = 'bold 12px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('YAT SIMILARITY MATRIX', w / 2, 10);

        // Color scale legend (below matrix)
        const legendY = startY + matrixSize + 12;
        const legendW = Math.min(matrixSize, 180);
        const legendH = 10;
        const legendX = startX + (matrixSize - legendW) / 2;

        const grad = ctx.createLinearGradient(legendX, 0, legendX + legendW, 0);
        grad.addColorStop(0, getYatColor(0, 1));
        grad.addColorStop(0.5, getYatColor(0.5, 1));
        grad.addColorStop(1, getYatColor(1, 1));
        ctx.fillStyle = grad;
        ctx.fillRect(legendX, legendY, legendW, legendH);
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(legendX, legendY, legendW, legendH);

        ctx.font = '9px "Courier New", monospace';
        ctx.textBaseline = 'top';
        ctx.fillStyle = COLORS.dim;
        ctx.textAlign = 'left';
        ctx.fillText('Orthogonal', legendX, legendY + legendH + 4);
        ctx.textAlign = 'right';
        ctx.fillText('Linear', legendX + legendW, legendY + legendH + 4);

        // Hover info panel
        if (hoveredCell) {
            const val = yatMatrix[hoveredCell.i][hoveredCell.j];

            const panelW = 180;
            const panelH = 50;
            const panelX = w / 2 - panelW / 2;
            const panelY = legendY + 28;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
            ctx.beginPath();
            ctx.roundRect(panelX, panelY, panelW, panelH, 5);
            ctx.fill();

            ctx.strokeStyle = COLORS.accent;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(panelX, panelY, panelW, panelH, 5);
            ctx.stroke();

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            if (isFinite(val)) {
                ctx.font = '10px "Courier New", monospace';
                ctx.fillStyle = COLORS.dim;
                ctx.fillText(`Yat(${labels[hoveredCell.i]}, ${labels[hoveredCell.j]})`, panelX + panelW / 2, panelY + 15);

                ctx.font = 'bold 18px "Courier New", monospace';
                ctx.fillStyle = COLORS.accent;
                ctx.fillText(val.toFixed(3), panelX + panelW / 2, panelY + 35);
            } else {
                ctx.font = 'bold 12px "Courier New", monospace';
                ctx.fillStyle = COLORS.primary;
                ctx.fillText(`${labels[hoveredCell.i]} = ${labels[hoveredCell.j]}`, panelX + panelW / 2, panelY + 18);
                ctx.font = '10px "Courier New", monospace';
                ctx.fillStyle = COLORS.dim;
                ctx.fillText('Self-similarity = ∞', panelX + panelW / 2, panelY + 36);
            }
        }

        // Preset buttons
        for (let i = 0; i < presets.length; i++) {
            const b = getButtonBounds(i);
            const isHovered = hoveredButton === i;

            ctx.fillStyle = isHovered ? 'rgba(27, 153, 139, 0.25)' : 'rgba(0, 0, 0, 0.75)';
            ctx.beginPath();
            ctx.roundRect(b.x, b.y, b.w, b.h, 4);
            ctx.fill();

            ctx.strokeStyle = isHovered ? COLORS.primary : 'rgba(255,255,255,0.2)';
            ctx.lineWidth = isHovered ? 2 : 1;
            ctx.beginPath();
            ctx.roundRect(b.x, b.y, b.w, b.h, 4);
            ctx.stroke();

            ctx.font = '10px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = isHovered ? COLORS.light : 'rgba(255,255,255,0.6)';
            ctx.fillText(`${presets[i].icon} ${presets[i].label}`, b.x + b.w / 2, b.y + b.h / 2);
        }

        time += 0.02;
        animationFrame = requestAnimationFrame(draw);
    }

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const { cellSize, startX, startY } = getLayout();

        // Check buttons first
        hoveredButton = null;
        for (let i = 0; i < presets.length; i++) {
            const b = getButtonBounds(i);
            if (mouseX >= b.x && mouseX <= b.x + b.w && mouseY >= b.y && mouseY <= b.y + b.h) {
                hoveredButton = i;
                canvas.style.cursor = 'pointer';
                hoveredCell = null;
                return;
            }
        }

        // Check matrix cells
        const j = Math.floor((mouseX - startX) / cellSize);
        const i = Math.floor((mouseY - startY) / cellSize);

        if (i >= 0 && i < numVectors && j >= 0 && j < numVectors) {
            hoveredCell = { i, j };
            canvas.style.cursor = 'pointer';
        } else {
            hoveredCell = null;
            canvas.style.cursor = 'default';
        }
    });

    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Check buttons
        for (let i = 0; i < presets.length; i++) {
            const b = getButtonBounds(i);
            if (mouseX >= b.x && mouseX <= b.x + b.w && mouseY >= b.y && mouseY <= b.y + b.h) {
                initVectors(presets[i].generate());
                return;
            }
        }
    });

    canvas.addEventListener('mouseleave', () => {
        hoveredCell = null;
        hoveredButton = null;
        canvas.style.cursor = 'default';
    });

    resize();
    initVectors();
    draw();
    window.addEventListener('resize', resize);
}
