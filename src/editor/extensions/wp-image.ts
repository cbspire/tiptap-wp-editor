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
			media?: (
				options: Record<string, unknown>,
			) => {
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
	interface Commands<ReturnType> {
		wpImage: {
			/** Open the WP Media Library and insert the selected image */
			insertWPImage: () => ReturnType;
		};
	}
}

export const WPImage = Image.extend( {
	name: 'wpImage',

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
					if ( ! attributes.attachmentId ) return {};
					return { 'data-attachment-id': String( attributes.attachmentId ) };
				},
			},
			// Standard WP image class (e.g. wp-image-42, alignleft, size-large)
			class: {
				default: null,
				parseHTML: ( element ) => element.getAttribute( 'class' ) ?? null,
				renderHTML: ( attributes ) => {
					if ( ! attributes.class ) return {};
					return { class: attributes.class as string };
				},
			},
		};
	},

	renderHTML( { HTMLAttributes } ) {
		return [
			'img',
			mergeAttributes( this.options.HTMLAttributes, HTMLAttributes ),
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
 */
function openMediaLibrary(
	onSelect: ( data: {
		id: number;
		url: string;
		alt: string;
		width: number;
		height: number;
	} ) => void,
): void {
	if ( ! window.wp?.media ) {
		console.warn( '[TipTap] wp.media is not available. Is the media library loaded?' );
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
