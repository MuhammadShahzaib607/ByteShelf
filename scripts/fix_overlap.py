import os, re

filepath = 'client/app/(pages)/warehouses/[warehouseId]/page.tsx'
with open(filepath, 'r', encoding='utf-8', newline='') as f:
    content = f.read()

# 1. Add pb-24 to the shelf section container class
old_class = 'className="bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 rounded-3xl p-6 sm:p-8"'
new_class = 'className="bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 rounded-3xl p-6 sm:p-8 pb-24"'

if old_class in content:
    content = content.replace(old_class, new_class)
    print("✓ Added pb-24 to shelf section")
else:
    print("✗ Could not find the shelf section class string")

# 2. Remove the duplicate "Proceed to Book Shelves" button
# Find the button block
button_start = '              <button\n                onClick={handleBooking}\n                disabled={isBooking}'
button_end = 'Proceed to Book Shelves'

idx_start = content.find(button_start)
if idx_start == -1:
    print("✗ Could not find the button start")
else:
    # Find the end of the button block (the </motion.div> that closes the booking summary)
    # We need to find the </motion.div> that comes right after the button
    end_marker = '            </motion.div>\n          )\n\n          {/* Floating booking bar'
    idx_end_marker = content.find(end_marker, idx_start)
    
    if idx_end_marker == -1:
        print("✗ Could not find the end marker")
    else:
        # Find the button's </button> before the end marker
        btn_close = content.rfind('</button>', idx_start, idx_end_marker)
        if btn_close == -1:
            print("✗ Could not find </button>")
        else:
            # From btn_close, find the next </motion.div>
            motion_close = content.find('            </motion.div>', btn_close)
            if motion_close == -1:
                print("✗ Could not find </motion.div> after button")
            else:
                # Remove from button start to the line before the end marker
                # Keep the </motion.div> and following content
                before = content[:idx_start]
                after = content[motion_close:]
                content = before + after
                print("✓ Removed duplicate button from booking summary")
                
                # Verify
                if 'Proceed to Book Shelves' in content:
                    print("✗ Button text still found!")
                else:
                    print("✓ Button successfully removed")

# Write the result
with open(filepath, 'w', encoding='utf-8', newline='') as f:
    f.write(content)

print(f"\nDone! File updated.")
