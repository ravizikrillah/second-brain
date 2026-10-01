# Existing Code Snippets & Models

You have 3 ways to connect existing codebases to Second Brain:

1. **Config File (Recommended for external git repositories)**:
   Add external repo paths to `second-brain.json` without copying or committing large repos:
   ```json
   {
     "sources": {
       "code": ["../my-backend-repo", "../my-frontend-repo"],
       "ddl": ["../my-backend-repo/migrations"]
     }
   }
   ```

2. **Symlink (`ln -s`)**:
   Create symlinks inside this directory:
   ```bash
   ln -s /path/to/my-backend ./00-raw-inputs/existing-code/my-backend
   ```
   *(This directory is git-ignored so external repos are never committed to Second Brain git.)*

3. **Physical Copy / Drop**:
   Place backend microservice folders, Go routers, Python/TS DTOs, and YAML configs directly here.
