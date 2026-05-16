import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { Repository, In, DataSource } from "typeorm";
import { User } from "./user.entity";
import { Tag } from "../../inventory/tag/tag.entity";
import { Website } from "../../inventory/website/website.entity";
import {
  comparePasswordHash,
  generatePasswordHash,
} from "../../../common/security";
import { GovUser } from "../gov-user/entities/gov-user.entity";
import { RoleSlug } from "src/core/authentication/interfaces/types";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(GovUser)
    private readonly govUserRepository: Repository<GovUser>,
    @InjectDataSource()
    private readonly connection: DataSource,
  ) {}

  async findUserByGovId(govUserId: number): Promise<User> {

    return await this.userRepository.findOneOrFail({
      where: { govUser: { id: govUserId } },
    });
  }
  async associateGovUser(govUserId: number,userId: number) {
    const govUser = await this.govUserRepository.findOne({
      where: { id: govUserId },
    });
    if (!govUser) return;
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) return;
    user.govUser = govUser;
    return this.userRepository.save(user);
  }

  async changePassword(
    userId: number,
    password: string,
    newPassword: string,
  ): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });
      if (user && (await comparePasswordHash(password, user.password))) {
        const newPasswordHash = await generatePasswordHash(newPassword);
        await queryRunner.manager.update(
          User,
          { id: userId },
          { password: newPasswordHash },
        );
      } else {
        hasError = true;
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
      hasError = true;
      console.log(err);
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
    }

    if (hasError) {
      throw new UnauthorizedException();
    }

    return true;
  }

  async update(
    userId: number,
    password: string,
    names: string,
    emails: string,
    app: string,
    defaultWebsites: number[],
    websites: number[],
    transfer: boolean,
  ): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      await queryRunner.manager.update(
        User,
        { id: userId },
        { fullName: names, email: emails },
      );

      if (password && password !== "null") {
        await queryRunner.manager.update(
          User,
          { id: userId },
          { password: await generatePasswordHash(password) },
        );
      }
      // TODO: Logic os CASL and Access Pattern, this logic should be on websiteservice or other related.
      if (app === "monitor") {
        for (const id of defaultWebsites || []) {
          if (!websites.includes(id)) {
            await queryRunner.manager.query(
              `
              UPDATE
                websites as w, 
                website_pages as wp, 
                pages as p,
                evaluations as e
              SET 
                p.Show_In = "101",
                e.Show_To = "10" 
              WHERE
                w.WebsiteId = ? AND
                wp.WebsiteId = w.WebsiteId AND
                p.PageId = wp.PageId AND
                p.Show_In = "111" AND
                e.PageId = p.PageId`,
              [id],
            );

            await queryRunner.manager.query(
              `
              UPDATE 
                websites as w, 
                website_pages as wp, 
                pages as p,
                evaluations as e
              SET 
                p.Show_In = "100",
                e.Show_To = "10"
              WHERE
                w.id = ? AND
                wp.website_id = w.id AND
                p.id = wp.page_id AND
                p.show_in = "110" AND
                e.page_id = p.id`,
              [id],
            );

            await queryRunner.manager.query(
              `
              UPDATE 
                websites as w, 
                website_pages as wp, 
                pages as p,
                evaluations as e
              SET 
                p.Show_In = "000",
                e.Show_To = "10" 
              WHERE
                w.id = ? AND
                wp.website_id = w.id AND
                p.id = wp.page_id AND
                p.show_in = "010" AND
                e.page_id = p.id`,
              [id],
            );

            await queryRunner.manager.update(
              Website,
              { id: id },
              { createdById: userId },
            );
          }
        }

        for (const id of websites || []) {
          if (!defaultWebsites.includes(id)) {
            await queryRunner.manager.update(
              Website,
              { id: id },
              { createdById: userId },
            );

            if (transfer) {
              await queryRunner.manager.query(
                `UPDATE Website as w, WebsitePage as wp, Page as p, Evaluation as e SET p.Show_In = "111", e.Show_To = "11" 
                WHERE
                  w.WebsiteId = ? AND
                  wp.WebsiteId = w.WebsiteId AND
                  p.PageId = wp.PageId AND
                  p.Show_In = "101" AND
                  e.PageId = p.PageId`,
                [id],
              );
            }
          }
        }
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
      hasError = true;
      console.log(err);
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
    }

    return !hasError;
  }

  async delete(userId: number, app: string): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      if (app === "monitor") {
        await queryRunner.manager.query(
          `
          UPDATE 
            Website as w,
            WebsitePage as wp, 
            Page as p 
          SET 
            p.Show_In = "101" 
          WHERE
            w.UserId = ? AND
            wp.WebsiteId = w.WebsiteId AND
            p.PageId = wp.PageId AND
            p.Show_In LIKE "111"`,
          [userId],
        );

        await queryRunner.manager.query(
          `
          UPDATE 
            Website as w,
            WebsitePage as wp, 
            Page as p 
          SET 
            p.Show_In = "100" 
          WHERE
            w.UserId = ? AND
            wp.WebsiteId = w.WebsiteId AND
            p.PageId = wp.PageId AND
            p.Show_In = "110"`,
          [userId],
        );

        await queryRunner.manager.query(
          `
          UPDATE 
            Website as w, 
            WebsitePage as wp, 
            Page as p 
          SET 
            p.Show_In = "000" 
          WHERE
            w.UserId = ? AND
            wp.WebsiteId = w.WebsiteId AND
            p.PageId = wp.PageId AND
            p.Show_In = "100"`,
          [userId],
        );

        await queryRunner.manager.query(
          `UPDATE Website SET UserId = NULL WHERE UserId = ?`,
          [userId],
        );
      } else {
        await queryRunner.manager.query(
          `DELETE FROM Tag WHERE UserId = ? AND TagId <> 0`,
          [userId],
        );
        await queryRunner.manager.query(
          `DELETE FROM Website WHERE UserId = ? AND WebsiteId <> 0`,
          [userId],
        );
      }

      await queryRunner.manager.query(`DELETE FROM User WHERE UserId = ?`, [
        userId,
      ]);

      await queryRunner.commitTransaction();
    } catch (err) {
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
      hasError = true;
      console.log(err);
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
    }

    return !hasError;
  }

  async findAll(
    size?: number,
    page?: number,
    sort?: string,
    direction?: string,
    search?: string,
  ): Promise<User[]> {
    // If no pagination parameters provided, return all users (existing behavior)
    if (size === undefined) {
      const users = await this.userRepository.query(`
        SELECT 
          u.UserId, u.Username, u.Type, u.Register_Date, u.Last_Login, 
          COUNT(distinct w.WebsiteId) as Websites
        FROM User as u
        LEFT OUTER JOIN Website as w ON w.UserId = u.UserId
        GROUP BY u.UserId`);

      return users;
    }

    // Paginated version
    const searchTerm = search?.trim() !== "" ? `%${search?.trim()}%` : "%";

    if (!direction?.trim()) {
      // Without sorting
      if (size !== -1 && page) {
        const users = await this.userRepository.query(
          `SELECT 
            u.UserId, u.Username, u.Names, u.Emails, u.Type, u.Register_Date, u.Last_Login,
            COUNT(distinct w.WebsiteId) as Websites
          FROM User as u
          LEFT OUTER JOIN Website as w ON w.UserId = u.UserId
          WHERE
            u.Type != "admin" AND (u.Username LIKE ? OR u.Names LIKE ? OR u.Emails LIKE ?)
          GROUP BY u.UserId
          LIMIT ? OFFSET ?`,
          [searchTerm, searchTerm, searchTerm, size, page * size],
        );
        return users;
      } else {
        const users = await this.userRepository.query(
          `SELECT 
            u.UserId, u.Username, u.Names, u.Emails, u.Type, u.Register_Date, u.Last_Login,
            COUNT(distinct w.WebsiteId) as Websites
          FROM User as u
          LEFT OUTER JOIN Website as w ON w.UserId = u.UserId
          WHERE
            u.Type != "admin" AND (u.Username LIKE ? OR u.Names LIKE ? OR u.Emails LIKE ?)
          GROUP BY u.UserId`,
          [searchTerm, searchTerm, searchTerm],
        );
        return users;
      }
    } else {
      // With sorting
      let order = "";
      switch (sort) {
        case "Username":
          order = "u.Username";
          break;
        case "Names":
          order = "u.Names";
          break;
        case "Emails":
          order = "u.Emails";
          break;
        case "Type":
          order = "u.Type";
          break;
        case "Register_Date":
          order = "u.Register_Date";
          break;
        case "Last_Login":
          order = "u.Last_Login";
          break;
        case "Websites":
          order = "Websites";
          break;
        default:
          order = "u.Username";
          break;
      }

      if (size !== -1 && page) {
        const users = await this.userRepository.query(
          `SELECT 
            u.UserId, u.Username, u.Names, u.Emails, u.Type, u.Register_Date, u.Last_Login,
            COUNT(distinct w.WebsiteId) as Websites
          FROM User as u
          LEFT OUTER JOIN Website as w ON w.UserId = u.UserId
          WHERE
            u.Type != "admin" AND (u.Username LIKE ? OR u.Names LIKE ? OR u.Emails LIKE ?)
          GROUP BY u.UserId
          ORDER BY ${order} ${direction.toUpperCase()}
          LIMIT ? OFFSET ?`,
          [searchTerm, searchTerm, searchTerm, size, page * size],
        );
        return users;
      } else {
        const users = await this.userRepository.query(
          `SELECT 
            u.UserId, u.Username, u.Names, u.Emails, u.Type, u.Register_Date, u.Last_Login,
            COUNT(distinct w.WebsiteId) as Websites
          FROM User as u
          LEFT OUTER JOIN Website as w ON w.UserId = u.UserId
          WHERE
            u.Type != "admin" AND (u.Username LIKE ? OR u.Names LIKE ? OR u.Emails LIKE ?)
          GROUP BY u.UserId
          ORDER BY ${order} ${direction.toUpperCase()}`,
          [searchTerm, searchTerm, searchTerm],
        );
        return users;
      }
    }
  }

  async findAllFromMyMonitor(): Promise<User[]> {
    return this.userRepository.find({
      select: ["id", "username", "role", "createdAt", "lastLogin"],
      where: { role: { slug: RoleSlug.MONITOR } },
      relations: ["role"],
    });
  }

  async findInfo(userId: number): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (user) {
      if (user.role.slug === "monitor") {
        user["websites"] = await this.userRepository.query(
          `SELECT * FROM websites  WHERE createdBy = ?`,
          [userId],
        );
      }
      const userDto = {
        ...user,
        password: undefined,
        uniqueHash: undefined,
      };

      return userDto;
    } else {
      throw new InternalServerErrorException();
    }
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOneOrFail({ where: { id: +id } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username: username } });
  }

  findNumberOfStudyMonitor(): Promise<number> {
    return this.userRepository.count({ where: { role: { slug: RoleSlug.STUDY } } });
  }

  findNumberOfMyMonitor(): Promise<number> {
    return this.userRepository.count({ where: { role: { slug: RoleSlug.MONITOR } } });
  }

  async adminCount(search: string): Promise<any> {
    const count = await this.userRepository.query(
      `SELECT COUNT(u.UserId) as Count
      FROM User as u
      WHERE u.Type != "admin" AND (u.Username LIKE ? OR u.Names LIKE ? OR u.Emails LIKE ?)`,
      [
        search.trim() !== "" ? `%${search.trim()}%` : "%",
        search.trim() !== "" ? `%${search.trim()}%` : "%",
        search.trim() !== "" ? `%${search.trim()}%` : "%",
      ],
    );
    return count[0].Count;
  }

  findNumberOfAMS(): Promise<number> {
    return this.userRepository.count({ where: { role: { slug: RoleSlug.ADMIN } } });
  }

  async findStudyMonitorUserTagByName(
    userId: number,
    name: string,
  ): Promise<any> {
    return await this.tagRepository.findOne({
      where: { name: name, createdById: userId },
    });
  }

  async createOne(
    user: User,
    tags: string[],
    websites: string[],
    transfer: boolean,
  ): Promise<boolean> {
    // TODO implemente new creation of User creating aswell the user in OpenFGA
    throw new Error("Not implemented");
    /*
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      const insertUser = await queryRunner.manager.save(user);

      if (user.role.slug === "monitor" && websites.length > 0) {
        await queryRunner.manager.update(
          Website,
          { WebsiteId: In(websites) },
          { createdById: insertUser.id },
        );

        if (transfer) {
          await queryRunner.manager.query(
            `UPDATE Website as w, WebsitePage as wp, Page as p, Evaluation as e
            SET 
              p.Show_In = "111",
              e.Show_To = "11" 
            WHERE
              w.WebsiteId IN (?) AND
              wp.WebsiteId = w.WebsiteId AND
              p.PageId = wp.PageId AND
              p.Show_In LIKE "101" AND
              e.PageId = p.PageId`,
            [websites],
          );
        }
      } else if (user.role.slug === "studies" && tags.length > 0) {
        const copyTags = await queryRunner.manager.query(
          `SELECT * FROM Tag WHERE TagId IN (?)`,
          [tags],
        );
        for (const tag of copyTags || []) {
          // Create user tag
          const newTag = new Tag();
          newTag.name = tag.Name;
          newTag.createdById = insertUser.id;

          const insertTag = await queryRunner.manager.save(newTag);

          // Create user tag websites
          const copyWebsites = await queryRunner.manager.query(
            `
            SELECT w.*
            FROM
              TagWebsite as tw,
              Website as w
            WHERE
              tw.TagId = ? AND
              w.WebsiteId = tw.WebsiteId  
          `,
            [tag.TagId],
          );

          for (const website of copyWebsites || []) {
            const newWebsite = new Website();
            newWebsite.title = website.Name;
            newWebsite.baseUrl = website.StaringUrl;
            newWebsite.createdById = insertUser.id;

            const insertWebsite = await queryRunner.manager.save(newWebsite);

            await queryRunner.manager.query(
              `INSERT INTO websites_tags (id, website_id) VALUES (?, ?)`,
              [insertTag.id, insertWebsite.id],
            );

            // Create user tag website pages connection
            const pages = await queryRunner.manager.query(
              `SELECT * FROM website_pages WHERE website_id = ?`,
              [website[0].WebsiteId],
            );

            for (const page of pages || []) {
              await queryRunner.manager.query(
                `INSERT INTO website_pages (website_id, page_id) VALUES (?, ?)`,
                [insertWebsite.id, page.PageId],
              );
            }
          }
        }
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
      hasError = true;
      console.log(err);
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
    }

    return !hasError;*/
  }

  async findType(username: string): Promise<any> {
    if (username === "admin") {
      return "nimda";
    }

    const user = await this.userRepository.findOne({
      where: { username: username },
    });

    if (user) {
      return user.role.slug;
    } else {
      return null;
    }
  }

  async findAllWebsites(user: string): Promise<any> {
    const websites = await this.userRepository.query(
      `SELECT w.*, e.Short_Name as Entity, e.Long_Name as Entity2, u.Username as User 
        FROM 
          User as u,
          EntityWebsite as ew
          LEFT OUTER JOIN Website as w ON w.WebsiteId =  ew.WebsiteId
          LEFT OUTER JOIN Entity as e ON e.EntityId = ew.EntityId
        WHERE
          u.Username = ? AND
          w.UserId = u.UserId
        GROUP BY w.WebsiteId, w.StartingUrl`,
      [user],
    );

    return websites;
  }

  async findAllTags(user: string): Promise<any> {
    const tags = await this.userRepository.query(
      `SELECT t.*, COUNT(distinct tw.WebsiteId) as Websites, u.Username as User 
      FROM 
        User as u,
        Tag as t
        LEFT OUTER JOIN TagWebsite as tw ON tw.TagId = t.TagId
      WHERE
        u.Username = ? AND
        t.UserId = u.UserId
      GROUP BY t.TagId`,
      [user],
    );

    return tags;
  }
}
