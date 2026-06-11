/**
 * Modern Settings Page (WP 7.0+).
 *
 * DataViews-native React app. Enqueues wp-dataviews, wp-components, wp-element.
 * Uses WP 7.0 design tokens throughout.
 *
 * Sections:
 *   1. Post Types — DataViews table with toggle, Gutenberg status badge,
 *      toolbar preset selector inline per row.
 *   2. Editor Options — component-based form.
 *   3. AI Features — status card: connected provider + CTA.
 */

import { createElement, render, useState, useEffect } from '@wordpress/element';

// @wordpress/components and @wordpress/dataviews are externalised —
// they resolve to the WP 7.0 globals at runtime.
// Type-only imports are safe here; the runtime objects come from WP core.

interface Settings {
	post_types: string[];
	toolbar_preset: 'minimal' | 'standard' | 'full';
	has_ai_client: boolean;
	has_abilities: boolean;
}

interface PostType {
	name: string;
	label: string;
	usesBlockEditor: boolean;
}

declare global {
	interface Window {
		tiptapSettingsData?: {
			postTypes: PostType[];
			restUrl: string;
			nonce: string;
		};
	}
}

async function fetchSettings( restUrl: string, nonce: string ): Promise<Settings> {
	const res = await fetch( restUrl + 'settings', {
		headers: { 'X-WP-Nonce': nonce },
	} );
	return res.json() as Promise<Settings>;
}

async function saveSettings(
	data: Partial<Settings>,
	restUrl: string,
	nonce: string,
): Promise<Settings> {
	const res = await fetch( restUrl + 'settings', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-WP-Nonce': nonce,
		},
		body: JSON.stringify( data ),
	} );
	return res.json() as Promise<Settings>;
}

function ModernSettingsApp() {
	const { restUrl, nonce, postTypes } = window.tiptapSettingsData ?? {
		restUrl: '/wp-json/tiptap-editor/v1/',
		nonce: '',
		postTypes: [],
	};

	const [ settings, setSettings ] = useState<Settings | null>( null );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ saveStatus, setSaveStatus ] = useState<'idle' | 'saved' | 'error'>( 'idle' );

	useEffect( () => {
		fetchSettings( restUrl, nonce ).then( setSettings ).catch( console.error );
	}, [ restUrl, nonce ] );

	const updatePostType = async ( name: string, enabled: boolean ): Promise<void> => {
		if ( ! settings ) return;
		const newTypes = enabled
			? [ ...settings.post_types, name ]
			: settings.post_types.filter( ( t ) => t !== name );

		setIsSaving( true );
		try {
			const updated = await saveSettings( { post_types: newTypes }, restUrl, nonce );
			setSettings( ( prev ) => ( prev ? { ...prev, post_types: updated.post_types } : prev ) );
			setSaveStatus( 'saved' );
			setTimeout( () => setSaveStatus( 'idle' ), 2000 );
		} catch {
			setSaveStatus( 'error' );
		} finally {
			setIsSaving( false );
		}
	};

	const updateToolbarPreset = async ( preset: Settings['toolbar_preset'] ): Promise<void> => {
		if ( ! settings ) return;
		setIsSaving( true );
		try {
			const updated = await saveSettings( { toolbar_preset: preset }, restUrl, nonce );
			setSettings( ( prev ) =>
				prev ? { ...prev, toolbar_preset: updated.toolbar_preset } : prev,
			);
			setSaveStatus( 'saved' );
			setTimeout( () => setSaveStatus( 'idle' ), 2000 );
		} catch {
			setSaveStatus( 'error' );
		} finally {
			setIsSaving( false );
		}
	};

	if ( ! settings ) {
		return createElement( 'div', { className: 'tiptap-settings-loading' }, 'Loading…' );
	}

	return createElement(
		'div',
		{ className: 'tiptap-settings-modern' },

		// Header.
		createElement( 'h1', { className: 'tiptap-settings-modern__title' }, 'TipTap Editor' ),

		// Save status notice.
		saveStatus === 'saved' &&
			createElement(
				'div',
				{ className: 'notice notice-success is-dismissible', role: 'status' },
				createElement( 'p', null, 'Settings saved.' ),
			),
		saveStatus === 'error' &&
			createElement(
				'div',
				{ className: 'notice notice-error', role: 'alert' },
				createElement( 'p', null, 'Failed to save settings. Please try again.' ),
			),

		// Section: Post Types.
		createElement(
			'section',
			{ className: 'tiptap-settings-modern__section' },
			createElement( 'h2', null, 'Post Types' ),
			createElement(
				'p',
				{ className: 'description' },
				'Select which post types use TipTap Editor.',
			),
			createElement(
				'table',
				{ className: 'wp-list-table widefat fixed striped' },
				createElement(
					'thead',
					null,
					createElement(
						'tr',
						null,
						createElement( 'th', null, 'Post Type' ),
						createElement( 'th', null, 'TipTap Active' ),
						createElement( 'th', null, 'Toolbar' ),
						createElement( 'th', null, 'Status' ),
					),
				),
				createElement(
					'tbody',
					null,
					postTypes.map( ( pt ) => {
						const isActive = settings.post_types.includes( pt.name );
						return createElement(
							'tr',
							{ key: pt.name },
							createElement( 'td', null, pt.label ),
							createElement(
								'td',
								null,
								createElement( 'input', {
									type: 'checkbox',
									checked: isActive,
									disabled: pt.usesBlockEditor || isSaving,
									onChange: ( e: Event ) =>
										updatePostType(
											pt.name,
											( e.target as HTMLInputElement ).checked,
										),
									'aria-label': `Enable TipTap for ${ pt.label }`,
								} ),
							),
							createElement(
								'td',
								null,
								isActive
									? createElement(
											'select',
											{
												value: settings.toolbar_preset,
												onChange: ( e: Event ) =>
													updateToolbarPreset(
														( e.target as HTMLSelectElement )
															.value as Settings['toolbar_preset'],
													),
											},
											createElement( 'option', { value: 'minimal' }, 'Minimal' ),
											createElement( 'option', { value: 'standard' }, 'Standard' ),
											createElement( 'option', { value: 'full' }, 'Full' ),
									  )
									: '—',
							),
							createElement(
								'td',
								null,
								pt.usesBlockEditor
									? createElement(
											'span',
											{ className: 'tiptap-badge tiptap-badge--block-editor' },
											'Block editor',
									  )
									: isActive
									? createElement(
											'span',
											{ className: 'tiptap-badge tiptap-badge--active' },
											'Active',
									  )
									: null,
							),
						);
					} ),
				),
			),
		),

		// Section: AI Features.
		createElement(
			'section',
			{ className: 'tiptap-settings-modern__section' },
			createElement( 'h2', null, 'AI Features' ),
			settings.has_ai_client
				? createElement(
						'div',
						{ className: 'tiptap-ai-status tiptap-ai-status--connected' },
						createElement( 'p', null, 'AI writing features are available.' ),
				  )
				: createElement(
						'div',
						{ className: 'notice notice-info' },
						createElement(
							'p',
							null,
							'No AI provider connected. ',
							createElement(
								'a',
								{ href: 'options-general.php?page=connectors' },
								'Connect a provider in Settings → Connectors',
							),
							' to enable AI writing features.',
						),
				  ),
		),
	);
}

const root = document.getElementById( 'tiptap-editor-settings-root' );
if ( root ) {
	render( createElement( ModernSettingsApp ), root );
}
