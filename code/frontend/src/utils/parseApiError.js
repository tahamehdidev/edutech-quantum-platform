// Unwraps the backend's { error: { code, message, field } } shape once (02-api-contract.md
// §0.3), reused by every caller instead of each one re-deriving this itself. Falls back to a
// generic network-error shape when there's no response at all (offline, CORS failure, timeout),
// so callers never have to branch on "did this even reach the server."
export function parseApiError(error) {
  const backendError = error.response?.data?.error;
  if (backendError) {
    return {
      code: backendError.code,
      message: backendError.message,
      field: backendError.field ?? null,
    };
  }
  return {
    code: "NETWORK_ERROR",
    message: "Could not reach the server. Check your connection.",
    field: null,
  };
}
