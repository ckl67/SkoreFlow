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
