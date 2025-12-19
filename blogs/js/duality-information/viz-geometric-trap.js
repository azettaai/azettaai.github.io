import { COLORS } from './common.js';

export function initVizGeometricTrap() {
    const canvas = document.getElementById('viz-geometric-trap');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrame;
    let time = 0;
    let mouseX = 0, mouseY = 0;
    let isHovering = false;

    function resize() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    // Floating particles for atmosphere
    const particles = [];
    for (let i = 0; i < 50; i++) {
        particles.push({
            x: Math.random(),
            y: Math.random(),
            size: Math.random() * 2 + 0.5,
            speed: Math.random() * 0.3 + 0.1,
            alpha: Math.random() * 0.3 + 0.1
        });
    }

    function draw() {
        const w = canvas.getBoundingClientRect().width;
        const h = canvas.getBoundingClientRect().height;
        const cx = w / 2;
        const cy = h / 2;

        ctx.clearRect(0, 0, w, h);

        // Subtle radial gradient background
        const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.6);
        bgGrad.addColorStop(0, 'rgba(27, 153, 139, 0.05)');
        bgGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Floating particles
        ctx.save();
        for (const p of particles) {
            p.y -= p.speed * 0.003;
            if (p.y < 0) p.y = 1;

            const px = p.x * w;
            const py = p.y * h;

            ctx.fillStyle = `rgba(27, 153, 139, ${p.alpha})`;
            ctx.beginPath();
            ctx.arc(px, py, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // Draw grid with perspective effect
        ctx.save();
        const gridFade = 0.08 + Math.sin(time * 0.5) * 0.02;
        ctx.strokeStyle = `rgba(27, 153, 139, ${gridFade})`;
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
        ctx.restore();

        // Draw dimensional axes with enhanced effects
        const maxDim = 15;
        const baseAxisLen = 90;

        for (let d = 0; d < maxDim; d++) {
            // Progressive fade
            const dimProgress = d / maxDim;
            const fade = Math.max(0, Math.pow(1 - dimProgress, 1.5) - Math.sin(time * 0.5 + d * 0.3) * 0.05);
            const angle = (d / maxDim) * Math.PI * 2 + time * (0.08 + dimProgress * 0.03);

            // Dynamic axis length based on dimension
            const axisLen = baseAxisLen * (1 - dimProgress * 0.4);

            // 3D rotation projection with depth
            const depthFactor = 1 - dimProgress * 0.5;
            const rotX = Math.cos(angle) * axisLen;
            const rotY = Math.sin(angle) * axisLen * 0.65;
            const rotZ = Math.sin(angle + Math.PI / 4) * axisLen * 0.35;

            const projX = cx + (rotX + rotZ * 0.5) * depthFactor;
            const projY = cy + (rotY + rotZ * 0.5) * depthFactor;

            ctx.save();
            ctx.globalAlpha = fade;

            // Choose color based on dimension tier
            let color, lineWidth;
            if (d < 3) {
                color = COLORS.primary;
                lineWidth = 3.5;
            } else if (d < 6) {
                color = COLORS.accent;
                lineWidth = 2.5;
            } else if (d < 10) {
                color = COLORS.wave;
                lineWidth = 1.5;
            } else {
                color = COLORS.dim;
                lineWidth = 1;
            }

            // Glow effect for visible dimensions
            if (d < 6) {
                ctx.shadowColor = color;
                ctx.shadowBlur = 10 + (6 - d) * 3;
            }

            // Draw axis line with gradient
            const lineGrad = ctx.createLinearGradient(cx, cy, projX, projY);
            lineGrad.addColorStop(0, 'rgba(27, 153, 139, 0.3)');
            lineGrad.addColorStop(1, color);

            ctx.strokeStyle = lineGrad;
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(projX, projY);
            ctx.stroke();

            ctx.shadowBlur = 0;

            // Arrow head
            const arrowAngle = Math.atan2(projY - cy, projX - cx);
            const arrowSize = 6 + (1 - dimProgress) * 4;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(projX, projY);
            ctx.lineTo(projX - arrowSize * Math.cos(arrowAngle - 0.4), projY - arrowSize * Math.sin(arrowAngle - 0.4));
            ctx.lineTo(projX - arrowSize * Math.cos(arrowAngle + 0.4), projY - arrowSize * Math.sin(arrowAngle + 0.4));
            ctx.closePath();
            ctx.fill();

            // Dimension label
            ctx.fillStyle = COLORS.light;
            ctx.font = `${11 - dimProgress * 3}px "Courier New", monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const labelDist = 18 + (1 - dimProgress) * 5;
            ctx.fillText(`d${d + 1}`, projX + labelDist * Math.cos(arrowAngle), projY + labelDist * Math.sin(arrowAngle));

            ctx.restore();
        }

        // Central origin glow
        const originGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 20);
        originGlow.addColorStop(0, 'rgba(27, 153, 139, 0.6)');
        originGlow.addColorStop(0.5, 'rgba(27, 153, 139, 0.2)');
        originGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = originGlow;
        ctx.beginPath();
        ctx.arc(cx, cy, 20, 0, Math.PI * 2);
        ctx.fill();

        // Origin point
        ctx.fillStyle = COLORS.primary;
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fill();

        // Info panel with gradient border
        const panelX = 15, panelY = 15, panelW = 190, panelH = 85;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(panelX, panelY, panelW, panelH);

        const panelGrad = ctx.createLinearGradient(panelX, panelY, panelX + panelW, panelY);
        panelGrad.addColorStop(0, COLORS.primary);
        panelGrad.addColorStop(1, COLORS.accent);
        ctx.strokeStyle = panelGrad;
        ctx.lineWidth = 2;
        ctx.strokeRect(panelX, panelY, panelW, panelH);

        ctx.font = 'bold 11px "Courier New", monospace';
        ctx.textAlign = 'left';

        ctx.fillStyle = COLORS.primary;
        ctx.fillText('● Visible: d₁ - d₃', panelX + 15, panelY + 22);
        ctx.fillStyle = COLORS.accent;
        ctx.fillText('● Fading: d₄ - d₆', panelX + 15, panelY + 40);
        ctx.fillStyle = COLORS.wave;
        ctx.fillText('● Ghostly: d₇ - d₁₀', panelX + 15, panelY + 58);
        ctx.fillStyle = COLORS.dim;
        ctx.fillText('● Lost: d₁₁ - d₁₅...', panelX + 15, panelY + 76);

        // Mysterious question marks fading into distance
        ctx.textAlign = 'right';
        for (let q = 0; q < 4; q++) {
            const qAlpha = 0.3 - q * 0.07;
            const qSize = 42 - q * 8;
            ctx.font = `bold ${qSize}px "Courier New", monospace`;
            ctx.fillStyle = `rgba(237, 33, 124, ${qAlpha})`;
            ctx.fillText('?', w - 25 - q * 30, h - 50 + q * 10);
        }

        // Bottom text
        ctx.font = '11px "Courier New", monospace';
        ctx.fillStyle = COLORS.dim;
        ctx.fillText('...dimension 1000? dimension ∞?', w - 20, h - 15);

        time += 0.018;
        animationFrame = requestAnimationFrame(draw);
    }

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
        isHovering = true;
    });

    canvas.addEventListener('mouseleave', () => {
        isHovering = false;
    });

    resize();
    draw();
    window.addEventListener('resize', resize);
}
