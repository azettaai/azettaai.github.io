import { COLORS, drawText } from './common.js';

/**
 * Visualization: Physics Optimization Principles
 * Shows how physics computes optimal solutions: light, water, soap bubbles, pendulum
 */
export function initVizOptimization() {
    const canvas = document.getElementById('viz-optimization');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let time = 0;

    function resize() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    // Water droplets
    const droplets = [];
    for (let i = 0; i < 8; i++) {
        droplets.push({
            progress: Math.random(),
            speed: 0.008 + Math.random() * 0.004,
            xOffset: (Math.random() - 0.5) * 30
        });
    }

    function draw() {
        const w = canvas.getBoundingClientRect().width;
        const h = canvas.getBoundingClientRect().height;

        // Background
        ctx.fillStyle = '#0d0d15';
        ctx.fillRect(0, 0, w, h);

        // Two panels
        const leftX = w * 0.25;
        const rightX = w * 0.75;
        const panelTop = h * 0.18;
        const panelBottom = h * 0.82;

        // ═══════════════════════════════════════════════════════════════
        // LEFT PANEL: Light - Fermat's Principle
        // ═══════════════════════════════════════════════════════════════

        // Light source
        const lightSourceX = leftX - 60;
        const lightSourceY = panelTop + 20;

        // Source glow
        const sourceGlow = ctx.createRadialGradient(lightSourceX, lightSourceY, 0, lightSourceX, lightSourceY, 25);
        sourceGlow.addColorStop(0, 'rgba(255, 220, 100, 0.8)');
        sourceGlow.addColorStop(0.5, 'rgba(255, 220, 100, 0.3)');
        sourceGlow.addColorStop(1, 'rgba(255, 220, 100, 0)');
        ctx.fillStyle = sourceGlow;
        ctx.beginPath();
        ctx.arc(lightSourceX, lightSourceY, 25, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffdc64';
        ctx.beginPath();
        ctx.arc(lightSourceX, lightSourceY, 8, 0, Math.PI * 2);
        ctx.fill();

        // Medium boundary (air to glass)
        const boundaryY = (panelTop + panelBottom) / 2;

        // Air region
        ctx.fillStyle = 'rgba(100, 150, 255, 0.05)';
        ctx.fillRect(leftX - 80, panelTop, 160, boundaryY - panelTop);

        // Glass region (denser)
        ctx.fillStyle = 'rgba(100, 200, 255, 0.12)';
        ctx.fillRect(leftX - 80, boundaryY, 160, panelBottom - boundaryY);

        // Boundary line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(leftX - 80, boundaryY);
        ctx.lineTo(leftX + 80, boundaryY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Target point
        const targetX = leftX + 60;
        const targetY = panelBottom - 30;

        ctx.fillStyle = 'rgba(255, 220, 100, 0.2)';
        ctx.beginPath();
        ctx.arc(targetX, targetY, 12, 0, Math.PI * 2);
        ctx.fill();

        // Optimal refraction point
        const refractX = leftX - 10;

        // Animated light beam
        const lightProgress = (time % 150) / 150;

        // Incident ray (air)
        const rayGrad1 = ctx.createLinearGradient(lightSourceX, lightSourceY, refractX, boundaryY);
        rayGrad1.addColorStop(0, 'rgba(255, 220, 100, 0.9)');
        rayGrad1.addColorStop(1, 'rgba(255, 220, 100, 0.7)');
        ctx.strokeStyle = rayGrad1;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(lightSourceX, lightSourceY);
        ctx.lineTo(refractX, boundaryY);
        ctx.stroke();

        // Refracted ray (glass - bends toward normal)
        const rayGrad2 = ctx.createLinearGradient(refractX, boundaryY, targetX, targetY);
        rayGrad2.addColorStop(0, 'rgba(255, 220, 100, 0.7)');
        rayGrad2.addColorStop(1, 'rgba(255, 220, 100, 0.5)');
        ctx.strokeStyle = rayGrad2;
        ctx.beginPath();
        ctx.moveTo(refractX, boundaryY);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();

        // Animated photon
        let photonX, photonY;
        if (lightProgress < 0.5) {
            const t = lightProgress * 2;
            photonX = lightSourceX + (refractX - lightSourceX) * t;
            photonY = lightSourceY + (boundaryY - lightSourceY) * t;
        } else {
            const t = (lightProgress - 0.5) * 2;
            photonX = refractX + (targetX - refractX) * t;
            photonY = boundaryY + (targetY - boundaryY) * t;
        }

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(photonX, photonY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffdc64';
        ctx.beginPath();
        ctx.arc(photonX, photonY, 3, 0, Math.PI * 2);
        ctx.fill();

        // Labels
        drawText(ctx, 'AIR', leftX - 65, panelTop + 30, { color: 'rgba(100, 150, 255, 0.5)', size: 8, align: 'left' });
        drawText(ctx, 'GLASS', leftX - 65, boundaryY + 25, { color: 'rgba(100, 200, 255, 0.6)', size: 8, align: 'left' });

        drawText(ctx, 'LIGHT', leftX, panelTop - 8, { color: '#ffdc64', size: 11 });
        drawText(ctx, 'Fermat\'s Principle:', leftX, panelBottom + 18, { color: '#666', size: 8 });
        drawText(ctx, '"Shortest optical path"', leftX, panelBottom + 32, { color: '#555', size: 8 });

        // ═══════════════════════════════════════════════════════════════
        // RIGHT PANEL: Water - Energy Minimization
        // ═══════════════════════════════════════════════════════════════

        // Terrain/landscape
        const terrainPoints = [];
        for (let x = rightX - 80; x <= rightX + 80; x += 5) {
            const normalizedX = (x - (rightX - 80)) / 160;
            // Create a valley shape
            const baseHeight = Math.sin(normalizedX * Math.PI) * 40;
            const noise = Math.sin(x * 0.1) * 8;
            terrainPoints.push({
                x: x,
                y: panelBottom - 30 - baseHeight - noise
            });
        }

        // Draw terrain
        ctx.fillStyle = 'rgba(100, 80, 60, 0.4)';
        ctx.beginPath();
        ctx.moveTo(rightX - 80, panelBottom);
        terrainPoints.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.lineTo(rightX + 80, panelBottom);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(150, 120, 90, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        terrainPoints.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
        ctx.stroke();

        // Valley bottom (lowest point) marker
        const valleyX = rightX;
        const valleyY = panelBottom - 30;

        // Water pool at bottom
        const poolY = valleyY + 5;
        ctx.fillStyle = 'rgba(27, 153, 139, 0.4)';
        ctx.beginPath();
        ctx.ellipse(valleyX, poolY, 35, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Water surface shimmer
        ctx.strokeStyle = 'rgba(27, 153, 139, 0.6)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const shimmerOffset = Math.sin(time * 0.05 + i) * 3;
            ctx.beginPath();
            ctx.ellipse(valleyX, poolY - 2 + i * 2, 30 - i * 8 + shimmerOffset, 4, 0, 0, Math.PI);
            ctx.stroke();
        }

        // Animated water droplets
        droplets.forEach((d, i) => {
            d.progress += d.speed;
            if (d.progress > 1) {
                d.progress = 0;
                d.xOffset = (Math.random() - 0.5) * 30;
            }

            // Start from random x position, flow to valley
            const startX = valleyX + d.xOffset + (i % 2 === 0 ? -40 : 40);
            const startY = panelTop + 30;

            // Curved path to valley
            const t = d.progress;
            const dx = valleyX - startX;
            const dy = valleyY - startY;

            const dropX = startX + dx * t + Math.sin(t * Math.PI * 2) * 10 * (1 - t);
            const dropY = startY + dy * t * t; // Accelerating (gravity)

            // Only draw if not in pool yet
            if (t < 0.95) {
                // Droplet trail
                ctx.fillStyle = `rgba(27, 153, 139, ${0.3 * (1 - t)})`;
                ctx.beginPath();
                ctx.arc(dropX, dropY - 8, 2, 0, Math.PI * 2);
                ctx.fill();

                // Main droplet
                ctx.fillStyle = COLORS.primary;
                ctx.beginPath();
                // Teardrop shape
                ctx.arc(dropX, dropY, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // Arrow showing downward flow
        ctx.strokeStyle = 'rgba(27, 153, 139, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(rightX - 35, panelTop + 50);
        ctx.quadraticCurveTo(rightX - 25, (panelTop + valleyY) / 2, valleyX, valleyY - 15);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(rightX + 35, panelTop + 50);
        ctx.quadraticCurveTo(rightX + 25, (panelTop + valleyY) / 2, valleyX, valleyY - 15);
        ctx.stroke();

        // Labels
        drawText(ctx, 'WATER', rightX, panelTop - 8, { color: COLORS.primary, size: 11 });
        drawText(ctx, 'Energy Minimization:', rightX, panelBottom + 18, { color: '#666', size: 8 });
        drawText(ctx, '"Finds the lowest point"', rightX, panelBottom + 32, { color: '#555', size: 8 });

        // ═══════════════════════════════════════════════════════════════
        // CENTER: Key insight
        // ═══════════════════════════════════════════════════════════════

        // Vertical divider
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(w / 2, panelTop);
        ctx.lineTo(w / 2, panelBottom);
        ctx.stroke();

        // Title
        drawText(ctx, 'PHYSICS COMPUTES OPTIMAL SOLUTIONS', w / 2, 22, { color: '#666', size: 10 });

        // Bottom insight
        drawText(ctx, 'No training. No gradients. Nature solves directly from first principles.', w / 2, h - 12, { color: '#444', size: 8 });

        time++;
        requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener('resize', () => { resize(); });
}
