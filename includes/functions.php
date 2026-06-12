<?php
/**
 * Public helper functions.
 *
 * Loaded eagerly by the plugin bootstrap (not via the autoloader) so that
 * themes and other plugins can call these helpers at any point in the
 * request lifecycle — including from functions.php before 'init'.
 *
 * @package TiptapEditor
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Check whether TipTap Editor is active for a given post type.
 *
 * Never returns true for Gutenberg-enabled post types.
 *
 * @param  string $post_type Post type slug.
 * @return bool
 */
function tiptap_editor_is_active_post_type( string $post_type ): bool {
	return Tiptap_Editor_Editor_Registration::is_post_type_active( $post_type );
}

/**
 * Register a TipTap field for use in a meta box.
 *
 * @param array<string, mixed> $args {
 *     Field configuration.
 *
 *     @type string   $id         Unique field ID, used as meta key. Required.
 *     @type string[] $post_types Post types to register the field on. Required.
 *     @type string   $label      Human-readable label. Defaults to field ID.
 *     @type string[] $extensions Subset of extensions to enable.
 *     @type string   $toolbar    'minimal' | 'standard' | 'full'. Default 'standard'.
 *     @type bool     $ai         Show AI menu if the Abilities API is available. Default false.
 * }
 */
function tiptap_field( array $args ): void {
	Tiptap_Editor_Meta_Box::add_field( $args );
}
