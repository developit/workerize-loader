import { otherFoo, otherBar } from './other';

export { otherFoo };

export function foo() {
	return 1;
}

export function throwError() {
	throw new Error('Error in worker.js');
}

export const bar = (a, b) => `${a} [bar:${otherBar}] ${b}`;
