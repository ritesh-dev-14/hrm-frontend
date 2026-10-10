try {
  const acorn = require('acorn');
  const jsx = require('acorn-jsx');
  const fs = require('fs');
  const parser = acorn.Parser.extend(jsx());
  
  const code = fs.readFileSync('src/pages/Admin/AdminHomePage.jsx', 'utf8');
  parser.parse(code, { sourceType: 'module', ecmaVersion: 2020 });
  console.log('Parse success');
} catch (e) {
  console.log(e.message);
  console.log('Location:', e.loc);
}
