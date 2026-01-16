import { COLORS } from './common.js';

export function initVizYatField() {
    const canvasField = document.getElementById('viz-yat-field');
    if (canvasField) {
        const ctxField = canvasField.getContext('2d');
        let rotationAngle = 0.5;
        let tiltAngle = 0.6;
        let zoomLevel = 1.0;
        let autoRotate = false;
        let autoRotateId = null;

        // Multiple neurons (masses bending spacetime)
        const neuronColors = ['#e67ea3', '#1b998b', '#f9d71c', '#9b5de5', '#4deeea'];
        let neurons = [
            { x: 80, y: 60, color: neuronColors[0] }
        ];

        function resizeField() {
            const rect = canvasField.getBoundingClientRect();
            canvasField.width = rect.width * window.devicePixelRatio;
            canvasField.height = rect.height * window.devicePixelRatio;
            ctxField.scale(window.devicePixelRatio, window.devicePixelRatio);
        }

        // Compute YAT for a single neuron
        function computeSingleYat(pointX, pointY, neuron) {
            const dotProduct = neuron.x * pointX + neuron.y * pointY;
            const dx = pointX - neuron.x, dy = pointY - neuron.y;
            const distanceSquared = dx * dx + dy * dy;
            if (distanceSquared < 0.01) return 200;
            return (dotProduct * dotProduct) / distanceSquared;
        }

        // Find dominant neuron at a point (returns index and total yat)
        function getDominantNeuron(pointX, pointY) {
            let maxYat = 0, dominantIdx = 0, totalYat = 0;
            for (let i = 0; i < neurons.length; i++) {
                const yat = computeSingleYat(pointX, pointY, neurons[i]);
                totalYat += yat;
                if (yat > maxYat) {
                    maxYat = yat;
                    dominantIdx = i;
                }
            }
            return { idx: dominantIdx, total: Math.log(1 + totalYat), max: maxYat };
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

        function hexToRgba(hex, alpha) {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r},${g},${b},${alpha})`;
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
            const spacing = 12;

            // Compute grid data with dominant neuron info
            let maxYat = 0.01;
            const gridData = [];
            for (let i = 0; i <= gridRes; i++) {
                gridData[i] = [];
                for (let j = 0; j <= gridRes; j++) {
                    const worldX = (j - gridRes / 2) * spacing;
                    const worldY = (i - gridRes / 2) * spacing;
                    const result = getDominantNeuron(worldX, worldY);
                    gridData[i][j] = { worldX, worldY, ...result };
                    if (result.total > maxYat) maxYat = result.total;
                }
            }

            // Adaptive depth: scale so max Yat produces a good visual depth
            const targetMaxDepth = 80;
            const wellDepth = targetMaxDepth / Math.max(maxYat, 0.1);

            // Build height map with colors
            const heights = [];
            for (let i = 0; i <= gridRes; i++) {
                heights[i] = [];
                for (let j = 0; j <= gridRes; j++) {
                    const gd = gridData[i][j];
                    const depth = Math.min(gd.total * wellDepth, 120);
                    heights[i][j] = {
                        worldX: gd.worldX,
                        worldY: gd.worldY,
                        depth,
                        color: neurons[gd.idx].color,
                        intensity: Math.min(depth / 80, 1)
                    };
                }
            }

            // Draw horizontal grid lines with per-segment coloring
            for (let i = 0; i <= gridRes; i++) {
                for (let j = 0; j < gridRes; j++) {
                    const h1 = heights[i][j];
                    const h2 = heights[i][j + 1];
                    const p1 = project(h1.worldX, h1.worldY, h1.depth);
                    const p2 = project(h2.worldX, h2.worldY, h2.depth);

                    // Use the color of the point with higher intensity
                    const color = h1.intensity >= h2.intensity ? h1.color : h2.color;
                    const intensity = Math.max(h1.intensity, h2.intensity);

                    ctxField.beginPath();
                    ctxField.moveTo(cx + p1.x, cy + p1.y);
                    ctxField.lineTo(cx + p2.x, cy + p2.y);
                    ctxField.strokeStyle = hexToRgba(color, 0.3 + intensity * 0.5);
                    ctxField.lineWidth = 1;
                    ctxField.stroke();
                }
            }

            // Draw vertical grid lines with per-segment coloring
            for (let j = 0; j <= gridRes; j++) {
                for (let i = 0; i < gridRes; i++) {
                    const h1 = heights[i][j];
                    const h2 = heights[i + 1][j];
                    const p1 = project(h1.worldX, h1.worldY, h1.depth);
                    const p2 = project(h2.worldX, h2.worldY, h2.depth);

                    const color = h1.intensity >= h2.intensity ? h1.color : h2.color;
                    const intensity = Math.max(h1.intensity, h2.intensity);

                    ctxField.beginPath();
                    ctxField.moveTo(cx + p1.x, cy + p1.y);
                    ctxField.lineTo(cx + p2.x, cy + p2.y);
                    ctxField.strokeStyle = hexToRgba(color, 0.3 + intensity * 0.5);
                    ctxField.lineWidth = 1;
                    ctxField.stroke();
                }
            }

            // Draw all neurons at bottom of their wells
            for (let idx = 0; idx < neurons.length; idx++) {
                const n = neurons[idx];
                const dotP = n.x * n.x + n.y * n.y;
                const neuronDepth = Math.min(Math.log(1 + dotP * 10) * wellDepth, 120);
                const neuronScreen = project(n.x, n.y, neuronDepth);

                // Glow
                const grad = ctxField.createRadialGradient(
                    cx + neuronScreen.x, cy + neuronScreen.y, 0,
                    cx + neuronScreen.x, cy + neuronScreen.y, 25
                );
                grad.addColorStop(0, hexToRgba(n.color, 0.9));
                grad.addColorStop(0.5, hexToRgba(n.color, 0.4));
                grad.addColorStop(1, 'transparent');
                ctxField.beginPath();
                ctxField.arc(cx + neuronScreen.x, cy + neuronScreen.y, 25, 0, Math.PI * 2);
                ctxField.fillStyle = grad;
                ctxField.fill();

                // Neuron point
                ctxField.beginPath();
                ctxField.arc(cx + neuronScreen.x, cy + neuronScreen.y, 5, 0, Math.PI * 2);
                ctxField.fillStyle = n.color;
                ctxField.fill();
                ctxField.strokeStyle = '#fff';
                ctxField.lineWidth = 2;
                ctxField.stroke();

                // Label
                ctxField.font = '9px "Courier New", monospace';
                ctxField.fillStyle = hexToRgba(n.color, 0.9);
                ctxField.textAlign = 'center';
                ctxField.fillText('w' + (idx + 1), cx + neuronScreen.x, cy + neuronScreen.y + 18);
            }

            // Legend
            ctxField.fillStyle = 'rgba(0,0,0,0.75)';
            ctxField.fillRect(12, 12, 220, 55);
            ctxField.strokeStyle = 'rgba(255,255,255,0.2)';
            ctxField.strokeRect(12, 12, 220, 55);

            ctxField.font = 'bold 11px "Courier New", monospace';
            ctxField.fillStyle = '#e67ea3';
            ctxField.textAlign = 'left';
            ctxField.fillText('Yat = Σ (x·wᵢ)² / ||x-wᵢ||²', 22, 30);
            ctxField.font = '10px "Courier New", monospace';
            ctxField.fillStyle = '#aaa';
            ctxField.fillText('Click to add neurons (up to 5)', 22, 45);
            ctxField.fillText(`Neurons: ${neurons.length}/5`, 22, 58);

            // Draw hover info if we have a hover point
            if (hoverPoint) {
                const hx = hoverPoint.worldX;
                const hy = hoverPoint.worldY;

                // Calculate combined Yat
                const result = getDominantNeuron(hx, hy);
                const rawTotal = Math.exp(result.total) - 1;

                // Draw hover point marker
                const hp = project(hx, hy, result.total * wellDepth);
                ctxField.beginPath();
                ctxField.arc(cx + hp.x, cy + hp.y, 4, 0, Math.PI * 2);
                ctxField.fillStyle = '#fff';
                ctxField.fill();

                // Hover tooltip
                const tooltipX = w - 180;
                ctxField.fillStyle = 'rgba(0,0,0,0.85)';
                ctxField.fillRect(tooltipX, 12, 168, 70);
                ctxField.strokeStyle = neurons[result.idx].color;
                ctxField.lineWidth = 1;
                ctxField.strokeRect(tooltipX, 12, 168, 70);

                ctxField.font = 'bold 10px "Courier New", monospace';
                ctxField.fillStyle = neurons[result.idx].color;
                ctxField.textAlign = 'left';
                ctxField.fillText(`DOMINANT: w${result.idx + 1}`, tooltipX + 10, 28);

                ctxField.font = '10px "Courier New", monospace';
                ctxField.fillStyle = '#ddd';
                ctxField.fillText(`Position: (${hx.toFixed(0)}, ${hy.toFixed(0)})`, tooltipX + 10, 44);
                ctxField.fillText(`Total Yat: ${rawTotal.toFixed(2)}`, tooltipX + 10, 58);
                ctxField.fillStyle = '#888';
                ctxField.fillText(`log(1+Yat): ${result.total.toFixed(3)}`, tooltipX + 10, 72);
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

        // Click to add/remove neurons
        canvasField.addEventListener('click', (e) => {
            const rect = canvasField.getBoundingClientRect();
            const mx = (e.clientX - rect.left - rect.width / 2) / zoomLevel;
            const my = (e.clientY - rect.top - rect.height / 2 + 20) / zoomLevel;

            // Inverse projection (approximate)
            const cosR = Math.cos(-rotationAngle);
            const sinR = Math.sin(-rotationAngle);
            const worldX = mx * cosR - (my / tiltAngle) * sinR;
            const worldY = mx * sinR + (my / tiltAngle) * cosR;

            // Check if clicking on existing neuron to remove
            for (let i = 0; i < neurons.length; i++) {
                const dx = neurons[i].x - worldX;
                const dy = neurons[i].y - worldY;
                if (Math.sqrt(dx * dx + dy * dy) < 25 && neurons.length > 1) {
                    neurons.splice(i, 1);
                    drawManifold();
                    return;
                }
            }

            // Add new neuron if under limit
            if (neurons.length < 5) {
                const clampedX = Math.max(-150, Math.min(150, worldX));
                const clampedY = Math.max(-150, Math.min(150, worldY));
                neurons.push({
                    x: clampedX,
                    y: clampedY,
                    color: neuronColors[neurons.length % neuronColors.length]
                });
            }
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
            neurons = [{ x: 80, y: 60, color: neuronColors[0] }];
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
}
