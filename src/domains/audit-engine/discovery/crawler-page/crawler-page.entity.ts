import { Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn, Index } from 'typeorm';
import { CrawlerWebsite } from '../crawler-website/entities/crawler-website.entity';
import { IdentifiableModel } from 'src/common/interfaces/Identifiable.interface';
@Entity('crawler_pages')
@Index('uq_crawler_pages_site_url_hash', ['crawlerWebsiteId', 'urlHash'], { unique: true })
export class CrawlerPage implements IdentifiableModel {
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'BY DEFAULT' })
  id: number;

  @ManyToOne('CrawlerWebsite', 'pages', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'crawler_website_id' })
  crawlerWebsite: CrawlerWebsite;

  @Column({
    name: 'crawler_website_id',
    type: 'int',
    unsigned: true,
    nullable: false,
  })
  crawlerWebsiteId: number;

  @Column({
    type: 'text',
    nullable: false,
  })
  url: string;

  @Column({
    name: 'url_hash',
    type: 'bigint',
    nullable: false,
  })
  urlHash: string;
}
