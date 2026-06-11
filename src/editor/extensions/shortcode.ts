/**
 * WPShortcode Extension.
 *
 * Renders WordPress shortcodes as atomic, non-editable chips in the editor.
 * - Double-click opens an inline edit popover.
 * - The shortcode string is preserved verbatim in HTML output.
 * - In the document model, shortcodes appear as HTML comments:
 *     <!--tiptap-sc-{index}-->
 *   which the PHP converter maps back to the original shortcode string on save.
 *
 * @see class-content-converter.php for the PHP side of shortcode handling.
 */

import { Node, mergeAttributes } from '@tiptap/core';

export interface WPShortcodeAttrs {
	/** Original shortcode string, e.g. [gallery ids="1,2,3"] */
	shortcode: string;
	/** Index within the shortcode map for this document load */
	index: number;
}

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		wpShortcode: {
			/** Insert a shortcode node at the current selection */
			insertShortcode: ( attrs: WPShortcodeAttrs ) => ReturnType;
		};
	}
}

export const WPShortcode = Node.create( {
	name: 'wpShortcode',

	// Shortcodes are inline atoms — they sit inside paragraphs.
	group: 'inline',
	inline: true,
	atom: true,
	selectable: true,
	draggable: true,

	addAttributes() {
		return {
			shortcode: {
				default: '',
				parseHTML: ( element ) => element.getAttribute( 'data-shortcode' ) ?? '',
				renderHTML: ( attributes ) => ( {
					'data-shortcode': attributes.shortcode as string,
				} ),
			},
			index: {
				default: 0,
				parseHTML: ( element ) => parseInt( element.getAttribute( 'data-sc-index' ) ?? '0', 10 ),
				renderHTML: ( attributes ) => ( {
					'data-sc-index': String( attributes.index ),
				} ),
			},
		};
	},

	parseHTML() {
		return [
			{
				tag: 'span[data-tiptap-shortcode]',
			},
		];
	},

	renderHTML( { HTMLAttributes } ) {
		return [
			'span',
			mergeAttributes( HTMLAttributes, {
				'data-tiptap-shortcode': '',
				class: 'tiptap-shortcode-chip',
				contenteditable: 'false',
			} ),
			// Display a truncated version of the shortcode inside the chip.
			[
				'span',
				{ class: 'tiptap-shortcode-chip__label' },
				truncateShortcodeLabel( HTMLAttributes['data-shortcode'] as string ),
			],
		];
	},

	addNodeView() {
		return ( { node, editor, getPos } ) => {
			const dom = document.createElement( 'span' );
			dom.setAttribute( 'data-tiptap-shortcode', '' );
			dom.setAttribute( 'data-shortcode', node.attrs.shortcode as string );
			dom.setAttribute( 'data-sc-index', String( node.attrs.index ) );
			dom.className = 'tiptap-shortcode-chip';
			dom.contentEditable = 'false';

			const label = document.createElement( 'span' );
			label.className = 'tiptap-shortcode-chip__label';
			label.textContent = truncateShortcodeLabel( node.attrs.shortcode as string );
			dom.appendChild( label );

			// Double-click: open edit popover.
			dom.addEventListener( 'dblclick', () => {
				if ( ! editor.isEditable ) return;
				const pos = typeof getPos === 'function' ? getPos() : null;
				if ( pos === null ) return;
				openShortcodePopover( dom, node.attrs.shortcode as string, ( updated ) => {
					editor
						.chain()
						.focus()
						.command( ( { tr } ) => {
							tr.setNodeMarkup( pos, undefined, {
								...node.attrs,
								shortcode: updated,
							} );
							return true;
						} )
						.run();
				} );
			} );

			return { dom };
		};
	},

	addCommands() {
		return {
			insertShortcode:
				( attrs ) =>
				( { commands } ) => {
					return commands.insertContent( {
						type: this.name,
						attrs,
					} );
				},
		};
	},

	// Serialise as an HTML comment token that PHP can map back to the shortcode.
	// Format: <!--tiptap-sc-{index}-->
	// This is what gets stored in post_content and restored on the next load.
	addStorage() {
		return {};
	},
} );

/**
 * Produce a readable label for the chip (the tag name only).
 * e.g. "[gallery ids="1,2,3"]" → "[gallery]"
 */
function truncateShortcodeLabel( shortcode: string ): string {
	if ( ! shortcode ) return '[?]';
	const match = shortcode.match( /^\[(\w[\w-]*)/);
	return match ? `[${ match[ 1 ] }]` : shortcode.slice( 0, 20 );
}

/**
 * Open a simple inline popover to edit a shortcode string.
 *
 * In Phase 1 this is a basic <input> overlay. A full popover component
 * using @wordpress/components Popover will replace this in Phase 2.
 */
function openShortcodePopover(
	anchor: HTMLElement,
	current: string,
	onSave: ( updated: string ) => void,
): void {
	// Remove any existing popover.
	document.getElementById( 'tiptap-shortcode-popover' )?.remove();

	const overlay = document.createElement( 'div' );
	overlay.id = 'tiptap-shortcode-popover';
	overlay.className = 'tiptap-shortcode-popover';

	const input = document.createElement( 'input' );
	input.type = 'text';
	input.value = current;
	input.className = 'tiptap-shortcode-popover__input';
	input.setAttribute( 'aria-label', 'Edit shortcode' );

	const saveBtn = document.createElement( 'button' );
	saveBtn.type = 'button';
	saveBtn.textContent = 'Save';
	saveBtn.className = 'button button-primary tiptap-shortcode-popover__save';

	const cancelBtn = document.createElement( 'button' );
	cancelBtn.type = 'button';
	cancelBtn.textContent = 'Cancel';
	cancelBtn.className = 'button tiptap-shortcode-popover__cancel';

	overlay.appendChild( input );
	overlay.appendChild( saveBtn );
	overlay.appendChild( cancelBtn );

	// Position near the anchor chip.
	const rect = anchor.getBoundingClientRect();
	overlay.style.position = 'fixed';
	overlay.style.top = `${ rect.bottom + 4 }px`;
	overlay.style.left = `${ rect.left }px`;
	overlay.style.zIndex = '9999';

	document.body.appendChild( overlay );
	input.focus();
	input.select();

	const close = (): void => overlay.remove();

	saveBtn.addEventListener( 'click', () => {
		const updated = input.value.trim();
		if ( updated ) onSave( updated );
		close();
	} );

	cancelBtn.addEventListener( 'click', close );

	input.addEventListener( 'keydown', ( e ) => {
		if ( e.key === 'Enter' ) saveBtn.click();
		if ( e.key === 'Escape' ) close();
	} );

	// Close on outside click.
	const outsideClick = ( e: MouseEvent ): void => {
		if ( ! overlay.contains( e.target as Node ) ) {
			close();
			document.removeEventListener( 'mousedown', outsideClick );
		}
	};
	setTimeout( () => document.addEventListener( 'mousedown', outsideClick ), 0 );
}
