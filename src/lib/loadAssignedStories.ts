import * as vscode from 'vscode';
import { Workspace } from '../models/workspace';
import { AssignedStoryTreeProvider } from '../assignedStoryTreeProvider';

/**
 * Loads stories assigned to the current user for all workspaces and updates the tree view.
 * Shows a progress notification while fetching stories and handles any errors.
 * 
 * @param {Workspace[]} workspaces - Array of workspaces to fetch assigned stories for
 * @param {AssignedStoryTreeProvider} treeProvider - Provider for the assigned stories tree view
 * @returns {Promise<void>} A promise that resolves when all stories are loaded
 * @throws {Error} If there's an error fetching assigned stories
 */
export const loadAssignedStories = async (workspaces: Workspace[], treeProvider: AssignedStoryTreeProvider) => {
    try {
		await vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: "Fetching Workflow States...",
			cancellable: false
		}, async (progress) => {
            for (const workspace of workspaces) { 
                await workspace.getAssignedStories();
                treeProvider.refresh(workspaces);
            }
            
			if (workspaces.length === 0) {
				vscode.window.showInformationMessage('No workspaces found in Shortcut.');
			}
		});
	} catch (error: any) {
		vscode.window.showErrorMessage(`Error fetching Assigns Stories: ${error.message}`);
	}
};
