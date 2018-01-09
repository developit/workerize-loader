/* global __webpack_exports__ */

function workerSetup() {
	addEventListener('message', (e) => {
		let { type, method, id, params } = e.data, f, p;
		if (type==='RPC' && method) {
			if ((f = __webpack_exports__[method])) {
				p = Promise.resolve().then( () => f.apply(__webpack_exports__, params) );
			}
			else {
				p = Promise.reject('No such method');
			}
			p.then(
				result => {
					postMessage({ type: 'RPC', id, result });
				},
				error => {
					postMessage({ type: 'RPC', id, error });
				});
		}
	});
	postMessage({ type: 'RPC', method: 'ready' });
}

const workerScript = '\n' + Function.prototype.toString.call(workerSetup).replace(/(^.*\{|\}.*$|\n\s*)/g, '');

export default function rpcWorkerLoader(content) {
	return content + workerScript;
}