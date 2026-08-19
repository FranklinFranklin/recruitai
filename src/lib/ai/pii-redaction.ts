/**
 * A utility to redact explicit PII from CV text before sending to third-party LLMs.
 * This is a foundational regex-based approach. For production, consider using
 * a dedicated NLP redaction library like Microsoft Presidio.
 */
export function redactPII(text: string): string {
  if (!text) return text;
  
  let redacted = text;

  // 1. Redact Email Addresses
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
  redacted = redacted.replace(emailRegex, '[EMAIL REDACTED]');

  // 2. Redact Phone Numbers (Common EU/US formats)
  // Matches +1234567890, 06-12345678, (123) 456-7890, etc.
  const phoneRegex = /(\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9})/g;
  redacted = redacted.replace(phoneRegex, '[PHONE REDACTED]');

  // 3. Redact common Dutch BSN / Social Security Number patterns
  const bsnRegex = /\b\d{9}\b/g;
  redacted = redacted.replace(bsnRegex, '[ID REDACTED]');
  
  return redacted;
}
