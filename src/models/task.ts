import { Task as ShortcutTask } from "@shortcut/client";
import { BaseModel } from "./base";

export class Task extends BaseModel {
    id: number;
    description: string;
    created_at: string;
    member_mention_ids: string[];
    complete: boolean;

    constructor(task: ShortcutTask) {
        super();
        this.id = task.id ?? "";
        this.description = task.description ?? "";
        this.created_at = task.created_at ?? "";
        this.member_mention_ids = task.member_mention_ids ?? [];
        this.complete = task.complete ?? false;
    }
}
