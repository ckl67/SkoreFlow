// --------------------------------------------------------------------------------
// HELPERS
// --------------------------------------------------------------------------------

import { API_URL } from "../config.js";

import { assertStatus } from "./assert.js";
import { createReadStream } from "node:fs";
import FormData from "form-data";
import { request } from "./api.js";

// --------------------------------------------------------------------------------
// createsheet
// --------------------------------------------------------------------------------
//
//	File            *multipart.FileHeader `form:"uploadFile"`
//	Composer        string                `form:"composer"`
//	SheetName       string                `form:"sheetName"`
//	ReleaseDate     string                `form:"releaseDate"`
//	Categories      string                `form:"categories"`
//	Tags            string                `form:"tags"`
//	InformationText string                `form:"informationText"`
//
//
//    createsheet({
//      name: "mozart",
//      externalURL: "https://fr.wikipedia.org/wiki/mozart",
//      epoch: "Moderne",
//      uploadFile: "resources/sheets/mozart.png",
//      isVerified: true},
//      TOKEN
//    );
// --------------------------------------------------------------------------------

// --------------------------------------------------------------------------------
// TYPES
// --------------------------------------------------------------------------------

interface RequestOptions {
  uploadFile: string;
  composer?: string;
  sheetName: string;
  releaseDate?: string;
  categories?: string;
  tags?: string;
  informationText?: string;
}

// --------------------------------------------------------------------------------
// createsheet
// --------------------------------------------------------------------------------
async function createsheet(
  {
    sheetName,
    releaseDate,
    categories,
    tags,
    informationText,
    uploadFile,
    composer,
  }: RequestOptions,
  token: string,
  expected = 201,
) {
  const form = new FormData();

  if (sheetName) form.append("sheetName", sheetName);
  if (releaseDate) form.append("releaseDate", releaseDate);
  if (categories) form.append("categories", categories);
  if (tags) form.append("tags", tags);
  if (informationText) form.append("informationText", informationText);
  if (composer) form.append("composer", composer);
  if (uploadFile) form.append("uploadFile", createReadStream(uploadFile));

  console.log(
    `\n Creating sheet: ${sheetName} (File: ${uploadFile || "None"})`,
  );

  const res = await request("POST", `${API_URL}/sheets/upload`, {
    token,
    data: form,
    headers: form.getHeaders(),
  });

  assertStatus(`Create sheet: ${sheetName}`, res, expected);
}

// --------------------------------------------------------------------------------
// EXPORT (ESM)
// --------------------------------------------------------------------------------

export { createsheet };
