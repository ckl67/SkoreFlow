import fs from "fs";
import axios from "axios";
import FormData from "form-data";

import { API_URL } from "../config";

import { request } from "../helpers/api";
import { assertStatus } from "../helpers/assert";
import { login } from "../helpers/auth";
import { createUser, updateUser, getUserIdByEmail } from "../helpers/user";

import { API_URL } from "../config";
const ENABLE_PW_RESET = process.env.TEST_PASSWORD_RESET === "true";

interface TestUser {
  email: string;
  role: number;
  verified: boolean;
}

// --------------------------------------------------------------------------------
// MAIN TEST
// --------------------------------------------------------------------------------
// async meaning that it returns a Promise because we are using : await
async function run() {
  console.log("\n==============================");
  console.log("🚀 STARTING USER TESTS (Node)");
  console.log("==============================");
  // ----------------------------------------------------------------------------
  // ADMIN LOGIN
  // ----------------------------------------------------------------------------
  const TOKEN_ADMIN = await login("admin@admin.com", "skoreflow");
  console.log("✅ Admin logged in");

  // ----------------------------------------------------------------------------
  // CREATE USERS
  // ----------------------------------------------------------------------------
  console.log("\n--- Creating users ---");

  const users: TestUser[] = [
    { email: "user1@test.com", role: 0, verified: true },
    { email: "user2@test.com", role: 1, verified: true },
    { email: "user3@test.com", role: 0, verified: false },
  ];

  for (const u of users) {
    await createUser({ email: u.email, password: "password123" }, TOKEN_ADMIN);
  }

  console.log("\n--- Update users ---");

  for (const u of users) {
    const id = await getUserIdByEmail(u.email, TOKEN_ADMIN);

    await updateUser(
      id,
      {
        username: u.email.split("@")[0],
        password: "password123",
        role: u.role,
        isVerified: u.verified,
      },
      TOKEN_ADMIN,
    );
  }

  // ----------------------------------------------------------------------------
  // LIST USERS
  // ----------------------------------------------------------------------------
  let res = await request("GET", `${API_URL}/admin/users`, {
    token: TOKEN_ADMIN,
  });
  assertStatus("List Users", res, 200);

  // ----------------------------------------------------------------------------
  // SECURITY TESTS
  // ----------------------------------------------------------------------------
  console.log("\n--- Security tests ---");

  res = await request("GET", `${API_URL}/admin/users`);
  assertStatus("Admin without token", res, 401);

  const TOKEN_USER1 = await login("user1@test.com", "password123");

  res = await request("GET", `${API_URL}/admin/users`, {
    token: TOKEN_USER1,
  });
  assertStatus("User accessing admin route", res, 403);

  // ----------------------------------------------------------------------------
  // PROFILE
  // ----------------------------------------------------------------------------
  console.log("\n--- Profile tests ---");

  res = await request("GET", `${API_URL}/me`, {
    token: TOKEN_USER1,
  });
  assertStatus("Get Profile", res, 200);

  res = await request("PUT", `${API_URL}/me`, {
    token: TOKEN_USER1,
    data: { username: "UpdatedUser1" },
  });
  assertStatus("Update Profile", res, 200);

  // ----------------------------------------------------------------------------
  // AVATAR
  // ----------------------------------------------------------------------------
  console.log("\n--- Avatar upload ---");

  const form = new FormData();
  form.append("avatar", fs.createReadStream("./resources/avatars/user.png"));

  res = await request("POST", `${API_URL}/me/avatar`, {
    token: TOKEN_USER1,
    data: form,
    headers: form.getHeaders(),
  });

  assertStatus("Upload Avatar", res, 200);
  // ----------------------------------------------------------------------------
  // ADMIN OPERATIONS
  // ----------------------------------------------------------------------------
  console.log("\n--- Admin operations ---");

  res = await request("GET", `${API_URL}/admin/users`, {
    token: TOKEN_ADMIN,
  });

  const firstUserId = res.data[0].id;

  res = await request("GET", `${API_URL}/admin/users/${firstUserId}`, {
    token: TOKEN_ADMIN,
  });
  assertStatus("Get User", res, 200);

  res = await request("PUT", `${API_URL}/admin/users/${firstUserId}`, {
    token: TOKEN_ADMIN,
    data: { username: "AdminUpdated" },
  });
  assertStatus("Update User", res, 200);

  res = await request("DELETE", `${API_URL}/admin/users/${firstUserId}`, {
    token: TOKEN_ADMIN,
  });
  assertStatus("Delete User (should fail)", res, 400);

  // ----------------------------------------------------------------------------
  // DELETE UNVERIFIED
  // ----------------------------------------------------------------------------
  const email4 = "user4@test.com";

  await createUser(email4, "password123", TOKEN_ADMIN);
  const id4 = await getUserIdByEmail(email4, TOKEN_ADMIN);

  await updateUser(id4, "user4", 0, false, TOKEN_ADMIN);

  res = await request("DELETE", `${API_URL}/admin/users/${id4}`, {
    token: TOKEN_ADMIN,
  });
  assertStatus("Delete unverified user", res, 200);

  // ----------------------------------------------------------------------------
  // PASSWORD RESET
  // ----------------------------------------------------------------------------
  console.log(`ENABLE_PW_RESET boolean value = ${ENABLE_PW_RESET}`);

  if (ENABLE_PW_RESET) {
    console.log("\n--- Password reset ---");

    const EMAIL_RESET = "user2@test.com";

    res = await request("POST", `${API_URL}/password/forgot`, {
      data: { email: EMAIL_RESET },
    });
    assertStatus("Password forgot", res, 200);

    try {
      const resetToken = await getResetToken(EMAIL_RESET, TOKEN_ADMIN);

      res = await request("POST", `${API_URL}/password/reset`, {
        data: {
          token: resetToken,
          password: "NewPassword123!",
        },
      });
      assertStatus("Password reset", res, 200);
    } catch (err) {
      console.error("🛑 Aborting tests due to failure in getResetToken");
      console.error(err.message);
      process.exit(1);
    }
  } else {
    console.info("skipp Reset Password test");
  }

  // ----------------------------------------------------------------------------
  // REGISTER FLOW
  // ----------------------------------------------------------------------------
  console.log("\n--- Register flow ---");

  if (ENABLE_PW_RESET) {
    const EMAIL_REGISTER = "register@test.com";

    res = await request("POST", `${API_URL}/register`, {
      data: {
        username: "register",
        email: EMAIL_REGISTER,
        password: "password123",
      },
    });
    assertStatus("Register", res, 201);

    try {
      const regToken = await getResetToken(EMAIL_REGISTER, TOKEN_ADMIN);

      res = await request("POST", `${API_URL}/register/confirm`, {
        data: { token: regToken },
      });
      assertStatus("Confirm Register", res, 200);

      res = await request("POST", `${API_URL}/register/rqconfirm`, {
        data: { email: EMAIL_REGISTER },
      });
      assertStatus("Request confirm again", res, 200);
    } catch (err) {
      console.error("🛑 Aborting tests due to failure in getResetToken");
      console.error(err.message);
      process.exit(1);
    }
  } else {
    console.info("skipp Reset Password test");
  }

  console.log("\n==============================");
  console.log("✅ ALL USER TESTS PASSED");
  console.log("==============================");
}

run().catch((err) => {
  console.error("💥 ERROR:", err.message);
  process.exit(1);
});
