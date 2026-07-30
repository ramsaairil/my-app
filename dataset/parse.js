const fs = require('fs');
const path = require('path');

const inputDir = path.join(process.cwd(), 'dataset', 'Input');
const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.txt'));

const parsed = {};

files.forEach(file => {
  const content = fs.readFileSync(path.join(inputDir, file), 'utf8');
  const lines = content.split('\n').map(l => l.trim());

  let binDim = "1200x1200x1200";
  let maxWeight = "";
  let notes = "";
  const items = [];

  lines.forEach(line => {
    if (line.includes('Bin dimensions')) {
      const parts = line.split(':');
      if (parts[1]) {
        const match = parts[1].match(/\(([^)]+)\)/);
        if (match) binDim = match[1].replace(/,/g, 'x').replace(/\s+/g, '');
      }
    } else if (line.includes('Max weight:')) {
      maxWeight = line.split(':')[1]?.trim() || "";
    } else if (line.startsWith('#')) {
      // notes
    } else if (/^\d+/.test(line)) {
      const parts = line.split(/\s+/);
      if (parts.length >= 6) {
        items.push({
          id: parts[0],
          quantity: parseInt(parts[1], 10),
          length: parseInt(parts[2], 10),
          width: parseInt(parts[3], 10),
          height: parseInt(parts[4], 10),
          weight: parseInt(parts[5], 10)
        });
      }
    }
  });

  const key = file.replace('.txt', '');
  parsed[key] = {
    key,
    name: `3dBPP Benchmark ${key.replace('3dBPP_', 'Dataset ')}`,
    binDim,
    maxWeight,
    items
  };
});

const outputDir = path.join(process.cwd(), 'app', 'data');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}
fs.writeFileSync(path.join(outputDir, 'benchmarkDatasets.json'), JSON.stringify(parsed, null, 2));
console.log('Successfully generated benchmarkDatasets.json with keys:', Object.keys(parsed));
