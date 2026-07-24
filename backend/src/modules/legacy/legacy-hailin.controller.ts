import { Body, Controller, Get, Post, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { PageQueryDto } from '../../common/dto/page.dto';
import { ContentService } from '../content/content.service';
import { ProductQueryDto } from '../commerce/dto/commerce.dto';
import { CommerceService } from '../commerce/commerce.service';
import { CamerasService } from '../cameras/cameras.service';
import { EngagementService } from '../engagement/engagement.service';
import { AiGuideChatDto, CreateFeedbackDto } from '../engagement/dto/engagement.dto';

@Public()
@Controller({ path: 'hailin', version: VERSION_NEUTRAL })
export class LegacyHailinController {
  constructor(
    private readonly content: ContentService,
    private readonly commerce: CommerceService,
    private readonly cameras: CamerasService,
    private readonly engagement: EngagementService,
  ) {}

  @Get('home')
  home() {
    return this.content.home();
  }

  @Get('map-points')
  mapPoints(@Query() query: PageQueryDto) {
    return this.content.legacyMapPoints(query);
  }

  @Get('foods')
  foods(@Query() query: PageQueryDto) {
    return this.content.foods(query);
  }

  @Get('spots')
  spots(@Query() query: PageQueryDto) {
    return this.content.scenicSpots(query);
  }

  @Get('routes')
  routes(@Query() query: PageQueryDto) {
    return this.content.travelRoutes(query);
  }

  @Get('products')
  products(@Query() query: ProductQueryDto) {
    return this.commerce.products(query);
  }

  @Get('lives')
  lives() {
    return this.cameras.cameras();
  }

  @Post('ai-guide')
  aiGuide(@Body() dto: AiGuideChatDto) {
    return this.engagement.aiChat(dto);
  }

  @Post('feedback')
  feedback(@Body() dto: CreateFeedbackDto) {
    return this.engagement.createFeedback(undefined, dto);
  }
}
