/**
 * Non-Linearity Blog Visualizations
 * Interactive canvas visualizations for the "Meaning of Non-Linearity" article
 */

document.addEventListener('DOMContentLoaded', () => {
    // Color scheme matching Azetta
    const COLORS = {
        primary: '#1b998b',
        accent: '#ed217c',
        light: '#f4f1de',
        dim: 'rgba(244, 241, 222, 0.3)',
        grid: 'rgba(27, 153, 139, 0.2)'
    };

    // ===============================
    // Visualization 1: 2D Scatter Plot with Multiple Patterns
    // ===============================
    const canvas2d = document.getElementById('viz-2d');
    if (canvas2d) {
        const ctx2d = canvas2d.getContext('2d');
        let animating2d = false;
        let animProgress2d = 0;
        let currentPattern = 0;

        const patterns = [
            { name: 'Sinusoidal', color: '#e67ea3' },
            { name: 'Quadratic', color: '#1b998b' },
            { name: 'Exponential', color: '#f4a261' },
            { name: 'Logarithmic', color: '#9b5de5' },
            { name: 'Circular', color: '#00bbf9' },
            { name: 'Step Function', color: '#fee440' }
        ];

        function resize2d() {
            const rect = canvas2d.getBoundingClientRect();
            canvas2d.width = rect.width * window.devicePixelRatio;
            canvas2d.height = rect.height * window.devicePixelRatio;
            ctx2d.scale(window.devicePixelRatio, window.devicePixelRatio);
        }

        function generatePatternData(patternIndex) {
            const points = [];
            const w = canvas2d.getBoundingClientRect().width || 400;
            const h = canvas2d.getBoundingClientRect().height || 250;
            const cx = w / 2, cy = h / 2;

            for (let i = 0; i < 50; i++) {
                let x, y;
                const t = i / 50;
                const noise = () => (Math.random() - 0.5) * 20;

                switch (patternIndex) {
                    case 0: // Sinusoidal
                        x = 60 + t * (w - 120);
                        y = cy + Math.sin(t * Math.PI * 2) * 70 + noise();
                        break;
                    case 1: // Quadratic (parabola)
                        x = 60 + t * (w - 120);
                        const tx = (t - 0.5) * 2;
                        y = cy + tx * tx * 80 - 40 + noise();
                        break;
                    case 2: // Exponential
                        x = 60 + t * (w - 120);
                        y = h - 60 - Math.exp(t * 3) * 8 + noise();
                        break;
                    case 3: // Logarithmic
                        x = 60 + t * (w - 120);
                        y = h - 60 - Math.log(1 + t * 10) * 40 + noise();
                        break;
                    case 4: // Circular
                        const angle = t * Math.PI * 1.8;
                        const radius = 70;
                        x = cx + Math.cos(angle) * radius + noise() * 0.5;
                        y = cy + Math.sin(angle) * radius + noise() * 0.5;
                        break;
                    case 5: // Step function
                        x = 60 + t * (w - 120);
                        const step = Math.floor(t * 5);
                        y = h - 60 - step * 35 + noise() * 0.5;
                        break;
                }
                points.push({ x, y, baseX: x, baseY: y });
            }
            return points;
        }

        let points2d = generatePatternData(0);

        function drawCurveGuide(patternIndex, w, h) {
            const cx = w / 2, cy = h / 2;
            ctx2d.strokeStyle = patterns[patternIndex].color;
            ctx2d.lineWidth = 2;
            ctx2d.setLineDash([5, 5]);
            ctx2d.beginPath();

            for (let i = 0; i <= 100; i++) {
                let x, y;
                const t = i / 100;

                switch (patternIndex) {
                    case 0: // Sinusoidal
                        x = 60 + t * (w - 120);
                        y = cy + Math.sin(t * Math.PI * 2) * 70;
                        break;
                    case 1: // Quadratic
                        x = 60 + t * (w - 120);
                        const tx = (t - 0.5) * 2;
                        y = cy + tx * tx * 80 - 40;
                        break;
                    case 2: // Exponential
                        x = 60 + t * (w - 120);
                        y = h - 60 - Math.exp(t * 3) * 8;
                        break;
                    case 3: // Logarithmic
                        x = 60 + t * (w - 120);
                        y = h - 60 - Math.log(1 + t * 10) * 40;
                        break;
                    case 4: // Circular
                        const angle = t * Math.PI * 1.8;
                        x = cx + Math.cos(angle) * 70;
                        y = cy + Math.sin(angle) * 70;
                        break;
                    case 5: // Step function
                        x = 60 + t * (w - 120);
                        const step = Math.floor(t * 5);
                        y = h - 60 - step * 35;
                        break;
                }

                if (i === 0) ctx2d.moveTo(x, y);
                else ctx2d.lineTo(x, y);
            }
            ctx2d.stroke();
            ctx2d.setLineDash([]);
        }

        function draw2d() {
            const w = canvas2d.getBoundingClientRect().width;
            const h = canvas2d.getBoundingClientRect().height;

            ctx2d.clearRect(0, 0, w, h);

            // Grid
            ctx2d.strokeStyle = COLORS.grid;
            ctx2d.lineWidth = 1;
            for (let x = 50; x < w; x += 50) {
                ctx2d.beginPath();
                ctx2d.moveTo(x, 0);
                ctx2d.lineTo(x, h);
                ctx2d.stroke();
            }
            for (let y = 50; y < h; y += 50) {
                ctx2d.beginPath();
                ctx2d.moveTo(0, y);
                ctx2d.lineTo(w, y);
                ctx2d.stroke();
            }

            // Axes
            ctx2d.strokeStyle = COLORS.dim;
            ctx2d.lineWidth = 2;
            ctx2d.beginPath();
            ctx2d.moveTo(50, h - 50);
            ctx2d.lineTo(w - 50, h - 50);
            ctx2d.moveTo(50, h - 50);
            ctx2d.lineTo(50, 50);
            ctx2d.stroke();

            // Axis labels
            ctx2d.fillStyle = COLORS.dim;
            ctx2d.font = '12px "Courier New", monospace';
            ctx2d.fillText('Feature X', w - 100, h - 20);
            ctx2d.save();
            ctx2d.translate(20, 100);
            ctx2d.rotate(-Math.PI / 2);
            ctx2d.fillText('Feature Y', 0, 0);
            ctx2d.restore();

            // Draw curve guide
            drawCurveGuide(currentPattern, w, h);

            // Draw points
            points2d.forEach((p, i) => {
                const drawX = animating2d ? p.baseX + (p.x - p.baseX) * Math.min(animProgress2d * 2, 1) : p.x;
                const drawY = animating2d ? p.baseY + (p.y - p.baseY) * Math.min(animProgress2d * 2, 1) : p.y;

                ctx2d.beginPath();
                ctx2d.arc(drawX, drawY, 5, 0, Math.PI * 2);
                ctx2d.fillStyle = patterns[currentPattern].color;
                ctx2d.fill();
            });

            // Pattern label
            ctx2d.fillStyle = 'rgba(0,0,0,0.7)';
            ctx2d.fillRect(w - 140, 10, 130, 28);
            ctx2d.strokeStyle = patterns[currentPattern].color;
            ctx2d.lineWidth = 1;
            ctx2d.strokeRect(w - 140, 10, 130, 28);
            ctx2d.fillStyle = patterns[currentPattern].color;
            ctx2d.font = 'bold 11px "Courier New", monospace';
            ctx2d.fillText(patterns[currentPattern].name, w - 132, 29);

            if (animating2d) {
                animProgress2d += 0.02;
                if (animProgress2d >= 1) {
                    animating2d = false;
                    animProgress2d = 0;
                }
                requestAnimationFrame(draw2d);
            }
        }

        canvas2d.addEventListener('click', () => {
            currentPattern = (currentPattern + 1) % patterns.length;
            points2d = generatePatternData(currentPattern);
            animating2d = true;
            animProgress2d = 0;
            draw2d();
        });

        resize2d();
        draw2d();
        window.addEventListener('resize', () => { resize2d(); draw2d(); });
    }

    // ===============================
    // Visualization 2: Rows vs Columns with Multiple Datasets
    // ===============================
    const canvasRC = document.getElementById('viz-rows-cols');
    if (canvasRC) {
        const ctxRC = canvasRC.getContext('2d');
        let showRows = false;
        let currentDataset = 0;

        // Multiple dataset examples
        const datasets = [
            {
                name: 'Random Mix',
                data: [
                    [2.1, 3.5, 1.8],
                    [4.2, 1.2, 3.1],
                    [1.5, 4.8, 2.2],
                    [3.8, 2.1, 4.5],
                    [2.9, 3.2, 2.8]
                ]
            },
            {
                name: 'Clustered',
                data: [
                    [2.0, 2.2, 2.1],
                    [2.3, 2.5, 2.2],
                    [4.5, 4.3, 4.4],
                    [4.2, 4.6, 4.5],
                    [4.4, 4.1, 4.3]
                ]
            },
            {
                name: 'Linear Trend',
                data: [
                    [1.0, 1.2, 1.1],
                    [2.0, 2.3, 2.1],
                    [3.0, 3.1, 2.9],
                    [4.0, 3.9, 4.1],
                    [5.0, 4.8, 5.2]
                ]
            },
            {
                name: 'Wide Spread',
                data: [
                    [0.5, 4.5, 2.5],
                    [4.8, 0.3, 2.8],
                    [2.5, 2.5, 0.5],
                    [2.3, 2.7, 4.8],
                    [3.5, 3.5, 3.5]
                ]
            }
        ];

        function resizeRC() {
            const rect = canvasRC.getBoundingClientRect();
            canvasRC.width = rect.width * window.devicePixelRatio;
            canvasRC.height = rect.height * window.devicePixelRatio;
            ctxRC.scale(window.devicePixelRatio, window.devicePixelRatio);
        }

        function drawRowsCols() {
            const w = canvasRC.getBoundingClientRect().width;
            const h = canvasRC.getBoundingClientRect().height;
            const data = datasets[currentDataset].data;

            ctxRC.clearRect(0, 0, w, h);

            // Background
            ctxRC.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctxRC.fillRect(0, 0, w, h);

            const midX = w / 2;

            // Left side: Column vs Column view
            ctxRC.save();
            ctxRC.beginPath();
            ctxRC.rect(0, 0, midX - 10, h);
            ctxRC.clip();

            // Title
            ctxRC.fillStyle = showRows ? COLORS.dim : COLORS.accent;
            ctxRC.font = 'bold 14px "Courier New", monospace';
            ctxRC.fillText('COLUMNS vs COLUMNS', 20, 30);
            ctxRC.font = '11px "Courier New", monospace';
            ctxRC.fillStyle = COLORS.dim;
            ctxRC.fillText('(Feature 1 vs Feature 2)', 20, 48);

            // Draw scatter plot
            const plotX = 30, plotY = 70, plotW = midX - 80, plotH = h - 140;

            // Axes
            ctxRC.strokeStyle = COLORS.dim;
            ctxRC.lineWidth = 1;
            ctxRC.beginPath();
            ctxRC.moveTo(plotX, plotY + plotH);
            ctxRC.lineTo(plotX + plotW, plotY + plotH);
            ctxRC.moveTo(plotX, plotY + plotH);
            ctxRC.lineTo(plotX, plotY);
            ctxRC.stroke();

            // Labels
            ctxRC.fillStyle = COLORS.dim;
            ctxRC.font = '10px "Courier New", monospace';
            ctxRC.fillText('Feature 1', plotX + plotW - 50, plotY + plotH + 20);
            ctxRC.save();
            ctxRC.translate(plotX - 15, plotY + 50);
            ctxRC.rotate(-Math.PI / 2);
            ctxRC.fillText('Feature 2', 0, 0);
            ctxRC.restore();

            // Plot points (columns 0 vs 1)
            data.forEach((row, i) => {
                const x = plotX + (row[0] / 5) * plotW;
                const y = plotY + plotH - (row[1] / 5) * plotH;
                ctxRC.beginPath();
                ctxRC.arc(x, y, 8, 0, Math.PI * 2);
                ctxRC.fillStyle = showRows ? COLORS.dim : `hsl(${160 + i * 30}, 70%, 50%)`;
                ctxRC.fill();
            });

            // "Wrong" indicator
            if (showRows) {
                ctxRC.fillStyle = 'rgba(255, 100, 100, 0.15)';
                ctxRC.fillRect(10, 10, midX - 30, h - 40);
                ctxRC.fillStyle = '#ff6666';
                ctxRC.font = 'bold 14px "Courier New", monospace';
                ctxRC.fillText('✗ WRONG APPROACH', midX / 2 - 80, h / 2);
            }

            ctxRC.restore();

            // Divider
            ctxRC.strokeStyle = COLORS.grid;
            ctxRC.lineWidth = 2;
            ctxRC.setLineDash([5, 5]);
            ctxRC.beginPath();
            ctxRC.moveTo(midX, 20);
            ctxRC.lineTo(midX, h - 20);
            ctxRC.stroke();
            ctxRC.setLineDash([]);

            // Right side: Row vs Row view
            ctxRC.save();
            ctxRC.beginPath();
            ctxRC.rect(midX + 10, 0, midX - 10, h);
            ctxRC.clip();

            // Title
            ctxRC.fillStyle = showRows ? COLORS.accent : COLORS.dim;
            ctxRC.font = 'bold 14px "Courier New", monospace';
            ctxRC.fillText('ROWS vs ROWS', midX + 30, 30);
            ctxRC.font = '11px "Courier New", monospace';
            ctxRC.fillStyle = COLORS.dim;
            ctxRC.fillText('(Observation Vectors)', midX + 30, 48);

            // Draw vectors from origin
            const cx = midX + (w - midX) / 2;
            const cy = h / 2 + 20;
            const scale = 25;

            // Draw each observation as a vector
            data.forEach((row, i) => {
                const angle = (i / data.length) * Math.PI * 0.8 - Math.PI * 0.4;
                const mag = Math.sqrt(row[0] ** 2 + row[1] ** 2 + row[2] ** 2);
                const len = mag * scale / 2;

                const endX = cx + Math.cos(angle) * len;
                const endY = cy - Math.sin(angle) * len;

                ctxRC.strokeStyle = showRows ? `hsl(${160 + i * 30}, 70%, 50%)` : COLORS.dim;
                ctxRC.lineWidth = showRows ? 3 : 2;
                ctxRC.beginPath();
                ctxRC.moveTo(cx, cy);
                ctxRC.lineTo(endX, endY);
                ctxRC.stroke();

                // Arrow head
                const arrowAngle = Math.atan2(cy - endY, endX - cx);
                ctxRC.fillStyle = showRows ? `hsl(${160 + i * 30}, 70%, 50%)` : COLORS.dim;
                ctxRC.beginPath();
                ctxRC.moveTo(endX, endY);
                ctxRC.lineTo(endX - 8 * Math.cos(arrowAngle - 0.4), endY + 8 * Math.sin(arrowAngle - 0.4));
                ctxRC.lineTo(endX - 8 * Math.cos(arrowAngle + 0.4), endY + 8 * Math.sin(arrowAngle + 0.4));
                ctxRC.closePath();
                ctxRC.fill();

                // Labels
                ctxRC.fillStyle = showRows ? COLORS.light : COLORS.dim;
                ctxRC.font = '10px "Courier New", monospace';
                ctxRC.fillText(`Obs ${i + 1}`, endX + 5, endY);
            });

            // "Right" indicator
            if (showRows) {
                ctxRC.fillStyle = 'rgba(27, 153, 139, 0.15)';
                ctxRC.fillRect(midX + 10, 10, w - midX - 20, h - 40);
                ctxRC.fillStyle = COLORS.primary;
                ctxRC.font = 'bold 14px "Courier New", monospace';
                ctxRC.fillText('✓ RIGHT APPROACH', midX + 50, h - 50);
            }

            ctxRC.restore();

            // Dataset indicator (top center)
            ctxRC.fillStyle = 'rgba(0,0,0,0.7)';
            ctxRC.fillRect(w / 2 - 70, h - 35, 140, 25);
            ctxRC.strokeStyle = '#888';
            ctxRC.lineWidth = 1;
            ctxRC.strokeRect(w / 2 - 70, h - 35, 140, 25);
            ctxRC.fillStyle = '#aaa';
            ctxRC.font = 'bold 10px "Courier New", monospace';
            ctxRC.fillText(`Data: ${datasets[currentDataset].name}`, w / 2 - 55, h - 18);

            // Instructions
            ctxRC.fillStyle = COLORS.dim;
            ctxRC.font = '10px "Courier New", monospace';
            ctxRC.fillText('Click to cycle through views and datasets', w / 2 - 115, h - 5);
        }

        // State machine: columns → rows → next dataset columns → rows → etc.
        canvasRC.addEventListener('click', (e) => {
            e.preventDefault();
            if (showRows) {
                // After showing rows, go to next dataset and reset to columns
                showRows = false;
                currentDataset = (currentDataset + 1) % datasets.length;
            } else {
                // First click: show rows
                showRows = true;
            }
            drawRowsCols();
        });

        resizeRC();
        drawRowsCols();
        window.addEventListener('resize', () => { resizeRC(); drawRowsCols(); });
    }

    // ===============================
    // Visualization 3: Yat Calculator
    // ===============================
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

    // ===============================
    // Visualization 3.5: The Polarity Paradox (Horseshoe)
    // ===============================
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
            const cx = w * 0.3; // Center for vector
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
            const vy = -Math.sin(polAngle) * r; // Canvas Y inverted

            ctxPol.strokeStyle = COLORS.accent;
            ctxPol.beginPath();
            ctxPol.moveTo(cx, cy);
            ctxPol.lineTo(cx + vx, cy + vy);
            ctxPol.stroke();

            // Vector Head
            const headIdx = Math.atan2(vy, vx);
            ctxPol.fillStyle = COLORS.accent;
            ctxPol.beginPath();
            ctxPol.moveTo(cx + vx, cy + vy);
            ctxPol.lineTo(cx + vx - 10 * Math.cos(headIdx - 0.5), cy + vy - 10 * Math.sin(headIdx - 0.5));
            ctxPol.lineTo(cx + vx - 10 * Math.cos(headIdx + 0.5), cy + vy - 10 * Math.sin(headIdx + 0.5));
            ctxPol.fill();

            // Arc Handle
            ctxPol.strokeStyle = COLORS.grid;
            ctxPol.beginPath();
            ctxPol.arc(cx, cy, r, -Math.PI, 0); // Upper half arc
            ctxPol.stroke();

            // Drag Handle
            ctxPol.beginPath();
            ctxPol.arc(cx + vx, cy + vy, 10, 0, Math.PI * 2);
            ctxPol.fillStyle = 'rgba(237, 33, 124, 0.4)';
            ctxPol.fill();


            // 2. Draw Graph View (Right Side)
            const graphX = w * 0.6;
            const graphY = h * 0.2;
            const graphW = w * 0.35;
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
            ctxPol.font = '10px monospace';
            ctxPol.fillText("180°", graphX + graphW - 20, bottomY + 15);
            ctxPol.fillText("0°", graphX, bottomY + 15);

            // Plot Cosine (Linear Decline)
            ctxPol.strokeStyle = '#999';
            ctxPol.beginPath();
            for (let a = 0; a <= Math.PI; a += 0.1) {
                const x = graphX + (a / Math.PI) * graphW;
                // Cosine: 1 -> -1 (mapped to top -> bottom)
                // 1 -> graphY, -1 -> bottomY
                const val = Math.cos(a);
                const y = graphY + (1 - val) / 2 * graphH;
                if (a === 0) ctxPol.moveTo(x, y); else ctxPol.lineTo(x, y);
            }
            ctxPol.stroke();
            ctxPol.fillText("Cosine", graphX + 5, graphY + graphH - 5);

            // Plot Yat (U-Shape)
            // Simplified Yat for normalized vectors: Yat = (x.y)^2 / |x-y|^2
            // |x-y|^2 = 2 - 2cos(a) for unit vectors
            // Yat = cos^2(a) / (2 - 2cos(a))
            ctxPol.strokeStyle = COLORS.primary;
            ctxPol.lineWidth = 2;
            ctxPol.beginPath();
            for (let a = 0.1; a <= Math.PI; a += 0.05) { // Start 0.1 to avoid infinity
                const x = graphX + (a / Math.PI) * graphW;
                const cosA = Math.cos(a);
                const num = cosA * cosA;
                const den = 2 - 2 * cosA;
                let yat = num / den;
                // Clamp for visual
                if (yat > 5) yat = 5;
                // Map 0 -> bottomY, 5 -> graphY
                const y = bottomY - (yat / 5) * graphH;
                if (a === 0.1) ctxPol.moveTo(x, y); else ctxPol.lineTo(x, y);
            }
            ctxPol.stroke();
            ctxPol.fillStyle = COLORS.primary;
            ctxPol.fillText("Yat", graphX + graphW / 2, graphY + 20);

            // Current Position Marker on Graph
            const currX = graphX + (polAngle / Math.PI) * graphW;
            ctxPol.strokeStyle = COLORS.light;
            ctxPol.beginPath();
            ctxPol.moveTo(currX, graphY); ctxPol.lineTo(currX, bottomY);
            ctxPol.stroke();

            // Values
            const cosVal = Math.cos(polAngle).toFixed(2);
            const den = 2 - 2 * Math.cos(polAngle);
            const yatVal = den < 0.001 ? "∞" : ((Math.cos(polAngle) ** 2) / den).toFixed(2);

            ctxPol.fillStyle = COLORS.light;
            ctxPol.fillText(`Angle: ${(polAngle * 180 / Math.PI).toFixed(0)}°`, cx - 30, cy + r + 20);
            ctxPol.fillText(`Cosine: ${cosVal}`, cx - 30, cy + r + 35);
            ctxPol.fillStyle = COLORS.primary;
            ctxPol.fillText(`Yat: ${yatVal}`, cx - 30, cy + r + 50);

        }

        // Interaction
        canvasPolarity.addEventListener('mousedown', (e) => {
            const rect = canvasPolarity.getBoundingClientRect();
            const x = e.clientX - rect.left;
            if (x < rect.width * 0.55) draggingPol = true; // Only drag on vector side
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

                // Angle from center
                let angle = Math.atan2(-(y - cy), x - cx);
                if (angle < 0) angle = 0; // limit upper half for simplicity
                if (angle > Math.PI) angle = Math.PI;
                if (x < cx && y > cy) angle = Math.PI; // Handle wrap around slightly

                polAngle = angle;
                drawPolarity();
            }
        });
        window.addEventListener('mouseup', () => draggingPol = false);

        resizePolarity();
        drawPolarity();
        window.addEventListener('resize', () => { resizePolarity(); drawPolarity(); });
    }

    // ===============================
    // Visualization 4.5: The Metric Lift (3D)
    // ===============================
    const canvasLift = document.getElementById('viz-lift');
    if (canvasLift) {
        const ctxLift = canvasLift.getContext('2d');
        let liftAngle = 0.5;

        const xorpts = [
            { x: 1, y: 1, c: 0 },
            { x: -1, y: -1, c: 0 },
            { x: -1, y: 1, c: 1 },
            { x: 1, y: -1, c: 1 }
        ];

        function resizeLift() {
            const rect = canvasLift.getBoundingClientRect();
            canvasLift.width = rect.width * window.devicePixelRatio;
            canvasLift.height = rect.height * window.devicePixelRatio;
            ctxLift.scale(window.devicePixelRatio, window.devicePixelRatio);
        }

        function project3D(x, y, z, cx, cy, w, h) {
            // Simple rotation around Y
            const cos = Math.cos(liftAngle);
            const sin = Math.sin(liftAngle);
            const rotX = x * cos - z * sin;
            const rotZ = x * sin + z * cos;

            // Perspective
            const scale = 400 / (400 - rotZ * 40); // Standard perspective factor 
            const px = cx + rotX * 60 * scale;
            const py = cy - y * 60 * scale + (rotZ * 20); // Tilt slightly

            return { x: px, y: py, s: scale };
        }

        function drawLift() {
            const w = canvasLift.getBoundingClientRect().width;
            const h = canvasLift.getBoundingClientRect().height;
            const cx = w / 2;
            const cy = h / 2 + 20;

            ctxLift.clearRect(0, 0, w, h);

            // Draw Base Grid (Z=0 plane)
            ctxLift.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            for (let i = -2; i <= 2; i += 0.5) {
                const p1 = project3D(i, 0, -2, cx, cy);
                const p2 = project3D(i, 0, 2, cx, cy);
                ctxLift.beginPath(); ctxLift.moveTo(p1.x, p1.y); ctxLift.lineTo(p2.x, p2.y); ctxLift.stroke();

                const p3 = project3D(-2, 0, i, cx, cy);
                const p4 = project3D(2, 0, i, cx, cy);
                ctxLift.beginPath(); ctxLift.moveTo(p3.x, p3.y); ctxLift.lineTo(p4.x, p4.y); ctxLift.stroke();
            }

            // Draw Points
            xorpts.forEach(p => {
                // Calculate Yat height relative to (1,1)
                // Yat = (p.r)^2 / |p-r|^2
                // p dot r (1,1) = x+y
                const dot = p.x + p.y;
                const distSq = (1 - p.x) ** 2 + (1 - p.y) ** 2;

                // Height: For (1,1) actual distance is 0, height is inf. Clamp it.
                // For (-1,-1): dot=-2, distSq=(-2)^2+(-2)^2=8. Yat=4/8=0.5.
                // For mixed: dot=0. Yat=0.

                let zHeight = 0;
                if (Math.abs(dot) < 0.001) zHeight = 0; // Orthogonal
                else if (distSq < 0.1) zHeight = 3; // The Reference Point (1,1) - huge
                else zHeight = (dot * dot) / distSq;

                // Scale height for visuals
                let visY = zHeight * 1.5;
                if (visY > 3) visY = 3; // Clamp top

                // Project Base and Top
                // We map data 'y' to 3D 'z' (depth) and 'x' to 'x', and 'height' to 'y'
                // This coordinate swap is confusing, let's stick to standard: x=x, y=height, z=y(depth)
                const base = project3D(p.x, 0, p.y, cx, cy);
                const top = project3D(p.x, visY, p.y, cx, cy);

                // Draw Stick
                ctxLift.strokeStyle = COLORS.dim;
                ctxLift.beginPath();
                ctxLift.moveTo(base.x, base.y);
                ctxLift.lineTo(top.x, top.y);
                ctxLift.stroke();

                // Draw Point
                ctxLift.fillStyle = p.c === 0 ? COLORS.primary : COLORS.accent;
                ctxLift.beginPath();
                ctxLift.arc(top.x, top.y, 8 * top.s, 0, Math.PI * 2);
                ctxLift.fill();

                // Label
                ctxLift.fillStyle = '#fff';
                ctxLift.font = '10px monospace';
                ctxLift.fillText(`(${p.x},${p.y})`, top.x + 10, top.y);
            });

            // Draw Separating Plane (Visualizing the cut)
            // A flat plane at height 0.2 separates the lifted (Class 0) from flat (Class 1)
            ctxLift.fillStyle = 'rgba(255, 255, 255, 0.1)';
            const c1 = project3D(-2.5, 0.2, -2.5, cx, cy);
            const c2 = project3D(2.5, 0.2, -2.5, cx, cy);
            const c3 = project3D(2.5, 0.2, 2.5, cx, cy);
            const c4 = project3D(-2.5, 0.2, 2.5, cx, cy);

            ctxLift.beginPath();
            ctxLift.moveTo(c1.x, c1.y); ctxLift.lineTo(c2.x, c2.y); ctxLift.lineTo(c3.x, c3.y); ctxLift.lineTo(c4.x, c4.y);
            ctxLift.closePath();
            ctxLift.fill();
            ctxLift.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctxLift.stroke();

            // Auto rotate
            liftAngle += 0.005;
            requestAnimationFrame(drawLift);
        }

        resizeLift();
        drawLift();
        window.addEventListener('resize', () => { resizeLift(); drawLift(); });
    }

    // ===============================
    // Visualization 4: The XOR Hallmark
    // ===============================
    const canvasXOR = document.getElementById('viz-xor');
    if (canvasXOR) {
        const ctxXOR = canvasXOR.getContext('2d');
        let selectedXORPoint = 0; // 0, 1, 2, 3

        const xorPoints = [
            { x: 1, y: 1, label: '(1, 1)', class: 'Class 0' },
            { x: -1, y: -1, label: '(-1, -1)', class: 'Class 0' },
            { x: -1, y: 1, label: '(-1, 1)', class: 'Class 1' },
            { x: 1, y: -1, label: '(1, -1)', class: 'Class 1' }
        ];

        function resizeXOR() {
            const rect = canvasXOR.getBoundingClientRect();
            canvasXOR.width = rect.width * window.devicePixelRatio;
            canvasXOR.height = rect.height * window.devicePixelRatio;
            ctxXOR.scale(window.devicePixelRatio, window.devicePixelRatio);
        }

        function drawXOR() {
            const w = canvasXOR.getBoundingClientRect().width;
            const h = canvasXOR.getBoundingClientRect().height;
            const cx = w > 600 ? w * 0.4 : w / 2; // Offset center if wide enough for side panel
            const cy = h / 2;
            const scale = Math.min(w, h) * 0.3; // Scale for vectors

            ctxXOR.clearRect(0, 0, w, h);

            // Grid
            ctxXOR.strokeStyle = COLORS.grid;
            ctxXOR.lineWidth = 1;
            drawGrid(ctxXOR, w, h); // Helper if available, else inline

            // Draw Axes
            ctxXOR.strokeStyle = COLORS.dim;
            ctxXOR.lineWidth = 2;
            ctxXOR.beginPath();
            ctxXOR.moveTo(cx - w, cy); ctxXOR.lineTo(cx + w, cy); // X axis
            ctxXOR.moveTo(cx, cy - h); ctxXOR.lineTo(cx, cy + h); // Y axis
            ctxXOR.stroke();

            // The Reference Vector (1, 1)
            const refScale = scale * 1.0;
            const refX = 1 * refScale;
            const refY = -1 * refScale; // Invert Y for canvas

            // Draw Reference Vector (faded if not highlighted)
            ctxXOR.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctxXOR.lineWidth = 4;
            drawArrow(ctxXOR, cx, cy, cx + refX, cy + refY);

            // Draw current selected point vector
            const p = xorPoints[selectedXORPoint];
            const px = p.x * scale;
            const py = -p.y * scale;

            // Determine relationship
            const dot = 1 * p.x + 1 * p.y;
            const isOrthogonal = Math.abs(dot) < 0.1;

            ctxXOR.strokeStyle = isOrthogonal ? COLORS.accent : COLORS.primary;
            ctxXOR.lineWidth = 3;
            drawArrow(ctxXOR, cx, cy, cx + px, cy + py);

            // Draw all points
            xorPoints.forEach((pt, i) => {
                const ptx = cx + pt.x * scale;
                const pty = cy - pt.y * scale;

                ctxXOR.beginPath();
                ctxXOR.arc(ptx, pty, i === selectedXORPoint ? 12 : 6, 0, Math.PI * 2);
                ctxXOR.fillStyle = pt.class === 'Class 0' ? COLORS.primary : COLORS.accent;
                ctxXOR.fill();

                if (i === selectedXORPoint) {
                    ctxXOR.strokeStyle = '#fff';
                    ctxXOR.lineWidth = 2;
                    ctxXOR.stroke();
                }

                // Small labels
                ctxXOR.fillStyle = COLORS.dim;
                ctxXOR.font = '10px monospace';
                ctxXOR.fillText(pt.label, ptx + 15, pty);
            });

            // Info Panel (Right side or overlay)
            const panelX = w > 600 ? w * 0.75 : w - 160;
            const panelY = 40;
            // Draw Angle Arc if orthogonal
            if (isOrthogonal) {
                ctxXOR.strokeStyle = COLORS.accent;
                ctxXOR.lineWidth = 2;
                ctxXOR.beginPath();
                // Draw a small right angle symbol
                // This is an approximation/hack for the visual
                const size = 20;
                // Calculate mid-angle between (1,1) and point
                // Not strictly 90 deg visually on screen unless aspect is 1:1, but conceptual
            }

            // Stats
            ctxXOR.fillStyle = 'rgba(0,0,0,0.8)';
            ctxXOR.fillRect(w > 600 ? w * 0.65 : 10, 10, 200, 140);
            ctxXOR.strokeStyle = COLORS.grid;
            ctxXOR.strokeRect(w > 600 ? w * 0.65 : 10, 10, 200, 140);

            ctxXOR.fillStyle = COLORS.light;
            ctxXOR.font = '12px "Courier New", monospace';
            const baseX = w > 600 ? w * 0.65 + 15 : 25;
            let currentY = 35;

            ctxXOR.fillText(`Ref Vector: (1, 1)`, baseX, currentY); currentY += 20;
            ctxXOR.fillText(`Target:     ${p.label}`, baseX, currentY); currentY += 25;

            ctxXOR.fillText(`Dot Product: ${dot}`, baseX, currentY); currentY += 20;
            const status = dot === 0 ? "ORTHOGONAL" : (dot > 0 ? "PARALLEL" : "ANTI-PARALLEL");
            const color = dot === 0 ? COLORS.accent : COLORS.primary;

            ctxXOR.fillStyle = color;
            ctxXOR.font = 'bold 12px "Courier New", monospace';
            ctxXOR.fillText(status, baseX, currentY); currentY += 25;

            ctxXOR.fillStyle = COLORS.light;
            const yatVal = dot === 0 ? "0.00" : (dot > 0 ? "High" : "High (Signed)");
            // Calculate Yat approx for display (infinite for 1,1)
            const diffSq = (1 - p.x) ** 2 + (1 - p.y) ** 2;
            const yat = diffSq === 0 ? "∞" : ((dot * dot) / diffSq).toFixed(2);

            ctxXOR.fillText(`Yat: ${yat}`, baseX, currentY);
        }

        function drawGrid(ctx, w, h) {
            for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
            for (let y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
        }

        function drawArrow(ctx, x1, y1, x2, y2) {
            const angle = Math.atan2(y2 - y1, x2 - x1);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            // Head
            ctx.beginPath();
            ctx.moveTo(x2, y2);
            ctx.lineTo(x2 - 10 * Math.cos(angle - 0.5), y2 - 10 * Math.sin(angle - 0.5));
            ctx.lineTo(x2 - 10 * Math.cos(angle + 0.5), y2 - 10 * Math.sin(angle + 0.5));
            ctx.closePath();
            ctx.fillStyle = ctx.strokeStyle;
            ctx.fill();
        }

        canvasXOR.addEventListener('click', () => {
            selectedXORPoint = (selectedXORPoint + 1) % 4;
            drawXOR();
        });

        resizeXOR();
        drawXOR();
        window.addEventListener('resize', () => { resizeXOR(); drawXOR(); });
    }

    // ===============================
    // Visualization 5: Orthogonality Explorer
    // ===============================
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

    // ===============================
    // Visualization 5: Spacetime Manifold
    // ===============================
    const canvasField = document.getElementById('viz-yat-field');
    if (canvasField) {
        const ctxField = canvasField.getContext('2d');
        let rotationAngle = 0.5;
        let tiltAngle = 0.6;
        let zoomLevel = 1.0;
        let autoRotate = false;
        let autoRotateId = null;

        // Anchor vector (this is the "mass" bending spacetime)
        let anchorVec = { x: 80, y: 60 };

        function resizeField() {
            const rect = canvasField.getBoundingClientRect();
            canvasField.width = rect.width * window.devicePixelRatio;
            canvasField.height = rect.height * window.devicePixelRatio;
            ctxField.scale(window.devicePixelRatio, window.devicePixelRatio);
        }

        // Yat = (x·y)² / ||x-y||²
        // Using log(1 + yat) to dampen for visualization
        function computeYat(pointX, pointY) {
            const ax = anchorVec.x, ay = anchorVec.y;
            const px = pointX, py = pointY;

            // Dot product: x · y
            const dotProduct = ax * px + ay * py;

            // Distance squared: ||x - y||²
            const dx = px - ax;
            const dy = py - ay;
            const distanceSquared = dx * dx + dy * dy;

            // Avoid division by zero
            if (distanceSquared < 0.01) return Math.log(1 + 200);

            // Yat = (dot)² / dist², then log transform
            const yat = (dotProduct * dotProduct) / distanceSquared;
            return Math.log(1 + yat);
        }

        // Isometric 3D projection with zoom
        function project(x, y, z) {
            const cosR = Math.cos(rotationAngle);
            const sinR = Math.sin(rotationAngle);

            // Rotate around Y axis
            const rx = x * cosR - y * sinR;
            const ry = x * sinR + y * cosR;

            // Apply tilt, z, and zoom
            const screenX = rx * zoomLevel;
            const screenY = (ry * tiltAngle + z) * zoomLevel;

            return { x: screenX, y: screenY };
        }

        // Hover state
        let hoverPoint = null;

        function drawManifold() {
            const w = canvasField.getBoundingClientRect().width;
            const h = canvasField.getBoundingClientRect().height;
            const cx = w / 2;
            const cy = h / 2 - 20;

            ctxField.clearRect(0, 0, w, h);

            // Manifold grid parameters
            const gridRes = 30;
            const baseSpacing = 12;
            const spacing = baseSpacing;

            // First pass: compute all Yat values to find max for adaptive scaling
            let maxYat = 0.01;
            const yatGrid = [];
            for (let i = 0; i <= gridRes; i++) {
                yatGrid[i] = [];
                for (let j = 0; j <= gridRes; j++) {
                    const worldX = (j - gridRes / 2) * spacing;
                    const worldY = (i - gridRes / 2) * spacing;
                    const yat = computeYat(worldX, worldY);
                    yatGrid[i][j] = yat;
                    if (yat > maxYat) maxYat = yat;
                }
            }

            // Adaptive depth: scale so max Yat produces a good visual depth
            const targetMaxDepth = 80;
            const wellDepth = targetMaxDepth / Math.max(maxYat, 0.1);

            // Build the height map using pre-computed Yat values
            const heights = [];
            for (let i = 0; i <= gridRes; i++) {
                heights[i] = [];
                for (let j = 0; j <= gridRes; j++) {
                    const worldX = (j - gridRes / 2) * spacing;
                    const worldY = (i - gridRes / 2) * spacing;
                    const yat = yatGrid[i][j];
                    const depth = Math.min(yat * wellDepth, 120);

                    heights[i][j] = {
                        worldX, worldY, depth,
                        yat: yat
                    };
                }
            }

            // Draw grid lines that follow the curved surface
            // Horizontal lines (rows)
            for (let i = 0; i <= gridRes; i++) {
                ctxField.beginPath();
                let maxDepth = 0;

                for (let j = 0; j <= gridRes; j++) {
                    const h = heights[i][j];
                    const p = project(h.worldX, h.worldY, h.depth);

                    if (j === 0) {
                        ctxField.moveTo(cx + p.x, cy + p.y);
                    } else {
                        ctxField.lineTo(cx + p.x, cy + p.y);
                    }
                    maxDepth = Math.max(maxDepth, h.depth);
                }

                const intensity = Math.min(maxDepth / 80, 1);
                const hue = 175 - intensity * 20;
                const light = 30 + intensity * 25;
                ctxField.strokeStyle = `hsla(${hue}, 60%, ${light}%, ${0.4 + intensity * 0.3})`;
                ctxField.lineWidth = 1;
                ctxField.stroke();
            }

            // Vertical lines (columns)
            for (let j = 0; j <= gridRes; j++) {
                ctxField.beginPath();
                let maxDepth = 0;

                for (let i = 0; i <= gridRes; i++) {
                    const h = heights[i][j];
                    const p = project(h.worldX, h.worldY, h.depth);

                    if (i === 0) {
                        ctxField.moveTo(cx + p.x, cy + p.y);
                    } else {
                        ctxField.lineTo(cx + p.x, cy + p.y);
                    }
                    maxDepth = Math.max(maxDepth, h.depth);
                }

                const intensity = Math.min(maxDepth / 80, 1);
                const hue = 175 - intensity * 20;
                const light = 30 + intensity * 25;
                ctxField.strokeStyle = `hsla(${hue}, 60%, ${light}%, ${0.4 + intensity * 0.3})`;
                ctxField.lineWidth = 1;
                ctxField.stroke();
            }

            // Draw the anchor at the bottom of its well
            const anchorDepth = Math.min(computeYat(anchorVec.x, anchorVec.y) * wellDepth, 120);
            const anchorScreen = project(anchorVec.x, anchorVec.y, anchorDepth);

            // Glow
            const grad = ctxField.createRadialGradient(
                cx + anchorScreen.x, cy + anchorScreen.y, 0,
                cx + anchorScreen.x, cy + anchorScreen.y, 25
            );
            grad.addColorStop(0, 'rgba(230, 126, 163, 0.9)');
            grad.addColorStop(0.5, 'rgba(230, 126, 163, 0.4)');
            grad.addColorStop(1, 'rgba(230, 126, 163, 0)');
            ctxField.beginPath();
            ctxField.arc(cx + anchorScreen.x, cy + anchorScreen.y, 25, 0, Math.PI * 2);
            ctxField.fillStyle = grad;
            ctxField.fill();

            // Anchor point
            ctxField.beginPath();
            ctxField.arc(cx + anchorScreen.x, cy + anchorScreen.y, 5, 0, Math.PI * 2);
            ctxField.fillStyle = '#e67ea3';
            ctxField.fill();
            ctxField.strokeStyle = '#fff';
            ctxField.lineWidth = 2;
            ctxField.stroke();

            // Legend
            ctxField.fillStyle = 'rgba(0,0,0,0.75)';
            ctxField.fillRect(12, 12, 200, 55);
            ctxField.strokeStyle = 'rgba(255,255,255,0.2)';
            ctxField.strokeRect(12, 12, 200, 55);

            ctxField.font = 'bold 11px "Courier New", monospace';
            ctxField.fillStyle = '#e67ea3';
            ctxField.fillText('Yat = (x·y)² / ||x-y||²', 22, 30);
            ctxField.font = '10px "Courier New", monospace';
            ctxField.fillStyle = '#aaa';
            ctxField.fillText('High Yat → gravity well (linear)', 22, 45);
            ctxField.fillText('Low Yat → flat space (independent)', 22, 58);

            // Draw hover info if we have a hover point
            if (hoverPoint) {
                const hx = hoverPoint.worldX;
                const hy = hoverPoint.worldY;

                // Calculate raw Yat (before log)
                const ax = anchorVec.x, ay = anchorVec.y;
                const dotP = ax * hx + ay * hy;
                const dxx = hx - ax, dyy = hy - ay;
                const distSq = dxx * dxx + dyy * dyy;
                const rawYat = distSq < 0.01 ? 999 : (dotP * dotP) / distSq;
                const logYat = Math.log(1 + rawYat);

                // Draw hover point marker
                const hp = project(hx, hy, logYat * wellDepth);
                ctxField.beginPath();
                ctxField.arc(cx + hp.x, cy + hp.y, 4, 0, Math.PI * 2);
                ctxField.fillStyle = '#fff';
                ctxField.fill();

                // Hover tooltip
                const tooltipX = w - 180;
                ctxField.fillStyle = 'rgba(0,0,0,0.85)';
                ctxField.fillRect(tooltipX, 12, 168, 70);
                ctxField.strokeStyle = '#e67ea3';
                ctxField.lineWidth = 1;
                ctxField.strokeRect(tooltipX, 12, 168, 70);

                ctxField.font = 'bold 10px "Courier New", monospace';
                ctxField.fillStyle = '#1b998b';
                ctxField.fillText('HOVER POINT', tooltipX + 10, 28);

                ctxField.font = '10px "Courier New", monospace';
                ctxField.fillStyle = '#ddd';
                ctxField.fillText(`Position: (${hx.toFixed(0)}, ${hy.toFixed(0)})`, tooltipX + 10, 44);
                ctxField.fillText(`Yat: ${rawYat.toFixed(2)}`, tooltipX + 10, 58);
                ctxField.fillStyle = '#888';
                ctxField.fillText(`log(1+Yat): ${logYat.toFixed(3)}`, tooltipX + 10, 72);
            }
        }

        // Drag to rotate
        let isDragging = false;
        canvasField.addEventListener('mousedown', () => isDragging = true);
        canvasField.addEventListener('mouseup', () => isDragging = false);
        canvasField.addEventListener('mouseleave', () => {
            isDragging = false;
            hoverPoint = null;
            drawManifold();
        });

        canvasField.addEventListener('mousemove', (e) => {
            const rect = canvasField.getBoundingClientRect();
            const mx = (e.clientX - rect.left - rect.width / 2) / zoomLevel;
            const my = (e.clientY - rect.top - rect.height / 2 + 20) / zoomLevel;

            // Inverse projection to get world coordinates
            const cosR = Math.cos(-rotationAngle);
            const sinR = Math.sin(-rotationAngle);
            const worldX = mx * cosR - (my / tiltAngle) * sinR;
            const worldY = mx * sinR + (my / tiltAngle) * cosR;

            if (isDragging) {
                rotationAngle += e.movementX * 0.008;
                hoverPoint = null;
            } else {
                // Update hover point
                hoverPoint = { worldX, worldY };
            }
            drawManifold();
        });

        // Click to move anchor
        canvasField.addEventListener('click', (e) => {
            const rect = canvasField.getBoundingClientRect();
            const mx = (e.clientX - rect.left - rect.width / 2) / zoomLevel;
            const my = (e.clientY - rect.top - rect.height / 2 + 20) / zoomLevel;

            // Inverse projection (approximate)
            const cosR = Math.cos(-rotationAngle);
            const sinR = Math.sin(-rotationAngle);
            const worldX = mx * cosR - (my / tiltAngle) * sinR;
            const worldY = mx * sinR + (my / tiltAngle) * cosR;

            anchorVec.x = Math.max(-150, Math.min(150, worldX));
            anchorVec.y = Math.max(-150, Math.min(150, worldY));
            drawManifold();
        });

        resizeField();
        drawManifold();
        window.addEventListener('resize', () => { resizeField(); drawManifold(); });

        // Button controls
        document.getElementById('viz-zoom-in')?.addEventListener('click', () => {
            zoomLevel = Math.min(zoomLevel * 1.3, 3.0);
            drawManifold();
        });

        document.getElementById('viz-zoom-out')?.addEventListener('click', () => {
            zoomLevel = Math.max(zoomLevel / 1.3, 0.3);
            drawManifold();
        });

        document.getElementById('viz-rotate-left')?.addEventListener('click', () => {
            rotationAngle -= 0.3;
            drawManifold();
        });

        document.getElementById('viz-rotate-right')?.addEventListener('click', () => {
            rotationAngle += 0.3;
            drawManifold();
        });

        document.getElementById('viz-reset')?.addEventListener('click', () => {
            rotationAngle = 0.5;
            zoomLevel = 1.0;
            anchorVec = { x: 80, y: 60 };
            if (autoRotate) {
                autoRotate = false;
                if (autoRotateId) cancelAnimationFrame(autoRotateId);
                document.getElementById('viz-auto-rotate').style.background = 'rgba(100,100,100,0.3)';
            }
            drawManifold();
        });

        document.getElementById('viz-auto-rotate')?.addEventListener('click', function () {
            autoRotate = !autoRotate;
            this.style.background = autoRotate ? 'rgba(27,153,139,0.5)' : 'rgba(100,100,100,0.3)';

            if (autoRotate) {
                function animate() {
                    if (!autoRotate) return;
                    rotationAngle += 0.015;
                    drawManifold();
                    autoRotateId = requestAnimationFrame(animate);
                }
                animate();
            } else {
                if (autoRotateId) cancelAnimationFrame(autoRotateId);
            }
        });
    }

    // ===============================
    // Visualization 6: Entropy & Orthogonality
    // ===============================
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

    // ===============================
    // Visualization 7: High-Dimensional Blessing
    // ===============================
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

    // ===============================
    // Visualization 8: Yat Similarity Matrix
    // ===============================
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

    // ===============================
    // Visualization 9: Metric Comparison (Euclidean vs Cosine vs Yat)
    // ===============================
    const canvasCompare = document.getElementById('viz-metric-compare');
    if (canvasCompare) {
        const ctxC = canvasCompare.getContext('2d');
        let anchor = { x: 0.6, y: 0.5 }; // Normalized 0-1

        function resizeCompare() {
            const rect = canvasCompare.getBoundingClientRect();
            canvasCompare.width = rect.width * window.devicePixelRatio;
            canvasCompare.height = rect.height * window.devicePixelRatio;
            ctxC.scale(window.devicePixelRatio, window.devicePixelRatio);
        }

        function drawMetricComparison() {
            const w = canvasCompare.getBoundingClientRect().width;
            const h = canvasCompare.getBoundingClientRect().height;

            ctxC.clearRect(0, 0, w, h);

            const panelW = (w - 40) / 3;
            const panelH = h - 60;
            const panelY = 40;
            const resolution = 40; // Grid resolution for each panel

            const metrics = [
                {
                    name: 'Euclidean Distance',
                    compute: (ax, ay, px, py) => {
                        const dist = Math.sqrt((px - ax) ** 2 + (py - ay) ** 2);
                        return Math.max(0, 1 - dist / 2); // Invert: close = high
                    },
                    color: '#f4a261'
                },
                {
                    name: 'Cosine Similarity',
                    compute: (ax, ay, px, py) => {
                        const magA = Math.sqrt(ax * ax + ay * ay);
                        const magP = Math.sqrt(px * px + py * py);
                        if (magA < 0.01 || magP < 0.01) return 0.5;
                        const dot = ax * px + ay * py;
                        const cos = dot / (magA * magP);
                        return (cos + 1) / 2; // Normalize -1..1 to 0..1
                    },
                    color: '#9b5de5'
                },
                {
                    name: 'Yat',
                    compute: (ax, ay, px, py) => {
                        const dot = ax * px + ay * py;
                        const distSq = (px - ax) ** 2 + (py - ay) ** 2;
                        if (distSq < 0.01) return 1;
                        const yat = (dot * dot) / distSq;
                        return Math.min(1, yat / 5); // Normalize
                    },
                    color: '#1b998b'
                }
            ];

            // Convert anchor from 0-1 to coordinate space (-1.5 to 1.5)
            const anchorX = (anchor.x - 0.5) * 3;
            const anchorY = (anchor.y - 0.5) * 3;

            metrics.forEach((metric, mIdx) => {
                const panelX = 15 + mIdx * (panelW + 5);

                // Draw panel background
                ctxC.fillStyle = 'rgba(0, 0, 0, 0.4)';
                ctxC.fillRect(panelX, panelY, panelW, panelH);

                // Draw heatmap
                const cellW = panelW / resolution;
                const cellH = panelH / resolution;

                for (let i = 0; i < resolution; i++) {
                    for (let j = 0; j < resolution; j++) {
                        // Map grid cell to coordinate space
                        const px = ((i + 0.5) / resolution - 0.5) * 3;
                        const py = ((j + 0.5) / resolution - 0.5) * 3;

                        const value = metric.compute(anchorX, anchorY, px, py);

                        // Color based on value
                        const hue = mIdx === 0 ? 30 : mIdx === 1 ? 270 : 170;
                        const light = 15 + value * 50;
                        const sat = 40 + value * 40;

                        ctxC.fillStyle = `hsl(${hue}, ${sat}%, ${light}%)`;
                        ctxC.fillRect(
                            panelX + i * cellW,
                            panelY + j * cellH,
                            cellW + 0.5,
                            cellH + 0.5
                        );
                    }
                }

                // Draw anchor point
                const anchorPxX = panelX + anchor.x * panelW;
                const anchorPxY = panelY + anchor.y * panelH;
                ctxC.beginPath();
                ctxC.arc(anchorPxX, anchorPxY, 6, 0, Math.PI * 2);
                ctxC.fillStyle = '#fff';
                ctxC.fill();
                ctxC.strokeStyle = metric.color;
                ctxC.lineWidth = 2;
                ctxC.stroke();

                // Draw origin marker
                const originX = panelX + 0.5 * panelW;
                const originY = panelY + 0.5 * panelH;
                ctxC.strokeStyle = 'rgba(255,255,255,0.3)';
                ctxC.lineWidth = 1;
                ctxC.beginPath();
                ctxC.moveTo(originX - 8, originY);
                ctxC.lineTo(originX + 8, originY);
                ctxC.moveTo(originX, originY - 8);
                ctxC.lineTo(originX, originY + 8);
                ctxC.stroke();

                // Panel label
                ctxC.fillStyle = metric.color;
                ctxC.font = 'bold 11px "Courier New", monospace';
                ctxC.fillText(metric.name, panelX + 5, panelY + panelH + 15);

                // What it measures
                ctxC.fillStyle = COLORS.dim;
                ctxC.font = '9px "Courier New", monospace';
                const desc = mIdx === 0 ? '(distance only)' : mIdx === 1 ? '(angle only)' : '(angle + distance)';
                ctxC.fillText(desc, panelX + 5, panelY + panelH + 28);
            });

            // Legend at top
            ctxC.fillStyle = COLORS.light;
            ctxC.font = 'bold 12px "Courier New", monospace';
            ctxC.fillText('Anchor Point: white dot', 15, 25);
            ctxC.fillStyle = COLORS.dim;
            ctxC.font = '10px "Courier New", monospace';
            ctxC.fillText('Brighter = higher similarity/lower distance', w - 250, 25);
        }

        canvasCompare.addEventListener('click', (e) => {
            const rect = canvasCompare.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const panelW = (rect.width - 40) / 3;

            // Determine which panel was clicked
            let panelIdx = -1;
            for (let i = 0; i < 3; i++) {
                const panelX = 15 + i * (panelW + 5);
                if (x >= panelX && x <= panelX + panelW) {
                    panelIdx = i;
                    break;
                }
            }

            if (panelIdx >= 0) {
                const panelX = 15 + panelIdx * (panelW + 5);
                anchor.x = Math.max(0, Math.min(1, (x - panelX) / panelW));
                anchor.y = Math.max(0, Math.min(1, (e.clientY - rect.top - 40) / (rect.height - 60)));
                drawMetricComparison();
            }
        });

        resizeCompare();
        drawMetricComparison();
        window.addEventListener('resize', () => { resizeCompare(); drawMetricComparison(); });
    }
});
