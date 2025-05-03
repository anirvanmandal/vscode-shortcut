/* eslint-disable @typescript-eslint/no-explicit-any */
import * as vscode from "vscode";
import { Workspace } from "../models/workspace";
import { Config } from "../models/config";
import { AssignedStoryTreeProvider } from "../treeProviders/assignedStoryTreeProvider";
import { StoryTreeProvider } from "../treeProviders/storyTreeProvider";

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
export const applyWebhookChanges = async (
  workspaces: Workspace[],
  data: any,
  config: Config,
  assignedStoryTreeProvider: AssignedStoryTreeProvider,
  pendingStoryTreeProvider: StoryTreeProvider
): Promise<void> => {
  try {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Refreshing workspace. Workspace: ",
        cancellable: false,
      },
      async (progress) => {
        const urlSlug = data.actions[0].app_url.match(
          /https:\/\/app\.shortcut\.com\/(\w*)\/.*/
        )[1];
        const workspace = workspaces.find(
          (workspace) => workspace.url_slug === urlSlug
        );

        if (workspace) {
          progress.report({ message: `${workspace.name}` });
          await workspace.getAssignedStories();
          await workspace.getPendingStories();

          assignedStoryTreeProvider.refresh(workspaces, config);
          pendingStoryTreeProvider.refresh(workspaces, config);
        }
      }
    );
  } catch (error: any) {
    vscode.window.showErrorMessage(
      `Error fetching Assigned Stories: ${error.message}`
    );
  }
};
