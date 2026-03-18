import { initVizEntropy } from './viz-entropy.js';
import { initVizGrounding } from './viz-grounding.js';
import { initVizOmnilingual } from './viz-omnilingual.js';

document.addEventListener('DOMContentLoaded', () => {
    initVizEntropy();
    initVizGrounding();
    initVizOmnilingual();
});
