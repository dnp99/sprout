import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

const script = readFileSync("scripts/migrate-on-deploy.mjs", "utf8").replace(
  /import \{ execSync \} from "node:child_process";/,
  "",
);

// Execute the real deploy script with no shell or database access. The guard
// must return before migrations even when preview credentials are available.
function run(env: string | undefined, databaseUrl?: string) {
  const migrate = vi.fn();
  const stop = Symbol("exit");
  try {
    runInNewContext(script, {
      execSync: migrate,
      console: { log: vi.fn(), warn: vi.fn() },
      process: {
        env: { VERCEL_ENV: env, DATABASE_URL_UNPOOLED: databaseUrl },
        exit: () => {
          throw stop;
        },
      },
    });
  } catch (error) {
    if (error !== stop) throw error;
  }
  return migrate;
}

describe("deployment database policy", () => {
  it.each([undefined, "development", "preview"])("never migrates %s builds", (env) => {
    expect(run(env, "postgresql://example.invalid/sprout")).not.toHaveBeenCalled();
  });
  it("retains production migrations with configured credentials", () => {
    expect(run("production", "postgresql://example.invalid/sprout")).toHaveBeenCalledOnce();
  });
  it("does not migrate production without credentials", () => {
    expect(run("production")).not.toHaveBeenCalled();
  });
});
