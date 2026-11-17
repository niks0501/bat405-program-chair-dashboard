# CI/CD: GitHub Actions + Vercel

This repository is a static React/Vite site. GitHub Actions validates pull requests
and deploys the `main` branch to Vercel **only after the checks pass**.

## Behavior

| Event | GitHub Actions | Vercel |
| --- | --- | --- |
| Pull request into `main` | Install, unit tests, production build, output checks | Native Git integration can create a preview |
| Push/merge into `main` | Run checks again, then deploy | Production deployment from GitHub Actions |
| Failed CI on `main` | Deployment job skipped | Current production deployment remains in place |

`vercel.json` disables **native Git deployments for `main` only**. This prevents
a second production deployment from bypassing CI. Vercel's Git integration
can still create preview deployments from pull-request branches. On Vercel
Hobby, preview deployments triggered by teammates' commits may be
restricted by project-owner requirements.

## One-time Vercel setup

1. Create/import a Vercel project from `niks0501/bat405-program-chair-dashboard`.
2. Use framework **Vite**, build command `npm run build`, output directory
   `dist`, root `./`, and Node.js **22.x**.
3. In Vercel **Account Settings > Tokens**, create a token scoped to the account
   or team that owns the project. Copy it securely; never commit it.
4. In a local shell from the cloned repository, run:

   ```bash
   npm install --global vercel@latest
   vercel login
   vercel link
   cat .vercel/project.json
   ```

   Choose the existing Vercel project when prompted. Copy `orgId` and
   `projectId` from the JSON. The `.vercel/` directory is already ignored
   by Git.

5. Open the GitHub repository **Settings > Secrets and variables > Actions**.
   Add these three **repository secrets**:

   | Secret | Value |
   | --- | --- |
   | `VERCEL_TOKEN` | Token created in Vercel |
   | `VERCEL_ORG_ID` | `orgId` from `.vercel/project.json` |
   | `VERCEL_PROJECT_ID` | `projectId` from `.vercel/project.json` |

Do not add token values to the repository, workflow YAML, screenshots, or PRs.

## Protect the production branch

After the first pull-request CI run has published its check:

1. Open GitHub **Settings > Branches**.
2. Add a branch protection rule for `main`.
3. Enable **Require a pull request before merging**.
4. Enable **Require status checks to pass before merging**.
5. Select the exact check **Quality checks**.
6. Enable **Require branches to be up to date before merging**.
7. Disable force pushes and deletions. Keep administrator bypass disabled
   if the team wants enforcement for maintainers too.
8. Save the rule.

On a public GitHub repository, branch protection is supported by GitHub Free.
The required check becomes selectable after GitHub first receives a run.

## Local verification

```bash
npm ci
npm test
npm run build
```

The unit tests cover the five KPI contract, calculations, the supported
academic terms, filtering, and status thresholds. The build verifies that
React/Vite can compile production assets.

## Deployment workflow

The single workflow is `.github/workflows/ci-cd.yml`:

- `ci` runs without secrets and has read-only repository access. It is
  safe to run for pull requests.
- `deploy` runs only on a `push` to `main` after `ci` passes.
- The deployment uses `vercel pull`, `vercel build --prod`, and
  `vercel deploy --prebuilt --prod`.
- A final HTTP smoke test checks that the published site returns the
  expected root HTML.
- PR runs cancel superseded checks; ongoing production deployments are
  not interrupted by newer pushes.

If the Vercel secrets have not been configured, PR CI can still pass, but the
production deployment fails with a missing-secret message.

## Common failures

- **Missing secret**: Add all three repository secrets under GitHub Actions.
- **Project not found**: Verify `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`
  refer to the same Vercel project as `VERCEL_TOKEN`.
- **Build failure**: Run `npm ci && npm test && npm run build` locally.
- **Preview blocked on Hobby**: Check the commit author's ownership of
  the Vercel Hobby project. Production is deployed by the Actions token.
- **Duplicate production deployments**: Ensure `vercel.json` keeps
  `git.deploymentEnabled.main` set to `false`.

Official reference: https://vercel.com/kb/guide/how-can-i-use-github-actions-with-vercel
