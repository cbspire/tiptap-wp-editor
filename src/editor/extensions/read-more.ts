/**
 * WPReadMore Extension.
 *
 * Represents the WordPress <!--more--> divider as a visual node in the editor.
 * - Rendered as a styled horizontal divider with a "Read more" label.
 * - Serialised back to <!--more--> in HTML output.
 * - Inserted via a toolbar button.
 * - At most one per document (enforced by the toolbar button state).
 */

import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		wpReadMore: {
			/** Insert the <!--more--> divider at the current position */
			insertReadMore: () => ReturnType;
		};
	}
}

export const WPReadMore = Node.create( {
	name: 'wpReadMore',

	// Block-level node — sits between paragraphs.
	group: 'block',
	atom: true,
	selectable: true,
	draggable: false,

	addAttributes() {
		return {
			// Optional custom text for <!--more Custom text-->
			text: {
				default: null,
				parseHTML: ( element ) => element.getAttribute( 'data-more-text' ) ?? null,
				renderHTML: ( attributes ) => {
					if ( ! attributes.text ) return {};
					return { 'data-more-text': attributes.text as string };
				},
			},
		};
	},

	parseHTML() {
		return [
			{
				tag: 'div[data-wp-read-more]',
			},
		];
	},

	renderHTML( { HTMLAttributes } ) {
		return [
			'div',
			mergeAttributes( HTMLAttributes, {
				'data-wp-read-more': '',
				class: 'tiptap-read-more',
				contenteditable: 'false',
			} ),
			[
				'span',
				{ class: 'tiptap-read-more__label' },
				'Read more',
			],
		];
	},

	addNodeView() {
		return ( { node } ) => {
			const dom = document.createElement( 'div' );
			dom.setAttribute( 'data-wp-read-more', '' );
			dom.className = 'tiptap-read-more';
			dom.contentEditable = 'false';

			const label = document.createElement( 'span' );
			label.className = 'tiptap-read-more__label';
			label.textContent = node.attrs.text as string || 'Read more';

			const line = document.createElement( 'hr' );
			line.className = 'tiptap-read-more__line';

			dom.appendChild( line );
			dom.appendChild( label );

			return { dom };
		};
	},

	addCommands() {
		return {
			insertReadMore:
				() =>
				( { commands } ) => {
					return commands.insertContent( {
						type: this.name,
					} );
				},
		};
	},
} );
