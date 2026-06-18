import {  FGA_RESOURCE,ResourceType } from "../types/fga.types";


export const AuthorizationEvent = {
  AUTHORIZATION: 'authorization',
} as const;

export type AuthorizationEventType = typeof AuthorizationEvent[keyof typeof AuthorizationEvent];

export interface PublishEventAuthOptions<T extends keyof ResourcePayloadMap> {
  aggregateType: T;
  aggregateId: number;
  eventType:  AuthorizationEventType;
  payload: ResourcePayloadMap[T];
}
export interface ResourcePayloadMap {
  [FGA_RESOURCE.TEAM]: TeamsPayload;
  [FGA_RESOURCE.WEBSITE]: WebsitePayload;
  [FGA_RESOURCE.USER]: UserPayload;
}

export type AuthAction = 'create' | 'update' | 'delete' | 'read';

export type AuthPayload = TeamsPayload | WebsitePayload | UserPayload;

export interface BaseAuthPayload<T  extends ResourceType> {
    resourceType: T;
    resourceId: number;
    action: AuthAction;
}

export interface TeamsPayload extends BaseAuthPayload<typeof FGA_RESOURCE.TEAM> {
  resourceType:  typeof FGA_RESOURCE.TEAM;
  teamId: number;
  websiteIds?: number[];
  userIds?: number[];
}

export interface WebsitePayload extends BaseAuthPayload<typeof FGA_RESOURCE.WEBSITE> {
  resourceType:  typeof FGA_RESOURCE.WEBSITE;
  websiteId: number;
  status: string;
}

export interface UserPayload extends BaseAuthPayload<typeof FGA_RESOURCE.USER> {
  resourceType:  typeof FGA_RESOURCE.USER;
  userId: number;
  role: string;
}