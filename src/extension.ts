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

let apiTokens: object | undefined;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	updateFromConfig(getConfiguration());
	BaseModel.context = context;
	let workspaces: Workspace[] = [];

	const storyTreeProvider = new StoryTreeProvider();
	
	console.log('Congratulations, your extension "vscode-shortcut-tasks" is now active!');

	const treeView = vscode.window.createTreeView('pendingTasks', {
		treeDataProvider: storyTreeProvider
	});
	
	storyTreeProvider.refresh([]);

	context.subscriptions.push(treeView);

	workspaces = await Workspace.get(apiTokens);

	storyTreeProvider.refresh(workspaces);
	loadWorkspaces(workspaces, storyTreeProvider);

	// Register command to fetch tasks
	let disposable = vscode.commands.registerCommand('pendingTasks.fetchShortcutTasks', async () => {
		loadWorkspaces(workspaces, storyTreeProvider);
	});

	// Listen for configuration changes
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration(async e => {
			if (e.affectsConfiguration('pendingTasks')) {
				const config = getConfiguration();
				updateFromConfig(config);
				Workspace.deleteCache(workspaces);
				workspaces = await Workspace.get(apiTokens);
				loadWorkspaces(workspaces, storyTreeProvider);
			}
		})
	);

	context.subscriptions.push(vscode.commands.registerCommand('pendingTasks.completeTask', async (item: any) => {
		markTaskAsComplete(item.workspace, item.taskId, item.storyId);
	}));

	context.subscriptions.push(disposable);
	context.subscriptions.push(vscode.commands.registerCommand('pendingTasks.openStory', async (item: any) => {
		vscode.env.openExternal(vscode.Uri.parse(item.story.app_url));
	}));

	context.subscriptions.push(vscode.commands.registerCommand('refreshWorkspaces', async () => {
		Workspace.deleteCache(workspaces);
		workspaces = await Workspace.get(apiTokens);
		loadWorkspaces(workspaces, storyTreeProvider);
	}));
}

function updateFromConfig(config: vscode.WorkspaceConfiguration) {
	apiTokens = config.get<object[]>('apiTokens');
}

// This method is called when your extension is deactivated
export function deactivate() {}
