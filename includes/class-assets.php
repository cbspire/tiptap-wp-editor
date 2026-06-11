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

		wp_enqueue_script(
			'tiptap-editor',
			TIPTAP_EDITOR_URL . 'assets/js/editor.js',
			[ 'wp-element', 'wp-i18n', 'wp-hooks' ],
			$this->asset_version( 'assets/js/editor.js' ),
			true
		);

		wp_set_script_translations( 'tiptap-editor', 'tiptap-editor', TIPTAP_EDITOR_DIR . 'languages' );

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
			$this->enqueue_modern_settings();
		} else {
			$this->enqueue_legacy_settings();
		}

		// Shared admin CSS.
		wp_enqueue_style(
			'tiptap-editor-admin',
			TIPTAP_EDITOR_URL . 'assets/css/admin.css',
			[],
			$this->asset_version( 'assets/css/admin.css' )
		);
	}

	/**
	 * Enqueue the version-appropriate editor CSS tier.
	 */
	private function enqueue_editor_css(): void {
		// Base editor CSS (always loaded).
		wp_enqueue_style(
			'tiptap-editor-base',
			TIPTAP_EDITOR_URL . 'assets/css/editor.css',
			[],
			$this->asset_version( 'assets/css/editor.css' )
		);

		// Version-aware CSS tier.
		if ( Tiptap_Editor_Version_Compat::has_design_tokens() ) {
			$css_handle = 'tiptap-editor-modern';
			$css_file   = 'editor-modern.css';
		} else {
			$css_handle = 'tiptap-editor-legacy';
			$css_file   = 'editor-legacy.css';
		}

		wp_enqueue_style(
			$css_handle,
			TIPTAP_EDITOR_URL . 'assets/css/' . $css_file,
			[ 'tiptap-editor-base' ],
			$this->asset_version( 'assets/css/' . $css_file )
		);
	}

	/**
	 * Enqueue the legacy (WP 6.8/6.9) settings page JS.
	 */
	private function enqueue_legacy_settings(): void {
		wp_enqueue_script(
			'tiptap-editor-settings-legacy',
			TIPTAP_EDITOR_URL . 'assets/js/settings-legacy.js',
			[ 'wp-element', 'wp-i18n' ],
			$this->asset_version( 'assets/js/settings-legacy.js' ),
			true
		);

		wp_set_script_translations( 'tiptap-editor-settings-legacy', 'tiptap-editor', TIPTAP_EDITOR_DIR . 'languages' );
	}

	/**
	 * Enqueue the modern (WP 7.0+) settings page JS.
	 */
	private function enqueue_modern_settings(): void {
		wp_enqueue_script(
			'tiptap-editor-settings-modern',
			TIPTAP_EDITOR_URL . 'assets/js/settings-modern.js',
			[ 'wp-dataviews', 'wp-components', 'wp-element', 'wp-i18n' ],
			$this->asset_version( 'assets/js/settings-modern.js' ),
			true
		);

		wp_set_script_translations( 'tiptap-editor-settings-modern', 'tiptap-editor', TIPTAP_EDITOR_DIR . 'languages' );
	}

	/**
	 * Cache-busting version string for a plugin asset.
	 *
	 * Uses the file's mtime in development so changes bust caches
	 * immediately; falls back to the plugin version.
	 *
	 * @param  string $relative_path Path relative to the plugin root.
	 * @return string Version string.
	 */
	private function asset_version( string $relative_path ): string {
		$path = TIPTAP_EDITOR_DIR . $relative_path;

		return file_exists( $path ) ? (string) filemtime( $path ) : TIPTAP_EDITOR_VERSION;
	}
}
