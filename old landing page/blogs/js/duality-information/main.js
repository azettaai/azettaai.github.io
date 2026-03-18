/**
 * Duality of Information Blog Visualizations
 * Interactive canvas visualizations for the article
 */

import { initVizGeometricTrap } from './viz-geometric-trap.js';
import { initVizParticleAtom } from './viz-particle-atom.js';
import { initVizYatForce } from './viz-yat-force.js';
import { initVizNetwork } from './viz-network.js';
import { initVizMatrix } from './viz-matrix.js';
import { initVizWave } from './viz-wave.js';
import { initVizSignalNoise } from './viz-signal-noise.js';
import { initVizDuality } from './viz-duality.js';

document.addEventListener('DOMContentLoaded', () => {
    initVizGeometricTrap();
    initVizParticleAtom();
    initVizYatForce();
    initVizNetwork();
    initVizMatrix();
    initVizWave();
    initVizSignalNoise();
    initVizDuality();
});
