import { ForbiddenException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository, In } from "typeorm";
import { Directory, TagMatchingStrategy } from "./directory.entity";
import { QueryRequest, QueryResponse } from "src/common/repositories/base.repository";
import { DirectoryFilterDTO } from "./dto/request/query/directory-filter.dto";
import { DirectorySortDTO } from "./dto/request/query/directory-sort.dto";
import { DirectoryPaginationDTO } from "./dto/request/query/directory-pagination.dto";
import { FgaService } from "src/core/authorization/fga.service";
import { SecurityContext } from "src/core/authorization/SecurityContext";
import { CreateDirectory } from "./dto/create-diretory.dto";
import { DirectoryRepository } from "./repositories/directory.repository";

@Injectable()
export class DirectoryService {
  constructor(
    @InjectRepository(Directory)
    private readonly directoryRepository: Repository<Directory>,
    private readonly directoryRepositoryNew: DirectoryRepository,
    @InjectDataSource()
    private readonly connection: DataSource,
    private readonly fgaService: FgaService,
  ) {}

  /*
  async addPagesToEvaluate(
    directoriesId: number[],
    option: string,
  ): Promise<boolean> {
    let error = false;

    for (const directoryId of directoriesId ?? []) {
      const nTags = await this.directoryRepository.query(
        `SELECT * FROM DirectoryTag WHERE DirectoryId = ?`,
        [directoryId],
      );

      const pages = await this.directoryRepository.query(
        `
        SELECT
          p.PageId, 
          p.Uri
        FROM
          TagWebsite as tw,
          Website as w,
          WebsitePage as wp,
          Page as p
        WHERE
          tw.TagId IN (?) AND
          w.WebsiteId = tw.WebsiteId AND
          wp.WebsiteId = w.WebsiteId AND
          p.PageId = wp.PageId AND
          p.Show_In LIKE ?
        GROUP BY 
          w.WebsiteId, p.PageId
        HAVING 
          COUNT(w.WebsiteId) = ?
      `,
        [
          nTags.map((t) => t.TagId),
          option === "all" ? "1__" : "1_1",
          nTags.length,
        ],
      );

      const queryRunner = this.connection.createQueryRunner();

      await queryRunner.connect();

      await queryRunner.startTransaction();

      try {
        for (const page of pages || []) {
          try {
            const pageEval = await queryRunner.manager.query(
              `SELECT * FROM Evaluation_List WHERE PageId = ? AND UserId = -1 AND Url = ? AND Show_To = ? LIMIT 1`,
              [page.PageId, page.Uri, "10"],
            );
            if (pageEval.length > 0) {
              await queryRunner.manager.query(
                `UPDATE Evaluation_List SET Error = NULL, Is_Evaluating = 0 WHERE EvaluationListId = ?`,
                [pageEval[0].EvaluationListId],
              );
            } else {
              await queryRunner.manager.query(
                `INSERT INTO Evaluation_List (PageId, UserId, Url, Show_To, Creation_Date) VALUES (?, ?, ?, ?, ?)`,
                [page.PageId, -1, page.Uri, "10", new Date()],
              );
            }
          } catch (_) {}
        }

        await queryRunner.manager.query(
          `UPDATE Evaluation_Request_Counter SET Counter = Counter + ?, Last_Request = NOW() WHERE Application = "AMS/Observatory"`,
          [pages.length],
        );

        await queryRunner.commitTransaction();
      } catch (err) {
        // since we have errors lets rollback the changes we made
        await queryRunner.rollbackTransaction();
        console.log(err);
        error = true;
      } finally {
        await queryRunner.release();
      }
    }

    return !error;
  }*/

  
  
    async createDirectory(
      createDto: CreateDirectory,
      securityContext: SecurityContext
    ): Promise<Directory> {
      const isAdmin = await this.fgaService.isSystemAdmin(securityContext.user.id);
  
      if (!isAdmin) {
        throw new ForbiddenException("You do not have permission to create a directory");
      }
  
      const directory = new Directory();
      Object.assign(directory, createDto);
      const savedDirectory = await this.directoryRepository.save(directory);
      
      if (!savedDirectory) {
        throw new Error("Failed to create directory");
      }
      
      return savedDirectory;
    }

  async createOne(directory: Directory, tags: number[]): Promise<boolean> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      const insertDirectory = await queryRunner.manager.save(directory);

      for (const tagId of tags || []) {
        await queryRunner.manager.query(
          `INSERT INTO DirectoryTag (DirectoryId, TagId) VALUES (?, ?)`,
          [insertDirectory.id, tagId],
        );
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
      hasError = true;
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
    }

    return !hasError;
  }

  async update(
    directoryId: number,
    name: string,
    observatory: number,
    strategy: TagMatchingStrategy,
    defaultTags: number[],
    tags: number[],
  ): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      await queryRunner.manager.update(
        Directory,
        { id: directoryId },
        { name: name, showInObservatory: observatory, tagMatchingStrategy: strategy },
      );

      for (const id of defaultTags || []) {
        if (!tags.includes(id)) {
          await queryRunner.manager.query(
            `DELETE FROM DirectoryTag WHERE DirectoryId = ? AND TagId = ?`,
            [directoryId, id],
          );
        }
      }

      for (const id of tags || []) {
        if (!defaultTags.includes(id)) {
          await queryRunner.manager.query(
            `INSERT INTO DirectoryTag (DirectoryId, TagId) VALUES (?, ?)`,
            [directoryId, id],
          );
        }
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
      hasError = true;
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
    }

    return !hasError;
  }


  async delete(ids: number[], securityContext: SecurityContext): Promise<void> {
    const idsPermited = await this.fgaService.listObjects({
      user: `user:${securityContext.user.id}`,
      relation: 'can_manage',
      type: 'directory',
    }).then(objects => objects.map(obj => parseInt(obj.split(':')[1], 10)));
    const idsToDelete = ids.filter(id => idsPermited.includes(id));

    for (const id of idsToDelete) {
    await this.directoryRepository.delete(id);

    await this.fgaService.deleteResourceTuples(`directory:${id}`);

    } 
  }
  
  findByDirectoryName(directoryName: string): Promise<Directory | null> {
    return this.directoryRepository.findOne({ where: { name: directoryName } });
  }

 
 
   async findAll(
     queryArgs: QueryRequest<DirectoryFilterDTO, DirectorySortDTO, DirectoryPaginationDTO>,
   ): Promise<QueryResponse<Directory>> {
     const userId = queryArgs.securityContext?.user.id;
     if (!userId) {
       throw new ForbiddenException("User not authenticated");
     }
 
     const objectsId  = await this.fgaService.listObjects({
       user: `user:${userId}`,
       relation: 'can_view',
       type: 'directory',
     });
 
     queryArgs.filters = {
       ...queryArgs.filters,
       ids: objectsId.map(id => parseInt(id.split(':')[1], 10)),
     };
 
     return await this.directoryRepositoryNew.findMany(queryArgs);
   }
  async findNumberOfObservatory(): Promise<number> {
    /*return this.directoryRepository.count({
      where: { Show_in_Observatory: 1 },
    });*/
    throw new Error("Method not implemented.");
    // TODO TOTAL new implemnetation neeeded acording do CASL and Access table
  }

  async adminCount(search: string): Promise<any> {
    const count = await this.directoryRepository.query(
      `SELECT COUNT(d.DirectoryId) as Count
      FROM Directory as d
      WHERE d.Name LIKE ?`,
      [search.trim() !== "" ? `%${search.trim()}%` : "%"],
    );
    return count[0].Count;
  }

  async count(): Promise<number> {
    return this.directoryRepository.count();
  }

  async findInfo(directoryId: number): Promise<any> {
    const directories = await this.directoryRepository.query(
      `SELECT * FROM Directory WHERE DirectoryId = ? LIMIT 1`,
      [directoryId],
    );

    if (directories) {
      const directory = directories[0];

      directory.tags = await this.directoryRepository.query(
        `SELECT t.* 
        FROM
          DirectoryTag as dt,
          Tag as t 
        WHERE
          dt.DirectoryId = ? AND 
          t.TagId = dt.TagId`,
        [directoryId],
      );

      return directory;
    } else {
      throw new InternalServerErrorException();
    }
  }

  findAllDirectoryTags(directory: string): Promise<any> {
    return this.directoryRepository.query(
      `SELECT 
        t.*,
        COUNT(distinct tw.WebsiteId) as Websites 
      FROM
        Directory as d,
        DirectoryTag as dt,
        Tag as t
        LEFT OUTER JOIN TagWebsite as tw ON tw.TagId = t.TagId
      WHERE
        d.Name = ? AND
        dt.DirectoryId = d.DirectoryId AND
        t.TagId = dt.TagId AND
        t.UserId IS NULL
      GROUP BY t.TagId`,
      [directory],
    );
  }

  async findAllDirectoryWebsites(directory: string): Promise<any> {
    const _directory = await this.directoryRepository.query(
      `SELECT * FROM Directory WHERE Name = ? LIMIT 1`,
      [directory],
    );
    const method = _directory[0].Method;

    const nTags = await this.directoryRepository.query(
      `SELECT td.* FROM Directory as d, DirectoryTag as td WHERE d.Name = ? AND td.DirectoryId = d.DirectoryId`,
      [directory],
    );

    if (method === 0) {
      /*return manager.query(
        `SELECT 
          w.*, 
          u.Username as User, u.Type as Type,  
          COUNT(distinct wp.PageId) as Pages,
          COUNT(distinct e.PageId) as Evaluated_Pages
        FROM
          TagWebsite as tw
          LEFT OUTER JOIN Website as w ON w.WebsiteId = tw.WebsiteId
          LEFT OUTER JOIN User as u ON u.UserId = w.UserId
          LEFT OUTER JOIN WebsitePage as wp ON wp.WebsiteId = w.WebsiteId
          LEFT OUTER JOIN Page as p ON p.PageId = wp.PageId AND p.Show_In LIKE "1__"
          LEFT OUTER JOIN Evaluation as e ON e.PageId = p.PageId
        WHERE
          tw.TagId IN (?) AND
          w.WebsiteId = tw.WebsiteId AND
          (w.UserId IS NULL OR (u.UserId = w.UserId AND u.Type != 'studies'))
        GROUP BY
          w.WebsiteId
        HAVING COUNT(tw.WebsiteId) = ?`,
        [nTags.map((t) => t.TagId), nTags.length]
      );*/
      const websites = await this.directoryRepository.query(
        `
        SELECT * FROM TagWebsite WHERE TagId IN (?)
      `,
        [nTags.map((t) => t.TagId)],
      );

      const counts = {};
      for (const w of websites ?? []) {
        if (counts[w.WebsiteId]) {
          counts[w.WebsiteId]++;
        } else {
          counts[w.WebsiteId] = 1;
        }
      }

      const websitesToFetch = new Array<Number>();
      for (const id of Object.keys(counts) ?? []) {
        if (counts[id] === nTags.length) {
          websitesToFetch.push(parseInt(id));
        }
      }

      return this.directoryRepository.query(
        `
        SELECT 
          w.*, 
          u.Username as User, u.Type as Type,  
          COUNT(distinct wp.PageId) as Pages,
          COUNT(distinct e.PageId) as Evaluated_Pages
        FROM
          Website as w
          LEFT OUTER JOIN User as u ON u.UserId = w.UserId
          LEFT OUTER JOIN WebsitePage as wp ON wp.WebsiteId = w.WebsiteId
          LEFT OUTER JOIN Page as p ON p.PageId = wp.PageId AND p.Show_In LIKE "1__"
          LEFT OUTER JOIN Evaluation as e ON e.PageId = p.PageId
        WHERE
          w.WebsiteId IN (?) AND
          (w.UserId IS NULL OR (u.UserId = w.UserId AND u.Type != 'studies'))
        GROUP BY
          w.WebsiteId
      `,
        [websitesToFetch],
      );
    } else {
      return this.directoryRepository.query(
        `SELECT DISTINCT
          w.*, 
          u.Username as User, u.Type as Type, 
          COUNT(distinct wp.PageId) as Pages,
          COUNT(distinct e.PageId) as Evaluated_Pages
        FROM
          TagWebsite as tw,
          Website as w
          LEFT OUTER JOIN User as u ON u.UserId = w.UserId
          LEFT OUTER JOIN WebsitePage as wp ON wp.WebsiteId = w.WebsiteId
          LEFT OUTER JOIN Page as p ON p.PageId = wp.PageId AND p.Show_In LIKE "1__"
          LEFT OUTER JOIN Evaluation as e ON e.PageId = p.PageId
        WHERE
          tw.TagId IN (?) AND
          w.WebsiteId = tw.WebsiteId AND
          (w.UserId IS NULL OR (u.UserId = w.UserId AND u.Type != 'studies'))
        GROUP BY
          w.WebsiteId`,
        [nTags.map((t) => t.TagId)],
      );
    }
  }

  async findAllDirectoryWebsitePages(directory: string): Promise<any> {
    const _directory = await this.directoryRepository.query(
      `SELECT * FROM Directory WHERE Name = ? LIMIT 1`,
      [directory],
    );
    const method = _directory[0].Method;

    const nTags = await this.directoryRepository.query(
      `SELECT td.* FROM Directory as d, DirectoryTag as td WHERE d.Name = ? AND td.DirectoryId = d.DirectoryId`,
      [directory],
    );

    if (method === 0) {
      const pages = await this.directoryRepository.query(
        `SELECT 
          w.WebsiteId,
          p.*,
          e.A,
          e.AA,
          e.AAA,
          e.Score,
          e.Errors,
          e.Tot,
          e.Evaluation_Date
        FROM 
          TagWebsite as tw,
          Website as w,
          WebsitePage as wp,
          Page as p
          LEFT OUTER JOIN Evaluation e ON e.PageId = p.PageId AND e.Show_To LIKE "1_" AND e.Evaluation_Date = (
            SELECT Evaluation_Date FROM Evaluation 
            WHERE PageId = p.PageId AND Show_To LIKE "1_"
            ORDER BY Evaluation_Date DESC LIMIT 1
          )
        WHERE
          tw.TagId IN (?) AND
          w.WebsiteId = tw.WebsiteId AND
          wp.WebsiteId = w.WebsiteId AND
          p.PageId = wp.PageId AND
          p.Show_In LIKE "1__"
        GROUP BY w.WebsiteId, p.PageId, e.A, e.AA, e.AAA, e.Score, e.Errors, e.Tot, e.Evaluation_Date
        HAVING COUNT(distinct w.WebsiteId) = ?`,
        [nTags.map((t) => t.TagId), nTags.length],
      );

      return pages.filter((p) => p.Score !== null);
    } else {
      const pages = await this.directoryRepository.query(
        `SELECT DISTINCT
          w.WebsiteId,
          p.*,
          e.A,
          e.AA,
          e.AAA,
          e.Score,
          e.Errors,
          e.Tot,
          e.Evaluation_Date
        FROM 
          TagWebsite as tw,
          Website as w,
          WebsitePage as wp,
          Page as p
          LEFT OUTER JOIN Evaluation e ON e.PageId = p.PageId AND e.Show_To LIKE "1_" AND e.Evaluation_Date = (
            SELECT Evaluation_Date FROM Evaluation 
            WHERE PageId = p.PageId AND Show_To LIKE "1_"
            ORDER BY Evaluation_Date DESC LIMIT 1
          )
        WHERE
          tw.TagId IN (?) AND
          w.WebsiteId = tw.WebsiteId AND
          wp.WebsiteId = w.WebsiteId AND
          p.PageId = wp.PageId AND
          p.Show_In LIKE "1__"
        GROUP BY w.WebsiteId, p.PageId, e.A, e.AA, e.AAA, e.Score, e.Errors, e.Tot, e.Evaluation_Date`,
        [nTags.map((t) => t.TagId)],
      );

      return pages; //.filter((p) => p.Score !== null);
    }
  }
}
