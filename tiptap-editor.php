<?php
/**
 * Plugin Name:       TipTap Editor
 * Plugin URI:        https://github.com/cbspire/tiptap-wp-editor
 * Description:       A modern, focused rich text editor built on TipTap/ProseMirror. Replaces TinyMCE for opted-in post types. AI writing features on WP 7.0+.
 * Version:           0.1.0
 * Requires at least: 6.8
 * Requires PHP:      8.0
 * Author:            cbspire
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       tiptap-editor
 * Domain Path:       /languages
 *
 * @package TiptapEditor
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Plugin constants.
define( 'TIPTAP_EDITOR_VERSION', '0.1.0' );
define( 'TIPTAP_EDITOR_FILE', __FILE__ );
define( 'TIPTAP_EDITOR_DIR', plugin_dir_path( __FILE__ ) );
define( 'TIPTAP_EDITOR_URL', plugin_dir_url( __FILE__ ) );
define( 'TIPTAP_EDITOR_SLUG', 'tiptap-editor' );

// Autoloader.
spl_autoload_register( function ( string $class_name ): void {
	// Only handle classes with the plugin prefix.
	if ( ! str_starts_with( $class_name, 'Tiptap_Editor_' ) ) {
		return;
	}

	// Convert class name to filename: Tiptap_Editor_Foo_Bar → class-foo-bar.php
	$without_prefix = substr( $class_name, strlen( 'Tiptap_Editor_' ) );
	$filename       = 'class-' . strtolower( str_replace( '_', '-', $without_prefix ) ) . '.php';
	$path           = TIPTAP_EDITOR_DIR . 'includes/' . $filename;

	if ( file_exists( $path ) ) {
		require_once $path;
	}
} );

// Bootstrap the plugin.
add_action( 'plugins_loaded', function (): void {
	load_plugin_textdomain( 'tiptap-editor', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );
	Tiptap_Editor_Plugin::get_instance();
} );
