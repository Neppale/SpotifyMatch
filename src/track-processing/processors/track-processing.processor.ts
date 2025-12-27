import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { TrackProcessingService } from '../services/track-processing.service';
import { ProcessProfilesMessage } from '../models/process-profiles-message.dto';
import { TrackProcessingEventEmitter } from '../services/track-processing-event-emitter.service';

@Processor('process_tracks')
export class TrackProcessingProcessor extends WorkerHost {
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
      this.eventEmitter.emitForSession('completed', sessionId, {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}
