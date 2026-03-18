/**
 * Periodica Visualization
 * A minimal training-loop concept: particles orbit a central node (the model).
 * Hovering triggers an "intervention" — the loop slows, audit rays fan out,
 * and a metric pulse ripples from the center.
 */
(function initPeriodicaViz() {
    const canvas = document.getElementById('periodica-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let w, h, cx, cy;
    let hovering = false;
    let hoverT = 0;           // 0 → 1 smooth transition
    let time = 0;

    const PRIMARY = '#1b998b';
    const ACCENT  = '#ed217c';
    const DIM     = 'rgba(27,153,139,0.15)';

    // Training particles
    const PARTICLE_COUNT = 7;
    let particles = [];

    function resize() {
        const rect = canvas.getBoundingClientRect();
        w = rect.width;
        h = rect.height;
        canvas.width = w * devicePixelRatio;
        canvas.height = h * devicePixelRatio;
        ctx.scale(devicePixelRatio, devicePixelRatio);
        cx = w / 2;
        cy = h / 2;
    }

    function initParticles() {
        particles = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push({
                angle: (Math.PI * 2 / PARTICLE_COUNT) * i,
                radius: Math.min(w, h) * 0.3 + (Math.random() - 0.5) * 20,
                speed: 0.004 + Math.random() * 0.003,
                size: 2.5 + Math.random() * 2,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    // Smooth ease
    function lerp(a, b, t) { return a + (b - a) * t; }

    function drawCenterNode() {
        const pulseR = 8 + Math.sin(time * 2) * 2;
        const auditPulse = hoverT * (12 + Math.sin(time * 4) * 4);

        // Outer glow ring (audit mode)
        if (hoverT > 0.01) {
            ctx.beginPath();
            ctx.arc(cx, cy, 30 + auditPulse, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(237,33,124,${0.25 * hoverT})`;
            ctx.lineWidth = 1;
            ctx.stroke();

            // Second ring
            ctx.beginPath();
            ctx.arc(cx, cy, 48 + auditPulse * 0.6, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(237,33,124,${0.12 * hoverT})`;
            ctx.stroke();
        }

        // Core glow
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 28);
        grad.addColorStop(0, `rgba(27,153,139,${lerp(0.25, 0.45, hoverT)})`);
        grad.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(cx, cy, 28, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
        ctx.fillStyle = hoverT > 0.5 ? ACCENT : PRIMARY;
        ctx.fill();
    }

    function drawOrbitRing() {
        const r = Math.min(w, h) * 0.3;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = DIM;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    function drawParticles() {
        const speedMult = lerp(1, 0.15, hoverT); // slow down on hover

        for (const p of particles) {
            p.angle += p.speed * speedMult;

            // Slight radial oscillation
            const rOsc = p.radius + Math.sin(time * 1.5 + p.phase) * 6;
            const px = cx + Math.cos(p.angle) * rOsc;
            const py = cy + Math.sin(p.angle) * rOsc;

            // Trail
            const trailLen = lerp(18, 6, hoverT);
            const tx = px - Math.cos(p.angle) * trailLen;
            const ty = py - Math.sin(p.angle) * trailLen;
            ctx.beginPath();
            ctx.moveTo(tx, ty);
            ctx.lineTo(px, py);
            ctx.strokeStyle = `rgba(27,153,139,${lerp(0.3, 0.15, hoverT)})`;
            ctx.lineWidth = p.size * 0.6;
            ctx.stroke();

            // Dot
            ctx.beginPath();
            ctx.arc(px, py, p.size, 0, Math.PI * 2);
            ctx.fillStyle = PRIMARY;
            ctx.fill();

            // Audit rays from center to each particle (on hover)
            if (hoverT > 0.05) {
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(lerp(cx, px, hoverT), lerp(cy, py, hoverT));
                ctx.strokeStyle = `rgba(237,33,124,${0.35 * hoverT})`;
                ctx.lineWidth = 0.8;
                ctx.setLineDash([3, 5]);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }
    }

    function drawLabels() {
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';

        // Static label
        ctx.fillStyle = `rgba(244,241,222,${lerp(0.35, 0.15, hoverT)})`;
        ctx.fillText('training', cx, cy + Math.min(w, h) * 0.3 + 22);

        // Audit label (appears on hover)
        if (hoverT > 0.1) {
            ctx.fillStyle = `rgba(237,33,124,${hoverT * 0.7})`;
            ctx.fillText('audit', cx, cy - 44);
            ctx.fillStyle = `rgba(237,33,124,${hoverT * 0.5})`;
            ctx.fillText('intervene', cx, cy + Math.min(w, h) * 0.3 + 22);
        }
    }

    function draw() {
        time += 0.016;

        // Smooth hover transition
        const target = hovering ? 1 : 0;
        hoverT += (target - hoverT) * 0.06;

        ctx.clearRect(0, 0, w, h);

        drawOrbitRing();
        drawParticles();
        drawCenterNode();
        drawLabels();

        requestAnimationFrame(draw);
    }

    // Events
    canvas.addEventListener('mouseenter', () => { hovering = true; });
    canvas.addEventListener('mouseleave', () => { hovering = false; });
    canvas.addEventListener('touchstart', () => { hovering = true; }, { passive: true });
    canvas.addEventListener('touchend', () => { hovering = false; }, { passive: true });

    window.addEventListener('resize', () => { resize(); initParticles(); });

    resize();
    initParticles();
    draw();
})();
