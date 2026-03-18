import { COLORS, randomVector, yat, clamp, normalize, dot, euclideanDist } from './common.js';

export function initVizMatrix() {
    const canvas = document.getElementById('viz-matrix');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let hoveredCell = null;
    let hoveredButton = null;
    let hoveredNode = null;
    let draggedNode = null;
    let animationFrame;
    let time = 0;
    let currentView = 'matrix'; // 'matrix', 'network', 'bars'

    const hexToRgba = (hex, alpha) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    // View modes
    const views = [
        { id: 'matrix', label: 'Matrix', icon: '▦' },
        { id: 'network', label: 'Network', icon: '◎' },
        { id: 'bars', label: 'Bars', icon: '▥' }
    ];

    // Presets
    const presets = [
        {
            label: 'Random',
            generate: () => {
                const vecs = [];
                for (let i = 0; i < 8; i++) vecs.push(randomVector(16, 1.5));
                return vecs;
            }
        },
        {
            label: 'Clusters',
            generate: () => {
                const base1 = randomVector(16, 1);
                const base2 = randomVector(16, 1);
                const vecs = [];
                for (let i = 0; i < 4; i++) vecs.push(base1.map(v => v + (Math.random() - 0.5) * 0.3));
                for (let i = 0; i < 4; i++) vecs.push(base2.map(v => v + (Math.random() - 0.5) * 0.3));
                return vecs;
            }
        },
        {
            label: 'Gradient',
            generate: () => {
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
            generate: () => {
                const vecs = [];
                for (let i = 0; i < 8; i++) {
                    const v = new Array(16).fill(0);
                    v[i % 16] = 1 + Math.random() * 0.5;
                    v[(i + 8) % 16] = Math.random() * 0.2;
                    vecs.push(v);
                }
                return vecs;
            }
        }
    ];

    // Data
    const numVectors = 8;
    let vectors = [];
    let labels = [];
    let yatMatrix = [];
    let nodePositions = [];

    // Stats
    let stats = { maxYat: 0, minYat: Infinity, avgYat: 0 };

    function initVectors(preset = null) {
        vectors = preset ? preset : presets[0].generate();
        labels = [];
        for (let i = 0; i < vectors.length; i++) {
            labels.push(String.fromCharCode(65 + i));
        }
        calculateMatrix();
        initNodePositions();
    }

    function initNodePositions() {
        const rect = canvas.getBoundingClientRect();
        const centerX = rect.width * 0.35;
        const centerY = rect.height * 0.5;
        const radius = Math.min(rect.width, rect.height) * 0.25;

        nodePositions = [];
        for (let i = 0; i < numVectors; i++) {
            const angle = (i / numVectors) * Math.PI * 2 - Math.PI / 2;
            nodePositions.push({
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius,
                targetX: centerX + Math.cos(angle) * radius,
                targetY: centerY + Math.sin(angle) * radius
            });
        }
    }

    function calculateMatrix() {
        yatMatrix = [];
        let sum = 0, count = 0;
        stats.maxYat = 0;
        stats.minYat = Infinity;

        for (let i = 0; i < vectors.length; i++) {
            const row = [];
            for (let j = 0; j < vectors.length; j++) {
                if (i === j) {
                    row.push(Infinity);
                } else {
                    const val = yat(vectors[i], vectors[j]);
                    row.push(val);
                    if (isFinite(val)) {
                        sum += val;
                        count++;
                        stats.maxYat = Math.max(stats.maxYat, val);
                        stats.minYat = Math.min(stats.minYat, val);
                    }
                }
            }
            yatMatrix.push(row);
        }
        stats.avgYat = count > 0 ? sum / count : 0;
        if (!isFinite(stats.minYat)) stats.minYat = 0;
    }

    function resize() {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (nodePositions.length > 0) initNodePositions();
    }

    function getYatColor(val, maxYat) {
        const norm = clamp(val / Math.max(maxYat, 0.1), 0, 1);
        const r = Math.floor(20 + norm * 217);
        const g = Math.floor(25 + norm * 8);
        const b = Math.floor(80 + norm * 44);
        return `rgb(${r}, ${g}, ${b})`;
    }

    // ================== MATRIX VIEW ==================
    function drawMatrixView(w, h, plotArea) {
        const margin = 25;
        const size = Math.min(plotArea.w - margin * 2, plotArea.h - margin * 2);
        const cellSize = size / numVectors;
        const startX = plotArea.x + (plotArea.w - size) / 2;
        const startY = plotArea.y + margin;

        // Draw cells
        for (let i = 0; i < numVectors; i++) {
            for (let j = 0; j < numVectors; j++) {
                const x = startX + j * cellSize;
                const y = startY + i * cellSize;
                const val = yatMatrix[i][j];
                const isHovered = hoveredCell && hoveredCell.i === i && hoveredCell.j === j;
                const isRowOrCol = hoveredCell && (hoveredCell.i === i || hoveredCell.j === j);

                let fillColor;
                if (!isFinite(val)) {
                    const diagGrad = ctx.createLinearGradient(x, y, x + cellSize, y + cellSize);
                    const shimmer = Math.sin(time * 2.5 + i * 0.4) * 0.15 + 0.85;
                    diagGrad.addColorStop(0, hexToRgba(COLORS.primary, shimmer));
                    diagGrad.addColorStop(1, hexToRgba(COLORS.wave, shimmer));
                    fillColor = diagGrad;
                } else {
                    fillColor = getYatColor(val, stats.maxYat);
                }

                if (isRowOrCol && !isHovered) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
                    ctx.fillRect(x, y, cellSize, cellSize);
                }

                ctx.fillStyle = fillColor;
                ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);

                if (isHovered) {
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
                }
            }
        }

        // Labels
        ctx.font = 'bold 10px "Courier New", monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        for (let i = 0; i < numVectors; i++) {
            ctx.fillStyle = hoveredCell?.i === i ? COLORS.accent : 'rgba(255,255,255,0.6)';
            ctx.fillText(labels[i], startX - 5, startY + i * cellSize + cellSize / 2);
        }
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        for (let j = 0; j < numVectors; j++) {
            ctx.fillStyle = hoveredCell?.j === j ? COLORS.accent : 'rgba(255,255,255,0.6)';
            ctx.fillText(labels[j], startX + j * cellSize + cellSize / 2, startY - 4);
        }

        return { startX, startY, cellSize, size };
    }

    // ================== NETWORK VIEW ==================
    function drawNetworkView(w, h, plotArea) {
        const centerX = plotArea.x + plotArea.w / 2;
        const centerY = plotArea.y + plotArea.h / 2;

        // Update positions smoothly
        for (let i = 0; i < nodePositions.length; i++) {
            const node = nodePositions[i];
            node.x += (node.targetX - node.x) * 0.1;
            node.y += (node.targetY - node.y) * 0.1;
        }

        // Draw edges
        for (let i = 0; i < numVectors; i++) {
            for (let j = i + 1; j < numVectors; j++) {
                const val = yatMatrix[i][j];
                if (!isFinite(val)) continue;

                const norm = clamp(val / stats.maxYat, 0, 1);
                const n1 = nodePositions[i];
                const n2 = nodePositions[j];

                const isHighlighted = hoveredNode === i || hoveredNode === j;
                const alpha = isHighlighted ? 0.8 : (0.1 + norm * 0.5);

                ctx.strokeStyle = hexToRgba(isHighlighted ? COLORS.accent : COLORS.primary, alpha);
                ctx.lineWidth = isHighlighted ? 3 : (1 + norm * 3);
                ctx.beginPath();
                ctx.moveTo(n1.x, n1.y);
                ctx.lineTo(n2.x, n2.y);
                ctx.stroke();
            }
        }

        // Draw nodes
        for (let i = 0; i < numVectors; i++) {
            const node = nodePositions[i];
            const isHovered = hoveredNode === i;
            const isDragged = draggedNode === i;
            const scale = isDragged ? 1.2 : (isHovered ? 1.1 : 1);

            // Glow
            const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, 35 * scale);
            glow.addColorStop(0, hexToRgba(isHovered ? COLORS.accent : COLORS.primary, 0.4));
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(node.x, node.y, 35 * scale, 0, Math.PI * 2);
            ctx.fill();

            // Node
            const nodeGrad = ctx.createRadialGradient(node.x - 4, node.y - 4, 0, node.x, node.y, 18 * scale);
            nodeGrad.addColorStop(0, 'rgba(255,255,255,0.3)');
            nodeGrad.addColorStop(0.5, isHovered ? COLORS.accent : COLORS.primary);
            nodeGrad.addColorStop(1, hexToRgba(isHovered ? COLORS.accent : COLORS.primary, 0.6));
            ctx.fillStyle = nodeGrad;
            ctx.beginPath();
            ctx.arc(node.x, node.y, 18 * scale, 0, Math.PI * 2);
            ctx.fill();

            // Label
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${12 * scale}px "Courier New", monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(labels[i], node.x, node.y);
        }
    }

    // ================== BARS VIEW ==================
    function drawBarsView(w, h, plotArea) {
        const margin = 30;
        const barAreaW = plotArea.w - margin * 2;
        const barAreaH = plotArea.h - margin * 2 - 20;
        const startX = plotArea.x + margin;
        const startY = plotArea.y + margin;
        const barW = barAreaW / numVectors - 8;

        // Calculate total Yat per vector
        const totals = [];
        for (let i = 0; i < numVectors; i++) {
            let sum = 0;
            for (let j = 0; j < numVectors; j++) {
                if (i !== j && isFinite(yatMatrix[i][j])) {
                    sum += yatMatrix[i][j];
                }
            }
            totals.push(sum);
        }
        const maxTotal = Math.max(...totals, 0.1);

        for (let i = 0; i < numVectors; i++) {
            const x = startX + i * (barW + 8) + 4;
            const height = (totals[i] / maxTotal) * barAreaH;
            const y = startY + barAreaH - height;
            const isHovered = hoveredNode === i;

            // Bar gradient
            const barGrad = ctx.createLinearGradient(x, y + height, x, y);
            barGrad.addColorStop(0, hexToRgba(isHovered ? COLORS.accent : COLORS.primary, 0.5));
            barGrad.addColorStop(1, isHovered ? COLORS.accent : COLORS.primary);
            ctx.fillStyle = barGrad;
            ctx.beginPath();
            ctx.roundRect(x, y, barW, height, 4);
            ctx.fill();

            if (isHovered) {
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(x, y, barW, height, 4);
                ctx.stroke();

                // Value label
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 10px "Courier New", monospace';
                ctx.textAlign = 'center';
                ctx.fillText(totals[i].toFixed(1), x + barW / 2, y - 8);
            }

            // Label
            ctx.fillStyle = isHovered ? COLORS.accent : 'rgba(255,255,255,0.7)';
            ctx.font = 'bold 11px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(labels[i], x + barW / 2, startY + barAreaH + 8);
        }

        // Y-axis label
        ctx.save();
        ctx.translate(startX - 15, startY + barAreaH / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillStyle = COLORS.dim;
        ctx.font = '9px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Total Yat', 0, 0);
        ctx.restore();
    }

    // ================== RIGHT PANEL ==================
    function drawRightPanel(w, h) {
        const panelX = w * 0.72;
        const panelW = w * 0.26;
        const panelY = 50;

        // Stats box
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelW, 100, 5);
        ctx.fill();
        ctx.strokeStyle = hexToRgba(COLORS.primary, 0.5);
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = 'bold 10px "Courier New", monospace';
        ctx.fillStyle = COLORS.dim;
        ctx.textAlign = 'left';
        ctx.fillText('STATISTICS', panelX + 12, panelY + 18);

        ctx.font = '10px "Courier New", monospace';
        ctx.fillStyle = COLORS.light;
        ctx.fillText(`Max Yat: ${stats.maxYat.toFixed(2)}`, panelX + 12, panelY + 38);
        ctx.fillText(`Min Yat: ${stats.minYat.toFixed(2)}`, panelX + 12, panelY + 55);
        ctx.fillText(`Avg Yat: ${stats.avgYat.toFixed(2)}`, panelX + 12, panelY + 72);
        ctx.fillText(`Vectors: ${numVectors}`, panelX + 12, panelY + 89);

        // Hover info
        if (hoveredCell && currentView === 'matrix') {
            const val = yatMatrix[hoveredCell.i][hoveredCell.j];
            const infoY = panelY + 115;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
            ctx.beginPath();
            ctx.roundRect(panelX, infoY, panelW, 70, 5);
            ctx.fill();
            ctx.strokeStyle = COLORS.accent;
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.font = 'bold 10px "Courier New", monospace';
            ctx.fillStyle = COLORS.dim;
            ctx.fillText('SELECTED CELL', panelX + 12, infoY + 18);

            ctx.fillStyle = COLORS.light;
            ctx.fillText(`${labels[hoveredCell.i]} → ${labels[hoveredCell.j]}`, panelX + 12, infoY + 38);

            ctx.font = 'bold 16px "Courier New", monospace';
            ctx.fillStyle = COLORS.accent;
            ctx.fillText(isFinite(val) ? val.toFixed(3) : '∞', panelX + 12, infoY + 58);
        } else if (hoveredNode !== null) {
            const infoY = panelY + 115;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
            ctx.beginPath();
            ctx.roundRect(panelX, infoY, panelW, 70, 5);
            ctx.fill();
            ctx.strokeStyle = COLORS.accent;
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.font = 'bold 10px "Courier New", monospace';
            ctx.fillStyle = COLORS.dim;
            ctx.fillText(`VECTOR ${labels[hoveredNode]}`, panelX + 12, infoY + 18);

            // Top connection
            let maxPair = { idx: -1, val: 0 };
            for (let j = 0; j < numVectors; j++) {
                if (j !== hoveredNode && isFinite(yatMatrix[hoveredNode][j])) {
                    if (yatMatrix[hoveredNode][j] > maxPair.val) {
                        maxPair = { idx: j, val: yatMatrix[hoveredNode][j] };
                    }
                }
            }

            ctx.font = '10px "Courier New", monospace';
            ctx.fillStyle = COLORS.light;
            if (maxPair.idx >= 0) {
                ctx.fillText(`Most similar: ${labels[maxPair.idx]}`, panelX + 12, infoY + 38);
                ctx.fillText(`Yat = ${maxPair.val.toFixed(2)}`, panelX + 12, infoY + 55);
            }
        }

        // Color legend
        const legendY = h - 85;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.beginPath();
        ctx.roundRect(panelX, legendY, panelW, 35, 4);
        ctx.fill();

        const gradW = panelW - 24;
        const grad = ctx.createLinearGradient(panelX + 12, 0, panelX + 12 + gradW, 0);
        grad.addColorStop(0, getYatColor(0, 1));
        grad.addColorStop(1, getYatColor(1, 1));
        ctx.fillStyle = grad;
        ctx.fillRect(panelX + 12, legendY + 10, gradW, 8);

        ctx.font = '8px "Courier New", monospace';
        ctx.fillStyle = COLORS.dim;
        ctx.textAlign = 'left';
        ctx.fillText('Low', panelX + 12, legendY + 28);
        ctx.textAlign = 'right';
        ctx.fillText('High', panelX + 12 + gradW, legendY + 28);
    }

    function draw() {
        const rect = canvas.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;

        ctx.clearRect(0, 0, w, h);

        if (vectors.length === 0) initVectors();

        // Subtle grid
        ctx.strokeStyle = 'rgba(27, 153, 139, 0.03)';
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 25) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = 0; y < h; y += 25) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        // Plot area (left side)
        const plotArea = { x: 10, y: 45, w: w * 0.68, h: h - 95 };

        // Draw current view
        if (currentView === 'matrix') {
            drawMatrixView(w, h, plotArea);
        } else if (currentView === 'network') {
            drawNetworkView(w, h, plotArea);
        } else if (currentView === 'bars') {
            drawBarsView(w, h, plotArea);
        }

        // Right panel
        drawRightPanel(w, h);

        // View toggle buttons (top)
        const viewBtnW = 70;
        const viewBtnH = 26;
        const viewBtnGap = 6;
        const viewStartX = 15;
        const viewY = 10;

        for (let i = 0; i < views.length; i++) {
            const x = viewStartX + i * (viewBtnW + viewBtnGap);
            const isActive = views[i].id === currentView;
            const isHover = hoveredButton === `view_${i}`;

            ctx.fillStyle = isActive ? hexToRgba(COLORS.primary, 0.4) : (isHover ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.6)');
            ctx.beginPath();
            ctx.roundRect(x, viewY, viewBtnW, viewBtnH, 4);
            ctx.fill();

            ctx.strokeStyle = isActive ? COLORS.primary : (isHover ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)');
            ctx.lineWidth = isActive ? 2 : 1;
            ctx.stroke();

            ctx.font = '10px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = isActive ? COLORS.light : (isHover ? COLORS.light : COLORS.dim);
            ctx.fillText(`${views[i].icon} ${views[i].label}`, x + viewBtnW / 2, viewY + viewBtnH / 2);
        }

        // Preset buttons (bottom)
        const btnW = 70;
        const btnH = 24;
        const btnGap = 8;
        const totalBtnW = presets.length * btnW + (presets.length - 1) * btnGap;
        const btnStartX = plotArea.x + (plotArea.w - totalBtnW) / 2;
        const btnY = h - 38;

        for (let i = 0; i < presets.length; i++) {
            const x = btnStartX + i * (btnW + btnGap);
            const isHover = hoveredButton === `preset_${i}`;

            ctx.fillStyle = isHover ? 'rgba(27, 153, 139, 0.25)' : 'rgba(0, 0, 0, 0.7)';
            ctx.beginPath();
            ctx.roundRect(x, btnY, btnW, btnH, 3);
            ctx.fill();

            ctx.strokeStyle = isHover ? COLORS.primary : 'rgba(255,255,255,0.15)';
            ctx.lineWidth = isHover ? 1.5 : 1;
            ctx.stroke();

            ctx.font = '9px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = isHover ? COLORS.light : 'rgba(255,255,255,0.5)';
            ctx.fillText(presets[i].label, x + btnW / 2, btnY + btnH / 2);
        }

        time += 0.02;
        animationFrame = requestAnimationFrame(draw);
    }

    function getHoverTarget(mouseX, mouseY) {
        const rect = canvas.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;
        const plotArea = { x: 10, y: 45, w: w * 0.68, h: h - 95 };

        // Check view buttons
        const viewBtnW = 70, viewBtnH = 26, viewBtnGap = 6, viewStartX = 15, viewY = 10;
        for (let i = 0; i < views.length; i++) {
            const x = viewStartX + i * (viewBtnW + viewBtnGap);
            if (mouseX >= x && mouseX <= x + viewBtnW && mouseY >= viewY && mouseY <= viewY + viewBtnH) {
                return { type: 'viewBtn', index: i };
            }
        }

        // Check preset buttons
        const btnW = 70, btnH = 24, btnGap = 8;
        const totalBtnW = presets.length * btnW + (presets.length - 1) * btnGap;
        const btnStartX = plotArea.x + (plotArea.w - totalBtnW) / 2;
        const btnY = h - 38;
        for (let i = 0; i < presets.length; i++) {
            const x = btnStartX + i * (btnW + btnGap);
            if (mouseX >= x && mouseX <= x + btnW && mouseY >= btnY && mouseY <= btnY + btnH) {
                return { type: 'presetBtn', index: i };
            }
        }

        // View-specific hover
        if (currentView === 'matrix') {
            const margin = 25;
            const size = Math.min(plotArea.w - margin * 2, plotArea.h - margin * 2);
            const cellSize = size / numVectors;
            const startX = plotArea.x + (plotArea.w - size) / 2;
            const startY = plotArea.y + margin;

            const j = Math.floor((mouseX - startX) / cellSize);
            const i = Math.floor((mouseY - startY) / cellSize);
            if (i >= 0 && i < numVectors && j >= 0 && j < numVectors) {
                return { type: 'cell', i, j };
            }
        } else if (currentView === 'network' || currentView === 'bars') {
            if (currentView === 'network') {
                for (let i = 0; i < nodePositions.length; i++) {
                    const node = nodePositions[i];
                    const dist = Math.sqrt((mouseX - node.x) ** 2 + (mouseY - node.y) ** 2);
                    if (dist < 25) return { type: 'node', index: i };
                }
            } else {
                const margin = 30;
                const barAreaW = plotArea.w - margin * 2;
                const startX = plotArea.x + margin;
                const barW = barAreaW / numVectors - 8;
                for (let i = 0; i < numVectors; i++) {
                    const x = startX + i * (barW + 8) + 4;
                    if (mouseX >= x && mouseX <= x + barW && mouseY >= plotArea.y && mouseY <= plotArea.y + plotArea.h) {
                        return { type: 'node', index: i };
                    }
                }
            }
        }

        return null;
    }

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        if (draggedNode !== null && currentView === 'network') {
            nodePositions[draggedNode].targetX = mouseX;
            nodePositions[draggedNode].targetY = mouseY;
            canvas.style.cursor = 'grabbing';
            return;
        }

        hoveredButton = null;
        hoveredCell = null;
        hoveredNode = null;

        const target = getHoverTarget(mouseX, mouseY);
        if (target) {
            if (target.type === 'viewBtn') {
                hoveredButton = `view_${target.index}`;
                canvas.style.cursor = 'pointer';
            } else if (target.type === 'presetBtn') {
                hoveredButton = `preset_${target.index}`;
                canvas.style.cursor = 'pointer';
            } else if (target.type === 'cell') {
                hoveredCell = { i: target.i, j: target.j };
                canvas.style.cursor = 'pointer';
            } else if (target.type === 'node') {
                hoveredNode = target.index;
                canvas.style.cursor = currentView === 'network' ? 'grab' : 'pointer';
            }
        } else {
            canvas.style.cursor = 'default';
        }
    });

    canvas.addEventListener('mousedown', (e) => {
        if (currentView === 'network' && hoveredNode !== null) {
            draggedNode = hoveredNode;
            canvas.style.cursor = 'grabbing';
        }
    });

    canvas.addEventListener('mouseup', () => {
        draggedNode = null;
    });

    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const target = getHoverTarget(mouseX, mouseY);
        if (target) {
            if (target.type === 'viewBtn') {
                currentView = views[target.index].id;
                if (currentView === 'network') initNodePositions();
            } else if (target.type === 'presetBtn') {
                initVectors(presets[target.index].generate());
            }
        }
    });

    canvas.addEventListener('mouseleave', () => {
        hoveredCell = null;
        hoveredButton = null;
        hoveredNode = null;
        draggedNode = null;
        canvas.style.cursor = 'default';
    });

    resize();
    initVectors();
    draw();
    window.addEventListener('resize', resize);
}
