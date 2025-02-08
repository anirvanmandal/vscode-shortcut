import * as vscode from 'vscode';
import { Story } from './models/story';
import { Workspace } from './models/workspace';
import removeMarkdown from "markdown-to-text";
import { Config } from './models/config';

/**
 * Tree data provider for displaying pending Shortcut stories and their tasks.
 * Implements the VS Code TreeDataProvider interface to create a hierarchical view of:
 * Workspace -> Stories -> Tasks
 * 
 * The tree shows pending stories and their tasks, grouped by workspace.
 * Each workspace displays the number of pending stories in parentheses.
 * Empty workspaces can be optionally hidden via configuration.
 * Stories show their ID and can be expanded to show tasks.
 * Tasks display their completion status with a checkbox icon.
 */
export class StoryTreeProvider implements vscode.TreeDataProvider<TreeItem> {
    /** Event emitter for notifying VS Code when the tree data changes */
    private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | null | void> = new vscode.EventEmitter<TreeItem | undefined | null | void>();
    /** Event that VS Code listens to for tree data changes */
    readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    /** Array of workspaces containing stories and tasks */
    private workspaces: Workspace[] = [];
    /** Configuration settings for the tree view */
    private config: Config = new Config();

    constructor() {}

    /**
     * Refreshes the tree view with updated workspace data and configuration.
     * Triggers a re-render of the entire tree.
     * 
     * @param {Workspace[]} workspaces - Array of workspaces to display
     * @param {Config} config - Updated configuration settings
     */
    refresh(workspaces: Workspace[], config: Config): void {
        this.workspaces = workspaces;
        this.config = config;
        this._onDidChangeTreeData.fire();
    }

    /**
     * Gets the tree item for an element.
     * Required by VS Code's TreeDataProvider interface.
     * 
     * @param {TreeItem} element - The element to get the tree item for
     * @returns {vscode.TreeItem} The tree item for the element
     */
    getTreeItem(element: TreeItem): vscode.TreeItem {
        return element;
    }

    /**
     * Gets the children of a tree item.
     * Handles the hierarchical structure of the tree:
     * - Root level shows workspaces with pending story counts
     * - Workspaces contain stories with their IDs
     * - Stories contain tasks with completion status
     * 
     * Empty workspaces can be filtered out based on configuration.
     * 
     * @param {TreeItem} [element] - The parent element to get children for
     * @returns {Thenable<TreeItem[]>} Promise resolving to array of child tree items
     */
    getChildren(element?: TreeItem): Thenable<TreeItem[]> {
        if (!element) {
            // Root level - return stories
            let displayedWorkspaces = this.workspaces.map(workspace => new WorkspaceTreeItem(
                `${workspace.name} (${workspace.pendingStories.length})`,
                workspace.pendingStories.length > 0 ? 
                    vscode.TreeItemCollapsibleState.Collapsed : 
                    vscode.TreeItemCollapsibleState.None,
                workspace
            ));

            if (this.config.hideEmptyWorkspaces) {
                displayedWorkspaces = displayedWorkspaces.filter(workspace => workspace.workspace.pendingStories.length > 0);
            }

            return Promise.resolve(
                displayedWorkspaces
            );
        } else if (element instanceof WorkspaceTreeItem) {
            // Story level - return tasks
            return Promise.resolve(
                element.workspace.pendingStories.map(story => new StoryTreeItem(
                    story.name,
                    story.id,
                    story.tasks.length > 0 ? 
                        vscode.TreeItemCollapsibleState.Collapsed : 
                        vscode.TreeItemCollapsibleState.None,
                    story,
                    element.workspace
                ))
            );
        } else if (element instanceof StoryTreeItem) {
            // Task level - return tasks
            return Promise.resolve(
                element.story.tasks.map(task => new TaskTreeItem(
                    removeMarkdown(task.description),
                    task.complete,
                    task.id,
                    element.story.id,
                    element.workspace
                ))
            );
        }
        return Promise.resolve([]);
    }
}

/**
 * Base tree item class that all other tree items extend from.
 * Provides common functionality for tree items in the view.
 * 
 * @extends vscode.TreeItem
 */
class TreeItem extends vscode.TreeItem {
    /**
     * Creates a new TreeItem instance.
     * 
     * @param {string} label - The display text for the tree item
     * @param {vscode.TreeItemCollapsibleState} collapsibleState - Whether and how the tree item can be expanded
     */
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
    }
}

/**
 * Tree item representing a Shortcut workspace.
 * The top level of the hierarchy that contains stories.
 * Displays the total number of pending stories in parentheses.
 * 
 * @extends TreeItem
 */
class WorkspaceTreeItem extends TreeItem {
    /**
     * Creates a new WorkspaceTreeItem instance.
     * 
     * @param {string} label - The display text for the workspace
     * @param {vscode.TreeItemCollapsibleState} collapsibleState - Whether and how the workspace can be expanded
     * @param {Workspace} workspace - The workspace this tree item represents
     */
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly workspace: Workspace
    ) {
        super(label, collapsibleState);
    }
}

/**
 * Tree item representing a Shortcut story.
 * The second level of the hierarchy that contains tasks.
 * Displays the story name and ID, with a book icon.
 * Provides context menu actions via contextValue.
 * 
 * @extends TreeItem
 */
class StoryTreeItem extends TreeItem {
    /**
     * Creates a new StoryTreeItem instance.
     * 
     * @param {string} label - The display text for the story
     * @param {number} storyId - The unique identifier of the story
     * @param {vscode.TreeItemCollapsibleState} collapsibleState - Whether and how the story can be expanded
     * @param {Story} story - The story this tree item represents
     * @param {Workspace} workspace - The workspace containing this story
     */
    constructor(
        public readonly label: string,
        public readonly storyId: number,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly story: Story,
        public readonly workspace: Workspace
    ) {
        super(label, collapsibleState);
        this.tooltip = `${this.label}`;
        this.description = `#${this.storyId}`;
        this.contextValue = 'story';
        this.iconPath = new vscode.ThemeIcon('book');
    }
}

/**
 * Tree item representing a task within a Shortcut story.
 * The leaf level of the hierarchy.
 * Displays the task description and completion status with a checkbox icon.
 * Provides context menu actions via contextValue.
 * 
 * @extends TreeItem
 */
class TaskTreeItem extends TreeItem {
    /**
     * Creates a new TaskTreeItem instance.
     * 
     * @param {string} label - The display text for the task
     * @param {boolean} isComplete - Whether the task is marked as complete
     * @param {number} taskId - The unique identifier of the task
     * @param {number} storyId - The unique identifier of the story containing this task
     * @param {Workspace} workspace - The workspace containing this task
     */
    constructor(
        public readonly label: string,
        public readonly isComplete: boolean,
        public readonly taskId: number,
        public readonly storyId: number,
        public readonly workspace: Workspace
    ) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.tooltip = this.label;
        this.contextValue = 'task';
        this.iconPath = new vscode.ThemeIcon(
            this.isComplete ? 'check' : 'circle-outline'
        );
    }
} 
