import { TZDate } from '@date-fns/tz';

export function currentTimestampForInput() {
  return TZDate.tz('asia/singapore').toISOString().slice(0, 23); // Default to current time in Singapore timezone
}
