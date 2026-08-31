// We will externalize file
// So business model (name, epoch, externalURL) remains shared,
// whilst the technical representation of the file
// is environment-specific.
// ==========
// React:
// ==========
// createScore(
//    payload: CreateScorePayload,
//    file: File,
// )
// ==========
// Vitest:
// ==========
// createScore(
//     payload: CreateScorePayload,
//     filePath: string,
// )

export type CreateScorePayload = {
  composerId: number;
  scoreName: string;
  releaseDate?: string;
  categories?: string;
  tags?: string;
  informationText?: string;
  annotations?: string;
};

export type CreateScoreResponse = {
  message: string;
  id: number;
};

// ---------------------------

export type ScorePublicResponse = {
  id: number;
  name: string;
  composerId: number;
  scoreName: string;
  releaseDate: string;
  tags: string;
  categories: string;
  informationText: string;
  annotations: string;
};

// ---------------------------

export type GetScoresPageRequest = {
  page?: number;
  limit?: number;
  sort?: string;
  name?: string;
};

export type GetScoresPageResponse = {
  message: string;
  limit: number;
  page: number;
  sort?: string;
  total_rows: number;
  total_pages: number;
  scores: ScorePublicResponse[];
};

// ---------------------------

export type GetScoresResponse = {
  message: string;
  score: ScorePublicResponse;
};

// ---------------------------

export type UpdateScoreRequestPayload = {
  externalURL?: string;
  epoch?: string;
  isVerified?: boolean;
};

export type UpdateScoreResponse = {
  message: string;
  score: ScorePublicResponse;
};
