import { BaseAccess } from "src/common/entities/base-access.entity";
import { Page } from "./page.entity";
import { Entity, JoinColumn, ManyToOne } from "typeorm";

@Entity("page_access")
export class PageAccess extends BaseAccess<Page> {
  @ManyToOne(() => Page, (p) => p.accessControl, { onDelete: "CASCADE" })
  @JoinColumn({ name: "page_id" })
  page: Page;

  get securedResource(): Page {
    return this.page;
  }
}
