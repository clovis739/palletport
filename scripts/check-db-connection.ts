import assert from "node:assert/strict";
import { connectionUrl, readWithConnectionRetry } from "../src/lib/db-connection";

async function main() {
  const url = new URL(connectionUrl("postgresql://user:password@example.neon.tech/db?sslmode=require")!);
  assert.equal(url.searchParams.get("connect_timeout"), "20");
  assert.equal(url.searchParams.get("pool_timeout"), "20");
  assert.equal(url.searchParams.get("sslmode"), "require");
  assert.equal(url.searchParams.get("max_idle_connection_lifetime"), "60");
  assert.equal(new URL(connectionUrl("postgresql://user:password@example.neon.tech/db?connect_timeout=40")!).searchParams.get("connect_timeout"), "40");
  let calls = 0;
  const noWait = async () => {};
  for (const code of ["P1001", "P1002", "P1017", "P2024"]) {
    const failure = Object.assign(new Error("connection failed"), { code });
    calls = 0;
    const result = await readWithConnectionRetry("findUnique", async () => {
      if (++calls === 1) throw failure;
      return "recovered";
    }, noWait);
    assert.equal(result, "recovered");
    assert.equal(calls, 2);
    for (const operation of ["create", "update", "delete", "upsert", "$executeRaw"]) {
      calls = 0;
      await assert.rejects(readWithConnectionRetry(operation, async () => { calls++; throw failure; }, noWait));
      assert.equal(calls, 1, `${operation} must never be retried for ${code}`);
    }
    calls = 0;
    await assert.rejects(readWithConnectionRetry("findMany", async () => { calls++; throw failure; }, noWait));
    assert.equal(calls, 2, `${code} must stop after one retry`);
  }
  calls = 0;
  await assert.rejects(readWithConnectionRetry("findMany", async () => { calls++; throw Object.assign(new Error("bad query"), { code: "P2002" }); }, noWait));
  assert.equal(calls, 1, "Other errors must not be retried");
  const configured = new URL(connectionUrl("postgresql://user:password@example.neon.tech/db?connect_timeout=40&pool_timeout=30&max_idle_connection_lifetime=90&connection_limit=3")!);
  assert.equal(configured.searchParams.get("pool_timeout"), "30");
  assert.equal(configured.searchParams.get("max_idle_connection_lifetime"), "90");
  assert.equal(configured.searchParams.get("connection_limit"), "3");
  assert.equal(connectionUrl(undefined), undefined);
  assert.equal(connectionUrl("postgresql://user:password@localhost/db"), "postgresql://user:password@localhost/db");
  console.log("Connection timeout and retry checks passed.");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
