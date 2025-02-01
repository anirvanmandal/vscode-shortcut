import { BaseModel } from "./base";
import { Workspace } from "./workspace";
import { WorkflowState } from "./workflowState";

export class Workflow extends BaseModel {
    id: number;
    name: string;
    states: WorkflowState[];

    constructor(id?: number, name?: string, states?: WorkflowState[]) {
        super();
        this.id = id ?? 0;
        this.name = name ?? "";
        this.states = states ?? [];
    }

    static fromJson(json: any): Workflow[] {
        return json.map((jsonWorkflow: any) => new Workflow(jsonWorkflow.id, jsonWorkflow.name, jsonWorkflow.states.map((jsonState: any) => new WorkflowState(jsonState.id, jsonState.name))));
    }

    static async fetch(workspace: Workspace): Promise<Workflow[]> {
        const response = await workspace.client.listWorkflows();
        const workflows = Workflow.fromJson(response.data);

        return workflows;
    }

    static fetchFromCache(workspaceName: string): Workflow[] | null {
        const cacheKey = Workflow.cacheKey(workspaceName);
        const cache = BaseModel.context.globalState.get(cacheKey);
        if (cache) {
            return Workflow.fromJson(JSON.parse(cache));
        }
        return null;
    }

    static async saveToCache(workspaceName: string, workflows: Workflow[]) {
        Workflow.context.globalState.update(Workflow.cacheKey(workspaceName), JSON.stringify(workflows.map(workflow => workflow.toObject())));
    }

    toObject(): object {
        return {
            id: this.id,
            name: this.name,
            states: this.states.map(state => state.toObject())
        };
    }

    static cacheKey(workspaceName: string): string {
        return `${workspaceName}-workflows`;
    }

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

    static deleteCache(workspaceName: string) {
        const cacheKey = Workflow.cacheKey(workspaceName);
        Workflow.context.globalState.update(cacheKey, undefined);
    }
}
