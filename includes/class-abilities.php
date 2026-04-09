<?php
/**
 * Abilities API Integration (WP 7.0+ only).
 *
 * Registers TipTap editor writing abilities via the WP 7.0 Abilities API.
 * This class is ONLY instantiated when has_abilities_api() returns true.
 * It must never be loaded on WP 6.8/6.9.
 *
 * REST endpoint: POST /wp-json/tiptap-editor/v1/ability
 *
 * @package TiptapEditor
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registers AI writing abilities for WP 7.0+ Abilities API.
 */
class Tiptap_Editor_Abilities {

	/**
	 * Register WordPress hooks.
	 *
	 * Only called when Tiptap_Editor_Version_Compat::has_abilities_api() === true.
	 */
	public function register(): void {
		add_action( 'init', [ $this, 'register_abilities' ] );
		add_action( 'rest_api_init', [ $this, 'register_rest_routes' ] );
	}

	/**
	 * Register TipTap writing abilities with the WP Abilities API.
	 */
	public function register_abilities(): void {
		if ( ! function_exists( 'wp_register_ability' ) ) {
			return;
		}

		wp_register_ability(
			'tiptap/improve-writing',
			[
				'label'       => __( 'Improve Writing', 'tiptap-editor' ),
				'description' => __( 'Rewrite selected text to improve clarity and flow.', 'tiptap-editor' ),
				'callback'    => [ $this, 'ability_improve_writing' ],
				'schema'      => [
					'input'  => [ 'type' => 'string', 'description' => 'Selected text to improve' ],
					'output' => [ 'type' => 'string', 'description' => 'Improved text' ],
				],
			]
		);

		wp_register_ability(
			'tiptap/summarise',
			[
				'label'       => __( 'Summarise', 'tiptap-editor' ),
				'description' => __( 'Summarise the selected text into a shorter version.', 'tiptap-editor' ),
				'callback'    => [ $this, 'ability_summarise' ],
				'schema'      => [
					'input'  => [ 'type' => 'string', 'description' => 'Text to summarise' ],
					'output' => [ 'type' => 'string', 'description' => 'Summary' ],
				],
			]
		);

		wp_register_ability(
			'tiptap/expand',
			[
				'label'       => __( 'Expand', 'tiptap-editor' ),
				'description' => __( 'Expand the selected text with more detail.', 'tiptap-editor' ),
				'callback'    => [ $this, 'ability_expand' ],
				'schema'      => [
					'input'  => [ 'type' => 'string', 'description' => 'Text to expand' ],
					'output' => [ 'type' => 'string', 'description' => 'Expanded text' ],
				],
			]
		);

		wp_register_ability(
			'tiptap/tone',
			[
				'label'       => __( 'Change Tone', 'tiptap-editor' ),
				'description' => __( 'Rewrite the selected text in a different tone.', 'tiptap-editor' ),
				'callback'    => [ $this, 'ability_tone' ],
				'schema'      => [
					'input'  => [
						'type'       => 'object',
						'properties' => [
							'text' => [ 'type' => 'string', 'description' => 'Text to rewrite' ],
							'tone' => [
								'type' => 'string',
								'enum' => [ 'professional', 'conversational', 'persuasive' ],
							],
						],
					],
					'output' => [ 'type' => 'string', 'description' => 'Rewritten text' ],
				],
			]
		);

		wp_register_ability(
			'tiptap/alt-text',
			[
				'label'       => __( 'Generate Alt Text', 'tiptap-editor' ),
				'description' => __( 'Generate descriptive alt text for an image.', 'tiptap-editor' ),
				'callback'    => [ $this, 'ability_alt_text' ],
				'schema'      => [
					'input'  => [ 'type' => 'string', 'description' => 'Image URL or attachment ID' ],
					'output' => [ 'type' => 'string', 'description' => 'Alt text' ],
				],
			]
		);
	}

	/**
	 * Register the REST endpoint for executing abilities.
	 */
	public function register_rest_routes(): void {
		register_rest_route(
			'tiptap-editor/v1',
			'/ability',
			[
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => [ $this, 'rest_execute_ability' ],
				'permission_callback' => static fn() => current_user_can( 'edit_posts' ),
				'args'                => [
					'ability' => [
						'type'     => 'string',
						'required' => true,
						'enum'     => [
							'tiptap/improve-writing',
							'tiptap/summarise',
							'tiptap/expand',
							'tiptap/tone',
							'tiptap/alt-text',
						],
					],
					'input'   => [
						'required' => true,
					],
					'context' => [
						'type'       => 'object',
						'properties' => [
							'post_id'   => [ 'type' => 'integer' ],
							'post_type' => [ 'type' => 'string' ],
						],
					],
				],
			]
		);
	}

	/**
	 * REST handler: execute an ability via WP AI Client.
	 *
	 * @param  WP_REST_Request $request REST request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function rest_execute_ability( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		if ( ! function_exists( 'wp_execute_ability' ) ) {
			return new WP_Error(
				'tiptap_abilities_unavailable',
				__( 'The Abilities API is not available on this WordPress installation.', 'tiptap-editor' ),
				[ 'status' => 501 ]
			);
		}

		$ability = (string) $request->get_param( 'ability' );
		$input   = $request->get_param( 'input' );
		$context = (array) ( $request->get_param( 'context' ) ?? [] );

		$result = wp_execute_ability( $ability, $input, $context );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return new WP_REST_Response( [ 'result' => $result ], 200 );
	}

	/**
	 * Ability callback: improve writing.
	 *
	 * @param  string $input Selected text.
	 * @return string|WP_Error Improved text or error.
	 */
	public function ability_improve_writing( string $input ): string|WP_Error {
		if ( ! function_exists( 'wp_ai_client' ) ) {
			return new WP_Error( 'no_ai_client', __( 'WP AI Client not available.', 'tiptap-editor' ) );
		}

		$prompt = sprintf(
			'Rewrite the following text to improve its clarity and flow. Return only the improved text, no explanation:\n\n%s',
			$input
		);

		return wp_ai_client()->complete( $prompt );
	}

	/**
	 * Ability callback: summarise.
	 *
	 * @param  string $input Text to summarise.
	 * @return string|WP_Error Summary or error.
	 */
	public function ability_summarise( string $input ): string|WP_Error {
		if ( ! function_exists( 'wp_ai_client' ) ) {
			return new WP_Error( 'no_ai_client', __( 'WP AI Client not available.', 'tiptap-editor' ) );
		}

		$prompt = sprintf(
			'Summarise the following text in 1-2 sentences. Return only the summary:\n\n%s',
			$input
		);

		return wp_ai_client()->complete( $prompt );
	}

	/**
	 * Ability callback: expand.
	 *
	 * @param  string $input Text to expand.
	 * @return string|WP_Error Expanded text or error.
	 */
	public function ability_expand( string $input ): string|WP_Error {
		if ( ! function_exists( 'wp_ai_client' ) ) {
			return new WP_Error( 'no_ai_client', __( 'WP AI Client not available.', 'tiptap-editor' ) );
		}

		$prompt = sprintf(
			'Expand the following text with more detail and context. Return only the expanded text:\n\n%s',
			$input
		);

		return wp_ai_client()->complete( $prompt );
	}

	/**
	 * Ability callback: change tone.
	 *
	 * @param  array{text: string, tone: string} $input Input data.
	 * @return string|WP_Error Rewritten text or error.
	 */
	public function ability_tone( array $input ): string|WP_Error {
		if ( ! function_exists( 'wp_ai_client' ) ) {
			return new WP_Error( 'no_ai_client', __( 'WP AI Client not available.', 'tiptap-editor' ) );
		}

		$text = (string) ( $input['text'] ?? '' );
		$tone = (string) ( $input['tone'] ?? 'professional' );

		$tone_descriptions = [
			'professional'   => 'professional and formal',
			'conversational' => 'conversational and friendly',
			'persuasive'     => 'persuasive and compelling',
		];

		$tone_desc = $tone_descriptions[ $tone ] ?? 'professional and formal';

		$prompt = sprintf(
			'Rewrite the following text in a %s tone. Return only the rewritten text:\n\n%s',
			$tone_desc,
			$text
		);

		return wp_ai_client()->complete( $prompt );
	}

	/**
	 * Ability callback: generate alt text.
	 *
	 * @param  string $input Image URL or attachment ID.
	 * @return string|WP_Error Alt text or error.
	 */
	public function ability_alt_text( string $input ): string|WP_Error {
		if ( ! function_exists( 'wp_ai_client' ) ) {
			return new WP_Error( 'no_ai_client', __( 'WP AI Client not available.', 'tiptap-editor' ) );
		}

		// Resolve attachment ID to URL if numeric.
		if ( is_numeric( $input ) ) {
			$url = wp_get_attachment_url( (int) $input );
			if ( false === $url ) {
				return new WP_Error( 'invalid_attachment', __( 'Attachment not found.', 'tiptap-editor' ) );
			}
			$input = $url;
		}

		$prompt = sprintf(
			'Write a concise, descriptive alt text for this image URL: %s. Return only the alt text, no quotes.',
			esc_url_raw( $input )
		);

		return wp_ai_client()->complete( $prompt );
	}
}
