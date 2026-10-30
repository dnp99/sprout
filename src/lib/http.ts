import { NextResponse } from "next/server";

/** Thin helpers for consistent JSON API responses across route handlers. */
function privateResponse<T>(body: T, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "private, no-store");
  return NextResponse.json(body, { ...init, headers });
}

export function ok<T>(data: T, init?: ResponseInit) {
  return privateResponse(data, init);
}

export function badRequest(message: string, details?: unknown) {
  return privateResponse({ error: message, details }, { status: 400 });
}

export function unauthorized(message = "Not signed in.") {
  return privateResponse({ error: message }, { status: 401 });
}

export function notFound(message = "Not found.") {
  return privateResponse({ error: message }, { status: 404 });
}

export function serverError(message = "Something went wrong.") {
  return privateResponse({ error: message }, { status: 500 });
}

/** A dependency the feature needs isn't configured (e.g. no AI API key). */
export function serviceUnavailable(message = "This feature isn't available.") {
  return privateResponse({ error: message }, { status: 503 });
}
