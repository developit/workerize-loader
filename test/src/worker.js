import { otherFoo, otherBar } from './other';

export { otherFoo };

export function foo() {
	return 1;
}

export function throwError() {
	const toThrow = new Error('Error in worker.js');
	toThrow.foo = 'bar';
	throw toThrow;
}

export const bar = (a, b) => `${a} [bar:${otherBar}] ${b}`;
