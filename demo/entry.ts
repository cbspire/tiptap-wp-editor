/**
 * Demo page entry point.
 *
 * Stubs the data normally injected by WordPress (wp_localize_script and
 * wp.media) and then boots the real editor bundle. Lets the editor run
 * on a plain HTML page with no WordPress install.
 */

window.tiptapEditorData = {
	hasAbilitiesApi: false,
	hasAiClient: false,
	restUrl: '/wp-json/tiptap-editor/v1/',
	mediaRestUrl: '/wp-json/wp/v2/media',
	canUploadFiles: true,
	nonce: 'demo-nonce',
	postId: 1,
	postType: 'post',
};

// Minimal wp.media stub so the Insert Image button is operable.
( window as unknown as { wp: unknown } ).wp = {
	media: () => {
		const frame = {
			open: () => {
				// eslint-disable-next-line no-console
				console.info( '[demo] wp.media modal would open here' );
			},
			on: () => frame,
			state: () => ( {
				get: () => ( {
					first: () => ( {
						toJSON: () => ( {
							id: 1,
							url: 'https://placehold.co/600x300',
							alt: 'Demo image',
							width: 600,
							height: 300,
						} ),
					} ),
				} ),
			} ),
		};
		return frame;
	},
};

// Boot the real editor (dynamic import so the stubs above run first).
void import( '../src/editor/index' );
