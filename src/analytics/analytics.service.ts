import {  Injectable } from '@nestjs/common';
import { AnalyticsOLAPRepository } from './analytics-olap.repository';
import { AnalyticsOLTPRepository } from './analytics-oltp.repository';
import { DirectoriesStats, DirectoryDetails, DirectorySummary, GlobalStatistics, WebsiteAuditReport, WebsiteRankingDetailed } from './api-data-v2';


@Injectable()
export class AnalyticsService {
  constructor(private readonly analyticsOLAPRepository: AnalyticsOLAPRepository,
              private readonly analyticsOLTPRepository: AnalyticsOLTPRepository
  ) {}


async getGlobalStatistics(): Promise<GlobalStatistics> {
    return {
        score: 9,
        directoriesCount: 110,
        websitesCount: 2220,
        entitiesCount: 33,
        pagesCount: 1221223,
        pagesWithoutErrorsCount: 200,
        recentPageDate: '2024-01-01',
        oldestPageDate: '2023-01-01',
        topWebsites: [
          {
            index: 1,
            id: 1,
            directoryId: 1,
            entity: 'Entity 1',
            name: 'Website 1',
            score: 9.5
          },
          {
            index: 2,
            id: 2,
            directoryId: 1,
            entity: 'Entity 2',
            name: 'Website 2',
            score: 9.4

          },
          {
            index: 3,
            id: 3,
            directoryId: 2,
            entity: 'Entity 3',
            name: 'Website 3',
            score: 9.3
          }  

        ],
        topBestPractices: [
          {
					"key": "listitem_01",
					"occurrenceCount": 156936,
					"pagesCount": 1258,
					"websitesCount": 26
				},
				{
					"key": "id_01",
					"occurrenceCount": 92214,
					"pagesCount": 1031,
					"websitesCount": 25
				},
				{
					"key": "aria_07",
					"occurrenceCount": 82547,
					"pagesCount": 1151,
					"websitesCount": 22
				},
				{
					"key": "element_08",
					"occurrenceCount": 72313,
					"pagesCount": 1320,
					"websitesCount": 26
				},
				{
					"key": "a_10",
					"occurrenceCount": 62494,
					"pagesCount": 1076,
					"websitesCount": 23
				}

        ],
        topErrors: [
          {
					"key": "a_05",
					"occurrenceCount": 24929,
					"pagesCount": 502,
					"websitesCount": 20
				},
				{
					"key": "layout_01b",
					"occurrenceCount": 3872,
					"pagesCount": 184,
					"websitesCount": 14
				},
				{
					"key": "color_02",
					"occurrenceCount": 3705,
					"pagesCount": 601,
					"websitesCount": 20
				},
				{
					"key": "a_11",
					"occurrenceCount": 2937,
					"pagesCount": 288,
					"websitesCount": 20
				},
				{
					"key": "hx_03",
					"occurrenceCount": 2363,
					"pagesCount": 368,
					"websitesCount": 20
				}

        ],
        declarations: {
            total: {
              websites: {
                conform: 40,
                partial: 22,
                not_conform: 38
              },
              apps: {
                 conform: 20,
                partial: 203,
                not_conform: 1000
                            }
            },
            currentYear: {
               websites: {
                conform: 100,
                partial: 20,
                not_conform: 222
              },
              apps: {
                 conform: 10,
                partial: 100,
                not_conform: 222
              }
            }
        },
        badges: {
            total: {
                websites: {
                    gold: 200,
                    silver: 500,
                    bronze: 600
                },
                apps: {
                    gold: 100,
                    silver: 200,
                    bronze: 300
                }
            },
            currentYear: {
                websites: {
                    gold: 100,
                    silver: 200,
                    bronze: 300
                },
                apps: {
                    gold: 100,
                    silver: 200,
                    bronze: 300
                }
            }
        }
    };
}
async getDirectoriesStatistics(): Promise<DirectoriesStats> {
    return {
        directoriesCount: 110,
        websitesCount: 2220,
        entitiesCount: 33,
        pagesCount: 1221223,
        score: 9,
        recentPageDate: '2024-01-01',
        oldestPageDate: '2023-01-01'
    };
}
async getDirectoriesRank(): Promise<DirectorySummary[]> {
    return [
      {
        id: 1,
        rank: 1,
        name: 'Directory 1',
        declarations: 100,
        stamps: 50,
        score: 9.5,
        websites: 10,
        A: 85,
        AA: 70,
        AAA: 55
      },
      {
        id: 2,
        rank: 2,
        name: 'Directory 2',
        declarations: 80,
        stamps: 40,
        score: 8.5,
        websites: 8,
        A: 80,
        AA: 65,
        AAA: 50
      },
      {
        id: 3,
        rank: 3,
        name: 'Directory 3',
        declarations: 60,
        stamps: 30,
        score: 7.5,
        websites: 6,
        A: 75,
        AA: 60,
        AAA: 45
      
      }

    ];
  }

async getDirectoriesDetails(id: number): Promise<DirectoryDetails> {
    return {
        id: id,
        name: 'Mock Directory',
        oldestPageDate: '2023-01-01',
        recentPageDate: '2024-01-01',
        score: 9,
        entitiesCount: 10,
        websitesCount: 5,
        pagesCount: 150,
        scoreDistributionFrequency: [10, 20, 30, 25, 15],
        errorDistribution: {
            errors: {
							"button_02": {
								"occurrencesCount": 641,
								"pagesCount": 351,
								"websitesCount": 5,
                "tagsCount": 10
							},
							"id_02": {
								"occurrencesCount": 1670,
								"pagesCount": 339,
								"websitesCount": 17
							},
							"hx_03": {
								"occurrencesCount": 2363,
								"pagesCount": 368,
								"websitesCount": 20
							},
							"table_02": {
								"occurrencesCount": 612,
								"pagesCount": 315,
								"websitesCount": 20
							},
							"focus_01": {
								"occurrencesCount": 1197,
								"pagesCount": 98,
								"websitesCount": 8
							},
							"landmark_10": {
								"occurrencesCount": 135,
								"pagesCount": 135,
								"websitesCount": 4
							},
							"landmark_02": {
								"occurrencesCount": 397,
								"pagesCount": 175,
								"websitesCount": 5
							},
							"landmark_04": {
								"occurrencesCount": 133,
								"pagesCount": 132,
								"websitesCount": 5
							}
            },
            success: {
							"button_02": {
								"occurrencesCount": 641,
								"pagesCount": 351,
								"websitesCount": 5,
                "tagsCount": 10
							},
							"id_02": {
								"occurrencesCount": 1670,
								"pagesCount": 339,
								"websitesCount": 17
							},
							"hx_03": {
								"occurrencesCount": 2363,
								"pagesCount": 368,
								"websitesCount": 20
							},
							"table_02": {
								"occurrencesCount": 612,
								"pagesCount": 315,
								"websitesCount": 20
							},
							"focus_01": {
								"occurrencesCount": 1197,
								"pagesCount": 98,
								"websitesCount": 8
							},
							"landmark_10": {
								"occurrencesCount": 135,
								"pagesCount": 135,
								"websitesCount": 4
							},
							"landmark_02": {
								"occurrencesCount": 397,
								"pagesCount": 175,
								"websitesCount": 5
							},
							"landmark_04": {
								"occurrencesCount": 133,
								"pagesCount": 132,
								"websitesCount": 5
							}
            },
            graphData: [
          {
							"key": "color_02",
							"element": "all",
							"pagesCount": 601,
							"websitesCount": 20,
							"result": "failed"
						},
						{
							"key": "a_05",
							"element": "a",
							"pagesCount": 502,
							"websitesCount": 20,
							"result": "failed"
						},
						{
							"key": "list_03",
							"element": "li",
							"pagesCount": 376,
							"websitesCount": 11,
							"result": "failed"
						},
						{
							"key": "hx_03",
							"element": "hx",
							"pagesCount": 368,
							"websitesCount": 20,
							"result": "failed"
						}
        ],
        showTableData: [
						{
							"key": "button_02",
							"level": "A",
							"element": "button",
							"websitesCount": 5,
							"pagesCount": 351,
							"elementsCount": 641,
							"quartiles": [
								{
									"totalItems": 2,
									"percentage": 40,
									"interval": {
										"lowerBound": 3,
										"upperBound": 87
									}
								},
								{
									"totalItems": 2,
									"percentage": 40,
									"interval": {
										"lowerBound": 151,
										"upperBound": 193
									}
								},
								{
									"totalItems": 1,
									"percentage": 20,
									"interval": {
										"lowerBound": 207,
										"upperBound": 207
									}
								}
							]
						},
						{
							"key": "id_02",
							"level": "A",
							"element": "id",
							"websitesCount": 17,
							"pagesCount": 339,
							"elementsCount": 1670,
							"quartiles": [
								{
									"totalItems": 5,
									"percentage": 29,
									"interval": {
									"lowerBound": 2,
									"upperBound": 3
									}
								},
								{
									"totalItems": 5,
									"percentage": 29,
									"interval": {
										"lowerBound": 6,
										"upperBound": 14
									}
								},
								{
									"totalItems": 4,
									"percentage": 24,
									"interval": {
										"lowerBound": 17,
										"upperBound": 32
									}
								},
								{
									"totalItems": 3,
									"percentage": 18,
									"interval": {
										"lowerBound": 82,
										"upperBound": 1147
									}
								}
							],
							"elementGroup": "other"
						}
        ]
        },
        graphData: [
          {
							"key": "color_02",
							"element": "all",
							"pagesCount": 601,
							"websitesCount": 20,
							"result": "failed"
						},
						{
							"key": "a_05",
							"element": "a",
							"pagesCount": 502,
							"websitesCount": 20,
							"result": "failed"
						},
						{
							"key": "list_03",
							"element": "li",
							"pagesCount": 376,
							"websitesCount": 11,
							"result": "failed"
						},
						{
							"key": "hx_03",
							"element": "hx",
							"pagesCount": 368,
							"websitesCount": 20,
							"result": "failed"
						}
        ],
        showTableData: [
						{
							"key": "button_02",
							"level": "A",
							"element": "button",
							"websitesCount": 5,
							"pagesCount": 351,
							"elementsCount": 641,
							"quartiles": [
								{
									"totalItems": 2,
									"percentage": 40,
									"interval": {
										"lowerBound": 3,
										"upperBound": 87
									}
								},
								{
									"totalItems": 2,
									"percentage": 40,
									"interval": {
										"lowerBound": 151,
										"upperBound": 193
									}
								},
								{
									"totalItems": 1,
									"percentage": 20,
									"interval": {
										"lowerBound": 207,
										"upperBound": 207
									}
								}
							]
						},
						{
							"key": "id_02",
							"level": "A",
							"element": "id",
							"websitesCount": 17,
							"pagesCount": 339,
							"elementsCount": 1670,
							"quartiles": [
								{
									"totalItems": 5,
									"percentage": 29,
									"interval": {
									"lowerBound": 2,
									"upperBound": 3
									}
								},
								{
									"totalItems": 5,
									"percentage": 29,
									"interval": {
										"lowerBound": 6,
										"upperBound": 14
									}
								},
								{
									"totalItems": 4,
									"percentage": 24,
									"interval": {
										"lowerBound": 17,
										"upperBound": 32
									}
								},
								{
									"totalItems": 3,
									"percentage": 18,
									"interval": {
										"lowerBound": 82,
										"upperBound": 1147
									}
								}
							],
							"elementGroup": "other"
						}
        ]
    };
}

async getWebsiteDetails(websiteId: number): Promise<WebsiteAuditReport> {
    return {
  id: 2,
  name: "ePortugal",
  url: "https://eportugal.gov.pt",
  oldestPageDate: "2023-10-16T13:52:38.000Z",
  recentPageDate: "2023-10-16T14:07:42.000Z",
  score: 7.565217391304346,
  pageCount: 69,
  institutionName: "Agência para a Modernização Administrativa",
  pagesWithErrorsCount: 69,
  pagesWithoutErrorsA: 0,
  pagesWithoutErrorsAA: 0,
  pagesWithoutErrorsAAA: 0,
  pagesWithoutErrorsCount: 0,
  accessibilityPlotData: [8.1, 7.9, 7.1, 7.5, 7.5, 7.5, 7.9],
  scoreDistributionFrequency: [0, 0, 0, 0, 0, 4, 57, 8, 0],
  errorsDistribution: [
    { key: "id_02", occurrenceCount: 1147, pagesCount: 69 },
    { key: "hx_03", occurrenceCount: 744, pagesCount: 69 },
    { key: "ehandler_02", occurrenceCount: 286, pagesCount: 54 },
    { key: "button_02", occurrenceCount: 207, pagesCount: 69 }
  ],
  bestPracticesDistribution: [
    { key: "aria_07", occurrenceCount: 35371, pagesCount: 69 },
    { key: "listitem_01", occurrenceCount: 33388, pagesCount: 69 },
    { key: "element_08", occurrenceCount: 33166, pagesCount: 69 }
  ],
  errorMetrics: {
    button_02: {
      pageCount: 69,
      occurrenceCount: 207,
      element: "button",
      testName: "buttonNotAname",
      result: "failed"
    },
    id_02: {
      pageCount: 69,
      occurrenceCount: 1147,
      element: "id",
      testName: "idAttNot",
      result: "failed"
    },
    hx_03: {
      pageCount: 69,
      occurrenceCount: 744,
      element: "hx",
      testName: "hxSkip",
      result: "failed"
    },
    table_02: {
      pageCount: 69,
      occurrenceCount: 81,
      element: "tableData",
      testName: "tableDataCaption",
      result: "failed"
    }
  },
  successMetrics: {
    title_06: {
      pageCount: 69,
      occurrenceCount: 69,
      element: "all",
      testName: "titleOk",
      result: "passed"
    },
    a_10: {
      pageCount: 65,
      occurrenceCount: 3814,
      element: "all",
      testName: "linkAName",
      result: "passed"
    },
    element_02: {
      pageCount: 69,
      occurrenceCount: 6067,
      element: "all",
      testName: "elementDec",
      result: "passed"
    },
    meta_05: {
      pageCount: 69,
      occurrenceCount: 69,
      element: "all",
      testName: "metaViewport",
      result: "passed"
    },
    svg_01: {
      pageCount: 51,
      occurrenceCount: 133,
      element: "svg",
      testName: "svgAName",
      result: "passed"
    }
  },
  successDetailsTable: {
    keys: ["0", "1", "2"],
    data: [
      {
        key: "aria_07",
        occurrenceCount: 35371,
        pageCount: 69,
        level: "A",
        quartiles: [
          {
            total: 34,
            percentage: 49,
            interval: { lower: 471, upper: 492 }
          },
          {
            total: 3,
            percentage: 4,
            interval: { lower: 493, upper: 493 }
          }
        ]
      },
      {
        key: "aria_07",
        occurrenceCount: 35371,
        pageCount: 69,
        level: "AAA",
        quartiles: [
          {
            total: 34,
            percentage: 49,
            interval: { lower: 471, upper: 492 }
          },
          {
            total: 3,
            percentage: 4,
            interval: { lower: 493, upper: 493 }
          }
        ]
      },{
        key: "aria_07",
        occurrenceCount: 35371,
        pageCount: 69,
        level: "AA",
        quartiles: [
          {
            total: 34,
            percentage: 49,
            interval: { lower: 471, upper: 492 }
          },
          {
            total: 3,
            percentage: 4,
            interval: { lower: 493, upper: 493 }
          }
        ]
      }
    ]
  },
  errorsDetailsTable: {
    keys: ["0"],
    data: [
      {
        key: "id_02",
        occurrenceCount: 1147,
        pageCount: 69,
        level: "A",
        quartiles: [
          {
            total: 45,
            percentage: 65,
            interval: { lower: 15, upper: 15 }
          }
        ]
      },
      {
        key: "id_02",
        occurrenceCount: 1147,
        pageCount: 5,
        level: "AA",
        quartiles: [
          {
            total: 5,
            percentage: 65,
            interval: { lower: 15, upper: 15 }
          }
        ]
      },
        {
        key: "id_02",
        occurrenceCount: 111,
        pageCount: 4,
        level: "AAA",
        quartiles: [
          {
            total: 40,
            percentage: 65,
            interval: { lower: 15, upper: 15 }
          }
        ]
      }
    ]
  }
};
}

async getDirectoryStatistics(directoryId: number): Promise<DirectoriesStats> {
    return {
        directoriesCount: 1,
        websitesCount: 100,
        entitiesCount: 10,
        pagesCount: 1000,
        score: 8.5,
        recentPageDate: '2024-01-01',
        oldestPageDate: '2023-01-01'
    };
}

async getDirectoryWebsites(directoryId: number): Promise<WebsiteRankingDetailed[]> {
    return [
          {
							"id": 22,
							"rank": 1,
							"name": "Portal Mais Transparência",
							"entity": "Agência para a Modernização Administrativa",
							"declaration": 3,
							"stamp": 3,
							"score": 9.937837837837838,
							"nPages": 37,
							"A": 0,
							"AA": 6,
							"AAA": 31
						},
						{
							"id": 23,
							"rank": 2,
							"name": "Instituto da Segurança Social, I.P. - Portal Seg Social",
							"entity": "Instituto da Segurança Social, I.P.",
							"declaration": null,
							"stamp": null,
							"score": 9.63908045977012,
							"nPages": 87,
							"A": 0,
							"AA": 33,
							"AAA": 22
						}
        ]
      
}
  
async getAvgScoreWebsite(websiteId:number){
    return await this.analyticsOLAPRepository.getAvgScoreGlobalWebsite(websiteId);
  }
  async getAvgScore():Promise<any>{
        return await this.analyticsOLAPRepository.getAvgScore();
  }
      
  async getTop5Websites(): Promise<any[]> {
    return await this.analyticsOLAPRepository.getTop5Websites();
  }
   

  async getTopBestPractices(): Promise<any[]> {
    return await this.analyticsOLAPRepository.getTopBestPractices();
  }
    
  async getTopBadPractices(): Promise<any[]> {
    return await this.analyticsOLAPRepository.getTopBadPractices();
  }
  
  
  async getWebsiteTopBestPractices(websiteId:number): Promise<any[]> {
   return await this.analyticsOLAPRepository.getWebsiteTopBestPractices(websiteId);
  }

  async getWebsiteTopBadPractices(websiteId:number): Promise<any[]> {
    return await this.analyticsOLAPRepository.getWebsiteTopBadPractices(websiteId);
  
  }



  public async getWebsiteScoreDistribution(websiteId:number){
    return await this.analyticsOLAPRepository.getWebsiteScoreDistribution(websiteId);
  }

  
}
