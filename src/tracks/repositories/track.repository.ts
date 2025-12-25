import { Injectable } from '@nestjs/common';
import { PrismaService } from '@Prisma/services/prisma.service';
import { Prisma, TrackVariant } from '@PrismaClient';

@Injectable()
export class TrackRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createMany(data: Prisma.TrackCreateManyInput[]) {
    return await this.prismaService.getClient().track.createMany({ data });
  }

  async createManyTrackVariants(data: Prisma.TrackVariantCreateManyInput[]) {
    return await this.prismaService
      .getClient()
      .trackVariant.createMany({ data });
  }

  async checkIfTrackVariantExists(
    trackId: string,
    isSourceTrack: boolean,
  ): Promise<TrackVariant> {
    return await this.prismaService.getClient().trackVariant.findUnique({
      where: { trackId_isSourceTrack: { trackId, isSourceTrack } },
    });
  }
}
