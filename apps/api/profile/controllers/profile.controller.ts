import {
  Body,
  Controller,
  Param,
  Post,
  Res,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { CompareProfileDto } from '@Apps/api/profile/models/compare-profile.dto';
import { ProfileService } from '@Apps/api/profile/services/profile.service';
import { Response } from 'express';
import { TrackProcessingEventEmitter } from '@Apps/track-processing/services/track-processing-event-emitter.service';
import { Observable } from 'rxjs';
import { SpotifyAvailabilityGuard } from '@Utils/guards/spotify-availability.guard';
import { SessionId } from '@Utils/decorators/session-id.decorator';

@Controller('profiles')
@UseGuards(SpotifyAvailabilityGuard)
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly eventEmitter: TrackProcessingEventEmitter,
  ) {}

  @Post('compare')
  async compare(
    @Body()
    { firstProfile, secondProfile }: CompareProfileDto,
    @SessionId() sessionId: string,
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
    return this.eventEmitter.createObservable(sessionId);
  }
}
