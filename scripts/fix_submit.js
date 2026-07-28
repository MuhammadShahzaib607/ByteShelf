const fs = require('fs');

const filepath = 'client/app/(pages)/warehouses/[warehouseId]/page.tsx';
let content = fs.readFileSync(filepath, 'utf8');

// Find and replace the floating bar button onClick
const oldCode = `onClick={() => document.getElementById("booking-summary")?.scrollIntoView({ behavior: "smooth", block: "start" })}`;
const newCode = `onClick={handleBooking}`;

if (content.includes(oldCode)) {
  content = content.replace(oldCode, newCode);
  console.log('✓ Changed floating bar button to call handleBooking');
} else {
  console.log('✗ Could not find the scroll onClick');
  process.exit(1);
}

// Also update the floating bar button text to indicate it submits
const oldText = `Book Selected Shelves`;
const newText = `Confirm Booking`;

if (content.includes(oldText)) {
  content = content.replace(oldText, newText);
  console.log('✓ Updated button text to "Confirm Booking"');
}

// Update the floating bar's disabled and loading states
// Add disabled and loading states to the floating bar button
const oldBtn = `className="inline-flex items-center gap-2 px-6 py-3 bg-[#0284C7] text-white rounded-full font-body text-sm font-medium hover:bg-[#0284C7]/90 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-[#0284C7]/25 shrink-0"\n                >\n                  <ArrowRight size={16} />\n                  Confirm Booking`;
const newBtn = `disabled={isBooking}\n                className="inline-flex items-center gap-2 px-6 py-3 bg-[#0284C7] text-white rounded-full font-body text-sm font-medium hover:bg-[#0284C7]/90 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-[#0284C7]/25 shrink-0 disabled:opacity-50"\n                >\n                {isBooking ? (\n                  <><Loader2 size={16} className="animate-spin" />Booking...</>\n                ) : (\n                  <><ArrowRight size={16} />Confirm Booking</>`;

if (content.includes(oldBtn)) {
  content = content.replace(oldBtn, newBtn);
  console.log('✓ Added loading state to floating bar button');
}

fs.writeFileSync(filepath, content, 'utf8');
console.log('Done!');
