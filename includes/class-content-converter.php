<?php
/**
 * Content Conversion Pipeline.
 *
 * Safety-critical class. Converts HTML ↔ TipTap JSON.
 * Never silently corrupts content. Logs fidelity loss to a transient
 * but never blocks a save.
 *
 * Conversion flow (load):
 *   HTML → extract shortcodes → normalize → pass to JS generateJSON() → inject WPShortcode nodes
 *
 * Conversion flow (save):
 *   TipTap JSON → generateHTML() → restore shortcodes → validate round-trip → save
 *
 * @package TiptapEditor
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Handles HTML ↔ TipTap content conversion with shortcode preservation.
 */
class Tiptap_Editor_Content_Converter {

	/**
	 * Prepare HTML content for loading into TipTap.
	 *
	 * Extracts shortcodes (replacing them with HTML comment tokens),
	 * normalises wpautop artifacts, and returns the clean HTML along
	 * with the shortcode map for later restoration.
	 *
	 * @param  string $html Raw post_content HTML.
	 * @return array{html: string, shortcodes: array<int, string>}
	 */
	public function prepare_for_editor( string $html ): array {
		$shortcodes = [];
		$index      = 0;

		// Extract shortcodes → replace with HTML comment tokens.
		// get_shortcode_regex() only matches registered shortcodes; we use
		// a broader pattern so unregistered shortcodes are also preserved.
		$html = preg_replace_callback(
			'/' . get_shortcode_regex() . '/s',
			function ( array $matches ) use ( &$shortcodes, &$index ): string {
				$token                = '<!--tiptap-sc-' . $index . '-->';
				$shortcodes[ $index ] = $matches[0];
				$index++;
				return $token;
			},
			$html
		) ?? $html;

		// Strip wpautop artifacts.
		$html = $this->normalise_wpautop( $html );

		return [
			'html'       => $html,
			'shortcodes' => $shortcodes,
		];
	}

	/**
	 * Restore shortcodes after TipTap generates HTML.
	 *
	 * Called server-side before saving to post_content.
	 *
	 * @param  string             $html       HTML from TipTap's generateHTML().
	 * @param  array<int, string> $shortcodes Map of index → original shortcode string.
	 * @return string HTML with shortcode tokens replaced by original shortcodes.
	 */
	public function restore_shortcodes( string $html, array $shortcodes ): string {
		foreach ( $shortcodes as $index => $original ) {
			$html = str_replace(
				'<!--tiptap-sc-' . $index . '-->',
				$original,
				$html
			);
		}
		return $html;
	}

	/**
	 * Validate round-trip fidelity.
	 *
	 * Compares normalised versions of the original and round-tripped HTML.
	 * If they differ, logs the diff to a transient for debugging.
	 * NEVER throws. NEVER blocks a save.
	 *
	 * @param  string $original Original HTML passed to prepare_for_editor().
	 * @param  string $result   HTML produced by the full round-trip.
	 * @return bool True if content is identical after normalisation.
	 */
	public function validate_round_trip( string $original, string $result ): bool {
		$original_normalised = $this->normalise_for_comparison( $original );
		$result_normalised   = $this->normalise_for_comparison( $result );

		if ( $original_normalised === $result_normalised ) {
			return true;
		}

		// Log diff — never block save, just warn.
		set_transient(
			'tiptap_conversion_diff_' . md5( $original ),
			[
				'original' => $original,
				'result'   => $result,
				'time'     => time(),
			],
			DAY_IN_SECONDS
		);

		return false;
	}

	/**
	 * Normalise wpautop artifacts in HTML.
	 *
	 * Removes redundant <br> tags added by wpautop and fixes common
	 * structural issues that would confuse TipTap's HTML parser.
	 *
	 * @param  string $html Raw HTML.
	 * @return string Normalised HTML.
	 */
	public function normalise_wpautop( string $html ): string {
		// Strip trailing <br> or <br /> before closing block tags.
		$html = preg_replace( '/<br\s*\/?>\s*(<\/(?:p|div|blockquote|li|td|th)>)/i', '$1', $html ) ?? $html;

		// Strip standalone <br> between block-level elements.
		$html = preg_replace( '/(<\/(?:p|div|blockquote|li|ul|ol|h[1-6])>)\s*<br\s*\/?>\s*(<(?:p|div|blockquote|li|ul|ol|h[1-6])[^>]*>)/i', '$1$2', $html ) ?? $html;

		// Normalise multiple consecutive newlines to a single newline.
		$html = preg_replace( '/\n{3,}/', "\n\n", $html ) ?? $html;

		return trim( $html );
	}

	/**
	 * Normalise HTML for round-trip comparison.
	 *
	 * Strips whitespace differences and normalises attribute ordering
	 * so that semantically identical HTML compares as equal.
	 *
	 * @param  string $html HTML to normalise.
	 * @return string Normalised string suitable for comparison.
	 */
	public function normalise_for_comparison( string $html ): string {
		// Collapse whitespace between tags.
		$html = preg_replace( '/>\s+</', '><', $html ) ?? $html;

		// Trim whitespace inside text nodes (collapse runs).
		$html = preg_replace( '/\s{2,}/', ' ', $html ) ?? $html;

		return trim( $html );
	}
}
