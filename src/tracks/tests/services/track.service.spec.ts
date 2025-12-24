import { TrackService } from '@Tracks/services/track.service';
import { AuthService } from '@Utils/auth/services/auth.service';
import { TrackRepository } from '@Tracks/repositories/track.repository';
import axios from 'axios';
import { DetailedTrack } from '@Tracks/models/detailed-track.model';
import {
  DETAILED_TRACK_MOCK,
  TRACK_MOCK,
} from '@Tracks/tests/models/track.mock';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

type SutOutput = {
  sut: TrackService;
  authService: jest.Mocked<AuthService>;
  trackRepository: jest.Mocked<TrackRepository>;
};

const makeSut = (): SutOutput => {
  const authService = {
    requestWithAuth: jest.fn(),
    getAccessToken: jest.fn(),
    invalidateToken: jest.fn(),
  } as unknown as jest.Mocked<AuthService>;

  const trackRepository = {
    createMany: jest.fn(),
  } as unknown as jest.Mocked<TrackRepository>;

  const sut = new TrackService(authService, trackRepository);
  return { sut, authService, trackRepository };
};

const mockDetailedTrack = {
  id: 'track123',
  name: 'Test Track',
  artists: [{ id: 'artist123', name: 'Test Artist' }],
  album: {
    name: 'Test Album',
    release_date: '2023-01-01',
  },
  duration_ms: 180000,
  href: 'https://api.spotify.com/v1/tracks/track123',
};

describe('TrackService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a Track object with correct data', async () => {
    const { sut, authService } = makeSut();
    const trackId = 'track123';

    authService.requestWithAuth.mockResolvedValue({
      data: mockDetailedTrack,
    } as any);

    const result = await sut.getTrack(trackId);

    expect(authService.requestWithAuth).toHaveBeenCalledTimes(1);
    expect(result).toEqual(
      expect.objectContaining({
        id: 'track123',
        spotifyId: 'track123',
        artist: 'Test Artist',
        title: 'Test Track',
        album: 'Test Album',
        releaseDate: '2023-01-01',
        durationMs: 180000,
      }),
    );
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it('should call authService.requestWithAuth with correct URL', async () => {
    const { sut, authService } = makeSut();
    const trackId = 'track123';

    authService.requestWithAuth.mockResolvedValue({
      data: mockDetailedTrack,
    } as any);

    await sut.getTrack(trackId);

    expect(authService.requestWithAuth).toHaveBeenCalledWith(
      expect.any(Function),
    );
    const requestFn = authService.requestWithAuth.mock.calls[0][0];
    const mockToken = 'Bearer token123';
    await requestFn(mockToken);

    expect(mockedAxios.get).toHaveBeenCalledWith(
      `https://api.spotify.com/v1/tracks/${trackId}`,
      {
        headers: {
          Authorization: mockToken,
        },
      },
    );
  });

  it('should return similar tracks when tracks match by artist and other criteria', async () => {
    const { sut, authService, trackRepository } = makeSut();
    const firstProfileTrackIds = ['track1'];
    const secondProfileTrackIds = ['track2'];

    const mockTrack1 = DETAILED_TRACK_MOCK;
    const mockTrack2 = DETAILED_TRACK_MOCK;

    mockTrack1.href = 'https://api.spotify.com/v1/tracks/track1';
    mockTrack2.href = 'https://api.spotify.com/v1/tracks/track2';

    mockTrack1.id = 'track1';
    mockTrack2.id = 'track2';

    authService.requestWithAuth
      .mockResolvedValueOnce([mockTrack1])
      .mockResolvedValueOnce([mockTrack2]);

    trackRepository.createMany.mockResolvedValue(undefined);

    const result = await sut.getSimilarTracks(
      firstProfileTrackIds,
      secondProfileTrackIds,
    );

    expect(result).toHaveLength(1);
    expect(result[0].spotifyId).toBe('track1');
  });

  it('should return empty array when no similar tracks found', async () => {
    const { sut, authService, trackRepository } = makeSut();
    const firstProfileTrackIds = ['track1'];
    const secondProfileTrackIds = ['track2'];

    const mockTrack1: any = {
      id: 'track1',
      name: 'Track 1',
      artists: [{ id: 'artist1', name: 'Artist 1' }],
      album: { name: 'Album 1', release_date: '2023-01-01' },
      duration_ms: 180000,
      href: 'https://api.spotify.com/v1/tracks/track1',
    };

    const mockTrack2: any = {
      id: 'track2',
      name: 'Track 2',
      artists: [{ id: 'artist2', name: 'Artist 2' }],
      album: { name: 'Album 2', release_date: '2023-02-01' },
      duration_ms: 200000,
      href: 'https://api.spotify.com/v1/tracks/track2',
    };

    authService.requestWithAuth
      .mockResolvedValueOnce({
        data: { tracks: [mockTrack1] },
      } as any)
      .mockResolvedValueOnce({
        data: { tracks: [mockTrack2] },
      } as any);

    trackRepository.createMany.mockResolvedValue(undefined);

    const result = await sut.getSimilarTracks(
      firstProfileTrackIds,
      secondProfileTrackIds,
    );

    expect(result).toEqual([]);
    expect(trackRepository.createMany).toHaveBeenCalledWith([]);
  });

  it('should handle tracks with missing artist name gracefully', async () => {
    const { sut, authService, trackRepository } = makeSut();
    const firstProfileTrackIds = ['track1'];
    const secondProfileTrackIds = ['track2'];

    const mockTrack1: any = {
      id: 'track1',
      name: 'Track 1',
      artists: [],
      album: { name: 'Album 1', release_date: '2023-01-01' },
      duration_ms: 180000,
      href: 'https://api.spotify.com/v1/tracks/track1',
    };

    const mockTrack2: any = {
      id: 'track2',
      name: 'Track 2',
      artists: [{ id: 'artist2', name: 'Artist 2' }],
      album: { name: 'Album 2', release_date: '2023-02-01' },
      duration_ms: 200000,
      href: 'https://api.spotify.com/v1/tracks/track2',
    };

    authService.requestWithAuth
      .mockResolvedValueOnce({
        data: { tracks: [mockTrack1] },
      } as any)
      .mockResolvedValueOnce({
        data: { tracks: [mockTrack2] },
      } as any);

    trackRepository.createMany.mockResolvedValue(undefined);

    const result = await sut.getSimilarTracks(
      firstProfileTrackIds,
      secondProfileTrackIds,
    );

    expect(result).toEqual([]);
  });

  it('should batch track requests in groups of 50', async () => {
    const { sut, authService } = makeSut();
    const trackIds = Array.from({ length: 75 }, (_, i) => `track${i}`);

    authService.requestWithAuth.mockResolvedValue({
      data: { tracks: [] },
    } as any);

    await sut.getSimilarTracks(trackIds, []);

    expect(authService.requestWithAuth).toHaveBeenCalledTimes(2);
  });

  it('should return track IDs from playlists', async () => {
    const { sut, authService } = makeSut();
    const playlistIds = ['playlist1', 'playlist2'];

    const mockPlaylistResponse1 = {
      data: {
        tracks: {
          items: [
            {
              track: {
                href: 'https://api.spotify.com/v1/tracks/track1',
              },
            },
            {
              track: {
                href: 'https://api.spotify.com/v1/tracks/track2',
              },
            },
          ],
        },
      },
    };

    const mockPlaylistResponse2 = {
      data: {
        tracks: {
          items: [
            {
              track: {
                href: 'https://api.spotify.com/v1/tracks/track3',
              },
            },
          ],
        },
      },
    };

    authService.requestWithAuth
      .mockResolvedValueOnce(mockPlaylistResponse1 as any)
      .mockResolvedValueOnce(mockPlaylistResponse2 as any);

    const result = await sut.getTrackIdsByPlaylistIds(playlistIds);

    expect(result).toEqual(['track1', 'track2', 'track3']);
    expect(authService.requestWithAuth).toHaveBeenCalledTimes(2);
  });

  it('should return empty array when playlists have no tracks', async () => {
    const { sut, authService } = makeSut();
    const playlistIds = ['playlist1'];

    authService.requestWithAuth.mockResolvedValue({
      data: {
        tracks: {
          items: [],
        },
      },
    } as any);

    const result = await sut.getTrackIdsByPlaylistIds(playlistIds);

    expect(result).toEqual([]);
  });

  it('should filter out null or undefined track hrefs', async () => {
    const { sut, authService } = makeSut();
    const playlistIds = ['playlist1'];

    authService.requestWithAuth.mockResolvedValue({
      data: {
        tracks: {
          items: [
            {
              track: {
                href: 'https://api.spotify.com/v1/tracks/track1',
              },
            },
            {
              track: null,
            },
            {
              track: {
                href: null,
              },
            },
          ],
        },
      },
    } as any);

    const result = await sut.getTrackIdsByPlaylistIds(playlistIds);

    expect(result).toEqual(['track1']);
  });

  it('should handle multiple playlists correctly', async () => {
    const { sut, authService } = makeSut();
    const playlistIds = ['playlist1', 'playlist2', 'playlist3'];

    authService.requestWithAuth.mockResolvedValue({
      data: {
        tracks: {
          items: [
            {
              track: {
                href: 'https://api.spotify.com/v1/tracks/track1',
              },
            },
          ],
        },
      },
    } as any);

    const result = await sut.getTrackIdsByPlaylistIds(playlistIds);

    expect(result).toHaveLength(3);
    expect(authService.requestWithAuth).toHaveBeenCalledTimes(3);
  });
});
