class Provider {
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
  providers: {},
  activeProvider: null,
  useState: (defaultState) => {
    // Ambil index storage
    const cachedIndex = React.activeProvider.index;
    // kalau store pada index yg didapat adalah undefined (belum ada apa2)
    // maka akan diset nilai baru dari defaultState
    if (React.activeProvider.storage[cachedIndex] === undefined) {
      React.activeProvider.storage[cachedIndex] = defaultState;
    }

    // Siapkan currentState untuk di-return ke komponen
    const currentState = React.activeProvider.storage[cachedIndex];
    // Siapkan currentSetter untuk di-return ke komponen
    const currentSetter = (newValue) => {
      // jika setter (setNamaState) dipanggil, maka dilakukan pengecekan
      // jika newValue tidak sama dengan nilai yg ada di storage, maka
      // akan diset nilai baru dan melakukan re-render
      if (React.activeProvider.storage[cachedIndex] !== newValue) {
        React.activeProvider.storage[cachedIndex] = newValue;

        React.activeProvider.reRender();
      }
    };
    // index ditambah, jadi jika useState / useEffect dipanggil lagi, maka akan
    // state yg baru akan memakai index baru juga
    React.activeProvider.index++;
    return [currentState, currentSetter];
  },
  useEffect: (callback, dependencies) => {
    // Ambil index storage
    const cachedIndex = React.activeProvider.index;
    // Deteksi adanya perubahan, karena dependencies adalah array, maka paling tepat
    // membandingkan dengan Array.some()
    const hasChanged = dependencies.some((dependency, depIndex) => {
      // kondisinya hanya dengan mengecek apakah storage store pada index yg
      // didapat adalah undefined atau item dari dependency apakah beda dari
      // item dependency yg sudah disimpan di storage
      return (
        React.activeProvider.storage[cachedIndex] === undefined ||
        dependency !== React.activeProvider.storage[cachedIndex][depIndex]
      );
    });

    // siapkan variable untuk menyimpan fungsi clean-up
    // https://reactjs.org/docs/hooks-effect.html#example-using-hooks-1
    let cleanUp = null;

    // jika pengecekan diatas dideteksi ada perubahan, maka akan push
    // fungsi untuk menjalankan callback dari effect pada saat setelah render atau re-render
    if (hasChanged) {
      React.activeProvider.callbacks.push(() => {
        cleanUp = callback();
      });
      // setelah itu dependencies disimpan ke storage
      React.activeProvider.storage[cachedIndex] = dependencies;
    }
    // index ditambah, jadi jika useState / useEffect dipanggil lagi, maka akan
    // state yg baru akan memakai index baru juga
    React.activeProvider.index++;
    return typeof cleanUp === "function"
      ? cleanUp
      : () => console.log("unsubscribed effect");
  },
  render(Component, props) {
    // Buat instance dari provider dan simpan ke daftar provider
    if (React.providers[Component]?.length) {
      React.providers[Component].push(new Provider());
    } else {
      React.providers[Component] = [new Provider()];
    }
    const currentIndex = React.providers[Component].length - 1;
    React.activeProvider = React.providers[Component][currentIndex];
    // Buat instance dari komponen pada provider yang berjalan
    React.activeProvider.newInstance(Component, props);

    return React.activeProvider.instance;
  },
  component(Component, props) {
    if (!React.activeProvider) {
      console.error("don't have parent");
      return;
    }

    // Simpan provider parent yang sedang berjalan ke variable temporary
    const parentProvider = React.activeProvider;
    let childProvider;
    if (React.activeProvider.children[Component]?.instances?.length) {
      // Index digunakan untuk mensupport 2 atau lebih komponen child
      // dari komponen yang sama
      const childIndex = React.activeProvider.children[Component].nextIndex;
      childProvider =
        React.activeProvider.children[Component].instances[childIndex];
      // Jika tidak ada instance di index yang dituju berarti ada child
      // baru dari komponen yang sama
      if (!childProvider) {
        React.activeProvider.children[Component].instances[childIndex] =
          new Provider();
        childProvider =
          React.activeProvider.children[Component].instances[childIndex];
      }
      React.activeProvider.children[Component].nextIndex += 1;
    } else {
      React.activeProvider.children[Component] = {
        instances: [new Provider()],
        nextIndex: 1,
      };
      childProvider = React.activeProvider.children[Component].instances[0];
    }

    // Buat active provider menyimpan child provider, agar hooks dari
    // komponen child mengakses storage dari provider child
    React.activeProvider = childProvider;
    // Buat instance dari komponen child pada provider yang berjalan
    childProvider.newInstance(Component, props);
    // Kembalikan active provider menjadi parent provider
    React.activeProvider = parentProvider;

    return childProvider.instance;
  },
};

module.exports = {
  React,
};
