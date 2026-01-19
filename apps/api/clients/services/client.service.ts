import { Injectable } from '@nestjs/common';
import { FlagsmithService } from '@Apps/shared/flagsmith/services/flagsmith.service';
import { RedisService } from '@Apps/shared/redis/services/redis.service';
import { ClientStatus } from '../models/client-status.model';

@Injectable()
export class ClientService {
  constructor(
    private readonly flagsmithService: FlagsmithService,
    private readonly redisService: RedisService,
  ) {}

  async getAll(): Promise<ClientStatus[]> {
    const clients = await this.flagsmithService.getAvailableClients();
    
    const clientStatuses: ClientStatus[] = await Promise.all(
      clients.map(async (client) => {
        const available = await this.redisService.isClientAvailable(client.id);
        return {
          clientId: client.id,
          available,
        };
      }),
    );

    return clientStatuses;
  }

  async clearUnavailableClients(): Promise<void> {
    const clients = await this.flagsmithService.getAvailableClients();

    const promises = clients.map((client) => this.redisService.clearClientUnavailable(client.id));
    promises.push(this.redisService.updateSpotifyStatus(true));
    await Promise.all(promises);
  }
}
