import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'events';

@Injectable()
export class TrackProcessingEventEmitter extends EventEmitter {
  emitForSession(event: string, sessionId: string, data: any): boolean {
    return super.emit(`${event}:${sessionId}`, data);
  }

  onForSession(
    event: string,
    sessionId: string,
    listener: (...args: any[]) => void,
  ): this {
    return super.on(`${event}:${sessionId}`, listener);
  }

  offForSession(
    event: string,
    sessionId: string,
    listener: (...args: any[]) => void,
  ): this {
    return super.off(`${event}:${sessionId}`, listener);
  }
}
