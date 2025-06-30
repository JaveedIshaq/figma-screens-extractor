# Figma Screens Export Tool

A Node.js tool to export screens (artboards) from Figma design files as high-quality images.

## What it does

This tool specifically exports **FRAME nodes** from your Figma design, which represent screens, artboards, or pages. It will:

1. Connect to the Figma API using your access token
2. Scan your Figma file for all FRAME nodes (screens)
3. Export each screen as PNG (preferred) or SVG format
4. Save them with descriptive names in your chosen directory

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Get your Figma access token:**

   - Go to Figma → Account Settings → Personal Access Tokens
   - Generate a new token
   - Copy the token

3. **Get your Figma file ID:**

   - Open your Figma file in the browser
   - Copy the file ID from the URL: `https://www.figma.com/file/FILE_ID_HERE/...`

4. **Configure the tool:**

   **Option A: Environment variables (recommended)**
   Create a `.env` file in the project root:

   ```
   FIGMA_TOKEN=your_figma_token_here
   FIGMA_FILE_ID=your_figma_file_id_here
   ```

   **Option B: Edit the script directly**
   Update the values in `index.js`:

   ```javascript
   const FIGMA_TOKEN = "your_figma_token_here";
   const FIGMA_FILE_ID = "your_figma_file_id_here";
   ```

## Configuration

You can customize the export behavior by modifying the configuration variables in `index.js`:

### Project Name Configuration

```javascript
// exported project name
// change this to the name of the project you are exporting
const OUTPUT_DIR_NAME = "planteria";
```

### Screen Dimensions Configuration

```javascript
// change this to the width and height of the screen you are exporting
const SCREEN_WIDTH = 375;
const SCREEN_HEIGHT = 812;
```

### Additional Configuration

You can also customize the export behavior by modifying the `CONFIG` object in `index.js`:

```javascript
const CONFIG = {
  // Directory to save exported screens
  outputDir: "./exported-projects/nursing-app",

  // Preferred image formats (in order of preference)
  imageFormats: ["png", "svg"],

  // Whether to include screen dimensions in the filename
  includeDimensions: false,

  // Delay between API calls (ms) to avoid rate limiting
  apiDelay: 200,
};
```

### Configuration Options:

- **`OUTPUT_DIR_NAME`**: The name of your project folder where screens will be saved
- **`SCREEN_WIDTH`**: Target width for exported screens (in pixels)
- **`SCREEN_HEIGHT`**: Target height for exported screens (in pixels)
- **`outputDir`**: Where to save the exported screen images
- **`imageFormats`**: Image formats to try (PNG recommended for screens)
- **`includeDimensions`**: Add width×height to filenames (e.g., `screen-login-375x812.png`)
- **`apiDelay`**: Delay between API calls to respect Figma's rate limits

## Usage

Run the export tool:

```bash
node index.js
```

The tool will:

- Show how many screens were found
- Display the dimensions of each screen
- Export each screen and show progress
- Save files with names like `screen-Login.png`, `screen-Dashboard.png`, etc.

## Output

Exported screens will be saved to your configured output directory with names like:

- `screen-Login.png`
- `screen-Dashboard.png`
- `screen-Profile.png`

If you enable `includeDimensions`, filenames will include size info:

- `screen-Login-375x812.png`
- `screen-Dashboard-1920x1080.png`

## Troubleshooting

**No screens found?**

- Make sure your Figma file contains FRAME nodes (not just groups or components)
- Frames are typically the main artboards/screens in your design

**API errors?**

- Check that your Figma token is valid and has access to the file
- Verify the file ID is correct
- Make sure the file is accessible with your token

**Rate limiting?**

- The tool includes delays to respect Figma's API limits
- If you get rate limited, increase the `apiDelay` value in CONFIG

## File Structure

```
figma-screens-export-tool/
├── index.js              # Main export script
├── package.json          # Dependencies
├── .env                  # Your Figma credentials (create this)
└── exported-projects/    # Output directory
    └── nursing-app/      # Your exported screens will be here
```

## Requirements

- Node.js 12+
- Valid Figma access token
- Figma file with FRAME nodes (screens/artboards)
