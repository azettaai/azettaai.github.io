import { COLORS, randomVector, normalize, dot, yat } from './common.js';

export function initVizSignalNoise() {
    const canvas = document.getElementById('viz-signal-noise');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrame;
    let time = 0;
    let alignment = 0.8; // 0 = orthogonal, 1 = aligned

    // Two signal vectors
    const dims = 32;
    let signalA = normalize(randomVector(dims, 1));
    let signalB;

    function generateSignalB() {
        // Generate B as a blend of A and random noise based on alignment
        const noise = normalize(randomVector(dims, 1));
        signalB = signalA.map((v, i) =>
            v * alignment + noise[i] * (1 - alignment)
        );
        signalB = normalize(signalB);
    }
    generateSignalB();

    function resize() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    function draw() {
        const w = canvas.getBoundingClientRect().width;
        const h = canvas.getBoundingClientRect().height;

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

        // Waveform display areas
        const waveHeight = 60;
        const waveY1 = 80;
        const waveY2 = 170;
        const waveX = 60;
        const waveW = w - 120;

        // Draw Signal A waveform
        ctx.strokeStyle = COLORS.primary;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < dims; i++) {
            const x = waveX + (i / (dims - 1)) * waveW;
            const y = waveY1 + signalA[i] * waveHeight * 0.8;
            const phase = time * 3 + i * 0.2;
            const animated = y + Math.sin(phase) * 3;

            if (i === 0) ctx.moveTo(x, animated);
            else ctx.lineTo(x, animated);
        }
        ctx.stroke();

        ctx.fillStyle = COLORS.primary;
        ctx.font = '11px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillText('Signal A', waveX, waveY1 - waveHeight - 5);

        // Draw Signal B waveform
        ctx.strokeStyle = COLORS.wave;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < dims; i++) {
            const x = waveX + (i / (dims - 1)) * waveW;
            const y = waveY2 + signalB[i] * waveHeight * 0.8;
            const phase = time * 3 + i * 0.2 + Math.PI;
            const animated = y + Math.sin(phase) * 3;

            if (i === 0) ctx.moveTo(x, animated);
            else ctx.lineTo(x, animated);
        }
        ctx.stroke();

        ctx.fillStyle = COLORS.wave;
        ctx.fillText('Signal B', waveX, waveY2 - waveHeight - 5);

        // Calculate metrics
        const dotProduct = dot(signalA, signalB);
        const yatValue = yat(signalA, signalB);
        const coherence = Math.abs(dotProduct);

        // Coherence meter
        const meterX = w / 2 - 100;
        const meterY = h - 100;
        const meterW = 200;
        const meterH = 25;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(meterX - 10, meterY - 30, meterW + 20, meterH + 60);
        ctx.strokeStyle = COLORS.dim;
        ctx.strokeRect(meterX - 10, meterY - 30, meterW + 20, meterH + 60);

        ctx.fillStyle = COLORS.light;
        ctx.font = '12px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SIGNAL COHERENCE', w / 2, meterY - 10);

        // Meter background
        ctx.fillStyle = 'rgba(50, 50, 50, 0.8)';
        ctx.fillRect(meterX, meterY, meterW, meterH);

        // Meter fill
        const grad = ctx.createLinearGradient(meterX, 0, meterX + meterW, 0);
        grad.addColorStop(0, '#e63946');
        grad.addColorStop(0.5, '#f4a261');
        grad.addColorStop(1, '#2a9d8f');
        ctx.fillStyle = grad;
        ctx.fillRect(meterX, meterY, meterW * coherence, meterH);

        // Meter border
        ctx.strokeStyle = COLORS.primary;
        ctx.lineWidth = 2;
        ctx.strokeRect(meterX, meterY, meterW, meterH);

        // Labels
        ctx.font = '10px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = COLORS.dim;
        ctx.fillText('NOISE', meterX, meterY + meterH + 15);
        ctx.textAlign = 'right';
        ctx.fillText('SIGNAL', meterX + meterW, meterY + meterH + 15);

        // Percentage
        ctx.font = 'bold 14px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = COLORS.light;
        ctx.fillText(`${(coherence * 100).toFixed(0)}%`, w / 2, meterY + 18);

        // Yat display
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(w - 120, 15, 105, 50);
        ctx.strokeStyle = COLORS.accent;
        ctx.lineWidth = 1;
        ctx.strokeRect(w - 120, 15, 105, 50);

        ctx.font = '10px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = COLORS.accent;
        ctx.fillText('YAT', w - 67, 32);
        ctx.font = 'bold 18px "Courier New", monospace';
        ctx.fillText(isFinite(yatValue) ? yatValue.toFixed(2) : '∞', w - 67, 55);

        // Slider
        const sliderX = 30;
        const sliderY = h / 2 - 80;
        const sliderH = 160;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(sliderX - 8, sliderY - 20, 30, sliderH + 45);

        // Slider track
        ctx.strokeStyle = COLORS.dim;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(sliderX + 7, sliderY);
        ctx.lineTo(sliderX + 7, sliderY + sliderH);
        ctx.stroke();

        // Slider handle
        const handleY = sliderY + (1 - alignment) * sliderH;
        ctx.fillStyle = COLORS.accent;
        ctx.beginPath();
        ctx.arc(sliderX + 7, handleY, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '9px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = COLORS.light;
        ctx.save();
        ctx.translate(sliderX + 7, sliderY + sliderH + 30);
        ctx.fillText('Align', 0, 0);
        ctx.restore();

        time += 0.02;
        animationFrame = requestAnimationFrame(draw);
    }

    let isDragging = false;

    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;

        if (x < 60) {
            isDragging = true;
            handleDrag(e);
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        if (isDragging) handleDrag(e);

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        canvas.style.cursor = x < 60 ? 'ns-resize' : 'crosshair';
    });

    function handleDrag(e) {
        const rect = canvas.getBoundingClientRect();
        const h = rect.height;
        const y = e.clientY - rect.top;

        const sliderY = h / 2 - 80;
        const sliderH = 160;

        const newAlignment = 1 - Math.max(0, Math.min(1, (y - sliderY) / sliderH));
        if (Math.abs(newAlignment - alignment) > 0.01) {
            alignment = newAlignment;
            generateSignalB();
        }
    }

    canvas.addEventListener('mouseup', () => isDragging = false);
    canvas.addEventListener('mouseleave', () => isDragging = false);

    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;

        if (x > 60) {
            signalA = normalize(randomVector(dims, 1));
            generateSignalB();
        }
    });

    resize();
    draw();
    window.addEventListener('resize', resize);
}
