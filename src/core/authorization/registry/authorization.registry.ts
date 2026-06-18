import { Injectable } from "@nestjs/common";
import { FgaService } from "../fga.service";
import {  FGA_RESOURCE ,FgaTuple,ResourceType} from "../types/fga.types";
import {  AuthAction, ResourcePayloadMap, TeamsPayload, UserPayload, WebsitePayload } from "../queue/payload.types";

@Injectable()
export class AuthorizationRegistry {
  constructor(private readonly fgaService: FgaService) {}

  private readonly handlers: {
      [K in keyof ResourcePayloadMap]: (payload: ResourcePayloadMap[K]) => Promise<void>
    } = {
      [FGA_RESOURCE.TEAM]: async (payload: TeamsPayload) => {
        const { teamId, websiteIds, userIds, action } = payload;
      
        const tuples: FgaTuple<any>[] =  [
        ];
          if (websiteIds) {
            for (const websiteId of websiteIds) {
              const tuple = this.fgaService.makeFgaTuple( FGA_RESOURCE.WEBSITE, `${websiteId}` , 'parent', `team:${teamId}`);
              tuples.push(tuple);
            }
          }
          if (userIds) {
            for (const userId of userIds) {
              const tuple = this.fgaService.makeFgaTuple( FGA_RESOURCE.TEAM, `${teamId}` , 'member', `user:${userId}`);
              tuples.push(tuple);
            }
          }
          await this.applyBatch(action, tuples);
            
       },
      [FGA_RESOURCE.USER]: async (payload: UserPayload,) => { 
        

      },
      [FGA_RESOURCE.WEBSITE]: async (payload: WebsitePayload) => { 
        

      },
      
      
    };
      

  async execute(type: ResourceType, payload: any): Promise<void> {
    const handler = this.handlers[type];
    if (!handler) throw new Error(`No handler for resource: ${type}`);
    await handler(payload);
  }

  private async applyBatch(action: AuthAction, tuples: FgaTuple<any>[]) {
  if (tuples.length === 0) return;
  return action === 'create' 
    ? await this.fgaService.createBatchesRelationships(tuples)
    : await this.fgaService.deleteBatchesRelationships(tuples);
}
}