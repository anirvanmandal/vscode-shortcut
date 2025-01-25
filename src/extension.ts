// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ShortcutClient } from '@shortcut/client';
import { StoryTreeProvider } from './storyTreeProvider';

import { BaseModel } from './models/base';
import { Workspace } from './models/workspace';
import { loadWorkspaces } from './lib/loadWorkspaces';
import { markTaskAsComplete } from './lib/markTaskAsComplete';

// Add this helper function to get configuration
function getConfiguration(): vscode.WorkspaceConfiguration {
	return vscode.workspace.getConfiguration('shortcutTasks');
}

let apiTokens: object[] | undefined;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	updateFromConfig(getConfiguration());
	BaseModel.context = context;
	let workspaces: Workspace[] = [];

	const storyTreeProvider = new StoryTreeProvider();
	
	console.log('Congratulations, your extension "vscode-shortcut-tasks" is now active!');

	const treeView = vscode.window.createTreeView('shortcutStories', {
		treeDataProvider: storyTreeProvider
	});
	
	storyTreeProvider.refresh([]);

	context.subscriptions.push(treeView);

	if (apiTokens) {
		for (const token of apiTokens) {
			const tokenObj = token as { token: string; workspace: string };
			const client = new ShortcutClient(tokenObj.token);
			const workspace = new Workspace(tokenObj.workspace, client, []);
			workspaces.push(workspace);
		}
	}

	storyTreeProvider.refresh(workspaces);
	loadWorkspaces(workspaces, storyTreeProvider);

	// Register command to fetch tasks
	let disposable = vscode.commands.registerCommand('shortcutStories.fetchShortcutTasks', async () => {
		loadWorkspaces(workspaces, storyTreeProvider);
	});

	// Listen for configuration changes
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration('shortcutTasks')) {
				const config = getConfiguration();
				updateFromConfig(config);
				loadWorkspaces(workspaces, storyTreeProvider);
			}
		})
	);

	context.subscriptions.push(vscode.commands.registerCommand('shortcutStories.completeTask', async (item: any) => {
		markTaskAsComplete(item.workspace, item.taskId, item.storyId);
	}));

	context.subscriptions.push(disposable);
	context.subscriptions.push(vscode.commands.registerCommand('shortcutStories.openStory', async (item: any) => {
		vscode.env.openExternal(vscode.Uri.parse(item.story.app_url));
	}));
}

function updateFromConfig(config: vscode.WorkspaceConfiguration) {
	apiTokens = config.get<object[]>('apiTokens');
}

// This method is called when your extension is deactivated
export function deactivate() {}
