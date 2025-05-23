import { collectTargetNodes } from './logic';

// Mock types for SceneNode
type MockSceneNode = {
  type: string;
  fills?: any;
  strokes?: any;
  findAllWithCriteria?: (criteria: any) => MockSceneNode[];
  [key: string]: any;
};

describe('collectTargetNodes', () => {
  it('returns only supported node types with fills and strokes', () => {
    const node: MockSceneNode = {
      type: 'RECTANGLE',
      fills: [],
      strokes: []
    };
    const result = collectTargetNodes([node as any]);
    expect(result).toContain(node);
  });

  it('returns empty array for unsupported node types', () => {
    const node: MockSceneNode = {
      type: 'GROUP'
    };
    const result = collectTargetNodes([node as any]);
    expect(result).toHaveLength(0);
  });

  it('collects descendants with supported types', () => {
    const descendant: MockSceneNode = {
      type: 'ELLIPSE',
      fills: [],
      strokes: []
    };
    const node: MockSceneNode = {
      type: 'FRAME',
      fills: [],
      strokes: [],
      findAllWithCriteria: jest.fn(() => [descendant])
    };
    const result = collectTargetNodes([node as any]);
    expect(result).toContain(descendant);
  });
});

// Example stub for convertFills/convertStrokes
// You would need to mock figma.variables.setBoundVariableForPaint and the node structure
// describe('convertFills', () => {
//   it('converts fills using variable mappings', () => {
//     // Mock node, importedVariablesMap, and figma.variables
//     // Call convertFills and assert changes
//   });
// });

// Example stub for main event handler
// describe('main event handler', () => {
//   beforeEach(() => {
//     // Mock global figma, emit, etc.
//   });
//   it('handles empty selection', () => {
//     // Simulate empty selection and assert error notification
//   });
// });
