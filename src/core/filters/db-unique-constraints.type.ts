import { Institution } from "src/domains/inventory/institution/institution.entity";
import { Website }  from "src/domains/inventory/website/website.entity";

export type UniqueEntityProperty = 
  | keyof Institution 
  | keyof Website;

export enum DbUniqueConstraint {
  ORGANIZATION_SHORT_NAME = 'short_name',
  ORGANIZATION_LONG_NAME = 'long_name',
  WEBSITE_BASE_URL = 'base_url',
}

export const UNIQUE_CONSTRAINT_MAPPINGS: Record<
  DbUniqueConstraint,
  { property: UniqueEntityProperty; message: string }
> = {
  [DbUniqueConstraint.ORGANIZATION_SHORT_NAME]: {
    property: 'shortName', 
    message: 'Organization with this shortName already exists.',
  },
  [DbUniqueConstraint.ORGANIZATION_LONG_NAME]: {
    property: 'longName',
    message: 'Organization with this longName already exists.',
  },
  [DbUniqueConstraint.WEBSITE_BASE_URL]: {
    property: 'baseUrl',
    message: 'Website with this baseUrl already exists.',
  },
};