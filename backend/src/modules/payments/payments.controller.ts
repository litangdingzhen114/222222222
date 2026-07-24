import { Body, Controller, Get, Headers, Param, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { SkipResponseWrap } from '../../common/decorators/skip-response-wrap.decorator';
import { RequestWithContext } from '../../common/interfaces/http.interface';
import { AuthPrincipal } from '../auth/auth.types';
import { CreateWechatPaymentDto } from './dto/payments.dto';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller({ path: 'payments', version: '1' })
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @ApiBearerAuth()
  @Post('wechat/create')
  createWechatPayment(
    @CurrentUser() principal: AuthPrincipal,
    @Body() dto: CreateWechatPaymentDto,
  ) {
    return this.payments.createWechatPayment(principal, dto);
  }

  @Public()
  @SkipResponseWrap()
  @Post('wechat/notify')
  wechatNotify(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Req() request: RequestWithContext & { rawBody?: Buffer },
    @Body() body: unknown,
  ) {
    return this.payments.handleWechatNotify(
      headers,
      request.rawBody?.toString('utf8') ?? JSON.stringify(body),
      body,
    );
  }

  @Get(':paymentNo/status')
  status(@Param('paymentNo') paymentNo: string) {
    return this.payments.status(paymentNo);
  }
}
