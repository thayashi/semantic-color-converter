/**
 * Extracts the pure key from a Figma styleId or variableId string.
 * Supported patterns:
 *   - "S:dd1673ea83ca8bbd996f8d382124ac11c7ed87dd,1:280" → "dd1673ea83ca8bbd996f8d382124ac11c7ed87dd"
 *   - "VariableID:843f1d2c2dc02487232f0232557cf5496ceaa3dc/4:70" → "843f1d2c2dc02487232f0232557cf5496ceaa3dc"
 *   - "843f1d2c2dc02487232f0232557cf5496ceaa3dc" → "843f1d2c2dc02487232f0232557cf5496ceaa3dc"
 */
export function extractPureKey(idString: string): string | undefined {
  if (!idString || typeof idString !== "string") return undefined;

  // Style ID: "S:xxxx...,1:280"
  const styleMatch = idString.match(/^S:([a-f0-9]+),/i);
  if (styleMatch) return styleMatch[1];

  // Variable ID: "VariableID:xxxx.../4:70"
  const variableMatch = idString.match(/^VariableID:([a-f0-9]+)\//i);
  if (variableMatch) return variableMatch[1];

  // Just the pure key (already)
  const pureMatch = idString.match(/^([a-f0-9]{40})$/i);
  if (pureMatch) return pureMatch[1];

  return undefined;
}

/**
 * (Legacy) Extracts the variable key from a Figma variableId string.
 * Example: "VariableID:123abc456def" => "123abc456def"
 */
export function extractVariableKey(variableIdString: string): string | undefined {
  if (!variableIdString || typeof variableIdString !== "string") return undefined;
  const match = variableIdString.match(/^VariableID:([a-f0-9]+)/i);
  return match ? match[1] : undefined;
}
