import { NextResponse } from "next/server";

/** Thin helpers for consistent JSON API responses across route handlers. */

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status: 400 });
}

export function unauthorized(message = "Not signed in.") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function notFound(message = "Not found.") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function serverError(message = "Something went wrong.") {
  return NextResponse.json({ error: message }, { status: 500 });
}

/** A dependency the feature needs isn't configured (e.g. no AI API key). */
export function serviceUnavailable(message = "This feature isn't available.") {
  return NextResponse.json({ error: message }, { status: 503 });
}
