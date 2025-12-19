import { COLORS, randomVector, magnitude, clamp } from './common.js';

export function initVizParticleAtom() {
    const canvas = document.getElementById('viz-particle-atom');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrame;
    let time = 0;
    let hoveredParticle = null;

    // Generate a sample vector with 24 dimensions
    let vector = randomVector(24, 1.5);

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

            // Radius based on magnitude (larger values = outer orbits)
            const baseRadius = 40 + normalizedMag * 100;
            const angle = (i / vector.length) * Math.PI * 2 + time * (0.2 + normalizedMag * 0.3);

            // Slight wobble
            const wobble = Math.sin(time * 2 + i) * 5;
            const radius = baseRadius + wobble;

            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius;

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
            const size = 6 + normalizedMag * 8;

            particles.push({ x, y, type, color, size, value: val, dim: i });
        }

        return particles;
    }

    function draw() {
        const w = canvas.getBoundingClientRect().width;
        const h = canvas.getBoundingClientRect().height;
        const cx = w / 2;
        const cy = h / 2;

        ctx.clearRect(0, 0, w, h);

        // Draw orbital rings
        ctx.strokeStyle = COLORS.grid;
        ctx.lineWidth = 1;
        for (let r = 60; r <= 160; r += 40) {
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Draw nucleus
        const nucleusGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 25);
        nucleusGradient.addColorStop(0, 'rgba(27, 153, 139, 0.8)');
        nucleusGradient.addColorStop(0.7, 'rgba(27, 153, 139, 0.3)');
        nucleusGradient.addColorStop(1, 'rgba(27, 153, 139, 0)');
        ctx.fillStyle = nucleusGradient;
        ctx.beginPath();
        ctx.arc(cx, cy, 25, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = COLORS.primary;
        ctx.beginPath();
        ctx.arc(cx, cy, 12, 0, Math.PI * 2);
        ctx.fill();

        // Draw particles
        const particles = getParticlePositions();

        for (const p of particles) {
            // Glow effect - convert hex to rgba for transparency
            const hexToRgba = (hex, alpha) => {
                const r = parseInt(hex.slice(1, 3), 16);
                const g = parseInt(hex.slice(3, 5), 16);
                const b = parseInt(hex.slice(5, 7), 16);
                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
            };
            const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
            glow.addColorStop(0, p.color);
            glow.addColorStop(0.5, hexToRgba(p.color, 0.4));
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
            ctx.fill();

            // Particle core
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();

            // Highlight if hovered
            if (hoveredParticle === p.dim) {
                ctx.strokeStyle = COLORS.light;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size + 4, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        // Info panel
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(15, 15, 200, 95);
        ctx.strokeStyle = COLORS.grid;
        ctx.strokeRect(15, 15, 200, 95);

        ctx.font = '11px "Courier New", monospace';
        ctx.fillStyle = COLORS.light;
        ctx.fillText(`Dimensions: ${vector.length}`, 30, 35);

        ctx.fillStyle = COLORS.proton;
        ctx.fillText(`● Protons: ${vector.filter(v => v > 0.1).length}`, 30, 52);
        ctx.fillStyle = COLORS.electron;
        ctx.fillText(`● Electrons: ${vector.filter(v => v < -0.1).length}`, 30, 69);
        ctx.fillStyle = COLORS.neutral;
        ctx.fillText(`● Neutral: ${vector.filter(v => Math.abs(v) <= 0.1).length}`, 30, 86);

        if (hoveredParticle !== null) {
            const p = particles[hoveredParticle];
            ctx.fillStyle = COLORS.light;
            ctx.fillText(`d${p.dim + 1}: ${p.value.toFixed(3)} (${p.type})`, 30, 103);
        }

        // Legend
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(w - 155, h - 45, 140, 35);
        ctx.font = '10px "Courier New", monospace';
        ctx.fillStyle = COLORS.dim;
        ctx.fillText('Click for new vector', w - 145, h - 25);

        time += 0.015;
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
            if (dist < p.size + 5) {
                hoveredParticle = p.dim;
                break;
            }
        }

        canvas.style.cursor = hoveredParticle !== null ? 'pointer' : 'crosshair';
    }

    function handleClick() {
        vector = randomVector(24, 1.5);
    }

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

    resize();
    draw();
    window.addEventListener('resize', resize);
}
