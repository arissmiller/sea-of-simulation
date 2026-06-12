import * as THREE from 'three';
import { NoiseGraph } from '../../terrain/NoiseGraph.js';
import { TerrainSurface } from '../../terrain/TerrainSurface.js';
import { MeshStyleRenderer } from '../../styles/MeshStyleRenderer.js';
import { WireStyleRenderer } from '../../styles/WireStyleRenderer.js';
import { PointStyleRenderer } from '../../styles/PointStyleRenderer.js';
import {
  createSeaOfSimulationSchema,
  defaultSeaOfSimulationState
} from './seaOfSimulationControls.js';
import { createSeaOfSimulationColorizer } from './seaOfSimulationPalette.js';
import { TopographicStyleRenderer } from '../../styles/TopographicStyleRenderer.js';

const styleRenderers = {
  mesh: new MeshStyleRenderer(),
  lines: new WireStyleRenderer(),
  points: new PointStyleRenderer(),
  topo: new TopographicStyleRenderer()
};

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randomRange(min, max, step = 0.01) {
  const units = Math.round((max - min) / step);
  const offset = Math.floor(Math.random() * (units + 1));
  return Number((min + offset * step).toFixed(4));
}

function createRandomPreset(baseState) {
  const mode = randomFrom(['mesh', 'lines', 'points', 'topo']);

  return {
    ...baseState,
    mode,
    noiseStyle: randomFrom(['hybrid', 'rolling', 'ridged', 'billow', 'dunes', 'terraced']),
    resolution: randomFrom([72, 96, 120, 144, 168, 192]),
    noiseScale: randomRange(0.08, 0.58, 0.01),
    elevation: randomRange(1, 6.4, 0.1),
    speed: randomRange(0.15, 1.8, 0.01),
    octaves: randomFrom([2, 3, 4, 5, 6]),
    persistence: randomRange(0.28, 0.78, 0.01),
    lacunarity: randomRange(1.35, 2.7, 0.01),
    warp: randomRange(0, 3.6, 0.05),
    ridgeMix: randomRange(0, 1, 0.01),
    stretchX: randomRange(0.55, 2.8, 0.01),
    stretchZ: randomRange(0.55, 2.8, 0.01),
    flowAngle: randomRange(-180, 180, 1),
    detailMix: randomRange(0, 1, 0.01),
    terraceSteps: randomFrom([0, 0, 0, 4, 6, 8, 10, 12]),
    contourSpacing: randomRange(0.18, 0.95, 0.01),
    contourStrength: randomRange(0.35, 1.45, 0.01),
    colorStyle: randomFrom(['neon-cyan', 'sunset-grid', 'aurora', 'glacier', 'biohazard', 'infrared', 'magma', 'monochrome']),
    colorFunction: randomFrom(['pulse', 'bands', 'interference', 'swirl', 'drift', 'strobe', 'prism']),
    colorFrequency: randomRange(0.35, 3.4, 0.01),
    hueDrift: randomRange(0, 1.4, 0.01),
    glow: randomRange(0.3, 2.1, 0.01),
    contrast: randomRange(0.8, 1.55, 0.01),
    colorShift: randomRange(0.15, 1.9, 0.01),
    pointSize: randomRange(0.06, 0.24, 0.01),
    seed: Math.floor(Math.random() * 10000)
  };
}

export class SeaOfSimulationProgram {
  constructor() {
    this.scene = null;
    this.state = createRandomPreset(defaultSeaOfSimulationState);
    this.schema = createSeaOfSimulationSchema();
    this.surface = null;
    this.noiseGraph = null;
    this.colorizer = null;
    this.grid = null;
    this.time = 0;
  }

  init({ scene }) {
    this.scene = scene;

    this.grid = new THREE.GridHelper(42, 24, '#0d5e7b', '#06283a');
    this.grid.position.y = -1.24;
    this.grid.material.opacity = 0.14;
    this.grid.material.transparent = true;
    this.scene.add(this.grid);

    this.rebuildSurface();
  }

  rebuildSurface() {
    if (this.surface && this.scene) {
      this.surface.removeFromScene(this.scene);
      this.surface.dispose();
    }

    this.noiseGraph = new NoiseGraph(this.state);
    this.colorizer = createSeaOfSimulationColorizer(this.state);
    this.surface = new TerrainSurface(this.state, this.noiseGraph, this.colorizer);
    this.surface.addToScene(this.scene);
    this.applyRenderMode();
    this.surface.updateStyle(this.state);
    this.surface.update(this.time, { forceContours: true });
  }

  update(dt, elapsed) {
    this.time = elapsed;
    this.surface.update(elapsed);
  }

  resize() {}

  updateControl(key, value) {
    const numericKeys = new Set([
      'resolution',
      'size',
      'flowAngle',
      'stretchX',
      'stretchZ',
      'noiseScale',
      'elevation',
      'speed',
      'octaves',
      'persistence',
      'lacunarity',
      'warp',
      'ridgeMix',
      'detailMix',
      'terraceSteps',
      'contourSpacing',
      'contourStrength',
      'colorFrequency',
      'hueDrift',
      'glow',
      'contrast',
      'colorShift',
      'pointSize',
      'seed'
    ]);

    this.state[key] = numericKeys.has(key) ? Number(value) : value;

    if (key === 'mode') {
      this.colorizer = createSeaOfSimulationColorizer(this.state);
      this.surface.colorizer = this.colorizer;
      this.applyRenderMode();
      this.surface.updateStyle(this.state);
      this.surface.update(this.time, { forceContours: true });
      return;
    }

    if (key === 'resolution' || key === 'size') {
      this.rebuildSurface();
      return;
    }

    if (
      key === 'glow' ||
      key === 'pointSize' ||
      key === 'contourStrength' ||
      key === 'contrast' ||
      key === 'colorShift' ||
      key === 'colorStyle' ||
      key === 'colorFunction' ||
      key === 'colorFrequency' ||
      key === 'hueDrift'
    ) {
      this.colorizer = createSeaOfSimulationColorizer(this.state);
      this.surface.colorizer = this.colorizer;
      this.surface.updateStyle(this.state);
      this.surface.update(this.time, { forceContours: this.state.mode === 'topo' });
      return;
    }

    this.noiseGraph = new NoiseGraph(this.state);
    this.colorizer = createSeaOfSimulationColorizer(this.state);
    this.surface.noiseGraph = this.noiseGraph;
    this.surface.colorizer = this.colorizer;
    this.surface.updateStyle(this.state);
    this.surface.update(this.time, { forceContours: key === 'contourSpacing' });
  }

  applyRenderMode() {
    styleRenderers[this.state.mode].apply(this.surface);
  }

  getControlSchema() {
    return this.schema;
  }

  getSerializableState() {
    return { ...this.state };
  }

  resetControls() {
    this.state = { ...defaultSeaOfSimulationState };
    this.rebuildSurface();
    return this.getSerializableState();
  }

  randomizeSeed() {
    this.state.seed = Math.floor(Math.random() * 10000);
    this.updateControl('seed', this.state.seed);
    return this.getSerializableState();
  }

  randomizePreset() {
    this.state = createRandomPreset(defaultSeaOfSimulationState);
    this.rebuildSurface();
    return this.getSerializableState();
  }

  dispose(scene) {
    if (this.surface) {
      this.surface.removeFromScene(scene);
      this.surface.dispose();
    }

    if (this.grid) {
      scene.remove(this.grid);
      this.grid.geometry.dispose();
      if (Array.isArray(this.grid.material)) {
        this.grid.material.forEach((material) => material.dispose());
      } else {
        this.grid.material.dispose();
      }
    }
  }
}
