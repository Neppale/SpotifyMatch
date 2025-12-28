import { Injectable } from '@nestjs/common';
import { PrismaService } from '@Prisma/services/prisma.service';
import { Prisma } from '@PrismaClient';

@Injectable()
export class ProfileRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async upsertProfile(
    profileId: string,
    spotifyIds: string[],
    snapshotId: string,
  ): Promise<void> {
    const trackVariants = await this.prismaService
      .getClient()
      .trackVariant.findMany({
        where: {
          spotifyId: {
            in: spotifyIds,
          },
        },
        select: { id: true },
      });

    const variantIds = trackVariants.map((tv) => tv.id);

    await this.prismaService.getClient().profile.upsert({
      where: { id: profileId },
      update: {
        snapshotId,
        updatedAt: new Date(),
      },
      create: {
        id: profileId,
        snapshotId,
      },
    });

    await this.updateProfileLibrary(profileId, variantIds);
  }

  private async updateProfileLibrary(
    profileId: string,
    variantIds: string[],
  ): Promise<void> {
    await this.prismaService.getClient().profile.update({
      where: { id: profileId },
      data: {
        TrackVariants: {
          set: variantIds.map((id) => ({
            id,
          })),
        },
      },
    });
  }

  async findProfileWithLibrary(
    profileId: string,
    snapshotId: string,
  ): Promise<{
    id: string;
    snapshotId: string;
    tracks: {
      trackId: string;
      artist: string;
      artistId: string;
      title: string;
      album: string;
      releaseDate: string;
      durationMs: number;
      trackVariantId: string;
    }[];
  }> {
    const profileData = await this.prismaService.getClient().profile.findFirst({
      where: {
        id: profileId,
        snapshotId,
      },
      include: {
        TrackVariants: {
          include: { Track: true },
        },
      },
    });

    if (!profileData) return null;

    return {
      id: profileData.id,
      snapshotId: profileData.snapshotId,
      tracks: profileData.TrackVariants.map((variant) => ({
        trackId: variant.trackId,
        artist: variant.Track.artist,
        artistId: variant.Track.artistId,
        title: variant.Track.title,
        album: variant.Track.album,
        releaseDate: variant.Track.releaseDate,
        durationMs: variant.Track.durationMs,
        trackVariantId: variant.id,
      })),
    };
  }
}
