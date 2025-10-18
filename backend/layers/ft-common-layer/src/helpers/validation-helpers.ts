import { ValidationErrors } from '../types/ValidationErrors'

export function generateValidationErrors(errors: Record<string, string[]>) {
  const structuredErrors: ValidationErrors = {}
  for (const key of Object.keys(errors)) {
    if (errors[key].length) {
      structuredErrors[key] = { errors: [] }
      structuredErrors[key].errors = errors[key]
    }
  }
  return structuredErrors
}
