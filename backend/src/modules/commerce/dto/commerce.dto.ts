import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { PageQueryDto } from '../../../common/dto/page.dto';

export class ProductQueryDto extends PageQueryDto {
  @IsString()
  @IsOptional()
  categoryId?: string;
}

export class CartItemDto {
  @IsString()
  productId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(99)
  quantity!: number;
}

export class AddCartItemDto extends CartItemDto {}

export class UpdateCartItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(99)
  @IsOptional()
  quantity?: number;

  @IsBoolean()
  @IsOptional()
  selected?: boolean;
}

export class SelectCartDto {
  @IsArray()
  @IsString({ each: true })
  ids!: string[];

  @IsBoolean()
  selected!: boolean;
}

export class OrderPreviewDto {
  @IsString()
  @IsOptional()
  addressId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  @IsOptional()
  items?: CartItemDto[];
}

export class CreateOrderDto extends OrderPreviewDto {
  @IsString()
  declare addressId: string;

  @IsString()
  @IsOptional()
  remark?: string;

  @IsString()
  @IsOptional()
  idempotencyKey?: string;
}
