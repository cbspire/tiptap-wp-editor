/**
 * Main Toolbar Component.
 *
 * Renders formatting buttons for the TipTap editor. Uses @wordpress/element
 * (externalised React) so it works on WP 6.8+ without bundling React.
 *
 * The toolbar is the same HTML structure on all WP versions.
 * Visual styling is controlled by CSS: editor-legacy.css or editor-modern.css.
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

function ToolbarButton( { label, icon, isActive, isDisabled, onClick }: ToolbarButtonProps ) {
	return createElement(
		'button',
		{
			type: 'button',
			title: label,
			'aria-label': label,
			'aria-pressed': isActive,
			disabled: isDisabled,
			className: `tiptap-toolbar__button${ isActive ? ' is-active' : '' }`,
			onClick,
		},
		icon,
	);
}

interface ToolbarProps {
	editor: Editor;
}

function ToolbarComponent( { editor }: ToolbarProps ) {
	// Re-render on every selection change.
	const [ , forceUpdate ] = ( () => {
		let state = 0;
		return [
			state,
			() => {
				// In React 18+: use useReducer. For now trigger via editor event.
			},
		];
	} )();

	const buttons: Array<{
		label: string;
		icon: string;
		isActive: () => boolean;
		action: () => void;
	}> = [
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
			label: 'Strikethrough',
			icon: 'S̶',
			isActive: () => editor.isActive( 'strike' ),
			action: () => editor.chain().focus().toggleStrike().run(),
		},
		{
			label: 'Link',
			icon: '🔗',
			isActive: () => editor.isActive( 'link' ),
			action: () => {
				const url = window.prompt( 'URL:' );
				if ( url ) {
					editor.chain().focus().setLink( { href: url } ).run();
				}
			},
		},
		{
			label: 'Unlink',
			icon: '⛓️',
			isActive: () => false,
			action: () => editor.chain().focus().unsetLink().run(),
		},
		{
			label: 'Heading 2',
			icon: 'H2',
			isActive: () => editor.isActive( 'heading', { level: 2 } ),
			action: () => editor.chain().focus().toggleHeading( { level: 2 } ).run(),
		},
		{
			label: 'Heading 3',
			icon: 'H3',
			isActive: () => editor.isActive( 'heading', { level: 3 } ),
			action: () => editor.chain().focus().toggleHeading( { level: 3 } ).run(),
		},
		{
			label: 'Bulleted list',
			icon: '• —',
			isActive: () => editor.isActive( 'bulletList' ),
			action: () => editor.chain().focus().toggleBulletList().run(),
		},
		{
			label: 'Numbered list',
			icon: '1 —',
			isActive: () => editor.isActive( 'orderedList' ),
			action: () => editor.chain().focus().toggleOrderedList().run(),
		},
		{
			label: 'Blockquote',
			icon: '"',
			isActive: () => editor.isActive( 'blockquote' ),
			action: () => editor.chain().focus().toggleBlockquote().run(),
		},
		{
			label: 'Code block',
			icon: '</>',
			isActive: () => editor.isActive( 'codeBlock' ),
			action: () => editor.chain().focus().toggleCodeBlock().run(),
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
		{ className: 'tiptap-toolbar', role: 'toolbar', 'aria-label': 'Editor toolbar' },
		buttons.map( ( btn ) =>
			createElement( ToolbarButton, {
				key: btn.label,
				label: btn.label,
				icon: btn.icon,
				isActive: btn.isActive(),
				isDisabled: false,
				onClick: btn.action,
			} ),
		),
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
