<img src="https://i.imgur.com/HZZG8wr.jpg" width="1358" alt="workerize-loader">

# workerize-loader [![npm](https://img.shields.io/npm/v/workerize-loader.svg?style=flat)](https://www.npmjs.org/package/workerize-loader) [![travis](https://travis-ci.org/developit/workerize-loader.svg?branch=master)](https://travis-ci.org/developit/workerize-loader)

> A webpack loader that moves a module and its dependencies into a Web Worker, automatically reflecting exported functions as asynchronous proxies.

- Bundles a tiny, purpose-built RPC implementation into your app
- If exported module methods are already async, signature is unchanged
- Supports synchronous and asynchronous worker functions
- Works beautifully with async/await
- Imported value is instantiable, just a decorated `Worker`


## Install

```sh
npm install -D workerize-loader
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

### Options

#### `inline`

Type: `Boolean`
Default: `false`

You can also inline the worker as a BLOB with the `inline` parameter

```js
// webpack.config.js
{
  loader: 'workerize-loader',
  options: { inline: true }
}
```
or 
```js
import worker from 'workerize-loader?inline!./worker'
```

### About [Babel](https://babeljs.io/)

If you're using [Babel](https://babeljs.io/) in your build, make sure you disabled commonJS transform. Otherwize, workerize-loader won't be able to retrieve the list of exported function from your worker script :
```js
{
    test: /\.js$/,
    loader: "babel-loader",
    options: {
        presets: [
            [
                "env",
                {
                    modules: false,
                },
            ],
        ]
    }
}
```

### Polyfill Required for IE11

Workerize-loader supports browsers that support Web Workers - that's IE10+.
However, these browsers require a polyfill in order to use Promises, which Workerize-loader relies on.
It is recommended that the polyfill be installed globally, since Webpack itself also needs Promises to load bundles.

The smallest implementation is the one we recommend installing:

`npm i promise-polyfill`

Then, in the module you are "workerizing", just add it as your first import:

```js
import 'promise-polyfill/src/polyfill';
```

All worker code can now use Promises. 

### Testing

## Without Webpack
To test a module that is normally imported via `workerize-loader` when not using Webpack, import the module directly in your test:

```diff
-const worker = require('workerize-loader!./worker.js');
+const worker = () => require('./worker.js');

const instance = worker();
```
## With Webpack and Jest
In Jest, it's possible to define a custom `transform` that emulates workerize-loader on the main thread.

Steps to follow:
1. Install dev dependencies `npm i babel-jest identity-object-proxy -D`
2. Add this entry to `moduleNameMapper` section in jest config located in `package.json`:
```ts
"workerize-loader(\\?.*)?!(.*)": "identity-obj-proxy"
```
3. Add this entry to jest config located in `package.json`:
```ts
	"transform": {
	      "workerize-loader(\\?.*)?!(.*)": "<rootDir>/workerize-jest.js",
	      "^.+\\.[jt]sx?$": "babel-jest",
	      "^.+\\.[jt]s?$": "babel-jest"
	    }
```
4. Add jest custom transformer file `workerize-jest.js` in root dir:
```ts
module.exports = {
  process(src, filename, config, options) {
    return 'module.exports = () => require(' + JSON.stringify(filename.replace(/.+!/, '')) + ')';
  },
};
```

Now your tests and any modules they import can use `workerize-loader!` prefixes.

### Credit

The inner workings here are heavily inspired by [worker-loader](https://github.com/webpack-contrib/worker-loader). It's worth a read!


### License

[MIT License](https://oss.ninja/mit/developit) © [Jason Miller](https://jasonformat.com)
