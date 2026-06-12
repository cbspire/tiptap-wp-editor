/**
 * SlashCommand tests — item filtering and block insertion commands.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Editor } from '@tiptap/core';
import { StarterKit } from '@tiptap/starter-kit';
import { filterSlashItems, getSlashMenuItems } from './slash-command';
import type { SlashMenuItem } from './slash-command';
import { WPReadMore } from './read-more';

function createEditor( content: string ): Editor {
	return new Editor( {
		extensions: [ StarterKit, WPReadMore ],
		content,
	} );
}

function findItem( title: string ): SlashMenuItem {
	const item = getSlashMenuItems().find( ( i ) => i.title === title );
	if ( ! item ) {
		throw new Error( `No slash item titled "${ title }"` );
	}
	return item;
}

describe( 'getSlashMenuItems', () => {
	beforeEach( () => {
		window.tiptapEditorData = {
			hasAbilitiesApi: false,
			hasAiClient: false,
			restUrl: 'https://example.test/wp-json/tiptap-editor/v1/',
			mediaRestUrl: 'https://example.test/wp-json/wp/v2/media',
			canUploadFiles: true,
			nonce: 'test-nonce',
			postId: 1,
			postType: 'post',
		};
	} );

	afterEach( () => {
		delete window.tiptapEditorData;
	} );

	it( 'includes the core Notion-style blocks', () => {
		const titles = getSlashMenuItems().map( ( i ) => i.title );
		expect( titles ).toEqual(
			expect.arrayContaining( [
				'Text',
				'Heading 1',
				'Heading 2',
				'Heading 3',
				'Bulleted list',
				'Numbered list',
				'Quote',
				'Code block',
				'Divider',
				'Image',
				'Upload image',
				'Read more',
				'Shortcode',
				'HTML',
			] )
		);
	} );

	it( 'hides "Upload image" when the user cannot upload files', () => {
		window.tiptapEditorData!.canUploadFiles = false;
		const filtered = filterSlashItems( getSlashMenuItems(), '' );
		expect( filtered.map( ( i ) => i.title ) ).not.toContain(
			'Upload image'
		);
	} );
} );

describe( 'filterSlashItems', () => {
	const items = getSlashMenuItems();

	it( 'returns all available items for an empty query', () => {
		const filtered = filterSlashItems( items, '' );
		expect( filtered.length ).toBeGreaterThanOrEqual( 13 );
	} );

	it( 'matches by title', () => {
		const filtered = filterSlashItems( items, 'quote' );
		expect( filtered.map( ( i ) => i.title ) ).toContain( 'Quote' );
	} );

	it( 'matches by keyword aliases', () => {
		expect(
			filterSlashItems( items, 'h1' ).map( ( i ) => i.title )
		).toContain( 'Heading 1' );
		expect(
			filterSlashItems( items, 'ul' ).map( ( i ) => i.title )
		).toContain( 'Bulleted list' );
		expect(
			filterSlashItems( items, 'hr' ).map( ( i ) => i.title )
		).toContain( 'Divider' );
	} );

	it( 'is case-insensitive', () => {
		expect(
			filterSlashItems( items, 'HEAD' ).map( ( i ) => i.title )
		).toEqual( [ 'Heading 1', 'Heading 2', 'Heading 3' ] );
	} );

	it( 'returns nothing for a query with no matches', () => {
		expect( filterSlashItems( items, 'zzzznope' ) ).toEqual( [] );
	} );
} );

describe( 'slash item commands', () => {
	it( 'turns the current block into a heading and removes the query text', () => {
		const editor = createEditor( '<p>/head</p>' );
		// "/head" occupies positions 1–6 inside the paragraph.
		findItem( 'Heading 1' ).command( {
			editor,
			range: { from: 1, to: 6 },
		} );
		expect( editor.getHTML() ).toBe( '<h1></h1>' );
		editor.destroy();
	} );

	it( 'inserts a bulleted list', () => {
		const editor = createEditor( '<p>/ul</p>' );
		findItem( 'Bulleted list' ).command( {
			editor,
			range: { from: 1, to: 4 },
		} );
		expect( editor.getHTML() ).toContain( '<ul>' );
		editor.destroy();
	} );

	it( 'inserts a divider', () => {
		const editor = createEditor( '<p>/hr</p>' );
		findItem( 'Divider' ).command( { editor, range: { from: 1, to: 4 } } );
		expect( editor.getHTML() ).toContain( '<hr>' );
		editor.destroy();
	} );

	it( 'inserts the WordPress read-more divider', () => {
		const editor = createEditor( '<p>/more</p>' );
		findItem( 'Read more' ).command( {
			editor,
			range: { from: 1, to: 6 },
		} );
		expect( editor.getHTML() ).toContain( 'read-more' );
		editor.destroy();
	} );
} );
