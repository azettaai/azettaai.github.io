import { COLORS } from './common.js';

export function initVizMetricCompare() {
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
}
