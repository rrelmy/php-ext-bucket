/**
 * This release script moves the prepared files from the nohash directory to the root
 * You have to sepcify the php version manually
 */
const fs = require('fs');

const phpVersion = Number(process.argv[2]);
if (!phpVersion || phpVersion < 10 || phpVersion > 100) {
  console.log('php version [1st argument] should be a number like 72 yours is', phpVersion || 'none');
  process.exit();
}

fs.readdir('./nohash', (err, list) => {
  list.forEach(releaseIt);
})

function releaseIt(file) {
  const name = file.match(/php-(.*).json$/)[1];
  const filePath = './nohash/' + file;
  
  fs.renameSync(filePath, `../php${phpVersion}-${name.toLowerCase()}.json`);
}
