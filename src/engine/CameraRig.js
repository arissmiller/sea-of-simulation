import * as THREE from 'three';

export class CameraRig {
  constructor() {
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 400);
    this.target = new THREE.Vector3(14, -14, 0);
    this.camera.position.set(-14, 14, 36);
    this.camera.lookAt(this.target);
  }

  resize({ aspect }) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(this.target);
  }
}
