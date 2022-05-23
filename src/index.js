import path from 'path';
import loaderUtils from 'loader-utils';

import NodeTargetPlugin from 'webpack/lib/node/NodeTargetPlugin';
import SingleEntryPlugin from 'webpack/lib/SingleEntryPlugin';
import WebWorkerTemplatePlugin from 'webpack/lib/webworker/WebWorkerTemplatePlugin';

export default function loader() {}

const CACHE = {};
const tapName = 'workerize-loader';

function compilationHook(compiler, handler) {
	if (compiler.hooks) {
		return compiler.hooks.compilation.tap(tapName, handler);
	}
	return compiler.plugin('compilation', handler);
}

function parseHook(data, handler) {
	if (data.normalModuleFactory.hooks) {
		return data.normalModuleFactory.hooks.parser.for('javascript/auto').tap(tapName, handler);
	}
	return data.normalModuleFactory.plugin('parser', handler);
}

function exportDeclarationHook(parser, handler) {
	if (parser.hooks) {
		return parser.hooks.exportDeclaration.tap(tapName, handler);
	}
	return parser.plugin('export declaration', handler);
}

loader.pitch = function(request) {
	this.cacheable(false);

	const options = loaderUtils.getOptions(this) || {};

	const cb = this.async();

	const compilerOptions = this._compiler.options || {};

	const filename = (options.name || '[fullhash]') + '.worker.js';

	const worker = {};

	worker.options = {
		filename,
		chunkFilename: filename,
		publicPath: options.publicPath || compilerOptions.output.publicPath,
		globalObject: 'self'
	};

	if (compilerOptions.output && compilerOptions.output.globalObject==='window') {
		console.warn('Warning (workerize-loader): output.globalObject is set to "window". It should be set to "self" or "this" to support HMR in Workers.');
	}

	worker.compiler = this._compilation.createChildCompiler(`worker ${request}`, worker.options);

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

	const bundleName = path.parse(this.resourcePath).name;

	(new SingleEntryPlugin(this.context, `!!${path.resolve(__dirname, 'rpc-worker-loader.js')}!${request}`, bundleName)).apply(worker.compiler);

	compilationHook(worker.compiler, (compilation, data) => {
		parseHook(data, (parser, options) => {
			exportDeclarationHook(parser, expr => {
				let decl = expr.declaration || expr;
				let	{ compilation, current } = parser.state;

				let entryModule =
					compilation.entries instanceof Map
						? compilation.moduleGraph.getModule(
							compilation.entries.get(bundleName).dependencies[0]
						  )
						: compilation.entries[0];

				// only process entry exports
				if (current.resource!==entryModule.resource) return;

				let key = current.nameForCondition();
				let exports = CACHE[key] || (CACHE[key] = {});
				if (decl.id) {
					exports[decl.id.name] = true;
				}
				else if (decl.declarations) {
					for (let i=0; i<decl.declarations.length; i++) {
						exports[decl.declarations[i].id.name] = true;
					}
				}
				else {
					console.warn('[workerize] unknown export declaration: ', expr);
				}

				// This is for Webpack 5: mark the exports as used so it does not get tree-shaken away on production build
				if (compilation.moduleGraph) {
					const { getEntryRuntime } = require('webpack/lib/util/runtime');
					const { UsageState } = require('webpack');
					const runtime = getEntryRuntime(compilation, bundleName);
					for (const exportName of Object.keys(exports)) {
						const exportInfo = compilation.moduleGraph.getExportInfo(entryModule, exportName);
						exportInfo.setUsed(UsageState.Used, runtime);
						exportInfo.canMangleUse = false;
						exportInfo.canMangleProvide = false;
					}
					compilation.moduleGraph.addExtraReason(entryModule, 'used by workerize-loader');
				}
			});
		});
	});

	worker.compiler.runAsChild((err, entries, compilation) => {
		if (err) return cb(err);

		if (entries[0]) {
			worker.file = Array.from(entries[0].files)[0];
			const entryModules =
				compilation.chunkGraph &&
				compilation.chunkGraph.getChunkEntryModulesIterable
					? Array.from(
						compilation.chunkGraph.getChunkEntryModulesIterable(entries[0])
					  )
					: null;
			const entryModule =
				entryModules && entryModules.length > 0
					? entryModules[0]
					: entries[0].entryModule;

			let key = entryModule.nameForCondition();
			let contents = compilation.assets[worker.file].source();
			let exports = Object.keys(CACHE[key] || {});

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
				workerUrl = `"data:,importScripts('"+new URL(${workerUrl},location.origin)+"')"`;
			}

			// workerUrl will be URL.revokeObjectURL() to avoid memory leaks on browsers
			// https://github.com/webpack-contrib/worker-loader/issues/208

			return cb(null, `
				var addMethods = require(${loaderUtils.stringifyRequest(this, path.resolve(__dirname, 'rpc-wrapper.js'))})
				var methods = ${JSON.stringify(exports)}
				module.exports = function() {
					var w = new Worker(${workerUrl}, { name: ${JSON.stringify(filename)} })
					URL.revokeObjectURL(${workerUrl});
					addMethods(w, methods)
					${ options.ready ? 'w.ready = new Promise(function(r) { w.addEventListener("ready", function(){ r(w) }) })' : '' }
					return w
				}
			`);
		}

		return cb(null, null);
	});
};
