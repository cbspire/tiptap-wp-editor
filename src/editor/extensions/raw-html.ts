/**
 * WPRawHTML Extension.
 *
 * A passthrough node for arbitrary HTML blocks that TipTap cannot represent
 * in its document model (e.g., Gutenberg block comments, complex tables,
 * legacy shortcode output that was rendered to HTML).
 *
 * - Rendered as a styled "HTML" chip in the editor (not editable inline).
 * - The raw HTML is stored verbatim as a node attribute.
 * - Never sanitised — output is preserved exactly as input.
 * - Click to open a code editor overlay for direct HTML editing.
 */

import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		wpRawHtml: {
			/** Insert a raw HTML block at the current position */
			insertRawHTML: ( html: string ) => ReturnType;
		};
	}
}

export const WPRawHTML = Node.create( {
	name: 'wpRawHtml',

	group: 'block',
	atom: true,
	selectable: true,
	draggable: true,

	addAttributes() {
		return {
			html: {
				default: '',
				parseHTML: ( element ) => {
					// Decode the HTML from the data attribute.
					return decodeURIComponent( element.getAttribute( 'data-raw-html' ) ?? '' );
				},
				renderHTML: ( attributes ) => ( {
					'data-raw-html': encodeURIComponent( attributes.html as string ),
				} ),
			},
		};
	},

	parseHTML() {
		return [
			{
				tag: 'div[data-wp-raw-html]',
			},
		];
	},

	renderHTML( { HTMLAttributes } ) {
		return [
			'div',
			mergeAttributes( HTMLAttributes, {
				'data-wp-raw-html': '',
				class: 'tiptap-raw-html-chip',
				contenteditable: 'false',
			} ),
			[ 'span', { class: 'tiptap-raw-html-chip__icon' }, 'HTML' ],
			[ 'span', { class: 'tiptap-raw-html-chip__preview' }, getHtmlPreview( HTMLAttributes['data-raw-html'] as string ) ],
		];
	},

	addNodeView() {
		return ( { node, editor, getPos } ) => {
			const dom = document.createElement( 'div' );
			dom.setAttribute( 'data-wp-raw-html', '' );
			dom.className = 'tiptap-raw-html-chip';
			dom.contentEditable = 'false';

			const icon = document.createElement( 'span' );
			icon.className = 'tiptap-raw-html-chip__icon';
			icon.textContent = 'HTML';

			const preview = document.createElement( 'span' );
			preview.className = 'tiptap-raw-html-chip__preview';
			preview.textContent = getHtmlPreview( node.attrs.html as string );

			dom.appendChild( icon );
			dom.appendChild( preview );

			// Click to open HTML editor.
			dom.addEventListener( 'dblclick', () => {
				if ( ! editor.isEditable ) return;
				const pos = typeof getPos === 'function' ? getPos() : null;
				if ( pos === null ) return;
				openHtmlEditor( dom, node.attrs.html as string, ( updated ) => {
					editor
						.chain()
						.focus()
						.command( ( { tr } ) => {
							tr.setNodeMarkup( pos, undefined, {
								...node.attrs,
								html: updated,
							} );
							return true;
						} )
						.run();
					preview.textContent = getHtmlPreview( updated );
				} );
			} );

			return { dom };
		};
	},

	addCommands() {
		return {
			insertRawHTML:
				( html ) =>
				( { commands } ) => {
					return commands.insertContent( {
						type: this.name,
						attrs: { html },
					} );
				},
		};
	},
} );

/**
 * Extract a short text preview from raw HTML for display in the chip.
 */
function getHtmlPreview( encoded: string ): string {
	const html = decodeURIComponent( encoded );
	// Strip tags and collapse whitespace.
	const text = html.replace( /<[^>]*>/g, ' ' ).replace( /\s+/g, ' ' ).trim();
	return text.length > 40 ? text.slice( 0, 40 ) + '…' : text || '(empty)';
}

/**
 * Open a textarea overlay for editing raw HTML.
 */
function openHtmlEditor(
	anchor: HTMLElement,
	current: string,
	onSave: ( updated: string ) => void,
): void {
	document.getElementById( 'tiptap-raw-html-editor' )?.remove();

	const overlay = document.createElement( 'div' );
	overlay.id = 'tiptap-raw-html-editor';
	overlay.className = 'tiptap-raw-html-editor';

	const textarea = document.createElement( 'textarea' );
	textarea.value = current;
	textarea.className = 'tiptap-raw-html-editor__textarea code';
	textarea.rows = 8;
	textarea.setAttribute( 'aria-label', 'Edit raw HTML' );

	const actions = document.createElement( 'div' );
	actions.className = 'tiptap-raw-html-editor__actions';

	const saveBtn = document.createElement( 'button' );
	saveBtn.type = 'button';
	saveBtn.textContent = 'Save';
	saveBtn.className = 'button button-primary';

	const cancelBtn = document.createElement( 'button' );
	cancelBtn.type = 'button';
	cancelBtn.textContent = 'Cancel';
	cancelBtn.className = 'button';

	actions.appendChild( saveBtn );
	actions.appendChild( cancelBtn );
	overlay.appendChild( textarea );
	overlay.appendChild( actions );

	const rect = anchor.getBoundingClientRect();
	overlay.style.cssText = `
		position: fixed;
		top: ${ rect.bottom + 4 }px;
		left: ${ rect.left }px;
		z-index: 9999;
		min-width: 400px;
		background: #fff;
		border: 1px solid #c3c4c7;
		border-radius: 4px;
		padding: 12px;
		box-shadow: 0 4px 12px rgba(0,0,0,.15);
	`;

	document.body.appendChild( overlay );
	textarea.focus();

	const close = (): void => overlay.remove();

	saveBtn.addEventListener( 'click', () => {
		onSave( textarea.value );
		close();
	} );

	cancelBtn.addEventListener( 'click', close );

	textarea.addEventListener( 'keydown', ( e ) => {
		if ( e.key === 'Escape' ) close();
	} );

	const outsideClick = ( e: MouseEvent ): void => {
		if ( ! overlay.contains( e.target as Node ) ) {
			close();
			document.removeEventListener( 'mousedown', outsideClick );
		}
	};
	setTimeout( () => document.addEventListener( 'mousedown', outsideClick ), 0 );
}
