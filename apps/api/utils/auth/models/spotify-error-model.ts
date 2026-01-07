export interface SpotifyError {
  error: ErrorDetails;
}

interface ErrorDetails {
  status: number;
  message: string;
}
