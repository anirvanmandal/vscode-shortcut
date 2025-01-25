import { Story } from "./story";
import { ShortcutClient } from "@shortcut/client";
import { BaseModel } from "./base";
export class Workspace {
    name: string;
    client: ShortcutClient;
    stories: Story[];

    constructor(name: string, client: ShortcutClient, stories: Story[]) {
        this.name = name ?? "";
        this.stories = stories ?? [];
        this.client = client;
    }

    async getStories(): Promise<Story[]> {
        this.stories = await Story.pendingTasks(this.client);
        return this.stories;
    }
}
