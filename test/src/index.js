import 'babel-polyfill';
import './other';
import 'mocha/mocha.css';
import mocha from 'exports-loader?mocha!mocha/mocha';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import Worker from 'workerize-loader?ready&name=test!./worker';
import InlineWorker from 'workerize-loader?ready&inline&name=test!./worker';

document.body.appendChild(document.createElement('div')).id = 'mocha';
mocha.setup('bdd');
setTimeout(mocha.run);

chai.use(chaiAsPromised);

let worker = window.worker = new Worker();
console.log(worker);

describe('worker', () => {
	it('should be an instance of Worker', () => {
		expect(worker).to.be.an.instanceof(window.Worker);
	});
	it('worker.foo()', () => {
		expect(worker.foo()).to.eventually.equal(1);
	});
	it('worker.bar()', () => {
		expect(worker.bar('a', 'b')).to.eventually.equal('a [bar:3] b');
	});

	it('should fire ready event', done => {
		let worker = new Worker(),
			called = false,
			isDone = false;
		function fin() {
			if (isDone) return;
			isDone = true;
			expect(called).to.equal(true, 'fired "ready" event');
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
		expect(elapsed).to.be.lessThan(300);

		let one = await worker.foo();
		elapsed = Date.now()-start;
		console.log(`await worker.foo() [${elapsed}ms]: `, one);
		expect(one).to.equal(1);
		expect(Date.now()-start).to.be.lessThan(300);  // @todo why the overhead here?

		start = Date.now();
		let two = await worker.bar(1, 2);
		elapsed = Date.now()-start;
		console.log(`await worker.bar(1, 2) [${elapsed}ms]: `, two);
		expect(two).to.equal('1 [bar:3] 2');
		expect(Date.now()-start).to.be.lessThan(20);
	});

	it('inline worker', async () => {
		let start = Date.now(), elapsed;

		let worker = new InlineWorker();
		await worker.ready;
		elapsed = Date.now()-start;
		console.log(`new InlineWorker() [${elapsed}ms]`);
		expect(elapsed).to.be.lessThan(300);

		start = Date.now();
		let one = await worker.foo();
		elapsed = Date.now()-start;
		console.log(`await worker.foo() [${elapsed}ms]: `, one);
		expect(one).to.equal(1);
		expect(elapsed).to.be.lessThan(20);

		start = Date.now();
		let two = await worker.bar(1, 2);
		elapsed = Date.now()-start;
		console.log(`await worker.bar(1, 2) [${elapsed}ms]: `, two);
		expect(two).to.equal('1 [bar:3] 2');
		expect(elapsed).to.be.lessThan(20);
	});
});
