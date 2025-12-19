import { COLORS, randomVector, normalize, dot, yat, magnitude } from './common.js';

export function initVizDuality() {
    const canvas = document.getElementById('viz-duality');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrame;
    let time = 0;
    let viewMode = 'particle'; // 'particle' or 'wave'
    let transitionProgress = 0;

    // Two vectors to compare
    const dims = 20;
    let vectorA = randomVector(dims, 1.5);
    let vectorB = randomVector(dims, 1.5);

    function resize() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function drawParticleAtom(cx, cy, vector, label, color) {
        const maxMag = Math.max(...vector.map(Math.abs), 0.1);
        const baseRadius = 30;

        // Glow
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60);
        glow.addColorStop(0, color + '44');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, 60, 0, Math.PI * 2);
        ctx.fill();

        // Nucleus
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(cx, cy, 15, 0, Math.PI * 2);
        ctx.fill();

        // Label
        ctx.fillStyle = COLORS.light;
        ctx.font = 'bold 12px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(label, cx, cy + 4);

        // Particles
        for (let i = 0; i < vector.length; i++) {
            const val = vector[i];
            const normMag = Math.abs(val) / maxMag;
            const radius = baseRadius + normMag * 35;
            const angle = (i / vector.length) * Math.PI * 2 + time * 0.3;

            const px = cx + Math.cos(angle) * radius;
            const py = cy + Math.sin(angle) * radius;

            const pColor = val > 0.1 ? COLORS.proton : (val < -0.1 ? COLORS.electron : COLORS.neutral);
            const size = 3 + normMag * 5;

            ctx.fillStyle = pColor;
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawWaveform(cx, cy, vector, label, color) {
        const normVec = normalize(vector);
        const waveW = 120;
        const waveH = 50;

        // Background box
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(cx - waveW / 2, cy - waveH, waveW, waveH * 2);
        ctx.strokeStyle = color + '66';
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - waveW / 2, cy - waveH, waveW, waveH * 2);

        // Waveform
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        for (let i = 0; i < normVec.length; i++) {
            const x = cx - waveW / 2 + 10 + (i / (normVec.length - 1)) * (waveW - 20);
            const y = cy + normVec[i] * waveH * 0.8;
            const phase = time * 2 + i * 0.15;
            const animated = y + Math.sin(phase) * 2;

            if (i === 0) ctx.moveTo(x, animated);
            else ctx.lineTo(x, animated);
        }
        ctx.stroke();

        // Label
        ctx.fillStyle = color;
        ctx.font = '11px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(label, cx, cy - waveH - 8);

        // Magnitude indicator
        ctx.font = '9px "Courier New", monospace';
        ctx.fillStyle = COLORS.dim;
        ctx.fillText('|v| = 1.00', cx, cy + waveH + 15);
    }

    function draw() {
        const w = canvas.getBoundingClientRect().width;
        const h = canvas.getBoundingClientRect().height;
        const cx = w / 2;

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

        // Transition logic
        const targetProgress = viewMode === 'wave' ? 1 : 0;
        transitionProgress += (targetProgress - transitionProgress) * 0.06;

        // Positions
        const posAx = lerp(w * 0.25, w * 0.3, transitionProgress);
        const posBx = lerp(w * 0.75, w * 0.7, transitionProgress);
        const posY = h * 0.45;

        // Draw vectors based on transition
        if (transitionProgress < 0.7) {
            // Particle view (fade out)
            ctx.globalAlpha = 1 - transitionProgress * 1.3;
            drawParticleAtom(posAx, posY, vectorA, 'A', COLORS.primary);
            drawParticleAtom(posBx, posY, vectorB, 'B', COLORS.wave);
            ctx.globalAlpha = 1;
        }

        if (transitionProgress > 0.3) {
            // Wave view (fade in)
            ctx.globalAlpha = (transitionProgress - 0.3) * 1.4;
            drawWaveform(posAx, posY, vectorA, 'Signal A', COLORS.primary);
            drawWaveform(posBx, posY, vectorB, 'Signal B', COLORS.wave);
            ctx.globalAlpha = 1;
        }

        // Connection between vectors
        const yatValue = yat(vectorA, vectorB);
        const dotValue = dot(vectorA, vectorB);
        const normYat = Math.min(yatValue / 5, 1);

        // Connection line/arc
        ctx.strokeStyle = `rgba(237, 33, 124, ${0.3 + normYat * 0.5})`;
        ctx.lineWidth = 1 + normYat * 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(posAx + 70, posY);
        ctx.lineTo(posBx - 70, posY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Yat display in center
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(cx - 60, posY - 35, 120, 70);
        ctx.strokeStyle = COLORS.accent;
        ctx.lineWidth = 2;
        ctx.strokeRect(cx - 60, posY - 35, 120, 70);

        ctx.font = '10px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = COLORS.accent;
        ctx.fillText(viewMode === 'particle' ? 'FORCE' : 'COHERENCE', cx, posY - 18);

        ctx.font = 'bold 22px "Courier New", monospace';
        ctx.fillText(isFinite(yatValue) ? yatValue.toFixed(2) : '∞', cx, posY + 8);

        ctx.font = '9px "Courier New", monospace';
        ctx.fillStyle = COLORS.dim;
        ctx.fillText(`dot: ${dotValue.toFixed(2)}`, cx, posY + 25);

        // Mode labels
        const labelY = h - 80;

        // Particle mode box
        ctx.fillStyle = viewMode === 'particle' ? 'rgba(27, 153, 139, 0.3)' : 'rgba(50, 50, 50, 0.5)';
        ctx.fillRect(cx - 180, labelY, 150, 50);
        ctx.strokeStyle = viewMode === 'particle' ? COLORS.primary : COLORS.dim;
        ctx.lineWidth = viewMode === 'particle' ? 2 : 1;
        ctx.strokeRect(cx - 180, labelY, 150, 50);

        ctx.fillStyle = viewMode === 'particle' ? COLORS.primary : COLORS.dim;
        ctx.font = '12px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⚛ PARTICLE', cx - 105, labelY + 22);
        ctx.font = '9px "Courier New", monospace';
        ctx.fillText('Independent dims', cx - 105, labelY + 38);

        // Wave mode box
        ctx.fillStyle = viewMode === 'wave' ? 'rgba(155, 93, 229, 0.3)' : 'rgba(50, 50, 50, 0.5)';
        ctx.fillRect(cx + 30, labelY, 150, 50);
        ctx.strokeStyle = viewMode === 'wave' ? COLORS.wave : COLORS.dim;
        ctx.lineWidth = viewMode === 'wave' ? 2 : 1;
        ctx.strokeRect(cx + 30, labelY, 150, 50);

        ctx.fillStyle = viewMode === 'wave' ? COLORS.wave : COLORS.dim;
        ctx.font = '12px "Courier New", monospace';
        ctx.fillText('〜 WAVE', cx + 105, labelY + 22);
        ctx.font = '9px "Courier New", monospace';
        ctx.fillText('Coupled signal', cx + 105, labelY + 38);

        // Instructions
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(15, 15, 180, 28);
        ctx.font = '10px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = COLORS.dim;
        ctx.fillText('Click modes to toggle view', 25, 34);

        time += 0.025;
        animationFrame = requestAnimationFrame(draw);
    }

    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cx = rect.width / 2;
        const labelY = rect.height - 80;

        // Check if clicked on mode boxes
        if (y >= labelY && y <= labelY + 50) {
            if (x >= cx - 180 && x <= cx - 30) {
                viewMode = 'particle';
            } else if (x >= cx + 30 && x <= cx + 180) {
                viewMode = 'wave';
            }
        } else {
            // Click elsewhere = new vectors
            vectorA = randomVector(dims, 1.5);
            vectorB = randomVector(dims, 1.5);
        }
    });

    resize();
    draw();
    window.addEventListener('resize', resize);
}
