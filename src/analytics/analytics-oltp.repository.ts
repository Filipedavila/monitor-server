import {  Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { BasicMetricsDTO } from './dto/basic-metrics.dto';
import { BRONZE, NAO_CONFORME, OURO, PARCIALMENTE_CONFORME, PLENAMENTE_CONFORME, PRATA } from 'src/domains/compliance/accessibility-statement/contants';
import { State } from 'src/domains/compliance/accessibility-statement/state';
import { Website } from 'src/domains/inventory/website/website.entity';
import { AccessibilityStatement } from 'src/domains/compliance/accessibility-statement/entities/accessibility-statement.entity';

@Injectable()
export class AnalyticsOLTPRepository {
  constructor(
    private readonly entityManager: EntityManager,
  ) {}



    async getBasicMetrics(): Promise<BasicMetricsDTO> {
      const result = await this.entityManager.query(`
        SELECT
        (SELECT COUNT(DISTINCT directoryID) FROM directories) AS nDirectories,
        (SELECT COUNT(DISTINCT websiteId) FROM websites) AS nWebsites,
        (SELECT COUNT(DISTINCT page_id) FROM pages) AS nPages,
        (SELECT COUNT(DISTINCT tag_id) FROM tags) AS nTags,
        (SELECT COUNT(DISTINCT category_id) FROM categories WHERE show_in_observatory = 1) AS nCategories,
        (SELECT COUNT(DISTINCT organization_id) FROM organizations) AS nEntities,
        (SELECT MAX(evaluationDate) FROM evaluations) AS recentPage,
        (SELECT MIN(evaluationDate) FROM evaluations) AS oldestPage;
      `);
      if (!result || result.length === 0) {
      throw new Error('Failed to retrieve metrics counters from the database.');
      }
      const rawData = result[0];
      return {
      nDirectories: Number.parseInt(rawData.ndirectories ?? rawData.nDirectories, 10),
      nWebsites: Number.parseInt(rawData.nwebsites ?? rawData.nWebsites, 10),
      nPages: Number.parseInt(rawData.npages ?? rawData.nPages, 10),
      nTags: Number.parseInt(rawData.ntags ?? rawData.nTags, 10),
      nCategories: Number.parseInt(rawData.ncategories ?? rawData.nCategories, 10),
      nEntities: Number.parseInt(rawData.nentities ?? rawData.nEntities, 10),
      recentPage: new Date(rawData.recentpage ?? rawData.recentPage), 
      oldestPage: new Date(rawData.oldestpage ?? rawData.oldestPage),
      }
    };

  async getStateCounts(): Promise<Record<string, string> | undefined> {
    const alias = "stmt";
    return this.entityManager
      .createQueryBuilder(AccessibilityStatement, alias)
      .select(`SUM(CASE WHEN ${alias}.state = :complete THEN 1 ELSE 0 END)`, "completeStatement")
      .addSelect(`SUM(CASE WHEN ${alias}.state = :incomplete THEN 1 ELSE 0 END)`, "incompleteStatement")
      .addSelect(`SUM(CASE WHEN ${alias}.state = :possible THEN 1 ELSE 0 END)`, "possibleStatement")
      .setParameters({
        complete: State.completeStatement,
        incomplete: State.incompleteStatement,
        possible: State.possibleStatement,
      })
      .getRawOne();
  }

  async getConformanceCounts(): Promise<Record<string, string> | undefined> {
    const alias = "stmt";
    return this.entityManager
      .createQueryBuilder(AccessibilityStatement, alias)
      .select(`SUM(CASE WHEN ${alias}.conformance = :plenamente THEN 1 ELSE 0 END)`, "plenamenteConforme")
      .addSelect(`SUM(CASE WHEN ${alias}.conformance = :parcialmente THEN 1 ELSE 0 END)`, "parcialmenteConforme")
      .addSelect(`SUM(CASE WHEN ${alias}.conformance = :nao THEN 1 ELSE 0 END)`, "naoConforme")
      .setParameters({
        plenamente: PLENAMENTE_CONFORME,
        parcialmente: PARCIALMENTE_CONFORME,
        nao: NAO_CONFORME,  
      })
      .getRawOne();
  }
  
  async getSealCounts(): Promise<Record<string, string> | undefined> {
        const alias = "stmt";

    return this.entityManager
      .createQueryBuilder(AccessibilityStatement, alias)
      .select(`SUM(CASE WHEN ${alias}.seal = :bronze THEN 1 ELSE 0 END)`, "bronze")
      .addSelect(`SUM(CASE WHEN ${alias}.seal = :prata THEN 1 ELSE 0 END)`, "prata")
      .addSelect(`SUM(CASE WHEN ${alias}.seal = :ouro THEN 1 ELSE 0 END)`, "ouro")
      .setParameters({ bronze: BRONZE, prata: PRATA, ouro: OURO })
      .getRawOne();
  }

  // --- Directory aggregate queries ---

  private directoryJoin(qb: ReturnType<typeof this.entityManager.createQueryBuilder>) {
    const alias = "stmt";
    return qb
      .innerJoin("website_tags", "wt", `wt.website_id = ${alias}.website_id`)
      .innerJoin("directory_tags", "dt", "dt.tag_id = wt.tag_id")
      .innerJoin("directories", "d", "d.id = dt.directory_id");
  }

  async getDirectoryStateCounts(): Promise<any[]> {
    const alias = "stmt";
    const qb = this.entityManager
      .createQueryBuilder(AccessibilityStatement, alias)
      .select("d.name", "name")
      .addSelect(`SUM(CASE WHEN ${alias}.state = :complete THEN 1 ELSE 0 END)`, "completeStatement")
      .addSelect(`SUM(CASE WHEN ${alias}.state = :incomplete THEN 1 ELSE 0 END)`, "incompleteStatement")
      .addSelect(`SUM(CASE WHEN ${alias}.state = :possible THEN 1 ELSE 0 END)`, "possibleStatement")
      .setParameters({
        complete: State.completeStatement,
        incomplete: State.incompleteStatement,
        possible: State.possibleStatement,
      });
    return this.directoryJoin(qb).groupBy("d.name").orderBy("d.name").getRawMany();
  }

  async getDirectorySealCounts(): Promise<any[]> {
    const alias = "stmt";
    const qb = this.entityManager
      .createQueryBuilder(AccessibilityStatement, alias)
      .select("d.name", "name")
      .addSelect(`SUM(CASE WHEN ${alias}.seal = :bronze THEN 1 ELSE 0 END)`, "bronze")
      .addSelect(`SUM(CASE WHEN ${alias}.seal = :prata THEN 1 ELSE 0 END)`, "prata")
      .addSelect(`SUM(CASE WHEN ${alias}.seal = :ouro THEN 1 ELSE 0 END)`, "ouro")
      .setParameters({ bronze: BRONZE, prata: PRATA, ouro: OURO });
    return this.directoryJoin(qb).groupBy("d.name").orderBy("d.name").getRawMany();
  }

  async getDirectoryConformanceCounts(): Promise<any[]> {
    const alias = "stmt";
    const qb = this.entityManager
      .createQueryBuilder(AccessibilityStatement, alias)
      .select("d.name", "name")
      .addSelect(`SUM(CASE WHEN ${alias}.conformance = :plenamente THEN 1 ELSE 0 END)`, "plenamenteConforme")
      .addSelect(`SUM(CASE WHEN ${alias}.conformance = :parcialmente THEN 1 ELSE 0 END)`, "parcialmenteConforme")
      .addSelect(`SUM(CASE WHEN ${alias}.conformance = :nao THEN 1 ELSE 0 END)`, "naoConforme")
      .setParameters({
        plenamente: PLENAMENTE_CONFORME,
        parcialmente: PARCIALMENTE_CONFORME,
        nao: NAO_CONFORME,
      });
    return this.directoryJoin(qb).groupBy("d.name").orderBy("d.name").getRawMany();
  }

  async getDirectoryWebsiteCounts(): Promise<Array<{ name: string; total: string }>> {
    return this.entityManager
      .createQueryBuilder(Website, "w")
      .select("d.name", "name")
      .addSelect("COUNT(w.id)", "total")
      .innerJoin("website_tags", "wt", "wt.website_id = w.id")
      .innerJoin("directory_tags", "dt", "dt.tag_id = wt.tag_id")
      .innerJoin("directories", "d", "d.id = dt.directory_id")
      .groupBy("d.name")
      .orderBy("d.name")
      .getRawMany();
  }

  async getDirectoryA11yCounts(): Promise<Array<{ name: string; a11yStatements: string }>> {
    const qb = this.entityManager
      .createQueryBuilder(AccessibilityStatement, "stmt")
      .select("d.name", "name")
      .addSelect(`COUNT(stmt.id)`, "a11yStatements");
    return this.directoryJoin(qb).groupBy("d.name").orderBy("d.name").getRawMany();
  }


    async getWebsiteStatsForOrganization(longName: string): Promise<any[]> {
      const alias = "org";
      return this.entityManager
        .createQueryBuilder(Website, "w")
        .select('w.*')
        .addSelect('u.username', 'user')
        .addSelect('COUNT(DISTINCT p.id)', 'pages')
        .leftJoin(`${alias}.websites`, 'w')
        .leftJoin('w.pages', 'p', 'p.showIn LIKE :pattern', { pattern: '1__' })
        .leftJoin('w.user', 'u')
        .where(`${alias}.longName = :longName`, { longName })
        .groupBy('w.id')
        .getRawMany();
    }




    
    /** TODO: Implement the following methods for counting, 
     *  @OrganizationDocs.totalObservatory()
       @Roles("admin")
       @Get("observatory/total")
       async getNumberOfObservatoryEntities(): Promise<any> {
         return await this.entityService.findNumberOfObservatory();
       }
     
       @OrganizationDocs.count()
       @Roles("admin")
       @Get("all/count/:search")
       async getAdminEntityCount(@Param("search") search: string): Promise<any> {
         return await this.entityService.adminCount(decodeURIComponent(search.substring(7)));
       }
     
       @DirectoryDocs.totalObservatory()
       @Roles(RoleSlug.ADMIN)
       @Get("observatory/total")
       async getNumberOfObservatoryDirectories(): Promise<any> {
         return await this.directoryService.findNumberOfObservatory();
       }
  async findNumberOfStudyMonitor(): Promise<number> {
    return (
      await this.tagRepository.query(
        `SELECT COUNT(t.TagId) as Tags FROM Tag as t, User as u WHERE u.Type = "studies" AND t.createdBy = u.UserId`,
      )
    )[0].Tags;
  }

  async findNumberOfObservatory(): Promise<number> {
    return (
      await this.tagRepository.query(`
        SELECT 
          COUNT(distinct t.TagId) as Tags 
        FROM 
          Directory as d,
          DirectoryTag as dt,
          Tag as t 
        WHERE 
          d.Show_in_Observatory = 1 AND
          dt.DirectoryId = d.DirectoryId AND
          t.TagId = dt.TagId 
          `)
    )[0].Tags;
  }/*


  @TagDocs.userTagWebsites()
    @Roles("admin")
  @Get(":tag/user/:user/websites")
  async getTagWebsites(@Param("tag") tag: string, @Param("user") user: string): Promise<any> {
    return await this.tagService.findAllUserTagWebsites(tag, user);
  }

  @TagDocs.userWebsitePages()
    @Roles("admin")
  @Get(":tag/website/:website/user/:user/pages")
  async getUserWebsitePages(@Param("tag") tag, @Param("website") website, @Param("user") user): Promise<any> {
    return await this.tagService.findAllUserWebsitePages(tag, website, user);
  }

  @TagDocs.tagWebsitePages()
    @Roles("admin")
  @Get(":tag/websites/pages")
  async getListOfTagWebsitePages(@Param("tag") tag: string): Promise<any> {
    return await this.tagService.findAllWebsitePages(tag);
  }

  @TagDocs.info()
  @Roles("admin")
  @Get("info/:tagId")
  async getTagInfo(@Param("tagId") tagId: number): Promise<any> {
    return await this.tagService.findInfo(tagId);
  }

  @TagDocs.allOfficial()
  @Roles("admin")
  @Get("allOfficial")
  async getAllOfficialTags(): Promise<any> {
    return await this.tagService.findAllOfficial();
  }

  @TagDocs.totalStudyMonitor()
  @Roles("admin")
  @Get("studyMonitor/total")
  async getNumberOfStudyMonitorUsers(): Promise<any> {
    return await this.tagService.findNumberOfStudyMonitor();
  }

  @TagDocs.totalObservatory()
  @Roles("admin")
  @Get("observatory/total")
  async getNumberOfObservatoryTags(): Promise<any> {
    return await this.tagService.findNumberOfObservatory();
  }

  @TagDocs.studyMonitorUserTags()
  @Roles("admin")
  @Get("studyMonitor")
  async getStudyMonitorUserTags(@Request() req: any): Promise<any> {
    return await this.tagService.findAllFromStudyMonitorUser(req.user.userId);
  }

  @TagDocs.studyMonitorTagData()
  @Roles("admin")
  @Get("studyMonitor/:tag/data")
  async getStudyMonitorUserTagData(@Request() req, @Param("tag") tag): Promise<any> {
    return await this.tagService.findStudyMonitorUserTagData(req.user.userId, tag);
  }

  @TagDocs.studyMonitorWebsiteData()
  @Roles("admin")
  @Get("studyMonitor/:tag/website/:website/data")
  async getStudyMonitorUserTagWebsitesPagesData(@Request() req, @Param("tag") tag, @Param("website") website): Promise<any> {
    return await this.tagService.findStudyMonitorUserTagWebsitesPagesData(req.user.userId, tag, website);
  }
/*
  @TagDocs.count()
  @Roles("admin")
  @Get("all/count/:search")
  async getAdminTagCount(@Param("search") search: string): Promise<any> {
    return await this.tagService.adminCount(decodeURIComponent(search.substring(7)));
  }-*/
     
}
