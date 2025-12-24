import { Injectable } from '@nestjs/common';
import { PrismaService } from '@Prisma/services/prisma.service';
import { Prisma } from 'generated/prisma';

@Injectable()
export class TrackRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createMany(data: Prisma.TrackCreateManyInput[]) {
    return await this.prismaService.getClient().track.createMany({ data });
  }

  async createManySimilarTracks(data: Prisma.SimilarTrackCreateManyInput[]) {
    return await this.prismaService
      .getClient()
      .similarTrack.createMany({ data });
  }
}
