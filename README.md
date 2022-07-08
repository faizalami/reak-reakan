# Reak-Reakan

> Implementasi dari [Under-the-hood of React Hooks](https://craigtaub.dev/under-the-hood-of-react-hooks), 
> banyak teori2 yg dibahas disini

Projek ini saya pakai untuk belajar, kali ini belajar **React Hooks** (sekarang masih useState & useEffect).

## Hooks
> Hooks are functions that let you “hook into” React state and lifecycle features from function components.

Begitu katanya [dokumentasi React](https://reactjs.org/docs/hooks-overview.html). Dengan adanya hooks,
functional component yg dulunya sangat bergantung pada props, sekarang bisa melakukan
[side effect](https://en.wikipedia.org/wiki/Side_effect_(computer_science)). Sehingga functional component
bisa bukan lagi menjadi [pure function](https://en.wikipedia.org/wiki/Pure_function). Dulunya ketika pakai
funtional component kalau pengen ada interaksi seperti click, paling mudahnya langsung di"forward" ke
props, sekarang bisa langsung di olah di function body.

Lalu sebenarnya bagaimana hooks bekerja? Misalkan ada contoh fungsi dalam js biasa,

```js
function DemoKomponen () {
  const [value, setValue] = useState(0);
}

DemoKomponen(); // pemanggilan pertama
DemoKomponen(); // pemanggilan kedua
DemoKomponen(); // pemanggilan ketiga
```
kalau dipikir2, sebenernya dengan vanilla js, fungsi `useState` yg dipanggil dalam fungsi `DemoKomponen`
sebanyak 3 kali atau dipanggil sebanyak2nya akan tetap bawa argumennya, yaitu `0`. Tapi kok bisa di React
ketika di tiap re-render (memanggil ulang fungsi `DemoKomponen`) melakukan `setValue` dengan angka selain `0`
hasilnya gak balik lagi ke `0`? lebih jelasnya ilustrasinya begini:

```js
function DemoKomponen () {
  const [value, setValue] = useState(0);
  
  return (<button onClick={() => setValue(5)}>jadi 5</button>);
}

DemoKomponen(); // render pertama
// klik button 'jadi 5'
DemoKomponen(); // render kedua
```
dari contoh diatas, kenapa kok ketika render kedua isi dari `value` akan tetap `5` nggak balik ke `0` lagi?
padahal di render kedua tetap saja memanggil `useState(0)` bukan tiba2 jadi `useState(5)`. Jawabannya adalah
karena fungsi `hook useState` akan menyimpan data ke `dispatcher`-nya. `Dispatcher` sendiri sederhananya adalah
object "yg menyimpan data fungsi2 hooks". Kalau lihat ke source nya `React`, deklarasi fungsi `useState` adalah
sebagai berikut:
```js
function useState(initialState) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useState(initialState);
}
///
function resolveDispatcher() {
  var dispatcher = ReactCurrentDispatcher.current;

  if (!(dispatcher !== null)) {
    {
      throw Error( "Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n1. You might have mismatching versions of React and the renderer (such as React DOM)\n2. You might be breaking the Rules of Hooks\n3. You might have more than one copy of React in the same app\nSee https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem." );
    }
  }

  return dispatcher;
}
```
`Dispatcher` ini nantinya akan mewakili tiap komponen yg memanggil fungsi2 `hooks`, dengan 1 komponen
akan cuma punya 1 `dispatcher` walaupun berkali2 dirender. `Dispatcher` akan menjadi "penyimpanan" bagi fungsi2
`hooks` untuk memanajemen data yg diolah oleh `hooks`, contohnya dengan adanya `dispatcher` fungsi `useState`
bisa tau apakah suatu komponen dirender pertama kali atau sudah dirender ulang, jadi ketika memanggil
`const [value, setValue] = useState(0)`, fungsi `useState` akan tau kondisi kapan waktu yg tepat untuk mengisi
nilai dari `value` ke angka `0` atau tidak merubah angka yg sudah diisi dengan `setValue`. Bisa dibilang
`dispatcher` ini adalah "persistent" dari tiap `hooks` di 1 komponen.

## Konsep Reak-Reakan
Konsep dari Reak-Reakan mengadaptasi dari artikel [Under-the-hood of React Hooks](https://craigtaub.dev/under-the-hood-of-react-hooks)
dan konsep Hooks yang dapat saya ambil dari dokumentasi dan source code dari React.

Sederhananya dapat diilustrasikan seperti ini:
```js
class Dispatcher {
  constructor() {
    // Storage dari hooks.
    this.storage = [];
  }
}

const React = {
  dispatchers: {},
  activeDispatcher: null,
  useStorage: () => {
    return React.activeDispatcher.storage;
  },
  render: (Component, props) => {
    // Mencari / buat instance baru Dispatcher.
    React.dispatchers[Component] = React.dispatchers[Component] || new Dispatcher();
    React.activeDispatcher = React.dispatchers[Component];
    Component(props);
  }
}

function ReactComponent (props) {
  const storage = React.useStorage();
  storage.push(props.number);
  console.log(storage);
}

function OtherComponent (props) {
  const storage = React.useStorage();
  storage.push(props.letter);
  console.log(storage);
}

React.render(ReactComponent, { number: 1});
React.render(ReactComponent, { number: 2});
React.render(ReactComponent, { number: 3});

React.render(OtherComponent, { letter: 'a'});
React.render(OtherComponent, { letter: 'b'});
React.render(OtherComponent, { letter: 'c'});


React.render(ReactComponent, { number: 4});
React.render(OtherComponent, { letter: 'd'});
```

`Dispatcher` punya storage untuk menyimpan data dari pemanggilan hooks. Tiap 1 komponen pertama kali render,
akan membuat masing2 1 instance dari `Dispatcher`. Terus kalau komponen di-render ulang, akan panggil instance
`Dispatcher` yang udah ada. Tiap render/re-render, instance `Dispatcher` yang dibuat/dipanggil, akan disimpan
di `React.activeDispatcher`, jadi saat di dalam komponen memanggil hooks (`useStorage`), hooks itu akan dapat
`storage` dari instance `Dispatcher` yang benar sesuai komponennya.

## Running kodenya

```bash
$ node multiple-instances.js
$ node have-children.js
$ node compare-by-reference.js
```