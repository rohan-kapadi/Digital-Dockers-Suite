const { execSync } = require("child_process");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const DEFAULT_PORT = 5001;
const port = Number(process.env.PORT) || DEFAULT_PORT;
const nodeEnv = process.env.NODE_ENV || "development";

if (nodeEnv === "production") {
  process.exit(0);
}

const toUniquePids = (rawPids) =>
  Array.from(
    new Set(
      rawPids
        .map((pid) => Number(pid))
        .filter(
          (pid) => Number.isInteger(pid) && pid > 0 && pid !== process.pid,
        ),
    ),
  );

const parseWindowsPids = (output) =>
  output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(/\s+/).at(-1))
    .filter(Boolean);

const parseUnixPids = (output) => output.split(/\s+/).filter(Boolean);

try {
  if (process.platform === "win32") {
    let output = "";

    try {
      output = execSync(`netstat -ano | findstr :${port}`, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (error) {
      if (error.stdout) {
        output = String(error.stdout);
      }
    }

    const pids = toUniquePids(parseWindowsPids(output));

    if (!pids.length) {
      console.log(`[dev] Port ${port} is free.`);
      process.exit(0);
    }

    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, {
          stdio: ["ignore", "pipe", "pipe"],
        });
        console.log(`[dev] Stopped process ${pid} on port ${port}.`);
      } catch (error) {
        console.warn(`[dev] Could not stop process ${pid}: ${error.message}`);
      }
    }

    process.exit(0);
  }

  let output = "";

  try {
    output = execSync(`lsof -ti :${port}`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    if (error.stdout) {
      output = String(error.stdout);
    }
  }

  const pids = toUniquePids(parseUnixPids(output));

  if (!pids.length) {
    console.log(`[dev] Port ${port} is free.`);
    process.exit(0);
  }

  execSync(`kill -9 ${pids.join(" ")}`, {
    stdio: ["ignore", "pipe", "pipe"],
  });

  console.log(`[dev] Stopped process(es) ${pids.join(", ")} on port ${port}.`);
} catch (error) {
  console.warn(`[dev] Port cleanup skipped: ${error.message}`);
}

process.exit(0);
