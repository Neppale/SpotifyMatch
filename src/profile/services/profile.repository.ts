import { Injectable } from '@nestjs/common';
import { PrismaService } from '@Prisma/services/prisma.service';

@Injectable()
export class ProfileRepository {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Upsert profile and attach TrackVariants via ProfileLibrary.
   * @param profileId string - Spotify user id
   * @param spotifyIds string[] - Spotify track ids (used for TrackVariant)
   * @param snapshotId string - Spotify snapshot id
   */
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
        ProfileLibrary: {
          deleteMany: {},
          create: variantIds.map((trackVariantId) => ({
            trackVariant: {
              connect: { id: trackVariantId },
            },
          })),
        },
      },
      create: {
        id: profileId,
        snapshotId,
        ProfileLibrary: {
          create: variantIds.map((trackVariantId) => ({
            trackVariant: {
              connect: { id: trackVariantId },
            },
          })),
        },
      },
    });
  }
}
