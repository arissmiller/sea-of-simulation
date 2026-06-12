import * as THREE from 'three';

export class CameraRig {
  constructor() {
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 400);
    this.camera.position.set(0, 16, 24);
    this.camera.lookAt(0, 0, 0);
  }

  resize({ aspect }) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }
}
