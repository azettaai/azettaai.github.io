// Shared color palette for visualizations
export const COLORS = {
    primary: '#1b998b',
    accent: '#ed217c',
    light: '#e8e8e8',
    dim: '#555555',
    grid: 'rgba(27, 153, 139, 0.15)',
    proton: '#ed217c',    // positive values
    electron: '#4ea8de',  // negative values
    neutral: '#666666',   // near-zero values
    wave: '#9b5de5',      // wave view
    signal: '#f4a261'     // signal coherence
};

// Utility functions
export function lerp(a, b, t) {
    return a + (b - a) * t;
}

export function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

export function dot(a, b) {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        sum += a[i] * b[i];
    }
    return sum;
}

export function magnitude(v) {
    return Math.sqrt(dot(v, v));
}

export function normalize(v) {
    const mag = magnitude(v);
    if (mag === 0) return v.map(() => 0);
    return v.map(x => x / mag);
}

export function euclideanDist(a, b) {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        sum += (a[i] - b[i]) ** 2;
    }
    return Math.sqrt(sum);
}

export function yat(a, b) {
    const d = dot(a, b);
    const dist = euclideanDist(a, b);
    if (dist < 0.001) return Infinity;
    return (d * d) / (dist * dist);
}

// Generate random vector with given dimension
export function randomVector(dim, scale = 1) {
    const v = [];
    for (let i = 0; i < dim; i++) {
        v.push((Math.random() * 2 - 1) * scale);
    }
    return v;
}
