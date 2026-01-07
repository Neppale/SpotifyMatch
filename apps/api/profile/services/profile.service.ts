import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import axios from 'axios';
import crypto from 'crypto';
import { AuthService } from '@Utils/auth/services/auth.service';
import { TracksApiService } from '@Apps/api/tracks/tracks-api.service';
import { ProfileSharedRepository } from '@Apps/shared/profile/profile-shared.repository';
import { ProfilePlaylistData } from '@Apps/api/profile/models/profile-playlist-data.model';
import { CompareProfileDto } from '@Apps/api/profile/models/compare-profile.dto';
import { Response } from 'express';
import { ProfileComparer } from '@Apps/shared/profile/services/profile-comparer.service';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);
  private readonly url = 'https://api.spotify.com/v1/users/';

  constructor(
    private readonly authService: AuthService,
    private readonly trackService: TracksApiService,
    private readonly profileRepository: ProfileSharedRepository,
    @InjectQueue('process_tracks') private readonly processTracksQueue: Queue,
    private readonly profileComparer: ProfileComparer,
  ) {}

  async findPlaylists(
    profileId: string,
  ): Promise<{ playlistId: string; snapshotId: string }[]> {
    const response = await this.authService.requestWithAuth(async (token) => {
      return await axios.get(`${this.url}${profileId}/playlists`, {
        headers: {
          Authorization: token,
        },
      });
    });

    const playlistData: ProfilePlaylistData = response.data;
    if (!playlistData.items) return [];

    const playlists: { playlistId: string; snapshotId: string }[] =
      playlistData.items.map((item) => ({
        playlistId: item.id,
        snapshotId: item.snapshot_id,
      }));

    return playlists;
  }

  async compareProfiles(
    context: Response,
    { firstProfile, secondProfile }: CompareProfileDto,
    sessionId: string,
  ): Promise<void> {
    const [firstProfilePlaylists, secondProfilePlaylists] = await Promise.all([
      this.findPlaylists(firstProfile),
      this.findPlaylists(secondProfile),
    ]);

    const firstProfileSnapshotId = this.buildSnapshotId(
      firstProfilePlaylists
        .map((p) => p.snapshotId)
        .sort()
        .join('-'),
    );
    const secondProfileSnapshotId = this.buildSnapshotId(
      secondProfilePlaylists
        .map((p) => p.snapshotId)
        .sort()
        .join('-'),
    );

    const [firstProfileData, secondProfileData] = await Promise.all([
      this.profileRepository.findProfileWithLibrary(
        firstProfile,
        firstProfileSnapshotId,
      ),
      this.profileRepository.findProfileWithLibrary(
        secondProfile,
        secondProfileSnapshotId,
      ),
    ]);

    if (!firstProfileData || !secondProfileData) {
      const [firstProfileTrackIds, secondProfileTrackIds] = await Promise.all([
        this.trackService.getTrackIdsByPlaylistIds(
          firstProfilePlaylists.map((playlist) => playlist.playlistId),
        ),
        this.trackService.getTrackIdsByPlaylistIds(
          secondProfilePlaylists.map((playlist) => playlist.playlistId),
        ),
      ]);

      await this.sendProfileDataToProcess(sessionId, [
        {
          profileId: firstProfile,
          spotifyIds: firstProfileTrackIds,
          snapshotId: firstProfileSnapshotId,
        },
        {
          profileId: secondProfile,
          spotifyIds: secondProfileTrackIds,
          snapshotId: secondProfileSnapshotId,
        },
      ]);

      context.status(202).send({
        sessionId,
      });
      return;
    }

    const formattedResponse = this.profileComparer.compare(
      firstProfileData.tracks,
      secondProfileData.tracks,
    );

    context.status(200).send(formattedResponse);
  }

  private buildSnapshotId(snapshotIds: string): string {
    return crypto.createHash('md5').update(snapshotIds).digest('hex');
  }

  async sendProfileDataToProcess(
    sessionId: string,
    profiles: {
      spotifyIds: string[];
      snapshotId: string;
      profileId: string;
    }[],
  ): Promise<void> {
    await this.processTracksQueue.add('process_profiles', {
      sessionId,
      profiles,
    });

    this.logger.log(
      `Sent profiles ${profiles.map((p) => p.profileId).join(', ')} to process_tracks queue for session ${sessionId}`,
    );
  }
}
