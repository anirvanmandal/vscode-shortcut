import { Story } from "./story";
import { BaseModel } from "./base";
import { MemberInfo } from "./memberInfo";
import { Workflow } from "./workflow";
import { ShortcutClient } from "@shortcut/client";

/** Type definition for base attributes that can be any key-value pair */
type BaseAttributes = Record<string, unknown>;

/** Interface defining the required and optional attributes for a workspace */
interface WorkspaceAttributes extends BaseAttributes {
    /** Name of the workspace */
    name: string;
    /** API token for authentication */
    apiToken: string;
    /** List of stories with pending tasks */
    pendingStories: Story[];
    /** List of workflows in the workspace */
    workflows: Workflow[];
    /** Optional array of estimation scale values */
    estimate_scale?: number[] | undefined;
    /** Optional URL slug for the workspace */
    url_slug?: string | undefined;
}

/**
 * Represents a Shortcut workspace, which is the top-level container for all project data.
 * Manages workspace configuration, authentication, and provides access to stories, workflows, and member information.
 * @extends BaseModel
 */
export class Workspace extends BaseModel {
    /** Name of the workspace */
    name: string;
    /** API token used for authentication with Shortcut */
    apiToken: string;
    /** Instance of ShortcutClient for making API requests */
    client: ShortcutClient;
    /** List of stories that have pending tasks */
    pendingStories: Story[];
    /** List of workflows in the workspace */
    workflows: Workflow[] | [];
    /** Information about the current workspace member */
    memberInfo: MemberInfo | undefined = undefined;
    /** Array of values used for story estimation */
    estimate_scale: number[] | undefined;
    /** URL slug for the workspace */
    url_slug: string | undefined;
    
    /** Cache key used for storing workspace data */
    static cacheKey: string = "workspaces";

    /**
     * Creates a new Workspace instance.
     * @param {WorkspaceAttributes} attributes - The attributes to initialize the workspace with
     */
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
    
    /**
     * Creates an array of Workspace instances from JSON string.
     * @param {string} json - JSON string containing workspace data
     * @returns {Workspace[]} Array of Workspace instances
     */
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

    /**
     * Converts the workspace instance to a JSON string.
     * @returns {string} JSON string representation of the workspace
     */
    toJSON(): string {
        return JSON.stringify(this.toObject());
    }

    /**
     * Converts the workspace instance to a plain object.
     * @returns {WorkspaceAttributes} Plain object representation of the workspace
     */
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

    /**
     * Updates workspace attributes with data from the API.
     * @param {Object} data - Object containing workspace data
     * @param {MemberInfo} memberInfo - Member information to update
     */
    updateAttributes(data: { workspace2: { estimate_scale: number[] | undefined, url_slug: string | undefined }}, memberInfo: MemberInfo) {
            this.estimate_scale = data.workspace2.estimate_scale;
            this.url_slug = data.workspace2.url_slug;
            this.memberInfo = memberInfo;
    }

    /**
     * Gets all workspaces, first trying cache then falling back to API.
     * @param {object | undefined} apiTokens - Object mapping workspace names to API tokens
     * @returns {Promise<Workspace[]>} Promise resolving to array of workspaces
     */
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

    /**
     * Retrieves workspaces from the cache.
     * @returns {Workspace[] | undefined} Array of workspaces if found in cache, undefined otherwise
     */
    static getFromCache(): Workspace[] | undefined {
        const cache = Workspace.context.globalState.get(Workspace.cacheKey);
        
        if (!cache) {
            return undefined;
        }

        return Workspace.fromJSON(cache as string);
    }

    /**
     * Saves workspaces to the cache.
     * @param {Workspace[]} workspaces - Array of workspaces to cache
     */
    static saveToCache(workspaces: Workspace[]) {
        const object = workspaces.map(workspace => workspace.toObject());
        Workspace.context.globalState.update(Workspace.cacheKey, JSON.stringify(object));
    }

    /**
     * Deletes cached workspace data.
     * @param {Workspace[] | undefined} workspaces - Optional array of workspaces to clear related caches for
     */
    static deleteCache(workspaces: Workspace[] | undefined = undefined) {
        Workspace.context.globalState.update(Workspace.cacheKey, undefined);
        
        if (workspaces) {
            for (const workspace of workspaces) {
                MemberInfo.deleteCache(workspace.name);
                Workflow.deleteCache(workspace.name);
            }
        }
    }

    /**
     * Fetches and updates the list of stories with pending tasks.
     * @returns {Promise<void>}
     */
    async getPendingStories(): Promise<void> {
        this.pendingStories = await Story.pendingTasks(this, this.client);
    }

    /**
     * Fetches and updates the list of workflows.
     * @returns {Promise<Workflow[]>} Promise resolving to array of workflows
     */
    async getWorkflows(): Promise<Workflow[]> {
        this.workflows = await Workflow.get(this);
        return this.workflows;
    }

    /**
     * Fetches stories assigned to the current member and groups them by workflow and state.
     * @returns {Promise<void>}
     */
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
