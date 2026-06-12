function formatValue(field, value) {
  if (field.type === 'select') {
    const match = field.options?.find((option) => option.value === value);
    return match ? match.label : `${value}`;
  }

  if (field.format) {
    return field.format(value);
  }

  if (Number.isInteger(field.step)) {
    return `${value}`;
  }

  return Number(value).toFixed(2);
}

export class ControlPanel {
  constructor({ target, title, subtitle, schema, state, onChange, onAction }) {
    this.target = target;
    this.schema = schema;
    this.state = state;
    this.onChange = onChange;
    this.onAction = onAction;
    this.inputs = new Map();
    this.valueNodes = new Map();
    this.segmentedButtons = new Map();

    this.root = document.createElement('aside');
    this.root.className = 'hud hud--collapsed';
    this.root.innerHTML = `
      <div class="hud__header">
        <div>
          <p class="hud__eyebrow">Three.js Terrain Engine</p>
          <h1 class="hud__title">${title}</h1>
          <p class="hud__subtitle">${subtitle}</p>
        </div>
        <button class="hud__toggle" type="button">Show</button>
      </div>
      <div class="hud__body"></div>`;

    this.body = this.root.querySelector('.hud__body');
    this.toggle = this.root.querySelector('.hud__toggle');
    this.toggle.addEventListener('click', () => {
      this.root.classList.toggle('hud--collapsed');
      this.toggle.textContent = this.root.classList.contains('hud--collapsed') ? 'Show' : 'Hide';
    });

    this.renderSchema();
    this.target.append(this.root);
    this.sync(this.state);
  }

  renderSchema() {
    this.schema.forEach((entry) => {
      if (entry.type === 'segmented') {
        this.body.append(this.createSegmented(entry));
        return;
      }

      if (entry.type === 'group') {
        this.body.append(this.createGroup(entry));
        return;
      }

      if (entry.type === 'actions') {
        this.body.append(this.createActions(entry));
      }
    });
  }

  createCollapsibleSection(title, initiallyCollapsed = false) {
    const group = document.createElement('section');
    group.className = 'hud__group';
    if (initiallyCollapsed) {
      group.classList.add('hud__group--collapsed');
    }

    const header = document.createElement('button');
    header.type = 'button';
    header.className = 'hud__group-toggle';
    header.setAttribute('aria-expanded', initiallyCollapsed ? 'false' : 'true');
    header.innerHTML = `
      <span class="hud__group-title">${title}</span>
      <span class="hud__group-icon" aria-hidden="true">+</span>
    `;

    const content = document.createElement('div');
    content.className = 'hud__group-content';

    header.addEventListener('click', () => {
      const collapsed = group.classList.toggle('hud__group--collapsed');
      header.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    });

    group.append(header, content);
    return { group, content };
  }

  createSegmented(entry) {
    const { group, content } = this.createCollapsibleSection(entry.label);

    const row = document.createElement('div');
    row.className = 'hud__segmented';

    entry.options.forEach((option) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'hud__button';
      button.textContent = option.label;
      button.addEventListener('click', () => {
        this.state[entry.key] = option.value;
        this.onChange(entry.key, option.value);
        this.sync(this.state);
      });
      row.append(button);
      this.segmentedButtons.set(`${entry.key}:${option.value}`, button);
    });

    content.append(row);
    return group;
  }

  createGroup(entry) {
    const { group, content } = this.createCollapsibleSection(entry.label, true);

    entry.fields.forEach((field) => {
      if (field.type === 'segmented') {
        const wrapper = document.createElement('div');
        wrapper.className = 'hud__field hud__field--stacked';

        const label = document.createElement('label');
        label.textContent = field.label;

        const row = document.createElement('div');
        row.className = 'hud__segmented';

        field.options.forEach((option) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'hud__button';
          button.textContent = option.label;
          button.addEventListener('click', () => {
            this.state[field.key] = option.value;
            this.onChange(field.key, option.value);
            this.sync(this.state);
          });
          row.append(button);
          this.segmentedButtons.set(`${field.key}:${option.value}`, button);
        });

        wrapper.append(label, row);
        content.append(wrapper);
        return;
      }

      const wrapper = document.createElement('div');
      wrapper.className = 'hud__field';

      const label = document.createElement('label');
      label.textContent = field.label;
      label.htmlFor = `field-${field.key}`;

      const valueNode = document.createElement('div');
      valueNode.className = 'hud__value';
      valueNode.textContent = formatValue(field, this.state[field.key]);

      let input;

      if (field.type === 'range') {
        input = document.createElement('input');
        input.type = 'range';
        input.className = 'hud__range';
        input.min = field.min;
        input.max = field.max;
        input.step = field.step;
        input.value = this.state[field.key];
      } else {
        input = document.createElement('select');
        input.className = 'hud__select';
        field.options.forEach((option) => {
          const optionNode = document.createElement('option');
          optionNode.value = option.value;
          optionNode.textContent = option.label;
          input.append(optionNode);
        });
        input.value = this.state[field.key];
      }

      input.id = `field-${field.key}`;
      input.addEventListener('input', () => {
        this.state[field.key] = field.type === 'range' ? Number(input.value) : input.value;
        valueNode.textContent = formatValue(field, this.state[field.key]);
        this.onChange(field.key, this.state[field.key]);
      });

      wrapper.append(label, valueNode, input);
      content.append(wrapper);
      this.inputs.set(field.key, input);
      this.valueNodes.set(field.key, { field, node: valueNode });
    });

    return group;
  }

  createActions(entry) {
    const { group, content } = this.createCollapsibleSection('Actions', true);

    const row = document.createElement('div');
    row.className = 'hud__actions';

    entry.actions.forEach((action) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'hud__button';
      button.textContent = action.label;
      button.addEventListener('click', () => this.onAction(action.action));
      row.append(button);
    });

    content.append(row);
    return group;
  }

  sync(nextState) {
    this.state = { ...nextState };

    this.inputs.forEach((input, key) => {
      input.value = this.state[key];
    });

    this.valueNodes.forEach(({ field, node }, key) => {
      node.textContent = formatValue(field, this.state[key]);
    });

    this.segmentedButtons.forEach((button, compositeKey) => {
      const [key, value] = compositeKey.split(':');
      button.classList.toggle('is-active', this.state[key] === value);
    });
  }

  dispose() {
    this.root.remove();
  }
}
