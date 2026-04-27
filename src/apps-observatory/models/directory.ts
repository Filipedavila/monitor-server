import { Application } from "./application";

export class Directory {
  id: number;
  rank: number;
  name: string;
  creationDate: Date;
  applications: Array<Application>;
  entities: Array<string>;
  declarations: number;
  stamps: number;
  conformance: number;
  recentApplication: Date;
  nApplications: number;
  nApplicationsWithCompliantAccessibilityDeclaration: number;
  nApplicationsWithPartiallyCompliantAccessibilityDeclaration: number;
  nApplicationsWithNonCompliantAccessibilityDeclaration: number;
  nApplicationsWithGoldUsabilityAccessibilityStamp: number;
  nApplicationsWithSilverUsabilityAccessibilityStamp: number;
  nApplicationsWithBronzeUsabilityAccessibilityStamp: number;

  constructor(id: number, name: string, creationDate: Date) {
    this.id = id;
    this.rank = -1;
    this.nApplications = 0;
    this.nApplicationsWithCompliantAccessibilityDeclaration = 0;
    this.nApplicationsWithPartiallyCompliantAccessibilityDeclaration = 0;
    this.nApplicationsWithNonCompliantAccessibilityDeclaration = 0;
    this.nApplicationsWithGoldUsabilityAccessibilityStamp = 0;
    this.nApplicationsWithSilverUsabilityAccessibilityStamp = 0;
    this.nApplicationsWithBronzeUsabilityAccessibilityStamp = 0;
    this.name = name;
    this.creationDate = creationDate;
    this.applications = new Array<Application>();
    this.entities = new Array<string>();
    this.declarations = 0;
    this.stamps = 0;
    this.conformance = 0;
  }

  addApplication(application: Application): void {
    this.applications.push(application);
    this.conformance += application.getConformance();

    this.nApplications++;

    if (application.declaration) {
      this.declarations++;

      switch (application.declaration) {
        case 3:
          this.nApplicationsWithCompliantAccessibilityDeclaration++;
          break;
        case 2:
          this.nApplicationsWithPartiallyCompliantAccessibilityDeclaration++;
          break;
        default:
          this.nApplicationsWithNonCompliantAccessibilityDeclaration++;
          break;
      }
    }

    if (application.stamp) {
      this.stamps++;

      switch (application.stamp) {
        case 3:
          this.nApplicationsWithGoldUsabilityAccessibilityStamp++;
          break;
        case 2:
          this.nApplicationsWithSilverUsabilityAccessibilityStamp++;
          break;
        default:
          this.nApplicationsWithBronzeUsabilityAccessibilityStamp++;
          break;
      }
    }

    if (!this.recentApplication) {
      this.recentApplication = application.recentApplication;
    }

    if (application.recentApplication > this.recentApplication) {
      this.recentApplication = application.recentApplication;
    }

    if (application.entity) {
      if (application.entity.includes("@,@")) {
        for (const entity of application.entity.split("@,@")) {
          if (!this.entities.includes(entity.trim())) {
            this.entities.push(entity.trim());
          }
        }
      } else if (!this.entities.includes(application.entity.trim())) {
        this.entities.push(application.entity.trim());
      }
    }
  }

  getAvgConformance(): number {
    return this.conformance / this.applications.length;
  }

  getMaxConformance(): number {
    return this.applications
      .map((application) => application.conformance)
      .reduce((cur, max) => cur > max ? cur : max);
  }

  getMinConformance(): number {
    return this.applications
      .map((application) => application.conformance)
      .reduce((cur, min) => cur > min ? min : cur);
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

    for (const app of this.applications) {
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

    for (const app of this.applications) {
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

    for (const app of this.applications) {
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
