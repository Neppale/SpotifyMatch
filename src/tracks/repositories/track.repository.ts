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
    spotifyIds: string[],
    score: number,
    popularity: number,
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
              popularity,
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
    popularity: number,
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
        popularity,
      },
      create: {
        trackId: sourceTrackId,
        spotifyId,
        isSourceTrack: false,
        score,
        popularity,
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
}
