/**
 * Slim Toolbar Component.
 *
 * A reduced top toolbar with the essentials (basic marks, image,
 * read-more, undo/redo) — kept mainly for touch devices. The full
 * formatting surface lives in the Notion-style slash command menu
 * (type "/") and the floating bubble menu on text selection.
 *
 * Uses @wordpress/element (externalised React) so it works on WP 6.8+
 * without bundling React. Same HTML structure on all WP versions;
 * visual styling comes from editor-legacy.css or editor-modern.css.
 */

import { createElement, render } from '@wordpress/element';
import type { Editor } from '@tiptap/core';

interface ToolbarButtonProps {
	label: string;
	icon: string;
	isActive: boolean;
	isDisabled: boolean;
	onClick: () => void;
}

function ToolbarButton( {
	label,
	icon,
	isActive,
	isDisabled,
	onClick,
}: ToolbarButtonProps ) {
	return createElement(
		'button',
		{
			type: 'button',
			title: label,
			'aria-label': label,
			'aria-pressed': isActive,
			disabled: isDisabled,
			className: `tiptap-toolbar__button${
				isActive ? ' is-active' : ''
			}`,
			onClick,
		},
		icon
	);
}

interface ToolbarProps {
	editor: Editor;
}

function ToolbarComponent( { editor }: ToolbarProps ) {
	const buttons: Array< {
		label: string;
		icon: string;
		isActive: () => boolean;
		action: () => void;
	} > = [
		{
			label: 'Bold',
			icon: 'B',
			isActive: () => editor.isActive( 'bold' ),
			action: () => editor.chain().focus().toggleBold().run(),
		},
		{
			label: 'Italic',
			icon: 'I',
			isActive: () => editor.isActive( 'italic' ),
			action: () => editor.chain().focus().toggleItalic().run(),
		},
		{
			label: 'Underline',
			icon: 'U',
			isActive: () => editor.isActive( 'underline' ),
			action: () => editor.chain().focus().toggleUnderline().run(),
		},
		{
			label: 'Insert Read More',
			icon: '— more —',
			isActive: () => false,
			action: () => editor.chain().focus().insertReadMore().run(),
		},
		{
			label: 'Insert image',
			icon: '🖼',
			isActive: () => false,
			action: () => editor.chain().focus().insertWPImage().run(),
		},
		{
			label: 'Undo',
			icon: '↩',
			isActive: () => false,
			action: () => editor.chain().focus().undo().run(),
		},
		{
			label: 'Redo',
			icon: '↪',
			isActive: () => false,
			action: () => editor.chain().focus().redo().run(),
		},
	];

	return createElement(
		'div',
		{
			className: 'tiptap-toolbar__group',
			role: 'toolbar',
			'aria-label': 'Editor toolbar',
		},
		buttons.map( ( btn ) =>
			createElement( ToolbarButton, {
				key: btn.label,
				label: btn.label,
				icon: btn.icon,
				isActive: btn.isActive(),
				isDisabled: false,
				onClick: btn.action,
			} )
		)
	);
}

export const Toolbar = {
	mount( container: HTMLElement, editor: Editor ): void {
		const el = createElement( ToolbarComponent, { editor } );
		render( el, container );

		// Re-render on selection change.
		editor.on( 'selectionUpdate', () => {
			render( createElement( ToolbarComponent, { editor } ), container );
		} );
		editor.on( 'transaction', () => {
			render( createElement( ToolbarComponent, { editor } ), container );
		} );
	},
};
