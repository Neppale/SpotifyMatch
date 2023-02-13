# SpotifyMatch

[![Testing workflow](https://github.com/Neppale/SpotifyMatch/actions/workflows/testing.yaml/badge.svg?branch=develop)](https://github.com/Neppale/SpotifyMatch/actions/workflows/testing.yaml)

SpotifyMatch is a Spotify profile comparison API that allows users to compare their Spotify profiles to see how compatible they are when it comes to their music. The API has one endpoint: `/compare`.

## Request

### Endpoint

`POST /compare`

### Body

The body of the request should contain the following properties:

- `firstProfile` (required): the Spotify id of the first profile.
- `secondProfile` (required): the Spotify id of the second profile.
- `advanced` (optional): a boolean to indicate if the API should find similar tracks instead of just strictly equal tracks. If not provided, the API will assume advanced is false.

### Response

The API returns a JSON object with the following properties:

- `sameTracks`: the number of tracks that are the same between the two profiles.
- `totalTracks`: the total number of tracks in both profiles.
- `percentage`: the percentage of tracks that are the same.
- `matches`: an array of minimized tracks that are the same between the two profiles.
- `probableMatches` (optional): an array of minimized tracks that are likely to be the same between the two profiles, if advanced is set to true.
- `totalProbableMatches` (optional): the total number of probable matches, if advanced is set to true.
- `verdict`: a string value indicating the overall compatibility of the two profiles, based on the value of percentage. The possible values are:
  - Perfect Match!: if percentage is equal to 100.
  - Good Match!: if percentage is between 81 and 99.
  - Bad Match!: if percentage is between 50 and 80.
  - No Match!: if percentage is below 50.

## Types

The API uses the following types:

### ProfileComparison

The type of the response object.

```
interface ProfileComparison {
sameTracks: number;
totalTracks: number;
percentage: number;
matches: MinimizedTrack[];
probableMatches?: MinimizedTrack[];
totalProbableMatches?: number;
verdict: Verdict;
}
```

### MinimizedTrack

A minimized track representation that contains only the necessary information for comparison.

```
interface MinimizedTrack {
  artistId: string;
  artist: string;
  track: string;
  album: string;
  releaseDate: string;
  length: number;
  href: string;
}
```

### Verdict

An enum with the following values:

```
enum Verdict {
PERFECT_MATCH = 'Perfect Match!',
GOOD_MATCH = 'Good Match!',
BAD_MATCH = 'Bad Match!',
NO_MATCH = 'No Match!',
}
```
