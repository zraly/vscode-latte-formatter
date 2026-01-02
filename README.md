# Latte Formatter

VS Code extension for formatting [Nette Latte](https://latte.nette.org/) templates.

## Features

- **HTML Formatting**: Uses VS Code's native HTML formatter to format your Latte templates
- **Latte Syntax Preservation**: All Latte tags (`{if}`, `{foreach}`, `{block}`, etc.) are preserved and properly indented
- **Respects Your Settings**: Uses your VS Code HTML formatting configuration

## Supported Latte Tags

All standard Latte block tags are supported:

- Conditions: `{if}`, `{ifset}`, `{ifchanged}`, `{switch}`
- Loops: `{foreach}`, `{for}`, `{while}`, `{first}`, `{last}`, `{sep}`, `{iterateWhile}`
- Blocks: `{block}`, `{define}`, `{embed}`, `{snippet}`, `{capture}`
- Forms: `{form}`, `{label}`, `{formContainer}`
- Others: `{translator}`, `{translate}`, `{spaceless}`, `{try}`, `{cache}`, `{sandbox}`

## Installation

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "Latte Formatter"
4. Click Install

## Usage

1. Open a `.latte` file
2. Format the document:
   - **Windows/Linux**: Ctrl+Shift+I
   - **Mac**: Cmd+Shift+I
   - Or right-click → "Format Document"

### Format on Save

Add to your `settings.json`:

```json
{
  "editor.formatOnSave": true,
  "[latte]": {
    "editor.defaultFormatter": "medhi.latte-formatter"
  }
}
```

## Requirements

- VS Code 1.70.0 or higher
- [Nette Latte language support](https://marketplace.visualstudio.com/items?itemName=nicktomlin.latte-vscode) (recommended for syntax highlighting)

## License

MIT
