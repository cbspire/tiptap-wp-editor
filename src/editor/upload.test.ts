/**
 * Media Library upload helper tests.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	canUploadFiles,
	isImageFile,
	uploadImageToMediaLibrary,
} from './upload';

const MEDIA_URL = 'https://example.test/wp-json/wp/v2/media';

describe( 'upload helpers', () => {
	beforeEach( () => {
		window.tiptapEditorData = {
			hasAbilitiesApi: false,
			hasAiClient: false,
			restUrl: 'https://example.test/wp-json/tiptap-editor/v1/',
			mediaRestUrl: MEDIA_URL,
			canUploadFiles: true,
			nonce: 'test-nonce',
			postId: 1,
			postType: 'post',
		};
	} );

	afterEach( () => {
		delete window.tiptapEditorData;
		vi.unstubAllGlobals();
	} );

	describe( 'canUploadFiles', () => {
		it( 'is true when the capability and endpoint are present', () => {
			expect( canUploadFiles() ).toBe( true );
		} );

		it( 'is false without the upload_files capability', () => {
			window.tiptapEditorData!.canUploadFiles = false;
			expect( canUploadFiles() ).toBe( false );
		} );

		it( 'is false when editor data is missing entirely', () => {
			delete window.tiptapEditorData;
			expect( canUploadFiles() ).toBe( false );
		} );
	} );

	describe( 'isImageFile', () => {
		it( 'accepts images and rejects other types', () => {
			expect(
				isImageFile(
					new File( [ 'x' ], 'a.png', { type: 'image/png' } )
				)
			).toBe( true );
			expect(
				isImageFile(
					new File( [ 'x' ], 'a.pdf', { type: 'application/pdf' } )
				)
			).toBe( false );
		} );
	} );

	describe( 'uploadImageToMediaLibrary', () => {
		it( 'POSTs the file with the REST nonce and returns the attachment', async () => {
			const fetchMock = vi.fn().mockResolvedValue( {
				ok: true,
				json: () =>
					Promise.resolve( {
						id: 42,
						source_url: 'https://example.test/uploads/a.png',
						alt_text: 'An image',
					} ),
			} );
			vi.stubGlobal( 'fetch', fetchMock );

			const file = new File( [ 'x' ], 'a.png', { type: 'image/png' } );
			const result = await uploadImageToMediaLibrary( file );

			expect( result ).toEqual( {
				id: 42,
				url: 'https://example.test/uploads/a.png',
				alt: 'An image',
			} );

			expect( fetchMock ).toHaveBeenCalledTimes( 1 );
			const [ url, options ] = fetchMock.mock.calls[ 0 ] as [
				string,
				RequestInit,
			];
			expect( url ).toBe( MEDIA_URL );
			expect( options.method ).toBe( 'POST' );
			expect(
				( options.headers as Record< string, string > )[ 'X-WP-Nonce' ]
			).toBe( 'test-nonce' );
			expect( options.body ).toBeInstanceOf( FormData );
		} );

		it( 'rejects with the REST error message on failure', async () => {
			vi.stubGlobal(
				'fetch',
				vi.fn().mockResolvedValue( {
					ok: false,
					status: 403,
					json: () =>
						Promise.resolve( {
							message:
								'Sorry, you are not allowed to upload files.',
						} ),
				} )
			);

			const file = new File( [ 'x' ], 'a.png', { type: 'image/png' } );
			await expect( uploadImageToMediaLibrary( file ) ).rejects.toThrow(
				'Sorry, you are not allowed to upload files.'
			);
		} );

		it( 'rejects with a generic message when the error body is not JSON', async () => {
			vi.stubGlobal(
				'fetch',
				vi.fn().mockResolvedValue( {
					ok: false,
					status: 500,
					json: () => Promise.reject( new Error( 'not json' ) ),
				} )
			);

			const file = new File( [ 'x' ], 'a.png', { type: 'image/png' } );
			await expect( uploadImageToMediaLibrary( file ) ).rejects.toThrow(
				'Upload failed (HTTP 500)'
			);
		} );

		it( 'rejects when no media endpoint is configured', async () => {
			delete window.tiptapEditorData;
			const file = new File( [ 'x' ], 'a.png', { type: 'image/png' } );
			await expect( uploadImageToMediaLibrary( file ) ).rejects.toThrow(
				'Media upload is not available.'
			);
		} );
	} );
} );
