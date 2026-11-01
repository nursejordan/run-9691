import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { AppRouterClient } from "../src/api";
const url = "http://localhost:4200";
async function account() {
  const r = await fetch(url + "/api/auth/sign-up/email", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: url },
    body: JSON.stringify({
      name: "Verification account",
      email: `verify-${crypto.randomUUID()}@example.com`,
      password: crypto.randomUUID() + "A1!",
    }),
  });
  if (!r.ok) throw new Error("Signup failed " + r.status + " " + (await r.text()));
  const body = (await r.json()) as { token: string };
  const token = r.headers.get("set-auth-token") ?? body.token;
  return createORPCClient<AppRouterClient>(
    new RPCLink({ url: url + "/api/rpc", headers: { Authorization: `Bearer ${token}` } }),
  );
}
const anonymous = createORPCClient<AppRouterClient>(new RPCLink({ url: url + "/api/rpc" }));
let denied = false;
try {
  await anonymous.memory.list();
} catch {
  denied = true;
}
if (!denied) throw new Error("Anonymous access allowed");
const a = await account(),
  b = await account();
const n = await a.memory.create({
  body: "The spare key is in the blue bowl by the front door. The insurance policy number is POL-725. No deadline has been set.",
});
if (!(await a.memory.list()).some((x) => x.id === n.id)) throw new Error("Save/list failed");
if ((await b.memory.list()).length) throw new Error("Account data leaked");
let otherDenied = false;
try {
  await b.memory.update({ id: n.id, body: "unauthorized edit" });
} catch {
  otherDenied = true;
}
if (!otherDenied) throw new Error("Cross-account edit allowed");
const summary = await a.memory.summarize({ id: n.id });
console.log("AI summary:", summary);
const answer = await a.memory.ask({ question: "Where is my spare key?" });
console.log("AI answer:", answer.answer, "Sources:", answer.sources.length);
if (!answer.sources.some((s) => s.id === n.id)) throw new Error("Answer missing source");
const task = await a.memory.addTask({ title: "Find insurance policy", noteId: n.id });
await a.memory.taskStatus({ id: task.id, status: "later" });
if (!(await a.memory.tasks()).some((t) => t.id === task.id && t.status === "later"))
  throw new Error("Task status failed");
await a.memory.update({ id: n.id, body: "The spare key is now in the kitchen drawer." });
if ((await a.memory.list()).find((x) => x.id === n.id)?.summary !== null)
  throw new Error("Stale summary retained");
await a.memory.remove({ id: n.id });
if ((await a.memory.list()).length || (await a.memory.tasks()).length)
  throw new Error("Delete cascade failed");
console.log(
  "PASS: auth, persistence, isolation, summary, cited retrieval, tasks, edit invalidation, delete.",
);
