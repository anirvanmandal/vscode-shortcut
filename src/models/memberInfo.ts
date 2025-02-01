import { BaseModel } from "./base";
import { Workspace } from "./workspace";

/**
 * Represents information about a Shortcut member/user.
 * Handles member data management including caching and retrieval.
 * @extends BaseModel
 */
export class MemberInfo extends BaseModel {
    /** Unique identifier for the member */
    id: string;
    /** Full name of the member */
    name: string;
    /** Username/mention handle of the member */
    mention_name: string;

    /**
     * Creates a new MemberInfo instance.
     * @param {string} [id=""] - The unique identifier for the member
     * @param {string} [name=""] - The full name of the member
     * @param {string} [mentionName=""] - The mention name/username of the member
     */
    constructor(id?: string, name?: string, mentionName?: string) {
        super();
        this.id = id ?? "";
        this.name = name ?? "";
        this.mention_name = mentionName ?? "";
    }

    /**
     * Creates a MemberInfo instance from JSON data.
     * @param {any} json - The JSON data containing member information
     * @returns {MemberInfo} A new MemberInfo instance
     */
    static fromJson(json: any): MemberInfo {
        return new MemberInfo(json.id, json.name, json.mention_name);
    }

    /**
     * Fetches current member information from the Shortcut API.
     * @param {Workspace} workspace - The current workspace
     * @returns {Promise<MemberInfo>} A promise that resolves to a MemberInfo instance
     */
    static async fetch(workspace: Workspace): Promise<MemberInfo> {
        const response = await workspace.client.getCurrentMemberInfo();
        const memberInfo = MemberInfo.fromJson(response.data);
        workspace.updateAttributes(response.data, memberInfo);
        
        return memberInfo;
    }

    /**
     * Retrieves cached member information for a workspace.
     * @param {string} workspaceName - Name of the workspace
     * @returns {MemberInfo | null} The cached MemberInfo instance or null if not found
     */
    static fetchFromCache(workspaceName: string): MemberInfo | null {
        const cacheKey = MemberInfo.cacheKey(workspaceName);
        const cache = BaseModel.context.globalState.get(cacheKey);
        if (cache) {
            return MemberInfo.fromJson(JSON.parse(cache));
        }
        return null;
    }

    /**
     * Saves member information to the cache.
     * @param {string} workspaceName - Name of the workspace
     * @param {MemberInfo} memberInfo - The member information to cache
     */
    static async saveToCache(workspaceName: string, memberInfo: MemberInfo) {
        MemberInfo.context.globalState.update(MemberInfo.cacheKey(workspaceName), JSON.stringify(memberInfo.toObject()));
    }

    /**
     * Converts the MemberInfo instance to a plain JavaScript object.
     * @returns {object} A plain object representation of the member info
     */
    toObject(): object {
        return {
            id: this.id,
            name: this.name,
            mention_name: this.mention_name
        };
    }

    /**
     * Generates a cache key for storing member information.
     * @param {string} workspaceName - Name of the workspace
     * @returns {string} The generated cache key
     */
    static cacheKey(workspaceName: string): string {
        return `${workspaceName}-memberInfo`;
    }

    /**
     * Gets member information, first trying cache then falling back to API.
     * @param {Workspace} workspace - The current workspace
     * @returns {Promise<MemberInfo>} A promise that resolves to a MemberInfo instance
     */
    static async get(workspace: Workspace): Promise<MemberInfo> {
        let memberInfo = MemberInfo.fetchFromCache(workspace.name);
        
        if (memberInfo) {
            console.log("loaded from cache");
            return memberInfo;
        }
        
        memberInfo = await MemberInfo.fetch(workspace);
        MemberInfo.saveToCache(workspace.name, memberInfo);

        return memberInfo;
    }

    /**
     * Deletes cached member information for a workspace.
     * @param {string} workspaceName - Name of the workspace
     */
    static deleteCache(workspaceName: string) {
        const cacheKey = MemberInfo.cacheKey(workspaceName);
        MemberInfo.context.globalState.update(MemberInfo.cacheKey(workspaceName), undefined);
    }
}
