<?php
/**
 * Legacy Admin UI (WP 6.8 / 6.9).
 *
 * Standard WordPress Settings API. No React, no DataViews.
 * Uses only standard WP admin CSS classes (widefat, form-table, notice, etc.)
 * so the page looks native on WP 6.8/6.9 without any custom CSS.
 *
 * @package TiptapEditor
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Settings page for WP 6.8 / 6.9 using the standard WP Settings API.
 */
class Tiptap_Editor_Admin_UI_Legacy {

	/**
	 * Register WordPress hooks.
	 */
	public function register(): void {
		add_action( 'admin_menu', [ $this, 'add_settings_page' ] );
		add_action( 'admin_init', [ $this, 'register_settings' ] );
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
	 * Register settings, sections, and fields via the WP Settings API.
	 */
	public function register_settings(): void {
		// Option: active post types.
		register_setting(
			'tiptap_editor',
			'tiptap_editor_post_types',
			[
				'type'              => 'array',
				'sanitize_callback' => [ $this, 'sanitize_post_types' ],
				'default'           => [],
			]
		);

		// Option: toolbar preset.
		register_setting(
			'tiptap_editor',
			'tiptap_editor_toolbar_preset',
			[
				'type'              => 'string',
				'sanitize_callback' => [ $this, 'sanitize_toolbar_preset' ],
				'default'           => 'standard',
			]
		);

		// Section: Post Types.
		add_settings_section(
			'tiptap_editor_post_types_section',
			__( 'Post Types', 'tiptap-editor' ),
			[ $this, 'render_post_types_section_description' ],
			'tiptap-editor'
		);

		add_settings_field(
			'tiptap_editor_post_types',
			__( 'Enable TipTap for:', 'tiptap-editor' ),
			[ $this, 'render_post_types_field' ],
			'tiptap-editor',
			'tiptap_editor_post_types_section'
		);

		// Section: Editor Options.
		add_settings_section(
			'tiptap_editor_options_section',
			__( 'Editor Options', 'tiptap-editor' ),
			'__return_null',
			'tiptap-editor'
		);

		add_settings_field(
			'tiptap_editor_toolbar_preset',
			__( 'Toolbar', 'tiptap-editor' ),
			[ $this, 'render_toolbar_preset_field' ],
			'tiptap-editor',
			'tiptap_editor_options_section'
		);

		// Section: Status.
		add_settings_section(
			'tiptap_editor_status_section',
			__( 'Status', 'tiptap-editor' ),
			[ $this, 'render_status_section' ],
			'tiptap-editor'
		);
	}

	/**
	 * Render the full settings page.
	 */
	public function render_settings_page(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		?>
		<div class="wrap">
			<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
			<form action="options.php" method="post">
				<?php
				settings_fields( 'tiptap_editor' );
				do_settings_sections( 'tiptap-editor' );
				submit_button();
				?>
			</form>
		</div>
		<?php
	}

	/**
	 * Render the Post Types section description.
	 */
	public function render_post_types_section_description(): void {
		echo '<p>' . esc_html__( 'Select the post types where TipTap Editor should replace TinyMCE.', 'tiptap-editor' ) . '</p>';
	}

	/**
	 * Render the post types checkbox list.
	 */
	public function render_post_types_field(): void {
		$saved         = (array) get_option( 'tiptap_editor_post_types', [] );
		$all_post_types = get_post_types( [ 'public' => true ], 'objects' );

		echo '<fieldset>';
		foreach ( $all_post_types as $post_type ) {
			$uses_block_editor = function_exists( 'use_block_editor_for_post_type' )
				&& use_block_editor_for_post_type( $post_type->name );

			$checked  = in_array( $post_type->name, $saved, true );
			$disabled = $uses_block_editor;

			printf(
				'<label style="display:block;margin-bottom:4px;">',
			);
			printf(
				'<input type="checkbox" name="tiptap_editor_post_types[]" value="%s"%s%s> %s',
				esc_attr( $post_type->name ),
				checked( $checked, true, false ),
				$disabled ? ' disabled' : '',
				esc_html( $post_type->label )
			);
			if ( $uses_block_editor ) {
				echo ' <span class="description">' . esc_html__( '(Block editor — TipTap not available)', 'tiptap-editor' ) . '</span>';
			}
			echo '</label>';
		}
		echo '</fieldset>';
	}

	/**
	 * Render the toolbar preset field.
	 */
	public function render_toolbar_preset_field(): void {
		$current = (string) get_option( 'tiptap_editor_toolbar_preset', 'standard' );
		$options = [
			'minimal'  => __( 'Minimal (bold, italic, links only)', 'tiptap-editor' ),
			'standard' => __( 'Standard (recommended)', 'tiptap-editor' ),
			'full'     => __( 'Full (all formatting options)', 'tiptap-editor' ),
		];

		echo '<select name="tiptap_editor_toolbar_preset">';
		foreach ( $options as $value => $label ) {
			printf(
				'<option value="%s"%s>%s</option>',
				esc_attr( $value ),
				selected( $current, $value, false ),
				esc_html( $label )
			);
		}
		echo '</select>';
	}

	/**
	 * Render the status section — PHP version, WP version, AI notice.
	 */
	public function render_status_section(): void {
		$wp_version  = Tiptap_Editor_Version_Compat::wp_version();
		$php_version = PHP_VERSION;
		$has_ai      = Tiptap_Editor_Version_Compat::has_abilities_api();
		?>
		<table class="widefat striped" style="max-width:600px;">
			<tbody>
				<tr>
					<th scope="row"><?php esc_html_e( 'WordPress version', 'tiptap-editor' ); ?></th>
					<td><?php echo esc_html( $wp_version ); ?></td>
				</tr>
				<tr>
					<th scope="row"><?php esc_html_e( 'PHP version', 'tiptap-editor' ); ?></th>
					<td><?php echo esc_html( $php_version ); ?></td>
				</tr>
				<tr>
					<th scope="row"><?php esc_html_e( 'AI writing features', 'tiptap-editor' ); ?></th>
					<td>
						<?php if ( $has_ai ) : ?>
							<span class="dashicons dashicons-yes-alt" style="color:#00a32a;"></span>
							<?php esc_html_e( 'Available', 'tiptap-editor' ); ?>
						<?php else : ?>
							<span class="dashicons dashicons-info" style="color:#72aee6;"></span>
							<?php esc_html_e( 'Upgrade to WordPress 7.0 to unlock AI writing assistance.', 'tiptap-editor' ); ?>
						<?php endif; ?>
					</td>
				</tr>
			</tbody>
		</table>
		<?php
	}

	/**
	 * Sanitize the post types option.
	 *
	 * @param  mixed $value Raw input.
	 * @return string[] Sanitized array of post type slugs.
	 */
	public function sanitize_post_types( mixed $value ): array {
		if ( ! is_array( $value ) ) {
			return [];
		}
		$registered = get_post_types( [ 'public' => true ] );
		return array_values(
			array_filter(
				array_map( 'sanitize_key', $value ),
				static fn( string $pt ): bool => isset( $registered[ $pt ] )
			)
		);
	}

	/**
	 * Sanitize the toolbar preset option.
	 *
	 * @param  mixed $value Raw input.
	 * @return string Sanitized preset slug.
	 */
	public function sanitize_toolbar_preset( mixed $value ): string {
		$allowed = [ 'minimal', 'standard', 'full' ];
		$value   = sanitize_key( (string) $value );
		return in_array( $value, $allowed, true ) ? $value : 'standard';
	}
}
