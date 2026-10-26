import postgres from "postgres";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const exec = promisify(execFile);
if (!process.env.DATABASE_URL) process.loadEnvFile(".env.local");
const source = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!source) throw new Error("A development database connection is required.");
const database = `sprout_groups_test_${Date.now()}`;
const base = new URL(source);
// This harness owns only this new database, never existing personal/group data.
const admin = postgres(source, { max: 1, prepare: false });
const target = new URL(base);
target.pathname = `/${database}`;
let created = false;
try {
  await admin.unsafe(`CREATE DATABASE "${database}"`);
  created = true;
  const env = {
    ...process.env,
    DATABASE_URL: target.href,
    DATABASE_URL_UNPOOLED: target.href,
    GROUP_TEST_DATABASE_URL: target.href,
  };
  for (const args of [
    ["run", "db:migrate"],
    [
      "exec",
      "--",
      "vitest",
      "run",
      "src/lib/groups/integration.test.ts",
      "--testTimeout=60000",
      "--hookTimeout=60000",
    ],
  ]) {
    const result = await exec("npm", args, { env, maxBuffer: 4 * 1024 * 1024 });
    process.stdout.write(result.stdout);
    process.stderr.write(result.stderr);
  }
} catch (error) {
  if (error.stdout) process.stdout.write(error.stdout);
  if (error.stderr) process.stderr.write(error.stderr);
  throw new Error("Group integration checks failed; see diagnostics above.");
} finally {
  if (created && /^sprout_groups_test_\d+$/.test(database))
    await admin.unsafe(`DROP DATABASE "${database}" WITH (FORCE)`);
  await admin.end();
}
