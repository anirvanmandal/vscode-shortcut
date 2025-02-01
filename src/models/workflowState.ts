import { BaseModel } from "./base";
import { Story } from "./story";

export class WorkflowState extends BaseModel {
    id: number;
    name: string;
    stories: Story[];

    constructor(id?: number, name?: string, stories?: Story[]) {
        super();
        this.id = id ?? 0;
        this.name = name ?? "";
        this.stories = stories ?? [];
    }

    static fromJson(json: any): WorkflowState[] {
        return json.map((jsonWorkflow: any) => new WorkflowState(jsonWorkflow.id, jsonWorkflow.name));
    }

    toObject(): object {
        return {
            id: this.id,
            name: this.name
        };
    }
}
