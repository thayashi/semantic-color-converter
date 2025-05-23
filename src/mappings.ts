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
    key: "dd1673ea83ca8bbd996f8d382124ac11c7ed87dd",
    name: "Light/Text/Primary",
    styleType: "FILL",
    remote: false,
    description: "Gray 90",
    mappedKey: "e182a5652d3ff8913cf6774097f97b49a8c926ca"
  },
  {
    key: "73be81990bfe8323c4bf41429d3a5938ba154b4d",
    name: "Light/Background/Primary",
    styleType: "FILL",
    remote: false,
    description: "White",
    mappedKey: "ac53611fe04cf3d23d9e9c3e41d0c7f550d72633"
  },
  {
    key: "5ed32ac26c65e0b349159f131e92043398848987",
    name: "Light/Status/Primary - Lighter",
    styleType: "FILL",
    remote: false,
    description: "Blue 20",
    mappedKey: "9bcc049546efb1bfc7b97769c2068811be5e94d4"
  },
  {
    key: "ede0e3477c0481b632ca0df6b3f9af8b45219387",
    name: "Light/Text/Primary Button",
    styleType: "FILL",
    remote: false,
    description: "",
    // mappedKeyなし（スキップ対象）
  }
];

// Variable ID → Variable ID マッピング
export const variableToVariableMappings: MappingEntry[] = [
  {
    key: "843f1d2c2dc02487232f0232557cf5496ceaa3dc",
    mappedKey: "8383fb6335a6a6346b8e74636a60e3e891a19e4a"
  },
  {
    key: "0ef1d6e655c0134c28fbf7a1709593a9d0232c58",
    mappedKey: "0ef1d6e655c0134c28fbf7a1709593a9d0232c58"
  }
];

// RGB HEX → Variable ID マッピング
export const rgbToVariableMappings: (MappingEntry & { key: string; mappedKey: string })[] = [
  // 例:
  // { key: "#FF0000", mappedKey: "141516" },
  // { key: "#00FF00", mappedKey: "171819" },
];

// RGBオブジェクトをHEX文字列に変換
export function rgbToHex(color: RGB): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const toHex = (c: number) => c.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}
