import { HeightSampler } from './HeightSampler.js';

export class NoiseGraph {
  constructor(settings) {
    this.settings = settings;
    this.heightSampler = new HeightSampler(settings);
  }

  sample(x, z, time) {
    return this.heightSampler.sample(x, z, time);
  }
}
