const dispatchers = [];

class Dispatcher {
  constructor () {
    this.index = 0;
    this.state = [];
    this.Component = null;
    this.props = null;
    this.instance = null;
    this.children = [];
    this.queue = [];
  }

  runJobQueue () {
    this.queue.forEach(func => func());
    this.queue = [];
  }

  newInstance (Component, props) {
    this.Component = Component;
    this.props = props;
    this.instance = Component(props);
    console.log("Regular Render: ", this.instance.inner, '\n');
    this.renderChildren();
    this.index = 0;
    this.runJobQueue();
  }

  useState (defaultProp) {
    const cachedIndex = this.index;
    if (this.state[cachedIndex] === undefined) {
      this.state[cachedIndex] = defaultProp;
    }

    const currentState = this.state[cachedIndex];
    const currentSetter = newValue => {
      if (this.state[cachedIndex] !== newValue) {
        this.state[cachedIndex] = newValue

        this.reRender();
      }
    };
    this.index++;
    return [currentState, currentSetter]
  }

  useEffect (callback, dependencies) {
    const cachedIndex = this.index;
    const hasChanged = dependencies.some((dependency, depIndex) => {
      return this.state[cachedIndex] === undefined ||
        dependency !== this.state[cachedIndex][depIndex]
    });

    if (this.state[cachedIndex] === undefined) {
      this.state[cachedIndex] = dependencies;
    }

    let cleanUp = null;
    if (hasChanged) {
      this.queue.push(() => {
        cleanUp = callback();
      });
      this.state[cachedIndex] = dependencies;
    }
    this.index++;
    return typeof cleanUp === 'function' ? cleanUp : () => console.log('unsubscribed effect')
  }

  reRender () {
    if (this.Component) {
      this.instance = this.Component(this.props);
      console.log("Re Render To: ", this.instance.inner, '\n');
      this.renderChildren();
    }
    this.index = 0;
    this.runJobQueue();
  }

  renderChildren () {
    if (this.instance?.children?.length) {
      this.instance.children.forEach(child => child());
    }
  }
}

const React = {
  dispatcherIndex: 0,
  useState: (defaultProp) => {
    const dispatcher = dispatchers[React.dispatcherIndex];
    return dispatcher.useState(defaultProp)
  },
  useEffect: (callback, dependencies) => {
    const dispatcher = dispatchers[React.dispatcherIndex];
    return dispatcher.useEffect(callback, dependencies)
  },
  render: (Component, props) => {
    React.dispatcherIndex = dispatchers.length;

    dispatchers[React.dispatcherIndex] = new Dispatcher();
    dispatchers[React.dispatcherIndex].newInstance(Component, props);

    return dispatchers[React.dispatcherIndex].instance;
  },
  component: (Component, props) => {
    const cachedIndex = React.dispatcherIndex;
    const dispatcher = dispatchers[React.dispatcherIndex];
    let childIndex = null;

    const childComponent = dispatcher.children.find(child => child.component === Component);
    if (!childComponent) {
      childIndex = dispatchers.length;
      dispatcher.children.push({
        component: Component,
        dispatcherIndex: childIndex,
      });
    } else {
      childIndex = childComponent.dispatcherIndex;
    }

    React.dispatcherIndex = childIndex;
    if (!dispatchers[childIndex]) {
      dispatchers[childIndex] = new Dispatcher();
    }
    dispatchers[childIndex].newInstance(Component, props);
    React.dispatcherIndex = cachedIndex;

    return dispatchers[childIndex].instance;
  },
}

const Component = props => {
  const [count, setCount] = React.useState(0);
  const [name, setName] = React.useState('Steve');

  const exitThis = React.useEffect(() => {
    if (name) {
      console.log('Name changed', name);
    }
  }, [name])

  return {
    type: "div",
    inner: `${count} ${props.unit} for ${name}`,
    click: () => setCount(count + 1),
    personArrived: (person) => setName(person),
    unsubscribe: () => exitThis()
  }
}

module.exports = {
  React,
  dispatchers,
}
