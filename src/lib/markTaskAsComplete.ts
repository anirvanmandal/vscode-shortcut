import { Workspace } from "../models/workspace";
import * as vscode from 'vscode';

export const markTaskAsComplete = async (workspace: Workspace, taskId: number, storyId: number) => {
    const client = workspace.client;
    console.log(workspace);
    const response = await client.updateTask(storyId, taskId, {
        complete: true
    });

    console.log(response);
    if (response.status === 200) {
        vscode.window.showInformationMessage('Task marked as complete');
        const story = workspace.stories.find(story => story.id === storyId);
        const task = story?.tasks.find(task => task.id === taskId);
        if (story && task) {
            task.complete = true;
        }
    } else {
        vscode.window.showErrorMessage('Failed to mark task as complete');
    }
};
