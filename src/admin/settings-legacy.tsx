/**
 * Legacy Settings Page (WP 6.8 / 6.9).
 *
 * Plain React with no DataViews dependency. Works on WP 6.8+.
 * The PHP settings page renders the mount point; this enhances it
 * with React for dynamic post-type toggles.
 *
 * Note: The PHP legacy settings page is fully functional without JS.
 * This bundle adds progressive enhancement only.
 */

import { createElement, render } from '@wordpress/element';

// Minimal export to satisfy the bundle entry point.
// Full React enhancement of the legacy settings page will be implemented
// in Phase 2 (P3 Admin UI). For now the PHP-rendered page is authoritative.

const LegacySettingsApp = () =>
	createElement(
		'div',
		{ id: 'tiptap-settings-legacy-root' },
		// PHP-rendered settings form is the primary UI on 6.8/6.9.
		// This component reserved for future enhancement.
		null,
	);

// Only mount if the settings root exists (modern PHP rendering is not active).
const root = document.getElementById( 'tiptap-editor-settings-root' );
if ( root ) {
	render( createElement( LegacySettingsApp ), root );
}
