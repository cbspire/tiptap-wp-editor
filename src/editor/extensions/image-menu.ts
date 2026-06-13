/**
 * WPImageMenu Extension.
 *
 * Floating options bar that appears when an image is selected:
 * alignment (WP-native alignleft/aligncenter/alignright classes),
 * width presets (25/50/75/100% via inline style), rounded corners,
 * alt text editing, replace via Media Library, and remove.
 *
 * Plain-DOM, fixed-position — same approach as the slash menu.
 */

import { Extension } from '@tiptap/core';
import type { Editor } from '@tiptap/core';
import { NodeSelection, Plugin, PluginKey } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
import { openMediaLibrary } from './wp-image';

interface ImageMenuButton {
	label: string;
	icon: string;
	isActive: ( attrs: Record< string, unknown > ) => boolean;
	onClick: ( editor: Editor, attrs: Record< string, unknown > ) => void;
}

const BUTTONS: ImageMenuButton[] = [
	{
		label: 'Align left',
		icon: '⬅',
		isActive: ( attrs ) => attrs.align === 'left',
		onClick: ( editor, attrs ) =>
			editor
				.chain()
				.focus()
				.updateAttributes( 'wpImage', {
					align: attrs.align === 'left' ? null : 'left',
				} )
				.run(),
	},
	{
		label: 'Align center',
		icon: '⏺',
		isActive: ( attrs ) => attrs.align === 'center',
		onClick: ( editor, attrs ) =>
			editor
				.chain()
				.focus()
				.updateAttributes( 'wpImage', {
					align: attrs.align === 'center' ? null : 'center',
				} )
				.run(),
	},
	{
		label: 'Align right',
		icon: '➡',
		isActive: ( attrs ) => attrs.align === 'right',
		onClick: ( editor, attrs ) =>
			editor
				.chain()
				.focus()
				.updateAttributes( 'wpImage', {
					align: attrs.align === 'right' ? null : 'right',
				} )
				.run(),
	},
	...[ 25, 50, 75, 100 ].map( ( pct ): ImageMenuButton => {
		return {
			label: `Width ${ pct }%`,
			icon: `${ pct }`,
			isActive: ( attrs ) => attrs.widthPct === pct,
			onClick: ( editor, attrs ) =>
				editor
					.chain()
					.focus()
					.updateAttributes( 'wpImage', {
						widthPct: attrs.widthPct === pct ? null : pct,
					} )
					.run(),
		};
	} ),
	{
		label: 'Rounded corners',
		icon: '◠',
		isActive: ( attrs ) => attrs.rounded === true,
		onClick: ( editor, attrs ) =>
			editor
				.chain()
				.focus()
				.updateAttributes( 'wpImage', { rounded: ! attrs.rounded } )
				.run(),
	},
	{
		label: 'Edit alt text',
		icon: 'Alt',
		isActive: ( attrs ) => Boolean( attrs.alt ),
		onClick: ( editor, attrs ) => {
			const alt = window.prompt(
				'Alt text:',
				( attrs.alt as string ) ?? ''
			);
			if ( alt === null ) {
				return;
			}
			editor
				.chain()
				.focus()
				.updateAttributes( 'wpImage', { alt } )
				.run();
		},
	},
	{
		label: 'Replace image',
		icon: '⇄',
		isActive: () => false,
		onClick: ( editor ) => {
			openMediaLibrary( ( image ) => {
				editor
					.chain()
					.focus()
					.updateAttributes( 'wpImage', {
						src: image.url,
						alt: image.alt,
						attachmentId: image.id,
						class: `wp-image-${ image.id }`,
					} )
					.run();
			} );
		},
	},
	{
		label: 'Remove image',
		icon: '🗑',
		isActive: () => false,
		onClick: ( editor ) =>
			editor.chain().focus().deleteSelection().run(),
	},
];

class ImageMenuView {
	private view: EditorView;
	private editor: Editor;
	private el: HTMLDivElement;

	constructor( view: EditorView, editor: Editor ) {
		this.view = view;
		this.editor = editor;

		this.el = document.createElement( 'div' );
		this.el.className = 'tiptap-image-menu';
		this.el.setAttribute( 'role', 'toolbar' );
		this.el.setAttribute( 'aria-label', 'Image options' );
		this.el.style.display = 'none';
		document.body.appendChild( this.el );
	}

	update( view: EditorView ): void {
		const { selection } = view.state;

		if (
			! ( selection instanceof NodeSelection ) ||
			selection.node.type.name !== 'wpImage' ||
			! this.editor.isEditable
		) {
			this.el.style.display = 'none';
			return;
		}

		this.render( selection.node.attrs );
		this.position( selection.from );
	}

	destroy(): void {
		this.el.remove();
	}

	private render( attrs: Record< string, unknown > ): void {
		this.el.innerHTML = '';

		for ( const button of BUTTONS ) {
			const btn = document.createElement( 'button' );
			btn.type = 'button';
			btn.className = 'tiptap-image-menu__button';
			if ( button.isActive( attrs ) ) {
				btn.classList.add( 'is-active' );
			}
			btn.title = button.label;
			btn.setAttribute( 'aria-label', button.label );
			btn.textContent = button.icon;
			// mousedown + preventDefault keeps the node selection alive.
			btn.addEventListener( 'mousedown', ( event ) => {
				event.preventDefault();
				button.onClick( this.editor, attrs );
			} );
			this.el.appendChild( btn );
		}
	}

	private position( pos: number ): void {
		const dom = this.view.nodeDOM( pos );
		if ( ! ( dom instanceof HTMLElement ) ) {
			this.el.style.display = 'none';
			return;
		}

		this.el.style.display = 'flex';
		const rect = dom.getBoundingClientRect();
		const menuRect = this.el.getBoundingClientRect();

		let top = rect.top - menuRect.height - 8;
		if ( top < 8 ) {
			top = rect.bottom + 8;
		}
		const left = Math.max(
			8,
			Math.min(
				rect.left + rect.width / 2 - menuRect.width / 2,
				window.innerWidth - menuRect.width - 8
			)
		);

		this.el.style.top = `${ top }px`;
		this.el.style.left = `${ left }px`;
	}
}

export const WPImageMenu = Extension.create( {
	name: 'wpImageMenu',

	addProseMirrorPlugins() {
		const editor = this.editor;

		return [
			new Plugin( {
				key: new PluginKey( 'wpImageMenu' ),
				view: ( view ) => {
					const menu = new ImageMenuView( view, editor );
					return {
						update: ( v ) => menu.update( v ),
						destroy: () => menu.destroy(),
					};
				},
			} ),
		];
	},
} );
