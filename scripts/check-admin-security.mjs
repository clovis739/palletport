import assert from "node:assert/strict";
import Module, { createRequire } from "node:module";
import { SignJWT } from "jose";

// Isolated fixtures: no real credentials, database queries or account mutations.
process.env.AUTH_SECRET = "admin-security-test-secret-only-never-use-in-production";
process.env.FORCE_HTTPS = "0";
delete process.env.MAINTENANCE_MODE;
const require = createRequire(import.meta.url);
const { NextRequest } = require("next/server");
const { unstable_doesMiddlewareMatch } = require("next/experimental/testing/server");
const { middleware, config } = require("../src/middleware.ts");
const { signSession, verifySession } = require("../src/lib/session.ts");
const { can, PERMS } = require("../src/lib/permissions.ts");

let checks = 0;
const check = (value, message) => { assert.ok(value, message); checks++; };
const tokens = {};
for (const role of ["ADMIN", "MANAGER", "EDITOR", "BUYER", "SELLER", "UNKNOWN"]) {
  tokens[role] = await signSession({ userId: "fixture-user", role, name: "Fixture" });
}
const request = (path, token) => new NextRequest(`https://example.test${path}`, {
  headers: token ? { cookie: `pp_session=${token}` } : {},
});

for (const path of ["/dashboard", "/dashboard/staff", "/dashboard/orders/export", "/dashboard/lots/fixture.css"]) {
  check(unstable_doesMiddlewareMatch({ config, url: `https://example.test${path}` }), `Middleware must match ${path}`);
  for (const token of [undefined, "forged", ...["BUYER", "SELLER", "UNKNOWN"].map(role => tokens[role])]) {
    const res = await middleware(request(path, token));
    check(res.status === 404, `Non-staff must get 404: ${path}`);
    check(new URL(res.headers.get("x-middleware-rewrite")).pathname === "/__not-found", "Generic not-found response");
    check(!res.headers.has("location"), "Never advertise admin in login redirects");
    check(res.headers.get("cache-control") === "private, no-store", "Private responses cannot be cached");
  }
}
for (const role of ["ADMIN", "MANAGER", "EDITOR"]) {
  const res = await middleware(request("/dashboard", tokens[role]));
  check(res.headers.get("x-middleware-next") === "1", `${role} passes optimistic gate`);
  check(res.headers.get("x-robots-tag").includes("noindex"), "Staff responses excluded from indexing");
}
for (const role of ["BUYER", "SELLER", "UNKNOWN"]) {
  check(PERMS.every(perm => !can(role, perm)), `${role} has no privileged permissions`);
}
check(!can("MANAGER", "staff") && !can("EDITOR", "orders"), "Staff permissions remain limited");

process.env.MAINTENANCE_MODE = "1";
process.env.MAINTENANCE_BYPASS = "fixture-maintenance-bypass";
check((await middleware(request("/dashboard?bypass=fixture-maintenance-bypass", tokens.BUYER))).status === 404,
  "Maintenance bypass cannot unlock admin");
const cart = await middleware(request("/cart?bypass=fixture-maintenance-bypass"));
check(cart.status === 307 && new URL(cart.headers.get("location")).pathname === "/login",
  "Maintenance bypass cannot unlock buyer authentication");
const home = await middleware(request("/?bypass=fixture-maintenance-bypass"));
check(home.cookies.has("pp_bypass"), "Authorized maintenance bypass still works on public pages");
delete process.env.MAINTENANCE_MODE;

const key = new TextEncoder().encode(process.env.AUTH_SECRET);
for (const payload of [{ role: "ADMIN", name: "Fixture" }, { userId: {}, role: "ADMIN", name: "Fixture" }]) {
  const token = await new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setExpirationTime("1h").sign(key);
  check(await verifySession(token) === null, "Reject signed tokens with malformed identity claims");
}
const expired = await new SignJWT({ userId: "fixture-user", role: "ADMIN", name: "Fixture" })
  .setProtectedHeader({ alg: "HS256" }).setExpirationTime(1).sign(key);
check(await verifySession(expired) === null, "Reject expired staff sessions");
check((await middleware(request("/dashboard", expired))).status === 404, "Expired staff cannot enter admin");
const wrongAlgorithm = await new SignJWT({ userId: "fixture-user", role: "ADMIN", name: "Fixture" })
  .setProtectedHeader({ alg: "HS384" }).setExpirationTime("1h").sign(key);
check(await verifySession(wrongAlgorithm) === null, "Reject unexpected signing algorithms");

// Exercise the actual server guards using fixture cookies and current database roles.
let currentRole = "BUYER";
let currentToken = tokens.ADMIN; // Simulates a demoted admin's still-valid cookie.
let storeReads = 0;
const dbPath = require.resolve("../src/lib/db.ts");
const load = Module._load;
Module._load = function (id, parent, isMain) {
  if (id === "server-only") return {};
  if (id === "next/headers") return { cookies: async () => ({ get: () => currentToken ? { value: currentToken } : undefined }) };
  if (id === "next/navigation") return {
    notFound: () => { throw new Error("fixture-404"); },
    forbidden: () => { throw new Error("fixture-403"); },
    redirect: () => { throw new Error("unexpected-redirect"); },
  };
  if (Module._resolveFilename(id, parent) === dbPath) return { db: {
    user: { findUnique: async () => currentRole ? { id: "fixture-user", role: currentRole, name: "Fixture" } : null },
    seller: { findFirst: async () => { storeReads++; return { id: "fixture-store" }; } },
  } };
  return load.call(this, id, parent, isMain);
};
try {
  const { requireStaff, requireAdmin } = require("../src/lib/auth.ts");
  for (const role of ["BUYER", "SELLER", "UNKNOWN", null]) {
    currentRole = role;
    await assert.rejects(requireStaff("orders"), /fixture-404/); checks++;
    await assert.rejects(requireAdmin(), /fixture-404/); checks++;
  }
  currentToken = undefined;
  await assert.rejects(requireStaff(), /fixture-404/); checks++;
  check(storeReads === 0, "Denied users never read store data");
  currentToken = tokens.ADMIN;
  currentRole = "EDITOR";
  await assert.rejects(requireStaff("orders"), /fixture-403/); checks++;
  currentRole = "MANAGER";
  await assert.rejects(requireAdmin(), /fixture-403/); checks++;
  currentRole = "ADMIN";
  check((await requireAdmin()).user.role === "ADMIN", "Current owner can access owner functions");
  currentRole = "MANAGER";
  check((await requireStaff("orders")).user.role === "MANAGER", "Current manager can access permitted functions");
} finally {
  Module._load = load;
}
console.log(`Admin security: ${checks} checks passed (no live database or account changes).`);
