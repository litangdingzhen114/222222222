import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IntegrationConfigService } from '../../modules/integration-config/integration-config.service';

export interface LlmChatInput {
  question: string;
  context: string;
}

export interface LlmChatResult {
  answer: string;
  mode: 'official' | 'fallback';
}

@Injectable()
export class LlmProvider {
  constructor(
    private readonly config: ConfigService,
    private readonly integrationConfig: IntegrationConfigService,
  ) {}

  async chat(input: LlmChatInput): Promise<LlmChatResult> {
    const apiKey = await this.integrationConfig.getValue('LLM_API_KEY');
    if (!apiKey) {
      return {
        mode: 'fallback',
        answer: this.buildFallbackAnswer(input.question, input.context),
      };
    }
    const baseUrl = await this.integrationConfig.getValue(
      'LLM_BASE_URL',
      this.config.getOrThrow<string>('LLM_BASE_URL'),
    );
    const model = await this.integrationConfig.getValue(
      'LLM_MODEL',
      this.config.getOrThrow<string>('LLM_MODEL'),
    );
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content:
              '你是黄湖林场小程序 AI 导游，只能基于给定数据库上下文回答，不得虚构开放时间、价格、地点和服务。',
          },
          { role: 'user', content: `问题：${input.question}\n\n数据库上下文：\n${input.context}` },
        ],
        temperature: this.temperatureFor(model),
      }),
    });
    if (!response.ok) {
      return { mode: 'fallback', answer: this.buildFallbackAnswer(input.question, input.context) };
    }
    const json = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return {
      mode: 'official',
      answer:
        json.choices?.[0]?.message?.content ??
        this.buildFallbackAnswer(input.question, input.context),
    };
  }

  private buildFallbackAnswer(question: string, context: string) {
    if (!context.trim()) {
      return `我暂时没有在系统数据库里找到和“${question}”直接相关的内容，可以换个更具体的问题，比如景点、停车场、美食、采摘或活动。`;
    }
    return `根据系统里已经配置的黄湖林场数据，和“${question}”相关的信息如下：\n${context}`;
  }

  private temperatureFor(model: string) {
    return /^kimi-k2/i.test(model) ? 1 : 0.2;
  }
}
