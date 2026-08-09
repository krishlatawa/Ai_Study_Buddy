/**
 * Standardized API Error Handling Utility
 *
 * Provides consistent error responses across all API endpoints.
 *
 * Error Types:
 * - 400 Bad Request: The client sent invalid data (e.g., failed Zod validation, missing fields)
 * - 401 Unauthorized: The client is not authenticated
 * - 403 Forbidden: The client is authenticated but doesn't have permission
 * - 404 Not Found: The requested resource doesn't exist
 * - 409 Conflict: The request conflicts with current server state (e.g., duplicate email)
 * - 500 Internal Server Error: Something went wrong on the server (unexpected errors)
 */

/**
 * Creates a standardized error response
 *
 * @param {string} message - User-friendly error description
 * @param {number} status - HTTP status code (default: 500)
 * @param {object|null} details - Optional additional error context (e.g., validation fields)
 * @returns {Response} NextResponse-compatible Response object
 */
export function apiError(message, status = 500, details = null) {
  const body = { error: message };

  if (details) {
    body.details = details;
  }

  return Response.json(body, { status });
}

/**
 * Handles Zod validation errors and formats them into a clean response
 *
 * Zod safeParse() returns { success: true, data } or { success: false, error }
 * The error object contains an `errors` array with { path, message, code } for each field.
 *
 * This function extracts the first meaningful error and returns a 400.
 *
 * @param {import('zod').ZodError} zodError - The error object from a failed safeParse()
 * @returns {Response} A 400 Bad Request response with formatted error message
 *
 * @example
 * const validation = schema.safeParse(body);
 * if (!validation.success) {
 *   return handleZodError(validation.error);
 * }
 */
export function handleZodError(zodError) {
  const errors = zodError.errors || [];

  // Build a field-level details map for the frontend
  const fieldErrors = {};
  for (const err of errors) {
    const field = err.path.join('.') || '_root';
    if (!fieldErrors[field]) {
      fieldErrors[field] = [];
    }
    fieldErrors[field].push(err.message);
  }

  // Use the first error as the main message for simplicity
  const firstMessage = errors[0]?.message || 'Validation failed';

  return apiError(firstMessage, 400, {
    fields: fieldErrors,
    totalErrors: errors.length,
  });
}

/**
 * Wraps an async API handler with standardized try/catch logic.
 * Automatically returns 500 on unhandled exceptions.
 *
 * @param {Function} handler - Async function that receives (request, params) and returns a Response
 * @returns {Function} Wrapped handler with automatic error handling
 *
 * @example
 * export const POST = withErrorHandler(async (request) => {
 *   // Your logic here — thrown errors become 500 responses
 *   return Response.json({ success: true });
 * });
 */
export function withErrorHandler(handler) {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error(`[API Error] ${request.nextUrl?.pathname || 'unknown route'}:`, error);

      // Handle known error types
      if (error.name === 'ZodError') {
        return handleZodError(error);
      }

      if (error.status && error.message) {
        return apiError(error.message, error.status);
      }

      // Prisma known errors
      if (error.code === 'P2002') {
        return apiError('A record with this value already exists.', 409);
      }
      if (error.code === 'P2025') {
        return apiError('The requested record was not found.', 404);
      }

      // Fallback: generic 500
      return apiError(
        process.env.NODE_ENV === 'development'
          ? error.message || 'An unexpected error occurred.'
          : 'An unexpected error occurred. Please try again later.',
        500
      );
    }
  };
}

