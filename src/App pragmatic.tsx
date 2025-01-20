import React, { useState, useEffect, useRef } from "react";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import {
  extractClosestEdge,
  type Edge,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { Box } from "@atlaskit/primitives";

type TreeNode = {
  id: string;
  title: string;
  children: TreeNode[];
  expanded: boolean;
};

const initialTree: TreeNode[] = [
  {
    id: "1",
    title: "Node 1",
    expanded: true,
    children: [
      { id: "2", title: "Child 1", expanded: true, children: [] },
      { id: "3", title: "Child 2", expanded: true, children: [] },
    ],
  },
  {
    id: "4",
    title: "Node 2",
    expanded: true,
    children: [{ id: "5", title: "Child 3", expanded: true, children: [] }],
  },
];

type TreeItemProps = {
  node: TreeNode;
  depth: number;
  onMove: (
    sourceId: string,
    targetId: string | null,
    position: "above" | "below" | "inside"
  ) => void;
};

function TreeItem({ node, depth, onMove }: TreeItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [closestEdge, setClosestEdge] = useState<Edge | "inside" | null>(null);

  // Make this item draggable
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    return draggable({
      element,
      getInitialData: () => ({ id: node.id }),
    });
  }, [node.id]);

  // Make this item a drop target
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    return dropTargetForElements({
      element,
      getData: ({ input }) => {
        const edge = extractClosestEdge({ element, input });
        return {
          closestEdge: edge ?? "inside", // Default to "inside" when no edge is detected
        };
      },
      onDrag({ self }) {
        const edge = self.data.closestEdge as Edge | "inside" | null;
        setClosestEdge(edge);
      },
      onDragLeave() {
        setClosestEdge(null);
      },
      onDrop({ source }) {
        const sourceId = source.data.id as string;
        const position =
          closestEdge === "top"
            ? "above"
            : closestEdge === "bottom"
            ? "below"
            : "inside";

        onMove(sourceId, node.id, position);
        setClosestEdge(null);
      },
    });
  }, [node.id, closestEdge, onMove]);

  return (
    <div
      style={{
        position: "relative",
        paddingLeft: `${depth * 16}px`,
      }}
    >
      {/* Drop Indicator for "above" */}
      {closestEdge === "top" && (
        <div
          style={{
            height: "4px",
            backgroundColor: "#0074CC",
            borderRadius: "2px",
            marginBottom: "4px",
          }}
        />
      )}

      {/* Node */}
      <Box
        ref={ref}
        style={{
          padding: "8px",
          border:
            closestEdge === "inside" ? "2px dashed #0074CC" : "1px solid lightgray",
          borderRadius: "4px",
          backgroundColor: closestEdge === "inside" ? "#E3F2FD" : "#fff",
        }}
      >
        {node.title}
      </Box>

      {/* Drop Indicator for "below" */}
      {closestEdge === "bottom" && (
        <div
          style={{
            height: "4px",
            backgroundColor: "#0074CC",
            borderRadius: "2px",
            marginTop: "4px",
          }}
        />
      )}
    </div>
  );
}

function Tree({
  nodes,
  depth = 0,
  onMove,
}: {
  nodes: TreeNode[];
  depth?: number;
  onMove: (
    sourceId: string,
    targetId: string | null,
    position: "above" | "below" | "inside"
  ) => void;
}) {
  return (
    <>
      {nodes.map((node) => (
        <React.Fragment key={node.id}>
          <TreeItem node={node} depth={depth} onMove={onMove} />
          {node.expanded && node.children.length > 0 && (
            <Tree nodes={node.children} depth={depth + 1} onMove={onMove} />
          )}
        </React.Fragment>
      ))}
    </>
  );
}

export default function App() {
  const [tree, setTree] = useState<TreeNode[]>(initialTree);

  const moveNode = (
    sourceId: string,
    targetId: string | null,
    position: "above" | "below" | "inside"
  ) => {
    const removeNode = (nodes: TreeNode[]): { newNodes: TreeNode[]; node: TreeNode | null } => {
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].id === sourceId) {
          const [node] = nodes.splice(i, 1);
          return { newNodes: [...nodes], node };
        }

        const { newNodes, node } = removeNode(nodes[i].children);
        if (node) {
          nodes[i].children = newNodes;
          return { newNodes: [...nodes], node };
        }
      }
      return { newNodes: nodes, node: null };
    };

    const addNode = (
      nodes: TreeNode[],
      node: TreeNode,
      targetId: string | null
    ): TreeNode[] => {
      if (!targetId) {
        // Drop at root level
        return [...nodes, node];
      }

      return nodes.map((n) => {
        if (n.id === targetId) {
          if (position === "inside") {
            return { ...n, children: [...n.children, node] };
          }

          const index = nodes.indexOf(n);
          const updatedNodes = [...nodes];
          updatedNodes.splice(position === "above" ? index : index + 1, 0, node);
          return n;
        }

        return { ...n, children: addNode(n.children, node, targetId) };
      });
    };

    setTree((prevTree) => {
      const { newNodes, node } = removeNode(prevTree);
      if (!node) return prevTree;
      return addNode(newNodes, node, targetId);
    });
  };

  return <Tree nodes={tree} onMove={moveNode} />;
}