import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { AuthService } from '@Utils/auth/services/auth.service';
import { TrackService } from '@Tracks/services/track.service';
import { ProfileComparisonFormattedResponse } from '@Profile/models/profile-comparison.model';
import { Track } from 'generated/prisma';
import { ProfilePlaylistData } from '@Profile/models/profile-playlist-data.model';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);
  private readonly url = 'https://api.spotify.com/v1/users/';
  private readonly trackService: TrackService;

  constructor(
    private readonly authService: AuthService,
    trackService: TrackService,
  ) {
    this.trackService = trackService;
  }

  async findPlaylists(profileId: string): Promise<string[]> {
    const response = await this.authService.requestWithAuth(async (token) => {
      return await axios.get(`${this.url}${profileId}/playlists`, {
        headers: {
          Authorization: token,
        },
      });
    });

    const playlistData: ProfilePlaylistData = response.data;
    if (!playlistData.items) return [];

    const playlistHrefs: string[] = playlistData.items.map(
      (item) => item.tracks.href,
    );

    playlistHrefs.forEach((href, index) => {
      playlistHrefs[index] = href.replace(
        'https://api.spotify.com/v1/playlists/',
        '',
      );
      playlistHrefs[index] = playlistHrefs[index].replace('/tracks', '');
    });

    return playlistHrefs;
  }

  async validateProfile(profileId: string): Promise<void> {
    try {
      await this.authService.requestWithAuth(async (token) => {
        return await axios.get(`${this.url}${profileId}`, {
          headers: {
            Authorization: token,
          },
        });
      });
    } catch (error) {
      throw new BadRequestException(`Invalid profile ID: ${profileId}`);
    }
  }

  async compareProfiles(
    firstProfileId: string,
    secondProfileId: string,
    advanced = false,
  ): Promise<ProfileComparisonFormattedResponse> {
    if (!firstProfileId || !secondProfileId) {
      throw new BadRequestException('Missing profile id');
    }

    await Promise.all([
      this.validateProfile(firstProfileId),
      this.validateProfile(secondProfileId),
    ]);

    this.logger.log(
      `Comparing profiles: ${firstProfileId} and ${secondProfileId} with advanced parameter set to ${advanced}`,
    );

    const [firstProfilePlaylistIds, secondProfilePlaylistIds] =
      await Promise.all([
        this.findPlaylists(firstProfileId),
        this.findPlaylists(secondProfileId),
      ]);

    const [firstProfileTrackIds, secondProfileTrackIds] = await Promise.all([
      this.trackService.getTrackIdsByPlaylistIds(firstProfilePlaylistIds),
      this.trackService.getTrackIdsByPlaylistIds(secondProfilePlaylistIds),
    ]);

    const [firstProfileTrackIdsSet, secondProfileTrackIdsSet] = [
      new Set(firstProfileTrackIds),
      new Set(secondProfileTrackIds),
    ];

    const sameTracks = new Set<string>();
    const smallerSet =
      firstProfileTrackIdsSet.size <= secondProfileTrackIdsSet.size
        ? firstProfileTrackIdsSet
        : secondProfileTrackIdsSet;
    const largerSet =
      smallerSet === firstProfileTrackIdsSet
        ? secondProfileTrackIdsSet
        : firstProfileTrackIdsSet;
    for (const track of smallerSet) {
      if (largerSet.has(track)) {
        sameTracks.add(track);
      }
    }

    const remainingFirstProfileTracks = [...firstProfileTrackIdsSet].filter(
      (currentTrack) => !sameTracks.has(currentTrack),
    );
    const remainingSecondProfileTracks = [...secondProfileTrackIdsSet].filter(
      (currentTrack) => !sameTracks.has(currentTrack),
    );

    const probableMatches = advanced
      ? await this.trackService.getSimilarTracks(
          remainingFirstProfileTracks,
          remainingSecondProfileTracks,
        )
      : undefined;

    const totalTracks =
      firstProfileTrackIdsSet.size +
      secondProfileTrackIdsSet.size -
      sameTracks.size;
    const percentage =
      totalTracks === 0
        ? 0
        : Math.round(
            ((sameTracks.size + (probableMatches?.length || 0)) / totalTracks) *
              100,
          );

    const matches: Track[] = [];
    const trackPromises = [];
    for (const track of sameTracks) {
      const promise = this.trackService.getTrack(track);
      trackPromises.push(promise);
    }
    const tracks = await Promise.all(trackPromises);
    matches.push(...tracks);

    const formattedResponse: ProfileComparisonFormattedResponse = {
      message: this.getMessage(
        percentage,
        totalTracks,
        matches.length,
        probableMatches?.length,
      ),
      callToAction: 'Listen to your compatible tracks',
      similarTracks: probableMatches,
      exactTracks: matches,
    };

    this.logger.log(
      `Profiles ${firstProfileId} and ${secondProfileId} have a ${percentage}% match with ${
        sameTracks.size
      } same tracks and ${probableMatches?.length || 0} probable matches`,
    );

    return formattedResponse;
  }

  private getMessage(
    percentage: number,
    totalTracks: number,
    exactTracks: number,
    similarTracks: number,
  ): string {
    const reactionMessage = this.getReactionMessage(percentage);
    const analysisMessage = `I analyzed ${totalTracks} tracks and found ${exactTracks} exact matches and ${similarTracks} probable matches between you two!`;
    const callToAction = 'Listen to your compatible tracks';
    return `${reactionMessage}\n${analysisMessage}\n${callToAction}`;
  }

  private getReactionMessage(percentage: number): string {
    // TODO: Build this later to gather AI generated reaction messages based on the most popular song they have in common. Just for funsies :)
    switch (percentage) {
      case 100:
        return 'You only listen to the same tracks! You are a perfect match!';
      case 80:
        return 'You gotta feel that heat, baby! Here are your results:';
      case 50:
        return 'You have some stuff in common, but are pretty different overall. Here are your results:';
      default:
        return 'Yeah, I think this one is a no-go. Sorry about that, but here are your results:';
    }
  }
}
