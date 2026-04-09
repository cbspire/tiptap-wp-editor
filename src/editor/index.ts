/**
 * TipTap Editor Bootstrap.
 *
 * Initialises the TipTap editor on the WordPress post edit screen.
 * Mounts to #tiptap-editor-root, reads content from data attributes,
 * and syncs HTML output to the hidden #content textarea on every change
 * so WP's native save flow works unchanged.
 *
 * AI features are conditionally mounted based on tiptapEditorData.hasAbilitiesApi.
 * The AIMenu component is only imported when needed — it tree-shakes out
 * of the bundle when the flag is false.
 */

import { Editor } from '@tiptap/core';
import { StarterKit } from '@tiptap/starter-kit';
import { Image } from '@tiptap/extension-image';
import { Link } from '@tiptap/extension-link';
import { Underline } from '@tiptap/extension-underline';

import { WPShortcode } from './extensions/shortcode';
import { WPReadMore } from './extensions/read-more';
import { WPRawHTML } from './extensions/raw-html';
import { WPImage } from './extensions/wp-image';

/**
 * Data injected by PHP via wp_localize_script.
 */
declare global {
	interface Window {
		tiptapEditorData?: {
			hasAbilitiesApi: boolean;
			hasAiClient: boolean;
			restUrl: string;
			nonce: string;
			postId: number;
			postType: string;
		};
	}
}

/**
 * Boot the editor on DOM ready.
 */
function bootEditor(): void {
	const mountEl = document.getElementById( 'tiptap-editor-root' );
	if ( ! mountEl ) {
		return;
	}

	const contentTextarea = document.getElementById( 'content' ) as HTMLTextAreaElement | null;
	if ( ! contentTextarea ) {
		return;
	}

	// Read initial content from the data attribute (JSON-encoded HTML string).
	let initialContent = '';
	try {
		const raw = mountEl.dataset.content;
		if ( raw ) {
			initialContent = JSON.parse( raw ) as string;
		}
	} catch {
		// Fallback to empty content if JSON parsing fails.
		initialContent = '';
	}

	// Build extension list.
	const extensions = [
		StarterKit.configure( {
			// Disable extensions we replace with WP-specific variants.
			image: false,
		} ),
		Underline,
		Link.configure( {
			openOnClick: false,
			HTMLAttributes: {
				rel: 'noopener noreferrer',
			},
		} ),
		Image,
		WPShortcode,
		WPReadMore,
		WPRawHTML,
		WPImage,
	];

	// Create the editor.
	const editor = new Editor( {
		element: mountEl,
		extensions,
		content: initialContent,

		// Sync HTML to the hidden textarea on every change.
		onUpdate( { editor: ed } ) {
			contentTextarea.value = ed.getHTML();
		},
	} );

	// Set initial textarea value.
	contentTextarea.value = editor.getHTML();

	// Mount toolbar.
	mountToolbar( editor, mountEl );

	// Conditionally mount AI menu.
	const showAiMenu = window.tiptapEditorData?.hasAbilitiesApi === true;
	if ( showAiMenu ) {
		mountAiMenu( editor, mountEl );
	}
}

/**
 * Mount the main toolbar above the editor.
 */
function mountToolbar( editor: Editor, container: HTMLElement ): void {
	const toolbarEl = document.createElement( 'div' );
	toolbarEl.id = 'tiptap-toolbar';
	toolbarEl.className = 'tiptap-toolbar';
	container.insertAdjacentElement( 'beforebegin', toolbarEl );

	// Lazy-import the React toolbar component.
	import( './toolbar/Toolbar' ).then( ( { Toolbar } ) => {
		// Toolbar mounts itself into toolbarEl via React.
		Toolbar.mount( toolbarEl, editor );
	} ).catch( ( err: unknown ) => {
		console.error( '[TipTap] Failed to load toolbar:', err );
	} );
}

/**
 * Mount the AI menu (WP 7.0+ only).
 * Only called when hasAbilitiesApi === true.
 */
function mountAiMenu( editor: Editor, container: HTMLElement ): void {
	import( './toolbar/AIMenu' ).then( ( { AIMenu } ) => {
		AIMenu.mount( container, editor );
	} ).catch( ( err: unknown ) => {
		console.error( '[TipTap] Failed to load AI menu:', err );
	} );
}

// Boot on DOM ready.
if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', bootEditor );
} else {
	bootEditor();
}
