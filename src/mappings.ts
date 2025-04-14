// Define the structure for the target variable
export interface TargetVariable {
  variableId: string;
  // Potentially add other properties if needed, e.g., modeId
}

// Placeholder map for Style ID to Variable ID
// Replace keys (Style IDs) and values (TargetVariable objects) with actual data
export const styleToVariableMap: Record<string, TargetVariable> = {
  "S:dd1673ea83ca8bbd996f8d382124ac11c7ed87dd,1:280": {
    variableId: "VariableID:c4383e8fbac0ab0621d3cf1c67e151706959c092/1:121",
  },
  "S:73be81990bfe8323c4bf41429d3a5938ba154b4d,1:255": {
    variableId: "VariableID:8383fb6335a6a6346b8e74636a60e3e891a19e4a/1:166",
  },
  "S:5ed32ac26c65e0b349159f131e92043398848987,1:271": {
    variableId: "VariableID:0ef1d6e655c0134c28fbf7a1709593a9d0232c58/1:218",
  },
  "S:ede0e3477c0481b632ca0df6b3f9af8b45219387,3:3": {
    variableId: "VariableID:387f639cec263d078131258b32d894e3bf9a75c1/3:53",
  },
};

// Placeholder map for Variable ID to Variable ID (for remapping)
// Replace keys (Old Variable IDs) and values (TargetVariable objects) with actual data
export const variableToVariableMap: Record<string, TargetVariable> = {
  // Example:
  "VariableID:843f1d2c2dc02487232f0232557cf5496ceaa3dc/4:70": {
    variableId: "VariableID:8383fb6335a6a6346b8e74636a60e3e891a19e4a/1:166",
  },
  "VariableID:0ef1d6e655c0134c28fbf7a1709593a9d0232c58/1:218": {
    variableId: "VariableID:0ef1d6e655c0134c28fbf7a1709593a9d0232c58/1:218",
  },
};

// Placeholder map for RGB color (as HEX string) to Variable ID
// Replace keys (HEX color strings like "#RRGGBB") and values (TargetVariable objects) with actual data
export const rgbToVariableMap: Record<string, TargetVariable> = {
  // Example:
  // "#FF0000": { variableId: "VariableId:141:516" },
  // "#00FF00": { variableId: "VariableId:171:819" },
};

// Helper function to convert RGB object to HEX string (e.g., #RRGGBB)
// Figma's RGB values are 0-1, so we need to scale them to 0-255
export function rgbToHex(color: RGB): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const toHex = (c: number) => c.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}
