#!/bin/bash
# Find files with potential orphaned blocks and manually fix them
find src -name "*.jsx" -type f | while read file; do
  # Use perl to remove orphaned object literals before });
  perl -i -0pe 's/\n\s+[a-zA-Z_][a-zA-Z0-9_]*:\s[^\n]+\n(\s+[a-zA-Z_][a-zA-Z0-9_]*:\s[^\n]+\n)*\s+\}\);/\n  });/g' "$file"
done
