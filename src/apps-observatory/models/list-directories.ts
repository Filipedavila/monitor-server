import { Directory } from "./directory";
import { Application } from "./application";

export class ListDirectories {
  directories: Array<Directory>;
  nEntities: number;
  nApplications: number;
  nApplicationsWithAccessibilityDeclaration: number;
  nApplicationsWithCompliantAccessibilityDeclaration: number;
  nApplicationsWithNonCompliantAccessibilityDeclaration: number;
  nApplicationsWithPartiallyCompliantAccessibilityDeclaration: number;
  nApplicationsWithGoldUsabilityAccessibilityStamp: number;
  nApplicationsWithSilverUsabilityAccessibilityStamp: number;
  nApplicationsWithBronzeUsabilityAccessibilityStamp: number;
  avgConformance: number;
  recentApplication: Date;

  constructor(result: any, directories: Array<Directory>) {
    this.directories = directories;

    this.nApplicationsWithAccessibilityDeclaration = 0;
    this.nApplicationsWithCompliantAccessibilityDeclaration = 0;
    this.nApplicationsWithNonCompliantAccessibilityDeclaration = 0;
    this.nApplicationsWithPartiallyCompliantAccessibilityDeclaration = 0;
    this.nApplicationsWithGoldUsabilityAccessibilityStamp = 0;
    this.nApplicationsWithSilverUsabilityAccessibilityStamp = 0;
    this.nApplicationsWithBronzeUsabilityAccessibilityStamp = 0;

    this.nEntities = result.entities
      .map((r) => r.Name)
      .filter((v, i, self) => self.indexOf(v) === i).length;

    this.nApplications = result.applications
      .map((r) => r.Name)
      .filter((v, i, self) => self.indexOf(v) === i).length;

    let avgConformance = 0;
    const size = directories.length;

    for (const directory of directories || []) {
      avgConformance += directory.getAvgConformance();

      if (!this.recentApplication) {
        this.recentApplication = directory.recentApplication;
      }

      if (directory.recentApplication > this.recentApplication) {
        this.recentApplication = directory.recentApplication;
      }

      this.nApplicationsWithAccessibilityDeclaration += directory.declarations;
      this.nApplicationsWithCompliantAccessibilityDeclaration += directory.nApplicationsWithCompliantAccessibilityDeclaration;
      this.nApplicationsWithNonCompliantAccessibilityDeclaration += directory.nApplicationsWithNonCompliantAccessibilityDeclaration;
      this.nApplicationsWithPartiallyCompliantAccessibilityDeclaration += directory.nApplicationsWithPartiallyCompliantAccessibilityDeclaration;
      this.nApplicationsWithGoldUsabilityAccessibilityStamp += directory.nApplicationsWithGoldUsabilityAccessibilityStamp;
      this.nApplicationsWithSilverUsabilityAccessibilityStamp += directory.nApplicationsWithSilverUsabilityAccessibilityStamp;
      this.nApplicationsWithBronzeUsabilityAccessibilityStamp += directory.nApplicationsWithBronzeUsabilityAccessibilityStamp;
    }

    this.avgConformance = avgConformance / size;
  }

  getAvgConformance(): number {
    return this.avgConformance;
  }

  getMaxConformance(): number {
    return this.directories
      .map((directory) => directory.getMaxConformance())
      .reduce((cur, max) => cur > max ? cur : max);
  }

  getMinConformance(): number {
    return this.directories
      .map((directory) => directory.getMinConformance())
      .reduce((cur, min) => cur > min ? min : cur);
  }

  getApplications(): Array<Application> {
    const applications = new Array<Application>();
    const alreadyInList = new Array<number>();
    this.directories.map((dir: Directory) => {
      dir.applications.map((a: Application) => {
        if (!alreadyInList.includes(a.id)) {
          alreadyInList.push(a.id);
          applications.push(a);
        }
      });
    });

    return applications;
  }

  getApplicationsWithAccessibilityDeclaration(): any {
    const declApps = this.getApplications()
      .filter(
        (value, index, array) =>
          array.findIndex((element) => element.name === value.name) === index &&
          value.declaration && value.declarationDate
      )
      .sort(
        (a: Application, b: Application) => b.declaration - a.declaration
      );

    const declarationApplications = new Array<any>();

    let i = 1;
    for (const app of declApps) {
      declarationApplications.push({
        directoryId: app.DirectoryId,
        id: app.id,
        line: i,
        name: app.name,
        declaration: app.declaration
      });
      i++;
    }

    return declarationApplications;
  }

  getApplicationsWithUsabilityAndAccessibilityStamp(): any {
    const stampApps = this.getApplications()
      .filter(
        (value, index, array) =>
          array.findIndex((element) => element.name === value.name) === index &&
          value.stamp && value.stampDate
      )
      .sort(
        (a: Application, b: Application) => b.stamp - a.stamp
      );

    const stampedApplications = new Array<any>();

    let i = 1;
    for (const app of stampApps) {
      stampedApplications.push({
        directoryId: app.DirectoryId,
        id: app.id,
        line: i,
        name: app.name,
        stamp: app.stamp
      });
      i++;
    }

    return stampedApplications;
  }

  getTopFiveApplications(): any {
    const sortedApps = this.getApplications()
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
    for (const application of sortedApps) {
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

  getSuccessCriteriaList() {
    return new Array<any>();
  }

  getTenCriticalAspectsList() {
    const list = new Array<any>();
    let compliant = {
      1: {
        1: 0,
        2: 0,
        3: 0
      },
      2: {
        1: 0,
        2: 0
      }
    };
    let nonCompliant = {
      1: {
        1: 0,
        2: 0,
        3: 0
      },
      2: {
        1: 0,
        2: 0
      }
    };
    let nonApplicable = {
      1: {
        1: 0,
        2: 0,
        3: 0
      },
      2: {
        1: 0,
        2: 0
      }
    };

    const apps = this.getApplications();

    for (const app of apps) {
      for (const j of [1, 2, 3]) {
        switch(app.getConformityToTest(1, j)) {
          case 1:
            compliant[1][j]++;
            break;
          case 2:
            nonApplicable[1][j]++;
            break;
          default:
            nonCompliant[1][j]++;
            break;
        }
      }

      for (const k of [1, 2]) {
        switch(app.getConformityToTest(2, k)) {
          case 1:
            compliant[2][k]++;
            break;
          case 2:
            nonApplicable[2][k]++;
            break;
          default:
            nonCompliant[2][k]++;
            break;
        }
      }
    }

    for (const j of [1, 2, 3]) {
      list.push({
        name: `1.${j}`,
        compliantTotal: compliant[1][j],
        compliantPercentage: `${(compliant[1][j] / this.nApplications) * 100}%`,
        nonCompliantTotal: nonCompliant[1][j],
        nonCompliantPercentage: `${(nonCompliant[1][j] / this.nApplications) * 100}%`,
        nonApplicableTotal: nonApplicable[1][j],
        nonApplicablePercentage: `${(nonApplicable[1][j] / this.nApplications) * 100}%`
      });
    }

    for (const k of [1, 2]) {
      list.push({
        name: `2.${k}`,
        compliantTotal: compliant[2][k],
        compliantPercentage: `${(compliant[2][k] / this.nApplications) * 100}%`,
        nonCompliantTotal: nonCompliant[2][k],
        nonCompliantPercentage: `${(nonCompliant[2][k] / this.nApplications) * 100}%`,
        nonApplicableTotal: nonApplicable[2][k],
        nonApplicablePercentage: `${(nonApplicable[2][k] / this.nApplications) * 100}%`
      });
    }

    const tenCriticalAspectsList = new Array<any>();
    let i = 1;

    list.sort((a, b) => {
      if (a.compliantTotal === b.compliantTotal) {
        return b.nonApplicableTotal - a.nonApplicableTotal;
      } else {
        return b.compliantTotal - a.compliantTotal;
      }
    }).map((value) => {
      tenCriticalAspectsList.push({
        rank: i,
        name: value.name,
        compliantTotal: value.compliantTotal,
        compliantPercentage: value.compliantPercentage,
        nonCompliantTotal: value.nonCompliantTotal,
        nonCompliantPercentage: value.nonCompliantPercentage,
        nonApplicableTotal: value.nonApplicableTotal,
        nonApplicablePercentage: value.nonApplicablePercentage
      });
      i++;
    });

    return tenCriticalAspectsList;
  }

  getTopThreeBestPractices(): any {
    const data = new Array<any>();

    const compliances = {
      1: {
        1: 0,
        2: 0,
        3: 0
      },
      2: {
        1: 0,
        2: 0
      }
    };

    for (const app of this.getApplications()) {
      for (const j of [1, 2, 3]) {
        if (app.getConformityToTest(1, j) === 1) {
          compliances[1][j]++;
        }
      }

      for (const k of [1, 2]) {
        if (app.getConformityToTest(2, k) === 1) {
          compliances[2][k]++;
        }
      }
    }

    for (const test in compliances) {
      for (const subtest in compliances[test]) {
        data.push({
          name: `${test}.${subtest}`,
          nEvidences: compliances[test][subtest]
        });
      }
    }

    return data.sort(
      (a, b) => b.nEvidences - a.nEvidences
    ).slice(0, 3).map(
      ((value, index) => {
        return {
          rank: index + 1,
          name: value.name,
          nEvidences: value.nEvidences
        }
      })
    );
  }

  getTopThreeWorstPracticesList(): any {
    const data = new Array<any>();

    const nonCompliances = {
      1: {
        1: 0,
        2: 0,
        3: 0
      },
      2: {
        1: 0,
        2: 0
      }
    };

    for (const app of this.getApplications()) {
      for (const j of [1, 2, 3]) {
        if (app.getConformityToTest(1, j) === 3) {
          nonCompliances[1][j]++;
        }
      }

      for (const k of [1, 2]) {
        if (app.getConformityToTest(2, k) === 3) {
          nonCompliances[2][k]++;
        }
      }
    }

    for (const test in nonCompliances) {
      for (const subtest in nonCompliances[test]) {
        data.push({
          name: `${test}.${subtest}`,
          nEvidences: nonCompliances[test][subtest]
        });
      }
    }

    return data.sort(
      (a, b) => b.nEvidences - a.nEvidences
    ).slice(0, 3).map(
      ((value, index) => {
        return {
          rank: index + 1,
          name: value.name,
          nEvidences: value.nEvidences
        }
      })
    );
  }
}
