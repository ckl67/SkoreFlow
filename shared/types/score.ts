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

import { ComposerPublicResponse } from './composer';

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
// Must correspond 100% to the dto !
export type ScorePublicResponse = {
  id: number;
  name: string;
  composerId: number;
  composer: ComposerPublicResponse;
  releaseDate: string;
  filepath: string;
  thumbnailPath: string;
  uploaderId: number;
  tags: string;
  categories: string;
  informationText: string;
  annotations: string;
  createdAt: string;
  updatedAt: string;
  isDemo: boolean;
};

// ---------------------------

export type GetScoresPageRequest = {
  page?: number;
  limit?: number;
  sort?: string;
  name?: string;
  search?: string;
  composer?: string;
  tag?: string;
  category?: string;
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

export type GetScoreRequest = {
  scoreId: number;
};

export type GetScoreResponse = {
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

// ---------------------------

export type Annotation = {
  id: string;
  page: number;
  type: string;
  geometry: {
    x: number;
    y: number;
    radius?: number;
    width?: number;
    height?: number;
  };
  style: {
    color: string;
    strokeWidth: number;
    opacity?: number;
  };
};

export type UpdateScoreAnnotationRequest = {
  scoreId: number;
  annotations: Annotation[];
};

export type UpdateScoreAnnotationResponse = {
  message: string;
};

// ---------------------------
