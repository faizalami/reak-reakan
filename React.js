const dispatchers = [];

class Dispatcher {
  constructor () {
    this.index = 0;
    this.storage = [];
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

  useState (defaultState) {
    // Ambil index storage
    const cachedIndex = this.index;
    // kalau store pada index yg didapat adalah undefined (belum ada apa2)
    // maka akan diset nilai baru dari defaultState
    if (this.storage[cachedIndex] === undefined) {
      this.storage[cachedIndex] = defaultState;
    }

    // Siapkan currentState untuk di-return ke komponen
    const currentState = this.storage[cachedIndex];
    // Siapkan currentSetter untuk di-return ke komponen
    const currentSetter = newValue => {
      // jika setter (setNamaState) dipanggil, maka dilakukan pengecekan
      // jika newValue tidak sama dengan nilai yg ada di storage, maka
      // akan diset nilai baru dan melakukan re-render
      if (this.storage[cachedIndex] !== newValue) {
        this.storage[cachedIndex] = newValue

        this.reRender();
      }
    };
    // index ditambah, jadi jika useState dipanggil lagi, maka akan
    // state yg baru akan memakai index baru juga
    this.index++;
    return [currentState, currentSetter]
  }

  useEffect (callback, dependencies) {
    const cachedIndex = this.index;
    const hasChanged = dependencies.some((dependency, depIndex) => {
      return this.storage[cachedIndex] === undefined ||
        dependency !== this.storage[cachedIndex][depIndex]
    });

    if (this.storage[cachedIndex] === undefined) {
      this.storage[cachedIndex] = dependencies;
    }

    let cleanUp = null;
    if (hasChanged) {
      this.queue.push(() => {
        cleanUp = callback();
      });
      this.storage[cachedIndex] = dependencies;
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
  useState: (defaultState) => {
    // ambil latest dispatcher (indexnya sama seperti yg dipanggil di fungsi render)
    const dispatcher = dispatchers[React.dispatcherIndex];
    return dispatcher.useState(defaultState)
  },
  useEffect: (callback, dependencies) => {
    // ambil latest dispatcher (indexnya sama seperti yg dipanggil di fungsi render)
    const dispatcher = dispatchers[React.dispatcherIndex];
    return dispatcher.useEffect(callback, dependencies)
  },
  render: (Component, props) => {
    // simpan index dari instance baru dispatcher
    React.dispatcherIndex = dispatchers.length;

    dispatchers[React.dispatcherIndex] = new Dispatcher();
    dispatchers[React.dispatcherIndex].newInstance(Component, props);

    return dispatchers[React.dispatcherIndex].instance;
  },
  component: (Component, props) => {
    const cachedIndex = React.dispatcherIndex;
    const dispatcher = dispatchers[React.dispatcherIndex];
    let childIndex;

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

module.exports = {
  React,
  dispatchers,
}
