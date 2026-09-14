/**
 * Component-level unions shared across hmha-ui. These are UI concepts
 * (tone, size) that map onto token roles — not token roles themselves, so
 * they live here rather than in the generated hmha-tokens types.
 */
export type HmhaTone = 'neutral' | 'primary' | 'danger' | 'warning' | 'success';
export type HmhaSize = 'sm' | 'md' | 'lg';
