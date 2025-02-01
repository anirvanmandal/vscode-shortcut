import { BaseModel } from "./base";
import { Story } from "./story";

/**
 * Represents a workflow state in the Shortcut project management system.
 * A workflow state defines a stage in the project's process (e.g., "In Progress", "Ready for Review").
 * @extends BaseModel
 */
export class WorkflowState extends BaseModel {
    /** Unique identifier for the workflow state */
    id: number;
    /** Name of the workflow state */
    name: string;
    /** Collection of stories that are currently in this workflow state */
    stories: Story[];

    /**
     * Creates a new WorkflowState instance.
     * @param {number} [id=0] - The unique identifier for the workflow state
     * @param {string} [name=""] - The name of the workflow state
     * @param {Story[]} [stories=[]] - The stories associated with this workflow state
     */
    constructor(id?: number, name?: string, stories?: Story[]) {
        super();
        this.id = id ?? 0;
        this.name = name ?? "";
        this.stories = stories ?? [];
    }

    /**
     * Creates an array of WorkflowState instances from JSON data.
     * @param {any} json - The JSON data containing workflow state information
     * @returns {WorkflowState[]} An array of WorkflowState instances
     */
    static fromJson(json: any): WorkflowState[] {
        return json.map((jsonWorkflow: any) => new WorkflowState(jsonWorkflow.id, jsonWorkflow.name));
    }

    /**
     * Converts the WorkflowState instance to a plain JavaScript object.
     * @returns {object} A plain object representation of the workflow state
     */
    toObject(): object {
        return {
            id: this.id,
            name: this.name
        };
    }
}
