import { Injectable } from '@nestjs/common';
import { PrismaService } from '@Prisma/services/prisma.service';
import { Prisma, TrackVariant, Track } from '@PrismaClient';

@Injectable()
export class TrackRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async getTracksBySpotifyId(
    spotifyIds: string[],
  ): Promise<Prisma.TrackVariantGetPayload<{ include: { Track: true } }>[]> {
    return await this.prismaService.getClient().trackVariant.findMany({
      where: {
        spotifyId: { in: spotifyIds },
      },
      include: {
        Track: true,
      },
    });
  }

  async upsertTrackVariant(
    trackId: string,
    spotifyId: string,
    isSourceTrack: boolean,
    popularity: number,
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
        popularity,
      },
      create: {
        trackId,
        spotifyId,
        isSourceTrack,
        score,
        popularity,
      },
    });
  }

  async createSourceTrackWithVariants(
    trackData: Prisma.TrackCreateWithoutTrackVariantInput,
    variantData: Prisma.TrackVariantCreateWithoutTrackInput[],
  ): Promise<Track> {
    const track = await this.prismaService
      .getClient()
      .$transaction(async (tx) => {
        const track = await tx.track.create({
          data: {
            album: trackData.album,
            artist: trackData.artist,
            artistId: trackData.artistId,
            title: trackData.title,
            releaseDate: trackData.releaseDate,
            durationMs: trackData.durationMs,
          },
        });
        for (const variant of variantData) {
          await tx.trackVariant.create({
            data: {
              trackId: track.id,
              spotifyId: variant.spotifyId,
              isSourceTrack: variant.isSourceTrack,
              score: variant.score,
              popularity: variant.popularity,
            },
          });
        }
        return track;
      });

    return track;
  }

  async createVariantForSourceTrack(
    sourceTrackId: string,
    variantData: Prisma.TrackVariantCreateWithoutTrackInput,
  ): Promise<TrackVariant> {
    const existingVariant = await this.prismaService
      .getClient()
      .trackVariant.findFirst({
        where: {
          trackId: sourceTrackId,
          spotifyId: variantData.spotifyId,
        },
      });

    if (existingVariant) {
      return await this.prismaService.getClient().trackVariant.update({
        where: { id: existingVariant.id },
        data: {
          popularity: variantData.popularity,
          score: variantData.score,
          updatedAt: new Date(),
        },
      });
    }

    return await this.prismaService.getClient().trackVariant.create({
      data: {
        trackId: sourceTrackId,
        spotifyId: variantData.spotifyId,
        isSourceTrack: false,
        score: variantData.score,
        popularity: variantData.popularity,
      },
    });
  }

  async findTracksByNormalizedArtist(
    normalizedArtist: string,
  ): Promise<Prisma.TrackVariantGetPayload<{ include: { Track: true } }>[]> {
    const allTracks = await this.prismaService.getClient().track.findMany({
      include: {
        TrackVariant: true,
      },
    });

    return allTracks
      .filter((track) => track.artist.toUpperCase() === normalizedArtist)
      .flatMap((track) =>
        track.TrackVariant.map((variant) => ({
          ...variant,
          Track: track,
        })),
      );
  }

  async findTrackWithVariantsById(
    trackId: string,
  ): Promise<Prisma.TrackGetPayload<{
    include: { TrackVariant: true };
  }> | null> {
    return await this.prismaService.getClient().track.findUnique({
      where: { id: trackId },
      include: { TrackVariant: true },
    });
  }
}
