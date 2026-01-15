/**
 * YAT Manifold Visualization
 * A 3D curved surface showing how the YAT metric creates gravity-well-like
 * deformations in representation space. Supports multiple neurons.
 * 
 * ⵟ(x,w) = (x·w)² / ||x-w||² + ε
 */
(function initYatManifold() {
    const canvas = document.getElementById('yat-viz-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let w, h;
    let rotationAngle = 0.5;
    let tiltAngle = 0.6;

    // Multiple neurons (masses bending spacetime)
    const neuronColors = ['#4ff975', '#4deeea', '#f9d71c', '#f038ff', '#ed217c'];
    let neurons = [
        { x: 80, y: 60, color: neuronColors[0] }
    ];

    function resize() {
        const rect = canvas.getBoundingClientRect();
        w = rect.width;
        h = rect.height;
        canvas.width = w * window.devicePixelRatio;
        canvas.height = h * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    // Compute combined YAT from all neurons
    // ⵟ = Σ (x·w_i)² / ||x-w_i||²
    function computeTotalYat(pointX, pointY) {
        let totalYat = 0;
        for (const n of neurons) {
            const dotProduct = n.x * pointX + n.y * pointY;
            const dx = pointX - n.x, dy = pointY - n.y;
            const distanceSquared = dx * dx + dy * dy;
            if (distanceSquared < 0.01) {
                totalYat += 200;
            } else {
                totalYat += (dotProduct * dotProduct) / distanceSquared;
            }
        }
        return Math.log(1 + totalYat);
    }

    // Isometric 3D projection
    function project(x, y, z) {
        const cosR = Math.cos(rotationAngle);
        const sinR = Math.sin(rotationAngle);
        const rx = x * cosR - y * sinR;
        const ry = x * sinR + y * cosR;
        return { x: rx, y: ry * tiltAngle + z };
    }

    function hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    }

    function draw() {
        ctx.clearRect(0, 0, w, h);
        const cx = w / 2, cy = h / 2 - 10;

        // Grid parameters
        const gridRes = 25;
        const spacing = 10;

        // Compute Yat values and find max
        let maxYat = 0.01;
        const yatGrid = [];
        for (let i = 0; i <= gridRes; i++) {
            yatGrid[i] = [];
            for (let j = 0; j <= gridRes; j++) {
                const worldX = (j - gridRes / 2) * spacing;
                const worldY = (i - gridRes / 2) * spacing;
                const yat = computeTotalYat(worldX, worldY);
                yatGrid[i][j] = yat;
                if (yat > maxYat) maxYat = yat;
            }
        }

        const wellDepth = 70 / Math.max(maxYat, 0.1);

        // Build height map
        const heights = [];
        for (let i = 0; i <= gridRes; i++) {
            heights[i] = [];
            for (let j = 0; j <= gridRes; j++) {
                const worldX = (j - gridRes / 2) * spacing;
                const worldY = (i - gridRes / 2) * spacing;
                const depth = Math.min(yatGrid[i][j] * wellDepth, 100);
                heights[i][j] = { worldX, worldY, depth };
            }
        }

        // Draw horizontal grid lines
        for (let i = 0; i <= gridRes; i++) {
            ctx.beginPath();
            let maxD = 0;
            for (let j = 0; j <= gridRes; j++) {
                const ht = heights[i][j];
                const p = project(ht.worldX, ht.worldY, ht.depth);
                if (j === 0) ctx.moveTo(cx + p.x, cy + p.y);
                else ctx.lineTo(cx + p.x, cy + p.y);
                maxD = Math.max(maxD, ht.depth);
            }
            const intensity = Math.min(maxD / 70, 1);
            ctx.strokeStyle = `hsla(145, 80%, ${30 + intensity * 30}%, ${0.3 + intensity * 0.4})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Draw vertical grid lines
        for (let j = 0; j <= gridRes; j++) {
            ctx.beginPath();
            let maxD = 0;
            for (let i = 0; i <= gridRes; i++) {
                const ht = heights[i][j];
                const p = project(ht.worldX, ht.worldY, ht.depth);
                if (i === 0) ctx.moveTo(cx + p.x, cy + p.y);
                else ctx.lineTo(cx + p.x, cy + p.y);
                maxD = Math.max(maxD, ht.depth);
            }
            const intensity = Math.min(maxD / 70, 1);
            ctx.strokeStyle = `hsla(145, 80%, ${30 + intensity * 30}%, ${0.3 + intensity * 0.4})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Draw all neurons at bottom of their wells
        for (let idx = 0; idx < neurons.length; idx++) {
            const n = neurons[idx];

            // Compute single neuron contribution for depth
            const dotP = n.x * n.x + n.y * n.y;
            const neuronDepth = Math.min(Math.log(1 + dotP * 10) * wellDepth, 100);
            const neuronScreen = project(n.x, n.y, neuronDepth);

            // Glow
            const grad = ctx.createRadialGradient(
                cx + neuronScreen.x, cy + neuronScreen.y, 0,
                cx + neuronScreen.x, cy + neuronScreen.y, 18
            );
            grad.addColorStop(0, hexToRgba(n.color, 0.9));
            grad.addColorStop(0.5, hexToRgba(n.color, 0.3));
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cx + neuronScreen.x, cy + neuronScreen.y, 18, 0, Math.PI * 2);
            ctx.fill();

            // Neuron point
            ctx.beginPath();
            ctx.arc(cx + neuronScreen.x, cy + neuronScreen.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = n.color;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Label
            ctx.font = '8px monospace';
            ctx.fillStyle = hexToRgba(n.color, 0.8);
            ctx.textAlign = 'center';
            ctx.fillText('w' + (idx + 1), cx + neuronScreen.x, cy + neuronScreen.y + 14);
        }

        // Formula and neuron count
        ctx.font = '9px monospace';
        ctx.fillStyle = 'rgba(79, 249, 117, 0.6)';
        ctx.textAlign = 'left';
        ctx.fillText('ⵟ = Σ (x·wᵢ)² / ||x-wᵢ||²', 10, h - 10);

        ctx.textAlign = 'right';
        ctx.fillText(`neurons: ${neurons.length}/5`, w - 10, h - 10);

        // Auto-rotate
        rotationAngle += 0.003;
        requestAnimationFrame(draw);
    }

    // Click to add/remove neurons
    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left - w / 2;
        const my = e.clientY - rect.top - h / 2 + 10;
        const cosR = Math.cos(-rotationAngle);
        const sinR = Math.sin(-rotationAngle);
        const worldX = mx * cosR - (my / tiltAngle) * sinR;
        const worldY = mx * sinR + (my / tiltAngle) * cosR;

        // Check if clicking on existing neuron to remove
        for (let i = 0; i < neurons.length; i++) {
            const dx = neurons[i].x - worldX;
            const dy = neurons[i].y - worldY;
            if (Math.sqrt(dx * dx + dy * dy) < 20 && neurons.length > 1) {
                neurons.splice(i, 1);
                return;
            }
        }

        // Add new neuron if under limit
        if (neurons.length < 5) {
            const clampedX = Math.max(-120, Math.min(120, worldX));
            const clampedY = Math.max(-120, Math.min(120, worldY));
            neurons.push({
                x: clampedX,
                y: clampedY,
                color: neuronColors[neurons.length % neuronColors.length]
            });
        }
    });

    window.addEventListener('resize', resize);
    resize();
    draw();
})();
