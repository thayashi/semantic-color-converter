import { showUI, on, emit, cloneObject } from "@create-figma-plugin/utilities";
import {
  styleToVariableMap,
  variableToVariableMap,
  rgbToVariableMap,
  rgbToHex,
  TargetVariable,
} from "./mappings";

export type ConvertColorsHandler = () => void;

function extractVariableKey(variableIdString: string): string | undefined {
  if (!variableIdString || typeof variableIdString !== "string") return undefined;
  // Matches the long alphanumeric key part after "VariableID:" and before "/"
  const match = variableIdString.match(/^VariableID:([a-f0-9]+)/i);
  const extractedKey = match ? match[1] : undefined;
  return extractedKey;
}

export default function () {
  // Handler for the CONVERT_COLORS event emitted from the UI
  on("CONVERT_COLORS", async () => {
    const selection = figma.currentPage.selection;
    let processedNodes = 0;
    let totalNodes = 0;

    if (selection.length === 0) {
      figma.notify("Please select one or more frames or nodes.", { error: true });
      emit("CONVERSION_ERROR");
      return;
    }

    const updateProgress = (message: string) => {
      emit("PROGRESS_UPDATE", message);
    };

    const targetNodeTypes: SceneNode["type"][] = [
      "RECTANGLE",
      "ELLIPSE",
      "POLYGON",
      "STAR",
      "VECTOR",
      "TEXT",
      "FRAME",
      "COMPONENT",
      "INSTANCE",
      "COMPONENT_SET",
    ];

    // --- Gather all relevant nodes ---
    let allNodesToProcess: SceneNode[] = [];
    for (const selectedNode of selection) {
      if (targetNodeTypes.includes(selectedNode.type)) {
        if ("fills" in selectedNode && "strokes" in selectedNode) {
          allNodesToProcess.push(selectedNode);
        }
      }
      if ("findAllWithCriteria" in selectedNode) {
        const descendants = selectedNode.findAllWithCriteria({ types: targetNodeTypes });
        const validDescendants = descendants.filter(
          (n) => "fills" in n && "strokes" in n
        ) as SceneNode[];
        allNodesToProcess.push(...validDescendants);
      }
    }

    totalNodes = allNodesToProcess.length; // No deduplication as requested

    // Emit total nodes found to UI
    emit("NODES_FOUND", { total: totalNodes });

    if (totalNodes === 0) {
      figma.notify("No convertible nodes found in selection.", { error: true });
      emit("CONVERSION_ERROR");
      return;
    }

    updateProgress(`Found ${totalNodes} nodes to process. Importing variables...`);

    // --- Pre-import all required variables by key ---
    const variableKeysToImportMap: { [key: string]: boolean } = {};
    Object.values(styleToVariableMap).forEach((mapping) => {
      const key = extractVariableKey(mapping.variableId);
      if (key) variableKeysToImportMap[key] = true;
    });
    Object.values(variableToVariableMap).forEach((mapping) => {
      const key = extractVariableKey(mapping.variableId);
      if (key) variableKeysToImportMap[key] = true;
    });
    Object.values(rgbToVariableMap).forEach((mapping) => {
      const key = extractVariableKey(mapping.variableId);
      if (key) variableKeysToImportMap[key] = true;
    });

    const uniqueVariableKeys = Object.keys(variableKeysToImportMap);
    console.log("Unique Variable Keys to Import:", uniqueVariableKeys);

    const variablePromises = uniqueVariableKeys.map((key) =>
      figma.variables.importVariableByKeyAsync(key).catch((e) => {
        console.error(`Error importing variable with key ${key}:`, e);
        figma.notify(`Error importing variable key ${key}. Ensure it's published.`, { error: true });
        return null;
      })
    );

    const importedVariablesMap: Record<string, Variable> = {};
    const importedVariables = await Promise.all(variablePromises);
    console.log("Imported Variables Array:", importedVariables);

    importedVariables.forEach((variable) => {
      if (variable) {
        importedVariablesMap[variable.key] = variable;
      }
    });

    if (uniqueVariableKeys.length > 0 && Object.keys(importedVariablesMap).length === 0) {
      console.warn("Warning: No variables could be imported, but mappings exist.");
    }
    updateProgress(`Variables imported. Starting node conversion...`);
    console.log("Imported Variables Map (populated):", importedVariablesMap);

    // --- Main Execution Logic ---
    try {
      let convertedNodes = 0;
      for (const node of allNodesToProcess) {
        processedNodes++;
        let nodeConverted = false;
        if (processedNodes % 10 === 0 || processedNodes === totalNodes) {
          updateProgress(`Processing node ${processedNodes}/${totalNodes}... (${node.name})`);
        }

        if (!("fills" in node && "strokes" in node)) {
          continue;
        }

        let targetVariable: Variable | null = null;
        let targetVariableKey: string | undefined = undefined;

        // --- Process Fills ---
        let fillStyleProcessed = false;
        if (node.fillStyleId && typeof node.fillStyleId === "string") {
          const styleMapping = styleToVariableMap[node.fillStyleId];
          if (styleMapping) {
            const targetVariableFullId = styleMapping.variableId;
            targetVariableKey = extractVariableKey(targetVariableFullId);
            targetVariable = targetVariableKey ? importedVariablesMap[targetVariableKey] : null;
            if (targetVariable) {
              try {
                const originalFillStyleId = node.fillStyleId;
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
                  } else {
                    console.warn(`Could not apply variable to any solid fill for style ${originalFillStyleId} on node ${node.id}`);
                  }
                }
              } catch (e) {
                const error = e instanceof Error ? e : new Error(String(e));
                console.error(`Error applying fill variable key ${targetVariableKey} from style to node ${node.id}:`, error);
                figma.notify(`Error applying variable: ${error.message}`, { error: true });
              }
            } else {
              console.warn(`Target variable key ${targetVariableKey || targetVariableFullId} from style map not found in imported variables.`);
            }
          }
          if (fillStyleProcessed) {
            nodeConverted = true;
          }
        }

        if (!fillStyleProcessed && Array.isArray(node.fills)) {
          const currentFills = JSON.parse(JSON.stringify(node.fills)) as Paint[];
          let fillsChanged = false;
          for (let i = 0; i < currentFills.length; i++) {
            let fill = currentFills[i];
            targetVariableKey = undefined;
            targetVariable = null;

            if (fill.type === "SOLID") {
              const boundVar = fill.boundVariables?.color;
              if (boundVar) {
                const varMapping = variableToVariableMap[boundVar.id];
                if (varMapping) targetVariableKey = varMapping.variableId;
              } else {
                const hexColor = rgbToHex(fill.color);
                const rgbMapping = rgbToVariableMap[hexColor];
                if (rgbMapping) targetVariableKey = rgbMapping.variableId;
              }

              if (targetVariableKey) {
                const targetVariableFullId = targetVariableKey;
                targetVariableKey = extractVariableKey(targetVariableFullId);
                targetVariable = targetVariableKey ? importedVariablesMap[targetVariableKey] : null;
                if (targetVariable) {
                  try {
                    currentFills[i] = figma.variables.setBoundVariableForPaint(fill, "color", targetVariable);
                    fillsChanged = true;
                  } catch (e) {
                    const error = e instanceof Error ? e : new Error(String(e));
                    console.error(`Error applying fill variable key ${targetVariableKey} to paint on node ${node.id}:`, error);
                    figma.notify(`Error applying variable: ${error.message}`, { error: true });
                  }
                } else {
                  console.warn(`Target variable key ${targetVariableKey || targetVariableFullId} for fill not found in imported variables.`);
                }
              }
            }
          }
          if (fillsChanged) {
            try {
              node.fills = currentFills;
              nodeConverted = true;
            } catch (e) {
              const error = e instanceof Error ? e : new Error(String(e));
              console.error(`Error assigning modified fills back to node ${node.id}:`, error);
              figma.notify(`Error assigning fills: ${error.message}`, { error: true });
            }
          }
        }

        // --- Process Strokes ---
        let strokeStyleProcessed = false;
        if (node.strokeStyleId && typeof node.strokeStyleId === "string") {
          const styleMapping = styleToVariableMap[node.strokeStyleId];
          if (styleMapping) {
            const targetVariableFullId = styleMapping.variableId;
            targetVariableKey = extractVariableKey(targetVariableFullId);
            targetVariable = targetVariableKey ? importedVariablesMap[targetVariableKey] : null;
            if (targetVariable) {
              try {
                const originalStrokeStyleId = node.strokeStyleId;
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
                  } else {
                    console.warn(`Could not apply variable to any solid stroke for style ${originalStrokeStyleId} on node ${node.id}`);
                  }
                }
              } catch (e) {
                const error = e instanceof Error ? e : new Error(String(e));
                console.error(`Error applying stroke variable key ${targetVariableKey} from style to node ${node.id}:`, error);
                figma.notify(`Error applying variable: ${error.message}`, { error: true });
              }
            } else {
              console.warn(`Target variable key ${targetVariableKey || targetVariableFullId} from style map not found in imported variables.`);
            }
          }
          if (strokeStyleProcessed) {
            nodeConverted = true;
          }
        }

        if (!strokeStyleProcessed && Array.isArray(node.strokes)) {
          const currentStrokes = JSON.parse(JSON.stringify(node.strokes)) as Paint[];
          let strokesChanged = false;
          for (let i = 0; i < currentStrokes.length; i++) {
            let stroke = currentStrokes[i];
            targetVariableKey = undefined;
            targetVariable = null;
            if (stroke.type === "SOLID") {
              const boundVar = stroke.boundVariables?.color;
              if (boundVar) {
                const varMapping = variableToVariableMap[boundVar.id];
                if (varMapping) targetVariableKey = varMapping.variableId;
              } else {
                const hexColor = rgbToHex(stroke.color);
                const rgbMapping = rgbToVariableMap[hexColor];
                if (rgbMapping) targetVariableKey = rgbMapping.variableId;
              }
              if (targetVariableKey) {
                const targetVariableFullId = targetVariableKey;
                targetVariableKey = extractVariableKey(targetVariableFullId);
                targetVariable = targetVariableKey ? importedVariablesMap[targetVariableKey] : null;
                if (targetVariable) {
                  try {
                    currentStrokes[i] = figma.variables.setBoundVariableForPaint(stroke, "color", targetVariable);
                    strokesChanged = true;
                  } catch (e) {
                    const error = e instanceof Error ? e : new Error(String(e));
                    console.error(`Error applying stroke variable key ${targetVariableKey} to paint on node ${node.id}:`, error);
                    figma.notify(`Error applying variable: ${error.message}`, { error: true });
                  }
                } else {
                  console.warn(`Target variable key ${targetVariableKey || targetVariableFullId} for stroke not found in imported variables.`);
                }
              }
            }
          }
          if (strokesChanged) {
            try {
              node.strokes = currentStrokes;
              nodeConverted = true;
            } catch (e) {
              const error = e instanceof Error ? e : new Error(String(e));
              console.error(`Error assigning modified strokes back to node ${node.id}:`, error);
              figma.notify(`Error assigning strokes: ${error.message}`, { error: true });
            }
          }
        }

        if (nodeConverted) {
          convertedNodes++;
        }
      } // End of loop

      updateProgress(`Conversion complete. Processed ${processedNodes} nodes.`);
      figma.notify(`Conversion complete. Processed ${processedNodes} nodes.`);
      emit("NODES_CONVERTED", { converted: convertedNodes });
      emit("CONVERSION_COMPLETE");

    } catch (error: any) {
      console.error("Conversion failed:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      figma.notify(`Conversion failed: ${errorMessage}`, { error: true });
      emit("CONVERSION_ERROR");
    }
  });

  showUI({ height: 200, width: 320 });
}
