import { Controller, Get, Post } from '@nestjs/common';
import { ClientService } from '../services/client.service';
import { ClientStatus } from '../models/client-status.model';

@Controller('clients')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Get()
  async getAll(): Promise<ClientStatus[]> {
    return this.clientService.getAll();
  }

  @Post('reset')
  async reset() {
    await this.clientService.clearUnavailableClients();
  }
}
