/**
 * SlashCommand Extension.
 *
 * Notion-style "/" command menu. Typing "/" opens a filterable palette
 * of block types and inserts (headings, lists, quote, code, image,
 * upload, read-more, shortcode, raw HTML). Built on @tiptap/suggestion
 * with a dependency-free DOM menu (no tippy/popper) positioned from the
 * caret rect, consistent with the rest of this codebase.
 */

import { Extension } from '@tiptap/core';
import type { Editor, Range } from '@tiptap/core';
import { Suggestion } from '@tiptap/suggestion';
import type {
	SuggestionProps,
	SuggestionKeyDownProps,
} from '@tiptap/suggestion';
import { canUploadFiles } from '../upload';

export interface SlashMenuItem {
	/** Visible name, e.g. "Heading 1" */
	title: string;
	/** Short description shown under the title */
	hint: string;
	/** Compact text icon rendered in the menu */
	icon: string;
	/** Extra match terms beyond the title, e.g. ["h1", "title"] */
	keywords: string[];
	/** Hide the item when this returns false (e.g. missing capability) */
	isAvailable?: () => boolean;
	command: ( props: { editor: Editor; range: Range } ) => void;
}

/**
 * All slash menu items, in display order.
 */
export function getSlashMenuItems(): SlashMenuItem[] {
	return [
		{
			title: 'Text',
			hint: 'Plain paragraph',
			icon: '¶',
			keywords: [ 'paragraph', 'plain', 'p' ],
			command: ( { editor, range } ) =>
				editor
					.chain()
					.focus()
					.deleteRange( range )
					.setParagraph()
					.run(),
		},
		{
			title: 'Heading 1',
			hint: 'Large section heading',
			icon: 'H1',
			keywords: [ 'h1', 'title', 'heading' ],
			command: ( { editor, range } ) =>
				editor
					.chain()
					.focus()
					.deleteRange( range )
					.setHeading( { level: 1 } )
					.run(),
		},
		{
			title: 'Heading 2',
			hint: 'Medium section heading',
			icon: 'H2',
			keywords: [ 'h2', 'subtitle', 'heading' ],
			command: ( { editor, range } ) =>
				editor
					.chain()
					.focus()
					.deleteRange( range )
					.setHeading( { level: 2 } )
					.run(),
		},
		{
			title: 'Heading 3',
			hint: 'Small section heading',
			icon: 'H3',
			keywords: [ 'h3', 'heading' ],
			command: ( { editor, range } ) =>
				editor
					.chain()
					.focus()
					.deleteRange( range )
					.setHeading( { level: 3 } )
					.run(),
		},
		{
			title: 'Bulleted list',
			hint: 'Simple bullet list',
			icon: '•',
			keywords: [ 'ul', 'unordered', 'list', 'bullet' ],
			command: ( { editor, range } ) =>
				editor
					.chain()
					.focus()
					.deleteRange( range )
					.toggleBulletList()
					.run(),
		},
		{
			title: 'Numbered list',
			hint: 'Ordered list with numbers',
			icon: '1.',
			keywords: [ 'ol', 'ordered', 'list', 'numbered' ],
			command: ( { editor, range } ) =>
				editor
					.chain()
					.focus()
					.deleteRange( range )
					.toggleOrderedList()
					.run(),
		},
		{
			title: 'Quote',
			hint: 'Blockquote for citations',
			icon: '"',
			keywords: [ 'blockquote', 'citation', 'quote' ],
			command: ( { editor, range } ) =>
				editor
					.chain()
					.focus()
					.deleteRange( range )
					.toggleBlockquote()
					.run(),
		},
		{
			title: 'Code block',
			hint: 'Preformatted code',
			icon: '</>',
			keywords: [ 'code', 'pre', 'snippet' ],
			command: ( { editor, range } ) =>
				editor
					.chain()
					.focus()
					.deleteRange( range )
					.toggleCodeBlock()
					.run(),
		},
		{
			title: 'Divider',
			hint: 'Horizontal rule',
			icon: '—',
			keywords: [ 'hr', 'rule', 'separator', 'divider', 'line' ],
			command: ( { editor, range } ) =>
				editor
					.chain()
					.focus()
					.deleteRange( range )
					.setHorizontalRule()
					.run(),
		},
		{
			title: 'Image',
			hint: 'Insert from the Media Library',
			icon: '🖼',
			keywords: [ 'image', 'photo', 'media', 'picture', 'gallery' ],
			command: ( { editor, range } ) =>
				editor
					.chain()
					.focus()
					.deleteRange( range )
					.insertWPImage()
					.run(),
		},
		{
			title: 'Upload image',
			hint: 'Upload from your device',
			icon: '⇪',
			keywords: [ 'upload', 'image', 'photo', 'file' ],
			isAvailable: () => canUploadFiles(),
			command: ( { editor, range } ) =>
				editor
					.chain()
					.focus()
					.deleteRange( range )
					.uploadWPImage()
					.run(),
		},
		{
			title: 'Read more',
			hint: 'WordPress <!--more--> divider',
			icon: '⋯',
			keywords: [ 'more', 'excerpt', 'read' ],
			command: ( { editor, range } ) =>
				editor
					.chain()
					.focus()
					.deleteRange( range )
					.insertReadMore()
					.run(),
		},
		{
			title: 'Shortcode',
			hint: 'WordPress shortcode chip',
			icon: '[/]',
			keywords: [ 'shortcode', 'embed' ],
			command: ( { editor, range } ) => {
				const shortcode = window.prompt( 'Shortcode:', '[gallery]' );
				if ( ! shortcode ) {
					return;
				}
				editor
					.chain()
					.focus()
					.deleteRange( range )
					.insertShortcode( { shortcode, index: -1 } )
					.run();
			},
		},
		{
			title: 'HTML',
			hint: 'Raw HTML block',
			icon: '<>',
			keywords: [ 'html', 'raw', 'embed', 'custom' ],
			command: ( { editor, range } ) => {
				const html = window.prompt( 'HTML:', '' );
				if ( ! html ) {
					return;
				}
				editor
					.chain()
					.focus()
					.deleteRange( range )
					.insertRawHTML( html )
					.run();
			},
		},
	];
}

/**
 * Filter items by the text typed after "/".
 *
 * Matches when every whitespace-separated term is found at a word start
 * of the title or in one of the keywords. An empty query returns all
 * available items.
 * @param items
 * @param query
 */
export function filterSlashItems(
	items: SlashMenuItem[],
	query: string
): SlashMenuItem[] {
	const available = items.filter(
		( item ) => item.isAvailable?.() !== false
	);
	const terms = query.toLowerCase().split( /\s+/ ).filter( Boolean );
	if ( terms.length === 0 ) {
		return available;
	}

	return available.filter( ( item ) => {
		const haystack = [ item.title.toLowerCase(), ...item.keywords ];
		return terms.every( ( term ) =>
			haystack.some( ( word ) => word.includes( term ) )
		);
	} );
}

/**
 * Plain-DOM dropdown for the slash menu. Fixed-position, viewport-clamped.
 */
class SlashMenuView {
	private el: HTMLDivElement;
	private items: SlashMenuItem[] = [];
	private selectedIndex = 0;
	private props: SuggestionProps< SlashMenuItem >;

	constructor( props: SuggestionProps< SlashMenuItem > ) {
		this.props = props;
		this.el = document.createElement( 'div' );
		this.el.className = 'tiptap-slash-menu';
		this.el.setAttribute( 'role', 'listbox' );
		this.el.setAttribute( 'aria-label', 'Insert block' );
		document.body.appendChild( this.el );
		this.update( props );
	}

	update( props: SuggestionProps< SlashMenuItem > ): void {
		this.props = props;
		this.items = props.items;
		this.selectedIndex = Math.min(
			this.selectedIndex,
			Math.max( 0, this.items.length - 1 )
		);
		this.renderItems();
		this.position();
	}

	onKeyDown( { event }: SuggestionKeyDownProps ): boolean {
		if ( event.key === 'ArrowDown' ) {
			this.selectedIndex =
				( this.selectedIndex + 1 ) % Math.max( 1, this.items.length );
			this.renderItems();
			return true;
		}
		if ( event.key === 'ArrowUp' ) {
			this.selectedIndex =
				( this.selectedIndex - 1 + this.items.length ) %
				Math.max( 1, this.items.length );
			this.renderItems();
			return true;
		}
		if ( event.key === 'Enter' ) {
			this.selectItem( this.selectedIndex );
			return true;
		}
		if ( event.key === 'Escape' ) {
			this.destroy();
			return true;
		}
		return false;
	}

	destroy(): void {
		this.el.remove();
	}

	private selectItem( index: number ): void {
		const item = this.items[ index ];
		if ( item ) {
			this.props.command( item );
		}
	}

	private renderItems(): void {
		this.el.innerHTML = '';

		if ( this.items.length === 0 ) {
			const empty = document.createElement( 'div' );
			empty.className = 'tiptap-slash-menu__empty';
			empty.textContent = 'No results';
			this.el.appendChild( empty );
			return;
		}

		this.items.forEach( ( item, index ) => {
			const button = document.createElement( 'button' );
			button.type = 'button';
			button.className = 'tiptap-slash-menu__item';
			button.setAttribute( 'role', 'option' );
			if ( index === this.selectedIndex ) {
				button.classList.add( 'is-selected' );
				button.setAttribute( 'aria-selected', 'true' );
			}

			const icon = document.createElement( 'span' );
			icon.className = 'tiptap-slash-menu__icon';
			icon.textContent = item.icon;

			const text = document.createElement( 'span' );
			text.className = 'tiptap-slash-menu__text';

			const title = document.createElement( 'span' );
			title.className = 'tiptap-slash-menu__title';
			title.textContent = item.title;

			const hint = document.createElement( 'span' );
			hint.className = 'tiptap-slash-menu__hint';
			hint.textContent = item.hint;

			text.appendChild( title );
			text.appendChild( hint );
			button.appendChild( icon );
			button.appendChild( text );

			// mousedown, not click — keeps focus in the editor.
			button.addEventListener( 'mousedown', ( event ) => {
				event.preventDefault();
				this.selectItem( index );
			} );
			button.addEventListener( 'mouseenter', () => {
				this.selectedIndex = index;
				this.renderItems();
			} );

			this.el.appendChild( button );
		} );

		const selected = this.el.children[ this.selectedIndex ] as
			| HTMLElement
			| undefined;
		selected?.scrollIntoView( { block: 'nearest' } );
	}

	private position(): void {
		const rect = this.props.clientRect?.();
		if ( ! rect ) {
			return;
		}

		const menuRect = this.el.getBoundingClientRect();
		const viewportHeight = window.innerHeight;
		const viewportWidth = window.innerWidth;

		let top = rect.bottom + 6;
		if (
			top + menuRect.height > viewportHeight &&
			rect.top - menuRect.height - 6 > 0
		) {
			top = rect.top - menuRect.height - 6;
		}

		const left = Math.max(
			8,
			Math.min( rect.left, viewportWidth - menuRect.width - 8 )
		);

		this.el.style.top = `${ top }px`;
		this.el.style.left = `${ left }px`;
	}
}

export const SlashCommand = Extension.create( {
	name: 'slashCommand',

	addProseMirrorPlugins() {
		return [
			Suggestion< SlashMenuItem >( {
				editor: this.editor,
				char: '/',
				startOfLine: false,
				allowSpaces: false,

				command: ( { editor, range, props } ) => {
					props.command( { editor, range } );
				},

				items: ( { query } ) =>
					filterSlashItems( getSlashMenuItems(), query ),

				render: () => {
					let menu: SlashMenuView | null = null;

					return {
						onStart: ( props ) => {
							menu = new SlashMenuView( props );
						},
						onUpdate: ( props ) => {
							menu?.update( props );
						},
						onKeyDown: ( props ) => {
							return menu?.onKeyDown( props ) ?? false;
						},
						onExit: () => {
							menu?.destroy();
							menu = null;
						},
					};
				},
			} ),
		];
	},
} );
