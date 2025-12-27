import { Controller, Param, Sse } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TrackProcessingService } from './services/track-processing.service';
import { ProcessProfilesMessage } from './models/process-profiles-message.dto';
import { TrackProcessingEventEmitter } from './services/track-processing-event-emitter.service';
import { Observable } from 'rxjs';

@Controller()
export class TrackProcessingController {
  constructor(
    private readonly trackProcessingService: TrackProcessingService,
    private readonly eventEmitter: TrackProcessingEventEmitter,
  ) {}

  @MessagePattern('process_profiles')
  async handleProcessProfiles(
    @Payload() data: ProcessProfilesMessage,
  ): Promise<void> {
    await this.trackProcessingService.processProfiles(data);
  }

  @Sse('status/:sessionId')
  getStatus(@Param('sessionId') sessionId: string): Observable<MessageEvent> {
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
