import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'events';
import { Observable } from 'rxjs';
import { ProfileComparisonFormattedResponse } from '@Apps/shared/profile/models/profile-comparison.model';

@Injectable()
export class TrackProcessingEventEmitter extends EventEmitter {
  emitForSession(event: string, sessionId: string, data: any): boolean {
    return super.emit(`${event}:${sessionId}`, data);
  }

  private onForSession(
    event: string,
    sessionId: string,
    listener: (...args: any[]) => void,
  ): this {
    return super.on(`${event}:${sessionId}`, listener);
  }

  private offForSession(
    event: string,
    sessionId: string,
    listener: (...args: any[]) => void,
  ): this {
    return super.off(`${event}:${sessionId}`, listener);
  }

  createObservable(sessionId: string): Observable<MessageEvent> {
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

      this.onForSession('success', sessionId, listener);
      this.onForSession('progress', sessionId, listener);
      this.onForSession('completed', sessionId, listener);
      this.onForSession('error', sessionId, listener);

      return () => {
        this.offForSession('success', sessionId, listener);
        this.offForSession('progress', sessionId, listener);
        this.offForSession('completed', sessionId, listener);
        this.offForSession('error', sessionId, listener);
      };
    });
  }
}
