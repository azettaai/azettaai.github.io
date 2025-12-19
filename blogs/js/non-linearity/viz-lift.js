import { COLORS } from './common.js';

export function initVizLift() {
    const canvasLift = document.getElementById('viz-lift');
    if (canvasLift) {
        const ctxLift = canvasLift.getContext('2d');
        let liftAngle = 0.5;
        let showPlane = true;

        const xorpts = [
            { id: 0, x: 1, y: 1, c: 0 },
            { id: 1, x: -1, y: -1, c: 0 },
            { id: 2, x: -1, y: 1, c: 1 },
            { id: 3, x: 1, y: -1, c: 1 }
        ];

        function resizeLift() {
            const rect = canvasLift.getBoundingClientRect();
            canvasLift.width = rect.width * window.devicePixelRatio;
            canvasLift.height = rect.height * window.devicePixelRatio;
            ctxLift.scale(window.devicePixelRatio, window.devicePixelRatio);
        }

        function project3D(x, y, z, cx, cy, w, h) {
            const cos = Math.cos(liftAngle);
            const sin = Math.sin(liftAngle);
            const rotX = x * cos - z * sin;
            const rotZ = x * sin + z * cos;

            const scale = 400 / (450 - rotZ * 40);
            const px = cx + rotX * 60 * scale;
            const py = cy - y * 60 * scale + (rotZ * 20);

            return { x: px, y: py, s: scale, z: rotZ }; // Return Z for sorting
        }

        function drawLift() {
            const w = canvasLift.getBoundingClientRect().width;
            const h = canvasLift.getBoundingClientRect().height;
            const cx = w / 2;
            const cy = h / 2 + 30;

            ctxLift.clearRect(0, 0, w, h);

            // Draw Base Grid
            ctxLift.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            for (let i = -2; i <= 2; i += 0.5) {
                const p1 = project3D(i, 0, -2, cx, cy);
                const p2 = project3D(i, 0, 2, cx, cy);
                ctxLift.beginPath(); ctxLift.moveTo(p1.x, p1.y); ctxLift.lineTo(p2.x, p2.y); ctxLift.stroke();

                const p3 = project3D(-2, 0, i, cx, cy);
                const p4 = project3D(2, 0, i, cx, cy);
                ctxLift.beginPath(); ctxLift.moveTo(p3.x, p3.y); ctxLift.lineTo(p4.x, p4.y); ctxLift.stroke();
            }

            // Prepare render list for Z-sorting
            const renderList = [];

            // 1. Points
            xorpts.forEach(p => {
                const dot = p.x + p.y;
                const distSq = (1 - p.x) ** 2 + (1 - p.y) ** 2;

                let zHeight = 0;
                if (Math.abs(dot) < 0.001) zHeight = 0;
                else if (distSq < 0.1) zHeight = 3;
                else zHeight = (dot * dot) / distSq;

                let visY = zHeight * 1.5;
                if (visY > 3) visY = 3;

                // Project
                const base = project3D(p.x, 0, p.y, cx, cy);
                const top = project3D(p.x, visY, p.y, cx, cy);

                renderList.push({
                    type: 'stick',
                    z: (base.z + top.z) / 2,
                    base: base,
                    top: top,
                    c: p.c,
                    val: p.x + "," + p.y
                });
            });

            // 2. Plane (Center point depth)
            if (showPlane) {
                const pc = project3D(0, 0.2, 0, cx, cy); // center of plane

                const c1 = project3D(-2.5, 0.2, -2.5, cx, cy);
                const c2 = project3D(2.5, 0.2, -2.5, cx, cy);
                const c3 = project3D(2.5, 0.2, 2.5, cx, cy);
                const c4 = project3D(-2.5, 0.2, 2.5, cx, cy);

                renderList.push({
                    type: 'plane',
                    z: pc.z,
                    points: [c1, c2, c3, c4]
                });
            }

            // Sort back-to-front
            renderList.sort((a, b) => b.z - a.z);

            // Render
            renderList.forEach(item => {
                if (item.type === 'stick') {
                    // Draw Stick
                    ctxLift.strokeStyle = COLORS.dim;
                    ctxLift.beginPath();
                    ctxLift.moveTo(item.base.x, item.base.y);
                    ctxLift.lineTo(item.top.x, item.top.y);
                    ctxLift.stroke();

                    // Draw Point
                    ctxLift.fillStyle = item.c === 0 ? COLORS.primary : COLORS.accent;
                    ctxLift.beginPath();
                    ctxLift.arc(item.top.x, item.top.y, 8 * item.top.s, 0, Math.PI * 2);
                    ctxLift.fill();

                    // Glow
                    ctxLift.shadowBlur = 10;
                    ctxLift.shadowColor = item.c === 0 ? COLORS.primary : COLORS.accent;
                    ctxLift.stroke();
                    ctxLift.shadowBlur = 0;

                } else if (item.type === 'plane') {
                    ctxLift.fillStyle = 'rgba(255, 255, 255, 0.15)';
                    ctxLift.beginPath();
                    ctxLift.moveTo(item.points[0].x, item.points[0].y);
                    ctxLift.lineTo(item.points[1].x, item.points[1].y);
                    ctxLift.lineTo(item.points[2].x, item.points[2].y);
                    ctxLift.lineTo(item.points[3].x, item.points[3].y);
                    ctxLift.closePath();
                    ctxLift.fill();

                    ctxLift.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                    ctxLift.lineWidth = 1;
                    ctxLift.stroke();
                }
            });

            // Labels (always on top)
            ctxLift.fillStyle = '#fff';
            ctxLift.font = '10px monospace';
            ctxLift.fillText("Separating Plane", cx - 40, cy + 50);

            // Auto rotate
            liftAngle += 0.005;
            requestAnimationFrame(drawLift);
        }

        // Toggle Plane Interaction
        canvasLift.addEventListener('click', () => {
            showPlane = !showPlane;
        });

        resizeLift();
        drawLift();
        window.addEventListener('resize', () => { resizeLift(); drawLift(); });
    }
}
