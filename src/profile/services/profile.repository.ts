import { Injectable } from '@nestjs/common';
import { PrismaService } from '@Prisma/services/prisma.service';
import { Prisma } from '@PrismaClient';

@Injectable()
export class ProfileRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async upsertManyProfiles(
    profiles: Array<{
      profileId: string;
      spotifyIds: string[];
      snapshotId: string;
    }>,
  ): Promise<void> {
    if (!profiles.length) return;

    // Fetch all unique spotifyIds across all profiles
    const allSpotifyIds = Array.from(
      new Set(profiles.flatMap((p) => p.spotifyIds)),
    );

    const trackVariants = await this.prismaService
      .getClient()
      .trackVariant.findMany({
        where: {
          spotifyId: {
            in: allSpotifyIds,
          },
        },
        select: { id: true, spotifyId: true },
      });

    // Map spotifyId -> variant id
    const spotifyIdToVariantId = new Map<string, string>(
      trackVariants.map((tv) => [tv.spotifyId, tv.id]),
    );

    // Upsert all profiles in parallel
    await Promise.all(
      profiles.map(async ({ profileId, snapshotId }) => {
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
      }),
    );

    // Update profile libraries
    const libraries = profiles.map((p) => ({
      profileId: p.profileId,
      variantIds: p.spotifyIds.map((spotifyId) =>
        spotifyIdToVariantId.get(spotifyId),
      ),
    }));
    await this.updateManyProfileLibraries(libraries);
  }

  private async updateManyProfileLibraries(
    profileVariants: Array<{ profileId: string; variantIds: string[] }>,
  ): Promise<void> {
    await Promise.all(
      profileVariants.map(async ({ profileId, variantIds }) => {
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
      }),
    );
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
