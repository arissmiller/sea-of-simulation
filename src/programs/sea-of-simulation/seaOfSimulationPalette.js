import * as THREE from 'three';

const palettes = {
  'neon-cyan': {
    low: new THREE.Color('#03111e'),
    mid: new THREE.Color('#0ea5c6'),
    high: new THREE.Color('#a6faff'),
    accent: new THREE.Color('#5ef2ff')
  },
  'sunset-grid': {
    low: new THREE.Color('#14081e'),
    mid: new THREE.Color('#ff5d73'),
    high: new THREE.Color('#ffd166'),
    accent: new THREE.Color('#ff8bd1')
  },
  aurora: {
    low: new THREE.Color('#04161a'),
    mid: new THREE.Color('#1fcb8f'),
    high: new THREE.Color('#9af7ff'),
    accent: new THREE.Color('#7b7dff')
  },
  magma: {
    low: new THREE.Color('#120607'),
    mid: new THREE.Color('#d9481e'),
    high: new THREE.Color('#ffd166'),
    accent: new THREE.Color('#ff7b39')
  },
  monochrome: {
    low: new THREE.Color('#06090d'),
    mid: new THREE.Color('#7a93a8'),
    high: new THREE.Color('#f4fbff'),
    accent: new THREE.Color('#d0ecff')
  }
};

function clamp01(value) {
  return THREE.MathUtils.clamp(value, 0, 1);
}

function sampleShiftFunction(settings, normalized, time, height) {
  const speed = settings.speed;
  const frequency = settings.colorFrequency;

  switch (settings.colorFunction) {
    case 'bands':
      return Math.floor(normalized * (6 + frequency * 8)) / Math.max(6 + frequency * 8, 1);
    case 'interference':
      return clamp01(
        0.5 +
          Math.sin(normalized * 11 * frequency + time * speed * 1.3) * 0.28 +
          Math.cos(height * 1.8 + time * speed * 0.6) * 0.22
      );
    case 'swirl':
      return clamp01(0.5 + Math.sin(normalized * 16 * frequency + height * 0.9 + time * speed) * 0.5);
    case 'drift':
      return clamp01(0.5 + Math.sin(normalized * 5 * frequency - time * speed * 0.9) * 0.5);
    case 'pulse':
    default:
      return clamp01(0.5 + Math.sin(time * speed * 0.8 + normalized * 7.5 * frequency) * 0.5);
  }
}

function applyHueDrift(target, settings, shiftSample) {
  if (settings.hueDrift <= 0) {
    return target;
  }

  const hsl = {};
  target.getHSL(hsl);
  const nextHue = (hsl.h + (shiftSample - 0.5) * settings.hueDrift * 0.22 + 1) % 1;
  target.setHSL(nextHue, clamp01(hsl.s + settings.hueDrift * 0.08), hsl.l);
  return target;
}

export function createSeaOfSimulationColorizer(settings) {
  const mixed = new THREE.Color();
  const selectedPalette = palettes[settings.colorStyle] ?? palettes['neon-cyan'];
  const contourDark = new THREE.Color('#081b24');
  const contourMid = new THREE.Color('#135f73');
  const contourHigh = new THREE.Color('#b4fbff');

  return (height, time) => {
    const normalized = clamp01((height / Math.max(settings.elevation, 0.001) + 1) * 0.5);
    const shiftSample = sampleShiftFunction(settings, normalized, time, height);
    const pulseMix = shiftSample * 0.16 * settings.colorShift;

    if (settings.mode === 'topo') {
      const bandCount = Math.max(4, Math.round(settings.elevation / Math.max(settings.contourSpacing, 0.05)) * 2);
      const stepped = Math.floor(normalized * bandCount) / bandCount;

      if (stepped < 0.45) {
        mixed.copy(contourDark).lerp(contourMid, stepped / 0.45);
      } else {
        mixed.copy(contourMid).lerp(contourHigh, (stepped - 0.45) / 0.55);
      }

      mixed.lerp(selectedPalette.accent, pulseMix * 0.55);
      applyHueDrift(mixed, settings, shiftSample);
      mixed.multiplyScalar(0.88 + settings.contrast * 0.22);
      return mixed;
    }

    if (normalized < 0.52) {
      mixed.copy(selectedPalette.low).lerp(selectedPalette.mid, normalized / 0.52);
    } else {
      mixed.copy(selectedPalette.mid).lerp(selectedPalette.high, (normalized - 0.52) / 0.48);
    }

    mixed.lerp(selectedPalette.accent, pulseMix);
    applyHueDrift(mixed, settings, shiftSample);
    mixed.multiplyScalar(settings.contrast);
    return mixed;
  };
}
