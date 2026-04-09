<?php
/**
 * Tests for Tiptap_Editor_Version_Compat.
 *
 * @package TiptapEditor
 */

/**
 * Tests for the version compatibility layer.
 *
 * All feature flags must route through Tiptap_Editor_Version_Compat.
 * These tests verify the flag logic, tier detection, and AI gating.
 */
class Test_Version_Compat extends WP_UnitTestCase {

	/**
	 * wp_version() returns a non-empty string.
	 */
	public function test_wp_version_returns_string(): void {
		$version = Tiptap_Editor_Version_Compat::wp_version();
		$this->assertIsString( $version );
		$this->assertNotEmpty( $version );
	}

	/**
	 * wp_version() matches get_bloginfo('version').
	 */
	public function test_wp_version_matches_bloginfo(): void {
		$this->assertSame(
			get_bloginfo( 'version' ),
			Tiptap_Editor_Version_Compat::wp_version()
		);
	}

	/**
	 * has_design_tokens() returns bool.
	 */
	public function test_has_design_tokens_returns_bool(): void {
		$this->assertIsBool( Tiptap_Editor_Version_Compat::has_design_tokens() );
	}

	/**
	 * has_abilities_api() returns bool.
	 */
	public function test_has_abilities_api_returns_bool(): void {
		$this->assertIsBool( Tiptap_Editor_Version_Compat::has_abilities_api() );
	}

	/**
	 * has_dataviews() returns bool.
	 */
	public function test_has_dataviews_returns_bool(): void {
		$this->assertIsBool( Tiptap_Editor_Version_Compat::has_dataviews() );
	}

	/**
	 * has_ai_client() returns bool.
	 */
	public function test_has_ai_client_returns_bool(): void {
		$this->assertIsBool( Tiptap_Editor_Version_Compat::has_ai_client() );
	}

	/**
	 * admin_ui_tier() returns only 'modern' or 'legacy'.
	 */
	public function test_admin_ui_tier_returns_valid_string(): void {
		$tier = Tiptap_Editor_Version_Compat::admin_ui_tier();
		$this->assertContains( $tier, [ 'modern', 'legacy' ] );
	}

	/**
	 * has_ai_client() matches has_abilities_api().
	 *
	 * AI Client availability is tied to the Abilities API.
	 */
	public function test_has_ai_client_matches_abilities_api(): void {
		$this->assertSame(
			Tiptap_Editor_Version_Compat::has_abilities_api(),
			Tiptap_Editor_Version_Compat::has_ai_client()
		);
	}

	/**
	 * admin_ui_tier() returns 'modern' when has_dataviews() is true.
	 *
	 * We mock has_dataviews() indirectly by confirming the contract:
	 * if tier is 'modern', has_dataviews() must have been true at call time.
	 */
	public function test_admin_ui_tier_consistent_with_dataviews(): void {
		$tier         = Tiptap_Editor_Version_Compat::admin_ui_tier();
		$has_dataviews = Tiptap_Editor_Version_Compat::has_dataviews();

		if ( $has_dataviews ) {
			$this->assertSame( 'modern', $tier );
		} else {
			$this->assertSame( 'legacy', $tier );
		}
	}

	/**
	 * When WP version is below 7.0, has_design_tokens() is false.
	 *
	 * This uses a filter to simulate an older WP version.
	 */
	public function test_has_design_tokens_false_below_7(): void {
		add_filter( 'bloginfo', static function ( string $output, string $show ): string {
			return 'version' === $show ? '6.8' : $output;
		}, 10, 2 );

		$result = Tiptap_Editor_Version_Compat::has_design_tokens();
		$this->assertFalse( $result );

		remove_all_filters( 'bloginfo' );
	}
}
