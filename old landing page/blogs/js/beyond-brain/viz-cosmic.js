import { COLORS, drawText } from './common.js';

/**
 * Visualization: Cosmic Scale of Computation
 * Shows the universe's computational power vs human brain - dramatic scale comparison
 */
export function initVizCosmic() {
    const canvas = document.getElementById('viz-cosmic');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let time = 0;

    function resize() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    // Star field
    const stars = Array.from({ length: 150 }, () => ({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 1.5 + 0.3,
        twinkleSpeed: Math.random() * 0.02 + 0.01,
        twinkleOffset: Math.random() * Math.PI * 2
    }));

    // Galaxies
    const galaxies = Array.from({ length: 8 }, () => ({
        x: Math.random() * 0.6 + 0.05,
        y: Math.random() * 0.8 + 0.1,
        size: Math.random() * 15 + 8,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.002
    }));

    function draw() {
        const w = canvas.getBoundingClientRect().width;
        const h = canvas.getBoundingClientRect().height;

        // Deep space background with subtle gradient
        const bgGrad = ctx.createRadialGradient(w * 0.3, h * 0.5, 0, w * 0.3, h * 0.5, w);
        bgGrad.addColorStop(0, '#0a0815');
        bgGrad.addColorStop(0.5, '#050510');
        bgGrad.addColorStop(1, '#020208');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Draw distant stars
        stars.forEach(star => {
            const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.4 + 0.6;
            ctx.fillStyle = `rgba(255, 255, 255, ${twinkle * 0.7})`;
            ctx.beginPath();
            ctx.arc(star.x * w * 0.65, star.y * h, star.size, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw mini galaxies
        galaxies.forEach(g => {
            g.rotation += g.rotationSpeed;
            const gx = g.x * w;
            const gy = g.y * h;

            ctx.save();
            ctx.translate(gx, gy);
            ctx.rotate(g.rotation);

            // Spiral arms
            ctx.strokeStyle = 'rgba(27, 153, 139, 0.15)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let t = 0; t < Math.PI * 3; t += 0.1) {
                const r = (t / (Math.PI * 3)) * g.size;
                const x = Math.cos(t) * r;
                const y = Math.sin(t) * r * 0.4;
                if (t === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Core
            ctx.fillStyle = 'rgba(27, 153, 139, 0.3)';
            ctx.beginPath();
            ctx.arc(0, 0, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });

        // ═══════════════════════════════════════════════════════════════
        // LEFT: THE UNIVERSE
        // ═══════════════════════════════════════════════════════════════

        const universeX = w * 0.32;
        const universeY = h * 0.48;
        const maxRadius = Math.min(w * 0.28, h * 0.38);

        // Cosmic web structure (large scale)
        ctx.strokeStyle = 'rgba(27, 153, 139, 0.08)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 12; i++) {
            const angle1 = (i / 12) * Math.PI * 2 + time * 0.002;
            const angle2 = ((i + 5) / 12) * Math.PI * 2 + time * 0.002;
            ctx.beginPath();
            ctx.moveTo(
                universeX + Math.cos(angle1) * maxRadius * 0.3,
                universeY + Math.sin(angle1) * maxRadius * 0.3
            );
            ctx.quadraticCurveTo(
                universeX + Math.cos((angle1 + angle2) / 2) * maxRadius * 0.8,
                universeY + Math.sin((angle1 + angle2) / 2) * maxRadius * 0.8,
                universeX + Math.cos(angle2) * maxRadius * 0.5,
                universeY + Math.sin(angle2) * maxRadius * 0.5
            );
            ctx.stroke();
        }

        // Expanding rings (universe expansion)
        for (let r = 0; r < 4; r++) {
            const ringProgress = ((time * 0.5 + r * 40) % 160) / 160;
            const ringRadius = maxRadius * ringProgress;
            const alpha = 0.15 * (1 - ringProgress);

            ctx.strokeStyle = `rgba(27, 153, 139, ${alpha})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(universeX, universeY, ringRadius, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Central glow
        const universeGlow = ctx.createRadialGradient(
            universeX, universeY, 0,
            universeX, universeY, maxRadius * 0.5
        );
        universeGlow.addColorStop(0, 'rgba(27, 153, 139, 0.4)');
        universeGlow.addColorStop(0.5, 'rgba(27, 153, 139, 0.15)');
        universeGlow.addColorStop(1, 'rgba(27, 153, 139, 0)');
        ctx.fillStyle = universeGlow;
        ctx.beginPath();
        ctx.arc(universeX, universeY, maxRadius * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Universe stats
        drawText(ctx, 'THE UNIVERSE', universeX, h * 0.08, { color: COLORS.primary, size: 12 });

        // Stats with visual hierarchy
        const statsY = h * 0.88;
        ctx.fillStyle = 'rgba(27, 153, 139, 0.2)';
        ctx.fillRect(universeX - 70, statsY - 28, 140, 55);

        drawText(ctx, '13.8 BILLION', universeX, statsY - 10, { color: COLORS.primary, size: 11 });
        drawText(ctx, 'years of computation', universeX, statsY + 5, { color: '#666', size: 8 });
        drawText(ctx, '10⁸⁰ particles', universeX, statsY + 20, { color: '#555', size: 8 });

        // ═══════════════════════════════════════════════════════════════
        // RIGHT: THE HUMAN BRAIN (tiny by comparison)
        // ═══════════════════════════════════════════════════════════════

        const brainX = w * 0.82;
        const brainY = h * 0.48;
        const brainSize = 25;

        // Isolation circle (emphasize how small)
        ctx.strokeStyle = 'rgba(237, 33, 124, 0.15)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(brainX, brainY, 60, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Brain glow
        const brainGlow = ctx.createRadialGradient(
            brainX, brainY, 0,
            brainX, brainY, brainSize + 15
        );
        brainGlow.addColorStop(0, 'rgba(237, 33, 124, 0.3)');
        brainGlow.addColorStop(1, 'rgba(237, 33, 124, 0)');
        ctx.fillStyle = brainGlow;
        ctx.beginPath();
        ctx.arc(brainX, brainY, brainSize + 15, 0, Math.PI * 2);
        ctx.fill();

        // Brain shape (simplified)
        ctx.fillStyle = 'rgba(237, 33, 124, 0.25)';
        ctx.strokeStyle = COLORS.secondary;
        ctx.lineWidth = 2;

        // Main brain shape
        ctx.beginPath();
        ctx.arc(brainX, brainY, brainSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Brain folds
        ctx.strokeStyle = 'rgba(237, 33, 124, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(brainX - 5, brainY - 5, 12, 0.5, 2.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(brainX + 8, brainY + 3, 10, 3.5, 5.5);
        ctx.stroke();

        // Firing neurons (small)
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2 + time * 0.03;
            const nx = brainX + Math.cos(angle) * brainSize * 0.5;
            const ny = brainY + Math.sin(angle) * brainSize * 0.5;
            const pulse = Math.sin(time * 0.1 + i) * 0.5 + 0.5;

            ctx.fillStyle = `rgba(237, 33, 124, ${0.3 + pulse * 0.4})`;
            ctx.beginPath();
            ctx.arc(nx, ny, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Brain stats
        drawText(ctx, 'HUMAN BRAIN', brainX, h * 0.08, { color: COLORS.secondary, size: 12 });

        ctx.fillStyle = 'rgba(237, 33, 124, 0.15)';
        ctx.fillRect(brainX - 55, statsY - 28, 110, 55);

        drawText(ctx, '~5 MILLION', brainX, statsY - 10, { color: COLORS.secondary, size: 11 });
        drawText(ctx, 'years of evolution', brainX, statsY + 5, { color: '#666', size: 8 });
        drawText(ctx, '10¹¹ neurons', brainX, statsY + 20, { color: '#555', size: 8 });

        // ═══════════════════════════════════════════════════════════════
        // CENTER: Comparison
        // ═══════════════════════════════════════════════════════════════

        // VS indicator
        const vsX = w * 0.62;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.beginPath();
        ctx.arc(vsX, universeY, 20, 0, Math.PI * 2);
        ctx.fill();
        drawText(ctx, 'vs', vsX, universeY + 4, { color: '#555', size: 12 });

        // Arrow from universe to brain (showing scale)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(universeX + maxRadius * 0.5, universeY);
        ctx.lineTo(brainX - 70, brainY);
        ctx.stroke();

        // Scale comparison bar at bottom
        const barY = h - 18;
        const barStartX = w * 0.1;
        const barEndX = w * 0.55;

        // Universe bar (long)
        ctx.fillStyle = 'rgba(27, 153, 139, 0.4)';
        ctx.fillRect(barStartX, barY - 4, barEndX - barStartX, 8);

        // Brain bar (barely visible dot)
        ctx.fillStyle = COLORS.secondary;
        ctx.beginPath();
        ctx.arc(barStartX + 2, barY, 3, 0, Math.PI * 2);
        ctx.fill();

        drawText(ctx, 'Computational capacity (not to scale—brain would be invisible)', w * 0.35, barY - 12, { color: '#444', size: 7 });

        // Title and question
        drawText(ctx, 'WHICH SHOULD WE TAKE AS OUR MODEL?', w / 2, 18, { color: '#666', size: 10 });

        time++;
        requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener('resize', () => { resize(); });
}
