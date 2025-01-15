import React, { useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import { Card, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "./components/ui/sheet";

type TreeNode = {
  id: string;
  title: string;
  children: TreeNode[];
  expanded: boolean;
  color?: string; // Optional color property
};

const initialTree: TreeNode[] = [
  {
    id: "1",
    title: "Root Node 1",
    expanded: true,
    color: "blue",
    children: [
      {
        id: "2",
        title: "Child Node 1.1",
        expanded: true,
        color: "red",
        children: [],
      },
      {
        id: "3",
        title: "Child Node 1.2",
        expanded: true,
        color: "green",
        children: [],
      },
    ],
  },
  {
    id: "4",
    title: "Root Node 2",
    expanded: true,
    color: "purple",
    children: [
      {
        id: "5",
        title: "Child Node 2.1",
        expanded: true,
        color: "orange",
        children: [],
      },
    ],
  },
];

const App: React.FC = () => {
  const [tree, setTree] = useState<TreeNode[]>(initialTree);
  const [newNodeName, setNewNodeName] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<string | null>("root");
  const [selectedColor, setSelectedColor] = useState<string>("blue");
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const colors = [
    "red",
    "blue",
    "green",
    "yellow",
    "purple",
    "pink",
    "indigo",
    "teal",
    "orange",
    "cyan",
    "lime",
    "gray",
  ];

  const flattenTree = (
    nodes: TreeNode[] = [], // Default to an empty array if undefined
    parentId: string | null = null,
    depth = 0
  ): { node: TreeNode; parentId: string | null; depth: number }[] => {
    return nodes.flatMap((node) => {
      if (!node) return []; // Ensure node is valid before processing
      return [
        { node, parentId, depth },
        ...(node.expanded && Array.isArray(node.children)
          ? flattenTree(node.children, node.id, depth + 1)
          : []),
      ];
    });
  };
  
  const moveNode = (
    tree: TreeNode[],
    sourceId: string,
    destinationParentId: string | null,
    destinationIndex: number
  ): TreeNode[] => {
    let movedNode: TreeNode | null = null;
  
    // Step 1: Remove the node from its original position
    const removeNode = (nodes: TreeNode[]): TreeNode[] => {
      return nodes
        .filter((node) => {
          if (node.id === sourceId) {
            movedNode = { ...node }; // Store the node being moved
            return false; // Remove it from the array
          }
          return true;
        })
        .map((node) => ({
          ...node,
          children: removeNode(node.children),
        }));
    };
  
    // Step 2: Add the node to its new position
    const addNode = (nodes: TreeNode[]): TreeNode[] => {
      if (!destinationParentId) {
        // Adding to the root level
        const updatedNodes = [...nodes];
        if (movedNode) {
          updatedNodes.splice(destinationIndex, 0, movedNode);
        }
        return updatedNodes;
      }
  
      return nodes.map((node) => {
        if (node.id === destinationParentId && movedNode) {
          // Add as a child of the destination parent
          const updatedChildren = [...node.children];
          updatedChildren.splice(destinationIndex, 0, movedNode);
          return { ...node, children: updatedChildren };
        }
        return { ...node, children: addNode(node.children) };
      });
    };
  
    // Step 3: Remove and then add the node
    const treeWithoutSource = removeNode(tree);
  
    if (!movedNode) {
      console.error("Error: Unable to locate the node to move");
      return tree; // Return the original tree if something goes wrong
    }
  
    return addNode(treeWithoutSource);
  };
  
  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;
  
    if (!destination) return; // Do nothing if dropped outside a valid drop area
  
    const flatTree = flattenTree(tree);
  
    const sourceNodeData = flatTree[source.index];
    const destinationNodeData = flatTree[destination.index];
  
    if (!sourceNodeData) {
      console.error("Error: Missing source node data");
      return;
    }
  
    // Determine the parent of the destination
    const destinationParentId =
      destinationNodeData?.parentId ?? null;
  
    // Determine the destination index within its parent
    const destinationSiblings = flatTree.filter(
      (item) => item.parentId === destinationParentId
    );
    const destinationIndex = destinationSiblings.findIndex(
      (item) => item.node.id === destinationNodeData?.node.id
    );
  
    // Update the tree
    const updatedTree = moveNode(
      tree,
      sourceNodeData.node.id,
      destinationParentId,
      destinationIndex
    );
  
    setTree(updatedTree);
  };

  const toggleNode = (nodeId: string) => {
    const toggleNodeRecursively = (nodes: TreeNode[]): TreeNode[] =>
      nodes.map((node) =>
        node.id === nodeId
          ? { ...node, expanded: !node.expanded }
          : { ...node, children: toggleNodeRecursively(node.children) }
      );

    setTree(toggleNodeRecursively(tree));
  };

  const handleAddNode = () => {
    if (!newNodeName) return;

    const newNode: TreeNode = {
      id: Date.now().toString(),
      title: newNodeName,
      expanded: true,
      color: selectedColor,
      children: [],
    };

    if (selectedLocation === "root") {
      setTree([...tree, newNode]);
    } else {
      const addNewNode = (nodes: TreeNode[]): TreeNode[] =>
        nodes.map((node) =>
          node.id === selectedLocation
            ? { ...node, children: [...node.children, newNode] }
            : { ...node, children: addNewNode(node.children) }
        );

      setTree(addNewNode(tree));
    }

    setNewNodeName(""); // Reset the node name input field
  };

  const renderTree = () => {
    const flatTree = flattenTree(tree);

    return flatTree.map(({ node, depth }, index) => (
      <Draggable key={node.id} draggableId={node.id} index={index}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={{
              paddingLeft: `${depth > 0 ? depth * 30 + 16 : 0}px`,
              ...provided.draggableProps.style,
            }}
            className="mb-2"
          >
            <Card>
              <CardHeader className="flex items-center gap-2">
                {node.children.length > 0 && (
                  <Button
                    size="icon"
                    isIconOnly={true}
                    onClick={() => toggleNode(node.id)}
                    variant="ghost"
                  >
                    {node.expanded ? "▼" : "▶"}
                  </Button>
                )}
                <div
                  className={`w-3 h-3 rounded-full bg-${node.color || "gray"}-500`}
                ></div>
                <CardTitle>{node.title}</CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}
      </Draggable>
    ));
  };

  return (
    <div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="tree" type="TREE">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="p-4 bg-gray-50 rounded-md w-[300px] mx-auto"
            >
              {renderTree()}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className="mt-4">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="default" onClick={() => setIsSheetOpen(true)}>
              Add New Node
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Add New Node</SheetTitle>
              <SheetDescription>
                Create a new node by providing its name and selecting a location.
              </SheetDescription>
            </SheetHeader>
            <div className="mt-4">
              <div>
                <label className="block font-medium">Node Name</label>
                <input
                  type="text"
                  value={newNodeName}
                  onChange={(e) => setNewNodeName(e.target.value)}
                  placeholder="Enter node name"
                  className="mt-2 p-2 border rounded w-full bg-white text-black"
                />
              </div>
              <div className="mt-4">
                <label className="block font-medium">Select Button Color</label>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`p-2 rounded bg-${color}-500 text-white ${
                        selectedColor === color ? "ring-2 ring-offset-2 ring-gray-800" : ""
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-4">
                <label className="block font-medium">Save Location</label>
                <select
                  value={selectedLocation || ""}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="mt-2 p-2 border rounded w-full bg-white text-black"
                >
                  <option value="root">Add as Root Node</option>
                  {flattenTree(tree).map(({ node }) => (
                    <option key={node.id} value={node.id}>
                      {node.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <Button variant="ghost" onClick={() => setIsSheetOpen(false)}>
                  Close
                </Button>
                <Button variant="default" onClick={handleAddNode}>
                  Add Node
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default App;