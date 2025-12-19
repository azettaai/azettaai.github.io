import { COLORS } from './common.js';

export function initViz2D() {
    const canvas2d = document.getElementById('viz-2d');
    if (canvas2d) {
        const ctx2d = canvas2d.getContext('2d');
        let animating2d = false;
        let animProgress2d = 0;
        let currentPattern = 0;

        const patterns = [
            { name: 'Sinusoidal', color: '#e67ea3' },
            { name: 'Quadratic', color: '#1b998b' },
            { name: 'Exponential', color: '#f4a261' },
            { name: 'Logarithmic', color: '#9b5de5' },
            { name: 'Circular', color: '#00bbf9' },
            { name: 'Step Function', color: '#fee440' }
        ];

        function resize2d() {
            const rect = canvas2d.getBoundingClientRect();
            canvas2d.width = rect.width * window.devicePixelRatio;
            canvas2d.height = rect.height * window.devicePixelRatio;
            ctx2d.scale(window.devicePixelRatio, window.devicePixelRatio);
        }

        function generatePatternData(patternIndex) {
            const points = [];
            const w = canvas2d.getBoundingClientRect().width || 400;
            const h = canvas2d.getBoundingClientRect().height || 250;
            const cx = w / 2, cy = h / 2;

            for (let i = 0; i < 50; i++) {
                let x, y;
                const t = i / 50;
                const noise = () => (Math.random() - 0.5) * 20;

                switch (patternIndex) {
                    case 0: // Sinusoidal
                        x = 60 + t * (w - 120);
                        y = cy + Math.sin(t * Math.PI * 2) * 70 + noise();
                        break;
                    case 1: // Quadratic (parabola)
                        x = 60 + t * (w - 120);
                        const tx = (t - 0.5) * 2;
                        y = cy + tx * tx * 80 - 40 + noise();
                        break;
                    case 2: // Exponential
                        x = 60 + t * (w - 120);
                        y = h - 60 - Math.exp(t * 3) * 8 + noise();
                        break;
                    case 3: // Logarithmic
                        x = 60 + t * (w - 120);
                        y = h - 60 - Math.log(1 + t * 10) * 40 + noise();
                        break;
                    case 4: // Circular
                        const angle = t * Math.PI * 1.8;
                        const radius = 70;
                        x = cx + Math.cos(angle) * radius + noise() * 0.5;
                        y = cy + Math.sin(angle) * radius + noise() * 0.5;
                        break;
                    case 5: // Step function
                        x = 60 + t * (w - 120);
                        const step = Math.floor(t * 5);
                        y = h - 60 - step * 35 + noise() * 0.5;
                        break;
                }
                points.push({ x, y, baseX: x, baseY: y });
            }
            return points;
        }

        let points2d = generatePatternData(0);

        function drawCurveGuide(patternIndex, w, h) {
            const cx = w / 2, cy = h / 2;
            ctx2d.strokeStyle = patterns[patternIndex].color;
            ctx2d.lineWidth = 2;
            ctx2d.setLineDash([5, 5]);
            ctx2d.beginPath();

            for (let i = 0; i <= 100; i++) {
                let x, y;
                const t = i / 100;

                switch (patternIndex) {
                    case 0: // Sinusoidal
                        x = 60 + t * (w - 120);
                        y = cy + Math.sin(t * Math.PI * 2) * 70;
                        break;
                    case 1: // Quadratic
                        x = 60 + t * (w - 120);
                        const tx = (t - 0.5) * 2;
                        y = cy + tx * tx * 80 - 40;
                        break;
                    case 2: // Exponential
                        x = 60 + t * (w - 120);
                        y = h - 60 - Math.exp(t * 3) * 8;
                        break;
                    case 3: // Logarithmic
                        x = 60 + t * (w - 120);
                        y = h - 60 - Math.log(1 + t * 10) * 40;
                        break;
                    case 4: // Circular
                        const angle = t * Math.PI * 1.8;
                        x = cx + Math.cos(angle) * 70;
                        y = cy + Math.sin(angle) * 70;
                        break;
                    case 5: // Step function
                        x = 60 + t * (w - 120);
                        const step = Math.floor(t * 5);
                        y = h - 60 - step * 35;
                        break;
                }

                if (i === 0) ctx2d.moveTo(x, y);
                else ctx2d.lineTo(x, y);
            }
            ctx2d.stroke();
            ctx2d.setLineDash([]);
        }

        function draw2d() {
            const w = canvas2d.getBoundingClientRect().width;
            const h = canvas2d.getBoundingClientRect().height;

            ctx2d.clearRect(0, 0, w, h);

            // Grid
            ctx2d.strokeStyle = COLORS.grid;
            ctx2d.lineWidth = 1;
            for (let x = 50; x < w; x += 50) {
                ctx2d.beginPath();
                ctx2d.moveTo(x, 0);
                ctx2d.lineTo(x, h);
                ctx2d.stroke();
            }
            for (let y = 50; y < h; y += 50) {
                ctx2d.beginPath();
                ctx2d.moveTo(0, y);
                ctx2d.lineTo(w, y);
                ctx2d.stroke();
            }

            // Axes
            ctx2d.strokeStyle = COLORS.dim;
            ctx2d.lineWidth = 2;
            ctx2d.beginPath();
            ctx2d.moveTo(50, h - 50);
            ctx2d.lineTo(w - 50, h - 50);
            ctx2d.moveTo(50, h - 50);
            ctx2d.lineTo(50, 50);
            ctx2d.stroke();

            // Axis labels
            ctx2d.fillStyle = COLORS.dim;
            ctx2d.font = '12px "Courier New", monospace';
            ctx2d.fillText('Feature X', w - 100, h - 20);
            ctx2d.save();
            ctx2d.translate(20, 100);
            ctx2d.rotate(-Math.PI / 2);
            ctx2d.fillText('Feature Y', 0, 0);
            ctx2d.restore();

            // Draw curve guide
            drawCurveGuide(currentPattern, w, h);

            // Draw points
            points2d.forEach((p, i) => {
                const drawX = animating2d ? p.baseX + (p.x - p.baseX) * Math.min(animProgress2d * 2, 1) : p.x;
                const drawY = animating2d ? p.baseY + (p.y - p.baseY) * Math.min(animProgress2d * 2, 1) : p.y;

                ctx2d.beginPath();
                ctx2d.arc(drawX, drawY, 5, 0, Math.PI * 2);
                ctx2d.fillStyle = patterns[currentPattern].color;
                ctx2d.fill();
            });

            // Pattern label
            ctx2d.fillStyle = 'rgba(0,0,0,0.7)';
            ctx2d.fillRect(w - 140, 10, 130, 28);
            ctx2d.strokeStyle = patterns[currentPattern].color;
            ctx2d.lineWidth = 1;
            ctx2d.strokeRect(w - 140, 10, 130, 28);
            ctx2d.fillStyle = patterns[currentPattern].color;
            ctx2d.font = 'bold 11px "Courier New", monospace';
            ctx2d.fillText(patterns[currentPattern].name, w - 132, 29);

            if (animating2d) {
                animProgress2d += 0.02;
                if (animProgress2d >= 1) {
                    animating2d = false;
                    animProgress2d = 0;
                }
                requestAnimationFrame(draw2d);
            }
        }

        canvas2d.addEventListener('click', () => {
            currentPattern = (currentPattern + 1) % patterns.length;
            points2d = generatePatternData(currentPattern);
            animating2d = true;
            animProgress2d = 0;
            draw2d();
        });

        resize2d();
        draw2d();
        window.addEventListener('resize', () => { resize2d(); draw2d(); });
    }
}
