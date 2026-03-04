#!/bin/bash

MODULES=("defects" "photos" "plant-booking" "material-reconciliation" "weather-logging" "quality-inspections" "permits-to-work" "toolbox-talks")

for module in "${MODULES[@]}"; do
  FILE="/Users/mick/Desktop/kbm-construct/src/app/(app)/$module/page.tsx"
  
  if [ ! -f "$FILE" ]; then
    echo "❌ $module: File not found"
    continue
  fi
  
  # Find the line number of "Cancel" button before "Save" button in form
  CANCEL_LINE=$(grep -n "onClick={() => {" "$FILE" | grep -A 2 "setShowForm(false)" | head -1 | cut -d: -f1)
  
  if [ -z "$CANCEL_LINE" ]; then
    echo "❌ $module: Could not find Cancel button pattern"
    continue
  fi
  
  # Create temp file with modifications
  awk -v module="$module" 'BEGIN {in_form = 0} 
  /if \(showForm && current\)/ {in_form = 1}
  in_form && /flex gap-3 justify-end pt-4/ {
    print $0
    getline
    if ($0 ~ /^[[:space:]]*{/) {
      print "						{current.id && ("
      print "							<button"
      print "								onClick={() => setShowDeleteConfirm(true)}"
      print "								className=\"rounded-xl border border-red-200 px-6 py-2 text-sm font-semibold text-red-600 hover:bg-red-50\""
      print "							>"
      print "								Delete"
      print "							</button>"
      print "						)}"
      print "						<div className=\"flex gap-3 ml-auto\">"
    } else {
      print
    }
    next
  }
  {print}' "$FILE" > "${FILE}.tmp"
  
  if diff -q "$FILE" "${FILE}.tmp" > /dev/null 2>&1; then
    rm "${FILE}.tmp"
    echo "✓ $module: No changes needed"
  else
    mv "${FILE}.tmp" "$FILE"
    echo "✓ $module: Added delete button wrapper"
  fi
done
