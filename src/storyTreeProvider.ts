import * as vscode from 'vscode';
import { Story } from './models/story';
import { Workspace } from './models/workspace';
import removeMarkdown from "markdown-to-text";

export class StoryTreeProvider implements vscode.TreeDataProvider<TreeItem> {
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
            // Root level - return stories
            return Promise.resolve(
                this.workspaces.map(workspace => new WorkspaceTreeItem(
                    workspace.name,
                    workspace.stories.length > 0 ? 
                        vscode.TreeItemCollapsibleState.Expanded : 
                        vscode.TreeItemCollapsibleState.None,
                    workspace
                ))
            );
        } else if (element instanceof WorkspaceTreeItem) {
            // Story level - return tasks
            return Promise.resolve(
                element.workspace.stories.map(story => new StoryTreeItem(
                    story.name,
                    story.id,
                    story.tasks.length > 0 ? 
                        vscode.TreeItemCollapsibleState.Expanded : 
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

class StoryTreeItem extends TreeItem {
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

class TaskTreeItem extends TreeItem {
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
