class Dispatcher {
  constructor() {
    this.index = 0;
    this.storage = [];
    this.Component = null;
    this.props = null;
    this.instance = null;
    this.children = {};
    this.callbacks = [];
  }

  runCallbacks() {
    this.callbacks.forEach((func) => func());
    this.callbacks = [];
  }

  newInstance(Component, props) {
    this.Component = Component;
    this.props = props;
    this.instance = Component(props);
    console.log("Regular Render: ", this.instance.inner, "\n");
    this.renderChildren();
    this.index = 0;
    this.runCallbacks();
  }

  reRender() {
    if (this.Component) {
      this.instance = this.Component(this.props);
      console.log("Re Render To: ", this.instance.inner, "\n");
      this.renderChildren();
    }
    this.index = 0;
    this.runCallbacks();
  }

  renderChildren() {
    if (this.instance?.children?.length) {
      // Reset semua child.nextIndex ke 0 tiap re-render
      Object.values(this.children).forEach((child) => (child.nextIndex = 0));
      this.instance.children.forEach((child) => child());
    }
  }
}

const React = {
  dispatchers: {},
  activeDispatcher: null,
  useState(defaultState) {
    // Ambil index storage
    const cachedIndex = React.activeDispatcher.index;
    // kalau store pada index yg didapat adalah undefined (belum ada apa2)
    // maka akan diset nilai baru dari defaultState
    if (React.activeDispatcher.storage[cachedIndex] === undefined) {
      React.activeDispatcher.storage[cachedIndex] = defaultState;
    }

    // Siapkan currentState untuk di-return ke komponen
    const currentState = React.activeDispatcher.storage[cachedIndex];
    // Siapkan currentSetter untuk di-return ke komponen
    const currentSetter = (newValue) => {
      // jika setter (setNamaState) dipanggil, maka dilakukan pengecekan
      // jika newValue tidak sama dengan nilai yg ada di storage, maka
      // akan diset nilai baru dan melakukan re-render
      if (React.activeDispatcher.storage[cachedIndex] !== newValue) {
        React.activeDispatcher.storage[cachedIndex] = newValue;

        React.activeDispatcher.reRender();
      }
    };
    // index ditambah, jadi jika useState / useEffect dipanggil lagi, maka akan
    // state yg baru akan memakai index baru juga
    React.activeDispatcher.index++;
    return [currentState, currentSetter];
  },
  useEffect(callback, dependencies) {
    // Ambil index storage
    const cachedIndex = React.activeDispatcher.index;
    // Deteksi adanya perubahan, karena dependencies adalah array, maka paling tepat
    // membandingkan dengan Array.some()
    const hasChanged = dependencies.some((dependency, depIndex) => {
      // kondisinya hanya dengan mengecek apakah storage store pada index yg
      // didapat adalah undefined atau item dari dependency apakah beda dari
      // item dependency yg sudah disimpan di storage
      return (
        React.activeDispatcher.storage[cachedIndex] === undefined ||
        dependency !== React.activeDispatcher.storage[cachedIndex][depIndex]
      );
    });

    // siapkan variable untuk menyimpan fungsi clean-up
    // https://reactjs.org/docs/hooks-effect.html#example-using-hooks-1
    let cleanUp = null;

    // jika pengecekan diatas dideteksi ada perubahan, maka akan push
    // fungsi untuk menjalankan callback dari effect pada saat setelah render atau re-render
    if (hasChanged) {
      React.activeDispatcher.callbacks.push(() => {
        cleanUp = callback();
      });
      // setelah itu dependencies disimpan ke storage
      React.activeDispatcher.storage[cachedIndex] = dependencies;
    }
    // index ditambah, jadi jika useState / useEffect dipanggil lagi, maka akan
    // state yg baru akan memakai index baru juga
    React.activeDispatcher.index++;
    return typeof cleanUp === "function"
      ? cleanUp
      : () => console.log("unsubscribed effect");
  },
  render(Component, props) {
    // Buat instance dari dispatcher dan simpan ke daftar dispatcher
    if (React.dispatchers[Component]?.length) {
      React.dispatchers[Component].push(new Dispatcher());
    } else {
      React.dispatchers[Component] = [new Dispatcher()];
    }
    const currentIndex = React.dispatchers[Component].length - 1;
    React.activeDispatcher = React.dispatchers[Component][currentIndex];
    // Buat instance dari komponen pada dispatcher yang berjalan
    React.activeDispatcher.newInstance(Component, props);

    return React.activeDispatcher.instance;
  },
  component(Component, props) {
    if (!React.activeDispatcher) {
      console.error("don't have parent");
      return;
    }

    // Simpan dispatcher parent yang sedang berjalan ke variable temporary
    const parentDispatcher = React.activeDispatcher;
    let childDispatcher;
    if (React.activeDispatcher.children[Component]?.instances?.length) {
      // Index digunakan untuk mensupport 2 atau lebih komponen child
      // dari komponen yang sama
      const childIndex = React.activeDispatcher.children[Component].nextIndex;
      childDispatcher =
        React.activeDispatcher.children[Component].instances[childIndex];
      // Jika tidak ada instance di index yang dituju berarti ada child
      // baru dari komponen yang sama
      if (!childDispatcher) {
        React.activeDispatcher.children[Component].instances[childIndex] =
          new Dispatcher();
        childDispatcher =
          React.activeDispatcher.children[Component].instances[childIndex];
      }
      React.activeDispatcher.children[Component].nextIndex += 1;
    } else {
      React.activeDispatcher.children[Component] = {
        instances: [new Dispatcher()],
        nextIndex: 1,
      };
      childDispatcher = React.activeDispatcher.children[Component].instances[0];
    }

    // Buat active dispatcher menyimpan child dispatcher, agar hooks dari
    // komponen child mengakses storage dari dispatcher child
    React.activeDispatcher = childDispatcher;
    // Buat instance dari komponen child pada dispatcher yang berjalan
    childDispatcher.newInstance(Component, props);
    // Kembalikan active dispatcher menjadi parent dispatcher
    React.activeDispatcher = parentDispatcher;

    return childDispatcher.instance;
  },
};

module.exports = {
  React,
};
