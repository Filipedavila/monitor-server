/*import { BaseAccess } from "@common/entities/base-access.entity";
import { Website } from "./website.entity";
import { Entity, JoinColumn, ManyToOne } from "typeorm";

@Entity("website_access")
export class WebsiteAccess extends BaseAccess<Website> {
  @ManyToOne(() => Website, (w) => w.accessControl, { onDelete: "CASCADE" })
  @JoinColumn({ name: "website_id" })
  website: Website;

  get securedResource(): Website {
    return this.website;
  }
}
*/