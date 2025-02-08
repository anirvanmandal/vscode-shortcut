/**
 * @fileoverview Defines the Workspace class and related types for managing Shortcut workspace data.
 * This module handles workspace configuration, story management, and caching functionality.
 */

import { Story } from "./story";
import { BaseModel } from "./base";
import { MemberInfo } from "./memberInfo";
import { Workflow } from "./workflow";
import { ShortcutClient } from "@shortcut/client";

/** Base type for model attributes */
type BaseAttributes = Record<string, unknown>;

/** Interface defining the structure of workspace attributes */
interface WorkspaceAttributes extends BaseAttributes {
    name: string;
    apiToken: string;
    pendingStories: Story[];
    workflows: Workflow[];
    estimate_scale?: number[] | undefined;
    url_slug?: string | undefined;
}

/**
 * Class representing a Shortcut workspace.
 * Handles workspace data, story management, and interactions with the Shortcut API.
 * @extends BaseModel
 */
export class Workspace extends BaseModel {
    name: string;
    apiToken: string;
    client: ShortcutClient;
    pendingStories: Story[];
    workflows: Workflow[] | [];
    memberInfo: MemberInfo | undefined = undefined;
    estimate_scale: number[] | undefined;
    url_slug: string | undefined;
    
    /** Key used for caching workspace data */
    static cacheKey: string = "workspaces";

    /**
     * Creates a new Workspace instance
     * @param {WorkspaceAttributes} attributes - The workspace attributes
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
     * Creates Workspace instances from JSON string
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
     * Converts workspace instance to JSON string
     * @returns {string} JSON string representation of the workspace
     */
    toJSON(): string {
        return JSON.stringify(this.toObject());
    }

    /**
     * Converts workspace instance to plain object
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
     * Updates workspace attributes with new data
     * @param {Object} data - New workspace data
     * @param {MemberInfo} memberInfo - Updated member information
     */
    updateAttributes(data: { workspace2: { estimate_scale: number[] | undefined, url_slug: string | undefined }}, memberInfo: MemberInfo) {
            this.estimate_scale = data.workspace2.estimate_scale;
            this.url_slug = data.workspace2.url_slug;
            this.memberInfo = memberInfo;
    }

    /**
     * Retrieves workspaces from cache or creates new ones from API tokens
     * @param {object | undefined} apiTokens - API tokens for workspace creation
     * @returns {Promise<Workspace[]>} Array of workspace instances
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
     * Retrieves workspaces from cache
     * @returns {Workspace[] | undefined} Array of workspace instances or undefined if cache is empty
     */
    static getFromCache(): Workspace[] | undefined {
        const cache = Workspace.context.globalState.get(Workspace.cacheKey);
        
        if (!cache) {
            return undefined;
        }

        return Workspace.fromJSON(cache as string);
    }

    /**
     * Saves workspaces to cache
     * @param {Workspace[]} workspaces - Array of workspaces to cache
     */
    static saveToCache(workspaces: Workspace[]) {
        const object = workspaces.map(workspace => workspace.toObject());
        Workspace.context.globalState.update(Workspace.cacheKey, JSON.stringify(object));
    }

    /**
     * Deletes workspace cache and related caches
     * @param {Workspace[] | undefined} workspaces - Optional workspaces to clear related caches
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
     * Fetches and updates pending stories for the workspace
     * @returns {Promise<void>}
     */
    async getPendingStories(): Promise<void> {
        this.pendingStories = await Story.pendingTasks(this, this.client);
    }

    /**
     * Fetches and updates workflows for the workspace
     * @returns {Promise<Workflow[]>} Array of workflows
     */
    async getWorkflows(): Promise<Workflow[]> {
        this.workflows = await Workflow.get(this);
        return this.workflows;
    }

    /**
     * Fetches and organizes stories assigned to the workspace member
     * Groups stories by workflow and workflow state
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
