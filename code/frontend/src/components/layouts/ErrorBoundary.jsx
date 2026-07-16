import { Component } from "react";
import { reportError } from "../../utils/sentry.js";
import "./ErrorBoundary.css";

// Phase 5 Polish gap (confirmed absent by audit): a render-time crash anywhere in the tree
// previously produced a blank white screen with no recovery path. React error boundaries have no
// hook equivalent -- this must be a class component. Mounted once, at the top of main.jsx, above
// AuthProvider/BrowserRouter/App, so it catches a crash in any of those too, not just page content.
export class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Unhandled render error:", error, errorInfo);
    reportError(error, { componentStack: errorInfo.componentStack });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main className="error-boundary">
        <h1>Something went wrong</h1>
        <p>
          An unexpected error occurred. Reloading the page usually fixes this &mdash; if it keeps
          happening, please let us know.
        </p>
        <button type="button" className="button button--primary" onClick={this.handleReload}>
          Reload the page
        </button>
      </main>
    );
  }
}
