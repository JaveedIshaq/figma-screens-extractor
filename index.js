require('dotenv').config();

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

/**
 * Figma Screens Export Tool
 * 
 * This script exports only screens (FRAME nodes) from a Figma design file as images.
 * Screens are typically the main artboards/pages in your Figma design.
 * 
 * The script will:
 * 1. Connect to Figma API using your token
 * 2. Find all FRAME nodes (screens) in your design
 * 3. Export each screen as PNG
 * 4. Save them to the output directory with descriptive names
 */

// Configuration - Replace these with your Figma token and file ID
const FIGMA_TOKEN = process.env.FIGMA_TOKEN;
const FIGMA_FILE_ID = process.env.FIGMA_FILE_ID;

// exported project name
// change this to the name of the project you are exporting
const OUTPUT_DIR_NAME = 'planteria';

// change this to the width and height of the screen you are exporting
const SCREEN_WIDTH = 375;
const SCREEN_HEIGHT = 812;

// Export configuration
const CONFIG = {
  // Directory to save exported screens
  outputDir: `./exported-projects/${OUTPUT_DIR_NAME}`,
  // Preferred image formats (in order of preference)
  imageFormats: ['png'],
  // Whether to include screen dimensions in the filename
  includeDimensions: false,
  // Delay between API calls (ms) to avoid rate limiting
  apiDelay: 200,
  // Filter screens by dimensions (set to null to export all screens)
  // Only export screens with these exact dimensions
  targetDimensions: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT
  }
};

// Create output directory if it doesn't exist
if (!fs.existsSync(CONFIG.outputDir)) {
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

// Figma API base URL
const FIGMA_API_URL = 'https://api.figma.com/v1';

// Function to fetch Figma file data
async function fetchFigmaFile() {
  try {
    const response = await axios.get(`${FIGMA_API_URL}/files/${FIGMA_FILE_ID}`, {
      headers: {
        'X-Figma-Token': FIGMA_TOKEN,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching Figma file:', error);
    process.exit(1);
  }
}

// Function to extract screen nodes (FRAME nodes) from Figma file
function extractScreenNodes(nodes) {
  const screenNodes = [];
  function traverse(node) {
    // Only include FRAME nodes which represent screens/artboards in Figma
    if (node.type === 'FRAME') {
      const screenData = {
        id: node.id,
        name: node.name,
        type: node.type,
        absoluteBoundingBox: node.absoluteBoundingBox,
        // Add additional metadata that might be useful
        backgroundColor: node.backgroundColor,
        effects: node.effects,
        constraints: node.constraints
      };

      // Filter by dimensions if targetDimensions is configured
      if (CONFIG.targetDimensions && node.absoluteBoundingBox) {
        const { width, height } = node.absoluteBoundingBox;
        if (width === CONFIG.targetDimensions.width && height === CONFIG.targetDimensions.height) {
          screenNodes.push(screenData);
        }
      } else if (!CONFIG.targetDimensions) {
        // If no dimension filter is set, include all FRAME nodes
        screenNodes.push(screenData);
      }
    }
    // Continue traversing children to find nested frames if any
    if (node.children) {
      node.children.forEach(traverse);
    }
  }
  nodes.forEach(traverse);
  return screenNodes;
}



// Function to download and save images
async function downloadImage(url, filePath) {
  if (!url) {
    console.error(`Skipping ${filePath}: Invalid or empty URL`);
    return false;
  }
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    fs.writeFileSync(filePath, response.data);
    console.log(`Downloaded: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Error downloading ${filePath}:`, error.message);
    return false;
  }
}

// Function to sanitize file names
function sanitizeFileName(name) {
  return name.replace(/[/\\?%*:|"<>]/g, '-'); // Replace invalid characters with '-'
}

// Function to generate a unique file name
function getUniqueFilePath(basePath, extension) {
  let filePath = `${basePath}.${extension}`;
  let counter = 1;
  while (fs.existsSync(filePath)) {
    filePath = `${basePath}-${counter}.${extension}`;
    counter++;
  }
  return filePath;
}

// Function to delay execution
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Function to get image URL from Figma API
async function getImageUrl(nodeId, format = 'png') {
  try {
    const response = await axios.get(
      `${FIGMA_API_URL}/images/${FIGMA_FILE_ID}?ids=${nodeId}&format=${format}`,
      {
        headers: {
          'X-Figma-Token': FIGMA_TOKEN,
        },
      }
    );
    return response.data.images[nodeId];
  } catch (error) {
    console.error('Error getting image URL:', error.message);
    return null;
  }
}



// Main function
async function main() {
  // Fetch Figma file data
  const figmaFile = await fetchFigmaFile();
  const nodes = figmaFile.document.children;

  // Extract screen nodes (FRAME nodes only)
  const screenNodes = extractScreenNodes(nodes);
  
  if (CONFIG.targetDimensions) {
    console.log(`Found ${screenNodes.length} screen(s) with dimensions ${CONFIG.targetDimensions.width}x${CONFIG.targetDimensions.height}px to export.`);
  } else {
    console.log(`Found ${screenNodes.length} screen(s) to export.`);
  }

  if (screenNodes.length === 0) {
    if (CONFIG.targetDimensions) {
      console.log(`No screens found with dimensions ${CONFIG.targetDimensions.width}x${CONFIG.targetDimensions.height}px!`);
      console.log('Check your targetDimensions in CONFIG or set it to null to export all screens.');
    } else {
      console.log('No screens found! Make sure your Figma file contains FRAME nodes representing screens.');
    }
    return;
  }

  // Download and process each screen node
  for (const node of screenNodes) {
    const baseFileName = sanitizeFileName(node.name);
    console.log(`\nExporting screen: ${node.name}`);
    
    // Screen dimensions info
    if (node.absoluteBoundingBox) {
      console.log(`  Dimensions: ${node.absoluteBoundingBox.width}x${node.absoluteBoundingBox.height}px`);
    }

    // Use configured image formats
    let downloadedSuccessfully = false;
    
    for (const format of CONFIG.imageFormats) {
      const url = await getImageUrl(node.id, format);
      if (url) {
        // Create filename with optional dimensions
        let fileName = `screen-${baseFileName}`;
        if (CONFIG.includeDimensions && node.absoluteBoundingBox) {
          fileName += `-${node.absoluteBoundingBox.width}x${node.absoluteBoundingBox.height}`;
        }
        
        const filePath = getUniqueFilePath(path.join(CONFIG.outputDir, fileName), format);
        const success = await downloadImage(url, filePath);
        if (success) {
          console.log(`  ✓ Downloaded as ${format.toUpperCase()}: ${path.basename(filePath)}`);
          downloadedSuccessfully = true;
          // For screens, we typically only need one format, so break after first success
          break;
        }
      }
      // Add a small delay between format attempts
      await delay(100);
    }

    if (!downloadedSuccessfully) {
      console.log(`  ✗ Failed to download screen: ${node.name}`);
    }

    // Add a delay between nodes to avoid rate limits
    await delay(CONFIG.apiDelay);
  }

  console.log(`\n✅ Export completed! Check the ${CONFIG.outputDir} directory for your screen exports.`);
}

// Run the script
main();