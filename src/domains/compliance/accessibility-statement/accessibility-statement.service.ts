import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { CreateAccessibilityStatementDto } from "./dto/create-accessibility-statement.dto";
import { AccessibilityStatement } from "./entities/accessibility-statement.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { PageParser } from "./page-parser";
import { AutomaticStatementService } from "../possibly-trash/automatic-statement/automatic-statement.service";
import { ManualStatementService } from "../possibly-trash/manual-statement/manual-statement.service";
import { UserEvaluationService } from "../possibly-trash/user-evaluation/user-evaluation.service";
import { CreateAutomaticEvaluationDto } from "../possibly-trash/automatic-statement/dto/create-automatic-evaluation.dto";
import { CreateManualEvaluationDto } from "../possibly-trash/manual-statement/dto/create-manual-evaluation.dto";
import { CreateUserEvaluationDto } from "../possibly-trash/user-evaluation/dto/create-user-evaluation.dto";
import { State } from "./state";
import { Website } from "src/domains/inventory/website/website.entity";
import { CreateContactDto } from "../contact/dto/create-contact.dto";
import { ContactService } from "../contact/contact.service";
import { AccessibilityStatementDto } from "./dto/accessibility-statement.dto";
import {
  BRONZE,
  NAO_CONFORME,
  OURO,
  PARCIALMENTE_CONFORME,
  PLENAMENTE_CONFORME,
  PRATA,
} from "./contants";
var hash = require("object-hash");

@Injectable()
export class AccessibilityStatementService {
  constructor(
    @InjectRepository(AccessibilityStatement)
    private readonly accessibilityStatementRepository: Repository<AccessibilityStatement>,
    private automaticEvaluationService: AutomaticStatementService,
    private manualEvaluationService: ManualStatementService,
    private userEvaluationService: UserEvaluationService,
    private contactService: ContactService,
  ) {}

  async createIfExist(html: string, website: Website, url: string) {
    const currentAS = await this.findLatestByWebsiteID(website.id);
    const aStatementParsed = await this.parseAStatement(html, website, url);
    let aStatement;
    if (currentAS && aStatementParsed) {
      const currentHash = currentAS.hash;
      const currentDate = currentAS.statementDate;
      const newhash = hash(aStatementParsed);
      const dateDiferent =
        currentDate.toISOString() !==
        aStatementParsed.statementDate.toISOString();

      if (!dateDiferent && currentHash !== newhash) {
        this.deleteById(currentAS.id);
        aStatement = this.createAStatement(aStatementParsed, website);
      } else if (dateDiferent) {
        aStatement = this.createAStatement(aStatementParsed, website);
      }
    } else if (aStatementParsed)
      aStatement = this.createAStatement(aStatementParsed, website);

    return aStatement;
  }
  async parseAStatement(
    html: string,
    website: Website,
    url: string,
  ): Promise<AccessibilityStatementDto> {
    const pageParser = new PageParser(html);
    if (
      !pageParser.verifyAccessiblityStatement() /*&& !pageParser.verifyAccessiblityPossibleStatement(url)*/
    )
      throw new Error("No accessibility statement found");

    const aStatementDto = pageParser.getAccessiblityStatementData(url);
    const autoList = pageParser.getAutomaticEvaluationData();
    const userList = pageParser.getUserEvaluationData();
    const manualList = pageParser.getManualEvaluationData();
    const contacts = pageParser.getContacts();
    return {
      ...aStatementDto,
      autoList,
      userList,
      manualList,
      contacts,
    } as AccessibilityStatementDto;
  }

  async createAStatement(
    aStatementParser: AccessibilityStatementDto,
    website: Website,
  ) {
    throw new Error("Method not implemented.");
    /*
    const { autoList, userList, manualList, contacts, ...aStatementDto } =
      aStatementParser;
    const hashResult = hash(aStatementParser);
    const state = this.calculateFlag(aStatementParser);
    let aStatement = await this.createDB({ ...aStatementDto, state }, website);
    aStatement = await this.createLists(
      aStatement,
      autoList,
      manualList,
      userList,
    );
    aStatement = await this.createContacts(aStatement, contacts);
    this.updateHash(hashResult, aStatement.id);
    return aStatement;*/
  }

  async createLists(
    aStatement: AccessibilityStatement,
    createAutomaticEvaluationList: CreateAutomaticEvaluationDto[],
    createManualEvaluationDto: CreateManualEvaluationDto[],
    createUserEvaluationDto: CreateUserEvaluationDto[],
  ) {
    throw new Error("Method not implemented.");
    /*
    aStatement.automaticEvaluations = await Promise.all(
      createAutomaticEvaluationList.map(async (evalu) => {
        return await this.automaticEvaluationService.create(evalu, aStatement);
      }),
    );
    aStatement.manualEvaluations = await Promise.all(
      createManualEvaluationDto.map(async (evalu) => {
        return await this.manualEvaluationService.create(evalu, aStatement);
      }),
    );
    aStatement.userEvaluations = await Promise.all(
      createUserEvaluationDto.map(async (evalu) => {
        return await this.userEvaluationService.create(evalu, aStatement);
      }),
    );

    return aStatement;*/
  }

  async createContacts(
    aStatement: AccessibilityStatement,
    createContactList: CreateContactDto[],
  ) {
    await Promise.all(
      createContactList.map(async (contact) => {
        return this.contactService.create(contact, aStatement);
      }),
    );
    return aStatement;
  }
  async updateHash(hash: string, id: number) {
    const aStatement = await this.accessibilityStatementRepository.findOne({
      where: { id },
    });
    if (!aStatement) throw new Error("Accessibility Statement not found");
    aStatement.hash = hash;
    return this.accessibilityStatementRepository.save(aStatement);
  }

  createDB(
    createAccessibilityStatementDto: CreateAccessibilityStatementDto,
    website: Website,
  ) {
    const aStatement = this.accessibilityStatementRepository.create({
      ...createAccessibilityStatementDto,
      website,
    });
    console.log({ aStatement, createAccessibilityStatementDto });
    return this.accessibilityStatementRepository.save(aStatement);
  }

  calculateFlag(acessibilityStatementDto: AccessibilityStatementDto) {
    const conformance = acessibilityStatementDto.conformance;
    const date = acessibilityStatementDto.statementDate;
    const hasAutoEval = acessibilityStatementDto.autoList.length > 0;
    const hasManualEval = acessibilityStatementDto.manualList.length > 0;
    let result;
    if (conformance && date && hasAutoEval && hasManualEval) {
      result = State.completeStatement;
    } else if (!conformance && !date && !hasAutoEval && !hasManualEval) {
      result = State.possibleStatement;
    } else {
      result = State.incompleteStatement;
    }
    return result;
  }

  findLatestByWebsiteID(websiteId: number) {
    return this.accessibilityStatementRepository.findOne({
      where: { website: { id: websiteId } },
      relations: [
        "manualEvaluations",
        "automaticEvaluations",
        "userEvaluations",
        "website",
      ],
      order: { statementDate: "ASC" },
    });
  }

  findByWebsiteName(title: string) {
    return this.accessibilityStatementRepository.findOne({
      where: { website: { title } },
      relations: [
        "manualEvaluationList",
        "automaticEvaluationList",
        "userEvaluationList",
        "website",
      ],
    });
  }

  findById(id: number): any {
    return this.accessibilityStatementRepository.findOne({
      where: { id },
      relations: [
        "manualEvaluationList",
        "automaticEvaluationList",
        "userEvaluationList",
        "website",
      ],
    });
  }
  deleteById(id: number) {
    return this.accessibilityStatementRepository.delete({ id });
  }

  async getASList() {
    const list = await this.accessibilityStatementRepository.find({
      relations: [
        "manualEvaluationList",
        "automaticEvaluationList",
        "userEvaluationList",
        "website",
      ],
    });
    const convertList = list.map((elem: any) => {
      elem.website = elem.website.title;
      elem.manualEvaluationList = elem.manualEvaluationList.length;
      elem.automaticEvaluationList = elem.automaticEvaluationList.length;
      elem.userEvaluationList = elem.userEvaluationList.length;
      return elem;
    });
    return convertList;
  }

  async getByAge() {
    const list = await this.accessibilityStatementRepository.find();
    const result = {};
    list.map((elem) => {
      if (elem.statementDate) {
        const date = elem.statementDate;
        const year = date.getFullYear();
        console.log({ date, year });
        result[year] = result[year] ? ++result[year] : 1;
      }
    });
    return this.convertToAngularTable("year", result);
  }

  private convertToAngularTable(atributeName: string, result) {
    const keys = Object.keys(result);
    const list: any = [];
    for (let key of keys) {
      list.push({ [atributeName]: key, declarationNumber: result[key] });
    }
    return list;
  }

  async getByState() {
    const result = await this.accessibilityStatementRepository.query(
      `SELECT 
          sum(
            case when ast.state = ? then 1 else 0 end
          ) as completeStatement, 
          sum(
            case when ast.state = ? then 1 else 0 end
          ) as incompleteStatement, 
          sum(
            case when ast.state = ? then 1 else 0 end
          ) as possibleStatement 
        FROM 
          Accessibility_Statement as ast`,
      [
        State.completeStatement,
        State.incompleteStatement,
        State.possibleStatement,
      ],
    );
    return this.convertToAngularTable("state", result[0]);
  }

  async getByConformance() {
    const result = await this.accessibilityStatementRepository.query(
      `SELECT 
          sum(
            case when ast.conformance = ? then 1 else 0 end
          ) as plenamenteConforme, 
          sum(
            case when ast.conformance = ? then 1 else 0 end
          ) as parcialmenteConforme, 
          sum(
            case when ast.conformance = ? then 1 else 0 end
          ) as naoConforme 
        FROM 
          Accessibility_Statement as ast`,
      [PLENAMENTE_CONFORME, PARCIALMENTE_CONFORME, NAO_CONFORME],
    );

    //conversion to Angular table form
    return this.convertToAngularTable("conformance", result[0]);
  }

  async getBySeal() {
    const result = await this.accessibilityStatementRepository.query(
      `SELECT 
          sum(
            case when ast.seal = ? then 1 else 0 end
          ) as bronze, 
          sum(
            case when ast.seal = ? then 1 else 0 end
          ) as prata, 
          sum(
            case when ast.seal = ? then 1 else 0 end
          ) as ouro 
        FROM 
          Accessibility_Statement as ast`,
      [BRONZE, PRATA, OURO],
    );

    return this.convertToAngularTable("seal", result[0]);
  }

  async getByDirectoryState() {
    return this.accessibilityStatementRepository.query(
      `SELECT 
          d.Name as name, 
          sum(
            case when ast.state = ? then 1 else 0 end
          ) as completeStatement, 
          sum(
            case when ast.state = ? then 1 else 0 end
          ) as incompleteStatement, 
          sum(
            case when ast.state = ? then 1 else 0 end
          ) as possibleStatement 
        FROM 
          Accessibility_Statement as ast 
          JOIN TagWebsite as tw ON tw.WebsiteId = ast.WebsiteId 
          JOIN DirectoryTag as dt on dt.TagId = tw.TagId 
          JOIN Directory as d on d.DirectoryId = dt.DirectoryId 
        GROUP BY 
          d.Name`,
      [
        State.completeStatement,
        State.incompleteStatement,
        State.possibleStatement,
      ],
    );
  }

  async getByDirectorySeal() {
    return this.accessibilityStatementRepository.query(
      `SELECT 
          d.Name as name, 
          sum(
            case when ast.seal = ? then 1 else 0 end
          ) as bronze, 
          sum(
            case when ast.seal = ? then 1 else 0 end
          ) as prata, 
          sum(
            case when ast.seal = ? then 1 else 0 end
          ) as ouro 
        FROM 
          Accessibility_Statement as ast 
          JOIN TagWebsite as tw ON tw.WebsiteId = ast.WebsiteId 
          JOIN DirectoryTag as dt on dt.TagId = tw.TagId 
          JOIN Directory as d on d.DirectoryId = dt.DirectoryId 
        GROUP BY 
          d.Name`,
      [OURO, PRATA, BRONZE],
    );
  }

  async getByDirectoryConformity() {
    return this.accessibilityStatementRepository.query(
      `SELECT 
          d.Name as name, 
           sum(
            case when ast.conformance = ? then 1 else 0 end
          ) as plenamenteConforme, 
          sum(
            case when ast.conformance = ? then 1 else 0 end
          ) as parcialmenteConforme, 
          sum(
            case when ast.conformance = ? then 1 else 0 end
          ) as naoConforme 
        FROM 
          Accessibility_Statement as ast 
          JOIN TagWebsite as tw ON tw.WebsiteId = ast.WebsiteId 
          JOIN DirectoryTag as dt on dt.TagId = tw.TagId 
          JOIN Directory as d on d.DirectoryId = dt.DirectoryId 
        GROUP BY 
          d.Name`,
      [PLENAMENTE_CONFORME, PARCIALMENTE_CONFORME, NAO_CONFORME],
    );
  }
  private async getByDirectoryWebsiteLength() {
    return this.accessibilityStatementRepository.query(`
      SELECT 
        d.Name as name, 
        count(ast.WebsiteId) as total 
      FROM 
        Website as ast 
        JOIN TagWebsite as tw ON tw.WebsiteId = ast.WebsiteId 
        JOIN DirectoryTag as dt on dt.TagId = tw.TagId 
        JOIN Directory as d on d.DirectoryId = dt.DirectoryId 
      GROUP BY 
        d.Name
      ORDER BY
        d.Name`);
  }

  private async getByDirectoryA11yLength() {
    return this.accessibilityStatementRepository.query(
      `SELECT 
          d.Name as name, 
          count(ast.Id) as a11yStatements
        FROM 
          Accessibility_Statement as ast 
          JOIN TagWebsite as tw ON tw.WebsiteId = ast.WebsiteId 
          JOIN DirectoryTag as dt on dt.TagId = tw.TagId 
          JOIN Directory as d on d.DirectoryId = dt.DirectoryId 
        GROUP BY 
          d.Name
        ORDER BY
          d.Name`,
    );
  }

  async getOPAWTable() {
    const directoryA11y = await this.getByDirectoryA11yLength();
    const directoryLenght = await this.getByDirectoryWebsiteLength();
    for (let i = 0; i < directoryA11y.length; i++) {
      directoryA11y[i]["total"] = directoryLenght[i].total;
    }
    return directoryA11y;
  }

  async getNumberOfEvaluationByType() {
    return [
      {
        type: "user",
        numberOfEvaluations: await this.userEvaluationService.getLength(),
      },
      {
        type: "manual",
        numberOfEvaluations: await this.manualEvaluationService.getLength(),
      },
      {
        type: "automatic",
        numberOfEvaluations: await this.automaticEvaluationService.getLength(),
      },
    ];
  }
}
