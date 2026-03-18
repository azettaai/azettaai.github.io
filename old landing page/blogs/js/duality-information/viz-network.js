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

    const hexToRgba = (hex, alpha) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    // Create nodes with vectors
    const numNodes = 8;
    let nodes = [];

    function initNodes() {
        const w = canvas.getBoundingClientRect().width;
        const h = canvas.getBoundingClientRect().height;

        nodes = [];
        for (let i = 0; i < numNodes; i++) {
            const angle = (i / numNodes) * Math.PI * 2 - Math.PI / 2;
            const radius = Math.min(w, h) * 0.28;
            nodes.push({
                x: w / 2 + Math.cos(angle) * radius + (Math.random() - 0.5) * 60,
                y: h / 2 + Math.sin(angle) * radius + (Math.random() - 0.5) * 40,
                vx: 0,
                vy: 0,
                vector: randomVector(16, 1),
                label: String.fromCharCode(65 + i),
                pulsePhase: Math.random() * Math.PI * 2
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

        // Background
        const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.5);
        bgGrad.addColorStop(0, 'rgba(27, 153, 139, 0.04)');
        bgGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Grid
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

        // Sort edges by yat for drawing order
        edges.sort((a, b) => a.yat - b.yat);

        // Draw edges
        for (const edge of edges) {
            const n1 = nodes[edge.i];
            const n2 = nodes[edge.j];
            const normYat = clamp(edge.yat / Math.max(maxYat, 1), 0, 1);

            const isHovered = hoveredEdge &&
                ((hoveredEdge.i === edge.i && hoveredEdge.j === edge.j) ||
                    (hoveredEdge.i === edge.j && hoveredEdge.j === edge.i));

            // Edge gradient
            const gradient = ctx.createLinearGradient(n1.x, n1.y, n2.x, n2.y);
            if (isHovered) {
                gradient.addColorStop(0, COLORS.accent);
                gradient.addColorStop(1, COLORS.accent);
            } else {
                gradient.addColorStop(0, hexToRgba(COLORS.primary, 0.1 + normYat * 0.6));
                gradient.addColorStop(0.5, hexToRgba(COLORS.accent, normYat * 0.4));
                gradient.addColorStop(1, hexToRgba(COLORS.wave, 0.1 + normYat * 0.6));
            }

            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1 + normYat * 5;
            ctx.lineCap = 'round';

            // Animated dash for weak connections
            if (normYat < 0.3) {
                ctx.setLineDash([4, 6]);
            } else {
                ctx.setLineDash([]);
            }

            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();
            ctx.setLineDash([]);

            // Animated particles along strong edges
            if (normYat > 0.5 && !isHovered) {
                const particleCount = Math.floor(normYat * 3);
                for (let p = 0; p < particleCount; p++) {
                    const t = ((time * 0.5 + p / particleCount) % 1);
                    const px = n1.x + (n2.x - n1.x) * t;
                    const py = n1.y + (n2.y - n1.y) * t;

                    ctx.fillStyle = hexToRgba(COLORS.accent, 0.6);
                    ctx.beginPath();
                    ctx.arc(px, py, 2 + normYat * 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Show Yat value on hover
            if (isHovered) {
                const midX = (n1.x + n2.x) / 2;
                const midY = (n1.y + n2.y) / 2;

                ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
                ctx.fillRect(midX - 45, midY - 15, 90, 30);
                ctx.strokeStyle = COLORS.accent;
                ctx.lineWidth = 2;
                ctx.strokeRect(midX - 45, midY - 15, 90, 30);

                ctx.font = 'bold 12px "Courier New", monospace';
                ctx.fillStyle = COLORS.accent;
                ctx.textAlign = 'center';
                ctx.fillText(`Yat: ${edge.yat.toFixed(2)}`, midX, midY + 5);
            }
        }

        // Draw nodes
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const isHovered = hoveredNode === i;
            const pulse = Math.sin(time * 2 + node.pulsePhase) * 0.1 + 1;

            // Glow
            const glowSize = (isHovered ? 55 : 45) * pulse;
            const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowSize);
            glow.addColorStop(0, isHovered ? hexToRgba(COLORS.accent, 0.5) : hexToRgba(COLORS.primary, 0.4));
            glow.addColorStop(0.6, isHovered ? hexToRgba(COLORS.accent, 0.1) : hexToRgba(COLORS.primary, 0.1));
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(node.x, node.y, glowSize, 0, Math.PI * 2);
            ctx.fill();

            // Node circle with gradient
            const nodeSize = (isHovered ? 28 : 24) * pulse;
            const nodeGrad = ctx.createRadialGradient(node.x - 5, node.y - 5, 0, node.x, node.y, nodeSize);
            nodeGrad.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
            nodeGrad.addColorStop(0.4, isHovered ? COLORS.accent : COLORS.primary);
            nodeGrad.addColorStop(1, isHovered ? hexToRgba(COLORS.accent, 0.7) : hexToRgba(COLORS.primary, 0.7));
            ctx.fillStyle = nodeGrad;
            ctx.beginPath();
            ctx.arc(node.x, node.y, nodeSize, 0, Math.PI * 2);
            ctx.fill();

            // Mini particles inside
            const maxMag = Math.max(...node.vector.map(Math.abs));
            for (let p = 0; p < Math.min(node.vector.length, 8); p++) {
                const val = node.vector[p];
                const pAngle = (p / 8) * Math.PI * 2 + time * 0.6;
                const pRadius = 12 + (Math.abs(val) / maxMag) * 8;
                const px = node.x + Math.cos(pAngle) * pRadius;
                const py = node.y + Math.sin(pAngle) * pRadius;

                ctx.fillStyle = val > 0 ? hexToRgba(COLORS.proton, 0.8) :
                    (val < 0 ? hexToRgba(COLORS.electron, 0.8) : hexToRgba(COLORS.neutral, 0.6));
                ctx.beginPath();
                ctx.arc(px, py, 2.5, 0, Math.PI * 2);
                ctx.fill();
            }

            // Label
            ctx.fillStyle = COLORS.light;
            ctx.font = 'bold 14px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(node.label, node.x, node.y);
        }

        // Instructions panel
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(15, 15, 200, 35);
        ctx.strokeStyle = COLORS.grid;
        ctx.lineWidth = 1;
        ctx.strokeRect(15, 15, 200, 35);
        ctx.font = '10px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = COLORS.dim;
        ctx.fillText('Drag nodes • Hover edges for Yat', 25, 38);

        // Legend
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(w - 135, h - 45, 120, 35);
        ctx.font = '9px "Courier New", monospace';
        ctx.fillStyle = COLORS.dim;
        ctx.textAlign = 'center';
        ctx.fillText('Line thickness = Yat', w - 75, h - 23);

        time += 0.018;
        animationFrame = requestAnimationFrame(draw);
    }

    function getNodeAt(x, y) {
        for (let i = 0; i < nodes.length; i++) {
            const dist = Math.sqrt((x - nodes[i].x) ** 2 + (y - nodes[i].y) ** 2);
            if (dist < 30) return i;
        }
        return null;
    }

    function getEdgeAt(x, y) {
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const n1 = nodes[i];
                const n2 = nodes[j];

                const dx = n2.x - n1.x;
                const dy = n2.y - n1.y;
                const len = Math.sqrt(dx * dx + dy * dy);
                const t = clamp(((x - n1.x) * dx + (y - n1.y) * dy) / (len * len), 0, 1);
                const projX = n1.x + t * dx;
                const projY = n1.y + t * dy;
                const dist = Math.sqrt((x - projX) ** 2 + (y - projY) ** 2);

                if (dist < 12) return { i, j };
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
            nodes[isDragging].x = clamp(x, 35, rect.width - 35);
            nodes[isDragging].y = clamp(y, 35, rect.height - 35);
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
