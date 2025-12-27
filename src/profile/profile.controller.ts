import {
  Body,
  Controller,
  Headers,
  Param,
  Post,
  Res,
  Sse,
} from '@nestjs/common';
import { CompareProfileDto } from '@Profile/models/compare-profile.dto';
import { ProfileService } from '@Profile/services/profile.service';
import { Response } from 'express';
import { TrackProcessingEventEmitter } from '../track-processing/services/track-processing-event-emitter.service';
import { Observable } from 'rxjs';

@Controller('profiles')
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly eventEmitter: TrackProcessingEventEmitter,
  ) {}

  @Post('compare')
  async compare(
    @Body()
    { firstProfile, secondProfile, advanced, saveResults }: CompareProfileDto,
    @Headers('x-session-id') sessionId: string,
    @Res() context: Response,
  ): Promise<void> {
    return await this.profileService.compareProfiles(
      context,
      {
        firstProfile,
        secondProfile,
        advanced,
        saveResults,
      },
      sessionId,
    );
  }

  @Sse('processing/:sessionId')
  getProcessingStatus(
    @Param('sessionId') sessionId: string,
  ): Observable<MessageEvent> {
    return new Observable<MessageEvent>((observer) => {
      const listener = (data: { success: boolean; error?: string }) => {
        observer.next({ data: JSON.stringify(data) } as MessageEvent);
        if (data.success) {
          observer.complete();
        }
        if (data.error) {
          observer.error(data.error);
        }
      };

      this.eventEmitter.onForSession('completed', sessionId, listener);

      return () => {
        this.eventEmitter.offForSession('completed', sessionId, listener);
      };
    });
  }
}
