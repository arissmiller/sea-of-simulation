import * as THREE from 'three';
import { CameraRig } from './CameraRig.js';

export class SceneController {
  constructor(renderer) {
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#02030a');
    this.scene.fog = new THREE.Fog('#02030a', 18, 56);

    this.cameraRig = new CameraRig();
    this.program = null;
  }

  setProgram(program) {
    if (this.program) {
      this.program.dispose(this.scene);
    }

    this.program = program;
    this.program.init({
      scene: this.scene,
      camera: this.cameraRig.camera,
      renderer: this.renderer.renderer
    });
  }

  update(dt, elapsed) {
    if (this.program) {
      this.program.update(dt, elapsed);
    }
  }

  render() {
    this.renderer.render(this.scene, this.cameraRig.camera);
  }

  resize(viewport) {
    this.cameraRig.resize(viewport);

    if (this.program?.resize) {
      this.program.resize(viewport);
    }
  }

  dispose() {
    if (this.program) {
      this.program.dispose(this.scene);
    }
  }
}
