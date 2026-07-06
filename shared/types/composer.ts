// We will externalize file
// So business model (name, epoch, externalURL) remains shared,
// whilst the technical representation of the file
// is environment-specific.
// ==========
// React:
// ==========
// createComposer(
//    payload: CreateComposerPayload,
//    file: File,
// )
// ==========
// Vitest:
// ==========
// createComposer(
//     payload: CreateComposerPayload,
//     filePath: string,
// )

export interface CreateComposerPayload {
  name: string;
  externalURL?: string;
  epoch?: string;
}

export interface CreateComposerResponse {
  message: string;
}

// ---------------------------

export interface ComposerPublicResponse {
  id: number;
  name: string;
  picture_path: string;
  external_url: string;
  epoch: string;
  isVerified: boolean;
}

// ---------------------------

export interface GetComposersPageRequest {
  page?: number;
  limit?: number;
  sort?: string;
  name?: string;
  isVerified?: boolean;
}

export interface GetComposersPageResponse {
  message: string;
  limit: number;
  page: number;
  sort?: string;
  total_rows: number;
  total_pages: number;
  composers: ComposerPublicResponse[];
}

// ---------------------------

export interface GetComposersResponse {
  message: string;
  composer: ComposerPublicResponse;
}
