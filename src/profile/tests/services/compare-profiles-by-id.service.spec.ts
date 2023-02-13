import { CompareProfilesByIdService } from '../../../profile/services/compare-profiles-by-id.service';
import { FindPlaylistIdsByUserIdServiceSpy } from '../../../playlist/tests/spy/services/find-playlist-ids-by-user-id.service.spy';
import { FindMinimizedTrackServiceSpy } from '../../../tracks/tests/spy/services/find-minimized-track.service.spy';
import { ValidateProfileByIdServiceSpy } from '../spy/services/validate-profile-by-id.service.spy';
import { FindTrackIdsByPlaylistIdsServiceSpy } from '../../../playlist/tests/spy/services/find-track-ids-by-playlist-ids.service.spy';
import { FindSimilarTracksServiceSpy } from '../../../tracks/tests/spy/services/find-similar-tracks.service.spy';
import {
  ProfileComparison,
  Verdict,
} from '../../../profile/models/profile-comparison.model';
type SutOutput = {
  sut: CompareProfilesByIdService;
  findPlaylistIdsByIdService: FindPlaylistIdsByUserIdServiceSpy;
  findTrackIdsByPlaylistIdsService: FindTrackIdsByPlaylistIdsServiceSpy;
  findSimilarTracksService: FindSimilarTracksServiceSpy;
  findMinimizedTrackService: FindMinimizedTrackServiceSpy;
  validateProfileByIdService: ValidateProfileByIdServiceSpy;
};

const makeSut = (): SutOutput => {
  const findPlaylistIdsByIdService = new FindPlaylistIdsByUserIdServiceSpy();
  const findTrackIdsByPlaylistIdsService =
    new FindTrackIdsByPlaylistIdsServiceSpy();
  const findSimilarTracksService = new FindSimilarTracksServiceSpy();
  const findMinimizedTrackService = new FindMinimizedTrackServiceSpy();
  const validateProfileByIdService = new ValidateProfileByIdServiceSpy();
  const sut = new CompareProfilesByIdService(
    findPlaylistIdsByIdService,
    findTrackIdsByPlaylistIdsService,
    findSimilarTracksService,
    findMinimizedTrackService,
    validateProfileByIdService,
  );
  return {
    sut,
    findPlaylistIdsByIdService,
    findTrackIdsByPlaylistIdsService,
    findSimilarTracksService,
    findMinimizedTrackService,
    validateProfileByIdService,
  };
};

describe('CompareProfilesByIdService', () => {
  describe('compare', () => {
    it('should throw if firstProfile is not provided', async () => {
      const { sut } = makeSut();
      const promise = sut.compare({
        firstProfile: '',
        secondProfile: 'any_id',
        advanced: false,
      });
      await expect(promise).rejects.toThrow('Missing profile id');
    });

    it('should throw if secondProfile is not provided', async () => {
      const { sut } = makeSut();
      const promise = sut.compare({
        firstProfile: 'any_id',
        secondProfile: '',
        advanced: false,
      });
      await expect(promise).rejects.toThrow('Missing profile id');
    });

    it('should throw if firstProfile is invalid', async () => {
      const { sut, validateProfileByIdService } = makeSut();
      validateProfileByIdService.response = false;
      const promise = sut.compare({
        firstProfile: 'invalid_id',
        secondProfile: 'any_id',
        advanced: false,
      });
      await expect(promise).rejects.toThrow('First profile id is invalid');
    });

    it('should throw if secondProfile is invalid', async () => {
      const { sut, validateProfileByIdService } = makeSut();
      validateProfileByIdService.secondResponse = false;
      const promise = sut.compare({
        firstProfile: 'any_id',
        secondProfile: 'invalid_id',
        advanced: false,
      });
      await expect(promise).rejects.toThrow('Second profile id is invalid');
    });

    it('should call findPlaylistIdsByIdService.find twice', async () => {
      const { sut, findPlaylistIdsByIdService } = makeSut();
      const firstProfile = 'any_id';
      const secondProfile = 'other_id';
      await sut.compare({
        firstProfile,
        secondProfile,
        advanced: false,
      });
      expect(findPlaylistIdsByIdService.count).toBe(2);
    });

    it('should call findTrackIdsByPlaylistIdsService.find twice', async () => {
      const {
        sut,
        findTrackIdsByPlaylistIdsService: findPlaylistTracksByIdService,
      } = makeSut();
      const firstProfile = 'any_id';
      const secondProfile = 'other_id';
      await sut.compare({
        firstProfile,
        secondProfile,
        advanced: false,
      });
      expect(findPlaylistTracksByIdService.count).toBe(2);
    });

    it('should call findSimilarTracksService.find once when advanced is true', async () => {
      const { sut, findSimilarTracksService } = makeSut();
      const firstProfile = 'any_id';
      const secondProfile = 'other_id';
      await sut.compare({
        firstProfile,
        secondProfile,
        advanced: true,
      });
      expect(findSimilarTracksService.findCount).toBe(1);
    });

    it('should call findMinimizedTrackService.find for each track', async () => {
      const {
        sut,
        findMinimizedTrackService,
        findTrackIdsByPlaylistIdsService,
      } = makeSut();
      const firstProfile = 'any_id';
      const secondProfile = 'other_id';
      findTrackIdsByPlaylistIdsService.response = ['any_track_id'];
      await sut.compare({
        firstProfile,
        secondProfile,
        advanced: true,
      });
      expect(findMinimizedTrackService.count).toBe(1);
    });

    it('should return a profileComparison object', async () => {
      const { sut, findSimilarTracksService } = makeSut();
      const expectedResponse: ProfileComparison = {
        matches: [],
        percentage: 0,
        sameTracks: 0,
        totalTracks: 0,
        verdict: Verdict.NO_MATCH,
        probableMatches: [],
        totalProbableMatches: 0,
      };
      findSimilarTracksService.findResponse = [];

      const response = await sut.compare({
        firstProfile: 'any_id',
        secondProfile: 'other_id',
        advanced: true,
      });

      expect(response).toEqual(expectedResponse);
    });
  });
});
