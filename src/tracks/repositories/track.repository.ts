import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/services/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class TrackRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createMany(
    data: Prisma.TrackCreateManyInput[],
  ): Promise<Prisma.BatchPayload> {
    return await this.prisma.track.createMany({
      data,
    });
  }
}
