import { Injectable } from '@nestjs/common';
import { PrismaService } from '@Prisma/services/prisma.service';
import { Prisma } from '@PrismaClient';

@Injectable()
export class TrackRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createMany(data: Prisma.TrackCreateManyInput[]) {
    return await this.prismaService.getClient().track.createMany({ data });
  }
}
