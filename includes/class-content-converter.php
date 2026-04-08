<?php
/**
 * HTML <> TipTap conversion helpers.
 *
 * @package TiptapEditor
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Tiptap_Editor_Content_Converter {
	/**
	 * Extract shortcodes and replace them with stable placeholder tokens.
	 *
	 * @param string $html Input HTML.
	 * @return array{tokenized_html:string,shortcode_map:array<string,string>}
	 */
	public static function extract_shortcodes( string $html ): array {
		$shortcode_map = array();
		$index         = 0;

		$pattern = self::shortcode_pattern();

		$tokenized_html = preg_replace_callback(
			$pattern,
			static function ( array $matches ) use ( &$shortcode_map, &$index ): string {
				$shortcode = $matches[0];
				$token     = sprintf( '%%TTE_SC_%d%%', $index );

				$shortcode_map[ $token ] = $shortcode;
				$index++;

				return $token;
			},
			$html
		);

		if ( null === $tokenized_html ) {
			$tokenized_html = $html;
		}

		return array(
			'tokenized_html' => $tokenized_html,
			'shortcode_map'  => $shortcode_map,
		);
	}

	/**
	 * Normalize common wpautop artifacts before TipTap parsing.
	 *
	 * @param string $html Input HTML.
	 * @return string
	 */
	public static function normalize_wpautop_artifacts( string $html ): string {
		$normalized = str_replace( array( "\r\n", "\r" ), "\n", $html );

		$normalized = preg_replace( '#<p>\s*(<br\s*/?>)\s*</p>#i', '', $normalized ) ?? $normalized;
		$normalized = preg_replace( '#(<br\s*/?>\s*){2,}#i', '<br />', $normalized ) ?? $normalized;
		$normalized = preg_replace( '#<p>\s*(</?(?:div|section|article|aside|blockquote|ul|ol|li|h[1-6])[^>]*>)\s*</p>#i', '$1', $normalized ) ?? $normalized;
		$normalized = preg_replace( '#\n{3,}#', "\n\n", $normalized ) ?? $normalized;

		return trim( $normalized );
	}

	/**
	 * Re-inject shortcodes back into placeholder-marked HTML.
	 *
	 * @param string               $tokenized_html Tokenized HTML.
	 * @param array<string,string> $shortcode_map Shortcode map.
	 * @return string
	 */
	public static function reinject_shortcodes( string $tokenized_html, array $shortcode_map ): string {
		return strtr( $tokenized_html, $shortcode_map );
	}

	/**
	 * Get a shortcode extraction regex pattern.
	 *
	 * @return string
	 */
	private static function shortcode_pattern(): string {
		if ( function_exists( 'get_shortcode_regex' ) ) {
			return '/' . get_shortcode_regex() . '/';
		}

		return '/\[(?:[a-zA-Z0-9_-]+)(?:\s[^\]]*)?(?:\/(?:\])|\](?:.*?)\[\/[a-zA-Z0-9_-]+\]|\])/s';
	}
}
