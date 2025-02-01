import { Workspace } from "../models/workspace";
import * as vscode from 'vscode';

/**
 * Marks a task as complete in both the Shortcut API and local state.
 * Shows a success or error message based on the API response.
 * 
 * @param {Workspace} workspace - The workspace containing the task
 * @param {number} taskId - The ID of the task to mark as complete
 * @param {number} storyId - The ID of the story containing the task
 * @returns {Promise<void>} A promise that resolves when the task is marked complete
 */
export const markTaskAsComplete = async (workspace: Workspace, taskId: number, storyId: number) => {
    const client = workspace.client;
    const response = await client.updateTask(storyId, taskId, {
        complete: true
    });

    if (response.status === 200) {
        vscode.window.showInformationMessage('Task marked as complete');
        const story = workspace.pendingStories.find(story => story.id === storyId);
        const task = story?.tasks.find(task => task.id === taskId);
        if (story && task) {
            task.complete = true;
        }
    } else {
        vscode.window.showErrorMessage('Failed to mark task as complete');
    }
};
