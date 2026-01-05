CHANGELOG.md
# Changelog

All notable changes to the "Latte Formatter" extension will be documented in this file.

## [1.0.2] - 2026-01-05

### Fixed
- Fixed broken indentation when Latte block tags (`{if}`, `{foreach}`, etc.) appear inside HTML tag declarations (e.g., conditional attributes like `{if $active}checked{/if}`)
- PHP arrow operators (`->`) in Latte tags no longer interfere with HTML tag detection

## [1.0.0] - 2025-01-02

### Added
- Initial release
- HTML formatting for Latte templates using VS Code's native HTML formatter
- Support for all standard Latte block tags
- Preserves Latte syntax during formatting
- Format on save support
