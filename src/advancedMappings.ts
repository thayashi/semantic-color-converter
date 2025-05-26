export type AdvancedMappingType = "hex" | "variable";
export type PaintTarget = "fill" | "stroke";

export interface AdvancedMappingEntry {
  id: string; // UIで一意に識別
  type: AdvancedMappingType;
  from: string; // HEXカラー or variable id
  to: string;   // variable id
  label: string; // UI表示用
  enabled: boolean; // チェックボックス状態
  description?: string;
  target: PaintTarget; // "fill" | "stroke"
}

// Advanced Optionsで選択可能なマッピングの初期値
export const defaultAdvancedMappings: AdvancedMappingEntry[] = [
  {
    id: "fill-ffffff-bgcard",
    type: "hex",
    from: "#303030",
    to: "8383fb6335a6a6346b8e74636a60e3e891a19e4a",
    label: "fill color: #303030 → bg-card",
    enabled: false,
    description: "白背景をbg-card変数に変換（塗りのみ）",
    target: "fill"
  },
  {
    id: "fill-ffffff-bgcard222222222",
    type: "hex",
    from: "#303030",
    to: "387f639cec263d078131258b32d894e3bf9a75c1",
    label: "strole color: #303030 → bg-card",
    enabled: false,
    description: "白背景をbg-card変数に変換（塗りのみ）",
    target: "stroke"
  },
  {
    id: "fill-ffffff-bgcard2",
    type: "hex",
    from: "#FFFFFF",
    to: "bg-card2-variable-id",
    label: "fill color: #ffffff → bg-card2",
    enabled: false,
    target: "fill"
  },
  {
    id: "stroke-ffffff-bgcard2",
    type: "hex",
    from: "#FFFFFF",
    to: "bg-card2-variable-id",
    label: "stroke color: #ffffff → bg-card2",
    enabled: false,
    target: "stroke"
  },
  {
    id: "varid1-varid2-fill",
    type: "variable",
    from: "2ac63ddb0040bc71a7a02568db8e214e2374e1ef",
    to: "0ef1d6e655c0134c28fbf7a1709593a9d0232c58",
    label: "variable D89: varid1 → varid2 (fill)",
    enabled: false,
    target: "fill"
  },
  {
    id: "varid1-varid2-stroke",
    type: "variable",
    from: "varid1",
    to: "varid2",
    label: "variable id: varid1 → varid2 (stroke)",
    enabled: false,
    target: "stroke"
  }
];
