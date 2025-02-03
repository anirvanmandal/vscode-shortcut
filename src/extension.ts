// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { StoryTreeProvider } from './storyTreeProvider';
import { AssignedStoryTreeProvider } from './assignedStoryTreeProvider';

import { BaseModel } from './models/base';
import { Workspace } from './models/workspace';
import { loadPendingTasks } from './lib/loadPendingTasks';
import { loadAssignedStories } from './lib/loadAssignedStories';
import { markTaskAsComplete } from './lib/markTaskAsComplete';

/**
 * Retrieves the Shortcut extension configuration from VS Code settings.
 * @returns {vscode.WorkspaceConfiguration} The extension's configuration
 */
function getConfiguration(): vscode.WorkspaceConfiguration {
	return vscode.workspace.getConfiguration('shortcut');
}

let apiTokens: object | undefined;

/**
 * Activates the extension and sets up all necessary components.
 * This includes:
 * - Setting up tree views for pending tasks and assigned stories
 * - Initializing workspaces with API tokens
 * - Registering commands for task management
 * - Setting up configuration change listeners
 * 
 * @param {vscode.ExtensionContext} context - The VS Code extension context
 * @returns {Promise<void>} A promise that resolves when activation is complete
 */
export async function activate(context: vscode.ExtensionContext) {
	updateFromConfig(getConfiguration());
	BaseModel.context = context;
	let workspaces: Workspace[] = [];

	const storyTreeProvider = new StoryTreeProvider();
	const assignedStoryTreeProvider = new AssignedStoryTreeProvider();
	
	console.log('Congratulations, your extension "vscode-shortcut-tasks" is now active!');

	const treeView = vscode.window.createTreeView('pendingTasks', {
		treeDataProvider: storyTreeProvider
	});

	const assignedTreeView = vscode.window.createTreeView('assignedStories', {
		treeDataProvider: assignedStoryTreeProvider
	});
	
	storyTreeProvider.refresh([]);
	assignedStoryTreeProvider.refresh([]);

	context.subscriptions.push(treeView);
	context.subscriptions.push(assignedTreeView);

	workspaces = await Workspace.get(apiTokens);

	storyTreeProvider.refresh(workspaces);
	assignedStoryTreeProvider.refresh(workspaces);
	loadPendingTasks(workspaces, storyTreeProvider);
	loadAssignedStories(workspaces, assignedStoryTreeProvider);

	// Register command to fetch tasks
	let pendingTasksDisposable = vscode.commands.registerCommand('shortcut.pendingTasks.fetchStories', async () => {
		loadPendingTasks(workspaces, storyTreeProvider);
	});

	let assignedStoriesDisposable = vscode.commands.registerCommand('shortcut.assignedStories.fetchStories', async () => {
		loadAssignedStories(workspaces, assignedStoryTreeProvider);
	});

	// Listen for configuration changes
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration(async e => {
			if (e.affectsConfiguration('shortcut')) {
				const config = getConfiguration();
				updateFromConfig(config);
				Workspace.deleteCache(workspaces);
				workspaces = await Workspace.get(apiTokens);
				loadPendingTasks(workspaces, storyTreeProvider);
				loadAssignedStories(workspaces, assignedStoryTreeProvider);
			}
		})
	);

	context.subscriptions.push(vscode.commands.registerCommand('shortcut.pendingTasks.completeTask', async (item: any) => {
		markTaskAsComplete(item.workspace, item.taskId, item.storyId);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('shortcut.copyBranchName', async (item: any) => {
		vscode.env.clipboard.writeText(item.story.branchName(item.workspace));
	}));

	context.subscriptions.push(pendingTasksDisposable);
	context.subscriptions.push(assignedStoriesDisposable);
	
	context.subscriptions.push(vscode.commands.registerCommand('shortcut.openStory', async (item: any) => {
		vscode.env.openExternal(vscode.Uri.parse(item.story.app_url));
	}));

	context.subscriptions.push(vscode.commands.registerCommand('shortcut.refreshWorkspaces', async () => {
		Workspace.deleteCache(workspaces);
		workspaces = await Workspace.get(apiTokens);
		loadPendingTasks(workspaces, storyTreeProvider);
		loadAssignedStories(workspaces, assignedStoryTreeProvider);
	}));
}

/**
 * Updates the extension's configuration from VS Code settings.
 * @param {vscode.WorkspaceConfiguration} config - The new configuration
 */
function updateFromConfig(config: vscode.WorkspaceConfiguration) {
	apiTokens = config.get<object[]>('apiTokens');
}

/**
 * Handles cleanup when the extension is deactivated.
 * Currently no cleanup is needed.
 */
export function deactivate() {}
