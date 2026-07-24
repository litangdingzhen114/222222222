import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { PageQueryDto } from '../../common/dto/page.dto';
import {
  ArticleQueryDto,
  MapPointQueryDto,
  NearbyMapPointQueryDto,
  PublishedContentQueryDto,
} from './dto/content.dto';
import { ContentService } from './content.service';

@Public()
@ApiTags('home')
@Controller({ path: 'home', version: '1' })
export class HomeController {
  constructor(private readonly content: ContentService) {}

  @Get()
  home() {
    return this.content.home();
  }
}

@Public()
@ApiTags('content')
@Controller({ path: '', version: '1' })
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @Get('banners')
  banners() {
    return this.content.banners();
  }

  @Get('articles')
  articles(@Query() query: ArticleQueryDto) {
    return this.content.articles(query);
  }

  @Get('articles/:id')
  article(@Param('id') id: string) {
    return this.content.article(id);
  }

  @Get('scenic-spots')
  scenicSpots(@Query() query: PublishedContentQueryDto) {
    return this.content.scenicSpots(query);
  }

  @Get('scenic-spots/:id')
  scenicSpot(@Param('id') id: string) {
    return this.content.scenicSpot(id);
  }

  @Post('scenic-spots/:id/view')
  viewScenicSpot(@Param('id') id: string) {
    return this.content.viewScenicSpot(id);
  }

  @Get('travel-routes')
  travelRoutes(@Query() query: PublishedContentQueryDto) {
    return this.content.travelRoutes(query);
  }

  @Get('travel-routes/:id')
  travelRoute(@Param('id') id: string) {
    return this.content.travelRoute(id);
  }

  @Get('map-points')
  mapPoints(@Query() query: MapPointQueryDto) {
    return this.content.mapPoints(query);
  }

  @Get('map-points/nearby')
  nearbyMapPoints(@Query() query: NearbyMapPointQueryDto) {
    return this.content.nearbyMapPoints(query);
  }

  @Get('map-points/:id')
  mapPoint(@Param('id') id: string) {
    return this.content.mapPoint(id);
  }

  @Get('homestays')
  homestays(@Query() query: PageQueryDto) {
    return this.content.homestays(query);
  }

  @Get('foods')
  foods(@Query() query: PageQueryDto) {
    return this.content.foods(query);
  }

  @Get('farms')
  farms(@Query() query: PageQueryDto) {
    return this.content.farms(query);
  }
}
