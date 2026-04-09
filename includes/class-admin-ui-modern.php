<?php
/**
 * Modern Admin UI (WP 7.0+).
 *
 * DataViews-native React settings page. Uses WP 7.0 design tokens.
 * Enqueues wp-dataviews, wp-components, wp-element.
 *
 * @package TiptapEditor
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Settings page for WP 7.0+ using DataViews and WP design tokens.
 */
class Tiptap_Editor_Admin_UI_Modern {

	/**
	 * Register WordPress hooks.
	 */
	public function register(): void {
		add_action( 'admin_menu', [ $this, 'add_settings_page' ] );
		add_action( 'rest_api_init', [ $this, 'register_rest_routes' ] );
	}

	/**
	 * Register the settings page under the Settings menu.
	 */
	public function add_settings_page(): void {
		add_options_page(
			__( 'TipTap Editor', 'tiptap-editor' ),
			__( 'TipTap Editor', 'tiptap-editor' ),
			'manage_options',
			'tiptap-editor',
			[ $this, 'render_settings_page' ]
		);
	}

	/**
	 * Register REST routes for the modern settings page.
	 *
	 * The DataViews UI uses these instead of the Settings API.
	 */
	public function register_rest_routes(): void {
		register_rest_route(
			'tiptap-editor/v1',
			'/settings',
			[
				[
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => [ $this, 'rest_get_settings' ],
					'permission_callback' => static fn() => current_user_can( 'manage_options' ),
				],
				[
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => [ $this, 'rest_update_settings' ],
					'permission_callback' => static fn() => current_user_can( 'manage_options' ),
					'args'                => [
						'post_types'     => [
							'type'  => 'array',
							'items' => [ 'type' => 'string' ],
						],
						'toolbar_preset' => [
							'type' => 'string',
							'enum' => [ 'minimal', 'standard', 'full' ],
						],
					],
				],
			]
		);
	}

	/**
	 * REST handler: return current settings.
	 *
	 * @return WP_REST_Response
	 */
	public function rest_get_settings(): WP_REST_Response {
		return new WP_REST_Response(
			[
				'post_types'      => (array) get_option( 'tiptap_editor_post_types', [] ),
				'toolbar_preset'  => (string) get_option( 'tiptap_editor_toolbar_preset', 'standard' ),
				'has_ai_client'   => Tiptap_Editor_Version_Compat::has_ai_client(),
				'has_abilities'   => Tiptap_Editor_Version_Compat::has_abilities_api(),
			],
			200
		);
	}

	/**
	 * REST handler: update settings.
	 *
	 * @param  WP_REST_Request $request REST request.
	 * @return WP_REST_Response
	 */
	public function rest_update_settings( WP_REST_Request $request ): WP_REST_Response {
		$updated = [];

		if ( $request->has_param( 'post_types' ) ) {
			$post_types = array_map( 'sanitize_key', (array) $request->get_param( 'post_types' ) );
			$registered = get_post_types( [ 'public' => true ] );
			$post_types = array_values( array_filter( $post_types, static fn( string $pt ): bool => isset( $registered[ $pt ] ) ) );
			update_option( 'tiptap_editor_post_types', $post_types );
			$updated['post_types'] = $post_types;
		}

		if ( $request->has_param( 'toolbar_preset' ) ) {
			$preset = sanitize_key( (string) $request->get_param( 'toolbar_preset' ) );
			if ( in_array( $preset, [ 'minimal', 'standard', 'full' ], true ) ) {
				update_option( 'tiptap_editor_toolbar_preset', $preset );
				$updated['toolbar_preset'] = $preset;
			}
		}

		return new WP_REST_Response( $updated, 200 );
	}

	/**
	 * Render the settings page shell (React app mounts here).
	 */
	public function render_settings_page(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		echo '<div class="wrap">';
		echo '<div id="tiptap-editor-settings-root"></div>';
		echo '</div>';
	}
}
