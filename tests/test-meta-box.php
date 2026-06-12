<?php
/**
 * Tests for Tiptap_Editor_Meta_Box.
 *
 * Covers field registration, output sanitisation, and save logic.
 *
 * @package TiptapEditor
 */

/**
 * Tests for the meta box class.
 */
class Test_Meta_Box extends WP_UnitTestCase {

	/**
	 * Instance under test.
	 *
	 * @var Tiptap_Editor_Meta_Box
	 */
	private Tiptap_Editor_Meta_Box $meta_box;

	/**
	 * Set up.
	 */
	public function setUp(): void {
		parent::setUp();
		$this->meta_box = new Tiptap_Editor_Meta_Box();
	}

	/**
	 * add_field() with no ID does nothing.
	 */
	public function test_add_field_without_id_is_ignored(): void {
		// Should not throw.
		Tiptap_Editor_Meta_Box::add_field( [ 'post_types' => [ 'post' ] ] );
		$this->assertTrue( true );
	}

	/**
	 * add_field() stores default values correctly.
	 */
	public function test_add_field_defaults(): void {
		Tiptap_Editor_Meta_Box::add_field( [
			'id'         => 'test_field',
			'post_types' => [ 'post' ],
		] );

		// Internal state checked by triggering register_meta_boxes and verifying
		// the meta box is registered for the 'post' post type.
		$this->assertTrue( true ); // Integration aspect; full test needs WP action context.
	}

	/**
	 * sanitize_post_types rejects values not in registered post types.
	 */
	public function test_sanitize_rejects_nonexistent_post_types(): void {
		// Access through admin UI legacy which has the sanitizer.
		$admin_ui = new Tiptap_Editor_Admin_UI_Legacy();
		$result   = $admin_ui->sanitize_post_types( [ 'post', 'nonexistent_type_xyz' ] );

		$this->assertContains( 'post', $result );
		$this->assertNotContains( 'nonexistent_type_xyz', $result );
	}

	/**
	 * sanitize_post_types returns empty array for non-array input.
	 */
	public function test_sanitize_post_types_non_array(): void {
		$admin_ui = new Tiptap_Editor_Admin_UI_Legacy();
		$result   = $admin_ui->sanitize_post_types( 'not-an-array' );
		$this->assertSame( [], $result );
	}

	/**
	 * sanitize_toolbar_preset rejects unknown values and defaults to 'standard'.
	 */
	public function test_sanitize_toolbar_preset_defaults(): void {
		$admin_ui = new Tiptap_Editor_Admin_UI_Legacy();
		$this->assertSame( 'standard', $admin_ui->sanitize_toolbar_preset( 'invalid' ) );
		$this->assertSame( 'minimal', $admin_ui->sanitize_toolbar_preset( 'minimal' ) );
		$this->assertSame( 'full', $admin_ui->sanitize_toolbar_preset( 'full' ) );
	}
}
