<?php
/**
 * Version compatibility feature flags.
 *
 * @package TiptapEditor
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Tiptap_Editor_Version_Compat {
	/**
	 * Whether the current WP installation supports the Abilities API.
	 *
	 * @return bool
	 */
	public static function has_abilities_api(): bool {
		return self::wp_function_exists( 'wp_register_ability' )
			&& version_compare( self::get_wp_version(), '7.0', '>=' );
	}

	/**
	 * Whether the current WP installation supports DataViews components.
	 *
	 * @return bool
	 */
	public static function has_dataviews(): bool {
		return self::wp_script_registered( 'wp-dataviews' )
			&& version_compare( self::get_wp_version(), '7.0', '>=' );
	}

	/**
	 * Whether the current WP installation supports design tokens.
	 *
	 * @return bool
	 */
	public static function has_design_tokens(): bool {
		return version_compare( self::get_wp_version(), '7.0', '>=' );
	}

	/**
	 * Whether the current WP installation supports the WP AI Client.
	 *
	 * @return bool
	 */
	public static function has_ai_client(): bool {
		return self::has_abilities_api();
	}

	/**
	 * Returns the admin UI tier.
	 *
	 * @return string
	 */
	public static function admin_ui_tier(): string {
		return self::has_dataviews() ? 'modern' : 'legacy';
	}

	/**
	 * Read the current WordPress version.
	 *
	 * @return string
	 */
	private static function get_wp_version(): string {
		if ( function_exists( 'get_bloginfo' ) ) {
			return (string) get_bloginfo( 'version' );
		}

		return '0.0';
	}

	/**
	 * Wrapper around function_exists for testability.
	 *
	 * @param string $function_name Function name.
	 * @return bool
	 */
	private static function wp_function_exists( string $function_name ): bool {
		if ( isset( $GLOBALS['tiptap_editor_function_overrides'][ $function_name ] ) ) {
			return (bool) $GLOBALS['tiptap_editor_function_overrides'][ $function_name ];
		}

		return function_exists( $function_name );
	}

	/**
	 * Check whether a script is registered.
	 *
	 * @param string $handle Script handle.
	 * @return bool
	 */
	private static function wp_script_registered( string $handle ): bool {
		if ( function_exists( 'wp_script_is' ) ) {
			return (bool) wp_script_is( $handle, 'registered' );
		}

		if ( isset( $GLOBALS['tiptap_editor_script_registry'][ $handle ] ) ) {
			return (bool) $GLOBALS['tiptap_editor_script_registry'][ $handle ];
		}

		return false;
	}
}
