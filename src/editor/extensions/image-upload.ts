/**
 * WPImageUpload Extension.
 *
 * Notion-style image uploading:
 * - Drag & drop image files into the editor.
 * - Paste images from the clipboard.
 * - `uploadWPImage()` command opens a native file picker
 *   (used by the "Upload image" slash command and toolbar).
 *
 * Flow: a WPImage node is inserted immediately with a local blob URL
 * and a transient uploadId, the file is uploaded to the Media Library
 * via REST, then the node is patched with the real URL + attachment ID.
 * On failure the placeholder node is removed and a dismissible admin
 * notice is shown — content is never left pointing at a blob URL.
 */

import { Extension } from '@tiptap/core';
import type { Editor } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import {
	canUploadFiles,
	isImageFile,
	uploadImageToMediaLibrary,
} from '../upload';

declare module '@tiptap/core' {
	interface Commands< ReturnType > {
		wpImageUpload: {
			/** Open a file picker and upload the chosen images to the Media Library */
			uploadWPImage: () => ReturnType;
		};
	}
}

let uploadCounter = 0;

/**
 * Insert uploading placeholders for the given files and start their uploads.
 *
 * @param editor TipTap editor instance.
 * @param files  Files from a drop/paste/file-picker event.
 * @param pos    Document position to insert at; defaults to the current selection.
 * @return Number of image files accepted for upload.
 */
export function uploadAndInsertImages(
	editor: Editor,
	files: File[],
	pos?: number
): number {
	const images = files.filter( isImageFile );
	if ( images.length === 0 || ! canUploadFiles() ) {
		return 0;
	}

	for ( const file of images ) {
		const uploadId = `tiptap-upload-${ ++uploadCounter }-${ Date.now() }`;
		const objectUrl = URL.createObjectURL( file );

		const node = {
			type: 'wpImage',
			attrs: {
				src: objectUrl,
				alt: '',
				uploadId,
			},
		};

		if ( typeof pos === 'number' ) {
			editor.chain().insertContentAt( pos, node ).run();
		} else {
			editor.chain().focus().insertContent( node ).run();
		}

		uploadImageToMediaLibrary( file )
			.then( ( image ) => {
				patchUploadedNode( editor, uploadId, {
					src: image.url,
					alt: image.alt,
					attachmentId: image.id,
					class: `wp-image-${ image.id }`,
					uploadId: null,
				} );
			} )
			.catch( ( err: unknown ) => {
				removeUploadNode( editor, uploadId );
				showUploadError(
					err instanceof Error ? err.message : 'Image upload failed.'
				);
			} )
			.finally( () => {
				URL.revokeObjectURL( objectUrl );
			} );
	}

	return images.length;
}

/**
 * Find the placeholder node by uploadId and swap in the final attributes.
 * @param editor
 * @param uploadId
 * @param attrs
 */
function patchUploadedNode(
	editor: Editor,
	uploadId: string,
	attrs: Record< string, unknown >
): void {
	const found = findUploadNode( editor, uploadId );
	if ( ! found ) {
		return;
	}

	const { pos, nodeAttrs } = found;
	const tr = editor.state.tr.setNodeMarkup( pos, undefined, {
		...nodeAttrs,
		...attrs,
	} );
	editor.view.dispatch( tr );
}

/**
 * Remove a placeholder node whose upload failed.
 * @param editor
 * @param uploadId
 */
function removeUploadNode( editor: Editor, uploadId: string ): void {
	const found = findUploadNode( editor, uploadId );
	if ( ! found ) {
		return;
	}

	const tr = editor.state.tr.delete( found.pos, found.pos + found.nodeSize );
	editor.view.dispatch( tr );
}

function findUploadNode(
	editor: Editor,
	uploadId: string
): {
	pos: number;
	nodeSize: number;
	nodeAttrs: Record< string, unknown >;
} | null {
	let result: {
		pos: number;
		nodeSize: number;
		nodeAttrs: Record< string, unknown >;
	} | null = null;

	editor.state.doc.descendants( ( node, pos ) => {
		if ( result ) {
			return false;
		}
		if (
			node.type.name === 'wpImage' &&
			node.attrs.uploadId === uploadId
		) {
			result = { pos, nodeSize: node.nodeSize, nodeAttrs: node.attrs };
			return false;
		}
		return true;
	} );

	return result;
}

/**
 * Show a dismissible error notice above the editor.
 * @param message
 */
function showUploadError( message: string ): void {
	const mountEl = document.getElementById( 'tiptap-editor-root' );
	if ( ! mountEl ) {
		// Headless usage (tests) — fall back to console.
		console.error( '[TipTap] Image upload failed:', message );
		return;
	}

	const notice = document.createElement( 'div' );
	notice.className = 'notice notice-error tiptap-upload-error';
	notice.setAttribute( 'role', 'alert' );
	notice.textContent = `Image upload failed: ${ message }`;
	mountEl.insertAdjacentElement( 'beforebegin', notice );

	window.setTimeout( () => notice.remove(), 8000 );
}

/**
 * Open a native file picker and upload the selection.
 * @param editor
 */
function openFilePicker( editor: Editor ): void {
	const input = document.createElement( 'input' );
	input.type = 'file';
	input.accept = 'image/*';
	input.multiple = true;
	input.style.display = 'none';

	input.addEventListener( 'change', () => {
		const files = input.files ? Array.from( input.files ) : [];
		uploadAndInsertImages( editor, files );
		input.remove();
	} );

	document.body.appendChild( input );
	input.click();
}

export const WPImageUpload = Extension.create( {
	name: 'wpImageUpload',

	addCommands() {
		return {
			uploadWPImage:
				() =>
				( { editor } ) => {
					if ( ! canUploadFiles() ) {
						return false;
					}
					openFilePicker( editor );
					return true;
				},
		};
	},

	addProseMirrorPlugins() {
		const editor = this.editor;

		return [
			new Plugin( {
				key: new PluginKey( 'wpImageUploadHandler' ),
				props: {
					handleDrop( view, event, _slice, moved ) {
						// Internal drags (e.g. block reordering) are not uploads.
						if ( moved || ! event.dataTransfer?.files?.length ) {
							return false;
						}

						const files = Array.from(
							event.dataTransfer.files
						).filter( isImageFile );
						if ( files.length === 0 ) {
							return false;
						}

						const coords = view.posAtCoords( {
							left: event.clientX,
							top: event.clientY,
						} );

						const handled =
							uploadAndInsertImages(
								editor,
								files,
								coords?.pos
							) > 0;
						if ( handled ) {
							event.preventDefault();
						}
						return handled;
					},

					handlePaste( _view, event ) {
						const files = event.clipboardData?.files
							? Array.from( event.clipboardData.files ).filter(
									isImageFile
							  )
							: [];
						if ( files.length === 0 ) {
							return false;
						}

						const handled =
							uploadAndInsertImages( editor, files ) > 0;
						if ( handled ) {
							event.preventDefault();
						}
						return handled;
					},
				},
			} ),
		];
	},
} );
