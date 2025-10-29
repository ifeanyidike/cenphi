#!/bin/bash

files=$(grep -l "workspaceHub" src/**/*.tsx 2>/dev/null | sort)

echo "Analyzing components that use workspaceHub..."
echo ""

for file in $files; do
  # Check for observer import
  has_observer_import=$(grep -c "import.*observer.*from.*mobx-react-lite" "$file" || echo "0")
  
  # Check for observer wrapping in component declaration
  has_default_observer=$(grep -c "export default observer(" "$file" || echo "0")
  has_const_observer=$(grep -c "const.*=.*observer(" "$file" || echo "0")
  has_arrow_observer=$(grep -c "React.FC.*=.*observer" "$file" || echo "0")
  
  total_observer=$(( has_default_observer + has_const_observer + has_arrow_observer ))
  
  if [ "$total_observer" -eq 0 ]; then
    # Component uses workspaceHub but is NOT wrapped with observer
    echo "NOT WRAPPED: $file"
    grep -n "workspaceHub" "$file" | head -2 | sed 's/^/  [Line ] /'
    echo ""
  fi
done
