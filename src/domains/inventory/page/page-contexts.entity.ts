import { Context } from "src/domains/inventory/context/context.identity";
import { Entity, Index, PrimaryColumn, ManyToOne, JoinColumn } from "typeorm";
import { Page } from "./page.entity";


@Entity("page_contexts")
@Index("idx_page_contexts_lookup", ["contextId", "pageId"])
export class PageContext {
  
  @PrimaryColumn({ name: "context_id", type: "int" })
  contextId: number;

  @PrimaryColumn({ name: "page_id", type: "int" })
  pageId: number;

  @ManyToOne(() => Page, { onDelete: 'CASCADE' })
  @JoinColumn({ name: "page_id" })
  page: Page;

  @ManyToOne(() => Context, { onDelete: 'CASCADE' })
  @JoinColumn({ name: "context_id" })
  context: Context;
}