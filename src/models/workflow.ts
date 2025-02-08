/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseModel } from "./base";
import { Workspace } from "./workspace";
import { WorkflowState } from "./workflowState";

/**
 * Represents a workflow in Shortcut, which contains a sequence of states that stories can progress through.
 * @extends {BaseModel}
 */
export class Workflow extends BaseModel {
    /** Unique identifier for the workflow */
    id: number;
    /** Name of the workflow */
    name: string;
    /** Array of workflow states that stories can be in */
    states: WorkflowState[];

    /**
     * Creates a new Workflow instance
     * @param {number} [id=0] - The workflow's unique identifier
     * @param {string} [name=""] - The name of the workflow
     * @param {WorkflowState[]} [states=[]] - The states associated with this workflow
     */
    constructor(id?: number, name?: string, states?: WorkflowState[]) {
        super();
        this.id = id ?? 0;
        this.name = name ?? "";
        this.states = states ?? [];
    }

    /**
     * Creates an array of Workflow instances from JSON data
     * @param {any} json - The JSON data to parse
     * @returns {Workflow[]} Array of Workflow instances
     */
    static fromJson(json: any): Workflow[] {
        return json.map((jsonWorkflow: any) => new Workflow(jsonWorkflow.id, jsonWorkflow.name, jsonWorkflow.states.map((jsonState: any) => new WorkflowState(jsonState.id, jsonState.name))));
    }

    /**
     * Fetches workflows from the Shortcut API
     * @param {Workspace} workspace - The workspace to fetch workflows for
     * @returns {Promise<Workflow[]>} Promise resolving to array of workflows
     */
    static async fetch(workspace: Workspace): Promise<Workflow[]> {
        const response = await workspace.client.listWorkflows();
        const workflows = Workflow.fromJson(response.data);
        return workflows;
    }

    /**
     * Retrieves workflows from the local cache
     * @param {string} workspaceName - Name of the workspace to get cached workflows for
     * @returns {Workflow[] | null} Array of workflows if found in cache, null otherwise
     */
    static fetchFromCache(workspaceName: string): Workflow[] | null {
        const cacheKey = Workflow.cacheKey(workspaceName);
        const cache = BaseModel.context.globalState.get<string>(cacheKey);
        if (cache) {
            return Workflow.fromJson(JSON.parse(cache));
        }
        return null;
    }

    /**
     * Saves workflows to the local cache
     * @param {string} workspaceName - Name of the workspace the workflows belong to
     * @param {Workflow[]} workflows - Array of workflows to cache
     */
    static async saveToCache(workspaceName: string, workflows: Workflow[]) {
        Workflow.context.globalState.update(Workflow.cacheKey(workspaceName), JSON.stringify(workflows.map(workflow => workflow.toObject())));
    }

    /**
     * Converts the workflow instance to a plain JavaScript object
     * @returns {object} Plain object representation of the workflow
     */
    toObject(): object {
        return {
            id: this.id,
            name: this.name,
            states: this.states.map(state => state.toObject())
        };
    }

    /**
     * Generates a cache key for storing workflow data
     * @param {string} workspaceName - Name of the workspace
     * @returns {string} Cache key string
     */
    static cacheKey(workspaceName: string): string {
        return `${workspaceName}-workflows`;
    }

    /**
     * Gets workflows either from cache or fetches from API if not cached
     * @param {Workspace} workspace - The workspace to get workflows for
     * @returns {Promise<Workflow[]>} Promise resolving to array of workflows
     */
    static async get(workspace: Workspace): Promise<Workflow[]> {
        let workflows = Workflow.fetchFromCache(workspace.name);
        
        if (workflows) {
            console.log("loaded from cache");
            return workflows;
        }
        
        workflows = await Workflow.fetch(workspace);
        Workflow.saveToCache(workspace.name, workflows);

        return workflows;
    }

    /**
     * Removes workflows from the cache for a given workspace
     * @param {string} workspaceName - Name of the workspace to clear cache for
     */
    static deleteCache(workspaceName: string) {
        const cacheKey = Workflow.cacheKey(workspaceName);
        Workflow.context.globalState.update(cacheKey, undefined);
    }
}
