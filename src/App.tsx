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

// Helper function to flatten the tree
const getVisibleNodes = (
  nodes: TreeNode[],
  depth = 0,
  parentId: string | null = null
): { node: TreeNode; depth: number; parentId: string | null }[] => {
  let visibleNodes: { node: TreeNode; depth: number; parentId: string | null }[] = [];

  nodes.forEach((node) => {
    visibleNodes.push({ node, depth, parentId });

    if (node.expanded) {
      node.children.forEach((child) => {
        visibleNodes.push({ node: child, depth: depth + 1, parentId: node.id });
      });
    }
  });

  return visibleNodes;
};

// Function to move a node and its children within the tree
const moveNode = (
  tree: TreeNode[],
  sourceId: string,
  destinationId: string,
  destinationIndex: number,
  parentId: string | null
): TreeNode[] => {
  let movedNode: TreeNode | null = null;

  // Remove the node and its children
  const removeNode = (nodes: TreeNode[], nodeId: string): [TreeNode[], TreeNode | null] => {
    let nodeToRemove: TreeNode | null = null;
    const updatedNodes = nodes.filter((node) => {
      if (node.id === nodeId) {
        nodeToRemove = node;
        return false;
      }
      return true;
    }).map((node) => ({
      ...node,
      children: removeNode(node.children, nodeId)[0],
    }));
    return [updatedNodes, nodeToRemove];
  };

  // Add the node (and its children) to the new parent at the correct index
  const addNode = (nodes: TreeNode[], parentId: string | null, index: number): TreeNode[] => {
    return nodes.map((node) => {
      if (node.id === parentId && movedNode) {
        const updatedChildren = [...node.children];
        updatedChildren.splice(index, 0, movedNode);
        return { ...node, children: updatedChildren };
      }
      return {
        ...node,
        children: addNode(node.children, parentId, index),
      };
    });
  };

  const [treeWithoutSource, removedNode] = removeNode(tree, sourceId);
  if (removedNode) {
    movedNode = removedNode;

    // Preserve the node's children
    movedNode.children = removedNode.children;

    // Add the node to the new parent at the correct index
    return addNode(treeWithoutSource, parentId, destinationIndex);
  }

  return tree;
};

const App: React.FC = () => {
  const [tree, setTree] = useState<TreeNode[]>(initialTree);

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return; // Dropped outside any droppable

    const visibleNodes = getVisibleNodes(tree);
    const sourceNode = visibleNodes[source.index].node;
    const destinationNode = visibleNodes[destination.index].node;
    const sourceParentId = visibleNodes[source.index].parentId;
    const destinationParentId = visibleNodes[destination.index].parentId;

    // Ensure source and destination nodes are valid
    if (!sourceNode || !destinationNode) {
      console.error("Source or destination node not found");
      return;
    }

    // Move node based on whether it is being moved as a sibling or a child
    const updatedTree = moveNode(
      tree,
      sourceNode.id,
      destinationNode.id,
      destination.index,
      sourceParentId === destinationParentId ? sourceParentId : destinationParentId
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