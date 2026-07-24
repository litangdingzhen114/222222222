import { IsArray, IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { FavoriteTargetType, FeedbackType, HistoryTargetType } from '@prisma/client';

export class FavoriteDto {
  @IsEnum(FavoriteTargetType)
  targetType!: FavoriteTargetType;

  @IsString()
  targetId!: string;
}

export class BrowsingHistoryDto {
  @IsEnum(HistoryTargetType)
  targetType!: HistoryTargetType;

  @IsString()
  targetId!: string;
}

export class CreateFeedbackDto {
  @IsEnum(FeedbackType)
  type!: FeedbackType;

  @IsString()
  @Length(5, 1000)
  content!: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsString()
  @IsOptional()
  contact?: string;
}

export class AiGuideChatDto {
  @IsString()
  @Length(1, 500)
  question!: string;
}
