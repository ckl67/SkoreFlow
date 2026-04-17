const { request } = require("../helpers/api");
const { assertStatus } = require("../helpers/assert");

// --------------------------------------------------------------------------------
// BASIC SMOKE TESTS
// --------------------------------------------------------------------------------

async function run() {
  console.log("\n--- [MODULE: BASICS / SMOKE TESTS] ---");

  // 1. Health Check
  let res = await request("GET", "http://localhost:8080/health");
  assertStatus("Server Health Check", res, 200);

  // 2. Version Check
  res = await request("GET", "http://localhost:8080/version");
  assertStatus("Server Version Info", res, 200);

  // 3. API Root Check
  res = await request("GET", "http://localhost:8080/api");
  assertStatus("API Base Endpoint", res, 200);

  console.log("✨ Basics verified. Environment is healthy.");
}

run().catch((err) => {
  console.error("💥 ERROR:", err.message);
  process.exit(1);
});
