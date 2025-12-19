import { COLORS, randomVector, yat, clamp } from './common.js';

export function initVizNetwork() {
    const canvas = document.getElementById('viz-network');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrame;
    let time = 0;
    let isDragging = null;
    let hoveredNode = null;
    let hoveredEdge = null;

    // Create nodes with vectors
    const numNodes = 7;
    let nodes = [];

    function initNodes() {
        const w = canvas.getBoundingClientRect().width;
        const h = canvas.getBoundingClientRect().height;

        nodes = [];
        for (let i = 0; i < numNodes; i++) {
            const angle = (i / numNodes) * Math.PI * 2 - Math.PI / 2;
            const radius = Math.min(w, h) * 0.3;
            nodes.push({
                x: w / 2 + Math.cos(angle) * radius + (Math.random() - 0.5) * 50,
                y: h / 2 + Math.sin(angle) * radius + (Math.random() - 0.5) * 50,
                vector: randomVector(16, 1),
                label: String.fromCharCode(65 + i)
            });
        }
    }

    function resize() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        if (nodes.length === 0) initNodes();
    }

    function draw() {
        const w = canvas.getBoundingClientRect().width;
        const h = canvas.getBoundingClientRect().height;

        ctx.clearRect(0, 0, w, h);

        // Draw grid
        ctx.strokeStyle = COLORS.grid;
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = 0; y < h; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        // Calculate all Yat values
        const edges = [];
        let maxYat = 0;
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const y = yat(nodes[i].vector, nodes[j].vector);
                if (isFinite(y)) {
                    maxYat = Math.max(maxYat, y);
                    edges.push({ i, j, yat: y });
                }
            }
        }

        // Draw edges
        for (const edge of edges) {
            const n1 = nodes[edge.i];
            const n2 = nodes[edge.j];
            const normYat = clamp(edge.yat / Math.max(maxYat, 1), 0, 1);

            const isHovered = hoveredEdge &&
                ((hoveredEdge.i === edge.i && hoveredEdge.j === edge.j) ||
                    (hoveredEdge.i === edge.j && hoveredEdge.j === edge.i));

            // Line thickness and opacity based on Yat
            ctx.strokeStyle = isHovered ? COLORS.accent :
                `rgba(27, 153, 139, ${0.1 + normYat * 0.7})`;
            ctx.lineWidth = 1 + normYat * 4;

            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();

            // Show Yat value on hover
            if (isHovered) {
                const midX = (n1.x + n2.x) / 2;
                const midY = (n1.y + n2.y) / 2;

                ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
                ctx.fillRect(midX - 35, midY - 12, 70, 24);
                ctx.strokeStyle = COLORS.accent;
                ctx.lineWidth = 1;
                ctx.strokeRect(midX - 35, midY - 12, 70, 24);

                ctx.font = '11px "Courier New", monospace';
                ctx.fillStyle = COLORS.accent;
                ctx.textAlign = 'center';
                ctx.fillText(`Yat: ${edge.yat.toFixed(2)}`, midX, midY + 4);
            }
        }

        // Draw nodes
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const isHovered = hoveredNode === i;

            // Glow
            const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, 40);
            glow.addColorStop(0, isHovered ? 'rgba(237, 33, 124, 0.4)' : 'rgba(27, 153, 139, 0.3)');
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(node.x, node.y, 40, 0, Math.PI * 2);
            ctx.fill();

            // Node circle
            ctx.fillStyle = isHovered ? COLORS.accent : COLORS.primary;
            ctx.beginPath();
            ctx.arc(node.x, node.y, 22, 0, Math.PI * 2);
            ctx.fill();

            // Mini particles inside
            const maxMag = Math.max(...node.vector.map(Math.abs));
            for (let p = 0; p < Math.min(node.vector.length, 8); p++) {
                const val = node.vector[p];
                const pAngle = (p / 8) * Math.PI * 2 + time * 0.5;
                const pRadius = 10 + (Math.abs(val) / maxMag) * 6;
                const px = node.x + Math.cos(pAngle) * pRadius;
                const py = node.y + Math.sin(pAngle) * pRadius;

                ctx.fillStyle = val > 0 ? COLORS.proton : (val < 0 ? COLORS.electron : COLORS.neutral);
                ctx.globalAlpha = 0.7;
                ctx.beginPath();
                ctx.arc(px, py, 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }

            // Label
            ctx.fillStyle = COLORS.light;
            ctx.font = 'bold 14px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(node.label, node.x, node.y + 5);
        }

        // Instructions
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(15, 15, 160, 30);
        ctx.font = '10px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = COLORS.dim;
        ctx.fillText('Drag nodes • Hover edges', 25, 35);

        time += 0.02;
        animationFrame = requestAnimationFrame(draw);
    }

    function getNodeAt(x, y) {
        for (let i = 0; i < nodes.length; i++) {
            const dist = Math.sqrt((x - nodes[i].x) ** 2 + (y - nodes[i].y) ** 2);
            if (dist < 25) return i;
        }
        return null;
    }

    function getEdgeAt(x, y) {
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const n1 = nodes[i];
                const n2 = nodes[j];

                // Check distance to line segment
                const dx = n2.x - n1.x;
                const dy = n2.y - n1.y;
                const len = Math.sqrt(dx * dx + dy * dy);
                const t = clamp(((x - n1.x) * dx + (y - n1.y) * dy) / (len * len), 0, 1);
                const projX = n1.x + t * dx;
                const projY = n1.y + t * dy;
                const dist = Math.sqrt((x - projX) ** 2 + (y - projY) ** 2);

                if (dist < 10) return { i, j };
            }
        }
        return null;
    }

    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        isDragging = getNodeAt(x, y);
    });

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (isDragging !== null) {
            nodes[isDragging].x = clamp(x, 30, rect.width - 30);
            nodes[isDragging].y = clamp(y, 30, rect.height - 30);
        }

        hoveredNode = getNodeAt(x, y);
        hoveredEdge = hoveredNode === null ? getEdgeAt(x, y) : null;

        canvas.style.cursor = hoveredNode !== null ? 'grab' : (hoveredEdge !== null ? 'pointer' : 'crosshair');
    });

    canvas.addEventListener('mouseup', () => isDragging = null);
    canvas.addEventListener('mouseleave', () => {
        isDragging = null;
        hoveredNode = null;
        hoveredEdge = null;
    });

    resize();
    draw();
    window.addEventListener('resize', resize);
}
