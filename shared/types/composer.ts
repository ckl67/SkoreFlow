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

export type CreateComposerPayload = {
  name: string;
  externalURL?: string;
  epoch?: string;
};

export type CreateComposerResponse = {
  message: string;
  id: number;
};

// ---------------------------

export type ComposerPublicResponse = {
  id: number;
  name: string;
  picture: string;
  external_url: string;
  epoch: string;
  isVerified: boolean;
};

// ---------------------------

export type GetComposersPageRequest = {
  page?: number;
  limit?: number;
  sort?: string;
  name?: string;
  isVerified?: boolean;
};

export type GetComposersPageResponse = {
  message: string;
  limit: number;
  page: number;
  sort?: string;
  total_rows: number;
  total_pages: number;
  composers: ComposerPublicResponse[];
};

// ---------------------------

export type GetComposersResponse = {
  message: string;
  composer: ComposerPublicResponse;
};

// ---------------------------

export type UpdateComposerRequestPayload = {
  externalURL?: string;
  epoch?: string;
  isVerified?: boolean;
};

export type UpdateComposerResponse = {
  message: string;
  composer: ComposerPublicResponse;
};
