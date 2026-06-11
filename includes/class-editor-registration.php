<?php
/**
 * Editor Registration.
 *
 * Replaces TinyMCE with TipTap for opted-in post types.
 * Never activates on Gutenberg-enabled post types.
 *
 * @package TiptapEditor
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registers the TipTap editor for configured post types.
 */
class Tiptap_Editor_Editor_Registration {

	/**
	 * Register WordPress hooks.
	 */
	public function register(): void {
		add_action( 'edit_form_after_title', [ $this, 'render_editor_mount_point' ] );
		add_action( 'the_content', [ $this, 'disable_wpautop_for_active_post_types' ], 9 );
	}

	/**
	 * Render the TipTap editor mount point for active post types.
	 *
	 * Removes the default TinyMCE editor and outputs the TipTap container
	 * plus a hidden textarea that WP's native save flow reads from.
	 *
	 * @param WP_Post $post Current post object.
	 */
	public function render_editor_mount_point( WP_Post $post ): void {
		if ( ! $this->is_active_post_type( $post->post_type ) ) {
			return;
		}

		// Remove TinyMCE editor support for this post type.
		remove_post_type_support( $post->post_type, 'editor' );

		// Render TipTap mount point.
		echo '<div id="tiptap-editor-root"'
			. ' data-post-id="' . esc_attr( (string) $post->ID ) . '"'
			. ' data-content="' . esc_attr( (string) wp_json_encode( $post->post_content ) ) . '"'
			. '></div>';

		// Hidden textarea — WP saves content from this field.
		echo '<textarea id="content" name="content" style="display:none"></textarea>';
	}

	/**
	 * Disable wpautop for TipTap-managed post types on the frontend.
	 *
	 * TipTap's HTML already has correct <p> tags; wpautop would double them.
	 *
	 * @param  string $content Post content.
	 * @return string Unchanged content (filter fires before wpautop).
	 */
	public function disable_wpautop_for_active_post_types( string $content ): string {
		if ( $this->is_active_post_type( (string) get_post_type() ) ) {
			remove_filter( 'the_content', 'wpautop' );
		}
		return $content;
	}

	/**
	 * Check whether TipTap is active for the given post type.
	 *
	 * Never activates on Gutenberg-enabled post types. Checks at runtime.
	 *
	 * @param  string $post_type Post type slug.
	 * @return bool
	 */
	public function is_active_post_type( string $post_type ): bool {
		if ( empty( $post_type ) ) {
			return false;
		}

		// Never activate on Gutenberg-enabled post types.
		if ( function_exists( 'use_block_editor_for_post_type' ) && use_block_editor_for_post_type( $post_type ) ) {
			return false;
		}

		$active_post_types = $this->get_active_post_types();

		return in_array( $post_type, $active_post_types, true );
	}

	/**
	 * Get the list of post types for which TipTap is enabled.
	 *
	 * @return string[] Post type slugs.
	 */
	public function get_active_post_types(): array {
		$saved = get_option( 'tiptap_editor_post_types', [] );
		$saved = is_array( $saved ) ? $saved : [];

		/**
		 * Filters the list of post types that use TipTap.
		 *
		 * @param string[] $post_types Array of post type slugs.
		 */
		return (array) apply_filters( 'tiptap_editor_post_types', $saved );
	}
}

/**
 * Global helper: check if TipTap is active for a given post type.
 *
 * @param  string $post_type Post type slug.
 * @return bool
 */
function tiptap_editor_is_active_post_type( string $post_type ): bool {
	static $instance = null;
	if ( null === $instance ) {
		$instance = new Tiptap_Editor_Editor_Registration();
	}
	return $instance->is_active_post_type( $post_type );
}
