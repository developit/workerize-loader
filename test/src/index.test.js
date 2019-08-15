import './other';
import Worker from 'workerize-loader?ready&name=test!./worker';
import InlineWorker from 'workerize-loader?ready&inline&name=test!./worker';
import ImportWorker from 'workerize-loader?import!./worker';

describe('worker', () => {
	let worker;

	it('should be an instance of Worker', () => {
		worker = new Worker();
		expect(worker).toEqual(jasmine.any(window.Worker));
	});

	it('worker.foo()', async () => {
		expect(await worker.foo()).toBe(1);
	});

	it('worker.bar()', async () => {
		let out = await worker.bar('a', 'b');
		expect(out).toEqual('a [bar:3] b');
	});

	it('worker.throwError() should pass the Error back to the application context', async () => {
		try {
			await worker.throwError();
		}
		catch (e) {
			expect(e).toEqual(Error('Error in worker.js'));
		}
	});

	it('should fire ready event', done => {
		let worker = new Worker(),
			called = false,
			isDone = false;
		function fin() {
			if (isDone) return;
			isDone = true;
			expect(called).toEqual(true);
			done();
		}
		worker.addEventListener('ready', () => {
			called = true;
			fin();
		});
		setTimeout(fin, 300);
	});
});

describe('async/await demo', () => {
	it('remote worker', async () => {
		let start = Date.now(), elapsed;

		let worker = new Worker();
		// passing "?ready" sets up this promise for you: (just a wrapper around the "ready" event)
		await worker.ready;
		elapsed = Date.now()-start;
		console.log(`new Worker() [${elapsed}ms]`);
		expect(elapsed).toBeLessThan(300);

		let one = await worker.foo();
		elapsed = Date.now()-start;
		console.log(`await worker.foo() [${elapsed}ms]: `, one);
		expect(one).toEqual(1);
		expect(Date.now()-start).toBeLessThan(300);  // @todo why the overhead here?

		start = Date.now();
		let two = await worker.bar(1, 2);
		elapsed = Date.now()-start;
		console.log(`await worker.bar(1, 2) [${elapsed}ms]: `, two);
		expect(two).toEqual('1 [bar:3] 2');
		expect(Date.now()-start).toBeLessThan(20);
	});

	it('inline worker', async () => {
		let start = Date.now(), elapsed;

		let worker = new InlineWorker();
		await worker.ready;
		elapsed = Date.now()-start;
		console.log(`new InlineWorker() [${elapsed}ms]`);
		expect(elapsed).toBeLessThan(300);

		start = Date.now();
		let one = await worker.foo();
		elapsed = Date.now()-start;
		console.log(`await worker.foo() [${elapsed}ms]: `, one);
		expect(one).toEqual(1);
		expect(elapsed).toBeLessThan(20);

		start = Date.now();
		let two = await worker.bar(1, 2);
		elapsed = Date.now()-start;
		console.log(`await worker.bar(1, 2) [${elapsed}ms]: `, two);
		expect(two).toEqual('1 [bar:3] 2');
		expect(elapsed).toBeLessThan(20);
	});
});

describe('?import option', () => {
	let worker;

	it('should be an instance of Worker', () => {
		worker = new ImportWorker();
		expect(worker).toEqual(jasmine.any(window.Worker));
	});

	it('worker.foo()', async () => {
		expect(await worker.foo()).toBe(1);
	});

	it('worker.bar()', async () => {
		let out = await worker.bar('a', 'b');
		expect(out).toEqual('a [bar:3] b');
	});
});
