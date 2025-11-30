// Quick script to fix Windows path normalization in download route
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const routesFile = path.join(__dirname, 'server', 'routes.ts');
let content = fs.readFileSync(routesFile, 'utf8');

// Find and replace the path handling logic
const oldPattern = `      const originalPath = plan.filePath;
      console.log("Original file path from DB:", originalPath);
      console.log("Current working directory:", process.cwd());
      
      // Strategy 1: Try the path as stored in DB (could be absolute or relative)
      if (path.isAbsolute(originalPath)) {
        filePath = originalPath;
      } else {
        filePath = path.join(process.cwd(), originalPath);
      }`;

const newPattern = `      const originalPath = plan.filePath;
      console.log("Original file path from DB:", originalPath);
      console.log("Current working directory:", process.cwd());
      
      // Normalize Windows backslashes to forward slashes for cross-platform compatibility
      const normalizedPath = originalPath.replace(/\\\\/g, '/');
      console.log("Normalized file path:", normalizedPath);
      
      // Strategy 1: Try the path as stored in DB (could be absolute or relative)
      if (path.isAbsolute(normalizedPath)) {
        filePath = normalizedPath;
      } else {
        filePath = path.join(process.cwd(), normalizedPath);
      }`;

if (content.includes(oldPattern)) {
  content = content.replace(oldPattern, newPattern);
  fs.writeFileSync(routesFile, content);
  console.log('✅ Path normalization fix applied successfully!');
} else {
  console.log('❌ Could not find the exact pattern to replace. Manual fix needed.');
  console.log('Looking for pattern starting with: "const originalPath = plan.filePath;"');
}
