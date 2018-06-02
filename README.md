<img src="https://i.imgur.com/HZZG8wr.jpg" width="1358" alt="workerize-loader">

# workerize-loader [![npm](https://img.shields.io/npm/v/workerize-loader.svg?style=flat)](https://www.npmjs.org/package/workerize-loader) [![travis](https://travis-ci.org/developit/workerize-loader.svg?branch=master)](https://travis-ci.org/developit/workerize-loader)

> A webpack loader that moves a module and its dependencies into a Web Worker, automatically reflecting exported functions as asynchronous proxies.

* Bundles a tiny, purpose-built RPC implementation into your app
* If exported module methods are already async, signature is unchanged
* Supports synchronous and asynchronous worker functions
* Works beautifully with async/await
* Imported value is instantiable, just a decorated `Worker`

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
		count = 0;
	while (Date.now() - start < time) count++;
	return count;
}
```

**index.js**: _(our demo)_

```js
import worker from "workerize-loader!./worker";

let instance = worker(); // `new` is optional

instance.expensive(1000).then(count => {
	console.log(`Ran ${count} loops`);
});
```

### About [TypeScript](http://typescriptlang.org)

If you're using [TypeScript](http://typescriptlang.org) in your build you have to modify your
webpack configuration as follows:

```js
module: {
  rules: [
    {
      test: /\.worker\.ts$/,
      use: ['workerize-loader', 'ts-loader'],
    },
    {
      test: /\.tsx?$/,
      use: 'ts-loader',
      exclude: /node_modules/,
    },
  ],
},
```

After that you can import your loaders with following syntax:

```ts
import * as myWorker from "./workers/my.worker";

const { expensive } = (myWorker as any)() as typeof myWorker;
await expensive(1000);
```

**Important**: Don't forget to mark every exported worker function as `async`

```ts
export async function expensive(time: number) {}
```

**Note**: If you are getting errors in your build like `Module build failed: Error: Typescript emitted no output`
try to set the compiler flag `noEmitOnError` to `false`.

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

### Credit

The inner workings here are heavily inspired by [worker-loader](https://github.com/webpack-contrib/worker-loader). It's worth a read!

### License

[MIT License](https://oss.ninja/mit/developit) © [Jason Miller](https://jasonformat.com)
