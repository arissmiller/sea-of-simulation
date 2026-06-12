import * as THREE from 'three';

function fract(value) {
  return value - Math.floor(value);
}

function hash2d(x, y, seed) {
  return fract(Math.sin(x * 127.1 + y * 311.7 + seed * 91.7) * 43758.5453123);
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

function valueNoise2d(x, y, seed) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = x0 + 1;
  const y1 = y0 + 1;

  const tx = smoothstep(x - x0);
  const ty = smoothstep(y - y0);

  const a = hash2d(x0, y0, seed);
  const b = hash2d(x1, y0, seed);
  const c = hash2d(x0, y1, seed);
  const d = hash2d(x1, y1, seed);

  const ab = THREE.MathUtils.lerp(a, b, tx);
  const cd = THREE.MathUtils.lerp(c, d, tx);

  return THREE.MathUtils.lerp(ab, cd, ty) * 2 - 1;
}

export class HeightSampler {
  constructor(settings) {
    this.settings = settings;
    this.noiseStyle = settings.noiseStyle;
    this.noiseScale = settings.noiseScale;
    this.speed = settings.speed;
    this.octaves = settings.octaves;
    this.persistence = settings.persistence;
    this.lacunarity = settings.lacunarity;
    this.warp = settings.warp;
    this.seed = settings.seed;
    this.elevation = settings.elevation;
    this.ridgeMix = settings.ridgeMix;
    this.detailMix = settings.detailMix;
    this.terraceSteps = settings.terraceSteps;

    const theta = THREE.MathUtils.degToRad(settings.flowAngle);
    this.cosTheta = Math.cos(theta);
    this.sinTheta = Math.sin(theta);
    this.invStretchX = 1 / Math.max(settings.stretchX, 0.001);
    this.invStretchZ = 1 / Math.max(settings.stretchZ, 0.001);
  }

  shapeNoise(noise, style) {
    const ridge = 1 - Math.abs(noise);
    const billow = Math.abs(noise) * 2 - 1;

    switch (style) {
      case 'rolling':
        return noise;
      case 'ridged':
        return ridge * 2 - 1;
      case 'billow':
        return billow;
      case 'dunes':
        return THREE.MathUtils.clamp(noise * 0.35 + Math.sin((noise + 1) * Math.PI * 1.5) * 0.65, -1, 1);
      case 'terraced':
        return THREE.MathUtils.lerp(noise, ridge * 2 - 1, 0.15);
      case 'hybrid':
      default:
        return THREE.MathUtils.lerp(noise, ridge * 2 - 1, this.ridgeMix);
    }
  }

  sample(x, z, time) {
    const rotatedX = x * this.cosTheta - z * this.sinTheta;
    const rotatedZ = x * this.sinTheta + z * this.cosTheta;
    const shapedX = rotatedX * this.invStretchX;
    const shapedZ = rotatedZ * this.invStretchZ;

    const driftX = time * this.speed * 0.18;
    const driftZ = time * this.speed * 0.11;
    const warpA = valueNoise2d(shapedX * this.noiseScale * 0.6 + driftX, shapedZ * this.noiseScale * 0.6 - driftZ, this.seed + 7);
    const warpB = valueNoise2d(shapedX * this.noiseScale * 0.6 - driftZ, shapedZ * this.noiseScale * 0.6 + driftX, this.seed + 19);
    const warpedX = shapedX + warpA * this.warp;
    const warpedZ = shapedZ + warpB * this.warp;

    let amplitude = 1;
    let frequency = 1;
    let sum = 0;
    let totalAmplitude = 0;

    for (let octave = 0; octave < this.octaves; octave += 1) {
      const noise = valueNoise2d(
        warpedX * this.noiseScale * frequency + driftX * frequency,
        warpedZ * this.noiseScale * frequency + driftZ * frequency,
        this.seed + octave * 13.37
      );
      const shapedNoise = this.shapeNoise(noise, this.noiseStyle);
      const detailNoise = valueNoise2d(
        warpedX * this.noiseScale * frequency * 2.4 - driftZ * 0.7,
        warpedZ * this.noiseScale * frequency * 2.4 + driftX * 0.7,
        this.seed + 101 + octave * 5.17
      );
      const layered = THREE.MathUtils.lerp(shapedNoise, shapedNoise + detailNoise * 0.5, this.detailMix);

      sum += layered * amplitude;
      totalAmplitude += amplitude;
      amplitude *= this.persistence;
      frequency *= this.lacunarity;
    }

    let output = sum / Math.max(totalAmplitude, 0.0001);

    if (this.noiseStyle === 'terraced' || this.terraceSteps > 0) {
      const steps = Math.max(this.terraceSteps || 6, 1);
      const normalized = (output + 1) * 0.5;
      const stepped = Math.floor(normalized * steps) / steps;
      output = THREE.MathUtils.lerp(output, stepped * 2 - 1, this.noiseStyle === 'terraced' ? 0.75 : 0.55);
    }

    return output * this.elevation;
  }
}
