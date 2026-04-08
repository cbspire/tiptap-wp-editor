# CLAUDE.md — TipTap Editor for WordPress

> AI assistant context file. Describes the codebase structure, conventions, and development workflows.

## Project Status

**This repository is in the planning/specification phase.** The authoritative specification lives in `PLAN.md`. No implementation code exists yet. When implementing, follow `PLAN.md` exactly and build in the prescribed order.

---

## What This Project Is

A WordPress plugin that replaces TinyMCE with a modern TipTap/ProseMirror-based rich text editor. Key properties:

- **Plugin slug:** `tiptap-editor` | **Text domain:** `tiptap-editor`
- **Requires:** WordPress 6.8+, PHP 8.0+
- **License:** GPLv2 or later
- **Target:** WordPress.org plugin directory
- **Launch window:** Post WordPress 7.0 stable release (late April/May 2026)

AI writing features are **progressive enhancement** — fully absent (not disabled, not broken) on WP 6.8/6.9, automatically enabled on WP 7.0+ via the Abilities API.

---

## Repository Layout

```
tiptap-wp-editor/
├── PLAN.md                          # Full project specification (880 lines) — source of truth
├── README.md                        # Stub
├── CLAUDE.md                        # This file
│
│  ── PLANNED (not yet implemented) ──
├── tiptap-editor.php                # Plugin bootstrap: constants, autoloader, Plugin::get_instance()
├── uninstall.php                    # Deletes all plugin options/user meta on uninstall
├── readme.txt                       # WordPress.org format readme
├── includes/
│   ├── class-plugin.php             # Orchestrator singleton
│   ├── class-version-compat.php     # WP version detection & feature flags (P0 — build first)
│   ├── class-editor-registration.php# Registers TipTap per post type, replaces TinyMCE
│   ├── class-meta-box.php           # Meta box / field mode API + ACF integration
│   ├── class-abilities.php          # WP 7.0+ Abilities API (AI features)
│   ├── class-content-converter.php  # HTML ↔ TipTap JSON conversion (safety-critical)
│   ├── class-admin-ui.php           # Router: legacy vs modern settings page
│   ├── class-admin-ui-legacy.php    # Settings page for WP 6.8/6.9 (WP Settings API)
│   ├── class-admin-ui-modern.php    # Settings page for WP 7.0+ (DataViews)
│   └── class-assets.php             # Script/style enqueueing, CSS tier selection
├── src/                             # TypeScript source (compiled to assets/)
│   ├── editor/
│   │   ├── index.ts                 # TipTap editor bootstrap
│   │   ├── extensions/
│   │   │   ├── shortcode.ts         # WPShortcode — atomic non-editable chips
│   │   │   ├── read-more.ts         # <!--more--> visual divider node
│   │   │   ├── raw-html.ts          # WPRawHTML — passthrough HTML block
│   │   │   └── wp-image.ts          # WPImage — WP Media Library integration
│   │   └── toolbar/
│   │       ├── Toolbar.tsx          # Main toolbar component
│   │       └── AIMenu.tsx           # AI abilities menu (WP 7.0+ only)
│   └── admin/
│       ├── settings-legacy.tsx      # Settings UI for WP 6.8/6.9
│       └── settings-modern.tsx      # Settings UI for WP 7.0+ (DataViews)
├── assets/                          # Compiled JS/CSS — committed to repo (WP.org convention)
│   ├── js/
│   │   ├── editor.js                # Single bundle for all WP versions
│   │   ├── settings-legacy.js       # Settings UI for WP 6.8/6.9
│   │   └── settings-modern.js       # Settings UI for WP 7.0+
│   └── css/
│       ├── editor.css               # Base editor styles
│       ├── editor-legacy.css        # Self-contained styles for WP 6.8/6.9
│       ├── editor-modern.css        # Design token-aware styles for WP 7.0+
│       └── admin.css                # Shared admin styles
├── languages/
│   └── tiptap-editor.pot
└── tests/
    ├── bootstrap.php
    ├── test-content-converter.php   # Most important test file
    ├── test-version-compat.php
    ├── test-abilities.php           # WP 7.0+ only
    ├── test-meta-box.php
    └── test-editor-registration.php
```

---

## Build System

**Not yet set up.** When implementing, use:

- **Bundler:** `@wordpress/scripts` (webpack wrapper with WP-specific config)
- **Language:** TypeScript 5.x
- **React:** via `@wordpress/element` (externalised — not bundled)

### Key Dependencies (planned `package.json`)

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

### Planned npm Scripts

```bash
npm run build       # Production build → assets/
npm run start       # Dev watch mode
npm run lint:js     # ESLint
npm run lint:css    # Stylelint
npm test            # Vitest (JS unit tests)
```

### Why `@wordpress/scripts`

It correctly externalises all `@wordpress/*` packages so they load from WP core rather than the bundle. This keeps bundle sizes small and ensures compatibility across WP versions (WP 6.8 ships older `@wordpress/*` versions; WP 7.0 ships React 19).

### Bundle Size Targets

| Bundle | Target (gzipped) |
|--------|-----------------|
| `editor.js` | < 150 KB |
| `settings-legacy.js` | < 30 KB |
| `settings-modern.js` | < 50 KB |
| `editor-legacy.css` | < 15 KB |
| `editor-modern.css` | < 20 KB |

### Compiled Assets Policy

`assets/` **is committed to the repo**. This is WordPress.org convention — the plugin must work without a build step for end users and reviewers. `src/`, `node_modules/`, `package.json`, `tsconfig.json`, `webpack.config.js`, and test files are listed in `.distignore` and excluded from the SVN deploy.

---

## Development Commands

### PHP Tests (planned)

```bash
# Install WP test suite (one-time)
bash bin/install-wp-tests.sh wordpress_test root root localhost latest

# Run all PHP tests
vendor/bin/phpunit

# Run a specific test file
vendor/bin/phpunit tests/test-content-converter.php
```

### JS Tests (planned)

```bash
npm test            # Vitest — all JS unit tests
npm run test:watch  # Watch mode
```

### Linting (planned)

```bash
npm run lint:js                    # ESLint
vendor/bin/phpcs --standard=WordPress includes/  # PHPCS
vendor/bin/phpstan analyse includes/             # PHPStan
```

---

## Architecture & Key Conventions

### 1. Version Compatibility — The Golden Rule

**ALL version checks go through `Tiptap_Editor_Version_Compat`.** No other class calls `version_compare()` or `function_exists()` for WP version features directly.

```php
// CORRECT
if ( Tiptap_Editor_Version_Compat::has_abilities_api() ) { ... }

// WRONG — never do this elsewhere
if ( function_exists( 'wp_register_ability' ) ) { ... }
```

Available flags:
```php
Tiptap_Editor_Version_Compat::has_abilities_api()   // WP 7.0+
Tiptap_Editor_Version_Compat::has_dataviews()        // WP 7.0+
Tiptap_Editor_Version_Compat::has_design_tokens()    // WP 7.0+
Tiptap_Editor_Version_Compat::has_ai_client()        // WP 7.0+
Tiptap_Editor_Version_Compat::admin_ui_tier()        // 'modern' | 'legacy'
```

### 2. Plugin Bootstrap Flow

```
tiptap-editor.php
  → Tiptap_Editor_Plugin::get_instance()    // singleton
    → init() (on 'init' hook):
        new Tiptap_Editor_Editor_Registration()  // all versions
        new Tiptap_Editor_Meta_Box()              // all versions
        new Tiptap_Editor_Admin_UI()              // routes to legacy or modern
        new Tiptap_Editor_Assets()                // all versions
        new Tiptap_Editor_Abilities()             // WP 7.0+ ONLY (gated)
```

### 3. Admin UI — Router Pattern

`class-admin-ui.php` delegates to either the legacy or modern implementation. The rest of the plugin never needs to know which is active:

```php
$this->impl = Tiptap_Editor_Version_Compat::admin_ui_tier() === 'modern'
    ? new Tiptap_Editor_Admin_UI_Modern()
    : new Tiptap_Editor_Admin_UI_Legacy();
```

- **Legacy (WP 6.8/6.9):** Standard WP Settings API, PHP-rendered, no React, only standard WP admin CSS classes (`widefat`, `form-table`, `notice`, etc.)
- **Modern (WP 7.0+):** DataViews React app, enqueues `wp-dataviews` / `wp-components` / `wp-element`, uses WP 7.0 design tokens

### 4. CSS — Two-Tier Strategy

The toolbar HTML is identical on all versions. CSS switches at enqueue time:

```php
$css_handle = Tiptap_Editor_Version_Compat::has_design_tokens()
    ? 'tiptap-editor-modern'   // editor-modern.css — uses WP 7.0 design tokens
    : 'tiptap-editor-legacy';  // editor-legacy.css — self-contained styles
wp_enqueue_style( $css_handle, ... );
```

When writing `editor-modern.css`, always include fallbacks:
```css
/* CORRECT */
background: var(--wp-admin-theme-color-darker-10, #1d2327);

/* WRONG — no fallback */
background: var(--wp-admin-theme-color-darker-10);
```

### 5. AI Features — Progressive Enhancement Pattern

AI features must be **completely absent** (not hidden, not erroring) on WP 6.8/6.9. The gating happens once in `class-plugin.php`:

```php
// PHP side — class never instantiated on WP < 7.0
if ( Tiptap_Editor_Version_Compat::has_abilities_api() ) {
    ( new Tiptap_Editor_Abilities() )->register();
}
```

```typescript
// JS side — component only mounts if flag is true
const showAiMenu = window.tiptapEditorData?.hasAbilitiesApi === true;
{ showAiMenu && <AIMenu editor={editor} /> }
```

PHP injects feature flags via `wp_localize_script`:
```php
wp_localize_script( 'tiptap-editor', 'tiptapEditorData', [
    'hasAbilitiesApi' => Tiptap_Editor_Version_Compat::has_abilities_api(),
    'hasAiClient'     => Tiptap_Editor_Version_Compat::has_ai_client(),
] );
```

### 6. Content Conversion — Safety-Critical

The content conversion pipeline is the most critical code path. **Never silently corrupt content.** Log fidelity loss but never block a save:

```
Load:  HTML → extract shortcodes → normalize → generateJSON() → inject WPShortcode nodes
Save:  TipTap JSON → generateHTML() → restore shortcodes → validate round-trip → save
```

Shortcodes are extracted to `<!--tiptap-sc-{index}-->` tokens before HTML is passed to TipTap, then restored after `generateHTML()`. This preserves arbitrary shortcode strings verbatim.

**Validation rule:** If the normalized round-trip output differs from normalized input, log the diff to a transient and continue. Never throw, never block the save.

### 7. Post Editor Replacement

TipTap replaces TinyMCE for opted-in post types. The hidden `#content` textarea syncs HTML on every editor change so WP's native save flow works unchanged:

```php
echo '<div id="tiptap-editor-root"
          data-post-id="' . esc_attr( $post->ID ) . '"
          data-content="' . esc_attr( wp_json_encode( $post->post_content ) ) . '"
      ></div>';
echo '<textarea id="content" name="content" style="display:none"></textarea>';
```

**Critical:** `wpautop()` must be disabled for TipTap-managed post types (TipTap's HTML already has correct `<p>` tags):

```php
add_filter( 'the_content', function( $content ) {
    if ( tiptap_editor_is_active_post_type( get_post_type() ) ) {
        remove_filter( 'the_content', 'wpautop' );
    }
    return $content;
}, 9 );
```

**Never** activate on post types where `use_block_editor_for_post_type` returns true. Check at runtime, not at activation.

### 8. TipTap Extensions

**StarterKit base:** Document, Paragraph, Text, Bold, Italic, Underline, Strike, Heading (H1–H4), BulletList, OrderedList, ListItem, Blockquote, CodeBlock, HorizontalRule, History, HardBreak.

**WordPress-specific custom extensions:**

| Extension | Behaviour |
|-----------|-----------|
| `WPShortcode` | Atomic non-editable chip; double-click opens edit popover; preserved verbatim in HTML output |
| `WPReadMore` | Visual divider node representing `<!--more-->`; inserted via toolbar button |
| `WPRawHTML` | Passthrough node for arbitrary HTML; never sanitized; rendered as styled "HTML" chip |
| `WPImage` | Opens WP Media Library; stores attachment ID; outputs standard `<img>` with WP classes |
| `WPLink` | Extends base Link; adds `target`, `rel`, WP-specific link classes |

**Output format:** `generateHTML()` → saves to `post_content`. Same format as TinyMCE — zero content migration needed.

### 9. AI REST Endpoint

```
POST /wp-json/tiptap-editor/v1/ability
Authorization: nonce (edit_posts capability required)

{
  "ability": "tiptap/improve-writing",
  "input":   "Selected text...",
  "context": { "post_id": 123, "post_type": "post" }
}
```

Registered abilities: `tiptap/improve-writing`, `tiptap/summarise`, `tiptap/expand`, `tiptap/tone`, `tiptap/alt-text`.

The plugin makes **zero** external API calls — all AI calls go through WP core's Abilities API / AI Client. AI providers are configured by site owners in Settings > Connectors.

### 10. Meta Box / Field Mode

```php
tiptap_field( [
    'id'         => 'article_body',
    'post_types' => [ 'article' ],
    'label'      => __( 'Article Body', 'tiptap-editor' ),
    'extensions' => [ 'heading', 'image', 'link' ],  // subset
    'toolbar'    => 'minimal',   // 'minimal' | 'standard' | 'full'
    'ai'         => true,        // Show AI menu if Abilities API available
] );
```

ACF integration: register as a custom ACF field type. Stores HTML in ACF meta — same format as TinyMCE ACF fields, zero migration.

---

## PHP Code Conventions

- **Naming:** WordPress coding standards — `snake_case` for functions/variables, `PascalCase` for classes, `UPPER_SNAKE_CASE` for constants
- **Class prefix:** `Tiptap_Editor_` on all classes (e.g., `Tiptap_Editor_Version_Compat`)
- **Filename pattern:** `class-{slug}.php` (e.g., `class-version-compat.php`)
- **Singleton pattern** for `class-plugin.php` only
- **Requires PHP 8.0+** — use typed properties, union types, named arguments where appropriate
- **Namespacing:** None (WP convention; class prefix used instead)
- **All REST endpoints** require nonce verification and capability checks (`edit_posts` minimum)
- **Escape all output:** `esc_html()`, `esc_attr()`, `wp_kses_post()` as appropriate
- **No direct DB queries** — use WP options API, post meta API, transients API

## JavaScript/TypeScript Conventions

- **Language:** TypeScript (strict mode)
- **React:** via `@wordpress/element` (externalised) — do not import from `react` directly
- **Component files:** `.tsx` extension; extension modules `.ts`
- **No default exports** — use named exports throughout
- **Feature flags** read from `window.tiptapEditorData` (injected by PHP)
- **`@wordpress/*` packages** are externalised — import them normally, they resolve to WP globals at runtime
- **Tree-shaking:** AI features must tree-shake out of the bundle when `showAiMenu` is false

## CSS Conventions

- **Two CSS tiers:** `editor-legacy.css` (self-contained) and `editor-modern.css` (design tokens)
- **All `var()` usage** in `editor-modern.css` must include fallback values
- **BEM-like class naming** with `.tiptap-` prefix (e.g., `.tiptap-toolbar`, `.tiptap-toolbar__button`)
- No Sass/Less — plain CSS (PostCSS handled by `@wordpress/scripts`)

---

## Version Compatibility Matrix

| Feature | WP 6.8 | WP 6.9 | WP 7.0+ |
|---------|--------|--------|---------|
| Post editor replacement | ✅ | ✅ | ✅ |
| Meta box / field mode | ✅ | ✅ | ✅ |
| Shortcodes, images, read-more | ✅ | ✅ | ✅ |
| Legacy admin UI | ✅ | ✅ | ✅ (fallback) |
| DataViews settings page | ❌ | ❌ | ✅ |
| Design token CSS | ❌ | ❌ | ✅ |
| AI writing features | ❌ | ❌ | ✅ |
| WP AI Client / MCP | ❌ | ❌ | ✅ |

---

## Implementation Order

Build in this sequence — validate each layer before building on top:

1. **Content converter test suite** — build 50 fixture files first, before any conversion code. Tests drive implementation.
2. **`class-version-compat.php`** — foundation; every other class depends on this. Write tests immediately.
3. **`class-content-converter.php`** + **`src/editor/extensions/shortcode.ts`** — safety-critical path. Get conversion right before touching WP integration.
4. **TipTap editor core** (`src/editor/index.ts` + StarterKit + WP extensions) — build and test on a plain HTML page first, no WP.
5. **`class-editor-registration.php`** — hook TipTap into the WP post editor. Test Gutenberg coexistence immediately on both WP 6.8 and WP 7.0.
6. **`class-assets.php`** — enqueueing, version-aware CSS tier selection, externalised `@wordpress/*` deps.
7. **Legacy settings page** (`class-admin-ui-legacy.php` + `settings-legacy.tsx`) — full settings flow on WP 6.8 first.
8. **Modern settings page** (`class-admin-ui-modern.php` + `settings-modern.tsx`) — DataViews on WP 7.0+.
9. **`class-abilities.php`** + **`AIMenu.tsx`** — AI features, WP 7.0+ only.
10. **`class-meta-box.php`** — meta box / field mode + ACF integration.

---

## Testing

### PHP Unit Tests

| File | Covers |
|------|--------|
| `test-content-converter.php` | Shortcode extraction, round-trip fidelity, wpautop normalisation |
| `test-version-compat.php` | Feature flag logic, tier detection, AI gating |
| `test-abilities.php` | Ability registration, REST auth, rate limiting (WP 7.0+ only) |
| `test-meta-box.php` | Field registration, output sanitisation, ACF integration |
| `test-editor-registration.php` | Post type detection, Gutenberg coexistence, wpautop removal |

### JS Tests (Vitest)

| File | Covers |
|------|--------|
| `shortcode.test.ts` | WPShortcode — parse, render, edit, preserve on save |
| `converter.test.ts` | `loadContent`/`saveContent` round-trip with 50 real WP HTML samples |
| `read-more.test.ts` | `<!--more-->` node insertion and serialisation |

### Converter Test Fixtures (50 samples)

Cover these cases in `converter.test.ts`:
- Plain prose (clean HTML)
- Multiple shortcodes
- `[caption]` wrapped images
- `<!--more-->` dividers
- Raw HTML blocks
- Content with Gutenberg block comments (should be preserved as raw HTML)
- Nested shortcodes
- Empty content

### Manual QA Checklist

**WP 6.8/6.9 baseline:**
- [ ] Editor loads on `post` post type after activation
- [ ] Existing post with shortcodes: loads correctly, saves without corruption
- [ ] Post with `<!--more-->`: divider visible, preserved on save
- [ ] Post with `[caption]` image: caption preserved on save
- [ ] Gutenberg-enabled post type: TipTap NOT activated, Gutenberg loads normally
- [ ] AI menu: **completely absent** — not rendered at all
- [ ] Legacy settings page renders, all options save correctly
- [ ] Status panel: shows "Upgrade to WP 7.0 to unlock AI features"
- [ ] `editor-legacy.css` loaded (not modern CSS)

**WP 7.0+ additional:**
- [ ] All 6.8/6.9 baseline tests pass
- [ ] AI menu appears on text selection when provider connected
- [ ] AI menu hidden when no provider connected
- [ ] AI improve-writing: request sent, selection replaced with result
- [ ] DataViews settings page looks native in WP 7.0 admin
- [ ] `editor-modern.css` loaded (design tokens active)
- [ ] `settings-modern.js` enqueued (not legacy)

---

## WP.org Submission Notes

- **Compiled assets** (`assets/`) must be committed alongside `src/` so reviewers can build
- **TipTap** (MIT licensed) is compiled into the bundle; no `node_modules/` in SVN
- **AI features** make zero external calls — all go through WP core's Abilities API; no external service disclosure required from this plugin
- **`wpautop` removal** only occurs for post types where the user has explicitly enabled TipTap; document this clearly in `readme.txt`
- **`.distignore`** excludes `src/`, `node_modules/`, `package.json`, `tsconfig.json`, `webpack.config.js`, `phpcs.xml.dist`, `phpstan.neon`, `tests/`

---

## Key Files to Read First

When starting work on this codebase, read these in order:

1. `PLAN.md` — complete specification (source of truth for all design decisions)
2. `includes/class-version-compat.php` — foundation for all feature gating (build this first)
3. `includes/class-content-converter.php` — safety-critical content pipeline
4. `includes/class-plugin.php` — plugin bootstrap and initialization flow
5. `src/editor/index.ts` — editor bootstrap and TipTap initialization
6. `src/editor/extensions/shortcode.ts` — the most complex custom extension
