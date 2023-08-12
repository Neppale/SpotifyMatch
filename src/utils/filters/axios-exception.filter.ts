import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { AxiosError } from 'axios';
import { Request, Response } from 'express';
import { ProfileParameters } from '../../profile/models/profile.parameters';

@Catch(AxiosError)
export class AxiosExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('AxiosExceptionFilter');
  catch(exception: AxiosError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const statusCode = exception.response?.status || 500;

    let message =
      'Oops, looks like something went wrong. Please try again later.';

    switch (statusCode) {
      case 400:
        message = 'Profile not found or invalid parameters.';
        break;
      case 404:
        message = 'Where are you going? This resource does not exist.';
        break;
      case 429:
        message =
          'Sorry, our servers are busy right now. Please try again later.';
        break;
    }

    const body = request.body as ProfileParameters;
    this.logger.error(
      `User had a ${statusCode} error comparing profiles ${body.firstProfile} and ${body.secondProfile} with advanced being ${body.advanced}.`,
    );

    response.status(statusCode).json({
      statusCode,
      message,
      stackTrace: statusCode === 500 ? exception.stack : undefined,
    });
  }
}
