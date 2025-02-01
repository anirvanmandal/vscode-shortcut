import * as vscode from 'vscode';
import { Story } from './models/story';
import { Workspace } from './models/workspace';
import { Workflow } from './models/workflow';
import { WorkflowState } from './models/workflowState';
import removeMarkdown from "markdown-to-text";

export class AssignedStoryTreeProvider implements vscode.TreeDataProvider<TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | null | void> = new vscode.EventEmitter<TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private workspaces: Workspace[] = [];

    constructor() {}

    refresh(workspaces: Workspace[]): void {
        this.workspaces = workspaces;
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: TreeItem): vscode.TreeItem {
        return element;
    }

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


class TreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
    }
}

class WorkspaceTreeItem extends TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly workspace: Workspace
    ) {
        super(label, collapsibleState);
    }
}

class WorkflowTreeItem extends TreeItem {
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

class StateTreeItem extends TreeItem {
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

class StoryTreeItem extends TreeItem {
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
