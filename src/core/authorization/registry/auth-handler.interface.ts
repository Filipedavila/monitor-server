import { ResourcePayloadMap } from "../queue/payload.types";


export interface AuthorizationHandler<K extends keyof ResourcePayloadMap> {
  process(payload: ResourcePayloadMap[K]): Promise<void>;
}