import { Request, Response, NextFunction } from "express";
import { sendError } from "@/utils/response";
import config from "@/config";

// Types

interface ValidationRule {
  field: string;
  required?: boolean;
  type?: "string" | "number";
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  patternMessage?: string;
  custom?: (value: unknown) => string | null; // return error msg or null
}

// Engine

function isFieldEmpty(value: unknown): boolean {
  return value === undefined || value === null || value === "";
}

function validateRequired(
  value: unknown,
  field: string,
  required: boolean,
): string | null {
  if (required && isFieldEmpty(value)) {
    return `"${field}" is required.`;
  }
  return null;
}

function validateType(
  value: unknown,
  field: string,
  type: string,
): string | null {
  if (type && typeof value !== type) {
    return `"${field}" must be a ${type}.`;
  }
  return null;
}

function validateStringChecks(
  value: string,
  field: string,
  rule: ValidationRule,
): string[] {
  const errors: string[] = [];
  if (rule.minLength && value.length < rule.minLength) {
    errors.push(`"${field}" must be at least ${rule.minLength} characters.`);
  }
  if (rule.maxLength && value.length > rule.maxLength) {
    errors.push(`"${field}" must be at most ${rule.maxLength} characters.`);
  }
  if (rule.pattern && !rule.pattern.test(value)) {
    errors.push(rule.patternMessage || `"${field}" has an invalid format.`);
  }
  return errors;
}

function validateNumberChecks(
  value: number,
  field: string,
  rule: ValidationRule,
): string[] {
  const errors: string[] = [];
  if (rule.min !== undefined && value < rule.min) {
    errors.push(`"${field}" must be at least ${rule.min}.`);
  }
  if (rule.max !== undefined && value > rule.max) {
    errors.push(`"${field}" must be at most ${rule.max}.`);
  }
  return errors;
}

function validateField(value: unknown, rule: ValidationRule): string[] {
  const fieldErrors: string[] = [];

  // required check
  const requiredError = validateRequired(
    value,
    rule.field,
    rule.required || false,
  );
  if (requiredError) {
    fieldErrors.push(requiredError);
    return fieldErrors;
  }

  // skip further checks if field is optional and empty
  if (!rule.required && isFieldEmpty(value)) {
    return fieldErrors;
  }

  // type check
  if (rule.type) {
    const typeError = validateType(value, rule.field, rule.type);
    if (typeError) {
      fieldErrors.push(typeError);
      return fieldErrors;
    }
  }

  // string-specific checks
  if (rule.type === "string") {
    fieldErrors.push(
      ...validateStringChecks(value as string, rule.field, rule),
    );
  }

  // number-specific checks
  if (rule.type === "number") {
    fieldErrors.push(
      ...validateNumberChecks(value as number, rule.field, rule),
    );
  }

  // custom validator
  if (rule.custom) {
    const customErr = rule.custom(value);
    if (customErr) fieldErrors.push(customErr);
  }

  return fieldErrors;
}

function validate(
  body: Record<string, unknown>,
  rules: ValidationRule[],
): string[] {
  const errors: string[] = [];

  for (const rule of rules) {
    const value = body[rule.field];
    errors.push(...validateField(value, rule));
  }

  return errors;
}

// Phone: Ghana numbers start with +233 or 233, followed by 9 digits
const GHANA_PHONE_REGEX = /^\+?233\d{9}$/;

export function validatePurchaseRequest(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const errors = validate(req.body, [
    {
      field: "name",
      required: true,
      type: "string",
      minLength: 2,
      maxLength: 100,
    },
    {
      field: "phone",
      required: true,
      type: "string",
      pattern: GHANA_PHONE_REGEX,
      patternMessage:
        '"phone" must be a valid Ghana number starting with +233 or 233 (e.g. +233501234567).',
    },
    {
      field: "email",
      required: true,
      type: "string",
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      patternMessage: '"email" must be a valid email address.',
    },
    {
      field: "numberOfTickets",
      required: true,
      type: "number",
      min: 1,
      max: config.event.totalTickets,
      custom: (value) => {
        if (!Number.isInteger(value as number))
          return '"numberOfTickets" must be a whole number.';
        return null;
      },
    },
  ]);

  if (errors.length > 0) {
    sendError(res, 400, errors.join(" "), "VALIDATION_ERROR");
    return;
  }

  next();
}

export function validateTicketCodeParam(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const { ticketCode } = req.params;

  if (
    !ticketCode ||
    typeof ticketCode !== "string" ||
    ticketCode.trim() === ""
  ) {
    sendError(res, 400, "Ticket code is required.", "VALIDATION_ERROR");
    return;
  }

  // Ticket code format: HP-YYYY-NNNNN
  const TICKET_CODE_REGEX = /^HP-\d{4}-\d{5}$/;
  if (!TICKET_CODE_REGEX.test(ticketCode.toUpperCase())) {
    sendError(
      res,
      400,
      "Invalid ticket code format. Expected format: HP-YYYY-NNNNN",
      "VALIDATION_ERROR",
    );
    return;
  }

  // Normalize to uppercase for DB lookup
  req.params.ticketCode = ticketCode.toUpperCase();
  next();
}

export function validateOrderIdParam(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const { orderId } = req.params;

  if (!orderId || typeof orderId !== "string" || orderId.trim() === "") {
    sendError(res, 400, "Order ID is required.", "VALIDATION_ERROR");
    return;
  }

  // UUID format
  const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!UUID_REGEX.test(orderId)) {
    sendError(res, 400, "Invalid order ID format.", "VALIDATION_ERROR");
    return;
  }

  next();
}
