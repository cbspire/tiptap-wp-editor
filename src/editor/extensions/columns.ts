/**
 * WPColumns / WPColumn Extensions.
 *
 * Responsive multi-column layout blocks (2 or 3 columns), inserted via
 * the slash menu. Serialised as plain divs with minimal `tt-` classes:
 *
 *   <div class="tt-columns tt-columns--2">
 *     <div class="tt-column">…blocks…</div>
 *     <div class="tt-column">…blocks…</div>
 *   </div>
 *
 * The front end is styled by assets/css/frontend.css (a `@layer base`
 * stylesheet), which lays the columns out with CSS grid and collapses
 * them to a single column on narrow screens.
 */

import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
	interface Commands< ReturnType > {
		wpColumns: {
			/** Insert a multi-column layout block with `count` empty columns */
			insertColumns: ( count: number ) => ReturnType;
		};
	}
}

export const WPColumn = Node.create( {
	name: 'wpColumn',

	group: 'wpColumn',
	content: 'block+',
	isolating: true,

	parseHTML() {
		return [ { tag: 'div.tt-column' } ];
	},

	renderHTML( { HTMLAttributes } ) {
		return [
			'div',
			mergeAttributes( HTMLAttributes, { class: 'tt-column' } ),
			0,
		];
	},
} );

export const WPColumns = Node.create( {
	name: 'wpColumns',

	group: 'block',
	content: 'wpColumn{2,3}',
	isolating: true,

	addAttributes() {
		return {
			count: {
				default: 2,
				parseHTML: ( element ) => {
					const match = ( element.getAttribute( 'class' ) ?? '' ).match(
						/\btt-columns--(\d)\b/
					);
					const count = match ? parseInt( match[ 1 ], 10 ) : 2;
					return count === 3 ? 3 : 2;
				},
				// Rendered as a class modifier (see renderHTML) — no attribute.
				renderHTML: () => ( {} ),
			},
		};
	},

	parseHTML() {
		return [ { tag: 'div.tt-columns' } ];
	},

	renderHTML( { node, HTMLAttributes } ) {
		const count = node.attrs.count === 3 ? 3 : 2;
		return [
			'div',
			mergeAttributes( HTMLAttributes, {
				class: `tt-columns tt-columns--${ count }`,
			} ),
			0,
		];
	},

	addCommands() {
		return {
			insertColumns:
				( count ) =>
				( { commands } ) => {
					const columns = Array.from( { length: count }, () => ( {
						type: WPColumn.name,
						content: [ { type: 'paragraph' } ],
					} ) );

					return commands.insertContent( {
						type: this.name,
						attrs: { count },
						content: columns,
					} );
				},
		};
	},
} );
