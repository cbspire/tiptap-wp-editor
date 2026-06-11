=== TipTap Editor ===
Contributors: cbspire
Tags: editor, rich text, tiptap, prosemirror, tinymce
Requires at least: 6.8
Tested up to: 7.0
Requires PHP: 8.0
Stable tag: 0.1.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

A modern, focused rich text editor built on TipTap/ProseMirror. Replaces TinyMCE for opted-in post types. AI writing features on WP 7.0+.

== Description ==

TipTap Editor replaces TinyMCE with a modern, clean rich text editor for opted-in post types. It does not touch Gutenberg-enabled post types or conflict with the block editor.

Want to try it first? [Launch a live demo in WordPress Playground](https://playground.wordpress.net/?blueprint-url=https://raw.githubusercontent.com/cbspire/tiptap-wp-editor/main/blueprint.json) — no installation required.

**Key features:**

* Post editor replacement for Classic Editor users and custom post types
* Meta box / field mode via `tiptap_field()` helper
* Shortcode support — shortcodes render as atomic, non-editable chips
* `<!--more-->` divider support
* WP Media Library integration
* AI writing features on WP 7.0+ (via the Abilities API — no bundled AI provider)

**AI writing features (WP 7.0+ only):**

AI features are progressive enhancement — completely absent on WP 6.8/6.9, automatically enabled on WP 7.0+. No API keys required. Works with any AI provider connected via Settings > Connectors.

== Installation ==

1. Upload the `tiptap-editor` folder to `/wp-content/plugins/`
2. Activate via Plugins > Installed Plugins
3. Go to Settings > TipTap Editor to select which post types use the editor
4. (Optional) On WP 7.0+: connect an AI provider via Settings > Connectors

== Frequently Asked Questions ==

= Does this replace Gutenberg? =

No. TipTap Editor only activates on post types that do not use Gutenberg. It will never interfere with the block editor.

= Does it work with my existing content? =

Yes. TipTap saves HTML to `post_content` in the same format as TinyMCE. No content migration is needed.

= Are AI features free? =

The plugin itself is free. AI features on WP 7.0+ use whatever AI provider you connect via Settings > Connectors. Provider costs depend on your provider choice.

= Does the plugin send my content to external services? =

No. The plugin makes zero external API calls. AI requests go through WordPress core's Abilities API and AI Client, using the provider you configured in Settings > Connectors.

= Why is wpautop disabled for TipTap post types? =

TipTap saves HTML with correct paragraph tags already in place. Running wpautop on it would double the paragraphs, so the plugin disables wpautop — only for the post types where you explicitly enabled TipTap.

== Changelog ==

= 0.1.0 =
* Initial release.

== Upgrade Notice ==

= 0.1.0 =
Initial release.
