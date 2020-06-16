import { otherFoo, otherBar } from './other';

export { otherFoo };

export function foo() {
	return 1;
}

export function throwError() {
	throw new Error('Error in worker.js');
}

export const bar = (a, b) => `${a} [bar:${otherBar}] ${b}`;

export function getArrayBuffer(len) {
	return new ArrayBuffer(len);
}

let insecureBuffer;

export function createInsecureArrayBuffer(len) {
	insecureBuffer = new ArrayBuffer(len);
}

export function getInsecureArrayBuffer() {
	return insecureBuffer;
}

export function setInsecureArrayBuffer(buffer) {
	insecureBuffer = buffer;
}