import * as THREE from 'three';

export class TerrainContours {
  constructor(settings) {
    this.settings = settings;
    this.geometry = new THREE.BufferGeometry();
    this.material = new THREE.LineBasicMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: 0.9,
      vertexColors: true
    });
    this.lines = new THREE.LineSegments(this.geometry, this.material);
    this.lines.rotation.x = -Math.PI / 2;
    this.lines.position.y = -1.16;
    this.lines.visible = false;
    this.positionArray = new Float32Array(0);
    this.colorArray = new Float32Array(0);
    this.intersections = new Float32Array(8);
    this.lastUpdateTime = -Infinity;
    this.updateInterval = 1 / 12;
  }

  addToScene(scene) {
    scene.add(this.lines);
  }

  removeFromScene(scene) {
    scene.remove(this.lines);
  }

  updateSettings(settings) {
    this.settings = settings;
    this.material.opacity = 0.45 + settings.contourStrength * 0.35;
  }

  shouldUpdate(time, force = false) {
    if (force) {
      this.lastUpdateTime = time;
      return true;
    }

    if (time - this.lastUpdateTime >= this.updateInterval) {
      this.lastUpdateTime = time;
      return true;
    }

    return false;
  }

  updateFromSurface(surface, time, colorizer) {
    const { resolution, contourSpacing, elevation } = this.settings;
    const positions = surface.geometry.attributes.position.array;
    const minLevel = -elevation;
    const maxLevel = elevation;
    const spacing = Math.max(contourSpacing, 0.05);
    const levelCount = Math.floor((maxLevel - minLevel) / spacing) + 1;
    const maxSegments = levelCount * (resolution - 1) * (resolution - 1) * 2;
    const maxVertexCount = maxSegments * 2;

    this.ensureCapacity(maxVertexCount * 3);

    let vertexOffset = 0;
    let colorOffset = 0;
    const segmentColor = new THREE.Color();

    for (let level = minLevel; level <= maxLevel; level += spacing) {
      segmentColor.copy(colorizer(level, time));

      for (let y = 0; y < resolution - 1; y += 1) {
        for (let x = 0; x < resolution - 1; x += 1) {
          const i0 = y * resolution + x;
          const i1 = i0 + 1;
          const i2 = i0 + resolution + 1;
          const i3 = i0 + resolution;
          const ax = positions[i0 * 3];
          const ay = positions[i0 * 3 + 1];
          const ah = positions[i0 * 3 + 2];
          const bx = positions[i1 * 3];
          const by = positions[i1 * 3 + 1];
          const bh = positions[i1 * 3 + 2];
          const cx = positions[i2 * 3];
          const cy = positions[i2 * 3 + 1];
          const ch = positions[i2 * 3 + 2];
          const dx = positions[i3 * 3];
          const dy = positions[i3 * 3 + 1];
          const dh = positions[i3 * 3 + 2];

          let intersectionCount = 0;
          intersectionCount = this.collectIntersection(this.intersections, intersectionCount, ax, ay, ah, bx, by, bh, level);
          intersectionCount = this.collectIntersection(this.intersections, intersectionCount, bx, by, bh, cx, cy, ch, level);
          intersectionCount = this.collectIntersection(this.intersections, intersectionCount, cx, cy, ch, dx, dy, dh, level);
          intersectionCount = this.collectIntersection(this.intersections, intersectionCount, dx, dy, dh, ax, ay, ah, level);

          if (intersectionCount === 2) {
            vertexOffset = this.writeSegment(this.intersections, 0, 2, level, vertexOffset);
            colorOffset = this.writeColor(segmentColor, colorOffset, 2);
          } else if (intersectionCount === 4) {
            vertexOffset = this.writeSegment(this.intersections, 0, 2, level, vertexOffset);
            colorOffset = this.writeColor(segmentColor, colorOffset, 2);
            vertexOffset = this.writeSegment(this.intersections, 4, 6, level, vertexOffset);
            colorOffset = this.writeColor(segmentColor, colorOffset, 2);
          }
        }
      }
    }

    const positionAttribute = this.geometry.getAttribute('position');
    const colorAttribute = this.geometry.getAttribute('color');
    positionAttribute.needsUpdate = true;
    colorAttribute.needsUpdate = true;
    this.geometry.setDrawRange(0, vertexOffset / 3);
    this.geometry.computeBoundingSphere();
  }

  ensureCapacity(requiredLength) {
    if (this.positionArray.length >= requiredLength) {
      return;
    }

    this.positionArray = new Float32Array(requiredLength);
    this.colorArray = new Float32Array(requiredLength);
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positionArray, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colorArray, 3));
  }

  collectIntersection(target, intersectionCount, ax, ay, ah, bx, by, bh, level) {
    const range = bh - ah;

    if (Math.abs(range) < 0.00001) {
      return intersectionCount;
    }

    const t = (level - ah) / range;

    if (t < 0 || t > 1) {
      return intersectionCount;
    }

    const offset = intersectionCount * 2;
    target[offset] = THREE.MathUtils.lerp(ax, bx, t);
    target[offset + 1] = THREE.MathUtils.lerp(ay, by, t);
    return intersectionCount + 1;
  }

  writeSegment(intersections, fromOffset, toOffset, level, vertexOffset) {
    this.positionArray[vertexOffset] = intersections[fromOffset];
    this.positionArray[vertexOffset + 1] = intersections[fromOffset + 1];
    this.positionArray[vertexOffset + 2] = level + 0.015;
    this.positionArray[vertexOffset + 3] = intersections[toOffset];
    this.positionArray[vertexOffset + 4] = intersections[toOffset + 1];
    this.positionArray[vertexOffset + 5] = level + 0.015;
    return vertexOffset + 6;
  }

  writeColor(color, colorOffset, vertexCount) {
    for (let index = 0; index < vertexCount; index += 1) {
      this.colorArray[colorOffset] = color.r;
      this.colorArray[colorOffset + 1] = color.g;
      this.colorArray[colorOffset + 2] = color.b;
      colorOffset += 3;
    }

    return colorOffset;
  }

  setVisible(visible) {
    this.lines.visible = visible;
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }
}
