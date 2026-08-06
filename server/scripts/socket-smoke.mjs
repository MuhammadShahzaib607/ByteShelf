// ─── Local Socket.io smoke test ─────────────────────────────────────────────
// Diagnoses the recurring "xhr poll error": starts the REAL dev server on a
// throwaway port (8001) and performs a raw Socket.io-over-HTTP-long-polling
// handshake — exactly what the browser does in local dev — at the standard
// /socket.io/ path.
//
//   node scripts/socket-smoke.mjs
//
// Prints SMOKE_TEST_PASS on success, or the failing stage otherwise. Signs a
// throwaway JWT (server/.env → JWT_ACCESS_SECRET) bound to a non-existent user
// id, so no database records are touched.
import { spawn } from "node:child_process";
import path from "node:path";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const PORT = 8001;
const TEST_ID = "000000000000000000000000"; // valid ObjectId, matches no user
const token = jwt.sign({ id: TEST_ID }, process.env.JWT_ACCESS_SECRET);

// server/ (parent of scripts/) — Windows-safe via import.meta.dirname.
const serverDir = import.meta.dirname;
const serverRoot = path.join(serverDir, "..");

const server = spawn(process.execPath, ["index.js"], {
  cwd: serverRoot,
  env: { ...process.env, NODE_ENV: "development", PORT: String(PORT) },
  stdio: ["ignore", "pipe", "pipe"],
});

let log = "";
server.stdout.on("data", (d) => (log += d.toString()));
server.stderr.on("data", (d) => (log += d.toString()));

// Cleanup: SIGTERM first, then a hard SIGKILL fallback so a hung child (or an
// interrupted script) never leaves an orphaned server occupying port 8001.
const killServer = () => {
  try {
    server.kill();
    setTimeout(() => {
      try {
        server.kill("SIGKILL");
      } catch {
        /* already dead */
      }
    }, 2000).unref();
  } catch {
    /* already dead */
  }
};
process.on("exit", killServer);

const waitForListening = () =>
  new Promise((resolve, reject) => {
    const t = setTimeout(
      () => reject(new Error("server did not start in time\n" + log)),
      15000
    );
    const check = setInterval(() => {
      if (log.includes("Server is running on port")) {
        clearTimeout(t);
        clearInterval(check);
        resolve();
      }
    }, 200);
  });

// Raw Engine.IO (EIO=4) + Socket.IO (v4 protocol) polling handshake:
//   1) GET  → open packet "0{...sid...}"
//   2) POST → CONNECT packet "40{...auth...}"
//   3) GET  → ack "40{...}" (connected) or "44{...}" (connect_error)
const rawPollHandshake = async (baseUrl) => {
  const openRes = await fetch(
    `${baseUrl}/socket.io/?EIO=4&transport=polling&t=${Date.now()}`
  );
  const openText = await openRes.text();
  if (!openText.startsWith("0")) {
    throw new Error("no engine.io open packet: " + openText.slice(0, 100));
  }
  const sid = JSON.parse(openText.slice(1)).sid;

  const connectRes = await fetch(
    `${baseUrl}/socket.io/?EIO=4&transport=polling&sid=${sid}`,
    {
      method: "POST",
      body: `40${JSON.stringify({ token })}`,
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
    }
  );
  if (!connectRes.ok) throw new Error("POST failed: " + connectRes.status);

  let ackText = "";
  for (let i = 0; i < 5; i++) {
    const ackRes = await fetch(
      `${baseUrl}/socket.io/?EIO=4&transport=polling&sid=${sid}`
    );
    ackText += await ackRes.text();
    if (ackText.startsWith("40") || ackText.startsWith("44")) break;
    await new Promise((r) => setTimeout(r, 300));
  }
  return { sid, ackText };
};

try {
  await waitForListening();
  console.log("🟢 server listening on", PORT);

  const { sid, ackText } = await rawPollHandshake(`http://localhost:${PORT}`);

  if (ackText.startsWith("40")) {
    console.log(
      `✅ Socket handshake OK (sid=${sid}). Polling path works — no xhr poll error.`
    );
    console.log("SMOKE_TEST_PASS");
  } else {
    console.error("🔴 Unexpected ack:", ackText.slice(0, 120));
    process.exitCode = 1;
  }
} catch (err) {
  console.error("🔴 SMOKE_TEST_FAIL:", err.message);
  process.exitCode = 1;
} finally {
  killServer();
}
