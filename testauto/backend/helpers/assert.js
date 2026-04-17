// Simple CLI test assertion helper
//
// → Validates HTTP response status against an expected value
// → Prints formatted output to stdout (success) or stderr (failure)
// → On failure, displays error details and terminates the process with exit code 1
// → Designed for command-line automated API testing (Node.js)

function prettyPrint(data) {
  if (!data) return;

  try {
    if (typeof data === "object") {
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(data);
    }
  } catch {
    console.log(data);
  }
}

function assertStatus(label, res, expected) {
  const status = res.status;
  const body = res.data;

  if (status === expected) {
    console.log(`✅ [PASS] ${label} (Status: ${status})`);

    if (body) {
      prettyPrint(body);
    }
  } else {
    console.error(`❌ [FAIL] ${label}`);
    console.error(`   Expected: ${expected} | Received: ${status}`);

    if (body) {
      console.error("   Error Details:");
      prettyPrint(body);
    }

    console.error(`🛑 Aborting tests due to failure in: ${label}`);
    process.exit(1);
  }
}

module.exports = {
  assertStatus,
};
