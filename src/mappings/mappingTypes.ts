// Common type for mapping entries
export interface MappingEntry {
  key: string; // Pure ID
  name?: string;
  styleType?: string;
  remote?: boolean;
  description?: string;
  mappedKey?: string; // Destination ID (skip if not present)
}
