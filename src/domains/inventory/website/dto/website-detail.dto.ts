import { Expose, Type } from 'class-transformer';

class InstitutionResponseDto {
  @Expose()
  id: number;

  @Expose()
  shortName: string;

  @Expose()
  longName: string;

  @Expose()
  createdAt: string;

  @Expose()
  updatedAt: string;

  @Expose()
  createdById: number | null;

  @Expose()
  updatedById: number | null;
}

export class WebsiteDetailDTO {
  @Expose()
  id: number;

  @Expose()
  title: string;

  @Expose()
  baseUrl: string;

  @Expose()
  createdAt: string;

  @Expose()
  updatedAt: string;

  @Expose()
  createdById: number;

  @Expose()
  updatedById: number | null;

  @Expose()
  @Type(() => InstitutionResponseDto)
  institution: InstitutionResponseDto;
}
