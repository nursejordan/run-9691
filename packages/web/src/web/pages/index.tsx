import { Modal } from "../components/modal";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Check,
  CheckCheck,
  ChevronRight,
  CircleHelp,
  Download,
  Feather,
  FileText,
  Leaf,
  Loader2,
  LockKeyhole,
  LogOut,
  Mic,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
  Clock3,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { authClient } from "../lib/auth";
import { useMemories, useTasks, useMemoryActions } from "../queries/memory";
import { AuthDialog } from "../components/auth-dialog";
import { exampleNotes, exampleTasks, readDemo, type Note, type Task } from "../lib/demo";
type View = "remember" | "find" | "today";
export default function Index() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const signedIn = !!session;
  const qc = useQueryClient();
  const [view, setView] = useState<View>("remember");
  const [authOpen, setAuthOpen] = useState(false);
  const [settings, setSettings] = useState(false);
  const [help, setHelp] = useState(false);
  const [demoNotes, setDemoNotes] = useState<Note[]>(() => readDemo("mp-demo-notes", exampleNotes));
  const [demoTasks, setDemoTasks] = useState<Task[]>(() => readDemo("mp-demo-tasks", exampleTasks));
  const notesQuery = useMemories(session?.user.id);
  const tasksQuery = useTasks(session?.user.id);
  const actions = useMemoryActions();
  const notes: Note[] = signedIn ? (notesQuery.data ?? []) : demoNotes;
  const tasks: Task[] = signedIn ? (tasksQuery.data ?? []) : demoTasks;
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [question, setQuestion] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [edit, setEdit] = useState(false);
  const [editBody, setEditBody] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [newTask, setNewTask] = useState("");
  const [taskTab, setTaskTab] = useState("open");
  const [answer, setAnswer] = useState<{
    answer: string;
    sources: { id: string; body: string }[];
  } | null>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const current = notes.find((n) => n.id === active);
  useEffect(() => {
    try {
      localStorage.setItem("mp-demo-notes", JSON.stringify(demoNotes));
      localStorage.setItem("mp-demo-tasks", JSON.stringify(demoTasks));
    } catch {}
  }, [demoNotes, demoTasks]);
  useEffect(() => {
    setActive(null);
    setAnswer(null);
    setDraft("");
    setError("");
    setTaskTitle("");
  }, [session?.user.id]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4500);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActive(null);
        setSettings(false);
        setHelp(false);
        setAuthOpen(false);
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  function openNote(n: Note) {
    setActive(n.id);
    setEdit(false);
    setEditBody(n.body);
    setDeleteConfirm(false);
    setTaskTitle("");
    setError("");
  }
  async function save(e?: React.FormEvent) {
    e?.preventDefault();
    if (!draft.trim()) return;
    await run(async () => {
      if (signedIn) await actions.create.mutateAsync({ body: draft });
      else
        setDemoNotes((prev) => [
          { id: crypto.randomUUID(), body: draft.trim(), summary: null, createdAt: Date.now() },
          ...prev,
        ]);
      setDraft("");
      setNotice(
        signedIn
          ? "Saved. You don’t have to hold on to that."
          : "Saved in this browser’s demo. Sign in for your private workspace.",
      );
    });
  }
  async function addTask(title: string, noteId?: string) {
    if (!title.trim()) return;
    await run(async () => {
      if (signedIn) await actions.addTask.mutateAsync({ title, noteId });
      else
        setDemoTasks((prev) => [
          {
            id: crypto.randomUUID(),
            title: title.trim(),
            noteId,
            status: "open",
            createdAt: Date.now(),
          },
          ...prev,
        ]);
      setTaskTitle("");
      setNewTask("");
      setNotice("Added to Today. No deadline attached.");
    });
  }
  async function status(id: string, status: string) {
    await run(async () => {
      if (signedIn)
        await actions.taskStatus.mutateAsync({ id, status: status as "open" | "later" | "done" });
      else setDemoTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    });
  }
  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    if (!signedIn) {
      setAuthOpen(true);
      return;
    }
    await run(async () => setAnswer(await actions.ask.mutateAsync({ question })));
  }
  function exportNotes() {
    const blob = new Blob(
      [JSON.stringify({ exportedAt: new Date().toISOString(), notes, tasks }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "memory-pocket-export.json";
    a.click();
    URL.revokeObjectURL(url);
    setNotice("Export downloaded. Keep it somewhere safe.");
  }
  const filtered = notes.filter((n) =>
    `${n.body} ${n.summary ?? ""}`.toLowerCase().includes(search.toLowerCase()),
  );
  const openTasks = tasks.filter((t) => t.status === "open");
  const date = new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
  function timestamp(t: number) {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(t);
  }
  const nav = [
    { id: "remember" as View, label: "Remember", icon: Feather },
    { id: "find" as View, label: "Find a memory", icon: Search },
    { id: "today" as View, label: "Today", icon: CheckCheck },
  ];
  return (
    <div className="workspace">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="Memory Pocket home">
          <span className="brand-mark">
            <Bookmark size={23} strokeWidth={1.7} />
          </span>
          <span>
            memory<span className="brand-light">pocket</span>
          </span>
        </a>
        <div className="workspace-label">YOUR QUIET SPACE</div>
        <nav aria-label="Main navigation">
          {nav.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={"nav-item " + (view === id ? "active" : "")}
              onClick={() => {
                setView(id);
                setError("");
              }}
            >
              <Icon size={20} />
              <span>{label}</span>
              {id === "today" && openTasks.length > 0 && (
                <span className="count">{openTasks.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <div className="tiny-leaf">
            <Leaf size={20} />
          </div>
          <p>
            You don’t need to
            <br />
            remember everything.
          </p>
          <span>That’s what this space is for.</span>
        </div>
        <div className="sidebar-bottom">
          <button onClick={() => setHelp(true)}>
            <CircleHelp size={18} />A little guidance
          </button>
          <button onClick={() => setSettings(true)}>
            <Settings2 size={18} />
            Your workspace
          </button>
          <div className="account">
            <div className="avatar">
              {signedIn ? session.user.name.slice(0, 1).toUpperCase() : "M"}
            </div>
            <div>
              <strong>{signedIn ? session.user.name : "Your preview"}</strong>
              <span>{signedIn ? "Private workspace" : "Make yourself at home"}</span>
            </div>
            <button
              className="icon-button"
              onClick={() => (signedIn ? setSettings(true) : setAuthOpen(true))}
              aria-label="Account options"
            >
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <span className="breadcrumb">
            Your workspace <ChevronRight size={14} />
            <strong>
              {view === "remember" ? "Remember" : view === "find" ? "Find a memory" : "Today"}
            </strong>
          </span>
          <div className="top-actions">
            <span className="private-label">
              <LockKeyhole size={13} />
              {signedIn ? "Only you" : "Preview mode"}
            </span>
            <button
              className="outline small"
              onClick={() => (signedIn ? setSettings(true) : setAuthOpen(true))}
            >
              {signedIn ? "My account" : "Sign in"}
              <ArrowUpRight size={14} />
            </button>
          </div>
        </header>
        <main>
          <div className="date-row">
            <span>{date}</span>
            <span className="soft-label">
              <span className="status-dot" />A little less to carry
            </span>
          </div>
          {!signedIn && !sessionPending && (
            <div className="demo-banner">
              <span>
                <span className="demo-dot" />
                Example workspace. Demo edits stay in this browser.
              </span>
              <button onClick={() => setAuthOpen(true)}>
                Start your private space <ArrowRight size={14} />
              </button>
            </div>
          )}
          {sessionPending && (
            <div className="subtle-loading">
              <Loader2 size={15} className="spin" />
              Checking your workspace…
            </div>
          )}
          {(error || notesQuery.error || tasksQuery.error) && (
            <div className="error" role="alert">
              {error || notesQuery.error?.message || tasksQuery.error?.message}
              <button
                className="text-button"
                onClick={() => {
                  setError("");
                  void notesQuery.refetch();
                  void tasksQuery.refetch();
                }}
              >
                Try again
              </button>
            </div>
          )}
          {view === "remember" && (
            <>
              <div className="page-heading">
                <div className="eyebrow">OFF YOUR MIND. INTO YOUR POCKET.</div>
                <h1>Give your mind a little room.</h1>
                <p>A thought, a detail, something for later. Leave it here.</p>
              </div>
              <form className="capture" onSubmit={save}>
                <div className="capture-header">
                  <span>
                    <Feather size={19} />
                    What would you like to remember?
                  </span>
                  <span className="capture-note">No need to organize it.</span>
                </div>
                <textarea
                  ref={textarea}
                  aria-label="What would you like to remember?"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Just start here. Messy thoughts welcome…"
                  maxLength={20000}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                      e.preventDefault();
                      void save();
                    }
                  }}
                />
                <div className="capture-footer">
                  <button
                    type="button"
                    className="dictate-hint"
                    onClick={() => {
                      textarea.current?.focus();
                      setNotice(
                        "On your phone, tap the microphone on your keyboard to dictate. This app doesn’t record audio.",
                      );
                    }}
                  >
                    <Mic size={17} />
                    <span>Or use your keyboard’s microphone</span>
                  </button>
                  <button className="primary" disabled={!draft.trim() || busy}>
                    {busy ? <Loader2 size={17} className="spin" /> : <Plus size={17} />}Save memory
                  </button>
                </div>
              </form>
              <div className="under-capture">
                <ShieldCheck size={14} />
                <span>
                  {signedIn
                    ? "Your original words stay intact. AI only runs when you ask."
                    : "Try it with a non-sensitive thought. Sign in before saving personal information."}
                </span>
                <span className="keyboard-shortcut">⌘ / Ctrl + Enter to save</span>
              </div>
              <div className="section-heading">
                <div>
                  <h2>
                    Recently remembered <span>{notes.length}</span>
                  </h2>
                  <p>A few things you no longer have to keep in your head.</p>
                </div>
                <button className="text-button" onClick={() => setView("find")}>
                  See all memories <ArrowRight size={16} />
                </button>
              </div>
              {signedIn && notesQuery.isLoading ? (
                <div className="loading-box">
                  <Loader2 className="spin" />
                  Loading your memories…
                </div>
              ) : (
                <div className="memory-list">
                  {notes.slice(0, 3).map((n) => (
                    <button className="memory-row" key={n.id} onClick={() => openNote(n)}>
                      <span className="note-icon">
                        <FileText size={20} />
                      </span>
                      <div className="note-content">
                        <h3>{n.body.split(/[.!?\n]/)[0].slice(0, 100) || "A saved thought"}</h3>
                        <p>{n.body}</p>
                        <span>
                          {timestamp(n.createdAt)}
                          {n.id.startsWith("example") && " · Example memory"}
                        </span>
                      </div>
                      <ArrowUpRight size={18} className="row-arrow" />
                    </button>
                  ))}
                  {notes.length === 0 && (
                    <div className="empty">
                      <Feather size={26} />
                      <h3>Your first memory can be anything.</h3>
                      <p>Start with one detail you’d like to stop holding in your head.</p>
                    </div>
                  )}
                </div>
              )}
              <div className="bottom-reassurance">
                <span className="line" />
                <Leaf size={16} />
                <span>A place to put it down. A way to find it again.</span>
                <span className="line" />
              </div>
            </>
          )}
          {view === "find" && (
            <>
              <div className="page-heading">
                <div className="eyebrow">YOU DON’T NEED THE EXACT WORDS.</div>
                <h1>It’s here somewhere.</h1>
                <p>Search your memories, or ask a question about them.</p>
              </div>
              <div className="search-field">
                <Search size={21} />
                <input
                  aria-label="Search memories"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search a word or phrase…"
                />
                {search && (
                  <button
                    className="icon-button"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                  >
                    <X size={18} />
                  </button>
                )}
                <span className="soft-label">No AI needed</span>
              </div>
              <form className="ask-box" onSubmit={ask}>
                <div>
                  <Sparkles size={18} />
                  <h3>Can’t quite remember? Ask your pocket.</h3>
                </div>
                <p>
                  Answers use your notes and link back to the source. AI usage may incur charges.
                </p>
                <div className="ask-input">
                  <input
                    aria-label="Ask your memories"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="What did I say about my insurance?"
                    maxLength={1500}
                  />
                  <button className="primary" disabled={!question.trim() || busy}>
                    {busy ? <Loader2 size={16} className="spin" /> : <ArrowRight size={16} />}Ask
                  </button>
                </div>
              </form>
              {answer && (
                <section className="answer">
                  <div className="eyebrow">
                    <Sparkles size={15} /> FROM YOUR MEMORIES
                  </div>
                  <p>
                    {answer.answer.replace(/\[([^\]]+)\]/g, (_, id) => {
                      const i = answer.sources.findIndex((s) => s.id === id);
                      return i >= 0 ? `[${i + 1}]` : "[unverified source]";
                    })}
                  </p>
                  {answer.sources.map((s, i) => (
                    <button
                      className="source"
                      key={s.id}
                      onClick={() => {
                        const n = notes.find((n) => n.id === s.id);
                        if (n) openNote(n);
                      }}
                    >
                      <FileText size={15} />[{i + 1}] {s.body.slice(0, 80)}
                      <ArrowUpRight size={14} />
                    </button>
                  ))}
                  <small>Check the original notes before relying on important details.</small>
                </section>
              )}
              <div className="section-heading">
                <h2>
                  {search ? "Matching memories" : "All memories"} <span>{filtered.length}</span>
                </h2>
              </div>
              <div className="memory-list">
                {filtered.map((n) => (
                  <button className="memory-row" key={n.id} onClick={() => openNote(n)}>
                    <span className="note-icon">
                      <FileText size={20} />
                    </span>
                    <div className="note-content">
                      <h3>{n.body.split(/[.!?\n]/)[0].slice(0, 100)}</h3>
                      <p>{n.body}</p>
                      <span>{timestamp(n.createdAt)}</span>
                    </div>
                    <ArrowUpRight className="row-arrow" size={18} />
                  </button>
                ))}
                {!filtered.length && (
                  <div className="empty">
                    <Search size={25} />
                    <h3>
                      {notes.length ? "No matches, not a dead end." : "Nothing to search just yet."}
                    </h3>
                    <p>
                      {notes.length
                        ? "Try a shorter phrase, another word, or ask your pocket."
                        : "Save a thought in Remember, then come back here."}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
          {view === "today" && (
            <>
              <div className="page-heading">
                <div className="eyebrow">ONE THING AT A TIME IS ENOUGH.</div>
                <h1>A little intention for today.</h1>
                <p>Only the follow-ups you choose. Nothing added automatically.</p>
              </div>
              <form
                className="search-field task-entry"
                onSubmit={(e) => {
                  e.preventDefault();
                  void addTask(newTask);
                }}
              >
                <Plus size={20} />
                <input
                  aria-label="New follow-up"
                  placeholder="One thing I’d like to follow up on…"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  maxLength={500}
                />
                <button className="primary" disabled={!newTask.trim() || busy}>
                  Add <ArrowRight size={16} />
                </button>
              </form>
              <div className="task-tabs">
                {[
                  ["open", "Today"],
                  ["later", "For later"],
                  ["done", "Done"],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    className={taskTab === id ? "selected" : ""}
                    onClick={() => setTaskTab(id!)}
                  >
                    {label}
                    <span>{tasks.filter((t) => t.status === id).length}</span>
                  </button>
                ))}
              </div>
              <div className="task-list">
                {tasks
                  .filter((t) => t.status === taskTab)
                  .map((t) => (
                    <div className="task-row" key={t.id}>
                      <button
                        className={"check-button " + (t.status === "done" ? "checked" : "")}
                        disabled={busy}
                        onClick={() => void status(t.id, t.status === "done" ? "open" : "done")}
                        aria-label={
                          t.status === "done" ? "Reopen follow-up" : "Mark follow-up done"
                        }
                      >
                        {t.status === "done" && <Check size={15} />}
                      </button>
                      <div>
                        <h3>{t.title}</h3>
                        {t.noteId && notes.some((n) => n.id === t.noteId) && (
                          <button
                            className="text-button source-note"
                            onClick={() => openNote(notes.find((n) => n.id === t.noteId)!)}
                          >
                            <FileText size={13} />
                            From a saved memory
                          </button>
                        )}
                      </div>
                      {t.status !== "done" && (
                        <button
                          className="outline small"
                          disabled={busy}
                          onClick={() => void status(t.id, t.status === "later" ? "open" : "later")}
                        >
                          <Clock3 size={14} />
                          {t.status === "later" ? "Bring to Today" : "Later"}
                        </button>
                      )}
                    </div>
                  ))}
                {!tasks.some((t) => t.status === taskTab) && (
                  <div className="empty">
                    <Leaf size={30} />
                    <h3>
                      {taskTab === "done"
                        ? "Small steps belong here too."
                        : taskTab === "later"
                          ? "Nothing set aside right now."
                          : "There’s room to breathe."}
                    </h3>
                    <p>
                      {taskTab === "done"
                        ? "Completed follow-ups will appear here."
                        : "Add one thing if it helps. You don’t have to fill this space."}
                    </p>
                  </div>
                )}
              </div>
              <div className="gentle-note">
                <Leaf size={18} />
                <p>“Later” is a valid choice. There are no overdue labels here.</p>
              </div>
            </>
          )}
        </main>
      </div>
      {notice && (
        <output className="toast">
          <Check size={18} />
          {notice}
          <button
            className="icon-button"
            onClick={() => setNotice("")}
            aria-label="Dismiss message"
          >
            <X size={15} />
          </button>
        </output>
      )}
      {authOpen && <AuthDialog close={() => setAuthOpen(false)} />}
      {current && (
        <Modal label="Saved memory" close={() => setActive(null)} className="note-dialog">
          <button
            className="icon-button close"
            aria-label="Close memory"
            onClick={() => setActive(null)}
          >
            <X size={21} />
          </button>
          <div className="eyebrow">
            <FileText size={15} />
            SAVED MEMORY
          </div>
          <h2>A thought, kept safe.</h2>
          <span className="note-date">{timestamp(current.createdAt)}</span>
          {edit ? (
            <textarea
              className="edit-note"
              aria-label="Edit memory"
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              maxLength={20000}
            />
          ) : (
            <p className="original-note">{current.body}</p>
          )}
          <div className="detail-buttons">
            <button
              className="outline small"
              disabled={busy || (edit && !editBody.trim())}
              onClick={() => {
                if (!edit) {
                  setEdit(true);
                  return;
                }
                void run(async () => {
                  if (signedIn)
                    await actions.update.mutateAsync({ id: current.id, body: editBody });
                  else
                    setDemoNotes((prev) =>
                      prev.map((n) =>
                        n.id === current.id ? { ...n, body: editBody.trim(), summary: null } : n,
                      ),
                    );
                  setEdit(false);
                  setNotice("Memory updated. Any old summary has been cleared.");
                });
              }}
            >
              {edit ? "Save changes" : "Edit original"}
            </button>
            {edit && (
              <button
                className="text-button"
                onClick={() => {
                  setEdit(false);
                  setEditBody(current.body);
                }}
              >
                Cancel
              </button>
            )}
            <button
              className="outline small"
              disabled={busy || edit}
              onClick={() => {
                if (!signedIn) {
                  setAuthOpen(true);
                  return;
                }
                void run(async () => {
                  await actions.summarize.mutateAsync({ id: current.id });
                });
              }}
            >
              <Sparkles size={14} />
              {busy ? "Working…" : current.summary ? "Refresh view" : "Summarize with AI"}
            </button>
          </div>
          {current.summary && (
            <div className="summary">
              <div className="eyebrow">AI SUMMARY · CHECK AGAINST ORIGINAL</div>
              <p>{current.summary}</p>
            </div>
          )}
          <div className="followup-box">
            <h3>Something you want to act on?</h3>
            <p>You choose what becomes a follow-up.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void addTask(taskTitle, current.id);
              }}
            >
              <input
                aria-label="Follow-up from memory"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Write your follow-up…"
                maxLength={500}
              />
              <button className="primary small" disabled={busy || !taskTitle.trim()}>
                Add to Today <Plus size={14} />
              </button>
            </form>
          </div>
          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
          <div className="delete-area">
            {deleteConfirm ? (
              <>
                <span>Delete this memory and its linked follow-ups?</span>
                <button
                  className="danger"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      if (signedIn) await actions.remove.mutateAsync({ id: current.id });
                      else {
                        setDemoNotes((prev) => prev.filter((n) => n.id !== current.id));
                        setDemoTasks((prev) => prev.filter((t) => t.noteId !== current.id));
                      }
                      setActive(null);
                      setNotice("Memory deleted.");
                    })
                  }
                >
                  Delete
                </button>
                <button className="text-button" onClick={() => setDeleteConfirm(false)}>
                  Keep it
                </button>
              </>
            ) : (
              <button className="text-button" onClick={() => setDeleteConfirm(true)}>
                <Trash2 size={14} />
                Delete memory
              </button>
            )}
          </div>
        </Modal>
      )}
      {(settings || help) && (
        <Modal
          label={settings ? "Your workspace" : "A little guidance"}
          close={() => {
            setSettings(false);
            setHelp(false);
          }}
        >
          <button
            className="icon-button close"
            aria-label="Close"
            onClick={() => {
              setSettings(false);
              setHelp(false);
            }}
          >
            <X size={20} />
          </button>
          <div className="dialog-symbol">
            {settings ? <Settings2 size={24} /> : <Leaf size={24} />}
          </div>
          <h2>{settings ? "Your workspace. Your words." : "Keep it wonderfully simple."}</h2>
          {settings ? (
            <>
              <p>
                {signedIn
                  ? `Signed in as ${session.user.email}`
                  : "You’re in the demo. Example notes and demo edits are stored in this browser, not a private account."}
              </p>
              <div className="settings-item">
                <ShieldCheck size={20} />
                <div>
                  <h3>Private, not end-to-end encrypted</h3>
                  <p>
                    Real notes are protected by your account and stored in the cloud. AI receives
                    selected notes only when you request a summary or answer. Don’t store passwords
                    or highly sensitive records.
                  </p>
                </div>
              </div>
              <div className="settings-item">
                <Sparkles size={20} />
                <div>
                  <h3>AI only when you choose</h3>
                  <p>
                    Ordinary saving and search don’t call AI. AI requests may incur usage charges
                    through the platform. Summaries are cached. A 20-request hourly guard limits
                    bursts on this server; it is not a hard billing cap.
                  </p>
                </div>
              </div>
              <button
                className="outline full"
                onClick={exportNotes}
                disabled={
                  signedIn &&
                  (notesQuery.isLoading ||
                    tasksQuery.isLoading ||
                    !!notesQuery.error ||
                    !!tasksQuery.error)
                }
              >
                <Download size={18} />
                Export notes and follow-ups
              </button>
              {signedIn ? (
                <button
                  className="text-button signout"
                  onClick={() =>
                    void run(async () => {
                      await authClient.signOut();
                      qc.clear();
                      setSettings(false);
                    })
                  }
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              ) : (
                <button
                  className="primary full"
                  onClick={() => {
                    setSettings(false);
                    setAuthOpen(true);
                  }}
                >
                  Create your private workspace
                  <ArrowRight size={16} />
                </button>
              )}
            </>
          ) : (
            <>
              <p>No system to maintain. No right way to write.</p>
              <div className="guidance">
                <h3>1. Put it down.</h3>
                <p>
                  Save a sentence, an idea, or a detail. On your phone, use the microphone on your
                  keyboard to speak instead of type.
                </p>
                <h3>2. Find it again.</h3>
                <p>
                  Search a word or phrase, or ask AI a question. Follow the source links and check
                  the original for important information.
                </p>
                <h3>3. Choose one next step.</h3>
                <p>
                  Add a follow-up only if you want one. “Later” puts it aside without an overdue
                  label.
                </p>
                <p>This is a memory aid, not a treatment or a guarantee of accurate recall.</p>
              </div>
              <button
                className="primary full"
                onClick={() => {
                  setHelp(false);
                  setView("remember");
                }}
              >
                Start with one thought
                <ArrowRight size={16} />
              </button>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
