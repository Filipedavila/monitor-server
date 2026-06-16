import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { DECLARATION_MAP, STAMP_MAP, StampRow, WebsiteInfo } from "./types";
@Injectable()
export class ApiSeloService {
  constructor(
    @InjectDataSource()
    private readonly connection: DataSource,
  ) {}

  async getAllStamps(): Promise<WebsiteInfo[]> {
    const sites  = await this.connection.query<StampRow[]>(`
        SELECT DISTINCT
          w.id,
          w.title as 'Name',
          w.baseUrl as 'url',
          e.longName as 'entidade',
          w.stampStatus as 'selo',
          w.stampUpdatedAt as 'data_selo',
          w.declarationStatus as 'declaracao',
          w.declarationUpdatedAt as 'data_declaracao',
          dt.id as 'id_diretorio'
        FROM
          websites w
        INNER JOIN website_organizations ew ON w.id = ew.website_id
        INNER JOIN organizations e ON ew.organization_id = e.entity_id
        INNER JOIN tag_website tw ON w.id = tw.website_id
        INNER JOIN directory_tag dt ON tw.tag_id = dt.tag_id
        WHERE
          w.stamp IS NOT NULL
      `);


    return sites.map((site: StampRow):WebsiteInfo => ({
        id: site.id,
        Name: site.Name,
        url: site.url,
        entidade: site.entidade,
        selo:  STAMP_MAP[site.selo] || "Sem selo",
        data_selo: site.data_selo,
        declaracao: DECLARATION_MAP[site.declaracao] || "Não declarada",
        data_declaracao: site.data_declaracao,
        url_observatorio: `/directories/${site.id_diretorio}/${site.id}`
    }));

  }
}
