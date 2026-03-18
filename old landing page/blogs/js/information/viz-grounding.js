import { COLORS, drawText } from './common.js';

/**
 * Visualization: Symbol Grounding Problem
 * Shows floating symbols vs grounded concepts
 */
export function initVizGrounding() {
    const canvas = document.getElementById('viz-grounding');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let time = 0;

    function resize() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    // Floating ungrounded symbols
    const symbols = [
        { word: 'cat', x: 0.2, y: 0.3 },
        { word: 'feline', x: 0.35, y: 0.5 },
        { word: 'meow', x: 0.15, y: 0.6 },
        { word: 'whiskers', x: 0.3, y: 0.75 }
    ];

    function draw() {
        const w = canvas.getBoundingClientRect().width;
        const h = canvas.getBoundingClientRect().height;

        // Background
        const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.6);
        bgGrad.addColorStop(0, '#1a1a2e');
        bgGrad.addColorStop(1, '#0d0d15');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        const dividerX = w * 0.5;

        // Divider line
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(dividerX, 40);
        ctx.lineTo(dividerX, h - 40);
        ctx.stroke();
        ctx.setLineDash([]);

        // Left side: Ungrounded symbols (floating)
        drawText(ctx, 'Ungrounded Symbols', w * 0.25, 25, { color: '#666', size: 10 });

        symbols.forEach((sym, i) => {
            const floatOffset = Math.sin(time * 0.02 + i * 0.8) * 10;
            const x = sym.x * w;
            const y = sym.y * h + floatOffset;

            // Draw floating word with question marks
            ctx.fillStyle = 'rgba(237, 33, 124, 0.15)';
            ctx.beginPath();
            ctx.arc(x, y, 30, 0, Math.PI * 2);
            ctx.fill();

            drawText(ctx, `"${sym.word}"`, x, y + 4, { color: COLORS.secondary, size: 12 });

            // Draw connection lines between words (statistical associations)
            if (i > 0) {
                const prev = symbols[i - 1];
                const prevY = prev.y * h + Math.sin(time * 0.02 + (i - 1) * 0.8) * 10;
                ctx.strokeStyle = 'rgba(237, 33, 124, 0.2)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(prev.x * w, prevY);
                ctx.lineTo(x, y);
                ctx.stroke();
            }
        });

        // Right side: Grounded concept
        drawText(ctx, 'Grounded Meaning', w * 0.75, 25, { color: '#666', size: 10 });

        const groundedX = w * 0.75;
        const groundedY = h * 0.45;

        // Physical reality circle (stable, not floating)
        const pulseRadius = 50 + Math.sin(time * 0.03) * 5;

        // Outer glow
        const glow = ctx.createRadialGradient(groundedX, groundedY, 0, groundedX, groundedY, pulseRadius + 20);
        glow.addColorStop(0, 'rgba(27, 153, 139, 0.4)');
        glow.addColorStop(0.7, 'rgba(27, 153, 139, 0.1)');
        glow.addColorStop(1, 'rgba(27, 153, 139, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(groundedX, groundedY, pulseRadius + 20, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = COLORS.primary;
        ctx.beginPath();
        ctx.arc(groundedX, groundedY, pulseRadius, 0, Math.PI * 2);
        ctx.fill();

        // Cat representation (simplified)
        ctx.fillStyle = '#0d0d15';
        // Ears
        ctx.beginPath();
        ctx.moveTo(groundedX - 25, groundedY - 15);
        ctx.lineTo(groundedX - 15, groundedY - 35);
        ctx.lineTo(groundedX - 5, groundedY - 15);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(groundedX + 5, groundedY - 15);
        ctx.lineTo(groundedX + 15, groundedY - 35);
        ctx.lineTo(groundedX + 25, groundedY - 15);
        ctx.fill();
        // Face
        ctx.beginPath();
        ctx.arc(groundedX, groundedY, 20, 0, Math.PI * 2);
        ctx.fill();
        // Eyes
        ctx.fillStyle = COLORS.accent;
        ctx.beginPath();
        ctx.arc(groundedX - 8, groundedY - 5, 4, 0, Math.PI * 2);
        ctx.arc(groundedX + 8, groundedY - 5, 4, 0, Math.PI * 2);
        ctx.fill();

        // Labels pointing to grounded concept
        const labels = ['text', 'image', 'sound', 'touch'];
        labels.forEach((label, i) => {
            const angle = (i / labels.length) * Math.PI * 2 - Math.PI / 2;
            const labelR = 90;
            const labelX = groundedX + Math.cos(angle) * labelR;
            const labelY = groundedY + Math.sin(angle) * labelR;

            ctx.strokeStyle = 'rgba(27, 153, 139, 0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(groundedX + Math.cos(angle) * (pulseRadius + 5), groundedY + Math.sin(angle) * (pulseRadius + 5));
            ctx.lineTo(labelX, labelY);
            ctx.stroke();

            drawText(ctx, label, labelX, labelY + 15, { color: COLORS.dim, size: 9 });
        });

        // Bottom labels
        drawText(ctx, 'Statistical correlations only', w * 0.25, h - 20, { color: '#555', size: 9 });
        drawText(ctx, 'Anchored to physical reality', w * 0.75, h - 20, { color: '#555', size: 9 });

        time++;
        requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener('resize', () => { resize(); });
}
