/**
 * WPImageUpload tests — placeholder insertion, attribute patching on
 * success, node removal on failure.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Editor } from '@tiptap/core';
import { StarterKit } from '@tiptap/starter-kit';
import { WPImage } from './wp-image';
import { WPImageUpload, uploadAndInsertImages } from './image-upload';

const uploadMock = vi.hoisted( () => vi.fn() );

vi.mock( '../upload', async ( importOriginal ) => {
	const original = await importOriginal< typeof import('../upload') >();
	return {
		...original,
		canUploadFiles: () => true,
		uploadImageToMediaLibrary: uploadMock,
	};
} );

function createEditor(): Editor {
	return new Editor( {
		extensions: [ StarterKit, WPImage, WPImageUpload ],
		content: '<p></p>',
	} );
}

function flushPromises(): Promise< void > {
	return new Promise( ( resolve ) => setTimeout( resolve, 0 ) );
}

function findImage( editor: Editor ): Record< string, unknown > | null {
	let attrs: Record< string, unknown > | null = null;
	editor.state.doc.descendants( ( node ) => {
		if ( node.type.name === 'wpImage' ) {
			attrs = node.attrs;
			return false;
		}
		return true;
	} );
	return attrs;
}

describe( 'uploadAndInsertImages', () => {
	let editor: Editor;

	beforeEach( () => {
		editor = createEditor();
		uploadMock.mockReset();
	} );

	afterEach( () => {
		editor.destroy();
	} );

	it( 'ignores non-image files', () => {
		const pdf = new File( [ 'x' ], 'doc.pdf', { type: 'application/pdf' } );
		expect( uploadAndInsertImages( editor, [ pdf ] ) ).toBe( 0 );
		expect( findImage( editor ) ).toBeNull();
	} );

	it( 'inserts an uploading placeholder immediately', () => {
		uploadMock.mockReturnValue( new Promise( () => undefined ) );

		const file = new File( [ 'x' ], 'a.png', { type: 'image/png' } );
		expect( uploadAndInsertImages( editor, [ file ] ) ).toBe( 1 );

		const attrs = findImage( editor );
		expect( attrs ).not.toBeNull();
		expect( String( attrs!.src ) ).toMatch( /^blob:/ );
		expect( attrs!.uploadId ).toBeTruthy();
	} );

	it( 'patches the node with attachment data when the upload succeeds', async () => {
		uploadMock.mockResolvedValue( {
			id: 42,
			url: 'https://example.test/uploads/a.png',
			alt: 'Alt text',
		} );

		const file = new File( [ 'x' ], 'a.png', { type: 'image/png' } );
		uploadAndInsertImages( editor, [ file ] );
		await flushPromises();

		const attrs = findImage( editor );
		expect( attrs ).not.toBeNull();
		expect( attrs!.src ).toBe( 'https://example.test/uploads/a.png' );
		expect( attrs!.attachmentId ).toBe( 42 );
		expect( attrs!.class ).toBe( 'wp-image-42' );
		expect( attrs!.uploadId ).toBeNull();
	} );

	it( 'removes the placeholder when the upload fails', async () => {
		uploadMock.mockRejectedValue( new Error( 'Quota exceeded' ) );

		const file = new File( [ 'x' ], 'a.png', { type: 'image/png' } );
		uploadAndInsertImages( editor, [ file ] );
		expect( findImage( editor ) ).not.toBeNull();

		await flushPromises();
		expect( findImage( editor ) ).toBeNull();
	} );

	it( 'never serialises the transient uploadId to HTML', () => {
		uploadMock.mockReturnValue( new Promise( () => undefined ) );

		const file = new File( [ 'x' ], 'a.png', { type: 'image/png' } );
		uploadAndInsertImages( editor, [ file ] );

		expect( editor.getHTML() ).not.toContain( 'uploadId' );
		expect( editor.getHTML() ).not.toContain( 'upload-id' );
	} );
} );
