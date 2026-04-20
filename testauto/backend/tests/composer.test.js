const { API_URL } = require("../config");

const { request } = require("../helpers/api");
const { assertStatus } = require("../helpers/assert");
const { login } = require("../helpers/auth");

const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

// --------------------------------------------------------------------------------
// MAIN TEST
// --------------------------------------------------------------------------------
// async meaning that it returns a Promise because we are using : await
async function run() {
  console.log("\n=================================");
  console.log("🚀 STARTING COMPOSER TESTS (Node)");
  console.log("=================================");

  // ----------------------------------------------------------------------------

  // ----------------------------------------------------------------------------
  // CREATE USERS
  // ----------------------------------------------------------------------------
  console.log("\n--- Creating Composers ---");

  const TOKEN_USER2 = await login("user2@test.com", "password123");

  const composers = [
    {
      name: "Mozart3",
      description: "Clasique",
      file: "",
    },
    {
      name: "Beethoven",
      description: "du Vingtième Siècle ",
      file: "resources/composers/Beethoven.png",
    },
    {
      name: "SuperTramp",
      description: "Moderne",
      file: "resources/composers/Supertramp.png",
    },
  ];

  for (const c of composers) {
    await createComposer({
      name: c.name,
      externalURL: "",
      epoch: c.description,
      uploadFile: c.file,
      isVerified: false,
      token: TOKEN_USER2,
    });
  }
}

run().catch((err) => {
  console.error("💥 ERROR:", err.message);
  process.exit(1);
});
