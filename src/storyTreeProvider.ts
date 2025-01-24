import * as vscode from 'vscode';
import { ShortcutClient, StorySlim } from '@shortcut/client';

export class StoryTreeProvider implements vscode.TreeDataProvider<StoryItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<StoryItem | undefined | null | void> = new vscode.EventEmitter<StoryItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<StoryItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private stories: StorySlim[] = [];

    constructor() {}

    refresh(stories: StorySlim[]): void {
        this.stories = stories;
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: StoryItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: StoryItem): Thenable<StoryItem[]> {
        if (element) {
            return Promise.resolve([]);
        }

        return Promise.resolve(
            this.stories.map(story => new StoryItem(
                story.name,
                story.id.toString(),
                story.workflow_state_id ? 
                    vscode.TreeItemCollapsibleState.None : 
                    vscode.TreeItemCollapsibleState.None
            ))
        );
    }
}

class StoryItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly storyId: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.tooltip = `${this.label}`;
        this.description = `#${this.storyId}`;
    }
} 
