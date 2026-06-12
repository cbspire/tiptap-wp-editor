/**
 * Vitest setup — jsdom shims required by ProseMirror.
 *
 * jsdom does not implement layout APIs; ProseMirror calls these during
 * EditorView construction and selection handling.
 */

function createRect(): DOMRect {
	return {
		top: 0,
		bottom: 0,
		left: 0,
		right: 0,
		width: 0,
		height: 0,
		x: 0,
		y: 0,
		toJSON: () => ( {} ),
	};
}

if ( typeof Range.prototype.getBoundingClientRect !== 'function' ) {
	Range.prototype.getBoundingClientRect = createRect;
}
Range.prototype.getClientRects = () => {
	const rects = [ createRect() ];
	return Object.assign( rects, {
		item: ( index: number ) => rects[ index ] ?? null,
	} ) as unknown as DOMRectList;
};

if ( typeof document.elementFromPoint !== 'function' ) {
	document.elementFromPoint = () => null;
}

if ( typeof URL.createObjectURL !== 'function' ) {
	URL.createObjectURL = () =>
		`blob:mock-${ Math.random().toString( 36 ).slice( 2 ) }`;
	URL.revokeObjectURL = () => undefined;
}
