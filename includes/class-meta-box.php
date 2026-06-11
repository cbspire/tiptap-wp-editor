<?php
/**
 * Meta Box / Field Mode API.
 *
 * Provides tiptap_field() for registering TipTap fields in custom meta boxes,
 * ACF (as a custom field type), and theme options pages.
 * Stores HTML in post meta — same format as TinyMCE fields, zero migration.
 *
 * @package TiptapEditor
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Handles meta box registration and the tiptap_field() public API.
 */
class Tiptap_Editor_Meta_Box {

	/**
	 * Registered field configurations.
	 *
	 * Static so that fields registered via tiptap_field() — possibly before
	 * the plugin's hooked instance is constructed — are always visible to it.
	 *
	 * @var array<string, array<string, mixed>>
	 */
	private static array $fields = [];

	/**
	 * Register WordPress hooks.
	 */
	public function register(): void {
		add_action( 'add_meta_boxes', [ $this, 'register_meta_boxes' ] );
		add_action( 'save_post', [ $this, 'save_meta_fields' ], 10, 2 );
	}

	/**
	 * Add a TipTap field definition.
	 *
	 * @param array<string, mixed> $args Field configuration.
	 *   - id          (string, required) — Unique field ID, used as meta key.
	 *   - post_types  (string[], required) — Post types to register on.
	 *   - label       (string) — Human-readable label. Defaults to field ID.
	 *   - extensions  (string[]) — Subset of extensions to enable.
	 *   - toolbar     (string) — 'minimal' | 'standard' | 'full'. Defaults to 'standard'.
	 *   - ai          (bool) — Show AI menu if Abilities API available. Defaults to false.
	 */
	public static function add_field( array $args ): void {
		$id = sanitize_key( (string) ( $args['id'] ?? '' ) );
		if ( empty( $id ) ) {
			return;
		}

		self::$fields[ $id ] = wp_parse_args(
			$args,
			[
				'id'         => $id,
				'post_types' => [],
				'label'      => $id,
				'extensions' => [],
				'toolbar'    => 'standard',
				'ai'         => false,
			]
		);
	}

	/**
	 * Register meta boxes for all configured fields.
	 */
	public function register_meta_boxes(): void {
		foreach ( self::$fields as $field ) {
			foreach ( (array) $field['post_types'] as $post_type ) {
				add_meta_box(
					'tiptap-field-' . $field['id'],
					esc_html( $field['label'] ),
					function ( WP_Post $post ) use ( $field ): void {
						$this->render_field( $post, $field );
					},
					sanitize_key( (string) $post_type ),
					'normal',
					'default'
				);
			}
		}
	}

	/**
	 * Render a TipTap field meta box.
	 *
	 * @param WP_Post              $post  Current post.
	 * @param array<string, mixed> $field Field configuration.
	 */
	public function render_field( WP_Post $post, array $field ): void {
		$meta_key = '_tiptap_field_' . $field['id'];
		$value    = (string) get_post_meta( $post->ID, $meta_key, true );

		wp_nonce_field( 'tiptap_field_' . $field['id'], '_tiptap_nonce_' . $field['id'] );

		$show_ai = ( true === $field['ai'] ) && Tiptap_Editor_Version_Compat::has_abilities_api();

		echo '<div class="tiptap-field-container"'
			. ' data-field-id="' . esc_attr( $field['id'] ) . '"'
			. ' data-meta-key="' . esc_attr( $meta_key ) . '"'
			. ' data-toolbar="' . esc_attr( (string) $field['toolbar'] ) . '"'
			. ' data-extensions="' . esc_attr( (string) wp_json_encode( $field['extensions'] ) ) . '"'
			. ' data-show-ai="' . esc_attr( $show_ai ? 'true' : 'false' ) . '"'
			. ' data-content="' . esc_attr( (string) wp_json_encode( $value ) ) . '"'
			. '></div>';

		echo '<textarea'
			. ' id="' . esc_attr( 'tiptap-field-input-' . $field['id'] ) . '"'
			. ' name="' . esc_attr( $meta_key ) . '"'
			. ' style="display:none"'
			. '>' . esc_textarea( $value ) . '</textarea>';
	}

	/**
	 * Save TipTap field values on post save.
	 *
	 * @param int     $post_id Post ID.
	 * @param WP_Post $post    Post object.
	 */
	public function save_meta_fields( int $post_id, WP_Post $post ): void {
		// Skip autosaves and revisions.
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}
		if ( wp_is_post_revision( $post_id ) ) {
			return;
		}

		foreach ( self::$fields as $field ) {
			if ( ! in_array( $post->post_type, (array) $field['post_types'], true ) ) {
				continue;
			}

			$nonce_key = '_tiptap_nonce_' . $field['id'];
			if ( ! isset( $_POST[ $nonce_key ] ) ) {
				continue;
			}

			if ( ! wp_verify_nonce( sanitize_text_field( wp_unslash( (string) $_POST[ $nonce_key ] ) ), 'tiptap_field_' . $field['id'] ) ) {
				continue;
			}

			if ( ! current_user_can( 'edit_post', $post_id ) ) {
				continue;
			}

			$meta_key = '_tiptap_field_' . $field['id'];

			if ( isset( $_POST[ $meta_key ] ) ) {
				$raw_value = wp_unslash( (string) $_POST[ $meta_key ] );
				// Allow full HTML — same as post_content.
				update_post_meta( $post_id, $meta_key, wp_kses_post( $raw_value ) );
			}
		}
	}
}
