import { COLORS, randomVector } from './common.js';

export function initVizParticleAtom() {
    const canvas = document.getElementById('viz-particle-atom');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrame;
    let time = 0;
    let hoveredParticle = null;

    // Particle trails
    const trails = [];
    const maxTrailLength = 8;

    // Generate a sample vector with 24 dimensions
    let vector = randomVector(24, 1.5);

    // Utility function
    const hexToRgba = (hex, alpha) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    function resize() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    function getParticlePositions() {
        const w = canvas.getBoundingClientRect().width;
        const h = canvas.getBoundingClientRect().height;
        const cx = w / 2;
        const cy = h / 2;

        const particles = [];
        const maxMag = Math.max(...vector.map(Math.abs));

        for (let i = 0; i < vector.length; i++) {
            const val = vector[i];
            const normalizedMag = Math.abs(val) / maxMag;

            // Multiple orbital shells based on magnitude
            const shell = Math.floor(normalizedMag * 3);
            const baseRadius = 50 + shell * 45;
            const speedMultiplier = 0.3 - shell * 0.08;
            const angle = (i / vector.length) * Math.PI * 2 + time * speedMultiplier;

            // Slight elliptical wobble
            const wobbleX = Math.sin(time * 1.5 + i * 0.7) * 8;
            const wobbleY = Math.cos(time * 1.2 + i * 0.5) * 5;

            const x = cx + Math.cos(angle) * baseRadius + wobbleX;
            const y = cy + Math.sin(angle) * baseRadius * 0.85 + wobbleY;

            // Determine charge type
            let type, color;
            if (val > 0.1) {
                type = 'proton';
                color = COLORS.proton;
            } else if (val < -0.1) {
                type = 'electron';
                color = COLORS.electron;
            } else {
                type = 'neutral';
                color = COLORS.neutral;
            }

            // Size based on magnitude
            const size = 5 + normalizedMag * 10;

            particles.push({ x, y, type, color, size, value: val, dim: i, shell });
        }

        return particles;
    }

    function draw() {
        const w = canvas.getBoundingClientRect().width;
        const h = canvas.getBoundingClientRect().height;
        const cx = w / 2;
        const cy = h / 2;

        ctx.clearRect(0, 0, w, h);

        // Background radial glow
        const bgGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 180);
        bgGlow.addColorStop(0, 'rgba(27, 153, 139, 0.08)');
        bgGlow.addColorStop(0.5, 'rgba(27, 153, 139, 0.02)');
        bgGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = bgGlow;
        ctx.fillRect(0, 0, w, h);

        // Draw orbital rings with gradient
        for (let shell = 0; shell < 4; shell++) {
            const radius = 50 + shell * 45;
            const alpha = 0.15 - shell * 0.03;

            ctx.strokeStyle = `rgba(27, 153, 139, ${alpha})`;
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 6]);
            ctx.beginPath();
            ctx.ellipse(cx, cy, radius, radius * 0.85, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Draw nucleus with multiple layers
        // Outer glow
        const nucleusGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 40);
        nucleusGlow.addColorStop(0, 'rgba(27, 153, 139, 0.6)');
        nucleusGlow.addColorStop(0.5, 'rgba(27, 153, 139, 0.2)');
        nucleusGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = nucleusGlow;
        ctx.beginPath();
        ctx.arc(cx, cy, 40, 0, Math.PI * 2);
        ctx.fill();

        // Inner nucleus with pulsing effect
        const pulseSize = 18 + Math.sin(time * 3) * 2;
        const nucleusGrad = ctx.createRadialGradient(cx - 3, cy - 3, 0, cx, cy, pulseSize);
        nucleusGrad.addColorStop(0, '#2dd4bf');
        nucleusGrad.addColorStop(0.7, COLORS.primary);
        nucleusGrad.addColorStop(1, '#0d6058');
        ctx.fillStyle = nucleusGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, pulseSize, 0, Math.PI * 2);
        ctx.fill();

        // Nucleus highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.ellipse(cx - 5, cy - 5, 6, 4, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

        // Get particles and update trails
        const particles = getParticlePositions();

        // Update trails
        if (trails.length < vector.length) {
            for (let i = 0; i < vector.length; i++) {
                trails.push([]);
            }
        }

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            trails[i].unshift({ x: p.x, y: p.y });
            if (trails[i].length > maxTrailLength) trails[i].pop();
        }

        // Draw particle trails
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            const trail = trails[i];

            if (trail.length > 1) {
                for (let t = 1; t < trail.length; t++) {
                    const alpha = (1 - t / trail.length) * 0.3;
                    const size = p.size * (1 - t / trail.length) * 0.6;

                    ctx.fillStyle = hexToRgba(p.color, alpha);
                    ctx.beginPath();
                    ctx.arc(trail[t].x, trail[t].y, size, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        // Draw particles
        for (const p of particles) {
            const isHovered = hoveredParticle === p.dim;

            // Outer glow
            const glowSize = isHovered ? p.size * 3.5 : p.size * 2.5;
            const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);
            glow.addColorStop(0, hexToRgba(p.color, isHovered ? 0.8 : 0.5));
            glow.addColorStop(0.4, hexToRgba(p.color, 0.2));
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
            ctx.fill();

            // Particle core with gradient
            const coreGrad = ctx.createRadialGradient(p.x - p.size * 0.3, p.y - p.size * 0.3, 0, p.x, p.y, p.size);
            coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
            coreGrad.addColorStop(0.3, p.color);
            coreGrad.addColorStop(1, hexToRgba(p.color, 0.8));
            ctx.fillStyle = coreGrad;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();

            // Highlight if hovered
            if (isHovered) {
                ctx.strokeStyle = COLORS.light;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size + 6, 0, Math.PI * 2);
                ctx.stroke();

                // Connection line to nucleus
                ctx.strokeStyle = hexToRgba(p.color, 0.3);
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(p.x, p.y);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }

        // Info panel with gradient border
        const panelX = 15, panelY = 15, panelW = 210, panelH = 110;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(panelX, panelY, panelW, panelH);

        const panelGrad = ctx.createLinearGradient(panelX, panelY, panelX + panelW, panelY + panelH);
        panelGrad.addColorStop(0, COLORS.proton);
        panelGrad.addColorStop(0.5, COLORS.primary);
        panelGrad.addColorStop(1, COLORS.electron);
        ctx.strokeStyle = panelGrad;
        ctx.lineWidth = 2;
        ctx.strokeRect(panelX, panelY, panelW, panelH);

        ctx.font = 'bold 12px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = COLORS.light;
        ctx.fillText(`Vector ∈ ℝ${vector.length}`, panelX + 15, panelY + 22);

        ctx.font = '11px "Courier New", monospace';
        const protonCount = vector.filter(v => v > 0.1).length;
        const electronCount = vector.filter(v => v < -0.1).length;
        const neutralCount = vector.filter(v => Math.abs(v) <= 0.1).length;

        ctx.fillStyle = COLORS.proton;
        ctx.fillText(`● Protons (v > 0): ${protonCount}`, panelX + 15, panelY + 42);
        ctx.fillStyle = COLORS.electron;
        ctx.fillText(`● Electrons (v < 0): ${electronCount}`, panelX + 15, panelY + 58);
        ctx.fillStyle = COLORS.neutral;
        ctx.fillText(`● Neutral (v ≈ 0): ${neutralCount}`, panelX + 15, panelY + 74);

        if (hoveredParticle !== null) {
            const p = particles[hoveredParticle];
            ctx.fillStyle = COLORS.light;
            ctx.fillText(`→ d${p.dim + 1} = ${p.value.toFixed(4)}`, panelX + 15, panelY + 98);
        } else {
            ctx.fillStyle = COLORS.dim;
            ctx.fillText('Hover particles for details', panelX + 15, panelY + 98);
        }

        // Bottom instruction
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(w - 175, h - 40, 160, 28);
        ctx.strokeStyle = COLORS.grid;
        ctx.lineWidth = 1;
        ctx.strokeRect(w - 175, h - 40, 160, 28);
        ctx.font = '10px "Courier New", monospace';
        ctx.fillStyle = COLORS.primary;
        ctx.textAlign = 'center';
        ctx.fillText('Click to generate new atom', w - 95, h - 22);

        time += 0.012;
        animationFrame = requestAnimationFrame(draw);
    }

    function handleMouseMove(e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const particles = getParticlePositions();
        hoveredParticle = null;

        for (const p of particles) {
            const dist = Math.sqrt((x - p.x) ** 2 + (y - p.y) ** 2);
            if (dist < p.size + 8) {
                hoveredParticle = p.dim;
                break;
            }
        }

        canvas.style.cursor = hoveredParticle !== null ? 'pointer' : 'crosshair';
    }

    function handleClick() {
        vector = randomVector(24, 1.5);
        // Reset trails
        for (let i = 0; i < trails.length; i++) {
            trails[i] = [];
        }
    }

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

    resize();
    draw();
    window.addEventListener('resize', resize);
}
