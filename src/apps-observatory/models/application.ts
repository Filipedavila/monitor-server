export class Application {
  id: number;
  DirectoryId: number;
  rank: number;
  entity: string;
  name: string;
  declaration: number;
  declarationDate: Date;
  stamp: number;
  stampDate: Date;
  downloadUrl: string;
  creationDate: Date;
  oldestApplication: Date;
  recentApplication: Date;
  conformance: number;
  operatingSystem: string;
  tenCriticalAspectsList: Array<any>;
  successCriteriaList: Array<any>;

  constructor(
    id: number,
    directoryId: number,
    entity: string,
    name: string,
    declaration: number,
    declarationDate: Date,
    stamp: number,
    stampDate: Date,
    downloadUrl: string,
    creationDate: Date,
    operatingSystem: string,
    conformance: number,
    evaluation: string
  ) {
    this.id = id;
    this.DirectoryId = directoryId;
    this.rank = -1;
    this.entity = entity;
    this.name = name;
    this.declaration = declaration;
    this.declarationDate = declarationDate;
    this.stamp = stamp;
    this.stampDate = stampDate;
    this.downloadUrl = downloadUrl;
    this.creationDate = creationDate;
    this.operatingSystem = operatingSystem;
    this.conformance = conformance;
    this.tenCriticalAspectsList = new Array<any>();
    this.successCriteriaList = new Array<any>();

    this.generateLists(JSON.parse(evaluation));
  }

  private generateLists(evaluation: any) {
    const tmpCriticalAspectsList = new Array<any>();

    for (const test in evaluation) {
      for (const subtest in evaluation[`${test}`]) {
        const result = evaluation[`${test}`][`${subtest}`].result;
        const nEvidences = evaluation[`${test}`][`${subtest}`].nEvidences;
        switch (result) {
          case "P":
            tmpCriticalAspectsList.push({
              name: `${test}.${subtest}`,
              conformity: 1,
              nEvidences: nEvidences
            });
            break;
          case "N":
            tmpCriticalAspectsList.push({
              name: `${test}.${subtest}`,
              conformity: 3,
              nEvidences: nEvidences
            });
            break;
          default:
            tmpCriticalAspectsList.push({
              name: `${test}.${subtest}`,
              conformity: 2,
              nEvidences: nEvidences
            });
            break;
        }
      }
    }

    let i = 1;
    tmpCriticalAspectsList.sort((a, b) => {
      if (a.conformity === b.conformity) {
        return b.nEvidences - a.nEvidences;
      } else {
        return a.conformity - b.conformity;
      }
    }).map((value) => {
      this.tenCriticalAspectsList.push({
        rank: i,
        name: value.name,
        conformity: value.conformity,
        nEvidences: value.nEvidences
      });
      i++;
    });
  }

  getConformance(): number {
    return this.conformance;
  }

  getTopThreeBestPractices() {
    const data = new Array<any>();

    for (const aspect of this.tenCriticalAspectsList) {
      if (aspect.conformity === 1) {
        data.push({
          name: aspect.name,
          nEvidences: aspect.nEvidences
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

  getTopThreeWorstPracticesList() {
    const data = new Array<any>();

    for (const aspect of this.tenCriticalAspectsList) {
      if (aspect.conformity === 3) {
        data.push({
          name: aspect.name,
          nEvidences: aspect.nEvidences
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
    );;
  }

  getAccessibilityDeclaration() {
    let data = {};

    switch(this.declaration) {
      case 3:
        data = {
          declaration: this.declaration,
          state: "conformant",
          date: this.declarationDate
        }
        break;
      case 2:
        data = {
          declaration: this.declaration,
          state: "partiallyConformant",
          date: this.declarationDate
        }
        break;
      case 1:
        data = {
          declaration: this.declaration,
          state: "nonConformant",
          date: this.declarationDate
        }
        break;
      default:
        data = {
          declaration: null,
        }
        break;
    }

    return data;
  }

  getUsabilityAccessibilityStamp() {
    let data = {};

    switch(this.declaration) {
      case 3:
        data = {
          stamp: this.stamp,
          stampLevel: "gold",
          validityDate: this.stampDate
        }
        break;
      case 2:
        data = {
          stamp: this.stamp,
          stampLevel: "silver",
          validityDate: this.stampDate
        }
        break;
      case 1:
        data = {
          stamp: this.stamp,
          stampLevel: "bronze",
          validityDate: this.stampDate
        }
        break;
      default:
        data = {
          stamp: null,
        }
        break;
    }

    return data;
  }

  getConformityToTest(test: number, subtest: number): number {
    return this.tenCriticalAspectsList.filter((elem) => elem.name === `${test}.${subtest}`)[0].conformity;
  }
}
