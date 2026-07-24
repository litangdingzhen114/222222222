import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FavoriteTargetType } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { PageQueryDto } from '../../common/dto/page.dto';
import { AuthPrincipal } from '../auth/auth.types';
import {
  AiGuideChatDto,
  BrowsingHistoryDto,
  CreateFeedbackDto,
  FavoriteDto,
} from './dto/engagement.dto';
import { EngagementService } from './engagement.service';

@ApiTags('engagement')
@Controller({ path: '', version: '1' })
export class EngagementController {
  constructor(private readonly engagement: EngagementService) {}

  @ApiBearerAuth()
  @Get('users/me/favorites')
  favorites(@CurrentUser() principal: AuthPrincipal, @Query() query: PageQueryDto) {
    return this.engagement.favorites(principal, query);
  }

  @ApiBearerAuth()
  @Post('favorites')
  addFavorite(@CurrentUser() principal: AuthPrincipal, @Body() dto: FavoriteDto) {
    return this.engagement.addFavorite(principal, dto);
  }

  @ApiBearerAuth()
  @Delete('favorites/:targetType/:targetId')
  removeFavorite(
    @CurrentUser() principal: AuthPrincipal,
    @Param('targetType') targetType: FavoriteTargetType,
    @Param('targetId') targetId: string,
  ) {
    return this.engagement.removeFavorite(principal, { targetType, targetId });
  }

  @ApiBearerAuth()
  @Get('users/me/history')
  history(@CurrentUser() principal: AuthPrincipal, @Query() query: PageQueryDto) {
    return this.engagement.history(principal, query);
  }

  @ApiBearerAuth()
  @Post('browsing-history')
  addHistory(@CurrentUser() principal: AuthPrincipal, @Body() dto: BrowsingHistoryDto) {
    return this.engagement.addHistory(principal, dto);
  }

  @Public()
  @Post('feedback')
  createFeedback(
    @CurrentUser() principal: AuthPrincipal | undefined,
    @Body() dto: CreateFeedbackDto,
  ) {
    return this.engagement.createFeedback(principal, dto);
  }

  @ApiBearerAuth()
  @Get('feedback/:id')
  feedbackDetail(@CurrentUser() principal: AuthPrincipal, @Param('id') id: string) {
    return this.engagement.feedbackDetail(principal, id);
  }

  @Public()
  @Get('ai-guide/suggestions')
  suggestions() {
    return this.engagement.suggestions();
  }

  @Public()
  @Post('ai-guide/chat')
  aiChat(@Body() dto: AiGuideChatDto) {
    return this.engagement.aiChat(dto);
  }
}
