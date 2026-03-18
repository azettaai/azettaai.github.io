import { COLORS } from './common.js';

export function initVizBoundaries() {
    const canvas = document.getElementById('viz-boundaries');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    let anchors = [
        { x: -80, y: 0 },
        { x: 80, y: 0 }
    ];
    let currentMetric = 'yat';

    const anchorPalettes = [
        { main: [27, 153, 139], glow: [45, 200, 180] },
        { main: [237, 33, 124], glow: [255, 100, 160] },
        { main: [244, 162, 97], glow: [255, 200, 140] },
        { main: [155, 93, 229], glow: [190, 140, 255] },
        { main: [0, 187, 249], glow: [100, 220, 255] }
    ];

    function resize() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    function computeMetric(px, py, ax, ay, metric) {
        switch (metric) {
            case 'euclidean': {
                const dx = px - ax, dy = py - ay;
                const dist = Math.sqrt(dx * dx + dy * dy);
                return 1 / (1 + dist * 0.015);
            }
            case 'dot': {
                return ax * px + ay * py;
            }
            case 'yat': {
                const dot = ax * px + ay * py;
                const dx = px - ax, dy = py - ay;
                const distSq = dx * dx + dy * dy;
                if (distSq < 1) return 100;
                return (dot * dot) / distSq;
            }
        }
    }

    function softmax(values, temperature = 1.0) {
        const maxVal = Math.max(...values);
        const exps = values.map(v => Math.exp((v - maxVal) / temperature));
        const sum = exps.reduce((a, b) => a + b, 0);
        return exps.map(e => e / sum);
    }

    function draw() {
        const w = canvas.getBoundingClientRect().width;
        const h = canvas.getBoundingClientRect().height;
        const cx = w / 2;
        const cy = h / 2;

        // Dark gradient background
        const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.7);
        bgGrad.addColorStop(0, '#1a1a2e');
        bgGrad.addColorStop(1, '#0d0d15');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Draw smooth decision regions - no boundary lines, just color
        const resolution = 2;
        const temp = currentMetric === 'yat' ? 0.3 : 0.8;

        for (let x = 0; x < w; x += resolution) {
            for (let y = 0; y < h; y += resolution) {
                const px = x - cx;
                const py = y - cy;

                const values = anchors.map(a => computeMetric(px, py, a.x, a.y, currentMetric));
                const probs = softmax(values, temp);

                // Mix colors smoothly
                let r = 0, g = 0, b = 0;
                let maxProb = 0;

                probs.forEach((prob, i) => {
                    const col = anchorPalettes[i % anchorPalettes.length].main;
                    r += col[0] * prob;
                    g += col[1] * prob;
                    b += col[2] * prob;
                    if (prob > maxProb) maxProb = prob;
                });

                // Higher certainty = more saturation and brightness
                const intensity = 0.3 + maxProb * 0.5;
                ctx.fillStyle = `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${intensity})`;
                ctx.fillRect(x, y, resolution, resolution);
            }
        }

        // Subtle grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
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

        // For Yat: Draw polarity axis through each anchor
        if (currentMetric === 'yat') {
            ctx.setLineDash([6, 6]);
            ctx.lineWidth = 1.5;

            anchors.forEach((a, idx) => {
                const mag = Math.sqrt(a.x * a.x + a.y * a.y);
                if (mag > 10) {
                    const nx = a.x / mag;
                    const ny = a.y / mag;
                    const col = anchorPalettes[idx % anchorPalettes.length].glow;
                    ctx.strokeStyle = `rgba(${col[0]}, ${col[1]}, ${col[2]}, 0.35)`;
                    ctx.beginPath();
                    ctx.moveTo(cx - nx * 400, cy - ny * 400);
                    ctx.lineTo(cx + nx * 400, cy + ny * 400);
                    ctx.stroke();
                }
            });
            ctx.setLineDash([]);
        }

        // Origin crosshair
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx - 15, cy);
        ctx.lineTo(cx + 15, cy);
        ctx.moveTo(cx, cy - 15);
        ctx.lineTo(cx, cy + 15);
        ctx.stroke();

        // Draw anchors
        anchors.forEach((anchor, idx) => {
            const ax = cx + anchor.x;
            const ay = cy + anchor.y;
            const palette = anchorPalettes[idx % anchorPalettes.length];

            // Outer glow
            const outerGlow = ctx.createRadialGradient(ax, ay, 0, ax, ay, 45);
            outerGlow.addColorStop(0, `rgba(${palette.glow[0]}, ${palette.glow[1]}, ${palette.glow[2]}, 0.5)`);
            outerGlow.addColorStop(0.5, `rgba(${palette.glow[0]}, ${palette.glow[1]}, ${palette.glow[2]}, 0.15)`);
            outerGlow.addColorStop(1, `rgba(${palette.glow[0]}, ${palette.glow[1]}, ${palette.glow[2]}, 0)`);
            ctx.beginPath();
            ctx.arc(ax, ay, 45, 0, Math.PI * 2);
            ctx.fillStyle = outerGlow;
            ctx.fill();

            // Core
            const innerGlow = ctx.createRadialGradient(ax, ay, 0, ax, ay, 10);
            innerGlow.addColorStop(0, '#fff');
            innerGlow.addColorStop(0.4, `rgb(${palette.glow[0]}, ${palette.glow[1]}, ${palette.glow[2]})`);
            innerGlow.addColorStop(1, `rgb(${palette.main[0]}, ${palette.main[1]}, ${palette.main[2]})`);
            ctx.beginPath();
            ctx.arc(ax, ay, 10, 0, Math.PI * 2);
            ctx.fillStyle = innerGlow;
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Label
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(String.fromCharCode(65 + idx), ax, ay + 4);
        });

        // Info panel
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.beginPath();
        ctx.roundRect(15, 15, 250, 90, 6);
        ctx.fill();
        ctx.strokeStyle = getMetricColor();
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.textAlign = 'left';
        ctx.font = 'bold 13px "Courier New", monospace';
        ctx.fillStyle = getMetricColor();
        ctx.fillText(getMetricName() + ' Boundaries', 28, 38);

        ctx.font = '10px "Courier New", monospace';
        ctx.fillStyle = '#aaa';
        ctx.fillText(`${anchors.length} anchor${anchors.length > 1 ? 's' : ''} • softmax`, 28, 55);

        if (currentMetric === 'yat') {
            ctx.fillStyle = '#ffdd66';
            ctx.fillText('⚡ Bipolar: opposite vectors activate too', 28, 72);
            ctx.fillStyle = '#777';
            ctx.fillText('(dashed lines = polarity axes)', 28, 88);
        } else if (currentMetric === 'euclidean') {
            ctx.fillStyle = '#777';
            ctx.fillText('Voronoi-like • distance only', 28, 72);
        } else {
            ctx.fillStyle = '#777';
            ctx.fillText('Linear hyperplanes • direction only', 28, 72);
        }

        // Formula
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.beginPath();
        ctx.roundRect(w - 170, 15, 155, 42, 5);
        ctx.fill();

        ctx.font = '10px "Courier New", monospace';
        ctx.fillStyle = '#999';
        switch (currentMetric) {
            case 'euclidean':
                ctx.fillText('P ∝ 1 / (1 + dist)', w - 160, 32);
                break;
            case 'dot':
                ctx.fillText('P ∝ a · x', w - 160, 32);
                break;
            case 'yat':
                ctx.fillText('P ∝ (a·x)² / ||a-x||²', w - 160, 32);
                break;
        }
        ctx.fillStyle = '#666';
        ctx.fillText('then softmax', w - 160, 48);

        // Bottom instructions
        ctx.font = '10px "Courier New", monospace';
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.textAlign = 'center';
        ctx.fillText('Click to add anchors • Buttons to switch metrics', w / 2, h - 10);
        ctx.textAlign = 'left';
    }

    function getMetricColor() {
        switch (currentMetric) {
            case 'euclidean': return '#f4a261';
            case 'dot': return '#9b5de5';
            case 'yat': return COLORS.primary;
        }
    }

    function getMetricName() {
        switch (currentMetric) {
            case 'euclidean': return 'Euclidean';
            case 'dot': return 'Dot Product';
            case 'yat': return 'Yat';
        }
    }

    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        if (e.clientY - rect.top > rect.height - 35) return;
        if (anchors.length < 5) {
            anchors.push({ x, y });
            draw();
        }
    });

    document.getElementById('viz-bound-euclidean')?.addEventListener('click', () => { currentMetric = 'euclidean'; draw(); });
    document.getElementById('viz-bound-dot')?.addEventListener('click', () => { currentMetric = 'dot'; draw(); });
    document.getElementById('viz-bound-yat')?.addEventListener('click', () => { currentMetric = 'yat'; draw(); });
    document.getElementById('viz-bound-reset')?.addEventListener('click', () => { anchors = [{ x: -80, y: 0 }, { x: 80, y: 0 }]; draw(); });
    document.getElementById('viz-bound-add')?.addEventListener('click', () => {
        if (anchors.length < 5) {
            anchors.push({ x: (Math.random() - 0.5) * 200, y: (Math.random() - 0.5) * 200 });
            draw();
        }
    });

    resize();
    draw();
    window.addEventListener('resize', () => { resize(); draw(); });
}
