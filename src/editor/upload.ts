/**
 * Media Library Upload Helper.
 *
 * Uploads image files to the WordPress Media Library via the core
 * REST API (POST /wp/v2/media). Used by the drag-and-drop / paste
 * upload flow and the "Upload image" slash command.
 *
 * The endpoint URL and REST nonce are injected by PHP via
 * wp_localize_script (window.tiptapEditorData).
 */

export interface UploadedImage {
	/** Attachment ID of the new media item */
	id: number;
	/** Public URL of the uploaded file */
	url: string;
	/** Alt text (usually empty for fresh uploads) */
	alt: string;
}

interface MediaResponse {
	id: number;
	source_url: string;
	alt_text?: string;
}

/**
 * Whether the current user can upload files to the Media Library.
 */
export function canUploadFiles(): boolean {
	return (
		window.tiptapEditorData?.canUploadFiles === true &&
		!! window.tiptapEditorData?.mediaRestUrl
	);
}

/**
 * Whether a File from a drop/paste event is an image we can upload.
 * @param file
 */
export function isImageFile( file: File ): boolean {
	return /^image\//.test( file.type );
}

/**
 * Upload a single image file to the WP Media Library.
 *
 * Rejects with an Error carrying the REST error message when the
 * upload fails (e.g. file type not allowed, quota exceeded).
 * @param file
 */
export async function uploadImageToMediaLibrary(
	file: File
): Promise< UploadedImage > {
	const data = window.tiptapEditorData;
	if ( ! data?.mediaRestUrl ) {
		throw new Error( 'Media upload is not available.' );
	}

	const formData = new FormData();
	formData.append( 'file', file, file.name || 'image.png' );

	const response = await fetch( data.mediaRestUrl, {
		method: 'POST',
		headers: {
			'X-WP-Nonce': data.nonce,
		},
		body: formData,
		credentials: 'same-origin',
	} );

	if ( ! response.ok ) {
		let message = `Upload failed (HTTP ${ response.status })`;
		try {
			const error = ( await response.json() ) as { message?: string };
			if ( error.message ) {
				message = error.message;
			}
		} catch {
			// Non-JSON error body — keep the generic message.
		}
		throw new Error( message );
	}

	const json = ( await response.json() ) as MediaResponse;

	return {
		id: json.id,
		url: json.source_url,
		alt: json.alt_text ?? '',
	};
}
