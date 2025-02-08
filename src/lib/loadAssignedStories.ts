import * as vscode from 'vscode';
import { Workspace } from '../models/workspace';
import { AssignedStoryTreeProvider } from '../assignedStoryTreeProvider';
import { Config } from '../models/config';

/**
 * Loads stories assigned to the current user for all workspaces and updates the tree view.
 * Shows a progress notification while fetching stories and handles any errors.
 * 
 * For each workspace, it:
 * 1. Fetches assigned stories via the Shortcut API
 * 2. Updates the tree view to reflect the new stories
 * 3. Shows a notification if no workspaces are found
 * 
 * @param {Workspace[]} workspaces - Array of workspaces to fetch assigned stories for
 * @param {AssignedStoryTreeProvider} treeProvider - Provider for the assigned stories tree view
 * @param {Config} config - Configuration settings for the extension
 * @returns {Promise<void>} A promise that resolves when all stories are loaded
 * @throws {Error} If there's an error fetching assigned stories from the API
 */
export const loadAssignedStories = async (workspaces: Workspace[], treeProvider: AssignedStoryTreeProvider, config: Config) => {
    try {
		await vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: "Fetching Assigned Stories. Workspace: ",
			cancellable: false
		}, async (progress) => {
            for (const workspace of workspaces) { 
				progress.report({message: `${workspace.name}` });
                await workspace.getAssignedStories();
				progress.report({ increment: ((1 / workspaces.length) * 100)});
                treeProvider.refresh(workspaces, config);
            }
            
			if (workspaces.length === 0) {
				vscode.window.showInformationMessage('No workspaces found in Shortcut.');
			}
		});
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (error: any) {
		vscode.window.showErrorMessage(`Error fetching Assigned Stories: ${error.message}`);
	}
};
