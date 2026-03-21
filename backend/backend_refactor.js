import fs from 'fs';
import path from 'path';

const SRC_DIR = './src';
const FEATURES_DIR = path.join(SRC_DIR, 'features');

const dirsToCreate = ['controllers', 'models', 'routes', 'services', 'validations'];

// 1. Create layer directories
dirsToCreate.forEach(dir => {
  const dirPath = path.join(SRC_DIR, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// 2. Read all feature directories
if (fs.existsSync(FEATURES_DIR)) {
  const features = fs.readdirSync(FEATURES_DIR).filter(f => fs.statSync(path.join(FEATURES_DIR, f)).isDirectory());

  // 3. Move files to respective layers
  features.forEach(feature => {
    const featurePath = path.join(FEATURES_DIR, feature);
    
    // Function to recursively find JS files
    const getJsFiles = (dir, fileList = []) => {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
          getJsFiles(fullPath, fileList);
        } else if (fullPath.endsWith('.js')) {
          fileList.push(fullPath);
        }
      });
      return fileList;
    };

    const files = getJsFiles(featurePath);

    files.forEach(oldPath => {
      const file = path.basename(oldPath);
      let newDir = '';

      if (file.includes('.model.js')) newDir = 'models';
      else if (file.includes('.controller.js')) newDir = 'controllers';
      else if (file.includes('.routes.js')) newDir = 'routes';
      else if (file.includes('.service.js')) newDir = 'services';
      else if (file.includes('.validation.js')) newDir = 'validations';

      if (newDir) {
        const newPath = path.join(SRC_DIR, newDir, file);
        fs.renameSync(oldPath, newPath);
      }
    });

    // Remove feature dir completely
    fs.rmSync(featurePath, { recursive: true, force: true });
  });

  // Remove features dir
  fs.rmSync(FEATURES_DIR, { recursive: true, force: true });
  console.log('Moved files successfully.');
} else {
  console.log('Features directory not found.');
}
