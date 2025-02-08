import { Story } from "./story";
import { BaseModel } from "./base";
import { MemberInfo } from "./memberInfo";
import { Workflow } from "./workflow";
import { ShortcutClient } from "@shortcut/client";

type BaseAttributes = Record<string, unknown>;

interface WorkspaceAttributes extends BaseAttributes {
    name: string;
    apiToken: string;
    pendingStories: Story[];
    workflows: Workflow[];
    estimate_scale?: number[] | undefined;
    url_slug?: string | undefined;
}

export class Workspace extends BaseModel {
    name: string;
    apiToken: string;
    client: ShortcutClient;
    pendingStories: Story[];
    workflows: Workflow[] | [];
    memberInfo: MemberInfo | undefined = undefined;
    estimate_scale: number[] | undefined;
    url_slug: string | undefined;
    
    static cacheKey: string = "workspaces";

    constructor(attributes: WorkspaceAttributes) {
        super();

        this.name = attributes.name ?? "";
        this.apiToken = attributes.apiToken ?? "";
        this.pendingStories = attributes.pendingStories ?? [];
        this.workflows = attributes.workflows ?? [];
        this.client = new ShortcutClient(attributes.apiToken);
        this.estimate_scale = attributes.estimate_scale ?? [];
        this.url_slug = attributes.url_slug ?? "";
    }
    
    static fromJSON(json: string): Workspace[] {
        return JSON.parse(json).map((workspace: WorkspaceAttributes) => {
            const attributes: WorkspaceAttributes = {
                name: workspace.name,
                apiToken: workspace.apiToken,
                pendingStories: workspace.pendingStories,
                workflows: workspace.workflows,
                estimate_scale: workspace.estimate_scale,
                url_slug: workspace.url_slug
            };
            return new Workspace(attributes);
        });
    }

    toJSON(): string {
        return JSON.stringify(this.toObject());
    }

    toObject(): WorkspaceAttributes {
        return {
            name: this.name,
            apiToken: this.apiToken,
            pendingStories: this.pendingStories,
            workflows: this.workflows,
            estimate_scale: this.estimate_scale,
            url_slug: this.url_slug
        };
    }

    updateAttributes(data: { workspace2: { estimate_scale: number[] | undefined, url_slug: string | undefined }}, memberInfo: MemberInfo) {
            this.estimate_scale = data.workspace2.estimate_scale;
            this.url_slug = data.workspace2.url_slug;
            this.memberInfo = memberInfo;
    }

    static async get(apiTokens: object | undefined): Promise<Workspace[]> {
        let workspaces = Workspace.getFromCache();

        if (workspaces) {
            console.log("loaded from cache");
            for (const workspace of workspaces) {
                workspace.memberInfo = await MemberInfo.get(workspace);
                workspace.workflows = await Workflow.get(workspace);
            }

            return workspaces;
        }

        workspaces = [];
        
        if (!apiTokens) {
            return workspaces;
        } 
        
        for (const [key, value] of Object.entries(apiTokens)) {
			const workspace = new Workspace({
                name: key,
                apiToken: value as string,
                pendingStories: [],
                workflows: [],
            });
            workspace.memberInfo = await MemberInfo.get(workspace);
            workspace.workflows = await Workflow.get(workspace);
			workspaces.push(workspace);
        }

        Workspace.saveToCache(workspaces);
        
        return workspaces;
    }

    static getFromCache(): Workspace[] | undefined {
        const cache = Workspace.context.globalState.get(Workspace.cacheKey);
        
        if (!cache) {
            return undefined;
        }

        return Workspace.fromJSON(cache as string);
    }

    static saveToCache(workspaces: Workspace[]) {
        const object = workspaces.map(workspace => workspace.toObject());
        Workspace.context.globalState.update(Workspace.cacheKey, JSON.stringify(object));
    }

    static deleteCache(workspaces: Workspace[] | undefined = undefined) {
        Workspace.context.globalState.update(Workspace.cacheKey, undefined);
        
        if (workspaces) {
            for (const workspace of workspaces) {
                MemberInfo.deleteCache(workspace.name);
                Workflow.deleteCache(workspace.name);
            }
        }
    }

    async getPendingStories(): Promise<void> {
        this.pendingStories = await Story.pendingTasks(this, this.client);
    }

    async getWorkflows(): Promise<Workflow[]> {
        this.workflows = await Workflow.get(this);
        return this.workflows;
    }

    async getAssignedStories(): Promise<void> {
        const stories = await Story.assignedToMember(this);
        const groupedStories = stories.reduce((acc: Record<number, Record<number, Story[]>>, story) => {
            acc[story.workflow_id] ||= {};
            acc[story.workflow_id][story.workflow_state_id] ||= [];
            acc[story.workflow_id][story.workflow_state_id].push(story);
            return acc;
        }, {});

        this.workflows.forEach(workflow => {
            workflow.states.forEach(state => {
                state.stories = groupedStories[workflow.id]?.[state.id] ?? [];
            });
        });
    }
}
