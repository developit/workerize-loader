<p align="center">
  <img src="https://i.imgur.com/qZpzUBh.png" width="256" height="256" alt="workerize-loader">
  <h1 align="center">workerize-loader</h1>
  <br>
  <a href="https://www.npmjs.org/package/workerize-loader"><img src="https://img.shields.io/npm/v/workerize-loader.svg?style=flat" alt="npm"></a> <a href="https://travis-ci.org/developit/workerize-loader"><img src="https://travis-ci.org/developit/workerize-loader.svg?branch=master" alt="travis"></a>
</p>


> A webpack loader that moves a module and its dependencies into a Web Worker, automatically reflecting exported functions as asynchronous proxies.

- Bundles a tiny, purpose-built RPC implementation into your app
- If exported module methods are already async, signature is unchanged
- Supports synchronous and asynchronous worker functions
- Works beautifully with async/await
- Imported value is instantiable, just a decorated `Worker`


## Install

```sh
npm install --save-dev workerize-loader
```


### Usage

**worker.js**:

```js
// block for `time` ms, then return the number of loops we could run in that time:
export function expensive(time) {
	let start = Date.now(),
		count = 0
	while (Date.now() - start < time) count++
	return count
}
```

**index.js**: _(our demo)_

```js
import worker from 'workerize-loader!./worker'

let instance = worker()  // `new` is optional

instance.expensive(1000).then( count => {
	console.log(`Ran ${count} loops`)
})
```

### License

[MIT License](LICENSE.md) © [Jason Miller](https://jasonformat.com)
