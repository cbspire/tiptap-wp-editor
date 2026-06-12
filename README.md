# TipTap Editor for WordPress

[![Build & Release](https://github.com/cbspire/tiptap-wp-editor/actions/workflows/build-release.yml/badge.svg?branch=main)](https://github.com/cbspire/tiptap-wp-editor/actions/workflows/build-release.yml)
[![Try in WordPress Playground](https://img.shields.io/badge/Try_it-WordPress_Playground-3858e9?logo=wordpress&logoColor=white)](https://playground.wordpress.net/?blueprint-url=https://raw.githubusercontent.com/cbspire/tiptap-wp-editor/main/blueprint.json)

A modern, focused rich text editor for WordPress built on [TipTap](https://tiptap.dev/)/[ProseMirror](https://prosemirror.net/). Replaces TinyMCE for opted-in post types — without touching Gutenberg. AI writing features light up automatically on WordPress 7.0+ via the Abilities API.

## 🚀 Try it now

**[Launch the demo in WordPress Playground](https://playground.wordpress.net/?blueprint-url=https://raw.githubusercontent.com/cbspire/tiptap-wp-editor/main/blueprint.json)** — no install required. It spins up a throwaway **WordPress 7.0** site in your browser with the [Classic Editor](https://wordpress.org/plugins/classic-editor/) plugin (no Gutenberg — the scenario TipTap Editor is built for) and the latest `main` build of this plugin installed, activated, and enabled for posts. You land on the plugin's DataViews settings page; open any post to see the editor itself.

The demo installs the `tiptap-editor.zip` asset from the rolling [`latest` release](https://github.com/cbspire/tiptap-wp-editor/releases/tag/latest), which is rebuilt automatically on every push to `main`.

## Features

- **Drop-in TinyMCE replacement** — saves plain HTML to `post_content`, exactly like TinyMCE. Zero content migration, in either direction.
- **Gutenberg-safe** — never activates on post types that use the block editor. Checked at runtime.
- **Shortcode preservation** — shortcodes render as atomic, non-editable chips and are preserved verbatim on save.
- **WordPress-native** — `<!--more-->` dividers, Media Library images, raw HTML passthrough blocks.
- **Meta box / field mode** — embed TipTap fields anywhere with the `tiptap_field()` helper.
- **AI writing assistance (WP 7.0+)** — improve, summarise, expand, change tone, generate alt text. Powered entirely by WordPress core's Abilities API and AI Client: the plugin makes **zero** external API calls and requires no API keys. On WP 6.8/6.9 the AI features are completely absent, not just disabled.

## Requirements

| | Minimum |
|---|---|
| WordPress | 6.8 |
| PHP | 8.0 |
| AI features | WordPress 7.0+ with an AI provider connected in *Settings → Connectors* |

## Installation

### From the latest build

1. Download [`tiptap-editor.zip`](https://github.com/cbspire/tiptap-wp-editor/releases/download/latest/tiptap-editor.zip) from the [`latest` release](https://github.com/cbspire/tiptap-wp-editor/releases/tag/latest).
2. In wp-admin, go to **Plugins → Add New → Upload Plugin** and upload the zip.
3. Activate, then go to **Settings → TipTap Editor** and choose which post types should use the editor.

### From source

```bash
git clone https://github.com/cbspire/tiptap-wp-editor.git
cd tiptap-wp-editor
npm ci
npm run build
```

Then symlink or copy the directory into `wp-content/plugins/`.

## Usage

### Post editor

Enable TipTap per post type under **Settings → TipTap Editor**. TipTap only offers itself for post types that don't use the block editor (e.g. custom post types registered without `show_in_rest`/block editor support, or sites running Classic Editor).

### Field mode

Register a standalone TipTap field in a meta box from your theme or plugin:

```php
tiptap_field( [
    'id'         => 'article_body',
    'post_types' => [ 'article' ],
    'label'      => __( 'Article Body', 'my-textdomain' ),
    'extensions' => [ 'heading', 'image', 'link' ],
    'toolbar'    => 'minimal', // 'minimal' | 'standard' | 'full'
    'ai'         => true,      // Show AI menu when the Abilities API is available.
] );
```

### Hooks

```php
// Filter the post types that use TipTap.
add_filter( 'tiptap_editor_post_types', fn( array $types ) => [ ...$types, 'book' ] );
```

## Development

```bash
npm ci              # Install JS dependencies
npm run build       # Production build → assets/
npm run start       # Dev watch mode
npm run lint:js     # ESLint
npm run lint:css    # Stylelint
npm test            # Vitest (JS unit tests)

composer install    # PHP dev tooling
vendor/bin/phpcs --standard=WordPress includes/   # PHP coding standards
vendor/bin/phpunit                                # PHP unit tests
```

Built files are **not** committed — `assets/js/` and the generated `assets/css/style-*.css` are gitignored and produced by `npm run build`. Only the hand-authored stylesheets in `assets/css/` live in the repo. CI builds the bundles on every push to `main`, so the release zip (and the Playground demo) always contains compiled assets; installing straight from a git checkout requires running the build first.

### Releases

Every push to `main` triggers the [Build & Release workflow](.github/workflows/build-release.yml), which:

1. builds the JS bundles with `@wordpress/scripts`;
2. packages the plugin zip, excluding everything listed in `.distignore`;
3. force-updates the rolling **`latest`** pre-release (titled `latest-<YYYY-MM-DD>`) with the fresh `tiptap-editor.zip`.

The Playground blueprint (`blueprint.json`) always installs from that release, so the demo link above always reflects `main`.

### Architecture

The full specification lives in [`PLAN.md`](PLAN.md); AI-assistant context and conventions in [`CLAUDE.md`](CLAUDE.md). Highlights:

- **`includes/class-version-compat.php`** — every WP version check routes through this single class.
- **`includes/class-content-converter.php`** — safety-critical HTML ↔ TipTap pipeline. Shortcodes are tokenised before TipTap sees the HTML and restored verbatim on save; round-trip fidelity is validated on every save and never blocks saving.
- **Two-tier admin UI/CSS** — WP 6.8/6.9 get a Settings-API page and self-contained CSS; WP 7.0+ gets a React settings page built on [`@wordpress/dataviews`](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-dataviews/) (bundled into `settings-modern.js` — it is not a core script handle) and design-token CSS. The router (`class-admin-ui.php`) hides the difference from the rest of the plugin.

## License

[GPL-2.0-or-later](https://www.gnu.org/licenses/gpl-2.0.html)
