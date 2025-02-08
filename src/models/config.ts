import * as vscode from 'vscode';

/**
 * Configuration class that manages extension settings.
 * Handles loading and storing configuration values from VS Code's workspace settings.
 */
export class Config {
	/** API tokens for authenticating with Shortcut workspaces */
	apiTokens: object | undefined;
	/** Whether to hide workspaces that have no stories/tasks */
	hideEmptyWorkspaces: boolean | undefined;

	/**
	 * Creates a new Config instance.
	 * Loads settings from the provided VS Code workspace configuration.
	 * 
	 * @param {vscode.WorkspaceConfiguration} [config] - The VS Code workspace configuration object
	 */
	constructor(config?: vscode.WorkspaceConfiguration) {   
		this.apiTokens = config?.get<object[]>('apiTokens');
		this.hideEmptyWorkspaces = config?.get<boolean>('hideEmptyWorkspaces');
	}
}
