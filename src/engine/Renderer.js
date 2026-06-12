import * as THREE from 'three';

export class Renderer {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setClearColor('#02030a', 1);
  }

  resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  render(scene, camera) {
    this.renderer.render(scene, camera);
  }

  getViewport() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      aspect: window.innerWidth / Math.max(window.innerHeight, 1)
    };
  }

  dispose() {
    this.renderer.dispose();
  }
}
