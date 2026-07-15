import { Link } from "react-router-dom";
import "./NotFoundPage.css";

// Nav-flow audit: there was no catch-all route at all -- an unmatched URL (typo, stale bookmark,
// broken link) rendered a blank page with zero way forward. Mounted outside both layouts (no
// session state assumed either way), so both destinations below always resolve regardless of
// whether the visitor is logged in.
export function NotFoundPage() {
  return (
    <main className="not-found-page">
      <h1>Page not found</h1>
      <p>The page you&rsquo;re looking for doesn&rsquo;t exist or may have moved.</p>
      <div className="not-found-page__actions">
        <Link to="/" className="button button--secondary">
          Go to the homepage
        </Link>
        <Link to="/courses" className="button button--primary">
          Go to your courses
        </Link>
      </div>
    </main>
  );
}
