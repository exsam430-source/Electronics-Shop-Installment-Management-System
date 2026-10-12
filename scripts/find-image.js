const fs = require('fs');
const path = require('path');

function searchDir(dir, maxDepth = 4, currentDepth = 0) {
  if (currentDepth > maxDepth) return [];
  let results = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          results = results.concat(searchDir(full, maxDepth, currentDepth + 1));
        }
      } else if (/\.(png|jpg|jpeg|webp)$/i.test(entry.name)) {
        try {
          const stats = fs.statSync(full);
          const ageMinutes = (Date.now() - stats.mtimeMs) / 60000;
          if (ageMinutes < 25) {
            results.push({ path: full, size: stats.size, ageMinutes: Math.round(ageMinutes) });
          }
        } catch (e) {}
      }
    }
  } catch (e) {}
  return results;
}

const searchRoots = [
  path.join(process.env.USERPROFILE, 'AppData', 'Local', 'Temp'),
  path.join(process.env.USERPROFILE, '.gemini'),
  path.join(process.env.USERPROFILE, 'Downloads'),
  path.join(process.env.USERPROFILE, 'Desktop'),
  path.join(process.env.USERPROFILE, 'Pictures'),
  'd:\\Courses\\Web Development\\Software House'
];

let all = [];
for (const r of searchRoots) {
  all = all.concat(searchDir(r));
}

console.log(JSON.stringify(all, null, 2));
