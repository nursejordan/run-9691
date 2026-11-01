import { Modal } from "./modal";
import { useState } from "react";
import { X, ArrowRight, Loader2, LockKeyhole } from "lucide-react";
import { authClient } from "../lib/auth";
export function AuthDialog({ close }: { close: () => void }) {
  const [signup, setSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = signup
        ? await authClient.signUp.email({ email, password, name })
        : await authClient.signIn.email({ email, password });
      if (result.error) setError(result.error.message ?? "Could not sign in. Please try again.");
      else close();
    } catch {
      setError("Could not connect. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  async function google() {
    setBusy(true);
    setError("");
    try {
      const result = await authClient.managedAuth.signIn({ provider: "google" });
      if (result.error && result.error.code !== "POPUP_CLOSED")
        setError(result.error.message ?? "Google sign-in failed.");
      else if (!result.error) close();
    } catch {
      setError("Google sign-in is unavailable. Try email instead.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal label="Your private workspace" close={close} className="auth-dialog">
      <button className="icon-button close" onClick={close} aria-label="Close sign-in">
        <X size={20} />
      </button>
      <div className="dialog-symbol">
        <LockKeyhole size={24} />
      </div>
      <h2>A little space for your mind.</h2>
      <p>Sign in to keep your real memories private and access them across devices.</p>
      <div className="auth-tabs">
        <button className={!signup ? "selected" : ""} onClick={() => setSignup(false)}>
          Sign in
        </button>
        <button className={signup ? "selected" : ""} onClick={() => setSignup(true)}>
          Create account
        </button>
      </div>
      <button className="google-button" disabled={busy} onClick={google}>
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M22 12.2c0-.7-.1-1.4-.2-2.2H12v4.1h5.6c-.3 1.3-1 2.3-2.1 3v2.7h3.4c2-1.8 3.1-4.4 3.1-7.6Z"
          />
          <path
            fill="#34A853"
            d="M12 22c2.8 0 5.1-.9 6.9-2.5l-3.4-2.7c-.9.6-2.1 1-3.5 1-2.7 0-5-1.8-5.8-4.3H2.7v2.8C4.4 19.7 7.9 22 12 22Z"
          />
          <path fill="#FBBC05" d="M6.2 13.5a6 6 0 0 1 0-3.1V7.6H2.7a10 10 0 0 0 0 8.7l3.5-2.8Z" />
          <path
            fill="#EA4335"
            d="M12 6.2c1.5 0 2.9.5 4 1.6l3-3A10 10 0 0 0 2.7 7.6l3.5 2.8C7 8 9.3 6.2 12 6.2Z"
          />
        </svg>
        Continue with Google
      </button>
      <div className="or">
        <span>or use email</span>
      </div>
      <form onSubmit={submit}>
        {signup && (
          <label>
            Your name
            <input
              aria-label="Your name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
        )}
        <label>
          Email
          <input
            aria-label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            aria-label="Password"
            type="password"
            autoComplete={signup ? "new-password" : "current-password"}
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        <button className="primary full" disabled={busy}>
          {busy ? <Loader2 className="spin" size={18} /> : <ArrowRight size={18} />}{" "}
          {signup ? "Create my workspace" : "Sign in"}
        </button>
      </form>
      <small>
        Cloud storage, not end-to-end encryption. AI receives only notes needed for requests you
        initiate.
      </small>
    </Modal>
  );
}
