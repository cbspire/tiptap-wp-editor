<?php

use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../includes/class-version-compat.php';

class Test_Version_Compat extends TestCase {
	protected function setUp(): void {
		parent::setUp();
		$GLOBALS['tiptap_test_wp_version']           = '6.8';
		$GLOBALS['tiptap_editor_function_overrides'] = array();
		$GLOBALS['tiptap_editor_script_registry']    = array();
	}

	public function test_has_abilities_api_returns_false_on_legacy(): void {
		$GLOBALS['tiptap_test_wp_version']                              = '6.9';
		$GLOBALS['tiptap_editor_function_overrides']['wp_register_ability'] = true;

		$this->assertFalse( Tiptap_Editor_Version_Compat::has_abilities_api() );
	}

	public function test_has_abilities_api_returns_true_on_wp_7_with_function(): void {
		$GLOBALS['tiptap_test_wp_version']                              = '7.0';
		$GLOBALS['tiptap_editor_function_overrides']['wp_register_ability'] = true;

		$this->assertTrue( Tiptap_Editor_Version_Compat::has_abilities_api() );
	}

	public function test_has_dataviews_requires_registration_and_version(): void {
		$GLOBALS['tiptap_test_wp_version'] = '7.0';
		$this->assertFalse( Tiptap_Editor_Version_Compat::has_dataviews() );

		$GLOBALS['tiptap_editor_script_registry']['wp-dataviews'] = true;
		$this->assertTrue( Tiptap_Editor_Version_Compat::has_dataviews() );
	}

	public function test_admin_ui_tier_switches_between_legacy_and_modern(): void {
		$GLOBALS['tiptap_test_wp_version']                         = '6.8';
		$GLOBALS['tiptap_editor_script_registry']['wp-dataviews'] = true;
		$this->assertSame( 'legacy', Tiptap_Editor_Version_Compat::admin_ui_tier() );

		$GLOBALS['tiptap_test_wp_version'] = '7.0';
		$this->assertSame( 'modern', Tiptap_Editor_Version_Compat::admin_ui_tier() );
	}

	public function test_has_design_tokens_and_ai_client_flags(): void {
		$GLOBALS['tiptap_test_wp_version'] = '7.0';
		$this->assertTrue( Tiptap_Editor_Version_Compat::has_design_tokens() );

		$GLOBALS['tiptap_editor_function_overrides']['wp_register_ability'] = true;
		$this->assertTrue( Tiptap_Editor_Version_Compat::has_ai_client() );
	}
}
