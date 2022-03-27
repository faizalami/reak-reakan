const dispatchers = [];

class Dispatcher {
  constructor () {
    this.index = 0;
    this.storage = [];
    this.Component = null;
    this.props = null;
    this.instance = null;
    this.children = [];
    this.callbacks = [];
  }

  runCallbacks () {
    this.callbacks.forEach(func => func());
    this.callbacks = [];
  }

  newInstance (Component, props) {
    this.Component = Component;
    this.props = props;
    this.instance = Component(props);
    console.log("Regular Render: ", this.instance.inner, '\n');
    this.renderChildren();
    this.index = 0;
    this.runCallbacks();
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
    // index ditambah, jadi jika useState / useEffect dipanggil lagi, maka akan
    // state yg baru akan memakai index baru juga
    this.index++;
    return [currentState, currentSetter]
  }

  useEffect (callback, dependencies) {
    // Ambil index storage
    const cachedIndex = this.index;
    // Deteksi adanya perubahan, karena dependencies adalah array, maka paling tepat
    // membandingkan dengan Array.some()
    const hasChanged = dependencies.some((dependency, depIndex) => {
      // kondisinya hanya dengan mengecek apakah storage store pada index yg
      // didapat adalah undefined atau item dari dependency apakah beda dari
      // item dependency yg sudah disimpan di storage
      return this.storage[cachedIndex] === undefined ||
        dependency !== this.storage[cachedIndex][depIndex]
    });

    // siapkan variable untuk menyimpan fungsi clean-up
    // https://reactjs.org/docs/hooks-effect.html#example-using-hooks-1
    let cleanUp = null;

    // jika pengecekan diatas dideteksi ada perubahan, maka akan push
    // fungsi untuk menjalankan callback dari effect pada saat setelah render atau re-render
    if (hasChanged) {
      this.callbacks.push(() => {
        cleanUp = callback();
      });
      // setelah itu dependencies disimpan ke storage
      this.storage[cachedIndex] = dependencies;
    }
    // index ditambah, jadi jika useState / useEffect dipanggil lagi, maka akan
    // state yg baru akan memakai index baru juga
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
    this.runCallbacks();
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
