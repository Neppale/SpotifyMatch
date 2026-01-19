import { Injectable } from '@nestjs/common';
import { PrismaService } from '@Apps/shared/prisma/services/prisma.service';

@Injectable()
export class ProfileSharedRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async upsertManyProfiles(
    profiles: Array<{
      profileId: string;
      spotifyIds: string[];
      snapshotId: string;
    }>,
  ): Promise<void> {
    if (!profiles.length) return;

    const allSpotifyIds = Array.from(
      new Set(profiles.flatMap((p) => p.spotifyIds)),
    );

    const trackVariants = await this.prismaService
      .getClient()
      .trackVariant.findMany({
        where: {
          id: {
            in: allSpotifyIds,
          },
        },
        select: { id: true },
      });

    const spotifyIdToVariantId = new Map<string, string>(
      trackVariants.map((tv) => [tv.id, tv.id]),
    );

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
    await this.prismaService.getClient().$transaction(async (prisma) => {
      await Promise.all(
        profileVariants.map(async ({ profileId, variantIds }) => {
          const profile = await prisma.profile.findUnique({
            where: { id: profileId },
            select: { trackVariants: { select: { id: true } } },
          });
          const currentVariantIds = new Set(
            (profile?.trackVariants ?? []).map((tv) => tv.id),
          );
          const newVariantIds = new Set(variantIds);

          const variantIdsToConnect = [...newVariantIds].filter(
            (id) => !currentVariantIds.has(id) && !!id,
          );
          const variantIdsToDisconnect = [...currentVariantIds].filter(
            (id) => !newVariantIds.has(id) && !!id,
          );

          await prisma.profile.update({
            where: { id: profileId },
            data: {
              trackVariants: {
                connect: variantIdsToConnect.map((id) => ({ id })),
                disconnect: variantIdsToDisconnect.map((id) => ({ id })),
              },
            },
          });
        }),
      );
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
      imageUrl: string | null;
    }[];
  }> {
    const profileData = await this.prismaService.getClient().profile.findFirst({
      where: {
        id: profileId,
        snapshotId,
      },
      include: {
        trackVariants: {
          include: { Track: true },
        },
      },
    });

    if (!profileData) return null;

    return {
      id: profileData.id,
      snapshotId: profileData.snapshotId,
      tracks: profileData.trackVariants.map((variant) => ({
        trackId: variant.trackId,
        artist: variant.Track.artist,
        artistId: variant.Track.artistId,
        title: variant.Track.title,
        album: variant.Track.album,
        releaseDate: variant.Track.releaseDate,
        durationMs: variant.Track.durationMs,
        trackVariantId: variant.id,
        imageUrl: variant.imageUrl,
      })),
    };
  }
}
