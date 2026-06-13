/**
 * WPImageMenu tests — the floating image options bar appears on image
 * selection and its buttons update the image's WordPress attributes.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { Editor } from '@tiptap/core';
import { StarterKit } from '@tiptap/starter-kit';
import { NodeSelection } from '@tiptap/pm/state';
import { WPImage } from './wp-image';
import { WPImageMenu } from './image-menu';

let editor: Editor | null = null;

function mountEditor(): Editor {
	const el = document.createElement( 'div' );
	document.body.appendChild( el );
	editor = new Editor( {
		element: el,
		extensions: [ StarterKit, WPImage, WPImageMenu ],
		content:
			'<p>text</p><img src="https://x.test/a.png" class="wp-image-7" alt="a">',
	} );
	return editor;
}

function imagePos( ed: Editor ): number {
	let pos = -1;
	ed.state.doc.descendants( ( node, p ) => {
		if ( node.type.name === 'wpImage' ) {
			pos = p;
			return false;
		}
		return true;
	} );
	return pos;
}

function selectImage( ed: Editor ): void {
	const pos = imagePos( ed );
	const tr = ed.state.tr.setSelection(
		NodeSelection.create( ed.state.doc, pos )
	);
	ed.view.dispatch( tr );
}

afterEach( () => {
	editor?.destroy();
	editor = null;
	document.body.innerHTML = '';
} );

describe( 'WPImageMenu', () => {
	it( 'is hidden until an image is selected', () => {
		mountEditor();
		const menu = document.querySelector(
			'.tiptap-image-menu'
		) as HTMLElement | null;
		expect( menu ).not.toBeNull();
		expect( menu!.style.display ).toBe( 'none' );
	} );

	it( 'shows alignment, width, rounded, alt, replace and remove controls on selection', () => {
		const ed = mountEditor();
		selectImage( ed );

		const menu = document.querySelector( '.tiptap-image-menu' ) as HTMLElement;
		expect( menu.style.display ).toBe( 'flex' );

		const labels = Array.from( menu.querySelectorAll( 'button' ) ).map( ( b ) =>
			b.getAttribute( 'aria-label' )
		);
		expect( labels ).toEqual(
			expect.arrayContaining( [
				'Align left',
				'Align center',
				'Align right',
				'Width 50%',
				'Width 100%',
				'Rounded corners',
				'Edit alt text',
				'Replace image',
				'Remove image',
			] )
		);
	} );

	it( 'hides again when the selection leaves the image', () => {
		const ed = mountEditor();
		selectImage( ed );
		const menu = document.querySelector( '.tiptap-image-menu' ) as HTMLElement;
		expect( menu.style.display ).toBe( 'flex' );

		ed.commands.setTextSelection( 1 );
		expect( menu.style.display ).toBe( 'none' );
	} );

	it( 'aligns the image when the align button is pressed', () => {
		const ed = mountEditor();
		selectImage( ed );
		const btn = document.querySelector(
			'.tiptap-image-menu button[aria-label="Align center"]'
		) as HTMLButtonElement;
		btn.dispatchEvent( new Event( 'mousedown', { bubbles: true } ) );
		expect( ed.getHTML() ).toContain( 'aligncenter' );
	} );

	it( 'sets a percentage width via the width button', () => {
		const ed = mountEditor();
		selectImage( ed );
		const btn = document.querySelector(
			'.tiptap-image-menu button[aria-label="Width 50%"]'
		) as HTMLButtonElement;
		btn.dispatchEvent( new Event( 'mousedown', { bubbles: true } ) );
		expect( ed.getHTML() ).toContain( 'tt-image--w50' );
	} );

	it( 'toggles rounded corners', () => {
		const ed = mountEditor();
		selectImage( ed );
		const btn = document.querySelector(
			'.tiptap-image-menu button[aria-label="Rounded corners"]'
		) as HTMLButtonElement;
		btn.dispatchEvent( new Event( 'mousedown', { bubbles: true } ) );
		expect( ed.getHTML() ).toContain( 'tt-image--rounded' );
	} );
} );
