import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { parseApiError } from "../utils/parseApiError.js";
import { Card } from "../components/ui/Card.jsx";
import { Input } from "../components/ui/Input.jsx";
import { Button } from "../components/ui/Button.jsx";
import "./AuthPage.css";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // ProtectedRoute stashes the page a signed-out visitor was bounced from in location.state.from;
  // honor that so login returns them where they were headed, falling back to the catalog (no
  // dashboard data worth showing yet on a first login, but /courses always has content).
  const redirectTo = location.state?.from?.pathname ?? "/courses";
  const justSignedUp = location.state?.justSignedUp ?? false;

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ email, password });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      // Wrong password and a nonexistent email both arrive here as the same INVALID_CREDENTIALS
      // message -- rendered as-is, with no branching that could re-introduce the account
      // enumeration the backend's timing-safe design deliberately avoids.
      setError(parseApiError(err).message);
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <Card className="auth-page__card">
        <h1>Log in</h1>
        {justSignedUp ? (
          <p className="auth-page__banner auth-page__banner--success">
            Account created. Log in to continue.
          </p>
        ) : null}
        {error ? (
          <p className="auth-page__banner auth-page__banner--error" role="alert">
            {error}
          </p>
        ) : null}
        <form className="auth-page__form" onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            required
            disabled={isSubmitting}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            disabled={isSubmitting}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <Button type="submit" isLoading={isSubmitting} className="auth-page__submit">
            Log in
          </Button>
        </form>
        <p className="auth-page__switch">
          Don&rsquo;t have an account? <Link to="/signup">Sign up</Link>
        </p>
      </Card>
    </main>
  );
}
