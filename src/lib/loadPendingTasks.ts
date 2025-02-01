import * as vscode from 'vscode';
import { Workspace } from '../models/workspace';
import { StoryTreeProvider } from '../storyTreeProvider';

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
``};
