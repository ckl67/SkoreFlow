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
  filePath: string;
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
  searchMode?: string;
  name?: string;
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

export type DeleteScoreRequest = {
  scoreId: number;
};

export type DeleteScoreResponse = {
  message: string;
};

// ---------------------------

export type UpdateScoreRequestPayload = {
  scoreName?: string;
  composerId?: number;
  releaseDate?: string;
  categories?: string;
  tags?: string;
  informationText?: string;
};

export type UpdateScoreResponse = {
  message: string;
  score: ScorePublicResponse;
};

// ---------------------------

// ---------------------------

export type Annotation = {
  id: string;
  page: number;
  type: string; // type: 'circle' | 'line' | 'highlight' | 'text';
  textContent: string;
  geometry: {
    x1: number; // Centre (circle), top-left corner (rectangle), or starting point (arrow)
    y1: number; // Centre (circle), top-left corner (rectangle), or starting point (arrow)
    radius?: number; // Only for the circle
    width?: number; // Only for the rectangle
    height?: number; // Only for the rectangle
    x2?: number; // Only for the arrow (end point X)
    y2?: number; // Only for the arrow (end point Y)
  };
  style: {
    color: string;
    strokeWidth: number;
    fontSize?: number;
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
