const fs = require('fs');
const code = fs.readFileSync('src/pages/Admin/AdminHomePage.jsx', 'utf8');

const stack = [];
for (let i = 0; i < code.length; i++) {
  if (code[i] === '{') {
    stack.push({ char: '{', index: i });
  } else if (code[i] === '}') {
    if (stack.length === 0 || stack[stack.length - 1].char !== '{') {
      console.log(`Unmatched '}' at index ${i}`);
      const line = code.substring(0, i).split('\n').length;
      console.log(`Line: ${line}`);
      break;
    }
    stack.pop();
  }
}
if (stack.length > 0) {
  console.log(`Unmatched '{' at index ${stack[0].index}`);
  const line = code.substring(0, stack[0].index).split('\n').length;
  console.log(`Line: ${line}`);
}
