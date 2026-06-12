import './styles.css';
import { App } from './engine/App.js';
import { SeaOfSimulationProgram } from './programs/sea-of-simulation/SeaOfSimulationProgram.js';
import { ControlPanel } from './ui/ControlPanel.js';

const root = document.querySelector('#app');

const app = new App({ root });
const program = new SeaOfSimulationProgram();

app.mount(program);

const panel = new ControlPanel({
  target: root,
  title: 'Sea of Simulation',
  subtitle: 'Procedural terrain study',
  schema: program.getControlSchema(),
  state: program.getSerializableState(),
  onChange: (key, value) => {
    program.updateControl(key, value);
  },
  onAction: (action) => {
    if (action === 'randomize') {
      panel.sync(program.randomizeSeed());
      return;
    }

    if (action === 'reset') {
      panel.sync(program.resetControls());
    }
  }
});

panel.sync(program.getSerializableState());

window.addEventListener('beforeunload', () => {
  panel.dispose();
  app.dispose();
});
