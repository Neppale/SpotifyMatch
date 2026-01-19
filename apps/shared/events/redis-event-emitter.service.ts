import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { EventEmitter } from 'events';
import Redis from 'ioredis';

@Injectable()
export class RedisEventEmitter
  extends EventEmitter
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(RedisEventEmitter.name);
  private publisher: Redis;
  private subscriber: Redis;
  private readonly channelPrefix = 'track-processing:';

  constructor() {
    super();
    const redisConfig: any = {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379'),
    };

    if (process.env.REDIS_USERNAME) {
      redisConfig.username = process.env.REDIS_USERNAME;
    }
    if (process.env.REDIS_PASSWORD) {
      redisConfig.password = process.env.REDIS_PASSWORD;
    }

    this.publisher = new Redis(redisConfig);
    this.subscriber = new Redis(redisConfig);
  }

  async onModuleInit() {
    this.logger.log('Initializing Redis event emitter...');

    // Set up event handlers before subscribing
    this.subscriber.on('pmessage', (pattern, channel, message) => {
      try {
        const eventData = JSON.parse(message);
        const eventName = channel.replace(this.channelPrefix, '');
        this.logger.log(
          `[RedisEventEmitter] Received Redis message - Channel: ${channel}, Event: ${eventName}, Data: ${JSON.stringify(eventData)}`,
        );
        super.emit(eventName, eventData);
      } catch (error) {
        this.logger.error(`Failed to parse event message: ${error}`);
      }
    });

    this.subscriber.on('error', (error) => {
      this.logger.error(`Redis subscriber error: ${error}`);
    });

    this.publisher.on('error', (error) => {
      this.logger.error(`Redis publisher error: ${error}`);
    });

    this.subscriber.on('connect', () => {
      this.logger.log('Redis subscriber connected');
    });

    this.publisher.on('connect', () => {
      this.logger.log('Redis publisher connected');
    });

    // Wait for connections to be ready
    await Promise.all([
      new Promise<void>((resolve) => {
        this.subscriber.once('ready', () => {
          this.logger.log('Subscriber ready');
          resolve();
        });
        // If already ready, trigger immediately
        if (this.subscriber.status === 'ready') {
          this.logger.log('Subscriber already ready');
          resolve();
        }
      }),
      new Promise<void>((resolve) => {
        this.publisher.once('ready', () => {
          this.logger.log('Publisher ready');
          resolve();
        });
        // If already ready, trigger immediately
        if (this.publisher.status === 'ready') {
          this.logger.log('Publisher already ready');
          resolve();
        }
      }),
    ]);

    await this.subscriber.psubscribe(`${this.channelPrefix}*`);
    this.logger.log(`Subscribed to Redis pattern: ${this.channelPrefix}*`);
  }

  async onModuleDestroy() {
    await this.subscriber.punsubscribe(`${this.channelPrefix}*`);
    await this.subscriber.quit();
    await this.publisher.quit();
  }

  emitForSession(event: string, sessionId: string, data: any): boolean {
    const channel = `${this.channelPrefix}${event}:${sessionId}`;
    const message = JSON.stringify({ sessionId, ...data });

    this.logger.log(
      `[RedisEventEmitter] Publishing event to Redis - Channel: ${channel}, Event: ${event}, SessionId: ${sessionId}, Data: ${JSON.stringify(data)}`,
    );

    this.publisher.publish(channel, message).catch((error) => {
      this.logger.error(`Failed to publish event to Redis: ${error}`);
    });

    const localResult = super.emit(`${event}:${sessionId}`, {
      sessionId,
      ...data,
    });
    this.logger.log(
      `[RedisEventEmitter] Emitted locally - Event: ${event}:${sessionId}, HasListeners: ${localResult}`,
    );
    return localResult;
  }

  onForSession(
    event: string,
    sessionId: string,
    listener: (...args: any[]) => void,
  ): this {
    const eventName = `${event}:${sessionId}`;
    const result = super.on(eventName, listener);
    const listenerCount = this.listenerCount(eventName);
    this.logger.log(
      `[RedisEventEmitter] Registered listener for ${eventName}, total listeners: ${listenerCount}`,
    );
    return result;
  }

  offForSession(
    event: string,
    sessionId: string,
    listener: (...args: any[]) => void,
  ): this {
    return super.off(`${event}:${sessionId}`, listener);
  }
}
