import { describe, it, expect, beforeAll } from "vitest";
import { login } from "../helpers/auth.js";
import { createComposer } from "../helpers/composer.js";
import { assertStatus } from "../helpers/assert.js";

describe("🎻 Music Composers API", () => {
  let token: string;

  // Preparation
  beforeAll(async () => {
    token = await login("user2@test.com", "password123");
  });

  it("should successfully create Mozart", async () => {
    const res = await createComposer(
      {
        name: "Mozart4",
        epoch: "Classic",
        uploadFile: "",
        isVerified: true,
      },
      token,
    );

    // Personal helper
    // assertStatus("Creation Mozart", res, 201);

    // Assertion Vitest
    expect(res.status).toBe(201);
  });
});
