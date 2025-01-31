import { BaseModel } from "./base";
import { Workspace } from "./workspace";

export class MemberInfo extends BaseModel {
    id: string;
    name: string;
    mention_name: string;
    workspace: Workspace | undefined;

    constructor(id?: string, name?: string, mentionName?: string) {
        super();
        this.id = id ?? "";
        this.name = name ?? "";
        this.mention_name = mentionName ?? "";
    }

    static fromJson(json: any): MemberInfo {
        return new MemberInfo(json.id, json.name, json.mention_name);
    }

    static async fetch(workspace: Workspace): Promise<MemberInfo> {
        const response = await workspace.client.getCurrentMemberInfo();
        const memberInfo = MemberInfo.fromJson(response.data);
        memberInfo.workspace = workspace;
        workspace.updateAttributes(response.data, memberInfo);
        
        return memberInfo;
    }

    static fetchFromCache(workspaceName: string): MemberInfo | null {
        const cacheKey = MemberInfo.cacheKey(workspaceName);
        const cache = BaseModel.context.globalState.get(cacheKey);
        if (cache) {
            return MemberInfo.fromJson(JSON.parse(cache));
        }
        return null;
    }

    static async saveToCache(workspaceName: string, memberInfo: MemberInfo) {
        MemberInfo.context.globalState.update(MemberInfo.cacheKey(workspaceName), JSON.stringify(memberInfo.toObject()));
    }

    toObject(): object {
        return {
            id: this.id,
            name: this.name,
            mention_name: this.mention_name
        };
    }

    static cacheKey(workspaceName: string): string {
        return `${workspaceName}-memberInfo`;
    }

    static async get(workspace: Workspace): Promise<MemberInfo> {
        let memberInfo = MemberInfo.fetchFromCache(workspace.name);
        
        if (memberInfo) {
            memberInfo.workspace = workspace;
            console.log("loaded from cache");
            return memberInfo;
        }
        
        memberInfo = await MemberInfo.fetch(workspace);
        MemberInfo.saveToCache(workspace.name, memberInfo);

        return memberInfo;
    }

    static deleteCache(workspaceName: string) {
        const cacheKey = MemberInfo.cacheKey(workspaceName);
        MemberInfo.context.globalState.update(MemberInfo.cacheKey(workspaceName), undefined);
    }
}
