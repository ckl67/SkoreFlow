# 🛠️ Git Survival Guide — Essential Commands

[← back](../doc.md)

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

## Quick summary

### Updates branches

From main to dev (locally)

After switch `dev`

- Override `dev` so that it is the same as `main`
  - `git switch dev`
  - `git reset --hard main`

- Update the `dev` branch whilst **keeping** the work on the dev branch
  - `dev` branch already contains work in progress or commits specific to `dev`:
  - We want to merge the new changes from `main` into `dev` without losing the progress in dev.
  - We have two main options:
    - 1:
      - `git switch dev`
      - `git merge main`
        - Combines the branch history into dev. If there are any differences, Git creates a merge commit.
    - 2:
      - `git switch dev`
      - `git rebase main`
      - In `dev`, replay the development commits on top of the current main branch.
      - This avoids unnecessary merge commits and keeps the history linear.

```text
          (B) --- (C)  <-- main
         /
--- (A)
         \
          (X) --- (Y)  <-- dev (the branch you’re on)

after rebase main dev will become

                            |
--- (A) --- (B) --- (C) ----+--- (X') --- (Y')  <-- dev (updated)

```

## git fetch vs Git pull

### fetch

git fetch retrieves all the latest changes from the remote server (GitHub) and saves them to your local remote branches

- Effect:
  - It never modifies your working directory or your actual local branches (main, dev).
- Usage: This is a 100% safe way to see what has changed on the server without risking immediate conflicts.

```bash
git fetch origin
git log HEAD..origin/main
# afterwards you can make
git merge origin/main
# or
git rebase origin/main
```

After checking the git log, the decision is made at a easy:

- `git rebase origin/main` --> If you have local commits that are out of sync and you want to keep a clean, linear history.
- `git merge origin/main` --> If you have no local commits ahead
  - **_Git will then perform a simple fast-forward, which is the same as a rebase_**

### pull

`git pull` performs two operations in a single command:

```bash
git fetch origin
git merge origin/main
```

### Best practice

You can configure `git pull` to perform a rebase rather than a merge using the command `git pull --rebase`,
which helps to avoid unnecessary merge commits when you’re pulling in your colleagues’ work.
