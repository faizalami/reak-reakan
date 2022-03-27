# Reak-Reakan

> Implementasi dari [Under-the-hood of React Hooks](https://craigtaub.dev/under-the-hood-of-react-hooks), banyak teori2
> yg dibahas disini

Projek ini sekali lagi saya pakai untuk belajar, kali ini belajar **React Hooks** (sekarang masih useState & useEffect).
Untuk itu saya jelaskan tentang apa yg saya buat dan tentang hooks yg sepengetahuan saya, jadi cmiiw.

## Hooks
> Hooks are functions that let you “hook into” React state and lifecycle features from function components.

Begitu katanya [dokumentasi React](https://reactjs.org/docs/hooks-overview.html). Dengan adanya hooks,
functional component yg dulunya sangat bergantung pada props, sekarang bisa melakukan
[side effect](https://en.wikipedia.org/wiki/Side_effect_(computer_science)) sehingga bukan lagi
menjadi [pure function](https://en.wikipedia.org/wiki/Pure_function). Dulunya ketika pakai
funtional component kalau pengen ada interaksi katakan click, paling mudahnya langsung di"forward" ke
props, sekarang bisa langsung di olah di function body.

Lalu sebenarnya bagaimana hooks bekerja? sebelumnya misalkan ada contoh fungsi dalam js biasa,

```js
function DemoKomponen () {
  const [value, setValue] = useState(0);
}

DemoKomponen(); // pemanggilan pertama
DemoKomponen(); // pemanggilan kedua
DemoKomponen(); // pemanggilan ketiga
```
kalau dipikir2, sebenernya kalo pake js biasa, fungsi `useState` yg dipanggil dalam fungsi `DemoKomponen`
sebanyak 3 kali atau dipanggil sebanyak2nya bakal tetap bawa argumennya, yaitu `0`. Tapi kok bisa di React
ketika di tiap render (panggil ulang fungsi `DemoKomponen`) melakukan setValue dengan angka selain `0`
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
karena fungsi `hook useState` akan "nempel" ke `dispatcher`-nya. `Dispatcher` sendiri adalah object "yg mewakili
pemanggil fungsi2 hooks". Kalau lihat ke source nya `React`, deklarasi fungsi `useState` adalah sebagai berikut:
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
bakal cuma punya 1 `dispatcher` walaupun berkali2 dirender. `Dispatcher` akan menjadi "rumah" bagi fungsi2
`hooks` untuk memanajemen data yg diolah oleh `hooks`, contohnya dengan adanya `dispatcher` fungsi `useState`
bisa tau apakah suatu komponen dirender pertama kali atau sudah dirender ulang, jadi ketika memanggil
`const [value, setValue] = useState(0)`, fungsi `useState` akan tau kondisi kapan waktu yg tepat untuk mengisi
nilai dari `value` ke angka `0` atau tidak merubah angka yg sudah diisi dengan `setValue`. Bisa dibilang
`dispatcher` ini adalah "persistent" dari tiap `hooks` di 1 komponen.

### Dispatcher
Pada Reak-Reakan, object `dispatcher` dibentuk dari class `Dispatcher` di file [React.js](./React.js).
Untuk menjaga supaya 1 komponen hanya memiliki 1 dispatcher, tiap instance dispatcher disimpan kedalam
array `dispatchers`. 

Logikanya ketika fungsi `React.render()` dipanggil, akan dibuat 1 instance dari
`dispatcher` dan dimasukkan kedalam array `dispatchers` pada index terbaru (sama dengan length dari array
dispatcher). Index dari `dispatcher` baru tersebut disimpan kedalam property `React.dispatcherIndex`yang nantinya
akan dipakai fungsi2 `React.useState` dan `React.useEffect` untuk mengambil method `dispatcher.useState` dan
`dispatcher.useEffect`, sehingga ketika memanggil semisal `React.useState` pada komponen, akan menghasilkan
mengambil `useState` dari `dispatcher` yg sama ketika dibuat di fungsi `React.render()`. Selanjutnya ketika
ada keadaan untuk harus re-render komponen, bukan lagi memakai fungsi `React.render()`, melainkan menggunakan
method `reRender()` dari object `dispatcher`

Supaya `dispatcher` ini dapat menjadi "persistent" dari tiap `hooks` di 1 komponen, class `Dispatcher` memiliki
properties minimal `index`, `storage`, `Component`, `props`, `instance` dan `callbacks`. `index` dan `storage` adalah
2 properties yg berhubungan, dimana `storage` akan menyimpan data dari `useState` dan `useEffect`, dengan `index`
sebagai "ID" atau "alamat" dari data pada `storage`. Selanjutnya `Component`, `props`, dan `instance` yang memiliki
hubungan, dimana ketiganya akan berperan pada proses re-render. Dan terakhir `callbacks` yg menyimpan fungsi2 yg perlu
dijalankan nanti setelah re-render, dalam hal ini merupakan fungsi2 callback-nya `useEffect`.

## useState
`State` secara sederhana adalah data2 atau object yg mewakili "keadaan" dari komponen, jadi ketika `state` berubah,
maka keadaan komponen juga ikut berubah (misalnya akan terjadi re-render). Pada Reak-Reakan, mungkin paling mudah
untuk menjelaskan dengan contoh langsung. Berikut adalah kode `useState` dan contoh penggunaannya:

```js
const dispatchers = [];

class Dispatcher {
  constructor () {
    this.index = 0;
    this.storage = [];
    // ...
  }
  // ...
  newInstance (Component, props) {
    // ...
    this.index = 0;
    // ...
  }
  // ...
  useState (defaultState) {
    const cachedIndex = this.index;
    if (this.storage[cachedIndex] === undefined) {
      this.storage[cachedIndex] = defaultState;
    }

    const currentState = this.storage[cachedIndex];
    const currentSetter = newValue => {
      if (this.storage[cachedIndex] !== newValue) {
        this.storage[cachedIndex] = newValue

        this.reRender();
      }
    };
    this.index++;
    return [currentState, currentSetter]
  }
  // ...
  reRender () {
    // ...
    this.instance = this.Component(this.props);
    // ...
    this.index = 0;
    // ...
  }
  // ...
}

const React = {
  dispatcherIndex: 0,
  useState: (defaultState) => {
    const dispatcher = dispatchers[React.dispatcherIndex];
    return dispatcher.useState(defaultState)
  },
  // ...
  render: (Component, props) => {
    React.dispatcherIndex = dispatchers.length;

    dispatchers[React.dispatcherIndex] = new Dispatcher();
    dispatchers[React.dispatcherIndex].newInstance(Component, props);

    return dispatchers[React.dispatcherIndex].instance;
  },
  // ...
}

// Contoh
const Component = () => {
  const [count, setCount] = React.useState(0);
  const [name, setName] = React.useState('Steve');

  return {
    type: "div",
    inner: `${count} = ${name}`,
    click: () => setCount(count + 1),
    personArrived: (person) => setName(person),
  }
}

// Running contoh
React.render(Component)
dispatchers[0].instance.click();
dispatchers[0].instance.click();
dispatchers[0].instance.personArrived("Peter");
```
Apabila diperhatikan dari mulai **running contoh**, langkah2 manajemen state akan jadi seperti berikut:

1. `React.render(Component)` render komponen, dan terbentuklah `dispatcher` baru dengan `dispatcherIndex` 0,
jadi nantinya `React.useState` akan memanggil method `dispatchers[0].useState`.
2. Render dimulai dengan memanggil `dispatchers[0].newInstance(Component, props);` pada fungsi `React.render`.
3. Masuk ke komponen dan ada 2 eksekusi `React.useState`, `const [count, setCount] = React.useState(0);` dan
`const [name, setName] = React.useState('Steve');`.
4. Untuk `useState` pertama atau **state count**, memanggil `dispatchers[0].useState(0)`
5. Pada `dispatchers[0].useState(0)`, `this.index` masih berisi angka 0, jadi **state count** punya index 0 di
`dispatchers[0]`.
6. Tentu karena baru dirender, isi dari `this.storage[0]` pun juga masih `undefined`, jadi nilai 0 dimasukkan ke
`this.storage[0]`.
7. Komponen pun akan mendapatkan **state count** dari `this.storage[0]` dan setter (`setCount`) untuk set
nilai baru ke `this.storage[0]`.
8. Lanjut ke **state name**, dengan proses yg sama seperti **langkah 3-6** tapi **state name** akan dapat index
storage 1, karena pada proses **state count**, dipanggil `this.index++`, jadi Komponen akan mendapatkan
**state name** dari `this.storage[1]` beserta setter-nya (`setName`).
9. Proses render selesai dengan diakhiri reset `this.index` kembali ke 0.
10. Kembali ke **running contoh**, disini bisa dilihat ada perintah `dispatchers[0].instance.click()` yang mana
memanggil `() => setCount(count + 1)` atau dalam keadaan ini panggil `setCount(1)` atau melakukan set nilai baru
ke `this.storage[0]`.
11. `setCount(1)` akan masuk ke blok kode `currentSetter` dimana akan membandingkan apakah nilai 
`this.storage[0] !== newValue`, karena `this.storage[0]` saat ini nilainya 0, dan `newValue` nilainya 1,
maka nilai `this.storage[0]` diubah ke 1, dan lalu menjalankan `this.reRender()`.
12. `this.reRender()` akan mengeksekusi ulang komponen sekaligus me-reset `this.index` kembali ke 0,
sehingga "seharusnya" proses akan kembali ke **langkah no.2**.
13. Namun disini, ketika komponen mengeksekusi ulang `const [count, setCount] = React.useState(0);`, nilai `this.storage[0]`
sudah bukan `undefined`, melainkan sudah ada angka 1, jadi argumen `defaultState` akan diabaikan, inilah sebabnya
nilai **state count** tidak akan kembali ke 0 lagi kalau di render ulang.
14. Kembali lagi ke **running contoh**, disini `dispatchers[0].instance.click()` dijalankan kembali, jadi akan
menjalankan lagi proses yg sama dengan **langkah 8-10** tapi pakai `setCount(2)`.
15. Kembali sekali lagi ke **running contoh**, kali ini menjalankan `dispatchers[0].instance.personArrived("Peter")`,
yang artinya menjalankan `setName("Peter")`, nah untuk `setName` ini akan mencoba melakukan set nilai baru ke
`this.storage[1]`, jadi prosesnya nya kembali sama seperti **langkah 8-10** tapi yg diolah `this.storage[1]`.

## useEffect
`useEffect` akan memberikan "side effect" ke komponen, dalam artian melakukan sesuatu ketika state dari komponen
berubah, sama seperti penjelasan `useState`, penjelasan `useEffect` pada Reak-Reakan akan saya jelaskan dengan
contoh berikut:

```js
const dispatchers = [];

class Dispatcher {
  constructor () {
    this.index = 0;
    this.storage = [];
    // ...
    this.callbacks = [];
  }
  
  runCallbacks () {
    this.callbacks.forEach(func => func());
    this.callbacks = [];
  }

  newInstance (Component, props) {
    // ...
    this.index = 0;
    this.runCallbacks();
  }
  // ...
  useEffect (callback, dependencies) {
    const cachedIndex = this.index;
    const hasChanged = dependencies.some((dependency, depIndex) => {
      return this.storage[cachedIndex] === undefined ||
        dependency !== this.storage[cachedIndex][depIndex]
    });

    // ...
    if (hasChanged) {
      this.callbacks.push(() => {
        callback();
      });
      this.storage[cachedIndex] = dependencies;
    }
    this.index++;
    /// ...
  }
  // ...
  reRender () {
    // ...
    this.instance = this.Component(this.props);
    // ...
    this.index = 0;
    this.runCallbacks();
  }
  // ...
}

const React = {
  dispatcherIndex: 0,
  // ...
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
  // ...
}

// Contoh
const Component = () => {
  const [count, setCount] = React.useState(0);
  const [name, setName] = React.useState('Steve');

  React.useEffect(() => {
    console.log('Count or name changed', count, name);
  }, [count, name]);

  React.useEffect(() => {
    console.log('Name changed', name);
  }, [name]);

  return {
    type: 'div',
    inner: `${count} ${props.unit} for ${name}`,
    click: () => setCount(count + 1),
    personArrived: (person) => setName(person),
  }
}

// Running contoh
React.render(Component)
dispatchers[0].instance.click();
dispatchers[0].instance.personArrived('Peter');
dispatchers[0].instance.click();
```
Apabila diperhatikan dari mulai **running contoh**, langkah2 manajemen effect akan jadi seperti berikut:

1. `React.render(Component)` render komponen, dan terbentuklah `dispatcher` baru dengan `dispatcherIndex` 0,
jadi nantinya `React.useState` akan memanggil method `dispatchers[0].useState` dan `React.useEffect` akan 
memanggil method `dispatchers[0].useEffect`.
2. Masuk ke komponen dan ada 2 eksekusi `React.useState`, dan 2 eksekusi `React.useEffect`.
3. Lihat proses untuk `useState` seperti pada penjelasan **useState** yang akan menghasilkan `this.storage[0]`
sebagai **state count** beserta **setCount**-nya dan `this.storage[1]`sebagai **state name** beserta **setName**-nya
4. Selanjutnya baru masuk ke proses eksekusi `React.useEffect`, pertama effect dengan dependencies `[count, name]`.
5. Pada `dispatchers[0].useEffect(....., [count, name])`, `this.index` sudah berisi 2, karena 0 dan 1 sudah dipakai
`useState` **state count dan name**, jadi effect dari `[count, name]` akan memiliki index storage 2.
6. Storage pada `useEffect` digunakan untuk **menyimpan nilai terbaru dari dependencies**.
7. Selanjutnya `useEffect` akan memeriksa apakah ada perubahan dari nilai2 dependencies.
8. Dengan fungsi `Array.some`, dependencies diperiksa dengan kondisi
`this.storage[2] === undefined || dependency !== this.storage[2][depIndex]`, dan karena proses ini belum re-render,
jadi `this.storage[2]` akan bernilai `undefined`, yang artinya `useEffect` untuk `[count, name]` akan mendeteksi
adanya perubahan, sehingga `hasChanged` akan bernilai true.
9. Karena perubahan terdeteksi, `useEffect` akan push sebuah fungsi untuk mengeksekusi `callback` ke array `this.callbacks`
untuk nantinya dijalankan setelah render atau re-render.
10. Lalu nilai dependencies (`[count, name]`) yang bernilai `[0, 'Steve']` disimpan kedalam `this.storage[2]`.
11. Setelah itu, callback dari effect `[count, name]` yaitu `console.log('Count or name changed', count, name)` tidak akan
langsung dijalankan, melainkan proses berlanjut ke `dispatchers[0].useEffect(....., [name])` atau `useEffect` yg kedua.
12. Proses akan sama dengan **langkah 5-8**, hanya saja effect dari `[name]` ini akan mendapatkan index storage 3.
13. Proses render selesai dengan diakhiri reset `this.index` kembali ke 0 dan menjalankan fungsi2 yang telah masuk
pada array `this.callbacks` dengan menjalankan `this.runCallbacks()`.
14. Karena `this.runCallbacks()` dijalankan, maka fungsi2 console log yg ada pada callback kedua `useEffect` tadi ditampilkan
dan menghasilkan `Count or name changed 0 Steve` dan `Name changed Steve`.
15. Selanjutnya kembali ke **running contoh**, disini `dispatchers[0].instance.click()` dijalankan yang memanggil setter
dari state, yaitu `setCount` karena `setCount` memasukkan nilai yang berbeda maka `this.reRender()` akan terpanggil.
16. Karena re-render terjadi, maka seharusnya proses akan kembali seperti mulai **langkah 2**.
17. Tentu perbedaan terjadi pada saat eksekusi `useEffect`
18. Effect `[count, name]` yg disimpan pada `this.storage[2]` sebelumnya bernilai `[0, 'Steve']` sekarang bernilai
`[1, 'Steve']` maka `hasChanged` akan bernilai true dan proses akan sama seperti **langkah 9-11**.
19. Berbeda dengan Effect `[name]`  yg disimpan pada `this.storage[3]` tetap memiliki nilai `['Steve']`, sehingga
`hasChanged` akan bernilai false sehingga tidak melakukan apa-apa.
20. Proses re-render selesai dengan diakhiri reset `this.index` kembali ke 0 dan menjalankan fungsi2 yang telah masuk
pada array `this.callbacks` dengan menjalankan `this.runCallbacks()`.
21. Hasil menjalankan `this.runCallbacks()` sekarang hanya `Count or name changed 1 Steve`.
22. Ketika kembali ke **running contoh**, disini `dispatchers[0].instance.personArrived('Peter')`, dengan proses yang
sama kembali menghasilkan 2 output `Count or name changed 1 Peter` dan `Name changed Peter`, karena nilai
`this.storage[3]` berubah dari `['Steve']` menjadi `['Peter']`.
23. Terakhir ketika kembali  ke **running contoh**, disini `dispatchers[0].instance.click()` kembali hanya menghasilkan
1 output `Count or name changed 2 Peter`.

## Penutup
Maaf penjelasane mbulet.
