import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TrackProcessingService } from './services/track-processing.service';
import { ProcessProfilesMessage } from './profile/models/process-profiles-message.dto';

@Controller()
export class TrackProcessingController {
  constructor(
    private readonly trackProcessingService: TrackProcessingService,
  ) {}

  @MessagePattern('process_profiles')
  async handleProcessProfiles(
    @Payload() data: ProcessProfilesMessage,
  ): Promise<void> {
    await this.trackProcessingService.processProfiles(data);
  }
}
