import { Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { Evaluation } from "../entities/evaluation.entity";
import { EvaluationRepository } from "../repositories/evaluation.repository";
import { InjectQueue } from "@nestjs/bullmq";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { EvaluationRequestDTO } from "../dto/EvaluationRequest.dto";
import { Page } from "src/domains/inventory/page/page.entity";
import {
  EvaluationResult,
  EvaluationResultDocument,
} from "../entities/evaluation-result.entity";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { InjectRepository } from "@nestjs/typeorm";
import { AppLoggerService } from "src/core/app-logger/app-logger.service";

@Injectable()
export class EvaluationService {
  constructor(
    private readonly evaluationRepository: EvaluationRepository,
    @InjectModel(EvaluationResult.name)
    private resultModel: Model<EvaluationResultDocument>,
    @InjectRepository(Page) private pageRepository: any,
    @InjectQueue("evaluation-queue-public") private publicEvaluationQueue: any,
    @InjectQueue("evaluation-queue-private")
    private privateEvaluationQueue: any,
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(EvaluationService.name);
  }

  public async evaluateHtml(html: string): Promise<any> {
    throw new NotFoundException("Not implemented yet");
  }

  public async evaluatePublicRequest(url: string): Promise<void> {
    throw new NotFoundException("Not implemented yet");
    return this.evaluateManyPages("public", { pagesIds: [1, 2, 3] }); // TODO, get pages ids from database
  }

  public async evaluateManyPages(
    userType: string,
    request: EvaluationRequestDTO,
  ): Promise<void> {
    if (!(request.pagesIds.length > 0)) throw new NotFoundException();
    // TODO, permitido a todos os utilizadores. No entanto há uma divergencia de logica, se for do AMP não salva

    // else validate if pages exists
    const pages: Page[] = await this.pageRepository.find();

    // Create Evaluation and send evaluation id to queue
    const WebsiteEvaluations: Evaluation[] = pages.map((page) => {
      const newEvaluation = new Evaluation();
      newEvaluation.pageId = page.id;
      return newEvaluation;
    });
    this.evaluationRepository.saveMany(WebsiteEvaluations);

    // Mudar lógica de acordo com a nova implementaçãoo do CASL
    userType == "nimda"
      ? this.privateEvaluationQueue.addBulk(pages)
      : this.publicEvaluationQueue.addBulk(pages);
  }

  async savePageEvaluation(
    evaluationId: number,
    result: any,
  ): Promise<Evaluation> {
    const evaluation = await this.evaluationRepository.find({
      filters: { evaluationId },
    });
    if (!evaluation || evaluation.count === 0) {
      throw new NotFoundException(
        `Evaluation with ID ${evaluationId} not found`,
      );
    }
    await this.saveEvaluationMetadata(evaluationId, result);
    // Save in mongodb the heavy results and update evaluation as done and date of evaluatioon
    const evalData = evaluation.data[0];
    evalData.pageTitle = result.data.title
      .replace(/"/g, "")
      .replace(/[\u0800-\uFFFF]/g, "");
    evalData.score = result.data.score;
    const conform = result.data.conform.split("@");
    evalData.A = conform[0];
    evalData.AA = conform[1];
    evalData.AAA = conform[2];
    evalData.createdAt = result.data.date;

    return await this.evaluationRepository.save(evalData);
  }

  async saveExternalEvaluation(
    userId: number,
    role_id: number,
    pageId: number,
    data: string,
  ): Promise<any> {
    const splittedData = data.split(";");

    const newEvaluation = new Evaluation();
    newEvaluation.pageId = pageId;

    newEvaluation.score = splittedData[8].replace(",", ".");
    /* TODO , where to place , mongodb or mysq?    
    newEvaluation.tagCount = splittedData[6];
    newEvaluation.elementCount = splittedData[7];
    */
    newEvaluation.A = parseInt(splittedData[2].split("@")[0]);
    newEvaluation.AA = parseInt(splittedData[2].split("@")[1]);
    newEvaluation.AAA = parseInt(splittedData[2].split("@")[2]);
    newEvaluation.createdAt = new Date(splittedData[9]);
    newEvaluation.createdBy = userId;
    newEvaluation.ownerRoleId = role_id;

    await this.evaluationRepository.save(newEvaluation);
  }

  async getEvaluationResult(evaluationId: number): Promise<Evaluation> {
    const evaluation = await this.evaluationRepository.find({
      filters: { evaluationId },
    });
    if (!evaluation || evaluation.count === 0) {
      throw new NotFoundException(
        `Evaluation with ID ${evaluationId} not found`,
      );
    }
    return evaluation.data[0];
  }

  async getEvaluations(userId: number): Promise<Evaluation[]> {
    const found = await this.evaluationRepository.find({ filters: {} }); // TODO , do join query para trazer só as avaliações do user e website
    if (found.count === 0) {
      throw new NotFoundException(
        `No evaluations found for user ${userId} and website`,
      );
    }
    const reports = new Array<any>();
    /* TODO New logic to obtain from Mongodb
    for (const evaluation of found.data || []) {
      const tot = JSON.parse(Buffer.from(evaluation.Tot, "base64").toString());
      reports.push(this.prepareReport(evaluation));
    }*/
    return reports;
  }

  public prepareReport(params: any): object {
    return {
      pagecode: Buffer.from(params.Pagecode, "base64").toString(),
      data: {
        title: params.Title,
        score: params.Score,
        rawUrl: params.Uri,
        tot: params.Tot,
        nodes: params.Nodes,
        conform: params.Conform,
        elems: params.Elems,
        date: params.Date,
      },
    };
  }

  private async saveEvaluationMetadata(
    evaluationId: number,
    result: any,
  ): Promise<void> {
    const mongoDoc: any = await this.resultModel.create({
      evaluationId,
      pageCode: Buffer.from(result.pagecode),
      Tot: result.data.tot,
      Nodes: result.data.nodes,
      errors: result.data.elems,
      elements: result.data.elems,
      tagCount: result.data.tot.info.cTags,
    });
    const resultmongoDoc = await mongoDoc.save();
    if (!resultmongoDoc) {
      throw new NotFoundException(
        `Failed to save evaluation result for Evaluation ID ${evaluationId}`,
      );
    }
  }

  async addPagesToEvaluate(
    websitesId: number[],
    option: string,
  ): Promise<boolean> {
    const pages = await this.websiteRepository.query(
      `
      SELECT 
        p.PageId, 
        p.Uri 
      FROM 
        WebsitePage as wp, 
        Page as p
      WHERE
        wp.WebsiteId IN (?) AND
        p.PageId = wp.PageId AND
        p.Show_In LIKE ?`,
      [websitesId, option === "all" ? "1__" : "1_1"],
    );
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();

    let error = false;
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

    return !error;
  }

  async reEvaluateMyMonitorWebsite(
    userId: number,
    websiteName: string,
  ): Promise<any> {
    const website = await this.websiteRepository.findOne({
      where: { createdBy: userId, ownerRoleId: IsNull(), title: websiteName },
    });
    if (!website) {
      throw new InternalServerErrorException();
    }

    const pages = await this.websiteRepository.query(
      `SELECT 
          distinct p.*
        FROM 
          Page as p,
          Website as w,
          WebsitePage as wp
        WHERE
          w.Name = ? AND
          w.UserId = ? AND
          wp.WebsiteId = w.WebsiteId AND
          p.PageId = wp.PageId AND
          p.Show_In LIKE '_1_'`,
      [website.title, website.createdBy],
    );

    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();

    let error = false;
    try {
      for (const page of pages || []) {
        try {
          await queryRunner.manager.query(
            `INSERT INTO Evaluation_List (PageId, UserId, Url, Show_To, Creation_Date) VALUES (?, ?, ?, ?, ?)`,
            [page.PageId, userId, page.Uri, "01", new Date()],
          );
        } catch (_) {}
      }

      await queryRunner.manager.query(
        `UPDATE Evaluation_Request_Counter SET Counter = Counter + ?, Last_Request = NOW() WHERE Application = "MyMonitor"`,
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

    return !error;
  }

  async reEvaluateStudyMonitorWebsite(
    userId: number,
    tag: string,
    website: string,
  ): Promise<boolean> {
    const websiteExists = await this.websiteRepository.query(
      `SELECT * FROM Website WHERE UserId = ? AND Name = ? LIMIT 1`,
      [userId, website],
    );

    if (!websiteExists) {
      throw new InternalServerErrorException();
    }

    const pages = await this.websiteRepository.query(
      `SELECT 
            distinct p.*
          FROM 
            Page as p,
            Tag as t,
            TagWebsite as tw,
            Website as w,
            WebsitePage as wp
          WHERE
            t.Name = ? AND
            t.UserId = ? AND
            tw.TagId = t.TagId AND
            w.WebsiteId = tw.WebsiteId AND
            w.Name = ? AND
            w.UserId = ? AND
            wp.WebsiteId = w.WebsiteId AND
            p.PageId = wp.PageId`,
      [tag, userId, website, userId],
    );

    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();

    let error = false;
    try {
      for (const page of pages || []) {
        try {
          await queryRunner.manager.query(
            `INSERT INTO Evaluation_List (PageId, UserId, Url, Show_To, Creation_Date, StudyUserId) VALUES (?, ?, ?, ?, ?, ?)`,
            [page.PageId, userId, page.Uri, "00", new Date(), userId],
          );
        } catch (_) {}
      }

      await queryRunner.manager.query(
        `UPDATE Evaluation_Request_Counter SET Counter = Counter + ?, Last_Request = NOW() WHERE Application = "StudyMonitor"`,
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

    return !error;
  }
}
