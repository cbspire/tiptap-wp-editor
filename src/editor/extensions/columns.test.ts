/**
 * WPColumns / WPButton tests — insertion, serialisation, round-trip.
 */

import { describe, expect, it } from 'vitest';
import { Editor } from '@tiptap/core';
import { StarterKit } from '@tiptap/starter-kit';
import { WPColumns, WPColumn } from './columns';
import { WPButton } from './button';

function createEditor( content = '<p></p>' ): Editor {
	return new Editor( {
		extensions: [ StarterKit, WPColumns, WPColumn, WPButton ],
		content,
	} );
}

describe( 'WPColumns', () => {
	it( 'inserts a 2-column layout with empty paragraphs', () => {
		const editor = createEditor();
		editor.chain().focus().insertColumns( 2 ).run();

		const html = editor.getHTML();
		expect( html ).toContain( 'class="tt-columns tt-columns--2"' );
		expect( html.match( /class="tt-column"/g ) ).toHaveLength( 2 );
		editor.destroy();
	} );

	it( 'inserts a 3-column layout', () => {
		const editor = createEditor();
		editor.chain().focus().insertColumns( 3 ).run();

		const html = editor.getHTML();
		expect( html ).toContain( 'class="tt-columns tt-columns--3"' );
		expect( html.match( /class="tt-column"/g ) ).toHaveLength( 3 );
		editor.destroy();
	} );

	it( 'round-trips column content and count through HTML', () => {
		const input =
			'<div class="tt-columns tt-columns--2">' +
			'<div class="tt-column"><p>Left</p></div>' +
			'<div class="tt-column"><p>Right</p></div>' +
			'</div>';
		const editor = createEditor( input );

		const html = editor.getHTML();
		expect( html ).toContain( '<p>Left</p>' );
		expect( html ).toContain( '<p>Right</p>' );
		expect( html ).toContain( 'tt-columns--2' );
		editor.destroy();
	} );
} );

describe( 'WPButton', () => {
	it( 'inserts a button with defaults', () => {
		const editor = createEditor();
		editor.chain().focus().insertWPButton().run();

		const html = editor.getHTML();
		expect( html ).toContain( 'class="tt-button-wrap"' );
		expect( html ).toContain( 'class="tt-button tt-button--fill"' );
		expect( html ).toContain( 'Click here' );
		editor.destroy();
	} );

	it( 'serialises custom label, URL and variant', () => {
		const editor = createEditor();
		editor
			.chain()
			.focus()
			.insertWPButton( {
				text: 'Buy now',
				href: 'https://example.test/buy',
				variant: 'outline',
			} )
			.run();

		const html = editor.getHTML();
		expect( html ).toContain( 'href="https://example.test/buy"' );
		expect( html ).toContain( 'tt-button--outline' );
		expect( html ).toContain( 'Buy now' );
		editor.destroy();
	} );

	it( 'round-trips a button through HTML', () => {
		const input =
			'<div class="tt-button-wrap">' +
			'<a class="tt-button tt-button--outline" href="https://example.test">Go</a>' +
			'</div>';
		const editor = createEditor( input );

		const html = editor.getHTML();
		expect( html ).toContain( 'href="https://example.test"' );
		expect( html ).toContain( 'tt-button--outline' );
		expect( html ).toContain( 'Go' );
		editor.destroy();
	} );
} );
