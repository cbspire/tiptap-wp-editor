/**
 * WPButton Extension.
 *
 * A call-to-action button block: a link styled as a button. Serialised
 * as a plain anchor with minimal `tt-` classes so it degrades gracefully
 * even without CSS:
 *
 *   <div class="tt-button-wrap">
 *     <a class="tt-button tt-button--fill" href="…">Label</a>
 *   </div>
 *
 * Styled in the editor and on the front end via plugin CSS
 * (assets/css/frontend.css, a `@layer base` stylesheet). Double-click the
 * button in the editor to edit its label, URL and style (fill/outline) in
 * an inline popover.
 */

import { Node, mergeAttributes } from '@tiptap/core';

export interface WPButtonAttrs {
	text: string;
	href: string;
	variant: 'fill' | 'outline';
}

declare module '@tiptap/core' {
	interface Commands< ReturnType > {
		wpButton: {
			/** Insert a button block at the current position */
			insertWPButton: ( attrs?: Partial< WPButtonAttrs > ) => ReturnType;
		};
	}
}

export const WPButton = Node.create( {
	name: 'wpButton',

	group: 'block',
	atom: true,
	selectable: true,
	draggable: true,

	addAttributes() {
		return {
			text: {
				default: 'Click here',
				parseHTML: ( element ) =>
					element.querySelector( 'a' )?.textContent ?? 'Click here',
				renderHTML: () => ( {} ),
			},
			href: {
				default: '',
				parseHTML: ( element ) =>
					element.querySelector( 'a' )?.getAttribute( 'href' ) ?? '',
				renderHTML: () => ( {} ),
			},
			variant: {
				default: 'fill',
				parseHTML: ( element ) =>
					element
						.querySelector( 'a' )
						?.classList.contains( 'tt-button--outline' )
						? 'outline'
						: 'fill',
				renderHTML: () => ( {} ),
			},
		};
	},

	parseHTML() {
		return [ { tag: 'div.tt-button-wrap' } ];
	},

	renderHTML( { node, HTMLAttributes } ) {
		return [
			'div',
			mergeAttributes( HTMLAttributes, {
				class: 'tt-button-wrap',
			} ),
			[
				'a',
				{
					class: `tt-button tt-button--${ node.attrs.variant as string }`,
					href: node.attrs.href as string,
				},
				node.attrs.text as string,
			],
		];
	},

	addNodeView() {
		return ( { node, editor, getPos } ) => {
			const dom = document.createElement( 'div' );
			dom.className = 'tt-button-wrap';
			dom.contentEditable = 'false';

			const anchor = document.createElement( 'a' );
			const applyAttrs = ( attrs: Record< string, unknown > ): void => {
				anchor.className = `tt-button tt-button--${ attrs.variant as string }`;
				anchor.setAttribute( 'href', attrs.href as string );
				anchor.textContent = attrs.text as string;
			};
			applyAttrs( node.attrs );

			// Inside the editor the button must not navigate.
			anchor.addEventListener( 'click', ( event ) =>
				event.preventDefault()
			);
			dom.appendChild( anchor );

			dom.addEventListener( 'dblclick', () => {
				if ( ! editor.isEditable ) {
					return;
				}
				const pos = typeof getPos === 'function' ? getPos() : null;
				if ( pos === null ) {
					return;
				}
				openButtonPopover( dom, node.attrs as unknown as WPButtonAttrs, ( updated ) => {
					editor
						.chain()
						.focus()
						.command( ( { tr } ) => {
							tr.setNodeMarkup( pos, undefined, {
								...node.attrs,
								...updated,
							} );
							return true;
						} )
						.run();
					applyAttrs( { ...node.attrs, ...updated } );
				} );
			} );

			return {
				dom,
				update: ( updatedNode ) => {
					if ( updatedNode.type.name !== this.name ) {
						return false;
					}
					applyAttrs( updatedNode.attrs );
					return true;
				},
			};
		};
	},

	addCommands() {
		return {
			insertWPButton:
				( attrs = {} ) =>
				( { commands } ) => {
					return commands.insertContent( {
						type: this.name,
						attrs,
					} );
				},
		};
	},
} );

/**
 * Inline popover for editing the button label, URL and style.
 * @param target   Element to anchor the popover to.
 * @param current  Current button attributes.
 * @param onSave   Called with the updated attributes.
 */
function openButtonPopover(
	target: HTMLElement,
	current: WPButtonAttrs,
	onSave: ( attrs: WPButtonAttrs ) => void
): void {
	// Only one popover at a time.
	document.querySelector( '.tiptap-button-popover' )?.remove();

	const popover = document.createElement( 'div' );
	popover.className = 'tiptap-button-popover';

	const textInput = document.createElement( 'input' );
	textInput.type = 'text';
	textInput.placeholder = 'Label';
	textInput.value = current.text;
	textInput.className = 'tiptap-button-popover__input';

	const hrefInput = document.createElement( 'input' );
	hrefInput.type = 'url';
	hrefInput.placeholder = 'https://…';
	hrefInput.value = current.href;
	hrefInput.className = 'tiptap-button-popover__input';

	const variantSelect = document.createElement( 'select' );
	variantSelect.className = 'tiptap-button-popover__select';
	for ( const variant of [ 'fill', 'outline' ] ) {
		const option = document.createElement( 'option' );
		option.value = variant;
		option.textContent = variant === 'fill' ? 'Filled' : 'Outline';
		option.selected = current.variant === variant;
		variantSelect.appendChild( option );
	}

	const saveButton = document.createElement( 'button' );
	saveButton.type = 'button';
	saveButton.textContent = 'Save';
	saveButton.className = 'button button-primary tiptap-button-popover__save';

	const close = (): void => popover.remove();

	const save = (): void => {
		onSave( {
			text: textInput.value.trim() || 'Click here',
			href: hrefInput.value.trim(),
			variant: variantSelect.value === 'outline' ? 'outline' : 'fill',
		} );
		close();
	};

	saveButton.addEventListener( 'click', save );
	popover.addEventListener( 'keydown', ( event ) => {
		if ( event.key === 'Enter' ) {
			event.preventDefault();
			save();
		}
		if ( event.key === 'Escape' ) {
			close();
		}
	} );

	popover.appendChild( textInput );
	popover.appendChild( hrefInput );
	popover.appendChild( variantSelect );
	popover.appendChild( saveButton );

	const rect = target.getBoundingClientRect();
	popover.style.position = 'fixed';
	popover.style.top = `${ rect.bottom + 6 }px`;
	popover.style.left = `${ Math.max( 8, rect.left ) }px`;
	popover.style.zIndex = '100000';

	document.body.appendChild( popover );
	textInput.focus();
	textInput.select();
}
