import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';

export const SessionId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const sessionId = request.headers['x-session-id'];
    
    if (!sessionId || typeof sessionId !== 'string' || sessionId.trim() === '') {
      throw new BadRequestException({ message: 'x-session-id header is required'});
    }
    
    return sessionId;
  },
);
