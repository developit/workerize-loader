import path from 'path';
import loaderUtils from 'loader-utils';

import NodeTargetPlugin from 'webpack/lib/node/NodeTargetPlugin';
import SingleEntryPlugin from 'webpack/lib/SingleEntryPlugin';
import WebWorkerTemplatePlugin from 'webpack/lib/webworker/WebWorkerTemplatePlugin';

export default function loader() {}

loader.pitch = function(request) {
	this.cacheable(false);

	const options = loaderUtils.getOptions(this) || {};

	const cb = this.async();

	const filename = loaderUtils.interpolateName(this, `${options.name || '[hash]'}.worker.js`, {
		context: options.context || this.rootContext || this.options.context,
		regExp: options.regExp
	});

	const worker = {};

	worker.options = {
		filename,
		chunkFilename: `[id].${filename}`,
		namedChunkFilename: null
	};

	const compilerOptions = this._compiler.options || {};
	if (compilerOptions.output && compilerOptions.output.globalObject==='window') {
		console.warn('Warning (workerize-loader): output.globalObject is set to "window". It should be set to "self" or "this" to support HMR in Workers.');
	}

	worker.compiler = this._compilation.createChildCompiler('worker', worker.options);

	(new WebWorkerTemplatePlugin(worker.options)).apply(worker.compiler);

	if (this.target!=='webworker' && this.target!=='web') {
		(new NodeTargetPlugin()).apply(worker.compiler);
	}

	// webpack >= v4 supports webassembly
	let wasmPluginPath = null;
	try {
		wasmPluginPath = require.resolve(
			'webpack/lib/web/FetchCompileWasmTemplatePlugin'
		);
	}
	catch (_err) {
		// webpack <= v3, skipping
	}

	if (wasmPluginPath) {
		// eslint-disable-next-line global-require
		const FetchCompileWasmTemplatePlugin = require(wasmPluginPath);
		new FetchCompileWasmTemplatePlugin({
			mangleImports: this._compiler.options.optimization.mangleWasmImports
		}).apply(worker.compiler);
	}

	(new SingleEntryPlugin(this.context, `!!${path.resolve(__dirname, 'rpc-worker-loader.js')}!${request}`, 'main')).apply(worker.compiler);
	worker.compiler.runAsChild((err, entries, compilation) => {
		if (err) return cb(err);

		if (entries[0]) {
			worker.file = Array.from(entries[0].files)[0];

			let contents = compilation.assets[worker.file].source();

			if (entries[0].entryModule.buildMeta.providedExports === true) {
				// Can also occur if doing `export * from 'common js module'`
				throw new Error('Attempted to load a worker implemented in CommonJS');
			}

			let exports = entries[0].entryModule.buildMeta.providedExports;

			// console.log('Workerized exports: ', exports.join(', '));

			if (options.inline) {
				worker.url = `URL.createObjectURL(new Blob([${JSON.stringify(contents)}]))`;
			}
			else if (options.publicPath) {
				worker.url = `${JSON.stringify(options.publicPath + worker.file)}`;
			}
			else {
				worker.url = `__webpack_public_path__ + ${JSON.stringify(worker.file)}`;
			}

			if (options.fallback === false) {
				delete this._compilation.assets[worker.file];
			}

			let workerUrl = worker.url;
			if (options.import) {
				workerUrl = `"data:,importScripts('"+location.origin+${workerUrl}+"')"`;
			}

			return cb(null, `
				var addMethods = require(${loaderUtils.stringifyRequest(this, path.resolve(__dirname, 'rpc-wrapper.js'))})
				var methods = ${JSON.stringify(exports)}
				module.exports = function() {
					var w = new Worker(${workerUrl}, { name: ${JSON.stringify(filename)} })
					addMethods(w, methods)
					${ options.ready ? 'w.ready = new Promise(function(r) { w.addEventListener("ready", function(){ r(w) }) })' : '' }
					return w
				}
			`);
		}

		return cb(null, null);
	});
};
