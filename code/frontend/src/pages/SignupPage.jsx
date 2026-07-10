import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { authService } from "../services/auth.service.js";
import { parseApiError } from "../utils/parseApiError.js";
import { Card } from "../components/ui/Card.jsx";
import { Input } from "../components/ui/Input.jsx";
import { Button } from "../components/ui/Button.jsx";
import "./AuthPage.css";

export function SignupPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [emailError, setEmailError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setEmailError(null);
    setPasswordError(null);

    // Checked in JS, not left to the native minLength attribute -- a native length-constraint
    // violation blocks form submission before onSubmit ever fires, so it can only ever surface
    // as an unstyled, easy-to-miss browser tooltip with no fallback for screen-reader users
    // (confirmed live: submitting a short password produced literally no observable feedback in
    // the accessibility tree). Checking here instead routes through the same visible,
    // role="alert"-wired Input error state as every other validation failure on this form.
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);

    // POST /auth/signup only creates the account (201, {user}, no token/cookie) -- it doesn't
    // establish a session, so a real signup is followed by a real login call with the same
    // credentials to land the new learner straight in the app.
    try {
      await authService.signup({ name, email, password });
    } catch (err) {
      const parsed = parseApiError(err);
      if (parsed.field === "email") {
        setEmailError(parsed.message);
      } else {
        setError(parsed.message);
      }
      setIsSubmitting(false);
      return;
    }

    try {
      const loggedInUser = await login({ email, password });
      // Signing up is otherwise a visual non-event -- the redirect fires immediately (no
      // artificial pause for delight's sake), but AuthenticatedLayout reads this to show a brief,
      // self-dismissing welcome toast once the learner actually lands on /courses.
      navigate("/courses", { replace: true, state: { welcomeName: loggedInUser.name } });
    } catch {
      // The account is real at this point -- a failure here is the follow-up login call (a
      // transient network hiccup, say), not a failed signup. Don't present this as an error;
      // send them to log in for real instead of stalling on a scary banner for a succeeded signup.
      navigate("/login", { state: { justSignedUp: true }, replace: true });
    }
  }

  return (
    <main className="auth-page">
      <Card className="auth-page__card">
        <h1>Create your account</h1>
        {error ? (
          <p className="auth-page__banner auth-page__banner--error" role="alert">
            {error}
          </p>
        ) : null}
        <form className="auth-page__form" onSubmit={handleSubmit}>
          <Input
            label="Name"
            type="text"
            autoComplete="name"
            required
            maxLength={100}
            disabled={isSubmitting}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            required
            disabled={isSubmitting}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={emailError}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            required
            disabled={isSubmitting}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={passwordError}
            hint="At least 8 characters"
          />
          <Button type="submit" isLoading={isSubmitting} className="auth-page__submit">
            Create account
          </Button>
        </form>
        <p className="auth-page__switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </Card>
    </main>
  );
}
