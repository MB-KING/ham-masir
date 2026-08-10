import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError, errorMessagesFa } from "@/shared/errors";
import { logger } from "@/lib/logger";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function fail(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: { code: error.code, message: errorMessagesFa[error.code] } },
      { status: error.status }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: errorMessagesFa.VALIDATION_ERROR, issues: error.issues } },
      { status: 422 }
    );
  }

  logger.error("unexpected_api_error");
  return NextResponse.json(
    { error: { code: "UNEXPECTED_ERROR", message: errorMessagesFa.UNEXPECTED_ERROR } },
    { status: 500 }
  );
}

export async function parseJson<T>(request: Request, schema: { parse(value: unknown): T }) {
  const body = await request.json().catch(() => ({}));
  return schema.parse(body);
}
