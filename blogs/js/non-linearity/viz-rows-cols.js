import { COLORS } from './common.js';

export function initVizRowsCols() {
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
}
