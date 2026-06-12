export class RenderLoop {
  constructor(onFrame) {
    this.onFrame = onFrame;
    this.frameId = 0;
    this.lastTime = 0;
    this.elapsed = 0;
    this.tick = this.tick.bind(this);
  }

  start() {
    if (this.frameId) {
      return;
    }

    this.lastTime = performance.now();
    this.frameId = requestAnimationFrame(this.tick);
  }

  tick(now) {
    const dt = Math.min((now - this.lastTime) / 1000, 1 / 20);
    this.lastTime = now;
    this.elapsed += dt;
    this.onFrame(dt, this.elapsed);
    this.frameId = requestAnimationFrame(this.tick);
  }

  stop() {
    cancelAnimationFrame(this.frameId);
    this.frameId = 0;
  }
}
