import { BaseModel } from "./base";
import { Workspace } from "./workspace";
import { Task } from "./task";
import { StorySearchResults, Story as ShortcutStory, Task as ShortcutTask, ShortcutClient } from "@shortcut/client";

/**
 * Represents a Story in the Shortcut project management system.
 * Stories are the main unit of work in Shortcut, similar to issues or tickets in other systems.
 * @extends BaseModel
 */
export class Story extends BaseModel {
    /** Unique identifier for the story */
    id: number;
    /** Web URL where the story can be accessed in the Shortcut UI */
    app_url: string;
    /** Title/name of the story */
    name: string;
    /** List of tasks associated with this story */
    tasks: Task[];
    /** ID of the workflow this story belongs to */
    workflow_id: number;
    /** ID of the current workflow state of this story */
    workflow_state_id: number;
    
    /**
     * Creates a new Story instance from Shortcut story data.
     * @param {ShortcutStory | any} story - The story data from Shortcut API
     */
     
    constructor(story: ShortcutStory) {
        super();
        this.id = story.id;
        this.name = story.name;
        this.app_url = story.app_url;
        this.tasks = story.tasks.map((task: ShortcutTask) => new Task(task));
        this.workflow_id = story.workflow_id ?? 0;
        this.workflow_state_id = story.workflow_state_id ?? 0;
    }

    /**
     * Retrieves all active stories with tasks that aren't archived.
     * @returns {Promise<Story[]>} A promise that resolves to an array of Story instances
     */
    static async all(): Promise<Story[]> {
        const response = await Story.client.searchStories({ query: "is:story and is:started and has:tasks and !is:archived", page_size: 25, detail: "full" });
        const stories = Story.parseStorySearchResults(response.data);        
        return stories;
    }

    /**
     * Retrieves all stories with pending tasks for the current workspace member.
     * @param {Workspace} workspace - The current workspace
     * @param {ShortcutClient} client - The Shortcut API client
     * @returns {Promise<Story[]>} A promise that resolves to an array of Story instances with pending tasks
     */
    static async pendingTasks(workspace: Workspace, client: ShortcutClient): Promise<Story[]> {
        BaseModel.client = client;
        const all_stories = await Story.all();
        const member = workspace.memberInfo;
        if (!member) {
            return [];
        }
        return all_stories.filter(story => story.tasks.some(task => task.member_mention_ids.includes(member.id) && !task.complete));
    }
    pendingTasks(workspace: Workspace): Task[] {
        const memberId = workspace.memberInfo?.id;
        if (!memberId) {
            return [];
        }
        return this.tasks.filter(task => task.member_mention_ids.includes(memberId) && !task.complete);
    }

    /**
     * Retrieves all stories assigned to the current workspace member.
     * @param {Workspace} workspace - The current workspace
     * @returns {Promise<Story[]>} A promise that resolves to an array of Story instances
     */
    static async assignedToMember(workspace: Workspace): Promise<Story[]> {
        let response = await workspace.client.searchStories({ query: `!is:done and !is:archived and owner:${workspace.memberInfo?.mention_name}`, page_size: 25, detail: "full" });
        let stories = Story.parseStorySearchResults(response.data);

        while (response.data.next !== null) {
            response = await workspace.client.searchStories({ query: `!is:done and !is:archived and owner:${workspace.memberInfo?.mention_name}`, page_size: 25, detail: "full", next: response.data.next });
            stories = stories.concat(Story.parseStorySearchResults(response.data));
        }

        return stories;
    }

    /**
     * Extracts the story identifier from the story's URL.
     * @returns {string} The story identifier
     */
    storyIdentifier(): string {
        return this.name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-').replace(/--+/g, '-').replace(/-$/, '').split('-').slice(0, 6).join('-');
    }

    /**
     * Generates a git branch name for the story based on workspace member and story details.
     * @param {Workspace} workspace - The current workspace
     * @returns {string} The generated branch name
     */
    branchName(workspace: Workspace): string {
        return `${workspace.memberInfo?.mention_name}/sc-${this.id}/${this.storyIdentifier()}`;
    }

    /**
     * Parses story search results into Story instances.
     * @param {StorySearchResults} results - The search results from Shortcut API
     * @returns {Story[]} An array of Story instances
     */
    static parseStorySearchResults(results: StorySearchResults): Story[] {
        return results.data.map(story => new Story(story as ShortcutStory));
    }
}
