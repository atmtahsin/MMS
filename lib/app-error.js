// An error whose message is safe to show to the person using the app.
// The API route turns it into a JSON response with the given HTTP status code.
export class AppError extends Error {
  constructor(message, httpStatus = 400) {
    super(message);
    this.httpStatus = httpStatus;
  }
}
