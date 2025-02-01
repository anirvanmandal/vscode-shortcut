# VSCode Shortcut Extension

This extension helps you manage your Shortcut tasks directly within VSCode. It seamlessly integrates with Shortcut to display and manage tasks across all your workspaces, making task management more efficient and accessible.

## Features

- 📋 View all pending tasks from your Shortcut stories
- ✅ Mark tasks as complete directly from VSCode
- 🔄 Fetch latest tasks with a single click
- 🔗 Quick access to open stories in Shortcut
- 👤 Personal task list filtered for the current workspace member

## Requirements

- A Shortcut account and API token
- Visual Studio Code version 1.60.0 or higher

## Extension Settings

This extension contributes the following settings:

- `shortcut.apiTokens`

```json
{
    "shortcutTasks.apiTokens": {
        "Workspace One": "11111111-1111-1111-1111-111111111111",
        "Workspace Two": "22222222-2222-2222-2222-222222222222"
    }
}
```

## Setup

1. Install the extension from the VS Code marketplace
2. Open VS Code settings
3. Add your Shortcut API token in the `shortcut.apiTokens` settings
4. The settings should look like this:

## Usage

1. Open the command palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Type "Shortcut" to see available commands:
   - `Shortcut: Refresh Tasks` - Fetch latest tasks
   - `Shortcut: View Tasks` - Display your task list
   - `Shortcut: Complete Task` - Mark selected task as complete

## Known Issues

No known issues at this time. Please report any bugs on our GitHub repository.

## See [CHANGELOG.md](./CHANGELOG.md) for Release Notes

## Contributing

Found a bug or have a feature request? Please open an issue on our GitHub repository.

**Enjoy managing your Shortcut tasks directly in VSCode!**
