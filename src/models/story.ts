import { BaseModel } from "./base";
import { Task } from "./task";
import { MemberInfo } from "./memberInfo";
import { StorySearchResults, Story as ShortcutStory, Task as ShortcutTask, ShortcutClient } from "@shortcut/client";

export class Story extends BaseModel {
    id: number;
    app_url: string;
    name: string;
    tasks: Task[];
    
    constructor(story: ShortcutStory | any) {
        super();
        this.id = story.id ?? "";
        this.name = story.name ?? "";
        this.app_url = story.app_url ?? "";
        this.tasks = story.tasks.map((task: ShortcutTask) => new Task(task));
    }

    static async all(): Promise<Story[]> {
        const response = await Story.client.searchStories({ query: "is:story and is:started and has:tasks and !is:archived", page_size: 25, detail: "full" });
        let stories = Story.parseStorySearchResults(response.data);        
        return stories;
    }

    static async pendingTasks(client: ShortcutClient): Promise<Story[]> {
        BaseModel.client = client;
        const all_stories = await Story.all();
        const member = await MemberInfo.get();
        return all_stories.filter(story => story.tasks.some(task => task.member_mention_ids.includes(member.id) && !task.complete));
    }

    static parseStorySearchResults(results: StorySearchResults): Story[] {
        return results.data.map(story => new Story(story));
    }
}
