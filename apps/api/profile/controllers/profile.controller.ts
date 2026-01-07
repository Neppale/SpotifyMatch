import {
  Body,
  Controller,
  Headers,
  Param,
  Post,
  Res,
  Sse,
} from '@nestjs/common';
import { CompareProfileDto } from '@Apps/api/profile/models/compare-profile.dto';
import { ProfileService } from '@Apps/api/profile/services/profile.service';
import { Response } from 'express';
import { TrackProcessingEventEmitter } from '@Apps/track-processing/services/track-processing-event-emitter.service';
import { Observable } from 'rxjs';
import { ProfileComparisonFormattedResponse } from '@Apps/shared/profile/models/profile-comparison.model';

@Controller('profiles')
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly eventEmitter: TrackProcessingEventEmitter,
  ) {}

  @Post('compare')
  async compare(
    @Body()
    { firstProfile, secondProfile }: CompareProfileDto,
    @Headers('x-session-id') sessionId: string,
    @Res() context: Response,
  ): Promise<void> {
    return await this.profileService.compareProfiles(
      context,
      {
        firstProfile,
        secondProfile,
      },
      sessionId,
    );
  }

  @Sse('processing/:sessionId')
  getProcessingStatus(
    @Param('sessionId') sessionId: string,
  ): Observable<MessageEvent> {
    return new Observable<MessageEvent>((observer) => {
      const listener = (data: {
        success?: boolean;
        error?: string;
        progress?: number;
        data?: ProfileComparisonFormattedResponse;
      }) => {
        if (data.error) {
          observer.error(data.error);
          observer.complete();
        }
        if (data.progress) {
          observer.next({
            data: JSON.stringify({ progress: data.progress }),
          } as MessageEvent);
        }
        if (data.success) {
          observer.next({ data: JSON.stringify(data.data) } as MessageEvent);
          observer.complete();
        }
      };

      this.eventEmitter.onForSession('success', sessionId, listener);
      this.eventEmitter.onForSession('progress', sessionId, listener);
      this.eventEmitter.onForSession('completed', sessionId, listener);
      this.eventEmitter.onForSession('error', sessionId, listener);

      return () => {
        this.eventEmitter.offForSession('success', sessionId, listener);
        this.eventEmitter.offForSession('progress', sessionId, listener);
        this.eventEmitter.offForSession('completed', sessionId, listener);
        this.eventEmitter.offForSession('error', sessionId, listener);
      };
    });
  }
}
