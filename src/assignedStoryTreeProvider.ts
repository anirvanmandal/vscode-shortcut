import * as vscode from 'vscode';
import { Story } from './models/story';
import { Workspace } from './models/workspace';
import { Workflow } from './models/workflow';
import { WorkflowState } from './models/workflowState';
import { Config } from './models/config';

/**
 * Tree data provider for displaying assigned Shortcut stories organized by workflow state.
 * Implements the VS Code TreeDataProvider interface to create a hierarchical view of:
 * Workspace -> Workflow -> State -> Stories
 * 
 * The tree shows stories assigned to the current user, grouped by their workflow state.
 * Each level displays the number of stories contained within it in parentheses.
 * Empty workspaces, workflows and states can be optionally hidden via configuration.
 */
export class AssignedStoryTreeProvider implements vscode.TreeDataProvider<TreeItem> {
    /** Event emitter for notifying VS Code when the tree data changes */
    private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | null | void> = new vscode.EventEmitter<TreeItem | undefined | null | void>();
    /** Event that VS Code listens to for tree data changes */
    readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    /** Array of workspaces containing workflows, states and stories */
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
     * - Root level shows workspaces
     * - Workspaces contain workflows
     * - Workflows contain states
     * - States contain stories
     * 
     * Each level can filter out empty items based on configuration.
     * Story counts are calculated and displayed at each level.
     * 
     * @param {TreeItem} [element] - The parent element to get children for
     * @returns {Thenable<TreeItem[]>} Promise resolving to array of child tree items
     */
    getChildren(element?: TreeItem): Thenable<TreeItem[]> {
        if (!element) {
            let displayedWorkspaces = this.workspaces.map(workspace => {
                const workspaceStoriesCount = workspace.workflows.map(workflow => workflow.states.map(state => state.stories.length).reduce((a,b) => a + b, 0)).reduce((a,b) => a + b, 0);
                const workspaceTreeItem = new WorkspaceTreeItem(
                    `${workspace.name} (${workspaceStoriesCount})`,
                    workspace.workflows.length > 0 ? 
                        vscode.TreeItemCollapsibleState.Collapsed :
                        vscode.TreeItemCollapsibleState.None,
                    workspace,
                    workspaceStoriesCount
                );
                return workspaceTreeItem;
            });

            if (this.config.hideEmptyWorkspaces) {
                displayedWorkspaces = displayedWorkspaces.filter(workspace => workspace.storiesCount > 0);
            }

            return Promise.resolve(displayedWorkspaces);
        } else if (element instanceof WorkspaceTreeItem) {
            let displayedWorkflows = element.workspace.workflows.map(workflow => {
                const workflowStoriesCount = workflow.states.map(state => state.stories.length).reduce((a, b) => a + b, 0);
                const workflowTreeItem = new WorkflowTreeItem(
                    `${workflow.name} (${workflowStoriesCount})`,
                    workflow.id.toString(),
                    workflow.states.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
                    workflow,
                    element.workspace,
                    workflowStoriesCount
                );
                return workflowTreeItem;
            });

            displayedWorkflows = displayedWorkflows.filter(workflow => workflow.storiesCount > 0);
            
            return Promise.resolve(displayedWorkflows);
        } else if (element instanceof WorkflowTreeItem) {
            let displayedStates = element.workflow.states.map(state => {
                const stateStoriesCount = state.stories.length;
                const stateTreeItem = new StateTreeItem(
                    `${state.name} (${stateStoriesCount})`,
                    state.id.toString(),
                    state,
                    stateStoriesCount > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
                    element.workspace,
                    stateStoriesCount
                );
                return stateTreeItem;
            });
            displayedStates = displayedStates.filter(state => state.storiesCount > 0);
            return Promise.resolve(displayedStates);
        } else if (element instanceof StateTreeItem) {
            return Promise.resolve(
                element.state.stories.map(story => new StoryTreeItem(
                    story.name,
                    story.id.toString(),
                        vscode.TreeItemCollapsibleState.None,
                    story,
                    element.workspace
                ))
            );
        } else {
            return Promise.resolve([]);
        }
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
 * The top level of the hierarchy that contains workflows.
 * Displays the total number of stories in the workspace.
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
     * @param {number} storiesCount - Total number of stories in this workspace
     */
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly workspace: Workspace,
        public readonly storiesCount: number
    ) {
        super(label, collapsibleState);
    }
}

/**
 * Tree item representing a Shortcut workflow.
 * The second level of the hierarchy that contains states.
 * Displays the total number of stories in the workflow.
 * 
 * @extends TreeItem
 */
class WorkflowTreeItem extends TreeItem {
    /**
     * Creates a new WorkflowTreeItem instance.
     * 
     * @param {string} label - The display text for the workflow
     * @param {string} id - The unique identifier of the workflow
     * @param {vscode.TreeItemCollapsibleState} collapsibleState - Whether and how the workflow can be expanded
     * @param {Workflow} workflow - The workflow this tree item represents
     * @param {Workspace} workspace - The workspace containing this workflow
     * @param {number} storiesCount - Total number of stories in this workflow
     */
    constructor(
        public readonly label: string,
        public readonly id: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly workflow: Workflow,
        public readonly workspace: Workspace,
        public readonly storiesCount: number
    ) {
        super(label, collapsibleState);
    }
}

/**
 * Tree item representing a workflow state in Shortcut.
 * The third level of the hierarchy that contains stories.
 * Displays the number of stories in this state.
 * 
 * @extends TreeItem
 */
class StateTreeItem extends TreeItem {
    /**
     * Creates a new StateTreeItem instance.
     * 
     * @param {string} label - The display text for the state
     * @param {string} id - The unique identifier of the state
     * @param {WorkflowState} state - The workflow state this tree item represents
     * @param {vscode.TreeItemCollapsibleState} collapsibleState - Whether and how the state can be expanded
     * @param {Workspace} workspace - The workspace containing this state
     * @param {number} storiesCount - Number of stories in this state
     */
    constructor(
        public readonly label: string,
        public readonly id: string,
        public readonly state: WorkflowState,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly workspace: Workspace,
        public readonly storiesCount: number
    ) {
        super(label, collapsibleState);
    }
}

/**
 * Tree item representing a Shortcut story.
 * The leaf level of the hierarchy.
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
     * @param {string} storyId - The unique identifier of the story
     * @param {vscode.TreeItemCollapsibleState} collapsibleState - Whether and how the story can be expanded
     * @param {Story} story - The story this tree item represents
     * @param {Workspace} workspace - The workspace containing this story
     */
    constructor(
        public readonly label: string,
        public readonly storyId: string,
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
