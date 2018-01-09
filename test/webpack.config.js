let path = require('path');
let HtmlWebpackPlugin = require('html-webpack-plugin');

const DEV = /webpack-dev-server/.test(process.argv[1]);

module.exports = {
	context: __dirname,
	entry: './src',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'bundle.js'
	},
	resolveLoader: {
		alias: {
			'workerize-loader': path.resolve(__dirname, '..')
		}
	},
	module: {
		rules: [
			{
				test: /.css$/,
				loader: 'style-loader!css-loader'
			},
			{
				test: /\.js$/,
				exclude: /\/node_modules\//,
				loader: 'babel-loader',
				options: {
					presets: [
						['env', {
							modules: false,
							loose: true,
							blacklist: [
								'transform-regenerator'
							]
						}]
					],
					plugins: [
						['fast-async', {
							compiler: {
								promises: true,
								generators: false
							},
							runtimePattern: null,
							useRuntimeModule: false
						}]
					]
				}
			}
		]
	},
	// node: {
	// 	util: false,
	// 	dns: false,
	// 	fs: false,
	// 	path: false,
	// 	module: false,
	// 	url: false,
	// 	console: false,
	// 	global: false,
	// 	process: true,
	// 	__filename: false,
	// 	__dirname: false,
	// 	Buffer: false,
	// 	setImmediate: false
	// },
	plugins: [
		new HtmlWebpackPlugin()
	],
	devtool: DEV ? 'cheap-module-eval-source-map' : 'source-map'
};
