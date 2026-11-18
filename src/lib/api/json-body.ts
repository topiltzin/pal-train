const JSON_CONTENT_TYPE = "application/json";

/** True when the request declares a JSON body. Other content types are refused before parsing. */
export function isJsonRequest(request: Request): boolean {
  const contentType = request.headers.get("content-type") ?? "";
  return contentType.toLowerCase().startsWith(JSON_CONTENT_TYPE);
}

/** The parsed JSON body, or undefined when it is missing or malformed (the schema then refuses it). */
export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}
