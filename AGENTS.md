# Repository guidance

- UI v2.6 lives in `ontologics-prototype/`. Run installation, build and tests there; read the root README first.
- Preserve the existing UI, business semantics, lockfile and original delivery records. Separate browser Mock behavior from implemented server capabilities.
- The v1.7 package was supplied for BOM/source alignment. Use its preserved source provenance and reviewed adapter; this change does not implement the whole v1.7 ERP/backend plan. Do not infer engineering approval from structural parsing.
- Keep changes on a separate branch and use a PR. Do not merge or deploy unless requested.
- Record important decisions in `docs/adr/` with alternatives, evidence, tradeoffs, verification and recovery steps.
- Never commit generated output, dependencies, secrets, local evaluation data or the four ignored manufacturer photos. `npm run assets:fetch` verifies/restores those photos for local use only.
- Report actual commands and results, including failures or environment limitations. Historical delivery test counts are not new verification results.
