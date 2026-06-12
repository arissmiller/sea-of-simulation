import { SceneController } from './SceneController.js';
import { Renderer } from './Renderer.js';
import { RenderLoop } from './RenderLoop.js';

export class App {
  constructor({ root }) {
    this.root = root;
    this.renderer = new Renderer();
    this.sceneController = new SceneController(this.renderer);
    this.loop = new RenderLoop((dt, elapsed) => {
      this.sceneController.update(dt, elapsed);
      this.sceneController.render();
    });

    this.root.append(this.renderer.canvas);
    this.handleResize = () => {
      this.renderer.resize();
      this.sceneController.resize(this.renderer.getViewport());
    };

    window.addEventListener('resize', this.handleResize);
    this.handleResize();
  }

  mount(program) {
    this.sceneController.setProgram(program);
    this.loop.start();
  }

  dispose() {
    this.loop.stop();
    this.sceneController.dispose();
    window.removeEventListener('resize', this.handleResize);
    this.renderer.dispose();
  }
}
