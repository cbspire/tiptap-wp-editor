<?php
/**
 * Version Compatibility Layer.
 *
 * All WP version feature flags route through this class.
 * No other class calls version_compare() or function_exists()
 * for WP version features directly.
 *
 * @package TiptapEditor
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Centralises all WordPress version detection and feature flag logic.
 *
 * Usage:
 *   Tiptap_Editor_Version_Compat::has_abilities_api()   // WP 7.0+
 *   Tiptap_Editor_Version_Compat::has_dataviews()        // WP 7.0+
 *   Tiptap_Editor_Version_Compat::has_design_tokens()    // WP 7.0+
 *   Tiptap_Editor_Version_Compat::has_ai_client()        // WP 7.0+
 *   Tiptap_Editor_Version_Compat::admin_ui_tier()        // 'modern' | 'legacy'
 */
class Tiptap_Editor_Version_Compat {

	/**
	 * Whether the current WP installation supports the Abilities API.
	 * Requires WP 7.0+. Checked at runtime, not at activation.
	 */
	public static function has_abilities_api(): bool {
		return function_exists( 'wp_register_ability' )
			&& version_compare( get_bloginfo( 'version' ), '7.0', '>=' );
	}

	/**
	 * Whether the current WP installation supports DataViews components.
	 * Requires WP 7.0+.
	 */
	public static function has_dataviews(): bool {
		return wp_script_is( 'wp-dataviews', 'registered' )
			&& version_compare( get_bloginfo( 'version' ), '7.0', '>=' );
	}

	/**
	 * Whether the current WP installation supports design tokens.
	 * Requires WP 7.0+.
	 */
	public static function has_design_tokens(): bool {
		return version_compare( get_bloginfo( 'version' ), '7.0', '>=' );
	}

	/**
	 * Whether the current WP installation supports the WP AI Client.
	 * Requires WP 7.0+.
	 */
	public static function has_ai_client(): bool {
		return self::has_abilities_api();
	}

	/**
	 * Returns 'modern' for WP 7.0+, 'legacy' for WP 6.8/6.9.
	 * Used to route to the correct admin UI implementation.
	 *
	 * @return string 'modern' | 'legacy'
	 */
	public static function admin_ui_tier(): string {
		return self::has_dataviews() ? 'modern' : 'legacy';
	}

	/**
	 * Returns the current WordPress version string.
	 * Wrapper for testing purposes.
	 */
	public static function wp_version(): string {
		return (string) get_bloginfo( 'version' );
	}
}
