import { Injectable } from '@nestjs/common';
import { PrismaService } from '@Prisma/services/prisma.service';
import { Prisma, TrackVariant, Track } from '@PrismaClient';

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

  async findSourceTrackBySpotifyId(spotifyId: string): Promise<Track | null> {
    const variant = await this.prismaService
      .getClient()
      .trackVariant.findFirst({
        where: {
          spotifyId,
          isSourceTrack: true,
        },
        include: {
          Track: true,
        },
      });
    return variant?.Track || null;
  }

  async upsertTrackVariant(
    trackId: string,
    spotifyId: string,
    isSourceTrack: boolean,
    score: number,
  ): Promise<TrackVariant> {
    return await this.prismaService.getClient().trackVariant.upsert({
      where: {
        trackId_isSourceTrack: {
          trackId,
          isSourceTrack,
        },
      },
      update: {
        spotifyId,
        updatedAt: new Date(),
      },
      create: {
        trackId,
        spotifyId,
        isSourceTrack,
        score,
      },
    });
  }

  async createSourceTrackWithVariants(
    trackData: Prisma.TrackCreateWithoutTrackVariantInput,
    spotifyIds: string[],
    score: number,
  ): Promise<Track> {
    const track = await this.prismaService
      .getClient()
      .$transaction(async (tx) => {
        const track = await tx.track.create({
          data: {
            album: trackData.album,
            artist: trackData.artist,
            title: trackData.title,
            releaseDate: trackData.releaseDate,
            durationMs: trackData.durationMs,
          },
        });
        for (const [index, spotifyId] of spotifyIds.entries()) {
          const isSourceTrack = index === 0;
          await tx.trackVariant.create({
            data: {
              trackId: track.id,
              spotifyId,
              isSourceTrack,
              score: isSourceTrack ? 5 : score,
            },
          });
        }
        return track;
      });

    return track;
  }

  async createVariantForSourceTrack(
    sourceTrackId: string,
    spotifyId: string,
    score: number,
  ): Promise<TrackVariant> {
    return await this.prismaService.getClient().trackVariant.upsert({
      where: {
        trackId_isSourceTrack: {
          trackId: sourceTrackId,
          isSourceTrack: false,
        },
      },
      update: {
        spotifyId,
        updatedAt: new Date(),
      },
      create: {
        trackId: sourceTrackId,
        spotifyId,
        isSourceTrack: false,
        score,
      },
    });
  }
}
