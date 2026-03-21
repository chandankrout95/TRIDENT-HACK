import fs from 'fs';
import path from 'path';

const getAllFiles = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(file));
    } else if (file.endsWith('.js') && !file.includes('node_modules')) {
      results.push(file);
    }
  });
  return results;
};

const dirsToMigrate = [
  path.join(process.cwd(), 'src'),
  path.join(process.cwd(), 'tests')
];

let files = [];
dirsToMigrate.forEach(dir => {
  if (fs.existsSync(dir)) files = files.concat(getAllFiles(dir));
});

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // 1. dotenv specific fix
  content = content.replace(/require\(['"]dotenv['"]\)\.config\(\);?/g, "import dotenv from 'dotenv';\ndotenv.config();");

  // 2. Destructured require: const { a, b } = require('mod'); -> import { a, b } from 'mod.js';
  content = content.replace(/const\s+\{([^}]+)\}\s*=\s*require\(['"](.*?)['"]\);?/g, (match, p1, p2) => {
    let importPath = p2;
    if (importPath.startsWith('.') && !importPath.endsWith('.js')) importPath += '.js';
    return `import { ${p1.trim()} } from '${importPath}';`;
  });

  // 3. Default require: const a = require('mod'); -> import a from 'mod.js';
  content = content.replace(/const\s+([a-zA-Z0-9_]+)\s*=\s*require\(['"](.*?)['"]\);?/g, (match, p1, p2) => {
    let importPath = p2;
    if (importPath.startsWith('.') && !importPath.endsWith('.js')) importPath += '.js';
    return `import ${p1} from '${importPath}';`;
  });

  // 4. module.exports = { a, b }; -> export { a, b };
  content = content.replace(/module\.exports\s*=\s*\{([^}]+)\};?/g, 'export { $1 };');

  // 5. module.exports = a; -> export default a;
  content = content.replace(/module\.exports\s*=\s*([a-zA-Z0-9_]+);?/g, 'export default $1;');

  fs.writeFileSync(file, content, 'utf8');
});

console.log(`Converted ${files.length} files to ESM.`);
