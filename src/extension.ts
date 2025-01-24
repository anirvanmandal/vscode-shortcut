// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ShortcutClient } from '@shortcut/client';
import { StoryTreeProvider } from './storyTreeProvider';

import { MemberInfo } from './models/memberInfo';
import { BaseModel } from './models/base';

// Update the constant to match the new settings name
const API_TOKEN_SECRET_KEY = 'shortcutTasks.apiToken';

// Add this helper function to get configuration
function getConfiguration(): vscode.WorkspaceConfiguration {
	return vscode.workspace.getConfiguration('shortcutTasks');
}

let apiToken: string | undefined;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	// Get API token from settings
	updateFromConfig(getConfiguration());

	if (!apiToken) {
		vscode.window.showErrorMessage('Shortcut API token not found. Please set it in the config');
		return;
	}

	// Initialize Shortcut client
	const client = new ShortcutClient(apiToken);
	BaseModel.client = client;
	BaseModel.context = context;

	// MemberInfo.deleteCache();
	const member = await MemberInfo.get();

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vscode-shortcut-tasks" is now active!');
	

	// Add after client initialization
	const storyTreeProvider = new StoryTreeProvider();
	vscode.window.registerTreeDataProvider('shortcutStories', storyTreeProvider);

	// Register command to fetch tasks
	let disposable = vscode.commands.registerCommand('extension.fetchShortcutTasks', async () => {
		try {
			await vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: "Fetching Shortcut tasks...",
				cancellable: false
			}, async (progress) => {
				// Get all projects and their stories
				const projects = await client.listProjects();
				const allStories = [];
				
				for (const project of projects) {
					const projectStories = await client.listStories({
						project_id: project.id
					});
					allStories.push(...projectStories);
				}

				// Update the tree view with new stories
				storyTreeProvider.refresh(allStories);
				
				// Extract all tasks from stories
				const tasks = allStories.reduce((acc: Task[], story: any) => {
					if (story.tasks && story.tasks.length > 0) {
						const tasksWithContext = story.tasks.map((task: any) => ({
							...task,
							storyId: story.id,
							storyName: story.name
						}));
						return [...acc, ...tasksWithContext];
					}
					return acc;
				}, []);

				if (tasks.length === 0) {
					vscode.window.showInformationMessage('No tasks found in Shortcut.');
				} else {
					interface QuickPickTask {
						label: string;
						description: string;
						detail: string;
						task: Task;
					}

					const taskItems: QuickPickTask[] = tasks.map((task: any) => ({
						label: task.description,
						description: `Story: ${task.storyName}`,
						detail: `Complete: ${task.complete ? 'Yes' : 'No'}`,
						task: task
					}));

					const selected = await vscode.window.showQuickPick(taskItems, {
						placeHolder: 'Select a task to view details'
					});

					if (selected) {
						const taskDetails = JSON.stringify(selected.task, null, 2);
						const doc = await vscode.workspace.openTextDocument({
							content: taskDetails,
							language: 'json'
						});
						await vscode.window.showTextDocument(doc);
					}
				}
			});
		} catch (error: any) {
			vscode.window.showErrorMessage(`Error fetching Shortcut tasks: ${error.message}`);
		}
	});

	// Listen for configuration changes
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration('shortcutTasks')) {
				// Reload the configuration
				const config = getConfiguration();
				updateFromConfig(config);
			}
		})
	);

	// Initial configuration load
	const config = getConfiguration();
	updateFromConfig(config);

	context.subscriptions.push(disposable);
}

function updateFromConfig(config: vscode.WorkspaceConfiguration) {
	const workspace = config.get<string>('workspace');
	const refreshInterval = config.get<number>('refreshInterval');
	apiToken = config.get<string>('apiToken');

	// You can use these values to update your extension's behavior
	console.log(`Configuration updated: workspace=${workspace}, refreshInterval=${refreshInterval}, apiToken=${apiToken}`);
}

// Add this helper function to retrieve the token
async function getApiToken(context: vscode.ExtensionContext): Promise<string | undefined> {
	return await context.secrets.get(API_TOKEN_SECRET_KEY);
}

// This method is called when your extension is deactivated
export function deactivate() {}


async function main() {
    const client = new ShortcutClient("2b6662d4-6749-4a52-99b0-ee773f17e114");

	const stories = await client.searchStories({
		query: "is:started and has:task", page_size: 25, detail: "full"
	});

	console.log(stories);
}

main();