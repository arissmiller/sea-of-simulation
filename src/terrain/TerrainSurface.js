import * as THREE from 'three';
import { TerrainContours } from './TerrainContours.js';

export class TerrainSurface {
  constructor(settings, noiseGraph, colorizer) {
    this.settings = settings;
    this.noiseGraph = noiseGraph;
    this.colorizer = colorizer;
    this.mode = settings.mode;

    this.geometry = this.buildGeometry();
    this.material = new THREE.MeshBasicMaterial({
      color: '#ffffff',
      side: THREE.DoubleSide,
      vertexColors: true,
      toneMapped: false
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.y = -1.2;

    this.points = new THREE.Points(
      this.geometry,
      new THREE.PointsMaterial({
        size: 0.16,
        transparent: true,
        opacity: 0.96,
        vertexColors: true,
        sizeAttenuation: true,
        toneMapped: false
      })
    );
    this.points.rotation.copy(this.mesh.rotation);
    this.points.position.copy(this.mesh.position);
    this.points.visible = false;

    this.contours = new TerrainContours(settings);
    this.baseXY = new Float32Array(0);
    this.captureBaseXY();
  }

  buildGeometry() {
    const { size, resolution } = this.settings;
    const geometry = new THREE.PlaneGeometry(size, size, resolution - 1, resolution - 1);
    geometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(new Float32Array(resolution * resolution * 3), 3)
    );
    geometry.attributes.color.setUsage(THREE.DynamicDrawUsage);
    return geometry;
  }

  captureBaseXY() {
    const positions = this.geometry.attributes.position.array;
    this.baseXY = new Float32Array((positions.length / 3) * 2);

    for (let sourceIndex = 0, targetIndex = 0; sourceIndex < positions.length; sourceIndex += 3, targetIndex += 2) {
      this.baseXY[targetIndex] = positions[sourceIndex];
      this.baseXY[targetIndex + 1] = positions[sourceIndex + 1];
    }
  }

  addToScene(scene) {
    scene.add(this.mesh);
    scene.add(this.points);
    this.contours.addToScene(scene);
  }

  removeFromScene(scene) {
    scene.remove(this.mesh);
    scene.remove(this.points);
    this.contours.removeFromScene(scene);
  }

  update(time, options = {}) {
    const { forceContours = false } = options;
    const position = this.geometry.attributes.position;
    const color = this.geometry.attributes.color;
    const positionArray = position.array;
    const colorArray = color.array;

    for (let index = 0, positionIndex = 0, baseIndex = 0; index < position.count; index += 1, positionIndex += 3, baseIndex += 2) {
      const height = this.noiseGraph.sample(this.baseXY[baseIndex], this.baseXY[baseIndex + 1], time);
      positionArray[positionIndex + 2] = height;

      const colorValue = this.colorizer(height, time);
      colorArray[positionIndex] = colorValue.r;
      colorArray[positionIndex + 1] = colorValue.g;
      colorArray[positionIndex + 2] = colorValue.b;
    }

    position.needsUpdate = true;
    color.needsUpdate = true;

    if (this.mode === 'topo' && this.contours.shouldUpdate(time, forceContours)) {
      this.contours.updateFromSurface(this, time, this.colorizer);
    }
  }

  setRenderMode(mode) {
    this.mode = mode;
    this.mesh.visible = mode === 'mesh' || mode === 'lines';
    this.points.visible = mode === 'points';
    this.material.wireframe = mode === 'lines';
    this.contours.setVisible(mode === 'topo');
  }

  updateStyle(settings) {
    this.settings = settings;
    this.points.material.size = settings.pointSize;
    this.points.material.opacity = THREE.MathUtils.clamp(0.4 + settings.glow * 0.22, 0.4, 1);
    this.material.needsUpdate = true;
    this.contours.updateSettings(settings);
  }

  rebuildIfNeeded(nextSettings) {
    if (nextSettings.resolution === this.settings.resolution && nextSettings.size === this.settings.size) {
      this.settings = nextSettings;
      return false;
    }

    this.settings = nextSettings;
    const nextGeometry = this.buildGeometry();
    this.geometry.dispose();
    this.geometry = nextGeometry;
    this.mesh.geometry = nextGeometry;
    this.points.geometry = nextGeometry;
    this.captureBaseXY();
    return true;
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
    this.points.material.dispose();
    this.contours.dispose();
  }
}
