import { showUI, on, emit } from "@create-figma-plugin/utilities";
import {
  styleToVariableMappings,
  variableToVariableMappings,
  rgbToVariableMappings,
  rgbToHex,
  MappingEntry,
} from "./mappings";
import { extractPureKey } from "./utils/extractVariableKey";
import { collectTargetNodes } from "./logic";

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
function convertFills(node: SceneNode, importedVariablesMap: Record<string, Variable>): boolean {
  if (!("fills" in node && "strokes" in node)) return false;

  const originalFills = Array.isArray(node.fills) ? JSON.stringify(node.fills) : null;
  let changed = false;

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
function convertStrokes(node: SceneNode, importedVariablesMap: Record<string, Variable>): boolean {
  if (!("fills" in node && "strokes" in node)) return false;

  const originalStrokes = Array.isArray(node.strokes) ? JSON.stringify(node.strokes) : null;
  let changed = false;

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

export default function () {
  on("CONVERT_COLORS", async () => {
    const selection = figma.currentPage.selection;

    if (selection.length === 0) {
      notifyAndEmitError("Please select one or more frames or nodes.");
      return;
    }

    const allNodesToProcess = collectTargetNodes(selection);

    emit("NODES_FOUND", { total: allNodesToProcess.length });

    if (allNodesToProcess.length === 0) {
      notifyAndEmitError("No convertible nodes found in selection.");
      return;
    }

    emit("PROGRESS_UPDATE", `Found ${allNodesToProcess.length} nodes to process. Importing variables...`);

    // Gather all variable keys from mappings
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

    const uniqueVariableKeys = Object.keys(variableKeysToImportMap);
    const importedVariablesMap = await importVariables(uniqueVariableKeys);

    emit("PROGRESS_UPDATE", "Variables imported. Starting node conversion...");

    let processedNodes = 0;
    let convertedNodes = 0;

    try {
      for (const node of allNodesToProcess) {
        processedNodes++;
        let nodeConverted = false;

        if (processedNodes % 10 === 0 || processedNodes === allNodesToProcess.length) {
          emit("PROGRESS_UPDATE", `Processing node ${processedNodes}/${allNodesToProcess.length}... (${node.name})`);
        }

        const fillResult = convertFills(node, importedVariablesMap);
        const strokeResult = convertStrokes(node, importedVariablesMap);

        if (fillResult || strokeResult) {
          nodeConverted = true;
        }

        if (nodeConverted) {
          convertedNodes++;
        }
      }

      emit("PROGRESS_UPDATE", `Conversion complete. Processed ${processedNodes} nodes.`);
      figma.notify(`Conversion complete. Processed ${processedNodes} nodes.`);
      emit("NODES_CONVERTED", { converted: convertedNodes });
      emit("CONVERSION_COMPLETE");
    } catch (error) {
      notifyAndEmitError(`Conversion failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  showUI({ height: 320, width: 340 });
}
