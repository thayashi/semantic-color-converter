// Types for advanced mappings
export type AdvancedMappingType = "hex" | "variable";
export type PaintTarget = "fill" | "stroke";

export interface AdvancedMappingEntry {
  id: string; // Unique identifier for UI
  type: AdvancedMappingType;
  key: string; // HEX color or variable id (was 'from')
  mappedKey: string; // variable id (was 'to')
  label: string; // For UI display
  enabled: boolean; // Checkbox state
  description?: string;
  target: PaintTarget; // "fill" | "stroke"
}

// Default advanced mappings for Advanced Options
export const defaultAdvancedMappings: AdvancedMappingEntry[] = [
  {
    id: "fill-ffffff-bgcard",
    type: "hex",
    key: "#303030",
    mappedKey: "8383fb6335a6a6346b8e74636a60e3e891a19e4a",
    label: "fill color: #303030 → bg-card",
    enabled: false,
    description: "Convert white background to bg-card variable (fill only)",
    target: "fill"
  },
  {
    id: "fill-ffffff-bgcard222222222",
    type: "hex",
    key: "#303030",
    mappedKey: "387f639cec263d078131258b32d894e3bf9a75c1",
    label: "stroke color: #303030 → bg-card",
    enabled: false,
    description: "Convert white background to bg-card variable (fill only)",
    target: "stroke"
  },
  {
    id: "fill-ffffff-bgcard2",
    type: "hex",
    key: "#FFFFFF",
    mappedKey: "c4383e8fbac0ab0621d3cf1c67e151706959c092",
    label: "fill color: #ffffff → bg-card2",
    enabled: false,
    target: "fill"
  },
  {
    id: "stroke-ffffff-bgcard2",
    type: "hex",
    key: "#FFFFFF",
    mappedKey: "bg-card2-variable-id",
    label: "stroke color: #ffffff → bg-card2",
    enabled: false,
    target: "stroke"
  },
  {
    id: "varid1-varid2-fill",
    type: "variable",
    key: "2ac63ddb0040bc71a7a02568db8e214e2374e1ef",
    mappedKey: "0ef1d6e655c0134c28fbf7a1709593a9d0232c58",
    label: "variable D89: varid1 → varid2 (fill)",
    enabled: false,
    target: "fill"
  },
  {
    id: "varid1-varid2-stroke",
    type: "variable",
    key: "varid1",
    mappedKey: "varid2",
    label: "variable id: varid1 → varid2 (stroke)",
    enabled: false,
    target: "stroke"
  }
];
