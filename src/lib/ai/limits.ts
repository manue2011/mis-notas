// Groq's free plan allows 8,000 tokens a minute, and past ~5,000 characters
// the model starts leaving lines out (checked in tidy-markdown.ts, which then
// refuses the answer). So pages are capped there: about 750 words.
export const MAX_TIDY_CHARS = 5_000;

/** Per person and day (UTC). */
export const DAILY_TIDY_LIMIT = 20;
