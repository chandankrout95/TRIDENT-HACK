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
];

let files = [];
dirsToMigrate.forEach(dir => {
  if (fs.existsSync(dir)) files = files.concat(getAllFiles(dir));
});

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Fix mongoose.model
  content = content.replace(/export default mongoose;\.model/g, 'export default mongoose.model');
  // Fix error handler import which is default, not named (if needed)

  fs.writeFileSync(file, content, 'utf8');
});

console.log('Fixed mongoose export errors.');
