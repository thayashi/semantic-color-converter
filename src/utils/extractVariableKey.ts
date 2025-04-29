/**
 * Extracts the variable key from a Figma variableId string.
 * Example: "VariableID:123abc456def" => "123abc456def"
 */
export function extractVariableKey(variableIdString: string): string | undefined {
  if (!variableIdString || typeof variableIdString !== "string") return undefined;
  const match = variableIdString.match(/^VariableID:([a-f0-9]+)/i);
  return match ? match[1] : undefined;
}
