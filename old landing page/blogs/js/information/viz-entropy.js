import { COLORS, drawText } from './common.js';

/**
 * Visualization: Shannon Entropy vs Meaning
 * Shows that two messages can have identical entropy but completely different meanings
 */
export function initVizEntropy() {
    const canvas = document.getElementById('viz-entropy-meaning');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animFrame = 0;

    function resize() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    // Two messages with same character distribution (same entropy)
    const message1 = { text: "THE CAT SAT", meaning: "A feline resting" };
    const message2 = { text: "ACT HAS TAT", meaning: "???" };

    function getCharFrequency(text) {
        const freq = {};
        for (const char of text.replace(/\s/g, '')) {
            freq[char] = (freq[char] || 0) + 1;
        }
        return freq;
    }

    function calculateEntropy(freq) {
        const total = Object.values(freq).reduce((a, b) => a + b, 0);
        let entropy = 0;
        for (const count of Object.values(freq)) {
            const p = count / total;
            entropy -= p * Math.log2(p);
        }
        return entropy;
    }

    const freq1 = getCharFrequency(message1.text);
    const freq2 = getCharFrequency(message2.text);
    const entropy1 = calculateEntropy(freq1);
    const entropy2 = calculateEntropy(freq2);

    function draw() {
        const w = canvas.getBoundingClientRect().width;
        const h = canvas.getBoundingClientRect().height;

        // Background
        const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.6);
        bgGrad.addColorStop(0, '#1a1a2e');
        bgGrad.addColorStop(1, '#0d0d15');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        const leftX = w * 0.25;
        const rightX = w * 0.75;
        const centerY = h * 0.4;

        // Draw entropy bars
        const barWidth = 80;
        const maxBarHeight = 60;
        const normalizedEntropy = entropy1 / 3; // Normalize to ~0-1

        // Left message
        ctx.fillStyle = COLORS.primary;
        ctx.fillRect(leftX - barWidth / 2, centerY - maxBarHeight * normalizedEntropy, barWidth, maxBarHeight * normalizedEntropy);
        ctx.strokeStyle = COLORS.primary;
        ctx.lineWidth = 2;
        ctx.strokeRect(leftX - barWidth / 2, centerY - maxBarHeight, barWidth, maxBarHeight);

        // Right message
        ctx.fillStyle = COLORS.secondary;
        ctx.fillRect(rightX - barWidth / 2, centerY - maxBarHeight * normalizedEntropy, barWidth, maxBarHeight * normalizedEntropy);
        ctx.strokeStyle = COLORS.secondary;
        ctx.strokeRect(rightX - barWidth / 2, centerY - maxBarHeight, barWidth, maxBarHeight);

        // Labels
        drawText(ctx, `H = ${entropy1.toFixed(2)} bits`, leftX, centerY + 25, { color: COLORS.primary, size: 11 });
        drawText(ctx, `H = ${entropy2.toFixed(2)} bits`, rightX, centerY + 25, { color: COLORS.secondary, size: 11 });

        drawText(ctx, message1.text, leftX, centerY + 55, { color: '#fff', size: 14 });
        drawText(ctx, message2.text, rightX, centerY + 55, { color: '#fff', size: 14 });

        // Meaning section
        const meaningY = h * 0.75;

        // Left: clear meaning
        ctx.fillStyle = 'rgba(27, 153, 139, 0.2)';
        ctx.beginPath();
        ctx.roundRect(leftX - 70, meaningY - 25, 140, 50, 8);
        ctx.fill();
        ctx.strokeStyle = COLORS.primary;
        ctx.lineWidth = 1;
        ctx.stroke();
        drawText(ctx, message1.meaning, leftX, meaningY + 5, { color: COLORS.primary, size: 11 });

        // Right: no meaning
        ctx.fillStyle = 'rgba(237, 33, 124, 0.1)';
        ctx.beginPath();
        ctx.roundRect(rightX - 70, meaningY - 25, 140, 50, 8);
        ctx.fill();
        ctx.strokeStyle = 'rgba(237, 33, 124, 0.4)';
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        drawText(ctx, message2.meaning, rightX, meaningY + 5, { color: COLORS.dim, size: 11 });

        // Title
        drawText(ctx, 'Same Entropy, Different Meaning', w / 2, 25, { color: '#888', size: 11 });

        // Insight
        drawText(ctx, 'Shannon entropy measures surprise, not understanding', w / 2, h - 15, { color: '#555', size: 9 });

        animFrame++;
        requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener('resize', () => { resize(); });
}
