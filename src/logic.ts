/**
 * Collects all relevant nodes from the selection that have fills and strokes,
 * including descendants of supported types.
 */
export function collectTargetNodes(selection: readonly any[]): any[] {
  // Use 'any' to avoid Figma types and ESM imports
  const targetNodeTypes: string[] = [
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

  let allNodesToProcess: any[] = [];
  for (const selectedNode of selection) {
    if (targetNodeTypes.includes(selectedNode.type)) {
      if ("fills" in selectedNode && "strokes" in selectedNode) {
        allNodesToProcess.push(selectedNode);
      }
    }
    if ("findAllWithCriteria" in selectedNode) {
      const descendants = selectedNode.findAllWithCriteria({ types: targetNodeTypes });
      const validDescendants = descendants.filter(
        (n: any) => "fills" in n && "strokes" in n
      );
      allNodesToProcess.push(...validDescendants);
    }
  }
  return allNodesToProcess;
}
