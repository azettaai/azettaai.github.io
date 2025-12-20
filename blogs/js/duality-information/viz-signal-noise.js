import { COLORS, randomVector, normalize, dot, yat } from './common.js';

export function initVizSignalNoise() {
    const canvas = document.getElementById('viz-signal-noise');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrame;
    let time = 0;
    let alignment = 0.75;
    let isDragging = false;
    let hoveredButton = null;
    let hoveredPreset = null;

    const hexToRgba = (hex, alpha) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    // Presets - including New Signals
    const presets = [
        { label: '🎲 New', value: -1, icon: '' },
        { label: 'Identical', value: 1.0, icon: '=' },
        { label: 'High', value: 0.8, icon: '≈' },
        { label: 'Medium', value: 0.5, icon: '~' },
        { label: 'Low', value: 0.15, icon: '≠' }
    ];

    // Two signal vectors
    const dims = 32;
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
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
        const rect = canvas.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;

        ctx.clearRect(0, 0, w, h);

        // Calculate coherence
        const coherence = Math.abs(dot(signalA, signalB));
        const yatValue = yat(signalA, signalB);

        // Subtle grid
        ctx.strokeStyle = 'rgba(27, 153, 139, 0.04)';
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 30) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = 0; y < h; y += 30) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        // Layout
        const leftPanel = 70;
        const rightPanel = 150;
        const waveArea = { x: leftPanel, y: 50, w: w - leftPanel - rightPanel, h: h - 120 };

        // Draw waveforms
        const waveH = (waveArea.h - 40) / 2;
        const wave1Y = waveArea.y + waveH / 2 + 15;
        const wave2Y = waveArea.y + waveH + waveH / 2 + 35;

        const drawWave = (signal, baseY, color, label, secondary = false) => {
            // Background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.beginPath();
            ctx.roundRect(waveArea.x - 5, baseY - waveH / 2 - 20, waveArea.w + 10, waveH + 25, 5);
            ctx.fill();

            // Zero line
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(waveArea.x, baseY);
            ctx.lineTo(waveArea.x + waveArea.w, baseY);
            ctx.stroke();
            ctx.setLineDash([]);

            // Glow
            ctx.strokeStyle = hexToRgba(color, 0.25);
            ctx.lineWidth = 10;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            for (let i = 0; i < dims; i++) {
                const x = waveArea.x + (i / (dims - 1)) * waveArea.w;
                const phase = time * 2.5 + i * 0.1;
                const y = baseY + signal[i] * (waveH / 2) * 0.85 + Math.sin(phase) * 2;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Main line
            ctx.strokeStyle = color;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            for (let i = 0; i < dims; i++) {
                const x = waveArea.x + (i / (dims - 1)) * waveArea.w;
                const phase = time * 2.5 + i * 0.1;
                const y = baseY + signal[i] * (waveH / 2) * 0.85 + Math.sin(phase) * 2;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Points
            for (let i = 0; i < dims; i += 4) {
                const x = waveArea.x + (i / (dims - 1)) * waveArea.w;
                const phase = time * 2.5 + i * 0.1;
                const y = baseY + signal[i] * (waveH / 2) * 0.85 + Math.sin(phase) * 2;
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fill();
            }

            // Label
            ctx.fillStyle = color;
            ctx.font = 'bold 10px "Courier New", monospace';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, waveArea.x, baseY - waveH / 2 - 8);
        };

        drawWave(signalA, wave1Y, COLORS.primary, '〜 Signal A (Reference)');
        drawWave(signalB, wave2Y, COLORS.wave, '〜 Signal B (Variable)');

        // Alignment slider (left side)
        const sliderX = 30;
        const sliderY = waveArea.y + 30;
        const sliderH = waveArea.h - 40;

        // Slider background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.beginPath();
        ctx.roundRect(sliderX - 18, sliderY - 20, 42, sliderH + 50, 5);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Slider label
        ctx.font = 'bold 9px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = COLORS.light;
        ctx.fillText('ALIGN', sliderX + 3, sliderY - 5);

        // Slider track
        const trackGrad = ctx.createLinearGradient(0, sliderY + 10, 0, sliderY + sliderH);
        trackGrad.addColorStop(0, COLORS.primary);
        trackGrad.addColorStop(0.5, COLORS.signal);
        trackGrad.addColorStop(1, '#e63946');
        ctx.fillStyle = trackGrad;
        ctx.beginPath();
        ctx.roundRect(sliderX, sliderY + 10, 6, sliderH - 10, 3);
        ctx.fill();

        // Slider handle
        const handleY = sliderY + 10 + (1 - alignment) * (sliderH - 10);

        // Handle glow
        ctx.fillStyle = hexToRgba(COLORS.accent, 0.3);
        ctx.beginPath();
        ctx.arc(sliderX + 3, handleY, 18, 0, Math.PI * 2);
        ctx.fill();

        // Handle
        ctx.fillStyle = COLORS.accent;
        ctx.beginPath();
        ctx.arc(sliderX + 3, handleY, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px "Courier New", monospace';
        ctx.fillText(`${Math.round(alignment * 100)}`, sliderX + 3, handleY + 3);

        // Track markers
        ctx.font = '8px "Courier New", monospace';
        ctx.fillStyle = COLORS.dim;
        ctx.fillText('100', sliderX + 3, sliderY + sliderH + 18);

        // Right panel
        const panelX = w - rightPanel + 15;
        const panelW = rightPanel - 25;

        // Coherence meter
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.beginPath();
        ctx.roundRect(panelX, waveArea.y, panelW, 100, 5);
        ctx.fill();

        // Meter border gradient based on coherence
        const meterBorder = ctx.createLinearGradient(panelX, waveArea.y, panelX + panelW, waveArea.y);
        meterBorder.addColorStop(0, coherence > 0.7 ? COLORS.primary : '#e63946');
        meterBorder.addColorStop(1, coherence > 0.7 ? COLORS.wave : COLORS.signal);
        ctx.strokeStyle = meterBorder;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = 'bold 10px "Courier New", monospace';
        ctx.fillStyle = COLORS.dim;
        ctx.textAlign = 'left';
        ctx.fillText('COHERENCE', panelX + 10, waveArea.y + 18);

        // Percentage
        ctx.font = 'bold 28px "Courier New", monospace';
        ctx.fillStyle = coherence > 0.7 ? COLORS.primary : (coherence > 0.4 ? COLORS.signal : '#e63946');
        ctx.textAlign = 'center';
        ctx.fillText(`${(coherence * 100).toFixed(0)}%`, panelX + panelW / 2, waveArea.y + 52);

        // Mini meter bar
        const miniMeterY = waveArea.y + 70;
        ctx.fillStyle = 'rgba(50,50,50,0.8)';
        ctx.beginPath();
        ctx.roundRect(panelX + 10, miniMeterY, panelW - 20, 8, 4);
        ctx.fill();

        const meterGrad = ctx.createLinearGradient(panelX + 10, 0, panelX + panelW - 10, 0);
        meterGrad.addColorStop(0, '#e63946');
        meterGrad.addColorStop(0.5, COLORS.signal);
        meterGrad.addColorStop(1, COLORS.primary);
        ctx.fillStyle = meterGrad;
        ctx.beginPath();
        ctx.roundRect(panelX + 10, miniMeterY, (panelW - 20) * coherence, 8, 4);
        ctx.fill();

        // Status label
        const status = coherence > 0.9 ? 'SYNCHRONIZED' :
            coherence > 0.7 ? 'HIGH MATCH' :
                coherence > 0.4 ? 'PARTIAL' :
                    coherence > 0.2 ? 'LOW MATCH' : 'NOISE';
        ctx.font = '9px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = coherence > 0.7 ? COLORS.primary : (coherence > 0.4 ? COLORS.signal : '#e63946');
        ctx.fillText(status, panelX + panelW / 2, waveArea.y + 92);

        // Yat display
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.beginPath();
        ctx.roundRect(panelX, waveArea.y + 115, panelW, 65, 5);
        ctx.fill();
        ctx.strokeStyle = COLORS.accent;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = 'bold 10px "Courier New", monospace';
        ctx.fillStyle = COLORS.dim;
        ctx.textAlign = 'left';
        ctx.fillText('YAT VALUE', panelX + 10, waveArea.y + 133);

        ctx.font = 'bold 22px "Courier New", monospace';
        ctx.fillStyle = COLORS.accent;
        ctx.textAlign = 'center';
        ctx.fillText(isFinite(yatValue) ? yatValue.toFixed(2) : '∞', panelX + panelW / 2, waveArea.y + 162);

        // Presets (compact)
        const presetY = waveArea.y + 195;
        const presetH = 22;
        const presetGap = 3;

        ctx.font = 'bold 9px "Courier New", monospace';
        ctx.fillStyle = COLORS.dim;
        ctx.textAlign = 'left';
        ctx.fillText('PRESETS', panelX + 10, presetY - 8);

        for (let i = 0; i < presets.length; i++) {
            const y = presetY + i * (presetH + presetGap);
            const isHovered = hoveredPreset === i;
            const isActive = Math.abs(alignment - presets[i].value) < 0.05;

            ctx.fillStyle = isActive ? hexToRgba(COLORS.primary, 0.35) : (isHovered ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.6)');
            ctx.beginPath();
            ctx.roundRect(panelX, y, panelW, presetH, 4);
            ctx.fill();

            ctx.strokeStyle = isActive ? COLORS.primary : (isHovered ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)');
            ctx.lineWidth = isActive ? 2 : 1;
            ctx.stroke();

            ctx.font = '10px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = isActive ? COLORS.light : (isHovered ? COLORS.light : COLORS.dim);
            ctx.fillText(`${presets[i].icon} ${presets[i].label}`, panelX + panelW / 2, y + presetH / 2);
        }

        time += 0.02;
        animationFrame = requestAnimationFrame(draw);
    }

    function getLayout() {
        const rect = canvas.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;
        const leftPanel = 70;
        const rightPanel = 150;
        const waveArea = { x: leftPanel, y: 50, w: w - leftPanel - rightPanel, h: h - 120 };
        const sliderY = waveArea.y + 30;
        const sliderH = waveArea.h - 40;
        const panelX = w - rightPanel + 15;
        const panelW = rightPanel - 25;
        return { w, h, waveArea, sliderY, sliderH, panelX, panelW };
    }

    function handleDrag(e) {
        const { sliderY, sliderH } = getLayout();
        const rect = canvas.getBoundingClientRect();
        const y = e.clientY - rect.top;

        const newAlignment = 1 - Math.max(0, Math.min(1, (y - sliderY - 10) / (sliderH - 10)));
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
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const { waveArea, panelX, panelW } = getLayout();

        if (isDragging) {
            handleDrag(e);
            canvas.style.cursor = 'grabbing';
            return;
        }

        hoveredButton = null;
        hoveredPreset = null;

        // Check slider area
        if (mouseX < 70) {
            canvas.style.cursor = 'grab';
            return;
        }

        // Check presets
        const presetY = waveArea.y + 195;
        const presetH = 22;
        const presetGap = 3;

        for (let i = 0; i < presets.length; i++) {
            const y = presetY + i * (presetH + presetGap);
            if (mouseX >= panelX && mouseX <= panelX + panelW && mouseY >= y && mouseY <= y + presetH) {
                hoveredPreset = i;
                canvas.style.cursor = 'pointer';
                return;
            }
        }

        canvas.style.cursor = 'default';
    });

    canvas.addEventListener('mouseup', () => {
        isDragging = false;
    });

    canvas.addEventListener('mouseleave', () => {
        isDragging = false;
        hoveredButton = null;
        hoveredPreset = null;
        canvas.style.cursor = 'default';
    });

    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const { waveArea, panelX, panelW } = getLayout();

        // Check presets
        const presetY = waveArea.y + 195;
        const presetH = 22;
        const presetGap = 3;

        for (let i = 0; i < presets.length; i++) {
            const y = presetY + i * (presetH + presetGap);
            if (mouseX >= panelX && mouseX <= panelX + panelW && mouseY >= y && mouseY <= y + presetH) {
                if (presets[i].value < 0) {
                    // New signals
                    signalA = normalize(randomVector(dims, 1));
                } else {
                    alignment = presets[i].value;
                }
                generateSignalB();
                return;
            }
        }
    });

    resize();
    draw();
    window.addEventListener('resize', resize);
}
