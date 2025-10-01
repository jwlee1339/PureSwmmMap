/**
 * @file This file contains JSDoc type definitions for the data structures
 * used in the DFS_Paths.json file.
 */

/**
 * Represents a link in a calculated path.
 * @typedef {object} PathLink
 * @property {string} ID - The unique identifier of the link.
 * @property {string} Type - The type of the link (e.g., "CONDUIT").
 * @property {boolean} Marked - A boolean flag indicating if the link is marked.
 * @property {string} FromNode - The ID of the node where the link starts.
 * @property {string} ToNode - The ID of the node where the link ends.
 * @property {number} Length - The length of the link.
 * @property {number} Height - The height of the link.
 * @property {number} InOffset - The inlet offset of the link.
 * @property {number} OutOffset - The outlet offset of the link.
 */

/**
 * Represents a node in a calculated path.
 * @typedef {object} PathNode
 * @property {string} ID - The unique identifier of the node.
 * @property {string} type - The type of the node (e.g., "JUNCTION", "OUTFALL").
 * @property {number} Invert - The invert elevation of the node.
 * @property {number} MaxDepth - The maximum depth of the node.
 * @property {string[]} aLink - An array of link IDs connected to this node.
 * @property {number} PathLength - The length of the path from the start node to this node.
 * @property {number} TopElevation - The top elevation of the node.
 */

/**
 * Represents a path found by the DFS (Depth-First Search) algorithm.
 * @typedef {object} DFSPath
 * @property {string} Version - The version of the DFS search algorithm.
 * @property {string} ProjectId - The ID of the project.
 * @property {string} SWMMInpFile - The path to the SWMM input file.
 * @property {string} StartNode - The ID of the starting node for the path search.
 * @property {string} EndNode - The ID of the ending node for the path search.
 * @property {string} PublishDate - The date and time when the path was published.
 * @property {string[]} LinkIds - An array of link IDs that form the path.
 * @property {string[]} NodeIds - An array of node IDs that form the path.
 * @property {PathNode[]} PNodes - An array of detailed node objects in the path.
 * @property {PathLink[]} PLinks - An array of detailed link objects in the path.
 * @property {string} Message - A status message (e.g., "OK").
 */
