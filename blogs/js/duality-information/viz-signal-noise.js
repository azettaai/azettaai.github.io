import { COLORS, randomVector, normalize, dot, yat } from './common.js';

export function initVizSignalNoise() {
    const canvas = document.getElementById('viz-signal-noise');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrame;
    let time = 0;
    let alignment = 0.8;
    let isDragging = false;

    const hexToRgba = (hex, alpha) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    // Two signal vectors
    const dims = 40;
    let signalA = normalize(randomVector(dims, 1));
    let signalB;

    function generateSignalB() {
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

        // Background gradient based on coherence
        const coherence = Math.abs(dot(signalA, signalB));
        const bgGrad = ctx.createLinearGradient(0, 0, w, h);
        bgGrad.addColorStop(0, hexToRgba(COLORS.primary, coherence * 0.05));
        bgGrad.addColorStop(1, hexToRgba(COLORS.wave, coherence * 0.05));
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Grid
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
        const waveHeight = 50;
        const waveY1 = 85;
        const waveY2 = 180;
        const waveX = 80;
        const waveW = w - 130;

        // Draw waveform backgrounds
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(waveX - 10, waveY1 - waveHeight - 15, waveW + 20, waveHeight * 2 + 30);
        ctx.fillRect(waveX - 10, waveY2 - waveHeight - 15, waveW + 20, waveHeight * 2 + 30);

        // Draw Signal A waveform with glow
        const drawWave = (signal, baseY, color, label) => {
            // Glow
            ctx.strokeStyle = hexToRgba(color, 0.2);
            ctx.lineWidth = 8;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            for (let i = 0; i < dims; i++) {
                const x = waveX + (i / (dims - 1)) * waveW;
                const phase = time * 3 + i * 0.15;
                const y = baseY + signal[i] * waveHeight * 0.85 + Math.sin(phase) * 2;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Main line
            ctx.strokeStyle = color;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            for (let i = 0; i < dims; i++) {
                const x = waveX + (i / (dims - 1)) * waveW;
                const phase = time * 3 + i * 0.15;
                const y = baseY + signal[i] * waveHeight * 0.85 + Math.sin(phase) * 2;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Label
            ctx.fillStyle = color;
            ctx.font = 'bold 11px "Courier New", monospace';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, waveX, baseY - waveHeight - 5);
        };

        drawWave(signalA, waveY1, COLORS.primary, '〜 Signal A');
        drawWave(signalB, waveY2, COLORS.wave, '〜 Signal B');

        // Calculate metrics
        const dotProduct = dot(signalA, signalB);
        const yatValue = yat(signalA, signalB);

        // Coherence meter
        const meterX = w / 2 - 120;
        const meterY = h - 95;
        const meterW = 240;
        const meterH = 30;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(meterX - 15, meterY - 40, meterW + 30, meterH + 70);

        const panelGrad = ctx.createLinearGradient(meterX - 15, meterY, meterX + meterW + 15, meterY);
        panelGrad.addColorStop(0, '#e63946');
        panelGrad.addColorStop(0.5, COLORS.signal);
        panelGrad.addColorStop(1, COLORS.primary);
        ctx.strokeStyle = panelGrad;
        ctx.lineWidth = 2;
        ctx.strokeRect(meterX - 15, meterY - 40, meterW + 30, meterH + 70);

        ctx.fillStyle = COLORS.light;
        ctx.font = 'bold 12px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SIGNAL COHERENCE', w / 2, meterY - 22);

        // Meter background with segments
        ctx.fillStyle = 'rgba(50, 50, 50, 0.9)';
        ctx.fillRect(meterX, meterY, meterW, meterH);

        // Meter fill with gradient
        const fillGrad = ctx.createLinearGradient(meterX, 0, meterX + meterW, 0);
        fillGrad.addColorStop(0, '#e63946');
        fillGrad.addColorStop(0.35, '#f4a261');
        fillGrad.addColorStop(0.7, '#2a9d8f');
        fillGrad.addColorStop(1, COLORS.primary);
        ctx.fillStyle = fillGrad;
        ctx.fillRect(meterX, meterY, meterW * coherence, meterH);

        // Meter segments
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 1;
        for (let i = 1; i < 10; i++) {
            const sx = meterX + (i / 10) * meterW;
            ctx.beginPath();
            ctx.moveTo(sx, meterY);
            ctx.lineTo(sx, meterY + meterH);
            ctx.stroke();
        }

        // Meter border
        ctx.strokeStyle = COLORS.light;
        ctx.lineWidth = 2;
        ctx.strokeRect(meterX, meterY, meterW, meterH);

        // Coherence indicator needle
        const needleX = meterX + meterW * coherence;
        ctx.fillStyle = COLORS.light;
        ctx.beginPath();
        ctx.moveTo(needleX, meterY - 5);
        ctx.lineTo(needleX - 6, meterY - 12);
        ctx.lineTo(needleX + 6, meterY - 12);
        ctx.closePath();
        ctx.fill();

        // Labels
        ctx.font = '10px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#e63946';
        ctx.fillText('NOISE', meterX, meterY + meterH + 18);
        ctx.textAlign = 'right';
        ctx.fillStyle = COLORS.primary;
        ctx.fillText('SIGNAL', meterX + meterW, meterY + meterH + 18);

        // Percentage
        ctx.font = 'bold 16px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = COLORS.light;
        ctx.fillText(`${(coherence * 100).toFixed(0)}%`, w / 2, meterY + 22);

        // Yat display
        const yatX = w - 115;
        const yatY = 15;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(yatX, yatY, 100, 60);
        ctx.strokeStyle = COLORS.accent;
        ctx.lineWidth = 2;
        ctx.strokeRect(yatX, yatY, 100, 60);

        ctx.font = '10px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = COLORS.dim;
        ctx.fillText('YAT', yatX + 50, yatY + 18);
        ctx.font = 'bold 20px "Courier New", monospace';
        ctx.fillStyle = COLORS.accent;
        ctx.fillText(isFinite(yatValue) ? yatValue.toFixed(2) : '∞', yatX + 50, yatY + 44);

        // Alignment slider
        const sliderX = 30;
        const sliderY = h / 2 - 90;
        const sliderH = 180;

        // Slider background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(sliderX - 12, sliderY - 25, 40, sliderH + 55);
        ctx.strokeStyle = COLORS.grid;
        ctx.lineWidth = 1;
        ctx.strokeRect(sliderX - 12, sliderY - 25, 40, sliderH + 55);

        // Slider label
        ctx.font = 'bold 9px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = COLORS.light;
        ctx.fillText('ALIGN', sliderX + 8, sliderY - 10);

        // Slider track with gradient
        const trackGrad = ctx.createLinearGradient(0, sliderY, 0, sliderY + sliderH);
        trackGrad.addColorStop(0, COLORS.primary);
        trackGrad.addColorStop(1, '#e63946');
        ctx.fillStyle = trackGrad;
        ctx.fillRect(sliderX + 4, sliderY, 8, sliderH);
        ctx.strokeStyle = COLORS.dim;
        ctx.lineWidth = 1;
        ctx.strokeRect(sliderX + 4, sliderY, 8, sliderH);

        // Slider handle
        const handleY = sliderY + (1 - alignment) * sliderH;
        ctx.fillStyle = COLORS.accent;
        ctx.beginPath();
        ctx.arc(sliderX + 8, handleY, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = COLORS.light;
        ctx.font = 'bold 10px "Courier New", monospace';
        ctx.fillText(`${Math.round(alignment * 100)}`, sliderX + 8, handleY + 3);

        // Min/max labels
        ctx.font = '9px "Courier New", monospace';
        ctx.fillStyle = COLORS.dim;
        ctx.fillText('100%', sliderX + 8, sliderY + sliderH + 20);
        ctx.fillText('0%', sliderX + 8, sliderY - 2);

        time += 0.018;
        animationFrame = requestAnimationFrame(draw);
    }

    function handleDrag(e) {
        const rect = canvas.getBoundingClientRect();
        const h = rect.height;
        const y = e.clientY - rect.top;

        const sliderY = h / 2 - 90;
        const sliderH = 180;

        const newAlignment = 1 - Math.max(0, Math.min(1, (y - sliderY) / sliderH));
        if (Math.abs(newAlignment - alignment) > 0.005) {
            alignment = newAlignment;
            generateSignalB();
        }
    }

    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;

        if (x < 70) {
            isDragging = true;
            handleDrag(e);
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        if (isDragging) handleDrag(e);

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        canvas.style.cursor = x < 70 ? 'ns-resize' : 'crosshair';
    });

    canvas.addEventListener('mouseup', () => isDragging = false);
    canvas.addEventListener('mouseleave', () => isDragging = false);

    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;

        if (x > 70) {
            signalA = normalize(randomVector(dims, 1));
            generateSignalB();
        }
    });

    resize();
    draw();
    window.addEventListener('resize', resize);
}
