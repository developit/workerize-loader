export default function addMethods(worker, methods) {
	let c = 0;
	let callbacks = {};
	worker.addEventListener('message', (e) => {
		let d = e.data;
		if (d.type!=='RPC') return;
		if (d.id) {
			let f = callbacks[d.id];
			if (f) {
				delete callbacks[d.id];
				if (d.error) f[1](d.error);
				else f[0](d.result);
			}
		}
		else {
			let evt = document.createEvent('Event');
			evt.initEvent(d.method);
			evt.data = d.params;
			worker.dispatchEvent(evt);
		}
	});
	methods.forEach( method => {
		worker[method] = (...params) => new Promise( (a, b) => {
			let id = ++c;
			callbacks[id] = [a, b];
			worker.postMessage({ type: 'RPC', id, method, params });
		});
	});
}
