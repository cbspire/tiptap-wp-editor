<?php
/**
 * Asset Enqueueing.
 *
 * Handles script/style registration and enqueueing for the editor and
 * admin UI. Selects the correct CSS tier (legacy/modern) based on
 * the current WP version via Tiptap_Editor_Version_Compat.
 *
 * @package TiptapEditor
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registers and enqueues plugin scripts and styles.
 */
class Tiptap_Editor_Assets {

	/**
	 * Register WordPress hooks.
	 */
	public function register(): void {
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_editor_assets' ] );
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_settings_assets' ] );
	}

	/**
	 * Enqueue editor scripts and styles on post edit screens.
	 *
	 * @param string $hook Current admin page hook suffix.
	 */
	public function enqueue_editor_assets( string $hook ): void {
		if ( ! in_array( $hook, [ 'post.php', 'post-new.php' ], true ) ) {
			return;
		}

		$post = get_post();
		if ( ! $post instanceof WP_Post ) {
			return;
		}

		if ( ! tiptap_editor_is_active_post_type( $post->post_type ) ) {
			return;
		}

		$js_path  = TIPTAP_EDITOR_DIR . 'assets/js/editor.js';
		$js_url   = TIPTAP_EDITOR_URL . 'assets/js/editor.js';
		$js_ver   = file_exists( $js_path ) ? (string) filemtime( $js_path ) : TIPTAP_EDITOR_VERSION;

		wp_enqueue_script(
			'tiptap-editor',
			$js_url,
			[ 'wp-element', 'wp-i18n', 'wp-hooks' ],
			$js_ver,
			true
		);

		// Inject feature flags and editor data.
		wp_localize_script(
			'tiptap-editor',
			'tiptapEditorData',
			[
				'hasAbilitiesApi' => Tiptap_Editor_Version_Compat::has_abilities_api(),
				'hasAiClient'     => Tiptap_Editor_Version_Compat::has_ai_client(),
				'restUrl'         => rest_url( 'tiptap-editor/v1/' ),
				'nonce'           => wp_create_nonce( 'wp_rest' ),
				'postId'          => $post->ID,
				'postType'        => $post->post_type,
			]
		);

		// Base editor CSS (always loaded).
		$this->enqueue_editor_css();
	}

	/**
	 * Enqueue settings page scripts and styles.
	 *
	 * @param string $hook Current admin page hook suffix.
	 */
	public function enqueue_settings_assets( string $hook ): void {
		if ( 'settings_page_tiptap-editor' !== $hook ) {
			return;
		}

		if ( Tiptap_Editor_Version_Compat::admin_ui_tier() === 'modern' ) {
			$this->enqueue_modern_settings( $hook );
		} else {
			$this->enqueue_legacy_settings( $hook );
		}

		// Shared admin CSS.
		$css_path = TIPTAP_EDITOR_DIR . 'assets/css/admin.css';
		$css_url  = TIPTAP_EDITOR_URL . 'assets/css/admin.css';
		$css_ver  = file_exists( $css_path ) ? (string) filemtime( $css_path ) : TIPTAP_EDITOR_VERSION;

		wp_enqueue_style( 'tiptap-editor-admin', $css_url, [], $css_ver );
	}

	/**
	 * Enqueue the version-appropriate editor CSS tier.
	 */
	private function enqueue_editor_css(): void {
		// Base editor CSS.
		$base_css_path = TIPTAP_EDITOR_DIR . 'assets/css/editor.css';
		$base_css_url  = TIPTAP_EDITOR_URL . 'assets/css/editor.css';
		$base_css_ver  = file_exists( $base_css_path ) ? (string) filemtime( $base_css_path ) : TIPTAP_EDITOR_VERSION;

		wp_enqueue_style( 'tiptap-editor-base', $base_css_url, [], $base_css_ver );

		// Version-aware CSS tier.
		if ( Tiptap_Editor_Version_Compat::has_design_tokens() ) {
			$css_handle = 'tiptap-editor-modern';
			$css_file   = 'editor-modern.css';
			$deps       = [ 'tiptap-editor-base' ];
		} else {
			$css_handle = 'tiptap-editor-legacy';
			$css_file   = 'editor-legacy.css';
			$deps       = [ 'tiptap-editor-base' ];
		}

		$css_path = TIPTAP_EDITOR_DIR . 'assets/css/' . $css_file;
		$css_url  = TIPTAP_EDITOR_URL . 'assets/css/' . $css_file;
		$css_ver  = file_exists( $css_path ) ? (string) filemtime( $css_path ) : TIPTAP_EDITOR_VERSION;

		wp_enqueue_style( $css_handle, $css_url, $deps, $css_ver );
	}

	/**
	 * Enqueue the legacy (WP 6.8/6.9) settings page JS.
	 *
	 * @param string $hook Admin page hook (unused, kept for signature consistency).
	 */
	private function enqueue_legacy_settings( string $hook ): void {
		$js_path = TIPTAP_EDITOR_DIR . 'assets/js/settings-legacy.js';
		$js_url  = TIPTAP_EDITOR_URL . 'assets/js/settings-legacy.js';
		$js_ver  = file_exists( $js_path ) ? (string) filemtime( $js_path ) : TIPTAP_EDITOR_VERSION;

		wp_enqueue_script(
			'tiptap-editor-settings-legacy',
			$js_url,
			[ 'wp-element', 'wp-i18n' ],
			$js_ver,
			true
		);
	}

	/**
	 * Enqueue the modern (WP 7.0+) settings page JS.
	 *
	 * @param string $hook Admin page hook (unused, kept for signature consistency).
	 */
	private function enqueue_modern_settings( string $hook ): void {
		wp_enqueue_script( 'wp-dataviews' );
		wp_enqueue_script( 'wp-components' );
		wp_enqueue_script( 'wp-element' );

		$js_path = TIPTAP_EDITOR_DIR . 'assets/js/settings-modern.js';
		$js_url  = TIPTAP_EDITOR_URL . 'assets/js/settings-modern.js';
		$js_ver  = file_exists( $js_path ) ? (string) filemtime( $js_path ) : TIPTAP_EDITOR_VERSION;

		wp_enqueue_script(
			'tiptap-editor-settings-modern',
			$js_url,
			[ 'wp-dataviews', 'wp-components', 'wp-element', 'wp-i18n' ],
			$js_ver,
			true
		);
	}
}
