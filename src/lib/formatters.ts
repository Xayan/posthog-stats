import { formatDistanceToNow, isValid, parseISO } from 'date-fns';
import * as React from 'react';

// A regex to identify strings that look like ISO 8601 timestamps.
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|([+-]\d{2}:\d{2}))$/;

export const formatCell = (value: any): React.ReactNode => {
  // Clearly display null or undefined values.
  if (value === null || value === undefined) {
    return <em className="text-muted-foreground">null</em>;
  }

  // Format ISO date strings into relative time.
  if (typeof value === 'string' && ISO_DATE_REGEX.test(value)) {
    const date = parseISO(value);
    if (isValid(date)) {
      return formatDistanceToNow(date, { addSuffix: true });
    }
  }
  
  // Display booleans as Yes/No.
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  // Fallback for all other data types.
  return String(value);
};