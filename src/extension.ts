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
import { Config } from './models/config';

/**
 * Retrieves the Shortcut extension configuration from VS Code settings.
 * @returns {vscode.WorkspaceConfiguration} The extension's configuration settings
 */
function getConfiguration(): vscode.WorkspaceConfiguration {
	return vscode.workspace.getConfiguration('shortcut');
}

let config: Config;

/**
 * Activates the extension and sets up all necessary components.
 * 
 * Sets up:
 * - Tree views for pending tasks and assigned stories
 * - Initializes workspaces with API tokens from configuration
 * - Registers commands for:
 *   - Fetching pending tasks and assigned stories
 *   - Completing tasks
 *   - Copying branch names
 *   - Opening stories in browser
 *   - Refreshing workspaces
 * - Listens for configuration changes to update workspaces and views
 * 
 * @param {vscode.ExtensionContext} context - The VS Code extension context providing access to extension utilities and resources
 * @returns {Promise<void>} A promise that resolves when activation is complete
 */
export async function activate(context: vscode.ExtensionContext) {
	updateConfig(getConfiguration());
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
	
	storyTreeProvider.refresh([], config);
	assignedStoryTreeProvider.refresh([], config);

	context.subscriptions.push(treeView);
	context.subscriptions.push(assignedTreeView);

	workspaces = await Workspace.get(config.apiTokens);

	storyTreeProvider.refresh(workspaces, config);
	assignedStoryTreeProvider.refresh(workspaces, config);
	loadPendingTasks(workspaces, storyTreeProvider, config);
	loadAssignedStories(workspaces, assignedStoryTreeProvider, config);

	// Register command to fetch pending tasks
	let pendingTasksDisposable = vscode.commands.registerCommand('shortcut.pendingTasks.fetchStories', async () => {
		loadPendingTasks(workspaces, storyTreeProvider, config);
	});

	// Register command to fetch assigned stories
	let assignedStoriesDisposable = vscode.commands.registerCommand('shortcut.assignedStories.fetchStories', async () => {
		loadAssignedStories(workspaces, assignedStoryTreeProvider, config);
	});

	// Listen for configuration changes and update workspaces/views
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration(async e => {
			if (e.affectsConfiguration('shortcut')) {
				updateConfig(getConfiguration());
				Workspace.deleteCache(workspaces);
				workspaces = await Workspace.get(config.apiTokens);
				loadPendingTasks(workspaces, storyTreeProvider, config);
				loadAssignedStories(workspaces, assignedStoryTreeProvider, config);
			}
		})
	);

	// Register command to mark a task as complete
	context.subscriptions.push(vscode.commands.registerCommand('shortcut.pendingTasks.completeTask', async (item: any) => {
		markTaskAsComplete(item.workspace, item.taskId, item.storyId);
	}));

	// Register command to copy story branch name
	context.subscriptions.push(vscode.commands.registerCommand('shortcut.copyBranchName', async (item: any) => {
		vscode.env.clipboard.writeText(item.story.branchName(item.workspace));
	}));

	context.subscriptions.push(pendingTasksDisposable);
	context.subscriptions.push(assignedStoriesDisposable);
	
	// Register command to open story in browser
	context.subscriptions.push(vscode.commands.registerCommand('shortcut.openStory', async (item: any) => {
		vscode.env.openExternal(vscode.Uri.parse(item.story.app_url));
	}));

	// Register command to refresh workspaces and views
	context.subscriptions.push(vscode.commands.registerCommand('shortcut.refreshWorkspaces', async () => {
		Workspace.deleteCache(workspaces);
		workspaces = await Workspace.get(config.apiTokens);
		loadPendingTasks(workspaces, storyTreeProvider, config);
		loadAssignedStories(workspaces, assignedStoryTreeProvider, config);
	}));
}

/**
 * Updates the extension's configuration settings.
 * Creates a new Config instance with the provided VS Code workspace configuration.
 * 
 * @param {vscode.WorkspaceConfiguration} vscodeConfig - The VS Code workspace configuration for the extension
 */
function updateConfig(vscodeConfig: vscode.WorkspaceConfiguration) {
	config = new Config(vscodeConfig);
}

/**
 * Handles cleanup when the extension is deactivated.
 * Currently no cleanup is needed, but this function is required by VS Code's extension API.
 */
export function deactivate() {}
