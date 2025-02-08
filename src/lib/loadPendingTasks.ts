import * as vscode from 'vscode';
import { Workspace } from '../models/workspace';
import { StoryTreeProvider } from '../storyTreeProvider';
import { Config } from '../models/config';

/**
 * Loads pending tasks for all workspaces and updates the story tree view.
 * Shows a progress notification while fetching tasks and handles any errors.
 * 
 * For each workspace, it:
 * 1. Fetches pending stories via the Shortcut API
 * 2. Updates the tree view to reflect the new stories
 * 3. Shows a notification if no workspaces are found
 * 
 * @param {Workspace[]} workspaces - Array of workspaces to fetch pending tasks for
 * @param {StoryTreeProvider} storyTreeProvider - Provider for the story tree view
 * @param {Config} config - Configuration settings for the extension
 * @returns {Promise<void>} A promise that resolves when all tasks are loaded
 * @throws {Error} If there's an error fetching pending tasks from the API
 */
export const loadPendingTasks = async (
    workspaces: Workspace[],
    storyTreeProvider: StoryTreeProvider,
    config: Config
): Promise<void> => {
    try {
		await vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: "Fetching Pending tasks. Workspace: ",
			cancellable: false
		}, async (progress) => {
			for (const workspace of workspaces) {
				progress.report({message: `${workspace.name}` });
				await workspace.getPendingStories();
				progress.report({ increment: ((1 / workspaces.length) * 100)});
				storyTreeProvider.refresh(workspaces, config);
			}

			if (workspaces.length === 0) {
				vscode.window.showInformationMessage('No workspaces found in Shortcut.');
			}
		});
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (error: any) {
		vscode.window.showErrorMessage(`Error fetching Pending tasks: ${error.message}`);
	}
};
