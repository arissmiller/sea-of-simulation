export const defaultSeaOfSimulationState = {
  mode: 'mesh',
  noiseStyle: 'hybrid',
  resolution: 144,
  size: 28,
  noiseScale: 0.24,
  elevation: 3.2,
  speed: 0.9,
  octaves: 4,
  persistence: 0.52,
  lacunarity: 1.92,
  warp: 1.6,
  ridgeMix: 0.3,
  stretchX: 1,
  stretchZ: 1.8,
  flowAngle: 35,
  detailMix: 0.24,
  terraceSteps: 0,
  contourSpacing: 0.4,
  contourStrength: 0.85,
  colorStyle: 'neon-cyan',
  colorFunction: 'pulse',
  colorFrequency: 1,
  hueDrift: 0.28,
  paletteBias: 0.5,
  saturation: 1,
  brightness: 1,
  accentMix: 1,
  glow: 1.1,
  contrast: 1,
  colorShift: 0.8,
  pointSize: 0.14,
  seed: 11
};

export function createSeaOfSimulationSchema() {
  return [
    {
      type: 'group',
      label: 'Rendering',
      fields: [
        {
          type: 'segmented',
          key: 'mode',
          label: 'Draw Style',
          options: [
            { label: 'Mesh', value: 'mesh' },
            { label: 'Lines', value: 'lines' },
            { label: 'Points', value: 'points' },
            { label: 'Topo', value: 'topo' }
          ]
        },
        {
          type: 'select',
          key: 'colorStyle',
          label: 'Palette',
          options: [
            { label: 'Neon Cyan', value: 'neon-cyan' },
            { label: 'Sunset Grid', value: 'sunset-grid' },
            { label: 'Aurora', value: 'aurora' },
            { label: 'Magma', value: 'magma' },
            { label: 'Glacier', value: 'glacier' },
            { label: 'Biohazard', value: 'biohazard' },
            { label: 'Infrared', value: 'infrared' },
            { label: 'Monochrome', value: 'monochrome' }
          ]
        },
        {
          type: 'select',
          key: 'colorFunction',
          label: 'Color Motion',
          options: [
            { label: 'Pulse', value: 'pulse' },
            { label: 'Contour Bands', value: 'bands' },
            { label: 'Interference', value: 'interference' },
            { label: 'Swirl', value: 'swirl' },
            { label: 'Drift', value: 'drift' },
            { label: 'Strobe', value: 'strobe' },
            { label: 'Prism', value: 'prism' }
          ]
        },
        { type: 'range', key: 'colorShift', label: 'Motion Amount', min: 0, max: 2.5, step: 0.01 },
        { type: 'range', key: 'colorFrequency', label: 'Motion Frequency', min: 0.2, max: 4, step: 0.01 },
        { type: 'range', key: 'hueDrift', label: 'Hue Drift', min: 0, max: 1.8, step: 0.01 },
        { type: 'range', key: 'paletteBias', label: 'Palette Bias', min: 0, max: 1, step: 0.01 },
        { type: 'range', key: 'saturation', label: 'Saturation', min: 0.15, max: 1.8, step: 0.01 },
        { type: 'range', key: 'brightness', label: 'Brightness', min: 0.45, max: 1.8, step: 0.01 },
        { type: 'range', key: 'accentMix', label: 'Accent Mix', min: 0, max: 2, step: 0.01 },
        { type: 'range', key: 'glow', label: 'Glow', min: 0, max: 2.5, step: 0.01 },
        { type: 'range', key: 'contrast', label: 'Contrast', min: 0.6, max: 1.8, step: 0.01 },
        { type: 'range', key: 'pointSize', label: 'Point Size', min: 0.04, max: 0.35, step: 0.01 },
        { type: 'range', key: 'contourSpacing', label: 'Contour Gap', min: 0.15, max: 1.5, step: 0.01 },
        { type: 'range', key: 'contourStrength', label: 'Contour Glow', min: 0, max: 1.6, step: 0.01 }
      ]
    },
    {
      type: 'group',
      label: 'Noise Style',
      fields: [
        {
          type: 'select',
          key: 'noiseStyle',
          label: 'Profile',
          options: [
            { label: 'Hybrid', value: 'hybrid' },
            { label: 'Rolling', value: 'rolling' },
            { label: 'Ridged', value: 'ridged' },
            { label: 'Billow', value: 'billow' },
            { label: 'Dunes', value: 'dunes' },
            { label: 'Terraced', value: 'terraced' }
          ]
        },
        { type: 'range', key: 'flowAngle', label: 'Flow Angle', min: -180, max: 180, step: 1, format: (v) => `${v}°` },
        { type: 'range', key: 'stretchX', label: 'Stretch X', min: 0.4, max: 3.2, step: 0.01 },
        { type: 'range', key: 'stretchZ', label: 'Stretch Z', min: 0.4, max: 3.2, step: 0.01 },
        { type: 'range', key: 'detailMix', label: 'Detail Mix', min: 0, max: 1, step: 0.01 },
        { type: 'range', key: 'terraceSteps', label: 'Terraces', min: 0, max: 16, step: 1, format: (v) => `${v}` }
      ]
    },
    {
      type: 'group',
      label: 'Topology',
      fields: [
        { type: 'range', key: 'resolution', label: 'Density', min: 48, max: 220, step: 4, format: (v) => `${v}` },
        { type: 'range', key: 'noiseScale', label: 'Noise Scale', min: 0.06, max: 0.65, step: 0.01 },
        { type: 'range', key: 'elevation', label: 'Elevation', min: 0.4, max: 7, step: 0.1 },
        { type: 'range', key: 'warp', label: 'Warp', min: 0, max: 4, step: 0.05 },
        { type: 'range', key: 'ridgeMix', label: 'Ridge', min: 0, max: 1, step: 0.01 }
      ]
    },
    {
      type: 'group',
      label: 'Animation',
      fields: [
        { type: 'range', key: 'speed', label: 'Speed', min: 0, max: 2.5, step: 0.01 },
        { type: 'range', key: 'octaves', label: 'Octaves', min: 1, max: 6, step: 1, format: (v) => `${v}` },
        { type: 'range', key: 'persistence', label: 'Persistence', min: 0.2, max: 0.9, step: 0.01 },
        { type: 'range', key: 'lacunarity', label: 'Lacunarity', min: 1.2, max: 3, step: 0.01 }
      ]
    },
    {
      type: 'actions',
      actions: [
        { label: 'Randomize Seed', action: 'randomize' },
        { label: 'Reset Defaults', action: 'reset' }
      ]
    }
  ];
}
