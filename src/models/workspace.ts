import { Story } from "./story";
import { BaseModel } from "./base";
import { MemberInfo } from "./memberInfo";
import { ShortcutClient } from "@shortcut/client";

export class Workspace extends BaseModel {
    name: string;
    apiToken: string;
    client: ShortcutClient;
    stories: Story[];
    memberInfo: MemberInfo | undefined;
    estimate_scale: [] | undefined;
    url_slug: string | undefined;
    
    static cacheKey: string = "workspaces";

    constructor(name: string, apiToken: string, stories: Story[] = [], estimate_scale: [] | undefined = [], url_slug: string | undefined = undefined) {
        super();

        this.name = name ?? "";
        this.apiToken = apiToken ?? "";
        this.stories = stories ?? [];
        this.client = new ShortcutClient(apiToken);
        this.estimate_scale = estimate_scale ?? [];
        this.url_slug = url_slug ?? "";
    }

    static fromJSON(json: string): Workspace[] {
        return JSON.parse(json).map((workspace: any) => new Workspace(workspace.name, workspace.apiToken, [], workspace.estimate_scale, workspace.url_slug));
    }

    toJSON(): string {
        return JSON.stringify(this.toObject());
    }

    toObject(): any {
        return {
            name: this.name,
            apiToken: this.apiToken,
            estimate_scale: this.estimate_scale,
            url_slug: this.url_slug
        };
    }

    updateAttributes(data: any, memberInfo: MemberInfo) {
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
            }

            return workspaces;
        }

        workspaces = [];
        
        if (!apiTokens) {
            return workspaces;
        } 
        
        for (const [key, value] of Object.entries(apiTokens)) {
			const workspace = new Workspace(key, value as string, []);
            workspace.memberInfo = await MemberInfo.get(workspace);
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

        return Workspace.fromJSON(cache);
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
            }
        }
    }

    async getStories(): Promise<Story[]> {
        this.stories = await Story.pendingTasks(this, this.client);
        return this.stories;
    }
}
