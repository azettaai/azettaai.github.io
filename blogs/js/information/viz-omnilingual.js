import { COLORS, drawText } from './common.js';

/**
 * Visualization: Primal Information and Its Shadows
 * Shows the concept as the source, with different modalities as shadows
 */
export function initVizOmnilingual() {
    const canvas = document.getElementById('viz-omnilingual');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let time = 0;

    function resize() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    // Shadows of the same primal concept
    const shadows = [
        { label: '"cat"', type: 'EN', color: COLORS.primary },
        { label: '"chat"', type: 'FR', color: COLORS.secondary },
        { label: '"gato"', type: 'ES', color: COLORS.accent },
        { label: '"猫"', type: 'ZH', color: COLORS.purple },
        { label: '🐱', type: 'emoji', color: COLORS.cyan }
    ];

    function draw() {
        const w = canvas.getBoundingClientRect().width;
        const h = canvas.getBoundingClientRect().height;

        // Background - cave wall effect
        ctx.fillStyle = '#0d0d15';
        ctx.fillRect(0, 0, w, h);

        // Add some cave texture
        for (let i = 0; i < 20; i++) {
            const tx = Math.random() * w;
            const ty = Math.random() * h;
            ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.02})`;
            ctx.beginPath();
            ctx.arc(tx, ty, Math.random() * 30 + 5, 0, Math.PI * 2);
            ctx.fill();
        }

        const sourceX = w / 2;
        const sourceY = h * 0.25;

        // The primal concept - the "form" 
        const pulseRadius = 35 + Math.sin(time * 0.04) * 4;

        // Light source emanating from concept
        const light = ctx.createRadialGradient(sourceX, sourceY, 0, sourceX, sourceY, h * 0.7);
        light.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
        light.addColorStop(0.3, 'rgba(255, 255, 255, 0.05)');
        light.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = light;
        ctx.fillRect(0, 0, w, h);

        // The primal information (the fire/source)
        const sourceGlow = ctx.createRadialGradient(sourceX, sourceY, 0, sourceX, sourceY, pulseRadius + 30);
        sourceGlow.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        sourceGlow.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
        sourceGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = sourceGlow;
        ctx.beginPath();
        ctx.arc(sourceX, sourceY, pulseRadius + 30, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(sourceX, sourceY, pulseRadius, 0, Math.PI * 2);
        ctx.fill();

        // Label for source
        ctx.fillStyle = '#0d0d15';
        ctx.font = 'bold 10px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PRIMAL', sourceX, sourceY - 5);
        ctx.fillText('CONCEPT', sourceX, sourceY + 8);

        // Draw rays of light projecting to shadows
        const wallY = h * 0.78;
        const shadowSpacing = w / (shadows.length + 1);

        shadows.forEach((shadow, i) => {
            const shadowX = shadowSpacing * (i + 1);
            const waveOffset = Math.sin(time * 0.02 + i * 0.5) * 8;

            // Light ray from source to shadow
            const grad = ctx.createLinearGradient(sourceX, sourceY, shadowX, wallY);
            grad.addColorStop(0, 'rgba(255,255,255,0.3)');
            grad.addColorStop(0.5, `${shadow.color}33`);
            grad.addColorStop(1, `${shadow.color}66`);

            ctx.strokeStyle = grad;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(sourceX, sourceY + pulseRadius);
            ctx.lineTo(shadowX, wallY - 20);
            ctx.stroke();

            // The shadow on the cave wall
            const shadowWidth = 50;
            const shadowHeight = 35 + waveOffset * 0.3;

            // Shadow glow
            ctx.fillStyle = `${shadow.color}22`;
            ctx.beginPath();
            ctx.ellipse(shadowX, wallY, shadowWidth + 10, shadowHeight + 5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Shadow body
            ctx.fillStyle = `${shadow.color}55`;
            ctx.beginPath();
            ctx.ellipse(shadowX, wallY, shadowWidth, shadowHeight, 0, 0, Math.PI * 2);
            ctx.fill();

            // Shadow label
            drawText(ctx, shadow.label, shadowX, wallY + 5, { color: shadow.color, size: 14 });
            drawText(ctx, shadow.type, shadowX, wallY + 22, { color: COLORS.dim, size: 8 });
        });

        // Cave wall line
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(20, wallY - 40);
        ctx.lineTo(w - 20, wallY - 40);
        ctx.stroke();

        drawText(ctx, '← Cave Wall (Observable Data) →', w / 2, wallY - 50, { color: '#444', size: 8 });

        // Title and insight
        drawText(ctx, 'One Concept, Many Shadows', w / 2, 18, { color: '#555', size: 10 });
        drawText(ctx, 'Languages are not data to translate—they are projections of the same source', w / 2, h - 12, { color: '#444', size: 8 });

        time++;
        requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener('resize', () => { resize(); });
}
