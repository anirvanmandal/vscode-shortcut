// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// Update the constant to match the new settings name
const API_TOKEN_SECRET_KEY = 'shortcutTasks.apiToken';

// Add this helper function to get configuration
function getConfiguration(): vscode.WorkspaceConfiguration {
	return vscode.workspace.getConfiguration('shortcutTasks');
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vscode-shortcut-tasks !!" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('vscode-shortcut-tasks.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from vscode-shortcut-tasks!');
	});

	// Register command to set API token
	let setTokenCommand = vscode.commands.registerCommand('vscode-shortcut-tasks.setApiToken', async () => {
		const token = await vscode.window.showInputBox({
			prompt: 'Enter your Shortcut API token',
			password: true, // Masks the input
			placeHolder: 'Paste your API token here'
		});

		if (token) {
			// Store token securely
			await context.secrets.store(API_TOKEN_SECRET_KEY, token);
			vscode.window.showInformationMessage('Shortcut API token stored successfully');
		}
	});

	// Listen for configuration changes
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration('shortcutTasks')) {
				// Reload the configuration
				const config = getConfiguration();
				updateFromConfig(config);
			}
		})
	);

	// Initial configuration load
	const config = getConfiguration();
	updateFromConfig(config);

	context.subscriptions.push(disposable);
	context.subscriptions.push(setTokenCommand);
}

function updateFromConfig(config: vscode.WorkspaceConfiguration) {
	const workspace = config.get<string>('workspace');
	const refreshInterval = config.get<number>('refreshInterval');
	const showNotifications = config.get<boolean>('showNotifications');

	// You can use these values to update your extension's behavior
	console.log(`Configuration updated: workspace=${workspace}, refreshInterval=${refreshInterval}`);
}

// Add this helper function to retrieve the token
async function getApiToken(context: vscode.ExtensionContext): Promise<string | undefined> {
	return await context.secrets.get(API_TOKEN_SECRET_KEY);
}

// This method is called when your extension is deactivated
export function deactivate() {}
