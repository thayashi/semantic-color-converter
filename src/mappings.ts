// マッピングエントリの共通型
export interface MappingEntry {
  key: string; // 純粋なID
  name?: string;
  styleType?: string;
  remote?: boolean;
  description?: string;
  mappedKey?: string; // 変換先ID（なければスキップ）
}

// Style ID → Variable ID マッピング
export const styleToVariableMappings: MappingEntry[] = [
  {
    key: "73be81990bfe8323c4bf41429d3a5938ba154b4d",
    name: "Light/Text/Primary",
    styleType: "FILL",
    remote: false,
    description: "Gray 90",
    mappedKey: "8383fb6335a6a6346b8e74636a60e3e891a19e4a",
  },
  {
    key: "5ed32ac26c65e0b349159f131e92043398848987",
    name: "Light/Text/Secondary",
    styleType: "FILL",
    remote: false,
    description: "Gray 60",
    mappedKey: "0ef1d6e655c0134c28fbf7a1709593a9d0232c58",
  },
  {
    key: "ede0e3477c0481b632ca0df6b3f9af8b45219387",
    name: "Light/Border/Structure",
    styleType: "FILL",
    remote: false,
    description: "White",
    mappedKey: "387f639cec263d078131258b32d894e3bf9a75c1",
  },
  {
    key: "dd1673ea83ca8bbd996f8d382124ac11c7ed87dd",
    name: "Background/card",
    styleType: "FILL",
    remote: false,
    description: "Blue 20",
    mappedKey: "c4383e8fbac0ab0621d3cf1c67e151706959c092",
  },
];

// Variable ID → Variable ID マッピング
export const variableToVariableMappings: MappingEntry[] = [
  {
    key: "843f1d2c2dc02487232f0232557cf5496ceaa3dc",
    mappedKey: "8383fb6335a6a6346b8e74636a60e3e891a19e4a",
  },
  {
    key: "de1f68cce9a90c916d08d1ceabb95e84b3ce6f25",
    mappedKey: "0ef1d6e655c0134c28fbf7a1709593a9d0232c58",
  },
];

// RGB HEX → Variable ID マッピング
export const rgbToVariableMappings: MappingEntry[] = [
  // 例:
  { key: "#FFFFFF", mappedKey: "c4383e8fbac0ab0621d3cf1c67e151706959c092" },
];

// RGBオブジェクトをHEX文字列に変換
export function rgbToHex(color: RGB): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const toHex = (c: number) => c.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}
