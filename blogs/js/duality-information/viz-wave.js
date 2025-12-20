import { COLORS, randomVector, normalize, magnitude } from './common.js';

export function initVizWave() {
    const canvas = document.getElementById('viz-wave');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrame;
    let time = 0;
    let viewMode = 0; // 0 = particle, 1 = wave, 2 = both
    let transitionProgress = 0;
    let hoveredButton = null;
    let hoveredDim = null;

    const hexToRgba = (hex, alpha) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    // View modes
    const views = [
        { id: 0, label: 'Particle', icon: '⚛', color: COLORS.primary },
        { id: 1, label: 'Wave', icon: '〜', color: COLORS.wave },
        { id: 2, label: 'Both', icon: '⇌', color: COLORS.accent }
    ];

    // Generate vectors
    const dims = 16;
    let vector = randomVector(dims, 2);

    function resize() {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function draw() {
        const rect = canvas.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;

        ctx.clearRect(0, 0, w, h);

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

        // Smooth transition
        const targetProgress = viewMode === 0 ? 0 : (viewMode === 1 ? 1 : 0.5);
        transitionProgress += (targetProgress - transitionProgress) * 0.08;
        const showWave = viewMode >= 1;
        const showParticle = viewMode !== 1;

        const rawVector = vector;
        const normVector = normalize(vector);
        const rawMag = magnitude(vector);

        // Layout
        const margin = { left: 60, right: 180, top: 55, bottom: 60 };
        const plotW = w - margin.left - margin.right;
        const plotH = h - margin.top - margin.bottom;
        const barWidth = plotW / dims;
        const baseY = margin.top + plotH / 2;

        const maxVal = Math.max(...rawVector.map(Math.abs), 0.1);
        const barMaxHeight = plotH * 0.45;

        // Draw wave line (behind bars)
        if (showWave) {
            const waveAlpha = viewMode === 1 ? 0.9 : 0.5;

            // Glow
            ctx.strokeStyle = hexToRgba(COLORS.wave, waveAlpha * 0.3);
            ctx.lineWidth = 12;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            for (let i = 0; i < dims; i++) {
                const x = margin.left + i * barWidth + barWidth / 2;
                const phase = time * 2 + i * 0.12;
                const y = baseY - normVector[i] * barMaxHeight * 0.9 + Math.sin(phase) * 3;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Main line
            ctx.strokeStyle = hexToRgba(COLORS.wave, waveAlpha);
            ctx.lineWidth = 3;
            ctx.beginPath();
            for (let i = 0; i < dims; i++) {
                const x = margin.left + i * barWidth + barWidth / 2;
                const phase = time * 2 + i * 0.12;
                const y = baseY - normVector[i] * barMaxHeight * 0.9 + Math.sin(phase) * 3;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Wave points
            for (let i = 0; i < dims; i++) {
                const x = margin.left + i * barWidth + barWidth / 2;
                const phase = time * 2 + i * 0.12;
                const y = baseY - normVector[i] * barMaxHeight * 0.9 + Math.sin(phase) * 3;
                const isHovered = hoveredDim === i;

                ctx.fillStyle = hexToRgba(COLORS.wave, isHovered ? 1 : 0.8);
                ctx.beginPath();
                ctx.arc(x, y, isHovered ? 6 : 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Draw bars (particle view)
        if (showParticle) {
            const barAlpha = viewMode === 0 ? 1 : 0.6;

            for (let i = 0; i < dims; i++) {
                const val = rawVector[i];
                const barHeight = (Math.abs(val) / maxVal) * barMaxHeight;
                const x = margin.left + i * barWidth;
                const barColor = val > 0 ? COLORS.proton : COLORS.electron;
                const isHovered = hoveredDim === i;

                // Bar glow
                if (isHovered) {
                    ctx.fillStyle = hexToRgba(barColor, 0.3);
                    const glowPad = 6;
                    if (val >= 0) {
                        ctx.fillRect(x - glowPad, baseY - barHeight - glowPad, barWidth + glowPad * 2, barHeight + glowPad * 2);
                    } else {
                        ctx.fillRect(x - glowPad, baseY - glowPad, barWidth + glowPad * 2, barHeight + glowPad * 2);
                    }
                }

                // Bar gradient
                const barGrad = ctx.createLinearGradient(x, baseY - barHeight, x, baseY + barHeight);
                if (val >= 0) {
                    barGrad.addColorStop(0, hexToRgba(barColor, barAlpha));
                    barGrad.addColorStop(1, hexToRgba(barColor, barAlpha * 0.4));
                } else {
                    barGrad.addColorStop(0, hexToRgba(barColor, barAlpha * 0.4));
                    barGrad.addColorStop(1, hexToRgba(barColor, barAlpha));
                }
                ctx.fillStyle = barGrad;

                const barGap = 3;
                if (val >= 0) {
                    ctx.beginPath();
                    ctx.roundRect(x + barGap, baseY - barHeight, barWidth - barGap * 2, barHeight, 3);
                    ctx.fill();
                } else {
                    ctx.beginPath();
                    ctx.roundRect(x + barGap, baseY, barWidth - barGap * 2, barHeight, 3);
                    ctx.fill();
                }

                // Highlight border
                if (isHovered) {
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    if (val >= 0) {
                        ctx.strokeRect(x + barGap, baseY - barHeight, barWidth - barGap * 2, barHeight);
                    } else {
                        ctx.strokeRect(x + barGap, baseY, barWidth - barGap * 2, barHeight);
                    }
                }
            }
        }

        // Zero line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(margin.left, baseY);
        ctx.lineTo(w - margin.right, baseY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Dimension labels
        ctx.font = '9px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        for (let i = 0; i < dims; i++) {
            const x = margin.left + i * barWidth + barWidth / 2;
            const isHovered = hoveredDim === i;
            ctx.fillStyle = isHovered ? COLORS.accent : COLORS.dim;
            ctx.fillText(`d${i + 1}`, x, h - margin.bottom + 8);
        }

        // Y-axis labels
        ctx.font = '9px "Courier New", monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = COLORS.dim;
        ctx.fillText('+', margin.left - 10, baseY - barMaxHeight * 0.8);
        ctx.fillText('0', margin.left - 10, baseY);
        ctx.fillText('−', margin.left - 10, baseY + barMaxHeight * 0.8);

        // Right side panel
        const panelX = w - margin.right + 15;
        const panelW = margin.right - 25;

        // Stats box
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.beginPath();
        ctx.roundRect(panelX, margin.top, panelW, 90, 5);
        ctx.fill();
        ctx.strokeStyle = hexToRgba(COLORS.primary, 0.4);
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = 'bold 10px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = COLORS.dim;
        ctx.fillText('VECTOR', panelX + 10, margin.top + 18);

        ctx.font = '10px "Courier New", monospace';
        ctx.fillStyle = COLORS.light;
        ctx.fillText(`Dims: ${dims}`, panelX + 10, margin.top + 38);
        ctx.fillText(`‖v‖ = ${rawMag.toFixed(2)}`, panelX + 10, margin.top + 55);
        ctx.fillText(`‖v̂‖ = 1.00`, panelX + 10, margin.top + 72);

        // Hovered dimension info
        if (hoveredDim !== null) {
            const infoY = margin.top + 105;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
            ctx.beginPath();
            ctx.roundRect(panelX, infoY, panelW, 75, 5);
            ctx.fill();
            ctx.strokeStyle = COLORS.accent;
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.font = 'bold 10px "Courier New", monospace';
            ctx.fillStyle = COLORS.dim;
            ctx.fillText(`DIMENSION ${hoveredDim + 1}`, panelX + 10, infoY + 18);

            ctx.font = '10px "Courier New", monospace';
            ctx.fillStyle = COLORS.light;
            const rawVal = rawVector[hoveredDim];
            const normVal = normVector[hoveredDim];
            ctx.fillText(`Raw: ${rawVal.toFixed(3)}`, panelX + 10, infoY + 38);
            ctx.fillText(`Norm: ${normVal.toFixed(3)}`, panelX + 10, infoY + 55);

            const sign = rawVal > 0 ? 'Positive' : (rawVal < 0 ? 'Negative' : 'Zero');
            ctx.fillStyle = rawVal > 0 ? COLORS.proton : (rawVal < 0 ? COLORS.electron : COLORS.dim);
            ctx.fillText(sign, panelX + 10, infoY + 72);
        }

        // View toggle buttons (top - below header)
        const btnW = 70;
        const btnH = 28;
        const btnGap = 8;
        const totalBtnW = views.length * btnW + (views.length - 1) * btnGap;
        const btnStartX = margin.left + (plotW - totalBtnW) / 2;
        const btnY = 8;

        for (let i = 0; i < views.length; i++) {
            const x = btnStartX + i * (btnW + btnGap);
            const isActive = views[i].id === viewMode;
            const isHover = hoveredButton === `view_${i}`;

            ctx.fillStyle = isActive ? hexToRgba(views[i].color, 0.35) : (isHover ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.6)');
            ctx.beginPath();
            ctx.roundRect(x, btnY, btnW, btnH, 5);
            ctx.fill();

            ctx.strokeStyle = isActive ? views[i].color : (isHover ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.12)');
            ctx.lineWidth = isActive ? 2 : 1;
            ctx.stroke();

            ctx.font = '10px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = isActive ? views[i].color : (isHover ? COLORS.light : COLORS.dim);
            ctx.fillText(`${views[i].icon} ${views[i].label}`, x + btnW / 2, btnY + btnH / 2);
        }

        // New vector button (bottom right)
        const newBtnX = panelX;
        const newBtnY = h - 50;
        const newBtnW = panelW;
        const newBtnH = 32;
        const isNewHover = hoveredButton === 'new';

        ctx.fillStyle = isNewHover ? hexToRgba(COLORS.primary, 0.3) : 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.roundRect(newBtnX, newBtnY, newBtnW, newBtnH, 4);
        ctx.fill();

        ctx.strokeStyle = isNewHover ? COLORS.primary : 'rgba(255,255,255,0.2)';
        ctx.lineWidth = isNewHover ? 2 : 1;
        ctx.stroke();

        ctx.font = '10px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = isNewHover ? COLORS.light : COLORS.dim;
        ctx.fillText('🎲 New Vector', newBtnX + newBtnW / 2, newBtnY + newBtnH / 2);

        // Note: Title is rendered in HTML header, not drawn here

        time += 0.02;
        animationFrame = requestAnimationFrame(draw);
    }

    function getHoverTarget(mouseX, mouseY) {
        const rect = canvas.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;

        const margin = { left: 60, right: 180, top: 55, bottom: 60 };
        const plotW = w - margin.left - margin.right;
        const plotH = h - margin.top - margin.bottom;
        const barWidth = plotW / dims;

        // Check view buttons - must match draw() dimensions
        const btnW = 70, btnH = 28, btnGap = 8;
        const totalBtnW = views.length * btnW + (views.length - 1) * btnGap;
        const btnStartX = margin.left + (plotW - totalBtnW) / 2;
        const btnY = 8;

        for (let i = 0; i < views.length; i++) {
            const x = btnStartX + i * (btnW + btnGap);
            if (mouseX >= x && mouseX <= x + btnW && mouseY >= btnY && mouseY <= btnY + btnH) {
                return { type: 'viewBtn', index: i };
            }
        }

        // Check new vector button
        const panelX = w - margin.right + 15;
        const panelW = margin.right - 25;
        const newBtnY = h - 50;
        const newBtnH = 32;

        if (mouseX >= panelX && mouseX <= panelX + panelW && mouseY >= newBtnY && mouseY <= newBtnY + newBtnH) {
            return { type: 'newBtn' };
        }

        // Check dimensions
        if (mouseX >= margin.left && mouseX <= w - margin.right && mouseY >= margin.top && mouseY <= h - margin.bottom) {
            const dimIndex = Math.floor((mouseX - margin.left) / barWidth);
            if (dimIndex >= 0 && dimIndex < dims) {
                return { type: 'dim', index: dimIndex };
            }
        }

        return null;
    }

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        hoveredButton = null;
        hoveredDim = null;

        const target = getHoverTarget(mouseX, mouseY);
        if (target) {
            if (target.type === 'viewBtn') {
                hoveredButton = `view_${target.index}`;
                canvas.style.cursor = 'pointer';
            } else if (target.type === 'newBtn') {
                hoveredButton = 'new';
                canvas.style.cursor = 'pointer';
            } else if (target.type === 'dim') {
                hoveredDim = target.index;
                canvas.style.cursor = 'pointer';
            }
        } else {
            canvas.style.cursor = 'default';
        }
    });

    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const target = getHoverTarget(mouseX, mouseY);
        if (target) {
            if (target.type === 'viewBtn') {
                viewMode = views[target.index].id;
            } else if (target.type === 'newBtn') {
                vector = randomVector(dims, 2);
            }
        }
    });

    canvas.addEventListener('mouseleave', () => {
        hoveredButton = null;
        hoveredDim = null;
        canvas.style.cursor = 'default';
    });

    resize();
    draw();
    window.addEventListener('resize', resize);
}
