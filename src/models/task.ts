import { Task as ShortcutTask } from "@shortcut/client";
import { BaseModel } from "./base";

/**
 * Represents a Task within a Story in the Shortcut project management system.
 * Tasks are sub-items of Stories that represent smaller, specific pieces of work.
 * @extends BaseModel
 */
export class Task extends BaseModel {
    /** Unique identifier for the task */
    id: number;
    /** Text description of the task */
    description: string;
    /** ISO timestamp when the task was created */
    created_at: string;
    /** Array of member IDs that are mentioned in the task */
    member_mention_ids: string[];
    /** Whether the task has been marked as complete */
    complete: boolean;

    /**
     * Creates a new Task instance from Shortcut task data.
     * @param {ShortcutTask} task - The task data from Shortcut API
     */
    constructor(task: ShortcutTask) {
        super();
        this.id = task.id ?? "";
        this.description = task.description ?? "";
        this.created_at = task.created_at ?? "";
        this.member_mention_ids = task.member_mention_ids ?? [];
        this.complete = task.complete ?? false;
    }
}
