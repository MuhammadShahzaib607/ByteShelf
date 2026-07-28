const fs = require('fs');
const path = require('path');

const filepath = 'client/app/(pages)/warehouses/[warehouseId]/page.tsx';
let content = fs.readFileSync(filepath, 'utf8');

// 1. Add pb-24 to shelf section
const oldClass = 'className="bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 rounded-3xl p-6 sm:p-8"';
const newClass = 'className="bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 rounded-3xl p-6 sm:p-8 pb-24"';

if (content.includes(oldClass)) {
  content = content.replace(oldClass, newClass);
  console.log('✓ Added pb-24 to shelf section');
} else {
  console.log('✗ Could not find shelf section class');
}

// 2. Remove duplicate button - find by line-based approach with CRLF
const lines = content.split(/\r?\n/);

// Find line with "Proceed to Book Shelves"
let buttonLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Proceed to Book Shelves')) {
    buttonLine = i;
    break;
  }
}

if (buttonLine === -1) {
  console.log('✗ Could not find button text');
  process.exit(1);
}

// Find the '<button' that starts this button block (go backwards)
let startLine = buttonLine;
for (let i = buttonLine; i >= 0; i--) {
  if (lines[i].includes('<button')) {
    startLine = i;
    break;
  }
}

// Find the </motion.div> that closes the booking summary (go forward from button end)
let endLine = buttonLine;
for (let i = buttonLine; i < lines.length; i++) {
  if (lines[i].includes('</motion.div>')) {
    endLine = i;
    break;
  }
}

console.log(`Removing lines ${startLine + 1} to ${endLine + 1} (inclusive)`);

// Remove lines from startLine to endLine
const newLines = [...lines.slice(0, startLine), ...lines.slice(endLine + 1)];
content = newLines.join('\r\n');

// Verify
if (content.includes('Proceed to Book Shelves')) {
  console.log('✗ Button text still found after removal');
  process.exit(1);
}

fs.writeFileSync(filepath, content, 'utf8');
console.log('✓ Successfully removed duplicate button from booking summary');
console.log('Done!');
