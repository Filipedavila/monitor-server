import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, IsNull, Repository } from "typeorm";
import { Page } from "../page/page.entity";
import { EvaluationService } from "src/domains/audit-engine/evaluation/services/evaluation.service";
import { AccessibilityStatementService } from "src/domains/compliance/accessibility-statement/accessibility-statement.service";
import { CollectionDateService } from "src/domains/compliance/collection-date/collection-date.service";
import { Tag } from "../tag/tag.entity";
import { CreateWebsiteDto } from "./dto/create-website.dto";
import { UpdateObservatoryPages } from "./dto/update-observatory-pages.dto";
import { UpdateWebsiteDto } from "./dto/update-website.dto";
import { Website } from "./website.entity";

@Injectable()
export class WebsiteService {
  constructor(
    @InjectRepository(Website)
    private readonly websiteRepository: Repository<Website>,
    private evaluationService: EvaluationService,
    private readonly accessibilityStatementService: AccessibilityStatementService,
    private readonly collectionDateService: CollectionDateService,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(Page)
    private readonly pageRepository: Repository<Page>,
    @InjectDataSource()
    private readonly connection: DataSource,
  ) {}
  async find(url: string): Promise<any> {
    //TODO
    throw new InternalServerErrorException("Not implemented yet");
  }
  async getWebsiteById(websiteId: number): Promise<any> {
    const website = await this.websiteRepository.findOne({
      where: { id: websiteId },
    });
    return website;
  }

  async getWebsitesByIds(websiteIds: number[]): Promise<Website[]> {
    const websites = await this.websiteRepository.findByIds(websiteIds);
    return websites;
  }

  async getWebsiteId(userId: number, websiteUrl: string): Promise<number> {
    const website = await this.websiteRepository.findOne({
      where: { baseUrl: websiteUrl, createdBy: userId },
    });
    if (!website) {
      throw new InternalServerErrorException("Website Does not exists");
    }
    return website.id;
  }
  async findAccessiblityStatements(): Promise<any> {
    const websites = await this.websiteRepository.find({
      relations: ["pages"],
    });
    await this.collectionDateService.create();
    for (const website of websites) {
      const id = website.id;
      const pages = website.pages;
      await this.findAccessiblityStatementsInPageList(pages, website);
    }
  }

  async updateAStatement(WebsiteId: number): Promise<void> {
    const website = await this.websiteRepository.findOne({
      where: { id: WebsiteId },
      relations: ["Pages"],
    });
    if (website) {
      const pages = website.pages;
      await this.findAccessiblityStatementsInPageList(pages, website);
    }
  }

  async findAccessiblityStatementsInPageList(
    pages: Page[],
    website: Website,
  ): Promise<any> {
    for (const page of pages) {
      const id = page.id;
      const evaluation = await this.evaluationService.getEvaluations(id);
      if (evaluation) {
        /* const rawHtml = Buffer.from(evaluation.Pagecode, "base64").toString();
        await this.accessibilityStatementService.createIfExist(
          rawHtml,
          website,
          page.Uri
        );*/
        // TODO, to intensive, can be improved with MONDODB
      }
    }
  }
  async getAllWebsiteDataCSV(): Promise<any> {
    const websites = await this.websiteRepository.find({ relations: ["Tags"] });
    return await Promise.all(
      websites.map(async (website) => {
        const id = website.id;
        const pages = await this.findAllPages(id);
        website["numberOfPages"] = pages.length;
        website["averagePoints"] = this.averagePointsPageEvaluation(pages);
        return website;
      }),
    );
  }
  private averagePointsPageEvaluation(pages) {
    const totalPoints = pages.reduce((total, page) => {
      return total + +page.Score;
    }, 0);
    return totalPoints / pages.length;
  }
  // TODO Remove, does not belong to website service.

  async adminCount(search: string): Promise<any> {
    const count = await this.websiteRepository.query(
      `SELECT COUNT(w.WebsiteId) as Count
      FROM 
        Website as w
        LEFT OUTER JOIN User as u ON u.UserId = w.UserId
      WHERE
        w.Name LIKE ? AND
        (w.UserId IS NULL OR (u.UserId = w.UserId AND u.Type != 'studies'))`,
      [search.trim() !== "" ? `%${search.trim()}%` : "%"],
    );

    return count[0].Count;
  }

  async count(): Promise<number> {
    return this.websiteRepository.count();
  }
  //TODO ?!?! What is the logic and purpose for this complex query to only get the id of a website?
  async getFirstIdFromWebsiteFromFilterUserAndName(
    user: string,
    name: string,
  ): Promise<number> {
    const website = await this.websiteRepository.query(
      `
      SELECT w.* FROM Website as w, User as u
      WHERE
        w.Name LIKE ? AND
        ((w.UserId IS NULL OR (u.UserId = w.UserId AND u.Type != 'studies')) OR
        w.UserId IS NOT NULL AND (u.UserId = w.UserId AND u.Username LIKE ?))
      LIMIT 1
    `,
      [name, user],
    );
    return website[0].WebsiteId;
  }

  async findAll(
    size: number,
    page: number,
    sort: string,
    direction: string,
    search: string,
  ): Promise<any> {
    if (!direction.trim()) {
      const websites = await this.websiteRepository.query(
        `
        SELECT 
          w.*, 
          u.Username as User, u.Type as Type, 
          COUNT(distinct p.PageId) as Pages,
          COUNT(distinct e.PageId) as Evaluated_Pages
        FROM 
          Website as w
          LEFT OUTER JOIN User as u ON u.UserId = w.UserId
          LEFT OUTER JOIN WebsitePage as wp ON wp.WebsiteId = w.WebsiteId
          LEFT OUTER JOIN Page as p ON p.PageId = wp.PageId AND p.Show_In LIKE "1__"
          LEFT OUTER JOIN Evaluation as e ON e.PageId = p.PageId
        WHERE
          (w.Name LIKE ? OR w.StartingUrl LIKE ?) AND
          (w.UserId IS NULL OR (u.UserId = w.UserId AND u.Type != 'studies'))
        GROUP BY w.WebsiteId
        LIMIT ? OFFSET ?`,
        [
          search.trim() !== "" ? `%${search.trim()}%` : "%",
          search.trim() !== "" ? `%${search.trim()}%` : "%",
          size,
          page * size,
        ],
      );

      /* 
        LEFT OUTER JOIN Evaluation as e2 ON e.PageId = p.PageId AND e2.Evaluation_Date = (
            SELECT Evaluation_Date FROM Evaluation 
            WHERE PageId = p.PageId
            ORDER BY Evaluation_Date DESC LIMIT 1
          )
      */
      return websites;
    } else {
      let order = "";
      switch (sort) {
        case "Name":
          order = "w.Name";
          break;
        case "StartingUrl":
          order = "w.StartingUrl";
          break;
        case "Pages":
          order = "Pages";
          break;
        case "Creation_Date":
          order = "w.Creation_Date";
          break;
      }

      const websites = await this.websiteRepository.query(
        `
        SELECT 
          w.*, 
          u.Username as User, u.Type as Type, 
          COUNT(distinct p.PageId) as Pages,
          COUNT(distinct e.PageId) as Evaluated_Pages
        FROM 
          Website as w
          LEFT OUTER JOIN User as u ON u.UserId = w.UserId
          LEFT OUTER JOIN WebsitePage as wp ON wp.WebsiteId = w.WebsiteId
          LEFT OUTER JOIN Page as p ON p.PageId = wp.PageId AND p.Show_In LIKE "1__"
          LEFT OUTER JOIN Evaluation as e ON e.PageId = p.PageId
        WHERE
          (w.Name LIKE ? OR w.StartingUrl LIKE ?) AND
          (w.UserId IS NULL OR (u.UserId = w.UserId AND u.Type != 'studies'))
        GROUP BY w.WebsiteId
        ORDER BY ${order} ${direction.toUpperCase()}
        LIMIT ? OFFSET ?`,
        [
          search.trim() !== "" ? `%${search.trim()}%` : "%",
          search.trim() !== "" ? `%${search.trim()}%` : "%",
          size,
          page * size,
        ],
      );
      return websites;
    }
  }

  async findInfo(websiteId: number): Promise<any> {
    const websites = await this.websiteRepository.query(
      `SELECT w.*, u.Username as User, e.Long_Name as Entity, 
              COUNT(distinct wp.PageId) as Pages,
              AVG(ev.Score) as AverageScore
      FROM 
        Website as w
        LEFT OUTER JOIN User as u ON u.UserId = w.UserId
        LEFT OUTER JOIN EntityWebsite as ew ON ew.WebsiteId = w.WebsiteId
        LEFT OUTER JOIN Entity as e ON e.EntityId = ew.EntityId
        LEFT OUTER JOIN WebsitePage as wp ON wp.WebsiteId = w.WebsiteId
        LEFT OUTER JOIN Page as p ON p.PageId = wp.PageId AND p.Show_In LIKE "1__"
        LEFT OUTER JOIN Evaluation as ev ON ev.PageId = p.PageId AND ev.Evaluation_Date IN (
          SELECT max(Evaluation_Date) FROM Evaluation WHERE PageId = p.PageId
        )
      WHERE 
        w.WebsiteId = ?
      GROUP BY w.WebsiteId, w.StartingUrl 
      LIMIT 1`,
      [websiteId],
    );

    if (websites) {
      const website = websites[0];

      website.tags = await this.websiteRepository.query(
        `SELECT t.* FROM Tag as t, TagWebsite as tw WHERE tw.WebsiteId = ? AND t.TagId = tw.TagId`,
        [websiteId],
      );

      website.entities = await this.websiteRepository.query(
        `SELECT e.* FROM Entity as e, EntityWebsite as ew WHERE ew.WebsiteId = ? AND e.EntityId = ew.EntityId`,
        [websiteId],
      );

      // Fetch Observatory directories for this website
      const directories = await this.websiteRepository.query(
        `
        SELECT DISTINCT d.Name
        FROM
          Directory as d
          INNER JOIN DirectoryTag as dt ON dt.DirectoryId = d.DirectoryId
          INNER JOIN TagWebsite as tw ON tw.TagId = dt.TagId
        WHERE
          d.Show_in_Observatory = 1 AND
          tw.WebsiteId = ?
        ORDER BY d.Name
        `,
        [websiteId],
      );

      website.directories = directories.map((dir: any) => dir.Name);

      return website;
    } else {
      throw new InternalServerErrorException();
    }
  }
  /*
  async findUserType(username: string): Promise<any> {
    if (username === "admin") {
      return "nimda";
    }

    const user = await this.websiteRepository.query(
      `SELECT * FROM User WHERE Username = ? LIMIT 1`,
      [username]
    );

    if (user) {
      return user[0].Type;
    } else {
      return null;
    }
  }

 */

  /*  TODO , with CASL, por tudo em um find com filters e verificação do id e role.
  async findAllOfficial(): Promise<any> {
    const websites = await this.websiteRepository.query(`SELECT distinct w.*
      FROM 
        Website as w,
        User as u 
      WHERE 
        w.UserId IS NULL OR (u.UserId = w.UserId AND u.Type != 'studies')`);
    return websites;
  }*/
  /* /// TODO HANDLE with filter name on find()
  async findByOfficialName(name: string): Promise<any> {
    const website = await this.websiteRepository.findOne({
      where: { title: name, createdBy: IsNull() },
    });
    return website;
    /*if (website && website.Name !== name) {
      return undefined;
    } else {
      return website;
    }*/
  /*}
   */
  /* Redundante, seguir praticas rest , caso um url exista o erro será explicito
  async existsUrl(url: string): Promise<any> {
    return (
      (
        await this.websiteRepository.query(
          `SELECT w.*
      FROM
        Website as w,
        User as u
      WHERE
        w.StartingUrl = ? AND
        (w.UserId IS NULL OR (u.UserId = w.UserId AND u.Type != 'studies'))
      LIMIT 1`,
          [url]
        )
      ).length > 0
    );
  }
*/
  /* A website should not exist without createdBy ... even admin has user id
  async findAllWithoutUser(): Promise<any> {
    const websites = await this.websiteRepository.query(
      `SELECT * FROM Website WHERE UserId IS NULL`
    );
    return websites;
  }
    */
  /**
 * 
 * SELECT distinct w.* 
      FROM 
        User as u ,
        EntityWebsite as ew
        LEFT OUTER JOIN Website as ew ON w.WebsiteId = ew.WebsiteId
      WHERE 
        ew.EntityId IS NULL AND
        (w.UserId IS NULL OR (u.UserId = w.UserId AND u.Type != 'studies'))
 */
  /* Outro find com filtro entity a Null....
  async findAllWithoutEntity(): Promise<any> {
    const websites = await this.websiteRepository.query(`SELECT distinct w.* 
      FROM 
        User as u ,
        EntityWebsite as ew
        LEFT OUTER JOIN Website as ew ON w.WebsiteId = ew.WebsiteId
      WHERE 
        ew.EntityId IS NULL AND
        (w.UserId IS NULL OR (u.UserId = w.UserId AND u.Type != 'studies'))`);
    return websites; //TODO: fix
  }
*/
  async findAllFromMyMonitorUser(userId: number): Promise<any> {
    const websites = await this.websiteRepository.query(
      `SELECT w.*, COUNT(distinct p.PageId) as Pages
      FROM
        Website as w
        LEFT OUTER JOIN WebsitePage as wp ON wp.WebsiteId = w.WebsiteId
        LEFT OUTER JOIN Page as p ON p.PageId = wp.PageId AND p.Show_In LIKE '_1%'
      WHERE
        w.UserId = ?
      GROUP BY w.WebsiteId, w.StartingUrl`,
      [userId],
    );
    return websites;
  }

  async isInObservatory(userId: number, website: string): Promise<any> {
    const tags = await this.websiteRepository.query(
      `
      SELECT t.* 
      FROM
        Directory as d,
        DirectoryTag as dt,
        Tag as t,
        TagWebsite as tw,
        Website as w
      WHERE
        w.UserId = ? AND
        w.Name = ? AND
        tw.WebsiteId = w.WebsiteId AND
        t.TagId = tw.TagId AND
        t.UserId IS NULL AND
        dt.TagId = t.TagId AND
        d.DirectoryId = dt.DirectoryId AND
        d.Show_In_Observatory = 1
    `,
      [userId, website],
    );

    return tags.length > 0;
  }

  async transferObservatoryPages(
    userId: number,
    website: string,
  ): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();

    let error = false;
    try {
      const pages = await queryRunner.manager.query(
        `
        SELECT
          p.* 
        FROM
          Directory as dir,
          DirectoryTag as dt,
          Tag as t,
          TagWebsite as tw,
          Website as w,
          WebsitePage as wp,
          Page as p
        WHERE
          w.UserId = ? AND
          w.Name = ? AND
          tw.WebsiteId = w.WebsiteId AND
          t.TagId = tw.TagId AND
          t.UserId IS NULL AND
          dt.TagId = t.TagId AND
          dir.DirectoryId = dt.DirectoryId AND
          dir.Show_In_Observatory = 1 AND
          wp.WebsiteId = w.WebsiteId AND
          p.PageId = wp.PageId and
          p.Show_In LIKE "_01"
      `,
        [userId, website],
      );

      for (const page of pages || []) {
        const evaluation = await queryRunner.manager.query(
          `
          SELECT * 
          FROM 
            Evaluation 
          WHERE 
            PageId = ? AND
            Show_To LIKE "1_"
          ORDER BY Evaluation_Date DESC LIMIT 1
        `,
          [page.PageId],
        );
        if (evaluation.length > 0) {
          await queryRunner.manager.query(
            `UPDATE Page SET Show_In = ? WHERE PageId = ?`,
            [page.Show_In[0] + "1" + page.Show_In[2], page.PageId],
          );
          await queryRunner.manager.query(
            `UPDATE Evaluation SET Show_To = ? WHERE EvaluationId = ?`,
            [evaluation[0].Show_To[0] + "1", evaluation[0].EvaluationId],
          );
        }
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
      console.log(err);
      error = true;
    } finally {
      await queryRunner.release();
    }

    return !error;
  }

  async findAllFromStudyMonitorUserTag(
    userId: number,
    tagName: string,
  ): Promise<any> {
    const tag = await this.tagRepository.findOne({
      where: { id: userId, name: tagName },
    });
    if (tag) {
      return await this.websiteRepository.query(
        `SELECT 
          w.WebsiteId,
          w.Name,
          w.StartingUrl,
          COUNT(distinct p.PageId) as Pages,
          AVG(e.Score) as Score
        FROM
          Tag as t,
          TagWebsite as tw,
          Website as w
          LEFT OUTER JOIN WebsitePage as wp ON wp.WebsiteId = w.WebsiteId
          LEFT OUTER JOIN Page as p ON p.PageId = wp.PageId
          LEFT OUTER JOIN Evaluation as e ON e.StudyUserId = ? AND e.Evaluation_Date IN (
            SELECT max(Evaluation_Date) FROM Evaluation WHERE PageId = p.PageId AND StudyUserId = e.StudyUserId
          )
        WHERE
          t.Name = ? AND
          t.UserId = ? AND
          tw.TagId = t.TagId AND
          w.WebsiteId = tw.WebsiteId AND
          w.UserId = ?
        GROUP BY w.WebsiteId, w.StartingUrl`,
        [userId, tagName, userId, userId],
      );
    } else {
      throw new InternalServerErrorException();
    }
  }

  async findAllFromStudyMonitorUserOtherTagsWebsites(
    userId: number,
    tagName: string,
  ): Promise<any> {
    const websites = await this.websiteRepository.query(
      `SELECT
        distinct w.*,
        t.Name as TagName
      FROM
        Tag as t,
        TagWebsite as tw,
        Website as w
      WHERE
        t.Name != ? AND
        t.UserId = ? AND
        tw.TagId = t.TagId AND
        w.WebsiteId = tw.WebsiteId AND
        w.UserId = ? AND
        w.Name NOT IN (
          SELECT 
            w2.Name 
          FROM
            Tag as t2,
            TagWebsite as tw2,
            Website as w2
          WHERE
            t2.Name = ? AND
            t2.UserId = ? AND
            tw2.TagId = t2.TagId AND
            w2.WebsiteId = tw2.WebsiteId AND
            w2.UserId = ?
        ) AND
        w.StartingUrl NOT IN (
          SELECT 
            w2.StartingUrl 
          FROM
            Tag as t2,
            TagWebsite as tw2,
            Website as w2
          WHERE
            t2.Name = ? AND
            t2.UserId = ? AND
            tw2.TagId = t2.TagId AND
            w2.WebsiteId = tw2.WebsiteId AND
            w2.UserId = ?
        )`,
      [
        tagName,
        userId,
        userId,
        tagName,
        userId,
        userId,
        tagName,
        userId,
        userId,
      ],
    );

    return websites;
  }

  async findStudyMonitorUserTagWebsiteByName(
    userId: number,
    tag: string,
    websiteName: string,
  ): Promise<any> {
    const website = await this.websiteRepository.query(
      `SELECT * FROM 
        Tag as t,
        TagWebsite as tw,
        Website as w
      WHERE
        t.Name = ? AND
        t.UserId = ? AND
        tw.TagId = t.TagId AND
        w.WebsiteId = tw.WebsiteId AND
        w.UserId = ? AND
        w.Name = ?
      LIMIT 1`,
      [tag, userId, userId, websiteName],
    );

    return website[0];
  }

  async findStudyMonitorUserTagWebsiteByStartingUrl(
    userId: number,
    tag: string,
    startingUrl: string,
  ): Promise<any> {
    const website = await this.websiteRepository.query(
      `SELECT * FROM 
        Tag as t,
        TagWebsite as tw,
        Website as w
      WHERE
        t.Name = ? AND
        t.UserId = ? AND
        tw.TagId = t.TagId AND
        w.WebsiteId = tw.WebsiteId AND
        w.UserId = ? AND
        w.StartingUrl = ?
      LIMIT 1`,
      [tag, userId, userId, startingUrl],
    );

    return website[0];
  }

  async linkStudyMonitorUserTagWebsite(
    userId: number,
    tag: string,
    websitesId: number[],
  ): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      for (const id of websitesId || []) {
        await queryRunner.manager.query(
          `INSERT INTO TagWebsite (TagId, WebsiteId) 
          SELECT TagId, ? FROM Tag WHERE Name = ? AND UserId = ?`,
          [id, tag, userId],
        );
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      console.log(err);
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
      hasError = true;
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
    }

    return !hasError;
  }

  async createStudyMonitorUserTagWebsite(
    userId: number,
    tag: string,
    websiteName: string,
    startingUrl: string,
    pages: string[],
  ): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      const newWebsite = new Website();
      newWebsite.id = userId;
      newWebsite.title = websiteName;
      newWebsite.baseUrl = startingUrl;

      const insertWebsite = await queryRunner.manager.save(newWebsite);

      await queryRunner.manager.query(
        `INSERT INTO website_tags (tag_id, website_id) SELECT tag_id, ? FROM tags WHERE name = ?`,
        [insertWebsite.id, tag],
      );

      for (const url of pages || []) {
        const page = await queryRunner.manager.findOne(Page, {
          where: { url: url },
        });
        if (page) {
          await queryRunner.manager.query(
            `INSERT INTO website_pages (website_id, page_id) VALUES (?, ?)`,
            [insertWebsite.id, page.id],
          );
          // TODO Evaluation list not used, now used only in evaluation service with redis bullmq
          await queryRunner.manager.query(
            `INSERT INTO evaluation_list (page_id, user_id, url, show_to, creation_date, study_user_id) VALUES (?, ?, ?, ?, ?, ?)`,
            [page.id, userId, page.url, "00", page.createdAt, userId],
          );
        } else {
          //const evaluation = await this.evaluationService.evaluateUrl(url);

          const newPage = new Page();
          newPage.url = url;
          newPage.createdAt = newWebsite.createdAt;

          const insertPage = await queryRunner.manager.save(newPage);

          //await this.evaluationService.savePageEvaluation(queryRunner, insertPage.PageId, evaluation, '01');

          await queryRunner.manager.query(
            `INSERT INTO website_pages (website_id, page_id) VALUES (?, ?)`,
            [insertWebsite.id, insertPage.id],
          );

          const existingWebsite = await queryRunner.manager.query(
            `SELECT distinct w.id, w.baseUrl  

            FROM
              User as u,
              Website as w
            WHERE
              w.StartingUrl = ? AND
              (
                w.UserId IS NULL OR
                (
                  u.UserId = w.UserId AND
                  u.Type = 'monitor'
                )
              )
            LIMIT 1`,
            [startingUrl],
          );

          if (existingWebsite.length > 0) {
            await queryRunner.manager.query(
              `INSERT INTO website_pages (website_id, page_id) VALUES (?, ?)`,
              [existingWebsite[0].id, newPage.id],
            );
          }

          await queryRunner.manager.query(
            `INSERT INTO Evaluation_List (PageId, UserId, Url, Show_To, Creation_Date) VALUES (?, ?, ?, ?, ?)`,
            [insertPage.id, userId, insertPage.url, "00", insertPage.createdAt],
          );
        }
      }

      await queryRunner.manager.query(
        `UPDATE Evaluation_Request_Counter SET Counter = Counter + ?, Last_Request = NOW() WHERE Application = "StudyMonitor"`,
        [pages.length],
      );

      await queryRunner.commitTransaction();
    } catch (err) {
      console.log(err);
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
      hasError = true;
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
    }

    return !hasError;
  }

  async removeStudyMonitorUserTagWebsite(
    userId: number,
    tag: string,
    websitesId: number[],
  ): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      for (const id of websitesId || []) {
        const relations = await queryRunner.manager.query(
          `SELECT tw.* FROM TagWebsite as tw, Website as w
          WHERE 
            tw.WebsiteId = ? AND 
            tw.TagId <> -1 AND
            w.WebsiteId = tw.WebsiteId AND
            w.UserId = ?`,
          [id, userId],
        );

        if (relations) {
          await queryRunner.manager.query(
            `
            DELETE tw FROM Tag as t, TagWebsite as tw 
            WHERE 
              t.Name = ? AND
              tw.TagId = t.TagId AND
              tw.WebsiteId = ?`,
            [tag, id],
          );
        } else {
          await queryRunner.manager.delete(Website, { WebsiteId: id });
        }
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      console.log(err);
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
      hasError = true;
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
    }

    return !hasError;
  }

  async findNumberOfStudyMonitor(): Promise<number> {
    return (
      await this.websiteRepository.query(
        `SELECT COUNT(w.WebsiteId) as Websites FROM Website as w, User as u WHERE u.Type = "studies" AND w.UserId = u.UserId`,
      )
    )[0].Websites;
  }

  async findNumberOfMyMonitor(): Promise<number> {
    return (
      await this.websiteRepository.query(
        `SELECT COUNT(w.WebsiteId) as Websites FROM Website as w, User as u WHERE u.Type = "monitor" AND w.UserId = u.UserId`,
      )
    )[0].Websites;
  }

  async findNumberOfObservatory(): Promise<number> {
    /*const manager = getManager();
    return (
      await manager.query(`
      SELECT 
        COUNT(distinct w.WebsiteId) as Websites 
      FROM
        Directory as d,
        DirectoryTag as dt,
        TagWebsite as tw,
        Website as w 
      WHERE 
        d.Show_in_Observatory = 1 AND
        dt.DirectoryId = d.DirectoryId AND
        tw.TagId = dt.TagId AND 
        w.WebsiteId = tw.WebsiteId`)
    )[0].Websites;*/

    const data = (
      await this.websiteRepository.query(
        "SELECT * FROM Observatory ORDER BY Creation_Date DESC LIMIT 1",
      )
    )[0].Global_Statistics;
    const dataPrint = await this.connection.query(
      `SELECT 
        COUNT(distinct w.WebsiteId) as Websites 
      FROM
        Directory as d,
        DirectoryTag as dt,
        TagWebsite as tw,
        Website as w 
      WHERE 
        d.Show_in_Observatory = 1 AND
        dt.DirectoryId = d.DirectoryId AND
        tw.TagId = dt.TagId AND 
        w.WebsiteId = tw.WebsiteId`,
    );
    console.log(dataPrint[0].Websites);
    const parsedData = JSON.parse(data);
    return parsedData.nWebsites;
  }

  async createOne(
    websiteDto: CreateWebsiteDto,
    entities: string[],
    tags: string[],
  ): Promise<boolean> {
    const website = new Website();
    website.title = websiteDto.name;
    website.createdById = websiteDto.userId;
    website.declarationStatus = websiteDto.declaration;
    website.declarationUpdatedAt = new Date(websiteDto.declarationUpdateDate);
    website.stampStatus = websiteDto.stamp;
    website.stampUpdatedAt = new Date(websiteDto.stampUpdateDate);

    website.baseUrl = decodeURIComponent(websiteDto.baseUrl);

    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      const insertWebsite = await queryRunner.manager.save(website);

      for (const entity of entities || []) {
        await queryRunner.manager.query(
          `INSERT INTO EntityWebsite (EntityId, WebsiteId) VALUES (?, ?)`,
          [entity, insertWebsite.id],
        );
      }

      for (const tag of tags || []) {
        await queryRunner.manager.query(
          `INSERT INTO TagWebsite (TagId, WebsiteId) VALUES (?, ?)`,
          [tag, insertWebsite.id],
        );
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      console.log(err);
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
      hasError = true;
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
    }

    return !hasError;
  }

  async update(updateWebsiteDto: UpdateWebsiteDto): Promise<any> {
    const oldUserId = updateWebsiteDto.oldUserId;
    const userId = updateWebsiteDto.userId;
    const transfer = updateWebsiteDto.transfer;
    const websiteId = updateWebsiteDto.websiteId;
    const entities = updateWebsiteDto.entities;
    const defaultEntities = updateWebsiteDto.defaultEntities;
    const defaultTags = updateWebsiteDto.defaultTags;
    const tags = updateWebsiteDto.tags;
    updateWebsiteDto.startingUrl = decodeURIComponent(
      updateWebsiteDto.startingUrl,
    );

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      await queryRunner.manager.update(
        Website,
        { id: websiteId },
        {
          createdById: userId,
          title: updateWebsiteDto.name,
          baseUrl: updateWebsiteDto.startingUrl,
          declarationStatus: updateWebsiteDto.declaration,
          declarationUpdatedAt: updateWebsiteDto.declarationUpdateDate,
          stampStatus: updateWebsiteDto.stamp,
          stampUpdatedAt: updateWebsiteDto.stampUpdateDate,
        },
      );
      if (oldUserId === null && userId !== null) {
        if (transfer) {
          await queryRunner.manager.query(
            `
            UPDATE
              WebsitePage as wp, 
              Page as p,
              Evaluation as e
            SET 
              p.Show_In = "111",
              e.Show_To = "11" 
            WHERE
              wp.WebsiteId = ? AND
              p.PageId = wp.PageId AND
              p.Show_In LIKE "101" AND
              e.PageId = p.PageId`,
            [websiteId],
          );
        }
      } else if (
        (oldUserId !== null && userId !== null && oldUserId !== userId) ||
        (oldUserId !== null && userId === null)
      ) {
        if (!transfer || (oldUserId && !userId)) {
          await queryRunner.manager.query(
            `
            UPDATE
              WebsitePage as wp, 
              Page as p,
              Evaluation as e
            SET 
              p.Show_In = "101",
              e.Show_To = "10" 
            WHERE
              wp.WebsiteId = ? AND
              p.PageId = wp.PageId AND
              p.Show_In = "111" AND
              e.PageId = p.PageId`,
            [websiteId],
          );
        }

        await queryRunner.manager.query(
          `
          UPDATE  
            WebsitePage as wp, 
            Page as p,
            Evaluation as e
          SET 
            p.Show_In = "100",
            e.Show_To = "10"
          WHERE
            wp.WebsiteId = ? AND
            p.PageId = wp.PageId AND
            p.Show_In = "110" AND
            e.PageId = p.PageId`,
          [websiteId],
        );

        await queryRunner.manager.query(
          `
          UPDATE 
            WebsitePage as wp, 
            Page as p,
            Evaluation as e
          SET 
            p.Show_In = "000",
            e.Show_To = "10"
          WHERE
            wp.WebsiteId = ? AND
            p.PageId = wp.PageId AND
            p.Show_In = "010" AND
            e.PageId = p.PageId`,
          [websiteId],
        );
      }

      for (const id of defaultEntities || []) {
        if (!entities.includes(id)) {
          await queryRunner.manager.query(
            `DELETE FROM EntityWebsite WHERE EntityId = ? AND WebsiteId = ?`,
            [id, websiteId],
          );
        }
      }

      for (const id of entities || []) {
        if (!defaultEntities.includes(id)) {
          await queryRunner.manager.query(
            `INSERT INTO EntityWebsite (EntityId, WebsiteId) VALUES (?, ?)`,
            [id, websiteId],
          );
        }
      }

      for (const id of defaultTags || []) {
        if (!tags.includes(id)) {
          await queryRunner.manager.query(
            `DELETE FROM TagWebsite WHERE TagId = ? AND WebsiteId = ?`,
            [id, websiteId],
          );
        }
      }

      for (const id of tags || []) {
        if (!defaultTags.includes(id)) {
          await queryRunner.manager.query(
            `INSERT INTO TagWebsite (TagId, WebsiteId) VALUES (?, ?)`,
            [id, websiteId],
          );
        }
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      console.log(err);
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
      hasError = true;
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
    }

    return !hasError;
  }

  async findMyMonitorUserWebsiteStartingUrl(
    userId: number,
    websiteName: string,
  ): Promise<any> {
    const website = await this.websiteRepository.query(
      `SELECT w.StartingUrl FROM 
        Website as w
      WHERE
        w.UserId = ? AND
        w.Name = ?
      LIMIT 1`,
      [userId, websiteName],
    );

    return website ? website[0].StartingUrl : null;
  }

  async updatePagesObservatory(
    updateObservatoryPages: UpdateObservatoryPages,
    userId: number,
  ): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      for (const observatoryPage of updateObservatoryPages.pages || []) {
        let show = null;
        const id = observatoryPage.id;
        const page = await this.pageRepository.findOne({
          where: { id: id },
        });
        //TODO , deal with permission with CASL AND ACCESS ENTITTIES
        /* if (!observatoryPage.inObservatory) {
          show = page.Show_In[0] + page.Show_In[2] + "0";
        } else {
          show = page.Show_In[0] + page.Show_In[2] + "1";
        }
  */
        if (page) {
          await queryRunner.manager.update(
            Page,
            { id: page.id },
            { createdById: userId },
          );
        }
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      console.log(err);
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
      hasError = true;
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
    }

    return !hasError;
  }

  async delete(websiteId: number): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      await queryRunner.manager.query(
        `DELETE FROM TagWebsite WHERE WebsiteId = ? AND TagId <> 0`,
        [websiteId],
      );

      const pages = await queryRunner.manager.query(
        `
        SELECT
          wp.PageId 
        FROM 
          WebsitePage as wp
        WHERE
          wp.WebsiteId = ?
      `,
        [websiteId],
      );

      if (pages.length > 0) {
        await queryRunner.manager.query(
          `
          DELETE FROM  
            Page
          WHERE
            PageId IN (?)
        `,
          [pages.map((p) => p.PageId)],
        );
      }

      await queryRunner.manager.query(
        //`UPDATE Website SET UserId = NULL, EntityId = NULL, Deleted = 1 WHERE WebsiteId = ?`,
        `DELETE FROM Website WHERE WebsiteId = ?`,
        [websiteId],
      );

      await queryRunner.commitTransaction();
    } catch (err) {
      console.log(err);
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
      hasError = true;
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
    }

    return websiteId;
  }

  async deleteBulk(websitesId: Array<number>): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      await queryRunner.manager.query(
        `DELETE FROM TagWebsite WHERE WebsiteId IN (?) AND TagId <> 0`,
        [websitesId],
      );

      const pages = await queryRunner.manager.query(
        `
        SELECT
          wp.PageId 
        FROM 
          WebsitePage as wp
        WHERE
          wp.WebsiteId IN (?)
      `,
        [websitesId],
      );
      if (pages.length > 0) {
        await queryRunner.manager.query(
          `
        DELETE FROM  
          Page
        WHERE
          PageId IN (?)
      `,
          [pages.map((p) => p.PageId)],
        );
      }

      await queryRunner.manager.query(
        //`UPDATE Website SET UserId = NULL, EntityId = NULL, Deleted = 1 WHERE WebsiteId = ?`,
        `DELETE FROM Website WHERE WebsiteId IN (?)`,
        [websitesId],
      );

      await queryRunner.commitTransaction();
    } catch (err) {
      console.log(err);
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
      hasError = true;
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
    }

    return websitesId;
  }

  async pagesDeleteBulk(websitesId: Array<number>): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      const pages = await queryRunner.manager.query(
        `
        SELECT
          PageId 
        FROM 
          WebsitePage
        WHERE
          WebsiteId IN (?)
      `,
        [websitesId],
      );

      await queryRunner.manager.query(
        `
        DELETE FROM  
          Page
        WHERE
          PageId IN (?)
      `,
        [pages.map((p) => p.PageId)],
      );

      await queryRunner.commitTransaction();
    } catch (err) {
      console.log(err);
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
      hasError = true;
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
    }

    return websitesId;
  }

  async import(websiteId: number, newWebsiteName: string): Promise<any> {
    let returnWebsiteId = websiteId;
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      const website = await queryRunner.manager.query(
        `SELECT *
        FROM 
          Website as w
        WHERE 
          w.WebsiteId = ?`,
        [websiteId],
      );

      const webDate = website[0].Creation_Date.toISOString()
        .replace(/T/, " ")
        .replace(/\..+/, "");

      const pages = await queryRunner.manager.query(
        `SELECT p.*
        FROM 
          Page as p,  
          Website as w,
          WebsitePage as wp 
        WHERE 
          wp.WebsiteId = w.WebsiteId AND
          wp.PageId = p.PageId
          w.WebsiteId = ? AND`,
        [websiteId],
      );

      const websiteP = (
        await queryRunner.manager.query(
          `SELECT distinct w.*
        FROM  
          Website as w,
          User as u
        WHERE 
          w.StartingUrl = ? AND
          (w.UserId IS NULL OR (u.UserId = w.UserId AND u.Type = "monitor"))
        LIMIT 1
        `,
          [website[0].StartingUrl],
        )
      )[0];

      const websiteUrl = website[0].StartingUrl;

      if (website.length > 0) {
        if (websiteP) {
          for (const page of pages || []) {
            if (page.Show_In[0] === "0") {
              await this.importPage(queryRunner, page.PageId);
              await queryRunner.manager.query(
                `INSERT INTO WebsitePage (WebsiteId, PageId) VALUES (?, ?)`,
                [websiteP.WebsiteId, page.PageId],
              );
            }
          }

          await queryRunner.manager.query(
            `UPDATE Website SET Creation_Date = ? WHERE WebsiteId = ?`,
            [webDate, websiteP.WebsiteId],
          );
        } else {
          const insertWebsite = await queryRunner.manager.query(
            `INSERT INTO Website (Name, StartingUrl, Creation_Date) VALUES (?, ?, ?)`,
            [newWebsiteName, websiteUrl, webDate],
          );
          returnWebsiteId = insertWebsite.WebsiteId;

          for (const page of pages || []) {
            if (page.Show_In[0] === "0") {
              await this.importPage(queryRunner, page.PageId);
              await queryRunner.manager.query(
                `INSERT INTO WebsitePage (WebsiteId, PageId) VALUES (?,?)`,
                [website.WebsiteId, page.PageId],
              );
            }
          }
        }
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      console.log(err);
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
      hasError = true;
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
    }

    return returnWebsiteId;
  }

  private async importPage(queryRunner: any, pageId: number): Promise<any> {
    const page = await queryRunner.manager.query(
      `SELECT Show_In FROM Page WHERE PageId = ? LIMIT 1`,
      [pageId],
    );

    if (page.length > 0) {
      const show = "1" + page[0].Show_In[1] + page[0].Show_In[2];
      await queryRunner.manager.query(
        `UPDATE Page SET Show_In = ? WHERE PageId = ?`,
        [show, pageId],
      );

      const evaluation = await queryRunner.manager.query(
        `SELECT  e.EvaluationId, e.Show_To FROM Evaluation as e WHERE e.PageId = ? AND e.Show_To LIKE "_1" ORDER BY e.Evaluation_Date  DESC LIMIT 1`,
        [pageId],
      );

      const evalId = evaluation[0].EvaluationId;
      const showTo = evaluation[0].Show_To;

      if (evaluation.length > 0) {
        const newShowTo = "1" + showTo[1];
        await queryRunner.manager.query(
          `UPDATE Evaluation SET Show_To = ? WHERE EvaluationId = ?`,
          [newShowTo, evalId],
        );
      }
    }
  }

  async findPagesCount(websiteId: number, search: string): Promise<number> {
    let where_clause = `
      wp.WebsiteId = ? AND
      p.PageId = wp.PageId AND
      p.Show_In LIKE "1__"
    `;

    const queryParams: any[] = [websiteId];

    // Handle empty search (represented as '-' placeholder)
    if (search && search.trim() !== "" && search !== "-") {
      where_clause += ` AND p.Uri LIKE ?`;
      queryParams.push(`%${search}%`);
    }

    const result = await this.websiteRepository.query(
      `SELECT
        COUNT(DISTINCT p.PageId) as total
      FROM
        WebsitePage as wp,
        Page as p
      WHERE
        ${where_clause}`,
      queryParams,
    );

    return parseInt(result[0].total);
  }

  async findPagesPaginated(
    websiteId: number,
    size: number,
    page: number,
    sort: string,
    direction: string,
    search: string,
  ): Promise<any> {
    let where_clause = `
      wp.WebsiteId = ? AND
      p.PageId = wp.PageId AND
      p.Show_In LIKE "1__"
    `;

    const queryParams: any[] = [websiteId];

    // Handle empty search (represented as '-' placeholder)
    if (search && search.trim() !== "" && search !== "-") {
      where_clause += ` AND p.Uri LIKE ?`;
      queryParams.push(`%${search}%`);
    }

    // Handle case when no sorting is specified (like the working websites method)
    if (!direction || !direction.trim()) {
      queryParams.push(size, page * size);

      const pages = await this.websiteRepository.query(
        `SELECT
          distinct p.*,
          e.Score,
          e.A,
          e.AA,
          e.AAA,
          e.Tot,
          e.Errors,
          e.Element_Count,
          e.Tag_Count,
          e.Evaluation_Date,
          el.EvaluationListId, el.Error, el.Is_Evaluating
        FROM
          WebsitePage as wp,
          Page as p
          LEFT OUTER JOIN Evaluation_List as el ON el.PageId = p.PageId AND el.UserId = -1
          LEFT OUTER JOIN Evaluation as e ON e.PageId = p.PageId AND e.Show_To LIKE "1_" AND e.Evaluation_Date IN (
            SELECT max(Evaluation_Date) FROM Evaluation WHERE PageId = p.PageId AND Show_To LIKE "1_"
          )
        WHERE
          ${where_clause}
        ORDER BY p.Uri ASC
        LIMIT ? OFFSET ?`,
        queryParams,
      );

      return pages;
    } else {
      // Handle sorting case
      let order_by = "p.Uri";
      if (sort && sort !== "") {
        switch (sort) {
          case "Uri":
            order_by = "p.Uri";
            break;
          case "Score":
            order_by = "e.Score";
            break;
          case "Evaluation_Date":
            order_by = "e.Evaluation_Date";
            break;
          case "A":
            order_by = "e.A";
            break;
          case "AA":
            order_by = "e.AA";
            break;
          case "AAA":
            order_by = "e.AAA";
            break;
          case "State":
            order_by = "el.Is_Evaluating, el.Error";
            break;
          case "Show_In":
            order_by = "p.Show_In";
            break;
          default:
            order_by = "p.Uri";
        }
      }

      const sort_direction = direction === "desc" ? "DESC" : "ASC";
      queryParams.push(size, page * size);

      const pages = await this.websiteRepository.query(
        `SELECT
          distinct p.*,
          e.Score,
          e.A,
          e.AA,
          e.AAA,
          e.Tot,
          e.Errors,
          e.Element_Count,
          e.Tag_Count,
          e.Evaluation_Date,
          el.EvaluationListId, el.Error, el.Is_Evaluating
        FROM
          WebsitePage as wp,
          Page as p
          LEFT OUTER JOIN Evaluation_List as el ON el.PageId = p.PageId AND el.UserId = -1
          LEFT OUTER JOIN Evaluation as e ON e.PageId = p.PageId AND e.Show_To LIKE "1_" AND e.Evaluation_Date IN (
            SELECT max(Evaluation_Date) FROM Evaluation WHERE PageId = p.PageId AND Show_To LIKE "1_"
          )
        WHERE
          ${where_clause}
        ORDER BY ${order_by} ${sort_direction}
        LIMIT ? OFFSET ?`,
        queryParams,
      );

      return pages;
    }
  }
}
