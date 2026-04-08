# TipTap Editor for WordPress — Project Plan

> A modern, focused rich text editor built on TipTap/ProseMirror.
> Targets WordPress 6.8+ · PHP 8.0+ · GPLv2 · WP.org distributable
> Launch window: post WordPress 7.0 stable release (late April / May 2026)
> AI features: progressive enhancement — available on WP 7.0+, gracefully absent on 6.8/6.9

-----

## Context & Timing

WordPress 7.0 was originally targeted for April 9, 2026 but has been delayed
slightly — the revised release date will be published around April 22, 2026.
This gives us extra runway to build against the final API surface before launch.

**Why WP 7.0 is the right moment to launch this plugin:**

- New unified admin design system (design tokens, DataViews aesthetic) means
  our editor UI can look native without fighting legacy admin CSS on 7.0+
- The Abilities API + WP AI Client give us a standardised way to add AI writing
  features on 7.0+ — no hardcoded API keys, no separate settings screen
- MCP support means AI agents can interact with our editor’s capabilities
  programmatically on 7.0+ — the platform is actively designed for this
- React 19 upgrade in core aligns with TipTap’s modern JS architecture
- PHP 7.4 minimum (8.0+ recommended) clears the way for clean modern PHP

**Why also supporting WP 6.8 / 6.9 makes sense:**

- The core editor replacement and meta box field mode work identically on 6.8+
  — no 7.0 APIs are required for them
- WP 6.8 / 6.9 represents a huge share of active installs in 2026 — many sites
  running on managed hosting will lag behind the 7.0 upgrade for months
- AI features become a compelling upgrade incentive: “Update to WP 7.0 to
  unlock AI writing assistance” is a better story than “not supported”
- The admin UI degrades gracefully — on 6.8/6.9 we fall back to standard
  legacy admin styles; on 7.0+ we use design tokens and DataViews

**Version compatibility matrix:**

|Feature                             |WP 6.8|WP 6.9|WP 7.0+     |
|------------------------------------|------|------|------------|
|TipTap post editor replacement      |✅     |✅     |✅           |
|Meta box / field mode               |✅     |✅     |✅           |
|Shortcode, image, read-more nodes   |✅     |✅     |✅           |
|Legacy admin UI (standard WP styles)|✅     |✅     |✅ (fallback)|
|DataViews-native settings page      |❌     |❌     |✅           |
|Design token-aware toolbar          |❌     |❌     |✅           |
|AI writing features (Abilities API) |❌     |❌     |✅           |
|WP AI Client / MCP integration      |❌     |❌     |✅           |

-----

## Plugin Identity

|Field            |Value         |
|-----------------|--------------|
|Plugin Name      |TipTap Editor |
|Slug             |tiptap-editor |
|Text Domain      |tiptap-editor |
|Requires at least|6.8           |
|Requires PHP     |8.0           |
|License          |GPLv2 or later|
|Tested up to     |7.0           |

-----

## What It Does (Scope)

A focused, clean rich text editor that replaces TinyMCE in specific contexts:

1. **Post editor replacement** — for Classic Editor users and post types that
   don’t need Gutenberg. Opt-in per post type. Does not touch Gutenberg-enabled
   post types. Does not conflict with Gutenberg. Works on WP 6.8+.
1. **Meta box / field mode** — a `tiptap_editor()` PHP function and a
   `tiptap_field()` helper for registering TipTap fields in custom meta boxes,
   ACF (as a custom field type), and theme options pages. Works on WP 6.8+.
1. **AI writing features** — progressive enhancement on WP 7.0+ only. Integrated
   via the Abilities API and WP AI Client. No bundled AI provider. Works with
   whatever the site owner connects via Settings > Connectors. Completely absent
   (not disabled, not broken — simply not present) on WP 6.8/6.9.
1. **Admin UI** — two tiers:
- WP 6.8/6.9: standard WP admin styles, legacy Settings API settings page
- WP 7.0+: DataViews-native settings page, design token-aware toolbar

**Explicitly out of scope:**

- Replacing Gutenberg or the block editor in any way
- Supporting WordPress < 6.8
- Multisite network editor (v1)
- Real-time collaboration (WP 7.0 handles this for Gutenberg; not our problem)

-----

## Architecture Overview

```
tiptap-editor/
├── tiptap-editor.php                    # Bootstrap: constants, autoloader, Plugin::get_instance()
├── uninstall.php                        # Deletes all plugin options and user meta
├── readme.txt                           # WP.org format
├── includes/
│   ├── class-plugin.php                 # Orchestrator singleton
│   ├── class-version-compat.php         # WP version detection — feature flags
│   ├── class-editor-registration.php   # Registers editor per post type
│   ├── class-meta-box.php              # Meta box / field mode API
│   ├── class-abilities.php             # WP 7.0+ Abilities API integration
│   ├── class-content-converter.php     # HTML ↔ TipTap JSON conversion
│   ├── class-admin-ui.php              # Settings page router (legacy vs DataViews)
│   ├── class-admin-ui-legacy.php       # Settings page for WP 6.8/6.9
│   ├── class-admin-ui-modern.php       # Settings page for WP 7.0+ (DataViews)
│   └── class-assets.php               # Script/style enqueueing
├── src/                                # JS/TS source (compiled to assets/)
│   ├── editor/
│   │   ├── index.ts                    # TipTap editor bootstrap
│   │   ├── extensions/
│   │   │   ├── shortcode.ts           # Shortcode atomic node
│   │   │   ├── read-more.ts           # <!--more--> node
│   │   │   ├── raw-html.ts            # Raw HTML passthrough node
│   │   │   └── wp-image.ts            # WP media library image node
│   │   └── toolbar/
│   │       ├── Toolbar.tsx             # Main toolbar component
│   │       └── AIMenu.tsx              # AI abilities menu (WP 7.0+ only)
│   └── admin/
│       ├── settings-legacy.tsx         # Settings page for WP 6.8/6.9
│       └── settings-modern.tsx         # Settings page for WP 7.0+ (DataViews)
├── assets/                            # Compiled JS/CSS (committed to repo)
│   ├── js/
│   │   ├── editor.js                  # Single editor bundle — works on all versions
│   │   ├── settings-legacy.js         # Settings UI for WP 6.8/6.9
│   │   └── settings-modern.js         # Settings UI for WP 7.0+
│   └── css/
│       ├── editor.css                 # Base editor styles
│       ├── editor-legacy.css          # Legacy admin overrides (6.8/6.9)
│       ├── editor-modern.css          # Design token-aware styles (7.0+)
│       └── admin.css                  # Shared admin styles
├── languages/
│   └── tiptap-editor.pot
└── tests/
    ├── bootstrap.php
    ├── test-content-converter.php
    ├── test-version-compat.php
    ├── test-abilities.php
    └── test-meta-box.php
```

-----

## P0 — Version Compatibility Layer

This is the foundation everything else builds on. All feature flags route
through a single class so version checks never leak into business logic.

### class-version-compat.php

```php
class Tiptap_Editor_Version_Compat {

    /**
     * Whether the current WP installation supports the Abilities API.
     * Requires WP 7.0+. Checked at runtime, not at activation.
     */
    public static function has_abilities_api(): bool {
        return function_exists( 'wp_register_ability' )
            && version_compare( get_bloginfo( 'version' ), '7.0', '>=' );
    }

    /**
     * Whether the current WP installation supports DataViews components.
     * Requires WP 7.0+.
     */
    public static function has_dataviews(): bool {
        return wp_script_is( 'wp-dataviews', 'registered' )
            && version_compare( get_bloginfo( 'version' ), '7.0', '>=' );
    }

    /**
     * Whether the current WP installation supports design tokens.
     * Requires WP 7.0+.
     */
    public static function has_design_tokens(): bool {
        return version_compare( get_bloginfo( 'version' ), '7.0', '>=' );
    }

    /**
     * Whether the current WP installation supports the WP AI Client.
     * Requires WP 7.0+.
     */
    public static function has_ai_client(): bool {
        return self::has_abilities_api();
    }

    /**
     * Returns 'modern' for WP 7.0+, 'legacy' for WP 6.8/6.9.
     * Used to route to the correct admin UI class.
     */
    public static function admin_ui_tier(): string {
        return self::has_dataviews() ? 'modern' : 'legacy';
    }
}
```

**Rule:** No other class calls `version_compare()` or `function_exists()` for
WP version features directly. Everything goes through `Version_Compat`.
This means upgrading WP 6.x behaviour later requires changing exactly one file.

-----

### Extension Stack (StarterKit + WP-specific)

**Base (via StarterKit):**

- Document, Paragraph, Text
- Bold, Italic, Underline, Strike
- Heading (H1–H4)
- BulletList, OrderedList, ListItem
- Blockquote, CodeBlock, HorizontalRule
- History (undo/redo)
- HardBreak

**WordPress-specific custom extensions:**

|Extension    |Purpose                                                                                                                   |
|-------------|--------------------------------------------------------------------------------------------------------------------------|
|`WPShortcode`|Renders shortcodes as atomic, non-editable chips. Double-click opens edit popover. Preserved verbatim in output.          |
|`WPReadMore` |Represents `<!--more-->` as a visual divider node. Inserted via toolbar button.                                           |
|`WPRawHTML`  |Passthrough node for arbitrary HTML blocks. Rendered as a styled “HTML” chip. Never sanitised.                            |
|`WPImage`    |Connects to WP Media Library. Opens media modal on insert. Stores attachment ID. Outputs standard `<img>` with WP classes.|
|`WPLink`     |Extends base Link. Adds `target`, `rel`, and WP-specific link classes.                                                    |

### Output Format

TipTap outputs HTML via `generateHTML()`. This is what gets saved to `post_content` — same as TinyMCE. Zero migration needed for existing content.

**Critical:** `wpautop()` must be disabled for post types using TipTap, or output will have doubled `<p>` tags. Handled via:

```php
// Disable wpautop for TipTap-managed post types
add_filter( 'the_content', function( $content ) {
    if ( tiptap_editor_is_active_post_type( get_post_type() ) ) {
        remove_filter( 'the_content', 'wpautop' );
    }
    return $content;
}, 9 );
```

### HTML → TipTap Conversion (class-content-converter.php)

For loading existing content into the editor:

```
Existing post_content (HTML string)
→ Step 1: Extract shortcodes → replace with placeholder tokens
          preg_replace_callback with get_shortcode_regex()
          Store map: token → original shortcode string
→ Step 2: Normalise wpautop artifacts (strip redundant <br>, fix <p> nesting)
→ Step 3: Pass clean HTML to generateJSON() client-side
          TipTap reconstructs document model from HTML
→ Step 4: Re-inject shortcode nodes
          Token placeholders → WPShortcode nodes with original string
```

On save, reverse the process:

```
TipTap JSON → generateHTML() → raw HTML with shortcode strings intact → save to post_content
```

**Validation step:** After conversion, diff input HTML against round-tripped output.
Log any fidelity loss to a debug transient. Never silently corrupt content.

-----

## P2 — WordPress Integration

### Post Editor Replacement

**How it replaces TinyMCE per post type:**

```php
// Remove TinyMCE and replace with TipTap container
add_action( 'edit_form_after_title', function( WP_Post $post ) {
    if ( ! tiptap_editor_is_active_post_type( $post->post_type ) ) {
        return;
    }

    // Remove default editor
    remove_post_type_support( $post->post_type, 'editor' );

    // Render TipTap mount point
    echo '<div id="tiptap-editor-root"
              data-post-id="' . esc_attr( $post->ID ) . '"
              data-content="' . esc_attr( wp_json_encode( $post->post_content ) ) . '"
          ></div>';

    // Hidden textarea — WP saves from this
    echo '<textarea id="content" name="content" style="display:none"></textarea>';
} );
```

The JS editor syncs its HTML output to the hidden `#content` textarea on every
change, so WP’s native save flow works without modification.

**Post type configuration:**

```php
// In plugin settings, or via filter
add_filter( 'tiptap_editor_post_types', function( array $post_types ): array {
    return array_merge( $post_types, [ 'post', 'article', 'news' ] );
} );
```

Rules:

- Never activate on post types that have `use_block_editor_for_post_type` = true
- Never activate if Classic Editor plugin is not present OR if post type already
  uses a custom editor (check `$wp_filter['the_editor']`)
- Always check `use_block_editor_for_post_type` filter at runtime, not at activation

### Meta Box / Field Mode

Public PHP API:

```php
// Register a TipTap field in a custom meta box
tiptap_field( [
    'id'          => 'article_body',
    'post_types'  => [ 'article' ],
    'label'       => __( 'Article Body', 'tiptap-editor' ),
    'extensions'  => [ 'heading', 'image', 'link' ],  // subset of full extension stack
    'toolbar'     => 'minimal',  // 'minimal' | 'standard' | 'full'
    'ai'          => true,       // Show AI menu if Abilities API available
] );
```

For ACF integration: register as a custom ACF field type that wraps the same
TipTap instance. The field stores HTML in the ACF meta value — same output
format as TinyMCE fields, zero migration for existing ACF data.

-----

## P3 — Admin UI (Dual Tier)

`class-admin-ui.php` acts as a router — it instantiates either
`class-admin-ui-legacy.php` or `class-admin-ui-modern.php` based on
`Version_Compat::admin_ui_tier()`. Both implement the same interface so the
rest of the plugin never needs to know which is active.

```php
class Tiptap_Editor_Admin_UI {
    private Tiptap_Editor_Admin_UI_Base $impl;

    public function __construct() {
        $this->impl = Tiptap_Editor_Version_Compat::admin_ui_tier() === 'modern'
            ? new Tiptap_Editor_Admin_UI_Modern()
            : new Tiptap_Editor_Admin_UI_Legacy();
    }

    public function register(): void {
        $this->impl->register();
    }
}
```

### Legacy Settings Page (WP 6.8 / 6.9)

Standard WP Settings API — familiar to anyone maintaining a WordPress site.
No DataViews, no React. Plain PHP-rendered admin page.

```php
// Registers under Settings menu using standard WP Settings API
add_options_page( 'TipTap Editor', 'TipTap Editor', 'manage_options', 'tiptap-editor', ... );
register_setting( 'tiptap_editor', 'tiptap_editor_post_types' );
register_setting( 'tiptap_editor', 'tiptap_editor_toolbar_preset' );
```

**Page sections (legacy):**

1. **Post Types** — standard WP checkboxes list per registered post type,
   with a note next to Gutenberg-enabled types explaining why they’re disabled
1. **Editor Options** — toolbar preset (minimal / standard / full), heading
   levels
1. **Status** — PHP version, WP version, AI features availability notice:
   *“Upgrade to WordPress 7.0 to unlock AI writing assistance.”*

**Styling:** Uses only standard WP admin classes (`widefat`, `form-table`,
`notice`, etc.). Zero custom CSS for layout — inherits the WP 6.x admin theme.

### Modern Settings Page (WP 7.0+)

DataViews-native React app. Enqueues `wp-dataviews`, `wp-components`,
`wp-element`. Uses WP 7.0 design tokens throughout.

```php
add_action( 'admin_enqueue_scripts', function( string $hook ) {
    if ( 'settings_page_tiptap-editor' !== $hook ) {
        return;
    }
    wp_enqueue_script( 'wp-dataviews' );
    wp_enqueue_script( 'wp-components' );
    wp_enqueue_script( 'wp-element' );
    wp_enqueue_script( 'tiptap-editor-settings-modern', ... );
} );
```

**Page sections (modern):**

1. **Post Types** — DataViews table with toggle, Gutenberg status badge,
   toolbar preset selector inline per row
1. **Editor Options** — component-based form (WP `@wordpress/components`)
1. **AI Features** — status card: connected provider name + model, or CTA
   linking to Settings > Connectors if no provider is configured

### Toolbar UI — Two CSS Tiers

The TipTap toolbar itself renders identically on both versions. The difference
is purely CSS:

**`editor-legacy.css`** — self-contained styles, own color variables. Does not
depend on any WP design tokens. Looks clean and consistent on WP 6.8/6.9 admin.

**`editor-modern.css`** — uses WP 7.0 CSS custom properties:

```css
.tiptap-toolbar {
    background: var(--wp-admin-theme-color-darker-10, #1d2327);
    border-radius: var(--wp--border-radius, 2px);
    font-family: var(--wp--font-family, -apple-system, sans-serif);
    color: var(--wp--color--foreground, #1e1e1e);
}
```

Falls back gracefully if tokens are undefined (defensive `var(token, fallback)`
on every property).

Assets class loads the correct CSS tier:

```php
$css_handle = Tiptap_Editor_Version_Compat::has_design_tokens()
    ? 'tiptap-editor-modern'
    : 'tiptap-editor-legacy';

wp_enqueue_style( $css_handle, ... );
```

-----

## P4 — AI Features (WP 7.0+ Only — Progressive Enhancement)

### Gating Pattern

All AI code is conditional. Nothing AI-related loads, registers, or errors on
WP 6.8/6.9. The check happens once in `class-plugin.php`:

```php
public function init(): void {
    // Always register — works on all versions
    ( new Tiptap_Editor_Editor_Registration() )->register();
    ( new Tiptap_Editor_Meta_Box() )->register();
    ( new Tiptap_Editor_Admin_UI() )->register();
    ( new Tiptap_Editor_Assets() )->register();

    // Abilities API — WP 7.0+ only
    if ( Tiptap_Editor_Version_Compat::has_abilities_api() ) {
        ( new Tiptap_Editor_Abilities() )->register();
    }
}
```

On the JS side, the editor bootstrap reads a `wpData` object injected by PHP:

```php
wp_localize_script( 'tiptap-editor', 'tiptapEditorData', [
    'hasAbilitiesApi' => Tiptap_Editor_Version_Compat::has_abilities_api(),
    'hasAiClient'     => Tiptap_Editor_Version_Compat::has_ai_client(),
    // ...
] );
```

```typescript
// AIMenu only mounts if abilities are available
const showAiMenu = window.tiptapEditorData?.hasAbilitiesApi === true;

// Single editor bundle — AIMenu is tree-shaken if not mounted
{ showAiMenu && <AIMenu editor={editor} /> }
```

### Architecture

WP 7.0’s Abilities API is the key. We **do not** bundle any AI provider or
require any API keys. We register our editor’s capabilities as Abilities, and
we consume the AI Client to run prompts.

```php
// Register TipTap editor abilities so AI agents can discover them
add_action( 'init', function() {
    if ( ! function_exists( 'wp_register_ability' ) ) {
        return; // WP < 7.0 — abilities not available
    }

    wp_register_ability( 'tiptap/improve-writing', [
        'label'       => __( 'Improve Writing', 'tiptap-editor' ),
        'description' => __( 'Rewrite selected text to improve clarity and flow.', 'tiptap-editor' ),
        'callback'    => 'tiptap_ability_improve_writing',
        'schema'      => [
            'input'  => [ 'type' => 'string', 'description' => 'Selected text to improve' ],
            'output' => [ 'type' => 'string', 'description' => 'Improved text' ],
        ],
    ] );

    wp_register_ability( 'tiptap/summarise', [ ... ] );
    wp_register_ability( 'tiptap/expand',   [ ... ] );
    wp_register_ability( 'tiptap/tone',     [ ... ] );
    wp_register_ability( 'tiptap/alt-text', [ ... ] );  // For images
} );
```

### AI Menu in the Editor

A floating AI menu appears on text selection (via TipTap’s BubbleMenu):

```
Selected text → AI ▾
├── Improve writing
├── Make shorter
├── Make longer
├── Change tone →
│   ├── Professional
│   ├── Conversational
│   └── Persuasive
├── Summarise
└── Fix spelling & grammar
```

Each action calls `wp_execute_ability()` via a REST endpoint. The result
replaces the selection or is inserted after it. The site owner’s connected
AI provider (configured in Settings > Connectors) handles the actual inference.

**If no AI provider is connected:**

- AI menu is hidden by default
- Settings page shows a notice: “Connect an AI provider in Settings > Connectors
  to enable AI writing features.”
- Filter `tiptap_editor_show_ai_menu` allows forcing it visible with a custom
  abilities implementation.

### REST Endpoint

```
POST /wp-json/tiptap-editor/v1/ability
{
  "ability": "tiptap/improve-writing",
  "input": "The cat sat on the mat. It was a mat.",
  "context": {
    "post_id": 123,
    "post_type": "post"
  }
}
```

- Authentication: `edit_posts` capability required (nonce-gated)
- Rate limiting: respects WP AI Client’s own rate limiting
- Streaming: returns streamed response if WP AI Client supports it

-----

## P5 — Content Conversion Pipeline

### class-content-converter.php

This is the safety-critical class. Handle with care.

**Server-side (PHP):**

```php
class Tiptap_Editor_Content_Converter {

    /**
     * Prepare HTML content for loading into TipTap.
     * Extracts shortcodes, normalises structure.
     * Returns array: [ 'html' => string, 'shortcodes' => array ]
     */
    public function prepare_for_editor( string $html ): array {
        $shortcodes = [];
        $index      = 0;

        // Extract shortcodes → replace with tokens
        $html = preg_replace_callback(
            '/' . get_shortcode_regex() . '/',
            function( array $matches ) use ( &$shortcodes, &$index ): string {
                $token              = '<!--tiptap-sc-' . $index . '-->';
                $shortcodes[ $index ] = $matches[0];
                $index++;
                return $token;
            },
            $html
        );

        // Strip wpautop artifacts
        $html = $this->normalise_wpautop( $html );

        return [ 'html' => $html, 'shortcodes' => $shortcodes ];
    }

    /**
     * Restore shortcodes after TipTap generates HTML.
     * Called server-side before saving to post_content.
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
     * Logs diff to transient if content changes.
     */
    public function validate_round_trip( string $original, string $result ): bool {
        $original_normalised = $this->normalise_for_comparison( $original );
        $result_normalised   = $this->normalise_for_comparison( $result );

        if ( $original_normalised === $result_normalised ) {
            return true;
        }

        // Log diff — never block save, just warn
        set_transient(
            'tiptap_conversion_diff_' . md5( $original ),
            [ 'original' => $original, 'result' => $result ],
            DAY_IN_SECONDS
        );

        return false;
    }
}
```

**Client-side (TypeScript):**

```typescript
// After PHP prepares the HTML, JS loads it into TipTap
import { generateJSON, generateHTML } from '@tiptap/core';
import { extensions } from './extensions';

export function loadContent( html: string, shortcodes: Record<number, string> ) {
    // Replace shortcode tokens with WPShortcode nodes
    // before passing to generateJSON
    const processed = injectShortcodeNodes( html, shortcodes );
    return generateJSON( processed, extensions );
}

export function saveContent( json: object, shortcodes: Record<number, string> ): string {
    const html = generateHTML( json, extensions );
    // Restore shortcode tokens to original shortcode strings
    return restoreShortcodes( html, shortcodes );
}
```

-----

## P6 — Build System & Assets

### Stack

```json
{
  "devDependencies": {
    "@tiptap/core": "^2.x",
    "@tiptap/starter-kit": "^2.x",
    "@tiptap/extension-image": "^2.x",
    "@tiptap/extension-link": "^2.x",
    "@tiptap/react": "^2.x",
    "@wordpress/scripts": "^28.x",
    "@wordpress/components": "^28.x",
    "@wordpress/element": "^6.x",
    "@wordpress/icons": "^10.x",
    "typescript": "^5.x"
  }
}
```

**Why `@wordpress/scripts`:** It wraps webpack with WP-specific config, correctly
externalises `@wordpress/*` packages (they load from WP core, not our bundle),
and handles RTL CSS generation. This keeps our bundle small and compatible with
WP 7.0’s React 19 upgrade. On WP 6.8/6.9, the `@wordpress/*` externals resolve
to the older versions shipped with those releases — this is handled automatically
by WordPress’s own script versioning.

**Bundle strategy:**

- `editor.js` — single bundle for all WP versions. AI menu is conditional at
  runtime via `tiptapEditorData.hasAbilitiesApi`. No separate builds.
- `settings-legacy.js` — plain React, no `wp-dataviews` dependency. Works on 6.8+.
- `settings-modern.js` — uses `wp-dataviews`, `wp-components`. Only enqueued on 7.0+.

**Bundle size target:**

- `editor.js` < 150KB gzipped (TipTap StarterKit + WP extensions + conditional AI menu)
- `settings-legacy.js` < 30KB gzipped
- `settings-modern.js` < 50KB gzipped (DataViews settings page)
- `editor-legacy.css` < 15KB
- `editor-modern.css` < 20KB (design token-aware)

### What gets committed to the repo

Compiled assets in `assets/` ARE committed. This is WP.org convention — the
plugin must work without a build step for reviewers and end users. The `src/`
directory and `node_modules/` are excluded from the SVN deploy.

```
.distignore
├── src/
├── node_modules/
├── package.json
├── package-lock.json
├── tsconfig.json
├── webpack.config.js
├── phpcs.xml.dist
├── phpstan.neon
└── tests/
```

-----

## P7 — Testing & Quality

### Unit Tests

|File                          |Covers                                                             |
|------------------------------|-------------------------------------------------------------------|
|`test-content-converter.php`  |Shortcode extraction, round-trip fidelity, wpautop normalisation   |
|`test-version-compat.php`     |Feature flag logic, correct tier detection, ability gating         |
|`test-abilities.php`          |Ability registration, REST endpoint auth, rate limiting (7.0+ only)|
|`test-meta-box.php`           |Field registration, output sanitisation, ACF integration           |
|`test-editor-registration.php`|Post type detection, Gutenberg coexistence, wpautop removal        |

### JS Tests (Vitest)

|File               |Covers                                                           |
|-------------------|-----------------------------------------------------------------|
|`shortcode.test.ts`|WPShortcode extension — parse, render, edit, preserve on save    |
|`converter.test.ts`|loadContent / saveContent round-trip with 50 real WP HTML samples|
|`read-more.test.ts`|`<!--more-->` node insertion and serialisation                   |

**The converter test suite is the most important.** Build a fixture set of 50
real-world `post_content` samples covering:

- Plain prose (clean HTML)
- Content with multiple shortcodes
- Content with `[caption]` wrapped images
- Content with `<!--more-->` dividers
- Content with raw HTML blocks
- Content originally authored in Gutenberg (block comments)
- Content with nested shortcodes
- Empty content

Run every sample through `loadContent → saveContent` and assert output
matches input after normalisation.

### Manual QA Checklist

**WP 6.8 / 6.9 (baseline):**

- [ ] Activate plugin → editor loads on `post` post type
- [ ] Existing post with shortcodes: loads correctly, saves without corruption
- [ ] Post with `<!--more-->`: divider visible in editor, preserved on save
- [ ] Post with `[caption]` image: caption preserved on save
- [ ] Gutenberg-enabled CPT: TipTap NOT activated, Gutenberg loads normally
- [ ] AI menu: completely absent (not hidden, not broken — not rendered at all)
- [ ] Settings page: legacy WP admin UI renders correctly, all options save
- [ ] Status panel: shows “Upgrade to WP 7.0 to unlock AI features” notice
- [ ] Meta box field: renders correctly, saves to post meta
- [ ] ACF field type: renders correctly, saves to ACF meta
- [ ] `editor-legacy.css` loaded (not modern CSS)

**WP 7.0+ (enhanced):**

- [ ] All 6.8/6.9 baseline tests pass
- [ ] AI menu: appears on text selection when provider connected
- [ ] AI menu: hidden when no provider connected
- [ ] AI improve-writing: sends request, replaces selection with result
- [ ] DataViews settings page: looks native in WP 7.0 admin
- [ ] Design token CSS loaded (`editor-modern.css`)
- [ ] `settings-modern.js` enqueued (not legacy)

**Cross-version:**

- [ ] PHP 8.0 / 8.1 / 8.2 / 8.3 compatibility on both WP 6.8 and WP 7.0
- [ ] Content created on 6.8 loads correctly after upgrading to 7.0
- [ ] Settings saved on 6.8 persist correctly after upgrading to 7.0

-----

## P8 — WP.org Submission

### WP.org Review Notes (anticipated challenges)

**Challenge 1: Compiled JS assets**
WP.org requires unminified source or a build process that reviewers can run.
Solution: Commit both `src/` (TypeScript source) and `assets/` (compiled) to
the SVN. Include `package.json` and clear build instructions in readme.txt.

**Challenge 2: TipTap dependency**
TipTap is MIT licensed — compatible with GPLv2. However WP.org reviewers may
flag bundled node_modules. Solution: compile TipTap into our bundle via
`@wordpress/scripts` webpack. No `node_modules/` in the SVN, just the compiled
output.

**Challenge 3: AI features**
Reviewers may flag AI features as requiring external service disclosure.
Solution: We make zero external calls ourselves. All AI calls go through WP
core’s own Abilities API / AI Client. The disclosure is WP core’s responsibility,
not ours. Document this clearly in readme.txt.

**Challenge 4: `wpautop` removal**
Reviewers sometimes flag modifications to core content filters. Solution:
Document clearly that `wpautop` is only removed for post types where the user
has explicitly enabled TipTap. It is restored if TipTap is disabled.

### readme.txt Sections

```
=== TipTap Editor ===
Contributors:      yourwporgusername
Tags:              editor, rich text, tiptap, writing, ai
Requires at least: 6.8
Tested up to:      7.0
Stable tag:        1.0.0
Requires PHP:      8.0
License:           GPLv2 or later

A modern, focused rich text editor for WordPress.
Replaces TinyMCE with TipTap on selected post types.
AI writing assistance available on WordPress 7.0+.

== Description ==
...

== Requirements ==
* WordPress 6.8 or higher
* PHP 8.0 or higher
* For AI features: WordPress 7.0+ and an AI provider connected
  via Settings > Connectors

== Installation ==
...

== AI Features ==
AI writing features are available on WordPress 7.0 or higher. They use the
WordPress AI Client API — no API keys are stored by this plugin. AI provider
connections are managed centrally in Settings > Connectors.

On WordPress 6.8 or 6.9, the editor works fully; AI features are simply
not present. Upgrading to WordPress 7.0 enables them automatically.

== Frequently Asked Questions ==

= Does this work with Gutenberg? =
Yes. TipTap Editor does not modify Gutenberg in any way. It only activates
on post types where you have explicitly disabled the block editor, or on
custom meta box fields where you choose to use it.

= Does this work with Classic Editor plugin? =
Yes. TipTap Editor replaces TinyMCE within Classic Editor's editor surface.

= Will my existing content be affected? =
No. TipTap Editor reads and writes standard HTML to post_content — the same
format TinyMCE uses. No content migration is needed.

= Can I use this on WordPress 6.8 or 6.9? =
Yes. The editor works fully on WP 6.8 and 6.9. AI writing features require
WordPress 7.0 or higher.
```

-----

## Implementation Order

Build in this sequence — validate each layer before building on top of it:

- [x] **Content converter test suite** — build fixtures first, before writing any
  conversion code. Tests drive the implementation.
- [x] **`class-version-compat.php`** — the feature flag foundation. Write tests
  for it immediately. Every other class depends on this being correct.
- [ ] **`class-content-converter.php`** + **`src/editor/extensions/shortcode.ts`**
  — the safety-critical path. Get conversion right before touching WP integration.
- [ ] **TipTap editor core** (`src/editor/index.ts` + StarterKit + WP extensions)
  — build and test in isolation (plain HTML page, no WP) first.
- [ ] **`class-editor-registration.php`** — hook TipTap into WP post editor.
  Test Gutenberg coexistence immediately. Test on both WP 6.8 and WP 7.0.
- [ ] **`class-assets.php`** — proper enqueueing, version-aware CSS tier selection,
  externalised `@wordpress/*` deps.
- [ ] **Legacy settings page** (`class-admin-ui-legacy.php` + `settings-legacy.tsx`)
  — get the full settings flow working on 6.8 first.
- [ ] **Modern settings page** (`class-admin-ui-modern.php` + `settings-modern.tsx`)
  — layer DataViews UI on top once legacy is proven.
- [ ] **AI features** (`class-abilities.php` + `AIMenu.tsx`) — register abilities,
  build the bubble menu, test with a real WP 7.0 AI connection. Verify
  complete absence on WP 6.8/6.9.
- [ ] **`class-meta-box.php`** — field mode, `tiptap_field()` API.
- [ ] **Tests** — fill in unit and JS tests alongside each step.
- [ ] **`readme.txt`** + **`uninstall.php`** + **WP.org assets** — launch prep.

-----

## Strategic Notes

**Support 6.8+ but never compromise 7.0 quality.** The progressive enhancement
pattern means 6.8/6.9 users get a great editor, 7.0 users get a great editor
plus AI. Do not let 6.x support drag down the 7.0 experience — the version
compat layer exists precisely to keep those concerns separated.

**The upgrade story is a feature.** “Upgrade to WP 7.0 to unlock AI writing
assistance” gives the plugin a built-in reason to stay relevant as the WP
install base migrates. Track it in the readme and the settings page status panel.

**No AI provider bundled, ever.** This is a principled decision, not laziness.
Bundling OpenAI or Anthropic keys means managing API key security, disclosure
requirements, and pricing conversations. Using WP core’s Abilities API means
the site owner already made those decisions. We just consume the result.

**The conversion pipeline is load-bearing.** If content gets corrupted on
round-trip, the plugin is dead regardless of how good the editor looks. Invest
heavily in the converter test suite before anything else.

**Position against Gutenberg, not against it.** The plugin description should
explicitly say: “If you love Gutenberg, keep using it. This is for the post
types that don’t need blocks.” That framing removes the political friction and
targets exactly the audience that needs this.
