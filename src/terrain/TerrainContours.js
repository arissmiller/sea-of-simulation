import * as THREE from 'three';

function interpolateEdge(a, b, level) {
  const range = b.height - a.height;

  if (Math.abs(range) < 0.00001) {
    return null;
  }

  const t = (level - a.height) / range;

  if (t < 0 || t > 1) {
    return null;
  }

  return new THREE.Vector3(
    THREE.MathUtils.lerp(a.x, b.x, t),
    THREE.MathUtils.lerp(a.y, b.y, t),
    level
  );
}

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
    const vertices = [];
    const colors = [];
    const minLevel = -elevation;
    const maxLevel = elevation;
    const spacing = Math.max(contourSpacing, 0.05);

    for (let level = minLevel; level <= maxLevel; level += spacing) {
      for (let y = 0; y < resolution - 1; y += 1) {
        for (let x = 0; x < resolution - 1; x += 1) {
          const i0 = y * resolution + x;
          const i1 = i0 + 1;
          const i2 = i0 + resolution + 1;
          const i3 = i0 + resolution;

          const p0 = {
            x: positions[i0 * 3],
            y: positions[i0 * 3 + 1],
            height: positions[i0 * 3 + 2]
          };
          const p1 = {
            x: positions[i1 * 3],
            y: positions[i1 * 3 + 1],
            height: positions[i1 * 3 + 2]
          };
          const p2 = {
            x: positions[i2 * 3],
            y: positions[i2 * 3 + 1],
            height: positions[i2 * 3 + 2]
          };
          const p3 = {
            x: positions[i3 * 3],
            y: positions[i3 * 3 + 1],
            height: positions[i3 * 3 + 2]
          };

          const intersections = [
            interpolateEdge(p0, p1, level),
            interpolateEdge(p1, p2, level),
            interpolateEdge(p2, p3, level),
            interpolateEdge(p3, p0, level)
          ].filter(Boolean);

          if (intersections.length > 0) {
            const contourColor = colorizer(level, time);

            if (intersections.length === 2) {
              vertices.push(
                intersections[0].x,
                intersections[0].y,
                intersections[0].z + 0.015,
                intersections[1].x,
                intersections[1].y,
                intersections[1].z + 0.015
              );
              colors.push(
                contourColor.r,
                contourColor.g,
                contourColor.b,
                contourColor.r,
                contourColor.g,
                contourColor.b
              );
            } else if (intersections.length === 4) {
              vertices.push(
                intersections[0].x,
                intersections[0].y,
                intersections[0].z + 0.015,
                intersections[1].x,
                intersections[1].y,
                intersections[1].z + 0.015,
                intersections[2].x,
                intersections[2].y,
                intersections[2].z + 0.015,
                intersections[3].x,
                intersections[3].y,
                intersections[3].z + 0.015
              );
              colors.push(
                contourColor.r,
                contourColor.g,
                contourColor.b,
                contourColor.r,
                contourColor.g,
                contourColor.b,
                contourColor.r,
                contourColor.g,
                contourColor.b,
                contourColor.r,
                contourColor.g,
                contourColor.b
              );
            }
          }
        }
      }
    }

    if (this.positionArray.length < vertices.length) {
      this.positionArray = new Float32Array(vertices.length);
      this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positionArray, 3));
    }

    const colorAttribute = this.geometry.getAttribute('color');
    if (!colorAttribute || colorAttribute.array.length < colors.length) {
      this.geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors.length), 3));
    }

    this.positionArray.set(vertices);
    const positionAttribute = this.geometry.getAttribute('position');
    const nextColorArray = this.geometry.getAttribute('color').array;
    nextColorArray.set(colors);
    positionAttribute.needsUpdate = true;
    this.geometry.getAttribute('color').needsUpdate = true;
    this.geometry.setDrawRange(0, vertices.length / 3);
    this.geometry.computeBoundingSphere();
  }

  setVisible(visible) {
    this.lines.visible = visible;
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }
}
