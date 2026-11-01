export type Note = { id: string; body: string; summary: string | null; createdAt: number };
export type Task = {
  id: string;
  title: string;
  noteId?: string | null;
  status: string;
  createdAt: number;
};
const now = Date.now();
export const exampleNotes: Note[] = [
  {
    id: "example-1",
    body: "The spare house key is in the small blue bowl on the shelf by the front door. Not in the kitchen drawer anymore.",
    summary: null,
    createdAt: now - 3600000,
  },
  {
    id: "example-2",
    body: "An idea for the weekend: a walk somewhere with trees, then coffee. Nothing that needs a reservation. I want to keep it simple.",
    summary: null,
    createdAt: now - 86400000,
  },
  {
    id: "example-3",
    body: "Spoke to the insurance company. They said to have my policy number ready when I call back. I haven’t chosen a day to call yet.",
    summary: null,
    createdAt: now - 90000000,
  },
];
export const exampleTasks: Task[] = [
  {
    id: "example-task",
    title: "Find my insurance policy number",
    noteId: "example-3",
    status: "open",
    createdAt: now,
  },
];
export function readDemo<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}
