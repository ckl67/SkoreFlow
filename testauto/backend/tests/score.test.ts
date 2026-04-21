import { login } from "../helpers/auth.js";
import { createScore } from "../helpers/score.js";

// --------------------------------------------------------------------------------
// MAIN TEST
// --------------------------------------------------------------------------------
// async meaning that it returns a Promise because we are using : await
async function run() {
  console.log("\n=================================");
  console.log("🚀 STARTING score TESTS (Node)");
  console.log("=================================");

  // ----------------------------------------------------------------------------
  //await sleep(2000);

  // ----------------------------------------------------------------------------
  // CREATE USERS
  // ----------------------------------------------------------------------------
  console.log("\n--- Creating scores ---");

  const TOKEN_USER2 = await login("user2@test.com", "password123");

  const scores = [
    {
      name: "Mozart3",
      description: "Classic",
      file: "",
    },
    {
      name: "Beethoven",
      description: "twenty century ",
      file: "resources/scores/Beethoven.png",
    },
    {
      name: "SuperTramp",
      description: "Moderne",
      file: "resources/scores/Supertramp.png",
    },
  ];

  for (const c of scores) {
    /** await createScore(
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
