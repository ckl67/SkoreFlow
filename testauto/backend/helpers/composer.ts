// --------------------------------------------------------------------------------
// HELPERS
// --------------------------------------------------------------------------------

import { API_URL } from "../config.js";

import { assertStatus } from "./assert.js";
import { createReadStream } from "node:fs";
import FormData from "form-data";
import { request } from "./api.js";

// --------------------------------------------------------------------------------
// createComposer
// --------------------------------------------------------------------------------
//
//  Go Form
//	  Name        string                `form:"name"`
//	  ExternalURL string                `form:"externalURL"`
//	  Epoch       string                `form:"epoch"`
//	  File        *multipart.FileHeader `form:"uploadFile"`
//	  IsVerified  *bool                 `form:"isVerified"`
//
//  Example Curl
//    curl -X POST http://localhost:8080/api/composers/upload \
//      -H "Authorization: Bearer $TOKEN_USER2" \
//      -F "name=Beethoven" \
//      -F "epoch=Classical" \
//      -F "uploadFile=@resources/composers/Beethoven.png"
//
//    createComposer({
//      name: "Supertramp",
//      externalURL: "https://fr.wikipedia.org/wiki/Supertramp",
//      epoch: "Moderne",
//      uploadFile: "resources/composers/Supertramp.png",
//      isVerified: true},
//      TOKEN
//    );
// --------------------------------------------------------------------------------

// --------------------------------------------------------------------------------
// TYPES
// --------------------------------------------------------------------------------
interface RequestOptions {
  name?: string;
  externalURL?: string;
  epoch?: string;
  uploadFile?: string;
  isVerified?: boolean;
}

// --------------------------------------------------------------------------------
// createComposer
// --------------------------------------------------------------------------------
async function createComposer(
  { name, externalURL, epoch, uploadFile, isVerified }: RequestOptions,
  token: string,
  expected = 201,
) {
  const form = new FormData();

  if (name) form.append("name", name);
  if (externalURL) form.append("externalURL", externalURL);
  if (epoch) form.append("epoch", epoch);
  if (isVerified !== undefined) form.append("isVerified", String(isVerified));
  if (uploadFile) form.append("uploadFile", createReadStream(uploadFile));

  console.log(`\n Creating Composer: ${name} (File: ${uploadFile || "None"})`);

  const res = await request("POST", `${API_URL}/composers/upload`, {
    token,
    data: form,
    headers: form.getHeaders(),
  });

  assertStatus(`Create Composer: ${name}`, res, expected);
}

// --------------------------------------------------------------------------------
// EXPORT (ESM)
// --------------------------------------------------------------------------------

export { createComposer };
