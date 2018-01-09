import { otherFoo, otherBar } from './other';

export { otherFoo };

export function foo() {
	return 1;
}

export function bar(a, b) {
	return `${a} [bar:${otherBar}] ${b}`;
}