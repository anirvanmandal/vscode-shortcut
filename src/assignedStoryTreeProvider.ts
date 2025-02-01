import * as vscode from 'vscode';
import { Story } from './models/story';
import { Workspace } from './models/workspace';
import { Workflow } from './models/workflow';
import { WorkflowState } from './models/workflowState';

/**
 * Tree data provider for displaying assigned Shortcut stories organized by workflow state.
 * Implements the VS Code TreeDataProvider interface to create a hierarchical view of:
 * Workspace -> Workflow -> State -> Stories
 */
export class AssignedStoryTreeProvider implements vscode.TreeDataProvider<TreeItem> {
    /** Event emitter for notifying VS Code when the tree data changes */
    private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | null | void> = new vscode.EventEmitter<TreeItem | undefined | null | void>();
    /** Event that VS Code listens to for tree data changes */
    readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    /** Array of workspaces containing workflows, states and stories */
    private workspaces: Workspace[] = [];

    constructor() {}

    /**
     * Refreshes the tree view with updated workspace data.
     * @param {Workspace[]} workspaces - Array of workspaces to display
     */
    refresh(workspaces: Workspace[]): void {
        this.workspaces = workspaces;
        this._onDidChangeTreeData.fire();
    }

    /**
     * Gets the tree item for an element.
     * @param {TreeItem} element - The element to get the tree item for
     * @returns {vscode.TreeItem} The tree item for the element
     */
    getTreeItem(element: TreeItem): vscode.TreeItem {
        return element;
    }

    /**
     * Gets the children of a tree item.
     * @param {TreeItem} [element] - The parent element to get children for
     * @returns {Thenable<TreeItem[]>} Promise resolving to array of child tree items
     */
    getChildren(element?: TreeItem): Thenable<TreeItem[]> {
        if (!element) {
            return Promise.resolve(
                this.workspaces.map(workspace => new WorkspaceTreeItem(
                    workspace.name,
                    workspace.workflows.length > 0 ? 
                        vscode.TreeItemCollapsibleState.Collapsed :
                        vscode.TreeItemCollapsibleState.None,
                    workspace
                ))
            );
        } else if (element instanceof WorkspaceTreeItem) {
            return Promise.resolve(
                element.workspace.workflows.map(workflow => new WorkflowTreeItem(
                    `${workflow.name} (${workflow.states.map(state => state.stories.length).reduce((a, b) => a + b, 0)})`,
                    workflow.id.toString(),
                    workflow.states.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
                    workflow,
                    element.workspace,
                ))
            );
        } else if (element instanceof WorkflowTreeItem) {
            return Promise.resolve(
                element.workflow.states.map(state => new StateTreeItem(
                    `${state.name} (${state.stories.length})`,
                    state.id.toString(),
                    state,
                    state.stories.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
                    element.workspace
                ))
            );
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
 * @extends vscode.TreeItem
 */
class TreeItem extends vscode.TreeItem {
    /**
     * Creates a new TreeItem instance.
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
 * @extends TreeItem
 */
class WorkspaceTreeItem extends TreeItem {
    /**
     * Creates a new WorkspaceTreeItem instance.
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
 * Tree item representing a Shortcut workflow.
 * @extends TreeItem
 */
class WorkflowTreeItem extends TreeItem {
    /**
     * Creates a new WorkflowTreeItem instance.
     * @param {string} label - The display text for the workflow
     * @param {string} id - The unique identifier of the workflow
     * @param {vscode.TreeItemCollapsibleState} collapsibleState - Whether and how the workflow can be expanded
     * @param {Workflow} workflow - The workflow this tree item represents
     * @param {Workspace} workspace - The workspace containing this workflow
     */
    constructor(
        public readonly label: string,
        public readonly id: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly workflow: Workflow,
        public readonly workspace: Workspace
    ) {
        super(label, collapsibleState);
        this.workspace = workspace;
    }
}

/**
 * Tree item representing a workflow state in Shortcut.
 * @extends TreeItem
 */
class StateTreeItem extends TreeItem {
    /**
     * Creates a new StateTreeItem instance.
     * @param {string} label - The display text for the state
     * @param {string} id - The unique identifier of the state
     * @param {WorkflowState} state - The workflow state this tree item represents
     * @param {vscode.TreeItemCollapsibleState} collapsibleState - Whether and how the state can be expanded
     * @param {Workspace} workspace - The workspace containing this state
     */
    constructor(
        public readonly label: string,
        public readonly id: string,
        public readonly state: WorkflowState,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly workspace: Workspace
    ) {
        super(label, collapsibleState);
        this.workspace = workspace;
    }
}

/**
 * Tree item representing a Shortcut story.
 * @extends TreeItem
 */
class StoryTreeItem extends TreeItem {
    /**
     * Creates a new StoryTreeItem instance.
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
        this.story = story;
        this.workspace = workspace;
        this.iconPath = new vscode.ThemeIcon('book');
    }
}
