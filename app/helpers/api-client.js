/**
 * Calls the app's own JSON API (see app/api/[...path]/route.js).
 *
 * @param {string} routePath - The API route without the "/api/" prefix, e.g. "students" or "payroll/mark-paid".
 * @param {object} [requestBody] - Data to send. When provided the request is a POST,
 *   otherwise it is a GET (used for reading, e.g. routePath "data").
 * @returns {Promise<object>} The parsed JSON response.
 * @throws {Error} With the server's `error` message when the response is not successful.
 */
export async function callApi(routePath, requestBody) {
  const response = await fetch(`/api/${routePath}`, {
    method: requestBody === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: requestBody === undefined ? undefined : JSON.stringify(requestBody),
  });

  // Some error responses may not contain JSON; fall back to an empty object.
  const responseData = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(responseData.error || `Request failed (${response.status})`);
  }
  return responseData;
}
