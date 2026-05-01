import { Factory } from "fishery";
import { faker } from "@faker-js/faker";
import { Website } from "src/domains/inventory/website/website.entity";

interface WebsiteTransient {
  authorId?: number;
  roleId?: number;
}

export const websiteFactory = Factory.define<Website, WebsiteTransient>(
  ({ sequence, transientParams, onCreate }) => {
    onCreate(async (website) => {
      return website;
    });

    const authorId = transientParams.authorId || 1;
    const ownerId = transientParams.ownerId || 1;

    return {
      id: sequence,
      createdBy: authorId,
      updatedBy: authorId,
      ownerRoleId: ownerId,

      // Propriedades de Website
      title: faker.company.name(),
      baseUrl: faker.internet.url(),
      declarationStatus: 0,
      stampStatus: 0,

      // Relações (Iniciadas como arrays vazios para evitar erros de undefined em loops)
      tags: [],
      institutions: [],
      pages: [],
      accessibilityStatements: [],
      crawls: [],
    } as Website;
  },
);
