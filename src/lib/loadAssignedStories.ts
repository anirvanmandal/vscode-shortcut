import * as vscode from 'vscode';
import { Workspace } from '../models/workspace';
import { AssignedStoryTreeProvider } from '../assignedStoryTreeProvider';

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
