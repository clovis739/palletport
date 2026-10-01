import assert from "node:assert/strict";
import { connectionUrl, readWithConnectionRetry } from "../src/lib/db-connection";

async function main() {
  const url = new URL(connectionUrl("postgresql://user:password@example.neon.tech/db?sslmode=require")!);
  assert.equal(url.searchParams.get("connect_timeout"), "20");
  assert.equal(url.searchParams.get("pool_timeout"), "20");
  assert.equal(url.searchParams.get("sslmode"), "require");
  assert.equal(new URL(connectionUrl("postgresql://user:password@example.neon.tech/db?connect_timeout=40")!).searchParams.get("connect_timeout"), "40");
  const failure = Object.assign(new Error("connection failed"), { code: "P1001" });
  let calls = 0;
  const noWait = async () => {};
  const result = await readWithConnectionRetry("findUnique", async () => {
    if (++calls === 1) throw failure;
    return "recovered";
  }, noWait);
  assert.equal(result, "recovered");
  assert.equal(calls, 2);
  for (const operation of ["create", "update", "delete", "$executeRaw"]) {
    calls = 0;
    await assert.rejects(readWithConnectionRetry(operation, async () => { calls++; throw failure; }, noWait));
    assert.equal(calls, 1, `${operation} must never be retried`);
  }
  calls = 0;
  await assert.rejects(readWithConnectionRetry("findMany", async () => { calls++; throw failure; }, noWait));
  assert.equal(calls, 2, "Persistent connection failure must stop after one retry");
  calls = 0;
  await assert.rejects(readWithConnectionRetry("findMany", async () => { calls++; throw Object.assign(new Error("bad query"), { code: "P2002" }); }, noWait));
  assert.equal(calls, 1, "Other errors must not be retried");
  console.log("Connection timeout and retry checks passed.");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
