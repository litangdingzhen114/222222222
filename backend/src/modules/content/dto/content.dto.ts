import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ArticleType, ContentStatus, MapPointType } from '@prisma/client';
import { PageQueryDto } from '../../../common/dto/page.dto';

export class PublishedContentQueryDto extends PageQueryDto {
  @IsString()
  @IsOptional()
  tag?: string;
}

export class ArticleQueryDto extends PageQueryDto {
  @IsEnum(ArticleType)
  @IsOptional()
  type?: ArticleType;
}

export class MapPointQueryDto extends PageQueryDto {
  @IsEnum(MapPointType)
  @IsOptional()
  type?: MapPointType;

  @IsEnum(ContentStatus)
  @IsOptional()
  status?: ContentStatus;
}

export class NearbyMapPointQueryDto {
  @Type(() => Number)
  @IsNumber()
  longitude!: number;

  @Type(() => Number)
  @IsNumber()
  latitude!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(100)
  @Max(20000)
  radius = 5000;

  @IsEnum(MapPointType)
  @IsOptional()
  type?: MapPointType;
}
