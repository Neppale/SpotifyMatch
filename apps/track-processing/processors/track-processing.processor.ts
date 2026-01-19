import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { TrackProcessingService } from '../services/track-processing.service';
import { ProcessProfilesMessage } from '../profile/models/process-profiles-message.dto';
import { TrackProcessingEventEmitter } from '../services/track-processing-event-emitter.service';
import { ClientsUnavailableException } from '@Apps/shared/exceptions/clients-unavailable.exception';

@Processor('process_tracks')
export class TrackProcessingProcessor extends WorkerHost {
  private readonly RETRY_DELAY_MS = 5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly trackProcessingService: TrackProcessingService,
    private readonly eventEmitter: TrackProcessingEventEmitter,
  ) {
    super();
  }

  async process(job: Job<ProcessProfilesMessage>): Promise<void> {
    const { sessionId, profiles } = job.data;

    try {
      await this.trackProcessingService.processProfiles({
        sessionId,
        profiles,
      });

      this.eventEmitter.emitForSession('completed', sessionId, {
        success: true,
      });
    } catch (error) {
      if (error instanceof ClientsUnavailableException) {
        const retryTime = Date.now() + this.RETRY_DELAY_MS;
        await job.moveToDelayed(retryTime);
        
        this.eventEmitter.emitForSession('progress', sessionId, {
          progress: -1,
        });
        
        return;
      }

      this.eventEmitter.emitForSession('completed', sessionId, {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}
