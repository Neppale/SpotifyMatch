import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/services/prisma.service';
import { Prisma } from 'prisma/generated';

@Injectable()
export class TrackRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createMany(data: Prisma.TrackCreateManyInput[]) {
    return await this.prismaService.getClient().track.createMany({ data });
  }
}
