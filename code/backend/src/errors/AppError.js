// 04-application-architecture.md §6.2 -- services/repositories throw; errorHandler.middleware.js
// is the single place a thrown error becomes the standardized HTTP response
// (02-api-contract.md §0.3: { error: { code, message, field } }).
export class AppError extends Error {
  constructor(code, message, statusCode, field = null) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.field = field;
  }
}
