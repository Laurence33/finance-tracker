import { HttpStatus } from "../types/HttpStatus";

export function createServerErrorResponse(statusCode = HttpStatus.INTERNAL_SERVER_ERROR, message = 'Internal Server Error') {
  return {
    statusCode,
    body: JSON.stringify({
      message,
    }),
  };
}

export function createBadRequestResponse(statusCode = HttpStatus.BAD_REQUEST, message = 'Bad Request', errors?: any) {
  return {
    statusCode,
    body: JSON.stringify({
      message,
      errors,
    }),
  };
}

export function createSuccessResponse(statusCode = HttpStatus.OK, body?: any) {
  return {
    statusCode,
    body: body ? JSON.stringify(body) : '',
  };
}
