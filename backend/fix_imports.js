import fs from 'fs';
import path from 'path';

const SRC_DIR = './src';
const SEED_FILE = './seed.js';

const directories = ['controllers', 'models', 'routes', 'services', 'validations'];

function getFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
          getFiles(fullPath, fileList);
      } else if (fullPath.endsWith('.js')) {
          fileList.push(fullPath);
      }
  }
  return fileList;
}

const allFiles = getFiles(SRC_DIR);
allFiles.push(SEED_FILE);

// We need to fix imports.
// Typical patterns:
// import X from './auth.model.js' -> import X from '../models/auth.model.js' (if in controllers/routes)
// import X from './auth.controller.js' -> import X from '../controllers/auth.controller.js'
// import X from '../../middleware/auth.js' -> import X from '../../middleware/auth.js' (remains same if moved from features/auth to routes/auth?)
// Wait! Previously files were in src/features/auth/auth.controller.js
// Now they are in src/controllers/auth.controller.js
// The relative distance to `src/middleware/auth.js` is the SAME! 
// Old: src/features/auth -> src/middleware (../../middleware)
// New: src/controllers -> src/middleware (../middleware)
// Ah! The depth changed from 2 levels deep (src/features/module) to 1 level deep (src/controllers)!

allFiles.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf-8');
  let newContent = content;

  // 1. Fix depth for middleware, config, utils
  // Old: ../../middleware/auth.js
  // New: ../middleware/auth.js
  // Only apply this to files inside controllers, models, routes, services (depth 1)
  const isDepth1 = directories.some(d => filePath.includes(`src/${d}/`));
  if (isDepth1) {
    newContent = newContent.replace(/\.\.\/\.\.\/middleware\//g, '../middleware/');
    newContent = newContent.replace(/\.\.\/\.\.\/config\//g, '../config/');
    newContent = newContent.replace(/\.\.\/\.\.\/utils\//g, '../utils/');
    newContent = newContent.replace(/\.\.\/\.\.\/services\//g, '../services/');
  }

  // 2. Fix sibling imports
  // Old: ./auth.model.js
  // New: ../models/auth.model.js
  // Old: ./auth.service.js
  // New: ../services/auth.service.js
  newContent = newContent.replace(/from\s+['"]\.\/(.*?)\.model\.js['"]/g, "from '../models/$1.model.js'");
  newContent = newContent.replace(/from\s+['"]\.\/(.*?)\.controller\.js['"]/g, "from '../controllers/$1.controller.js'");
  newContent = newContent.replace(/from\s+['"]\.\/(.*?)\.service\.js['"]/g, "from '../services/$1.service.js'");
  newContent = newContent.replace(/from\s+['"]\.\/(.*?)\.validation\.js['"]/g, "from '../validations/$1.validation.js'");
  newContent = newContent.replace(/from\s+['"]\.\/(.*?)\.routes\.js['"]/g, "from '../routes/$1.routes.js'");

  // 3. Fix app.js routes imports
  // Old: ./features/auth/auth.routes.js
  // New: ./routes/auth.routes.js
  if (filePath.endsWith('app.js')) {
    newContent = newContent.replace(/\.\/features\/.*?\/(.*?)\.routes\.js/g, './routes/$1.routes.js');
  }

  // 4. Fix seed.js model imports
  // Old: ./src/features/auth/auth.model.js
  // New: ./src/models/auth.model.js
  if (filePath.endsWith('seed.js')) {
    newContent = newContent.replace(/\.\/src\/features\/.*?\/(.*?)\.model\.js/g, './src/models/$1.model.js');
  }

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log(`Updated imports in ${filePath}`);
  }
});

console.log('Import paths updated automatically.');
