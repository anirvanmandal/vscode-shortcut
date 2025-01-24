import { BaseModel } from "./base";

export class MemberInfo extends BaseModel {
    id: string;
    name: string;
    mention_name: string;

    constructor(id?: string, name?: string, mentionName?: string) {
        super();
        this.id = id ?? "";
        this.name = name ?? "";
        this.mention_name = mentionName ?? "";
    }

    static fromJson(json: any): MemberInfo {
        return new MemberInfo(json.id, json.name, json.mention_name);
    }

    static async fetch(): Promise<MemberInfo> {
        const response = await MemberInfo.client.getCurrentMemberInfo();
        return MemberInfo.fromJson(response.data);
    }

    static fetchFromCache(): MemberInfo | null {
        const cache = BaseModel.context.globalState.get('memberInfo');
        if (cache) {
            return MemberInfo.fromJson(JSON.parse(cache));
        }
        return null;
    }

    static async saveToCache(memberInfo: MemberInfo) {
        BaseModel.context.globalState.update('memberInfo', JSON.stringify(memberInfo));
    }

    static async get(): Promise<MemberInfo> {
        let memberInfo = MemberInfo.fetchFromCache();
        if (memberInfo) {
            return memberInfo;
        }
        
        memberInfo = await MemberInfo.fetch();
        await MemberInfo.saveToCache(memberInfo);
        
        return memberInfo;
    }

    static deleteCache() {
        BaseModel.context.globalState.update('memberInfo', undefined);
    }
}
