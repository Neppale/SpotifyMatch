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
        id: { in: spotifyIds },
      },
      include: {
        Track: true,
      },
    });
  }

  async upsertTrackWithVariants(
    trackData: Prisma.TrackCreateInput,
    variants: Prisma.TrackVariantCreateWithoutTrackInput[],
  ): Promise<Prisma.TrackGetPayload<{ include: { TrackVariant: true } }>> {
    const track = await this.prismaService.getClient().track.upsert({
      where: { id: trackData.id ?? '' },
      create: {
        album: trackData.album,
        artist: trackData.artist,
        artistId: trackData.artistId,
        title: trackData.title,
        releaseDate: trackData.releaseDate,
        durationMs: trackData.durationMs,
      },
      update: {
        album: trackData.album,
        artist: trackData.artist,
        artistId: trackData.artistId,
        title: trackData.title,
        releaseDate: trackData.releaseDate,
        durationMs: trackData.durationMs,
      },
    });

    const createdVariants: TrackVariant[] = [];
    for (const variant of variants) {
      const createdVariant = await this.prismaService
        .getClient()
        .trackVariant.upsert({
          where: {
            id: variant.id,
          },
          create: {
            id: variant.id,
            trackId: track.id,
            isSourceTrack: variant.isSourceTrack,
            score: variant.score,
            popularity: variant.popularity,
          },
          update: {
            isSourceTrack: variant.isSourceTrack,
            score: variant.score,
            popularity: variant.popularity,
            trackId: track.id,
          },
        });
      createdVariants.push(createdVariant);
    }

    return {
      ...track,
      TrackVariant: createdVariants,
    };
  }

  async findTracksByArtistId(
    artistId: string,
  ): Promise<Prisma.TrackVariantGetPayload<{ include: { Track: true } }>[]> {
    const allTracks = await this.prismaService.getClient().track.findMany({
      where: {
        artistId: artistId,
      },
      include: {
        TrackVariant: true,
      },
    });

    return allTracks.flatMap((track) =>
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

  async updateVariantTrackId(
    variantId: string,
    newTrackId: string,
  ): Promise<void> {
    await this.prismaService.getClient().trackVariant.update({
      where: { id: variantId },
      data: { trackId: newTrackId },
    });
  }

  async deleteTrack(trackId: string): Promise<void> {
    await this.prismaService.getClient().track.delete({
      where: { id: trackId },
    });
  }
}
