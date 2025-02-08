import { Workspace } from "../models/workspace";
import * as vscode from 'vscode';
import { markTaskAsComplete } from "../lib/markTaskAsComplete";

/**
 * Provides a quick pick interface for selecting and completing a task.
 * Shows a series of dropdown menus to:
 * 1. Select a workspace with pending stories
 * 2. Select a story from that workspace
 * 3. Automatically selects the first pending task from that story
 * 
 * Shows appropriate error messages if:
 * - No workspace is found
 * - No story is found
 * - No incomplete task is found
 * 
 * @param {Workspace[]} workspaces - Array of workspaces to choose from
 * @returns {Promise<void>} A promise that resolves when a task is completed or the process is cancelled
 */
export const quickPickInput = async (workspaces: Workspace[]) => {
    workspaces = workspaces.filter(workspace => workspace.pendingStories.length > 0);
    
    const pick = await vscode.window.showQuickPick(workspaces.map(workspace => ({ 
        label: workspace.name 
    })), {
        title: "Select a workspace"
    });
    
    if (!pick) { return; }
    
    const workspace = workspaces.find(workspace => workspace.name === pick.label);
    
    if (!workspace) { 
        vscode.window.showErrorMessage('Couldn\'t find workspace');
        return; 
    }

    const storyPick = await vscode.window.showQuickPick(workspace.pendingStories.map(story => ({ 
        label: story.name
    })), {
        title: "Select a story to complete"
    });

    if (!storyPick) { return; }
    
    const story = workspace.pendingStories.find(story => story.name === storyPick.label);
    if (!story) { 
        vscode.window.showErrorMessage('Couldn\'t find story to complete');
        return; 
    }

    const task = story.pendingTasks(workspace)[0];

    if (!task) {
        vscode.window.showErrorMessage('Couldn\'t find incomplete task on story to complete');
        return;
    }

    markTaskAsComplete(workspace, task.id, story.id);
};
