---
name: brain-init
description: Initialize or scaffold the Second Brain 6-zone directory hierarchy, configuration rules, and baseline templates in the current workspace.
---

# /brain-init

Execute the Second Brain initialization workflow in the current repository:

1. Run `node ./bin/init.js` or automatically create the 6-zone directory hierarchy:
   - `00-raw-inputs/` (`brd/`, `figma/`, `db/`, `existing-code/`, `mom/`) with `.gitkeep` files in each subdirectory
   - `01-ground-truth/`
   - `02-provenance/`
   - `03-constraint-branches/`
   - `04-deliverables/` (`sequence-diagrams/`, `api-contracts/`, `lld/`)
   - `05-adrs/`
2. Configure `.gitignore` with `00-raw-inputs/` protection rules to prevent repo bloat while preserving directory structure:
   ```gitignore
   # Keep 00-raw-inputs and 1-level subdirectories, ignore everything else inside
   00-raw-inputs/*/*
   !00-raw-inputs/*/.gitkeep
   !00-raw-inputs/*/README.md
   ```
3. Ensure `CONTEXT.md`, `AGENTS.md`, `CLAUDE.md`, and `.cursorrules` are present in the workspace root.
4. Populate baseline templates and `.gitkeep` files if missing.
5. Report initialization status to the user.
