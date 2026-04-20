// --------------------------------------------------------------------------------
// HELPERS
// --------------------------------------------------------------------------------

// --------------------------------------------------------------------------------
// Simple CLI test assertion helper
//
// → Validates HTTP response status against an expected value
// → Prints formatted output to stdout (success) or stderr (failure)
// → On failure, displays error details and terminates the process with exit code 1
// → Designed for command-line automated API testing (Node.js)
// --------------------------------------------------------------------------------

// --------------------------------------------------------------------------------
// TYPES
// --------------------------------------------------------------------------------

type HttpResponse<T = unknown> = {
  status: number;
  data: T;
};

// --------------------------------------------------------------------------------
// Internal
// --------------------------------------------------------------------------------

function prettyPrint(data: unknown) {
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

// --------------------------------------------------------------------------------
// assertStatus
// --------------------------------------------------------------------------------

function assertStatus<T = unknown>(
  label: string,
  res: HttpResponse<T>,
  expected: number,
): void {
  const { status, data: body } = res;

  if (status === expected) {
    console.log(`✅ [PASS] ${label} (Status: ${status})`);

    if (body !== undefined && body !== null) {
      prettyPrint(body);
    }
  } else {
    console.error(`❌ [FAIL] ${label}`);
    console.error(`   Expected: ${expected} | Received: ${status}`);

    if (body !== undefined && body !== null) {
      console.error("   Error Details:");
      prettyPrint(body);
    }

    console.error(`🛑 Aborting tests due to failure in: ${label}`);
    process.exit(1);
  }
}

// --------------------------------------------------------------------------------
// EXPORT (ESM)
// --------------------------------------------------------------------------------

export { assertStatus };
export type { HttpResponse };
