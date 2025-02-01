import * as vscode from 'vscode';
import { Workspace } from '../models/workspace';
import { StoryTreeProvider } from '../storyTreeProvider';

/**
 * Loads pending tasks for all workspaces and updates the story tree view.
 * Shows a progress notification while fetching tasks and handles any errors.
 * 
 * @param {Workspace[]} workspaces - Array of workspaces to fetch pending tasks for
 * @param {StoryTreeProvider} storyTreeProvider - Provider for the story tree view
 * @returns {Promise<void>} A promise that resolves when all tasks are loaded
 * @throws {Error} If there's an error fetching pending tasks
 */
export const loadPendingTasks = async (workspaces: Workspace[], storyTreeProvider: StoryTreeProvider) => {
    try {
		await vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: "Fetching Pending tasks...",
			cancellable: false
		}, async (progress) => {
			for (const workspace of workspaces) {
				await workspace.getPendingStories();
				storyTreeProvider.refresh(workspaces);
			}

			if (workspaces.length === 0) {
				vscode.window.showInformationMessage('No workspaces found in Shortcut.');
			}
		});
	} catch (error: any) {
		vscode.window.showErrorMessage(`Error fetching Pending tasks: ${error.message}`);
	}
};
