import { BaseModel } from "./base";
import { Workspace } from "./workspace";
import { Task } from "./task";
import { StorySearchResults, Story as ShortcutStory, Task as ShortcutTask, ShortcutClient } from "@shortcut/client";

export class Story extends BaseModel {
    id: number;
    app_url: string;
    name: string;
    tasks: Task[];
    workflow_id: number;
    workflow_state_id: number;
    
    constructor(story: ShortcutStory | any) {
        super();
        this.id = story.id ?? "";
        this.name = story.name ?? "";
        this.app_url = story.app_url ?? "";
        this.tasks = story.tasks.map((task: ShortcutTask) => new Task(task));
        this.workflow_id = story.workflow_id ?? 0;
        this.workflow_state_id = story.workflow_state_id ?? 0;
    }

    static async all(): Promise<Story[]> {
        const response = await Story.client.searchStories({ query: "is:story and is:started and has:tasks and !is:archived", page_size: 25, detail: "full" });
        let stories = Story.parseStorySearchResults(response.data);        
        return stories;
    }

    static async pendingTasks(workspace: Workspace, client: ShortcutClient): Promise<Story[]> {
        BaseModel.client = client;
        const all_stories = await Story.all();
        const member = workspace.memberInfo;
        if (!member) {
            return [];
        }
        return all_stories.filter(story => story.tasks.some(task => task.member_mention_ids.includes(member.id) && !task.complete));
    }

    static async assignedToMember(workspace: Workspace): Promise<Story[]> {
        let response = await workspace.client.searchStories({ query: `!is:done and !is:archived and owner:${workspace.memberInfo?.mention_name}`, page_size: 25, detail: "full" });
        let stories = Story.parseStorySearchResults(response.data);

        while (response.data.next !== null) {
            response = await workspace.client.searchStories({ query: `!is:done and !is:archived and owner:${workspace.memberInfo?.mention_name}`, page_size: 25, detail: "full", next: response.data.next });
            stories = stories.concat(Story.parseStorySearchResults(response.data));
        }

        return stories;
    }

    storyIdentifier(): string {
        return this.app_url.split('/').pop()?.split('-').slice(0, 6).join('-') ?? '';
    }

    branchName(workspace: Workspace): string {
        return `${workspace.memberInfo?.mention_name}/sc-${this.id}/${this.storyIdentifier()}`;
    }

    static parseStorySearchResults(results: StorySearchResults): Story[] {
        return results.data.map(story => new Story(story));
    }
}
