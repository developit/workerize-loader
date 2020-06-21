export default function transferableDetector(x) {
	if ((x instanceof ArrayBuffer) ||
		(x instanceof MessagePort) ||
		(self.ImageBitmap && x instanceof ImageBitmap)) {
		return [x];
	}
	return [];
}