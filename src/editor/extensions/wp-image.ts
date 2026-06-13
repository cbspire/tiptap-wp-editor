/**
 * WPImage Extension.
 *
 * Connects to the WordPress Media Library for image insertion.
 * - Opens the WP media modal on toolbar click or empty image placeholder click.
 * - Stores the attachment ID alongside src/alt/class attributes.
 * - Outputs standard <img> with WP attachment classes so existing CSS applies.
 *
 * Extends the built-in @tiptap/extension-image with WordPress-specific
 * attributes and media library integration.
 */

import { Image } from '@tiptap/extension-image';
import { mergeAttributes } from '@tiptap/core';

declare global {
	interface Window {
		wp?: {
			media?: ( options: Record< string, unknown > ) => {
				open: () => void;
				on: ( event: string, callback: () => void ) => void;
				state: () => {
					get: ( key: string ) => {
						first: () => {
							toJSON: () => {
								id: number;
								url: string;
								alt: string;
								width: number;
								height: number;
							};
						};
					};
				};
			};
		};
	}
}

declare module '@tiptap/core' {
	interface Commands< ReturnType > {
		wpImage: {
			/** Open the WP Media Library and insert the selected image */
			insertWPImage: () => ReturnType;
		};
	}
}

export const WPImage = Image.extend( {
	name: 'wpImage',

	addOptions() {
		return {
			...this.parent?.(),
			// Accept data: URIs so pasted/embedded base64 images survive
			// (the base extension drops them by default). Media Library
			// images remain plain http(s) URLs.
			allowBase64: true,
		};
	},

	addAttributes() {
		return {
			...this.parent?.(),
			// WP attachment ID — stored to enable alt text generation via AI.
			attachmentId: {
				default: null,
				parseHTML: ( element ) => {
					const id = element.getAttribute( 'data-attachment-id' );
					return id ? parseInt( id, 10 ) : null;
				},
				renderHTML: ( attributes ) => {
					if ( ! attributes.attachmentId ) {
						return {};
					}
					return {
						'data-attachment-id': String( attributes.attachmentId ),
					};
				},
			},
			// Transient marker used while a dropped/pasted file is uploading.
			// Never parsed from or rendered to HTML — editor state only.
			uploadId: {
				default: null,
				parseHTML: () => null,
				renderHTML: () => ( {} ),
			},
			// Extra classes carried verbatim (e.g. wp-image-42, size-large).
			// The plugin's own tt-image* and WP align* classes live in their
			// own attributes below and are stripped here to avoid duplication.
			class: {
				default: null,
				parseHTML: ( element ) => {
					const cls = ( element.getAttribute( 'class' ) ?? '' )
						.split( /\s+/ )
						.filter(
							( c ) =>
								c &&
								c !== 'tt-image' &&
								! /^tt-image--/.test( c ) &&
								! /^align(left|center|right|none)$/.test( c )
						)
						.join( ' ' );
					return cls || null;
				},
				renderHTML: ( attributes ) => {
					if ( ! attributes.class ) {
						return {};
					}
					return { class: attributes.class as string };
				},
			},
			// WP-native alignment class (alignleft/aligncenter/alignright) —
			// themes style these out of the box.
			align: {
				default: null,
				parseHTML: ( element ) => {
					const match = ( element.getAttribute( 'class' ) ?? '' ).match(
						/\balign(left|center|right)\b/
					);
					return match ? match[ 1 ] : null;
				},
				renderHTML: ( attributes ) => {
					if ( ! attributes.align ) {
						return {};
					}
					return { class: `align${ attributes.align as string }` };
				},
			},
			// Width as a percentage of the content column, rendered as a
			// tt-image--w{25|50|75|100} modifier class (styled in frontend.css).
			widthPct: {
				default: null,
				parseHTML: ( element ) => {
					const match = ( element.getAttribute( 'class' ) ?? '' ).match(
						/\btt-image--w(\d+)\b/
					);
					return match ? parseInt( match[ 1 ], 10 ) : null;
				},
				renderHTML: ( attributes ) => {
					if ( ! attributes.widthPct ) {
						return {};
					}
					return { class: `tt-image--w${ attributes.widthPct as number }` };
				},
			},
			// Rounded corners (styled via plugin CSS in editor + front end).
			rounded: {
				default: false,
				parseHTML: ( element ) =>
					( element.getAttribute( 'class' ) ?? '' )
						.split( /\s+/ )
						.includes( 'tt-image--rounded' ),
				renderHTML: ( attributes ) => {
					if ( ! attributes.rounded ) {
						return {};
					}
					return { class: 'tt-image--rounded' };
				},
			},
		};
	},

	renderHTML( { HTMLAttributes } ) {
		// `tt-image` is the base class on every image; per-attribute
		// renderHTML adds tt-image--* / align* / wp-image-* fragments,
		// which mergeAttributes concatenates into one class list.
		return [
			'img',
			mergeAttributes( this.options.HTMLAttributes, HTMLAttributes, {
				class: 'tt-image',
			} ),
		];
	},

	addCommands() {
		return {
			...this.parent?.(),
			insertWPImage:
				() =>
				( { commands } ) => {
					openMediaLibrary( ( imageData ) => {
						commands.insertContent( {
							type: this.name,
							attrs: {
								src: imageData.url,
								alt: imageData.alt,
								attachmentId: imageData.id,
								class: `wp-image-${ imageData.id }`,
							},
						} );
					} );
					return true;
				},
		};
	},
} );

/**
 * Open the WordPress Media Library modal and invoke the callback with the
 * selected attachment data.
 * @param onSelect
 */
export function openMediaLibrary(
	onSelect: ( data: {
		id: number;
		url: string;
		alt: string;
		width: number;
		height: number;
	} ) => void
): void {
	if ( ! window.wp?.media ) {
		console.warn(
			'[TipTap] wp.media is not available. Is the media library loaded?'
		);
		return;
	}

	const frame = window.wp.media( {
		title: 'Insert Image',
		button: { text: 'Insert' },
		multiple: false,
		library: { type: 'image' },
	} );

	frame.on( 'select', () => {
		const attachment = frame.state().get( 'selection' ).first().toJSON();
		onSelect( {
			id: attachment.id,
			url: attachment.url,
			alt: attachment.alt,
			width: attachment.width,
			height: attachment.height,
		} );
	} );

	frame.open();
}
