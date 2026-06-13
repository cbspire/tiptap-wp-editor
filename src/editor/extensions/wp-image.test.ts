/**
 * WPImage attribute tests — alignment, width, rounded corners
 * serialisation and round-trip parsing.
 */

import { describe, expect, it } from 'vitest';
import { Editor } from '@tiptap/core';
import { StarterKit } from '@tiptap/starter-kit';
import { WPImage } from './wp-image';

function createEditor( content = '<p></p>' ): Editor {
	return new Editor( {
		extensions: [ StarterKit, WPImage ],
		content,
	} );
}

const IMG = {
	type: 'wpImage',
	attrs: {
		src: 'https://example.test/a.png',
		alt: 'Alt',
		attachmentId: 42,
		class: 'wp-image-42',
	},
};

describe( 'WPImage style attributes', () => {
	it( 'renders the WP alignment class', () => {
		const editor = createEditor();
		editor
			.chain()
			.insertContent( {
				...IMG,
				attrs: { ...IMG.attrs, align: 'center' },
			} )
			.run();

		expect( editor.getHTML() ).toContain( 'aligncenter' );
		expect( editor.getHTML() ).toContain( 'wp-image-42' );
		editor.destroy();
	} );

	it( 'always carries the base tt-image class', () => {
		const editor = createEditor();
		editor.chain().insertContent( IMG ).run();
		expect( editor.getHTML() ).toContain( 'tt-image' );
		editor.destroy();
	} );

	it( 'renders percentage width as a tt-image--w modifier class', () => {
		const editor = createEditor();
		editor
			.chain()
			.insertContent( { ...IMG, attrs: { ...IMG.attrs, widthPct: 50 } } )
			.run();

		expect( editor.getHTML() ).toContain( 'tt-image--w50' );
		editor.destroy();
	} );

	it( 'renders the rounded modifier class', () => {
		const editor = createEditor();
		editor
			.chain()
			.insertContent( { ...IMG, attrs: { ...IMG.attrs, rounded: true } } )
			.run();

		expect( editor.getHTML() ).toContain( 'tt-image--rounded' );
		editor.destroy();
	} );

	it( 'round-trips align/width/rounded without duplicating classes', () => {
		const input =
			'<p><img src="https://example.test/a.png" ' +
			'class="tt-image wp-image-42 alignright tt-image--rounded tt-image--w75" ' +
			'data-attachment-id="42" alt="Alt"></p>';
		const editor = createEditor( input );

		const html = editor.getHTML();
		expect( html ).toContain( 'alignright' );
		expect( html ).toContain( 'tt-image--rounded' );
		expect( html ).toContain( 'tt-image--w75' );
		expect( html ).toContain( 'wp-image-42' );
		// Classes must not duplicate on round-trip.
		expect( html.match( /alignright/g ) ).toHaveLength( 1 );
		expect( html.match( /tt-image--rounded/g ) ).toHaveLength( 1 );
		expect( html.match( /tt-image--w75/g ) ).toHaveLength( 1 );
		editor.destroy();
	} );
} );
