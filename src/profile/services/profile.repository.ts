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
        ProfileLibrary: {
          deleteMany: {},
          connect: variantIds.map((id) => ({
            id,
          })),
        },
      },
      create: {
        id: profileId,
        snapshotId,
        ProfileLibrary: {
          connect: variantIds.map((id) => ({
            id,
          })),
        },
      },
    });
  }

  async findProfileWithLibrary(
    profileId: string,
    snapshotId: string,
  ): Promise<Prisma.ProfileGetPayload<{
    include: {
      ProfileLibrary: {
        include: {
          trackVariant: {
            include: { Track: true };
          };
        };
      };
    };
  }> | null> {
    return await this.prismaService.getClient().profile.findFirst({
      where: {
        id: profileId,
        snapshotId: snapshotId,
      },
      include: {
        ProfileLibrary: {
          include: {
            trackVariant: {
              include: {
                Track: true,
              },
            },
          },
        },
      },
    });
  }
}
