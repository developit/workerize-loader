import { otherFoo, otherBar } from './other';

export { otherFoo };
export { otherOtherFoo as andTheOtherFoo } from './and-the-other';
export * from './and-the-other';

export { tragedy } from './common.js';

export function foo() {
	return 1;
}

export const value = 3;

export function throwError() {
	throw new Error('Error in worker.js');
}

export const bar = (a, b) => `${a} [bar:${otherBar}] ${b}`;
