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
}
