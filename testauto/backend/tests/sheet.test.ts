import { login } from "../helpers/auth.js";
import { createsheet } from "../helpers/sheet.js";

// --------------------------------------------------------------------------------
// MAIN TEST
// --------------------------------------------------------------------------------
// async meaning that it returns a Promise because we are using : await
async function run() {
  console.log("\n=================================");
  console.log("🚀 STARTING sheet TESTS (Node)");
  console.log("=================================");

  // ----------------------------------------------------------------------------
  //await sleep(2000);

  // ----------------------------------------------------------------------------
  // CREATE USERS
  // ----------------------------------------------------------------------------
  console.log("\n--- Creating sheets ---");

  const TOKEN_USER2 = await login("user2@test.com", "password123");

  const sheets = [
    {
      name: "Mozart3",
      description: "Classic",
      file: "",
    },
    {
      name: "Beethoven",
      description: "twenty century ",
      file: "resources/sheets/Beethoven.png",
    },
    {
      name: "SuperTramp",
      description: "Moderne",
      file: "resources/sheets/Supertramp.png",
    },
  ];

  for (const c of sheets) {
    /** await createsheet(
      {
        name: c.name,
        externalURL: "",
        epoch: c.description,
        uploadFile: c.file,
        isVerified: false,
      },
      TOKEN_USER2,
    );
     */
  }
}

run().catch((err) => {
  console.error("💥 ERROR:", err.message);
  process.exit(1);
});
