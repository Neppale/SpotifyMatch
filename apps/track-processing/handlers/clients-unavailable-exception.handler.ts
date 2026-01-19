import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import { ClientsUnavailableException } from '@Apps/shared/exceptions/clients-unavailable.exception';
import { RedisService } from '@Apps/shared/redis/services/redis.service';
import { TrackProcessingEventEmitter } from '../services/track-processing-event-emitter.service';
import { ProcessProfilesMessage } from '../profile/models/process-profiles-message.dto';

@Catch(ClientsUnavailableException)
@Injectable()
export class ClientsUnavailableExceptionHandler
  implements ExceptionFilter
{
  private readonly logger = new Logger(ClientsUnavailableExceptionHandler.name);
  private readonly RETRY_DELAY_MS = 5 * 60 * 1000; // 5 minutes

  constructor(
    @InjectQueue('process_tracks') private readonly queue: Queue,
    private readonly redisService: RedisService,
    private readonly eventEmitter: TrackProcessingEventEmitter,
  ) {}

  async catch(_exception: ClientsUnavailableException, host: ArgumentsHost) {
    this.logger.fatal('Stopping all queue jobs and updating Spotify status to unavailable');

    host.switchToHttp().getResponse().status(503).json({
      message: 'Spotify service is currently unavailable. Please try again later.',
    });

    try {
      await this.updateSpotifyStatus();
      const jobs = await this.getAllActiveAndFutureJobs();
      await this.handleJobs(jobs);
    } catch (error) {
      this.logger.error(
        'Error handling ClientsUnavailableException',
        error instanceof Error ? error.stack : error,
      );
    }
  }

  private async updateSpotifyStatus(): Promise<void> {
    await this.redisService.updateSpotifyStatus(false);
    this.logger.log('Updated Spotify status to unavailable');
  }

  private async getAllActiveAndFutureJobs(): Promise<Job<ProcessProfilesMessage>[]> {
    const [active, waiting, delayed] = await Promise.all([
      this.queue.getActive(),
      this.queue.getWaiting(),
      this.queue.getDelayed(),
    ]);

    const allJobs = [...active, ...waiting, ...delayed];
    this.logger.log(
      `Found ${allJobs.length} jobs to handle (${active.length} active, ${waiting.length} waiting, ${delayed.length} delayed)`,
    );

    return allJobs;
  }

  private async handleJobs(jobs: Job<ProcessProfilesMessage>[]): Promise<void> {
    const retryTime = Date.now() + this.RETRY_DELAY_MS;
    const sessionIds = new Set<string>();

    for (const job of jobs) {
      try {
        await job.moveToDelayed(retryTime);
        
        const sessionId = job.data?.sessionId;
        if (sessionId) {
          sessionIds.add(sessionId);
        }
      } catch (error) {
        this.logger.error(
          `Failed to move job ${job.id} to delayed: ${error instanceof Error ? error.message : error}`,
        );
      }
    }

    for (const sessionId of sessionIds) {
      try {
        this.eventEmitter.emitForSession('progress', sessionId, {
          progress: -1,
        });
      } catch (error) {
        this.logger.error(
          `Failed to emit progress event for session ${sessionId}: ${error instanceof Error ? error.message : error}`,
        );
      }
    }

    this.logger.log(
      `Moved ${jobs.length} jobs to delayed and emitted progress events for ${sessionIds.size} sessions`,
    );
  }
}
