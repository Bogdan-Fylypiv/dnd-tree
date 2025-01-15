import React, { useState } from "react";
import { useEffect, useRef } from "react";
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
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

type TreeNode = {
  id: string;
  title: string;
  children: TreeNode[];
  expanded: boolean;
  color?: string;
};

const colors: string[] = [
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

const colorClassMap: Record<string, string> = {
  red: "bg-red-500",
  blue: "bg-blue-500",
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  purple: "bg-purple-500",
  pink: "bg-pink-500",
  indigo: "bg-indigo-500",
  teal: "bg-teal-500",
  orange: "bg-orange-500",
  cyan: "bg-cyan-500",
  lime: "bg-lime-500",
  gray: "bg-gray-500",
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
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [currentNode, setCurrentNode] = useState<TreeNode | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<number>(0);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedNodeName, setEditedNodeName] = useState<string>("");
  const [editedNodeColor, setEditedNodeColor] = useState<string>("blue");
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true; // Set to true on mount

    return () => {
      isMounted.current = false; // Set to false on unmount
    };
  }, []);

  const safeSetTree = (newTree: TreeNode[]) => {
    if (isMounted.current) {
      setTree(newTree); // Update state only if the component is mounted
    }
  };

  const flattenTree = (
    nodes: TreeNode[] = [],
    parentId: string | null = null,
    depth = 0
  ): { node: TreeNode; parentId: string | null; depth: number }[] => {
    return nodes.flatMap((node) => [
      { node, parentId, depth },
      ...(node.expanded
        ? flattenTree(node.children, node.id, depth + 1)
        : []),
    ]);
  };

  const moveNode = (
    tree: TreeNode[],
    sourceId: string,
    destinationParentId: string | null,
    destinationIndex: number
  ): TreeNode[] => {
    let movedNode: TreeNode | null = null;

    // Step 1: Remove the node
    const removeNode = (nodes: TreeNode[]): TreeNode[] =>
      nodes
        .filter((node) => {
          if (node.id === sourceId) {
            movedNode = { ...node };
            return false; // Remove this node
          }
          return true;
        })
        .map((node) => ({
          ...node,
          children: removeNode(node.children), // Recurse into children
        }));

    const treeWithoutSource = removeNode(tree);
    if (!movedNode) {
      throw new Error("moveNode: Unable to locate the node to move");
    }

    // Step 2: Add the node to the correct location
    const addNode = (nodes: TreeNode[]): TreeNode[] => {
      if (!destinationParentId) {
        // Add to root level
        const updatedNodes = [...nodes];
        updatedNodes.splice(destinationIndex, 0, movedNode!); // Ensure non-null
        return updatedNodes;
      }

      return nodes.map((node) => {
        if (node.id === destinationParentId) {
          const updatedChildren = [...node.children];
          updatedChildren.splice(destinationIndex, 0, movedNode!); // Ensure non-null
          return { ...node, children: updatedChildren };
        }
        return { ...node, children: addNode(node.children) }; // Recurse
      });
    };

    return addNode(treeWithoutSource); // Return updated tree
  };

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    const flatTree = flattenTree(tree);
    const sourceNodeData = flatTree[source.index];
    const destinationNodeData = flatTree[destination.index];

    if (!sourceNodeData || !destinationNodeData) {
      console.error("Error: Missing source or destination node data");
      return;
    }

    const destinationParentId =
      destinationNodeData.parentId || (destinationNodeData.depth === 0 ? null : destinationNodeData.node.id);

    const destinationSiblings = flatTree.filter(
      (item) => item.parentId === destinationParentId
    );
    const destinationIndex = destinationSiblings.findIndex(
      (item) => item.node.id === destinationNodeData.node.id
    );

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
      setTree([...tree, newNode]); // Add as a root node
    } else {
      const addNewNode = (nodes: TreeNode[]): TreeNode[] =>
        nodes.map((node) =>
          node.id === selectedLocation
            ? { ...node, children: [...node.children, newNode] }
            : { ...node, children: addNewNode(node.children) }
        );

      setTree(addNewNode(tree));
    }

    setNewNodeName(""); // Clear input
  };

  const openEditDialog = (node: TreeNode) => {
    setCurrentNode(node);
    setEditedNodeName(node.title);
    setEditedNodeColor(node.color || "blue");
    setIsEditDialogOpen(true);
  };

  const handleUpdateNode = () => {
    if (!currentNode) return;
  
    const updateNode = (nodes: TreeNode[]): TreeNode[] =>
      nodes.map((node) =>
        node.id === currentNode.id
          ? { ...node, title: editedNodeName, color: editedNodeColor }
          : { ...node, children: updateNode(node.children) }
      );
  
    setTree(updateNode(tree));
    setIsEditDialogOpen(false);
  };

  const removeNode = (nodeId: string) => {
    const deleteNode = (nodes: TreeNode[]): TreeNode[] =>
      nodes
        .filter((node) => node.id !== nodeId) // Remove the node
        .map((node) => ({
          ...node,
          children: deleteNode(node.children), // Recurse into children
        }));

    safeSetTree(deleteNode(tree)); // Use the safe state updater
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
              <CardHeader className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
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
                    className={`w-3 h-3 rounded-full ${
                      colorClassMap[node.color || "gray"]
                    }`}
                  ></div>
                  <CardTitle>{node.title}</CardTitle>
                </div>
                {/* Dropdown Menu */}
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <Button size="icon" variant="ghost">
                      ⋮
                    </Button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content
                    className="bg-gray-800 text-white rounded shadow-lg p-2"
                    sideOffset={5}
                  >
                    {/* Move Node Option */}
                    <DropdownMenu.Item
                      className="p-2 cursor-pointer hover:bg-gray-700 rounded"
                      onClick={() => {
                        setCurrentNode(node);
                        setIsMoveDialogOpen(true);
                      }}
                    >
                      Move
                    </DropdownMenu.Item>

                    {/* Edit Node Option */}
                    <DropdownMenu.Item
                      className="p-2 cursor-pointer hover:bg-gray-700 rounded"
                      onClick={() => openEditDialog(node)}
                    >
                      Edit
                    </DropdownMenu.Item>

                    {/* Remove Node Option */}
                    <DropdownMenu.Item
                      className="p-2 cursor-pointer hover:bg-red-700 rounded text-red-500"
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to remove "${node.title}"?`)) {
                          removeNode(node.id);
                        }
                      }}
                    >
                      Remove
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              </CardHeader>
            </Card>
          </div>
        )}
      </Draggable>
    ));
  };

  return (
  <div>
    {/* Move Dialog */}
    {isMoveDialogOpen && currentNode && (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={() => setIsMoveDialogOpen(false)} // Close dialog on backdrop click
    >
      <div
        className="bg-gray-800 text-white p-6 rounded shadow-lg w-96"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside dialog
      >
        <h2 className="text-lg font-bold mb-4">Move</h2>

        {/* Select Parent Node */}
        <div className="mb-4">
          <label className="block font-medium mb-2">Parent *</label>
          <select
            className="w-full bg-gray-700 border border-gray-600 text-white p-2 rounded"
            value={selectedParentId || ""}
            onChange={(e) => setSelectedParentId(e.target.value)}
          >
            <option value="" disabled>Select a parent</option>
            {flattenTree(tree)
              .filter(({ node }) => node.id !== currentNode.id) // Exclude current node
              .map(({ node }) => (
                <option key={node.id} value={node.id}>
                  {node.title}
                </option>
              ))}
          </select>
        </div>

        {/* Select Position */}
        <div className="mb-4">
          <label className="block font-medium mb-2">Position *</label>
          <select
            className="w-full bg-gray-700 border border-gray-600 text-white p-2 rounded"
            value={selectedPosition}
            onChange={(e) => setSelectedPosition(Number(e.target.value))}
            disabled={!selectedParentId} // Disable until a parent is selected
          >
            {(() => {
              const selectedParent = flattenTree(tree).find(
                ({ node }) => node.id === selectedParentId
              )?.node;

              const siblingCount = selectedParent
                ? selectedParent.children.length
                : tree.length; // Use root level if no parent

              return [...Array(siblingCount + 1)].map((_, idx) => (
                <option key={idx} value={idx}>
                  {idx + 1} {idx === 0 ? "(first)" : idx === siblingCount ? "(last)" : ""}
                </option>
              ));
            })()}
          </select>
        </div>

        {/* Dialog Buttons */}
        <div className="flex justify-end gap-4">
          <button
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
            onClick={() => setIsMoveDialogOpen(false)}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
            onClick={() => {
              if (!selectedParentId) return alert("Please select a parent node");
              const updatedTree = moveNode(
                tree,
                currentNode.id,
                selectedParentId,
                selectedPosition
              );
              setTree(updatedTree);
              setIsMoveDialogOpen(false);
            }}
          >
            Move
          </button>
        </div>
      </div>
    </div>
  )}

{/* Edit Dialog */}
{isEditDialogOpen && currentNode && (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={() => setIsEditDialogOpen(false)} // Close dialog on backdrop click
      >
        <div
          className="bg-gray-800 text-white p-6 rounded shadow-lg w-96"
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside dialog
        >
          <h2 className="text-lg font-bold mb-4">Edit Node</h2>

          {/* Edit Node Name */}
          <div className="mb-4">
            <label className="block font-medium mb-2">Node Name</label>
            <input
              type="text"
              value={editedNodeName}
              onChange={(e) => setEditedNodeName(e.target.value)}
              placeholder="Enter node name"
              className="mt-2 p-2 border rounded w-full bg-white text-black"
            />
          </div>

          {/* Edit Node Color */}
          <div className="mb-4">
            <label className="block font-medium mb-2">Select Node Color</label>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setEditedNodeColor(color)}
                  className={`p-2 rounded ${colorClassMap[color]} text-white ${
                    editedNodeColor === color ? "ring-2 ring-offset-2 ring-gray-800" : ""
                  }`}
                >
                  {color.charAt(0).toUpperCase() + color.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Dialog Buttons */}
          <div className="flex justify-end gap-4">
            <button
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
              onClick={handleUpdateNode}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    )}
    
    {/* Drag and Drop Context */}
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

    {/* Add New Node Sheet */}
    <div className="mt-4">
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="default" onClick={() => setIsSheetOpen(true)}>
            Add New Node
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Add New Button Action</SheetTitle>
            <SheetDescription>
              Create a new button action by filling out this form. Click add
              when you're done.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            <div>
              <label className="block font-medium">Button Name</label>
              <input
                type="text"
                value={newNodeName}
                onChange={(e) => setNewNodeName(e.target.value)}
                placeholder="Enter button name"
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
                    className={`p-2 rounded ${colorClassMap[color]} text-white ${
                      selectedColor === color
                        ? "ring-2 ring-offset-2 ring-gray-800"
                        : ""
                    }`}
                  >
                    {color.charAt(0).toUpperCase() + color.slice(1)}
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
                <option value="">Select where to save</option>
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
                Add Action
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