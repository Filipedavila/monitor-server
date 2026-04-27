import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ListDirectories } from "./models/list-directories";
import { Directory } from "./models/directory";
import { Application } from "./models/application";
import clone from "lodash.clonedeep";
import _tests from "src/evaluation/tests";
import { AppsObservatory } from "./apps-observatory.entity";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class AppsObservatoryService {
  constructor(
    @InjectRepository(AppsObservatory)
    private readonly appsObservatoryRepository: Repository<AppsObservatory>
  ) {}

  async findAll(): Promise<AppsObservatory[]> {
    return await this.appsObservatoryRepository.find({
      select: ["Creation_Date", "Type", "AppsObservatoryId"],
    });
  }
  
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async synchronizeData(manual = true): Promise<any> {
    const data = await this.getData();

    const directories = new Array<Directory>();
    const tmpDirectories = this.createTemporaryDirectories(data);

    for (const directory of tmpDirectories || []) {
      const newDirectory = this.createDirectory(directory, clone(data));
      directories.push(newDirectory);
    }

    const listDirectories = new ListDirectories(data, directories);

    const { declarations, badges } = this.countDeclarationsAndStamps(
      listDirectories.directories
    );

    const global = {
      nDirectories: listDirectories.directories.length,
      nEntities: listDirectories.nEntities,
      recentPage: listDirectories.recentApplication,
      declarations: declarations,
      badges: badges,
      nApplications: listDirectories.nApplications,
      nApplicationsWithAccessibilityDeclaration: listDirectories.nApplicationsWithAccessibilityDeclaration,
			nApplicationsWithCompliantAccessibilityDeclaration: listDirectories.nApplicationsWithCompliantAccessibilityDeclaration,
			nApplicationsWithPartiallyCompliantAccessibilityDeclaration: listDirectories.nApplicationsWithPartiallyCompliantAccessibilityDeclaration,
			nApplicationsWithNonCompliantAccessibilityDeclaration: listDirectories.nApplicationsWithNonCompliantAccessibilityDeclaration,
			nApplicationsWithGoldUsabilityAccessibilityStamp: listDirectories.nApplicationsWithGoldUsabilityAccessibilityStamp,
			nApplicationsWithSilverUsabilityAccessibilityStamp: listDirectories.nApplicationsWithSilverUsabilityAccessibilityStamp,
			nApplicationsWithBronzeUsabilityAccessibilityStamp: listDirectories.nApplicationsWithBronzeUsabilityAccessibilityStamp,
			avgConformance: listDirectories.getAvgConformance(),
			maxConformance: listDirectories.getMaxConformance(),
			minConformance: listDirectories.getMinConformance(),
      directoriesList: this.getSortedDirectoriesList(listDirectories),
      tenCriticalAspectsList: listDirectories.getTenCriticalAspectsList(),
      successCriteriaList: listDirectories.getSuccessCriteriaList(),
      top3BestPracticesList: listDirectories.getTopThreeBestPractices(),
      top3WorstPracticesList: listDirectories.getTopThreeWorstPracticesList(),
      top5Applications: this.getTopFiveApplications(listDirectories),
      accessibilityDeclarationApplicationsList: this.getSortedDeclarationApplications(listDirectories),
      usabilityAccessibilityStampApplicationsList: this.getSortedBadgeApplications(listDirectories),
      directories: this.getDirectoriesData(directories),
    };

    await this.appsObservatoryRepository.query(
      "INSERT INTO AppsObservatory (Global_Statistics, Type, Creation_Date) VALUES (?, ?, ?)",
      [JSON.stringify(global), manual ? "manual" : "auto", new Date()]
    );
  }

  async getObservatoryData(): Promise<any> {
    const data = (
      await this.appsObservatoryRepository.query(
        "SELECT * FROM AppsObservatory ORDER BY Creation_Date DESC LIMIT 1"
      )
    )[0]?.Global_Statistics;

    return data ? JSON.parse(data) : JSON.parse("{}");
  }

  private async getData(): Promise<any> {
    const directories = await this.appsObservatoryRepository.query(
      `SELECT * FROM AppsDirectory`
    );

    const entities = await this.appsObservatoryRepository.query(
      `SELECT * FROM AppsEntity`
    );

    const applications = await this.appsObservatoryRepository.query(
      `SELECT 
        a.*,
        e.Long_Name as Entity,
        d.AppsDirectoryId as DirectoryId,
        ae.Conformance as Conformance,
        ae.Result as Evaluation
      FROM 
        Application as a
        LEFT OUTER JOIN AppsEntityApplication as ea ON ea.ApplicationId = a.ApplicationId
        LEFT OUTER JOIN AppsEntity as e ON e.AppsEntityId = ea.AppsEntityId
        LEFT OUTER JOIN AppsCategoryApplication as ca ON ca.ApplicationId = a.ApplicationId
        LEFT OUTER JOIN AppsCategory as c ON c.AppsCategoryId = ca.AppsCategoryId
        LEFT OUTER JOIN AppsDirectoryAppsCategory as dc ON dc.AppsCategoryId = c.AppsCategoryId
        LEFT OUTER JOIN AppsDirectory as d ON d.AppsDirectoryId = dc.AppsDirectoryId
        LEFT OUTER JOIN AppsEvaluation as ae ON ae.AppId = a.ApplicationId
      WHERE
        ae.AppsEvaluationId = (
          SELECT AppsEvaluationId FROM AppsEvaluation WHERE AppId = a.ApplicationId ORDER BY Date DESC LIMIT 1
        )`,
    );


    const data = {
      directories: directories,
      entities: entities,
      applications: applications
    };

    return data;
  }

  private createTemporaryDirectories(data: any): Array<any> {
    const tmpDirectoriesIds = new Array<number>();
    const tmpDirectories = new Array<any>();
    data.directories.map((directory: any) => {
      if (!tmpDirectoriesIds.includes(directory.AppsDirectoryId)) {
        tmpDirectoriesIds.push(directory.AppsDirectoryId);
        tmpDirectories.push({
          id: directory.AppsDirectoryId,
          name: directory.Name,
          creation_date: directory.Creation_Date,
        });
      }
    });

    return tmpDirectories;
  }

  private createDirectory(directory: any, data: any): Directory {
    const newDirectory = new Directory(
      directory.id,
      directory.name,
      directory.creation_date
    );
    const tmpApplicationsIds = new Array<number>();
    const applications = new Array<any>();
    for (const ap of data.applications || []) {
      if (
        ap.DirectoryId === directory.id &&
        !tmpApplicationsIds.includes(ap.ApplicationId)
      ) {
        tmpApplicationsIds.push(ap.ApplicationId);
        applications.push({
          id: ap.ApplicationId,
          directoryId: directory.id,
          entity: ap.Entity,
          name: ap.Name,
          declaration: ap.Declaration,
          declarationDate: ap.DeclarationUpdateDate ? new Date(ap.DeclarationUpdateDate) : null,
          stamp: ap.Stamp,
          stampDate: ap.StampUpdateDate ? new Date(ap.StampUpdateDate) : null,
          downloadUrl: ap.DownloadUrl,
          creation_date: ap.CreationDate ? new Date(ap.CreationDate) : null,
          operatingSystem: ap.OperatingSystem,
          conformance: ap.Conformance,
          evaluation: ap.Evaluation
        });
      }
    }

    for (const application of applications || []) {
      const newApplication = this.createApplication(application);
      newDirectory.addApplication(newApplication);
    }

    return newDirectory;
  }

  private createApplication(application: any): Application {
    const newApplication = new Application(
      application.id,
      application.directoryId,
      application.entity,
      application.name,
      application.declaration,
      application.declarationDate,
      application.stamp,
      application.stampDate,
      application.downloadUrl,
      application.creation_date,
      application.operatingSystem,
      application.conformance,
      application.evaluation
    );

    return newApplication;
  }

  private countDeclarationsAndStamps(directories: Directory[]): any {
    const applicationsDeclarationsInList = new Array<number>();
    const applicationsStampsInList = new Array<number>();

    const declarations = {
      total: {
        websites: {
          conform: 0,
          partial: 0,
          not_conform: 0
        },
        apps: {
          conform: 0,
          partial: 0,
          not_conform: 0
        }
      },
      currentYear: {
        websites: {
          conform: 0,
          partial: 0,
          not_conform: 0
        },
        apps: {
          conform: 0,
          partial: 0,
          not_conform: 0
        }
      }
    };
    const badges = {
      total: {
        websites: {
          conform: 0,
          partial: 0,
          not_conform: 0
        },
        apps: {
          gold: 0,
          silver: 0,
          bronze: 0
        }
      },
      currentYear: {
        websites: {
          conform: 0,
          partial: 0,
          not_conform: 0
        },
        apps: {
          gold: 0,
          silver: 0,
          bronze: 0
        }
      }
    };

    const currentYear = new Date().getFullYear();

    for (const directory of directories) {
      for (const application of directory.applications) {
        if (
          !applicationsDeclarationsInList.includes(application.id) &&
          application.declaration &&
          application.declarationDate
        ) {
          switch (application.declaration) {
            case 1:
              declarations.total.apps.not_conform++;
              break;
            case 2:
              declarations.total.apps.partial++;
              break;
            case 3:
              declarations.total.apps.conform++;
              break;
          }

          if (application.declarationDate.getFullYear() === currentYear) {
            switch (application.declaration) {
              case 1:
                declarations.currentYear.apps.not_conform++;
                break;
              case 2:
                declarations.currentYear.apps.partial++;
                break;
              case 3:
                declarations.currentYear.apps.conform++;
                break;
            }
          }
          applicationsDeclarationsInList.push(application.id);
        }
        if (
          !applicationsStampsInList.includes(application.id) &&
          application.stamp &&
          application.stampDate
        ) {
          switch (application.stamp) {
            case 1:
              badges.total.apps.bronze++;
              break;
            case 2:
              badges.total.apps.silver++;
              break;
            case 3:
              badges.total.apps.gold++;
              break;
          }

          if (application.stampDate.getFullYear() === currentYear) {
            switch (application.stamp) {
              case 1:
                badges.currentYear.apps.bronze++;
                break;
              case 2:
                badges.currentYear.apps.silver++;
                break;
              case 3:
                badges.currentYear.apps.gold++;
                break;
            }
          }
          applicationsStampsInList.push(application.id);
        }
      }
    }

    return { declarations: clone(declarations), badges: clone(badges) };
  }
  
  private getSortedDeclarationApplications(listDirectories: ListDirectories) {
    const applications = listDirectories
      .getApplications()
      .filter(
        (value, index, array) =>
          array.findIndex((element) => element.name === value.name) === index &&
          value.declaration && value.declarationDate
      )
      .sort(
        (a: Application, b: Application) => b.declaration - a.declaration
      );

    const sortedApplications = new Array<any>();

    let i = 1;
    for (const application of applications) {
      sortedApplications.push({
        directoryId: application.DirectoryId,
        id: application.id,
        line: i,
        name: application.name,
        declaration: application.declaration,
      });
      i++;
    }

    return sortedApplications;
  }
  
  private getSortedBadgeApplications(listDirectories: ListDirectories) {
    const applications = listDirectories
      .getApplications()
      .filter(
        (value, index, array) =>
          array.findIndex((element) => element.name === value.name) === index &&
          value.stamp && value.stampDate
      )
      .sort(
        (a: Application, b: Application) => b.stamp - a.stamp
      );

    const sortedApplications = new Array<any>();

    let i = 1;
    for (const application of applications) {
      sortedApplications.push({
        directoryId: application.DirectoryId,
        id: application.id,
        line: i,
        name: application.name,
        stamp: application.stamp,
      });
      i++;
    }

    return sortedApplications;
  }
  
  private getTopFiveApplications(listDirectories: ListDirectories): any {
    const applications = listDirectories
      .getApplications()
      .filter(
        (value, index, array) =>
          array.findIndex((element) => element.name === value.name) === index
      )
      .sort(
        (a: Application, b: Application) => b.getConformance() - a.getConformance()
      )
      .slice(0, 5);

    const topFiveApplications = new Array<any>();

    let i = 1;
    for (const application of applications) {
      topFiveApplications.push({
        directoryId: application.DirectoryId,
        id: application.id,
        rank: i,
        name: application.name,
        conformance: application.getConformance(),
      });
      i++;
    }

    return topFiveApplications;
  }

  private getSortedDirectoriesList(listDirectories: ListDirectories): any {
    let rank = 1;
    const directories = listDirectories.directories
      .slice()
      .sort(
        (a: Directory, b: Directory) => b.getAvgConformance() - a.getAvgConformance()
      )
      .map((d: Directory) => {
        d.rank = rank;
        rank++;
        return d;
      });

    const sortedDirectories = new Array<any>();

    for (const directory of directories) {
      sortedDirectories.push({
        id: directory.id,
        rank: directory.rank,
        name: directory.name,
        declarations: directory.declarations,
        stamps: directory.stamps,
        conformance: directory.getAvgConformance()
      });
    }

    return sortedDirectories;
  }

  private getDirectoriesData(directories: Directory[]): any {
    const data = {};

    for (const directory of directories) {
      data[`${directory.id}`] = {
        id: directory.id,
        name: directory.name,
        applicationsList: this.getSortedApplications(directory.applications),
        nApplications: directory.nApplications,
        nApplicationsWithAccessibilityDeclaration: directory.declarations,
        nApplicationsWithCompliantAccessibilityDeclaration: directory.nApplicationsWithCompliantAccessibilityDeclaration,
        nApplicationsWithPartiallyCompliantAccessibilityDeclaration: directory.nApplicationsWithPartiallyCompliantAccessibilityDeclaration,
        nApplicationsWithNonCompliantAccessibilityDeclaration: directory.nApplicationsWithNonCompliantAccessibilityDeclaration,
        nApplicationsWithGoldUsabilityAccessibilityStamp: directory.nApplicationsWithGoldUsabilityAccessibilityStamp,
        nApplicationsWithSilverUsabilityAccessibilityStamp: directory.nApplicationsWithSilverUsabilityAccessibilityStamp,
        nApplicationsWithBronzeUsabilityAccessibilityStamp: directory.nApplicationsWithBronzeUsabilityAccessibilityStamp,
        avgConformance: directory.getAvgConformance(),
        maxConformance: directory.getMaxConformance(),
        minConformance: directory.getMinConformance(),
        tenCriticalAspectsList: directory.getTenCriticalAspectsList(),
        successCriteriaList: directory.getSuccessCriteriaList(),
        top3BestPracticesList: directory.getTopThreeBestPractices(),
        top3WorstPracticesList: directory.getTopThreeWorstPracticesList(),
        top5Applications: this.getTopFiveDirectoryApplications(directory.applications),
        accessibilityDeclarationApplicationsList: this.getSortedDeclarationDirectoryApplications(directory.applications),
        usabilityAccessibilityStampApplicationsList: this.getSortedBadgeDirectoryApplications(directory.applications),
        applications: this.getApplicationsData(directory.applications)
      };
    }

    return data;
  }

  private getSortedApplications(applications: Application[]): any {
    let rank = 1;
    const sortedApps = applications
      .slice()
      .sort(
        (a: Application, b: Application) => b.conformance - a.conformance
      )
      .map((a: Application) => {
        a.rank = rank;
        rank++;
        return a;
      });

    const sortedApplications = new Array<any>();

    for (const app of sortedApps) {
      sortedApplications.push({
        id: app.id,
        rank: app.rank,
        name: app.name,
        entity: app.entity,
        declaration: app.declaration,
        stamp: app.stamp,
        conformance: app.conformance
      });
    }

    return sortedApplications;
  }

  private getTopFiveDirectoryApplications(applications: Application[]): any {
    const topApps = applications
      .filter(
        (value, index, array) =>
          array.findIndex((element) => element.name === value.name) === index
      )
      .sort(
        (a: Application, b: Application) => b.getConformance() - a.getConformance()
      )
      .slice(0, 5);

    const topFiveApplications = new Array<any>();

    let i = 1;
    for (const application of topApps) {
      topFiveApplications.push({
        id: application.id,
        rank: i,
        name: application.name,
        conformance: application.getConformance(),
      });
      i++;
    }

    return topFiveApplications;
  }

  private getSortedDeclarationDirectoryApplications(applications: Application[]): any {
    const sortedApps = applications
      .filter(
        (value, index, array) =>
          array.findIndex((element) => element.name === value.name) === index &&
          value.declaration && value.declarationDate
      )
      .sort(
        (a: Application, b: Application) => b.declaration - a.declaration
      );

    const sortedApplications = new Array<any>();

    let i = 1;
    for (const application of sortedApps) {
      sortedApplications.push({
        id: application.id,
        line: i,
        name: application.name,
        declaration: application.declaration,
      });
      i++;
    }

    return sortedApplications;
  }

  private getSortedBadgeDirectoryApplications(applications: Application[]): any {
    const sortedApps = applications
      .filter(
        (value, index, array) =>
          array.findIndex((element) => element.name === value.name) === index &&
          value.stamp && value.stampDate
      )
      .sort(
        (a: Application, b: Application) => b.stamp - a.stamp
      );

    const sortedApplications = new Array<any>();

    let i = 1;
    for (const application of sortedApps) {
      sortedApplications.push({
        id: application.id,
        line: i,
        name: application.name,
        stamp: application.stamp,
      });
      i++;
    }

    return sortedApplications;
  }

  private getApplicationsData(applications: Application[]): any {
    const data = {};

    for (const application of applications) {
      data[`${application.id}`] = {
        id: application.id,
        name: application.name,
        downloadUrl: application.downloadUrl,
        latestRevision: application.recentApplication,
        ownerEntity: application.entity,
        operatingSystem: application.operatingSystem,
        accessibilityDeclaration: application.getAccessibilityDeclaration(),
        usabilityAccessibilityStamp: application.getUsabilityAccessibilityStamp(),
        conformance: application.conformance,
        tenCriticalAspectsList: application.tenCriticalAspectsList,
        successCriteriaList: application.successCriteriaList,
        top3BestPracticesList: application.getTopThreeBestPractices(),
        top3WorstPracticesList: application.getTopThreeWorstPracticesList()
      };
    }
    
    return data;
  }
}
