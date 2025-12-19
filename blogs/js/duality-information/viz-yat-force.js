import { COLORS, randomVector, dot, euclideanDist, yat, magnitude } from './common.js';

export function initVizYatForce() {
    const canvas = document.getElementById('viz-yat-force');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrame;
    let time = 0;
    let isDragging = null;

    // Two atoms with their vectors
    let atoms = [
        { x: 0.3, y: 0.5, vector: randomVector(12, 1) },
        { x: 0.7, y: 0.5, vector: randomVector(12, 1) }
    ];

    function resize() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    function drawAtom(cx, cy, vector, label) {
        const maxMag = Math.max(...vector.map(Math.abs));

        // Nucleus glow
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 50);
        glow.addColorStop(0, 'rgba(27, 153, 139, 0.5)');
        glow.addColorStop(0.5, 'rgba(27, 153, 139, 0.1)');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, 50, 0, Math.PI * 2);
        ctx.fill();

        // Nucleus
        ctx.fillStyle = COLORS.primary;
        ctx.beginPath();
        ctx.arc(cx, cy, 15, 0, Math.PI * 2);
        ctx.fill();

        // Label
        ctx.fillStyle = COLORS.light;
        ctx.font = 'bold 14px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(label, cx, cy + 5);

        // Particles
        for (let i = 0; i < vector.length; i++) {
            const val = vector[i];
            const normalizedMag = Math.abs(val) / maxMag;
            const radius = 25 + normalizedMag * 35;
            const angle = (i / vector.length) * Math.PI * 2 + time * 0.3;

            const px = cx + Math.cos(angle) * radius;
            const py = cy + Math.sin(angle) * radius;

            const color = val > 0.1 ? COLORS.proton : (val < -0.1 ? COLORS.electron : COLORS.neutral);
            const size = 3 + normalizedMag * 4;

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();
        }
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

        // Calculate positions
        const a1 = { x: atoms[0].x * w, y: atoms[0].y * h };
        const a2 = { x: atoms[1].x * w, y: atoms[1].y * h };

        // Calculate Yat
        const yatValue = yat(atoms[0].vector, atoms[1].vector);
        const dotValue = dot(atoms[0].vector, atoms[1].vector);
        const distValue = euclideanDist(atoms[0].vector, atoms[1].vector);

        // Draw force field lines between atoms
        const numLines = 8;
        const yatNorm = Math.min(yatValue / 10, 1);

        for (let i = 0; i < numLines; i++) {
            const offset = ((i / numLines) - 0.5) * 60;
            const perpX = -(a2.y - a1.y);
            const perpY = a2.x - a1.x;
            const perpLen = Math.sqrt(perpX * perpX + perpY * perpY);

            if (perpLen > 0) {
                const nx = perpX / perpLen;
                const ny = perpY / perpLen;

                const p1x = a1.x + nx * offset;
                const p1y = a1.y + ny * offset;
                const p2x = a2.x + nx * offset;
                const p2y = a2.y + ny * offset;

                // Animate the field lines
                const phase = time * 2 + i * 0.5;
                const alpha = (0.2 + yatNorm * 0.5) * (0.5 + 0.5 * Math.sin(phase));

                const gradient = ctx.createLinearGradient(p1x, p1y, p2x, p2y);
                gradient.addColorStop(0, `rgba(27, 153, 139, ${alpha})`);
                gradient.addColorStop(0.5, `rgba(237, 33, 124, ${alpha})`);
                gradient.addColorStop(1, `rgba(27, 153, 139, ${alpha})`);

                ctx.strokeStyle = gradient;
                ctx.lineWidth = 1 + yatNorm * 2;
                ctx.beginPath();
                ctx.moveTo(p1x, p1y);

                // Curved line
                const midX = (p1x + p2x) / 2;
                const midY = (p1y + p2y) / 2 + Math.sin(phase) * 20 * yatNorm;
                ctx.quadraticCurveTo(midX, midY, p2x, p2y);
                ctx.stroke();
            }
        }

        // Draw atoms
        drawAtom(a1.x, a1.y, atoms[0].vector, 'A');
        drawAtom(a2.x, a2.y, atoms[1].vector, 'B');

        // Yat meter
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(w / 2 - 100, 15, 200, 75);
        ctx.strokeStyle = COLORS.primary;
        ctx.lineWidth = 2;
        ctx.strokeRect(w / 2 - 100, 15, 200, 75);

        ctx.font = '12px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = COLORS.primary;
        ctx.fillText('YAT FORCE', w / 2, 35);

        ctx.font = 'bold 22px "Courier New", monospace';
        ctx.fillStyle = COLORS.accent;
        ctx.fillText(isFinite(yatValue) ? yatValue.toFixed(2) : '∞', w / 2, 60);

        ctx.font = '10px "Courier New", monospace';
        ctx.fillStyle = COLORS.dim;
        ctx.fillText(`dot: ${dotValue.toFixed(2)} | dist: ${distValue.toFixed(2)}`, w / 2, 80);

        // Interpretation
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(15, h - 40, 180, 28);
        ctx.font = '11px "Courier New", monospace';
        ctx.textAlign = 'left';
        const interpretation = yatValue > 5 ? 'Strong attraction' :
            yatValue > 1 ? 'Moderate force' :
                yatValue > 0.1 ? 'Weak interaction' : 'Near independence';
        ctx.fillStyle = yatValue > 1 ? COLORS.primary : COLORS.dim;
        ctx.fillText(interpretation, 25, h - 22);

        time += 0.02;
        animationFrame = requestAnimationFrame(draw);
    }

    function getAtomAt(x, y) {
        const w = canvas.getBoundingClientRect().width;
        const h = canvas.getBoundingClientRect().height;

        for (let i = 0; i < atoms.length; i++) {
            const ax = atoms[i].x * w;
            const ay = atoms[i].y * h;
            const dist = Math.sqrt((x - ax) ** 2 + (y - ay) ** 2);
            if (dist < 60) return i;
        }
        return null;
    }

    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        isDragging = getAtomAt(x, y);
    });

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (isDragging !== null) {
            atoms[isDragging].x = x / rect.width;
            atoms[isDragging].y = y / rect.height;
        }

        canvas.style.cursor = getAtomAt(x, y) !== null ? 'grab' : 'crosshair';
    });

    canvas.addEventListener('mouseup', () => isDragging = null);
    canvas.addEventListener('mouseleave', () => isDragging = null);

    resize();
    draw();
    window.addEventListener('resize', resize);
}
