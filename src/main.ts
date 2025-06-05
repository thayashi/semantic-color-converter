import { showUI, on, emit } from "@create-figma-plugin/utilities";
import { styleToVariableMappings } from "./mappings/styleToVariableMappings";
import { variableToVariableMappings } from "./mappings/variableToVariableMappings";
import { rgbToVariableMappings } from "./mappings/rgbToVariableMappings";
import { rgbToHex, RGB } from "./utils/rgbToHex";
import { extractPureKey } from "./utils/extractVariableKey";
import { AdvancedMappingEntry } from "./mappings/advancedMappings";
import { collectTargetNodes } from "./logic/collectTargetNodes";

/**
 * Notifies the user of an error and emits a CONVERSION_ERROR event.
 */
function notifyAndEmitError(message: string) {
  figma.notify(message, { error: true });
  emit("CONVERSION_ERROR");
}

/**
 * Imports Figma variables by their keys and returns a map of key to Variable.
 */
async function importVariables(variableKeys: string[]): Promise<Record<string, Variable>> {
  const importedVariablesMap: Record<string, Variable> = {};
  const variablePromises = variableKeys.map((key) =>
    figma.variables.importVariableByKeyAsync(key).catch((e) => {
      console.error(`Error importing variable with key ${key}:`, e);
      figma.notify(`Error importing variable key ${key}. Ensure it's published.`, { error: true });
      return null;
    })
  );
  const importedVariables = await Promise.all(variablePromises);
  importedVariables.forEach((variable) => {
    if (variable) {
      importedVariablesMap[variable.key] = variable;
    }
  });
  return importedVariablesMap;
}

/**
 * Attempts to convert the fills of a node to use variables.
 * Returns true if any conversion was made.
 */
function convertFills(
  node: SceneNode,
  importedVariablesMap: Record<string, Variable>,
  enabledAdvancedMappings?: AdvancedMappingEntry[]
): boolean {
  if (!("fills" in node && "strokes" in node)) return false;

  const originalFills = Array.isArray(node.fills) ? JSON.stringify(node.fills) : null;
  let changed = false;

  // --- Apply Advanced Mapping ---
  if (enabledAdvancedMappings && Array.isArray(node.fills)) {
    // Apply only to fill
    const fillMappings = enabledAdvancedMappings.filter(
      (adv) => adv.target === "fill"
    );
    const currentFills = JSON.parse(JSON.stringify(node.fills)) as Paint[];
    let advancedChanged = false;
    for (let i = 0; i < currentFills.length; i++) {
      const fill = currentFills[i];
      if (fill.type === "SOLID") {
        for (const adv of fillMappings) {
          // --- Advanced Mapping: style to variable ---
          if (adv.type === "style" && node.fillStyleId && typeof node.fillStyleId === "string") {
            const styleKey = extractPureKey(node.fillStyleId);
            if (styleKey === adv.key) {
              const targetVariable = importedVariablesMap[adv.mappedKey];
              if (targetVariable) {
                try {
                  node.fillStyleId = "";
                  currentFills[i] = figma.variables.setBoundVariableForPaint(fill, "color", targetVariable);
                  advancedChanged = true;
                  break;
                } catch {}
              }
            }
          }
          if (adv.type === "hex") {
            const hexColor = rgbToHex(fill.color);
            if (hexColor.toUpperCase() === adv.key.toUpperCase()) {
              const targetVariable = importedVariablesMap[adv.mappedKey];
              if (targetVariable) {
                try {
                  currentFills[i] = figma.variables.setBoundVariableForPaint(fill, "color", targetVariable);
                  advancedChanged = true;
                  break;
                } catch {}
              }
            }
          }
          if (adv.type === "variable" && fill.boundVariables?.color) {
            const varKey = extractPureKey(fill.boundVariables.color.id);
            if (varKey && varKey === adv.key) {
              const targetVariable = importedVariablesMap[adv.mappedKey];
              if (targetVariable) {
                try {
                  currentFills[i] = figma.variables.setBoundVariableForPaint(fill, "color", targetVariable);
                  advancedChanged = true;
                  break;
                } catch {}
              }
            }
          }
        }
      }
    }
    if (advancedChanged) {
      try {
        node.fills = currentFills;
        changed = true;
      } catch {}
    }
  }

  // --- Process Fills by Style ---
  let fillStyleProcessed = false;
  if (node.fillStyleId && typeof node.fillStyleId === "string") {
    const styleKey = extractPureKey(node.fillStyleId);
    const styleMapping = styleToVariableMappings.find(entry => entry.key === styleKey && entry.mappedKey);
    if (styleMapping && styleMapping.mappedKey) {
      const targetVariableKey = styleMapping.mappedKey;
      const targetVariable = importedVariablesMap[targetVariableKey];
      if (targetVariable) {
        try {
          node.fillStyleId = "";
          if (Array.isArray(node.fills)) {
            const currentFills = JSON.parse(JSON.stringify(node.fills)) as Paint[];
            let styleFillApplied = false;
            for (let i = 0; i < currentFills.length; i++) {
              const fillPaint = currentFills[i];
              if (fillPaint.type === "SOLID") {
                currentFills[i] = figma.variables.setBoundVariableForPaint(fillPaint, "color", targetVariable);
                styleFillApplied = true;
                break;
              }
            }
            if (styleFillApplied) {
              node.fills = currentFills;
              fillStyleProcessed = true;
            }
          }
        } catch (e) {
          // Error handling is done at a higher level
        }
      }
    }
  }

  // --- Process Fills by Variable or RGB ---
  if (!fillStyleProcessed && Array.isArray(node.fills)) {
    const currentFills = JSON.parse(JSON.stringify(node.fills)) as Paint[];
    let fillsChanged = false;
    for (let i = 0; i < currentFills.length; i++) {
      let fill = currentFills[i];
      let targetVariableKey: string | undefined = undefined;
      let targetVariable: Variable | null = null;

      if (fill.type === "SOLID") {
        const boundVar = fill.boundVariables?.color;
        if (boundVar) {
          const varKey = extractPureKey(boundVar.id);
          const varMapping = variableToVariableMappings.find(entry => entry.key === varKey && entry.mappedKey);
          if (varMapping && varMapping.mappedKey) targetVariableKey = varMapping.mappedKey;
        } else {
          const hexColor = rgbToHex(fill.color);
          const rgbMapping = rgbToVariableMappings.find(entry => entry.key === hexColor && entry.mappedKey);
          if (rgbMapping && rgbMapping.mappedKey) targetVariableKey = rgbMapping.mappedKey;
        }

        if (targetVariableKey) {
          targetVariable = importedVariablesMap[targetVariableKey];
          if (targetVariable) {
            try {
              currentFills[i] = figma.variables.setBoundVariableForPaint(fill, "color", targetVariable);
              fillsChanged = true;
            } catch (e) {
              // Error handling is done at a higher level
            }
          }
        }
      }
    }
    if (fillsChanged) {
      try {
        node.fills = currentFills;
      } catch (e) {
        // Error handling is done at a higher level
      }
    }
  }

  const newFills = Array.isArray(node.fills) ? JSON.stringify(node.fills) : null;
  if (originalFills !== null && newFills !== null && originalFills !== newFills) {
    changed = true;
  }
  return changed;
}

/**
 * Attempts to convert the strokes of a node to use variables.
 * Returns true if any conversion was made.
 */
function convertStrokes(
  node: SceneNode,
  importedVariablesMap: Record<string, Variable>,
  enabledAdvancedMappings?: AdvancedMappingEntry[]
): boolean {
  if (!("fills" in node && "strokes" in node)) return false;

  const originalStrokes = Array.isArray(node.strokes) ? JSON.stringify(node.strokes) : null;
  let changed = false;

  // --- Apply Advanced Mapping ---
  if (enabledAdvancedMappings && Array.isArray(node.strokes)) {
    // Apply only to stroke
    const strokeMappings = enabledAdvancedMappings.filter(
      (adv) => adv.target === "stroke"
    );
    const currentStrokes = JSON.parse(JSON.stringify(node.strokes)) as Paint[];
    let advancedChanged = false;
    for (let i = 0; i < currentStrokes.length; i++) {
      const stroke = currentStrokes[i];
      if (stroke.type === "SOLID") {
        for (const adv of strokeMappings) {
          // --- Advanced Mapping: style to variable ---
          if (adv.type === "style" && node.strokeStyleId && typeof node.strokeStyleId === "string") {
            const styleKey = extractPureKey(node.strokeStyleId);
            if (styleKey === adv.key) {
              const targetVariable = importedVariablesMap[adv.mappedKey];
              if (targetVariable) {
                try {
                  node.strokeStyleId = "";
                  currentStrokes[i] = figma.variables.setBoundVariableForPaint(stroke, "color", targetVariable);
                  advancedChanged = true;
                  break;
                } catch {}
              }
            }
          }
          if (adv.type === "hex") {
            const hexColor = rgbToHex(stroke.color);
            if (hexColor.toUpperCase() === adv.key.toUpperCase()) {
              const targetVariable = importedVariablesMap[adv.mappedKey];
              if (targetVariable) {
                try {
                  currentStrokes[i] = figma.variables.setBoundVariableForPaint(stroke, "color", targetVariable);
                  advancedChanged = true;
                  break;
                } catch {}
              }
            }
          }
          if (adv.type === "variable" && stroke.boundVariables?.color) {
            const varKey = extractPureKey(stroke.boundVariables.color.id);
            if (varKey && varKey === adv.key) {
              const targetVariable = importedVariablesMap[adv.mappedKey];
              if (targetVariable) {
                try {
                  currentStrokes[i] = figma.variables.setBoundVariableForPaint(stroke, "color", targetVariable);
                  advancedChanged = true;
                  break;
                } catch {}
              }
            }
          }
        }
      }
    }
    if (advancedChanged) {
      try {
        node.strokes = currentStrokes;
        changed = true;
      } catch {}
    }
  }

  // --- Process Strokes by Style ---
  let strokeStyleProcessed = false;
  if (node.strokeStyleId && typeof node.strokeStyleId === "string") {
    const styleKey = extractPureKey(node.strokeStyleId);
    const styleMapping = styleToVariableMappings.find(entry => entry.key === styleKey && entry.mappedKey);
    if (styleMapping && styleMapping.mappedKey) {
      const targetVariableKey = styleMapping.mappedKey;
      const targetVariable = importedVariablesMap[targetVariableKey];
      if (targetVariable) {
        try {
          node.strokeStyleId = "";
          if (Array.isArray(node.strokes)) {
            const currentStrokes = JSON.parse(JSON.stringify(node.strokes)) as Paint[];
            let styleStrokeApplied = false;
            for (let i = 0; i < currentStrokes.length; i++) {
              const strokePaint = currentStrokes[i];
              if (strokePaint.type === "SOLID") {
                currentStrokes[i] = figma.variables.setBoundVariableForPaint(strokePaint, "color", targetVariable);
                styleStrokeApplied = true;
                break;
              }
            }
            if (styleStrokeApplied) {
              node.strokes = currentStrokes;
              strokeStyleProcessed = true;
            }
          }
        } catch (e) {
          // Error handling is done at a higher level
        }
      }
    }
  }

  // --- Process Strokes by Variable or RGB ---
  if (!strokeStyleProcessed && Array.isArray(node.strokes)) {
    const currentStrokes = JSON.parse(JSON.stringify(node.strokes)) as Paint[];
    let strokesChanged = false;
    for (let i = 0; i < currentStrokes.length; i++) {
      let stroke = currentStrokes[i];
      let targetVariableKey: string | undefined = undefined;
      let targetVariable: Variable | null = null;

      if (stroke.type === "SOLID") {
        const boundVar = stroke.boundVariables?.color;
        if (boundVar) {
          const varKey = extractPureKey(boundVar.id);
          const varMapping = variableToVariableMappings.find(entry => entry.key === varKey && entry.mappedKey);
          if (varMapping && varMapping.mappedKey) targetVariableKey = varMapping.mappedKey;
        } else {
          const hexColor = rgbToHex(stroke.color);
          const rgbMapping = rgbToVariableMappings.find(entry => entry.key === hexColor && entry.mappedKey);
          if (rgbMapping && rgbMapping.mappedKey) targetVariableKey = rgbMapping.mappedKey;
        }

        if (targetVariableKey) {
          targetVariable = importedVariablesMap[targetVariableKey];
          if (targetVariable) {
            try {
              currentStrokes[i] = figma.variables.setBoundVariableForPaint(stroke, "color", targetVariable);
              strokesChanged = true;
            } catch (e) {
              // Error handling is done at a higher level
            }
          }
        }
      }
    }
    if (strokesChanged) {
      try {
        node.strokes = currentStrokes;
      } catch (e) {
        // Error handling is done at a higher level
      }
    }
  }

  const newStrokes = Array.isArray(node.strokes) ? JSON.stringify(node.strokes) : null;
  if (originalStrokes !== null && newStrokes !== null && originalStrokes !== newStrokes) {
    changed = true;
  }
  return changed;
}

const NODE_LIMIT = 12;

export default function () {
  on("CONVERT_COLORS", async (payload?: { advancedMappings?: AdvancedMappingEntry[] }) => {
    const selection = figma.currentPage.selection;

    // Enabled mappings for Advanced Options
    const enabledAdvancedMappings: AdvancedMappingEntry[] = payload?.advancedMappings ?? [];

    if (selection.length === 0) {
      notifyAndEmitError("Please select one or more frames or nodes.");
      return;
    }

    const allNodesToProcess = collectTargetNodes(selection);

    // Node limit check
    if (allNodesToProcess.length > NODE_LIMIT) {
      emit("SHOW_NODE_LIMIT_MODAL", { nodeLimit: NODE_LIMIT });
      return;
    }

    emit("NODES_FOUND", { total: allNodesToProcess.length });

    if (allNodesToProcess.length === 0) {
      notifyAndEmitError("No convertible nodes found in selection.");
      return;
    }

    figma.notify(`Found ${allNodesToProcess.length} nodes to process. Importing variables...`);

    // Gather all variable keys from mappings + advancedMappings
    const variableKeysToImportMap: { [key: string]: boolean } = {};
    styleToVariableMappings.forEach((mapping) => {
      if (mapping.mappedKey) variableKeysToImportMap[mapping.mappedKey] = true;
    });
    variableToVariableMappings.forEach((mapping) => {
      if (mapping.mappedKey) variableKeysToImportMap[mapping.mappedKey] = true;
    });
    rgbToVariableMappings.forEach((mapping) => {
      if (mapping.mappedKey) variableKeysToImportMap[mapping.mappedKey] = true;
    });
    enabledAdvancedMappings.forEach((mapping) => {
      variableKeysToImportMap[mapping.mappedKey] = true;
    });

    const uniqueVariableKeys = Object.keys(variableKeysToImportMap);
    const importedVariablesMap = await importVariables(uniqueVariableKeys);

    figma.notify("Variables imported. Starting node conversion...");

    let processedNodes = 0;
    let convertedNodes = 0;

    try {
      for (const node of allNodesToProcess) {
        processedNodes++;
        let nodeConverted = false;

        if (processedNodes % 10 === 0 || processedNodes === allNodesToProcess.length) {
          // Progress notification removed (no longer needed in UI)
        }

        // Add conversion logic to apply Advanced Mapping
        const fillResult = convertFills(node, importedVariablesMap, enabledAdvancedMappings);
        const strokeResult = convertStrokes(node, importedVariablesMap, enabledAdvancedMappings);

        if (fillResult || strokeResult) {
          nodeConverted = true;
        }

        if (nodeConverted) {
          convertedNodes++;
        }
      }

      figma.notify(`Conversion complete. Processed ${processedNodes} nodes.`);
      emit("NODES_CONVERTED", { converted: convertedNodes });
      emit("CONVERSION_COMPLETE");
    } catch (error) {
      notifyAndEmitError(`Conversion failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  showUI({ height: 320, width: 340 });
}
