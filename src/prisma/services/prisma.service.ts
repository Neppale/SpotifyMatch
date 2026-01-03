import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@PrismaClient';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly client: PrismaClient;
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });
    this.client = new PrismaClient({ adapter });
  }

  async onModuleInit() {
    await this.client.$connect().catch((error) => {
      console.error(error);
    });
  }

  async onModuleDestroy() {
    await this.client.$disconnect().catch((error) => {
      console.error(error);
    });
  }

  getClient() {
    return this.client;
  }
}
