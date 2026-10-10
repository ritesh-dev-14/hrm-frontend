const fs = require('fs'); 
const content = fs.readFileSync('src/pages/Admin/AdminHomePage.jsx', 'utf8'); 
let depth = 0; 
content.split('\n').forEach((line, i) => { 
  let stripped = line.replace(/<div[^>]*\/>/g, ''); 
  const opens = (stripped.match(/<div/g) || []).length; 
  const closes = (stripped.match(/<\/div/g) || []).length; 
  depth += opens - closes; 
  if (opens || closes) console.log(`${i+1}: depth ${depth} - ${line.trim()}`); 
})
