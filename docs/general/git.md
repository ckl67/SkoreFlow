# 🛠️ Git Survival Guide — Essential Commands

| Category                        | Action                                                             | Main command                                          |
| :------------------------------ | :----------------------------------------------------------------- | :---------------------------------------------------- |
| **Everyday basics**             | Check status                                                       | `git status`                                          |
|                                 | Add all modifications                                              | `git add .`                                           |
|                                 | Add specific file                                                  | `git add <file>`                                      |
|                                 | Commit locally                                                     | `git commit -m "message"`                             |
|                                 | Push to remote repository                                          | `git push origin <branch>`                            |
|                                 | Force push (use with caution)                                      | `git push origin <branch> --force`                    |
|                                 | Update from remote                                                 | `git pull origin <branch>`                            |
| **Pull Request Workflow**       | 1 Create a dedicated branch for the feature                        | `git switch -c feature/my-new-feature`                |
|                                 | 2. Push the branch and set up tracking (Upstream)                  | `git push -u origin feature/my-new-feature`           |
|                                 | 3. Fetch the latest PRs merged into `main`                         | `git switch main && git pull`                         |
|                                 | 4. Incorporate the latest changes from `main` into your current PR | `git switch feature/my-new-feature && git merge main` |
| **Branch management**           | Create a branch                                                    | `git checkout -b <branch>` `git switch -c <branch>`   |
|                                 | Switch branches                                                    | `git switch <branch>`                                 |
|                                 | List local branches                                                | `git branch`                                          |
|                                 | List remote branches                                               | `git branch -r`                                       |
|                                 | List all branches (local + remote)                                 | `git branch -a`                                       |
|                                 | Delete local branch (merged)                                       | `git branch -d <branch>`                              |
|                                 | Force delete local branch                                          | `git branch -D <branch>`                              |
|                                 | Delete remote branch                                               | `git push origin --delete <branch>`                   |
|                                 | Clean up deleted remote trackers                                   | `git fetch --prune`                                   |
| **Tags & Versions**             | Create an annotated tag                                            | `git tag -a vX.Y -m "description"`                    |
|                                 | View all tags                                                      | `git tag`                                             |
|                                 | Push tags to remote                                                | `git push origin --tags`                              |
| **History & Diff**              | View commit history (one-line)                                     | `git log --oneline --graph --all`                     |
|                                 | Compare workspace with a commit                                    | `git diff <commit> -- <file>`                         |
|                                 | Compare two commits/branches                                       | `git diff <commit1>..<commit2>`                       |
| **Cancellations & Corrections** | Restore a modified file                                            | `git restore <file>`                                  |
|                                 | Unstage a file (keep changes)                                      | `git restore --staged <file>`                         |
|                                 | Revert to a previous version (detached HEAD)                       | `git checkout <commit>`                               |
|                                 | Undo last commit (keep your code changes)                          | `git reset --soft HEAD~1`                             |
|                                 | Reset completely to a commit (destructive)                         | `git reset --hard <commit>`                           |
|                                 | Put changes aside temporarily                                      | `git stash`                                           |
|                                 | Bring back stashed changes                                         | `git stash pop`                                       |
