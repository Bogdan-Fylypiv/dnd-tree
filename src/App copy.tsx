import React, { useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import { Card, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";

type TreeNode = {
  id: string;
  title: string;
  children: TreeNode[];
  expanded: boolean;
};

// Initial tree structure
const initialTree: TreeNode[] = [
  {
    id: "1",
    title: "Root Node 1",
    expanded: true,
    children: [
      {
        id: "2",
        title: "Child Node 1.1",
        expanded: true,
        children: [],
      },
      {
        id: "3",
        title: "Child Node 1.2",
        expanded: true,
        children: [],
      },
    ],
  },
  {
    id: "4",
    title: "Root Node 2",
    expanded: true,
    children: [
      {
        id: "5",
        title: "Child Node 2.1",
        expanded: true,
        children: [],
      },
    ],
  },
];

// Flatten visible nodes based on expanded state
const getVisibleNodes = (
  nodes: TreeNode[],
  depth = 0
): { node: TreeNode; depth: number }[] => {
  return nodes.flatMap((node) => [
    { node, depth },
    ...(node.expanded ? getVisibleNodes(node.children, depth + 1) : []),
  ]);
};

// Helper to move a node from one parent to another
const moveNode = (
  tree: TreeNode[],
  sourceId: string,
  destinationId: string,
  destinationIndex: number
): TreeNode[] => {
  let movedNode: TreeNode | null = null;

  // Remove the dragged node from its parent
  const removeNode = (nodes: TreeNode[]): TreeNode[] => {
    return nodes
      .filter((node) => {
        if (node.id === sourceId) {
          movedNode = node;
          return false;
        }
        return true;
      })
      .map((node) => ({
        ...node,
        children: removeNode(node.children),
      }));
  };

  // Add the node to its new parent
  const addNode = (nodes: TreeNode[]): TreeNode[] => {
    return nodes.map((node) => {
      if (node.id === destinationId && movedNode) {
        const updatedChildren = [...node.children];
        updatedChildren.splice(destinationIndex, 0, movedNode);
        return { ...node, children: updatedChildren };
      }
      return {
        ...node,
        children: addNode(node.children),
      };
    });
  };

  const treeWithoutSource = removeNode(tree);
  return addNode(treeWithoutSource);
};

const App: React.FC = () => {
  const [tree, setTree] = useState<TreeNode[]>(initialTree);

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) return;

    const visibleNodes = getVisibleNodes(tree);

    const sourceNode = visibleNodes[source.index];
    const destinationNode = visibleNodes[destination.index];

    const sourceParentId = visibleNodes.find(
      (item) => item.node.children.some((child) => child.id === sourceNode.node.id)
    )?.node.id;

    const destinationParentId = destinationNode.node.id;

    // If moving within the same parent
    if (sourceParentId === destinationParentId) {
      const updatedTree = moveNode(
        tree,
        sourceNode.node.id,
        destinationParentId,
        destination.index
      );
      setTree(updatedTree);
      return;
    }

    // Moving between different parents
    const updatedTree = moveNode(
      tree,
      sourceNode.node.id,
      destinationParentId,
      destination.index
    );
    setTree(updatedTree);
  };

  const renderTree = () => {
    const visibleNodes = getVisibleNodes(tree);

    return visibleNodes.map(({ node, depth }, index) => (
      <Draggable key={node.id} draggableId={node.id} index={index}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={{
              paddingLeft: `${depth * 20}px`,
              ...provided.draggableProps.style,
            }}
            className="mb-2"
          >
            <Card>
              <CardHeader className="flex items-center">
                {node.children.length > 0 && (
                  <Button
                    size="icon"
                    onClick={() =>
                      setTree(
                        tree.map((n) =>
                          n.id === node.id
                            ? { ...n, expanded: !n.expanded }
                            : n
                        )
                      )
                    }
                    variant="ghost"
                  >
                    {node.expanded ? "▼" : "▶"}
                  </Button>
                )}
                <CardTitle>{node.title}</CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}
      </Draggable>
    ));
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="tree" type="TREE">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="p-4 bg-gray-50 rounded-md"
          >
            {renderTree()}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default App;