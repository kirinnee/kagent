---
id: deadcode
title: Deadcode Detection and Cleanup
---

# Deadcode Detection and Cleanup

This document describes the workflow for detecting and removing unused code.

## Workflow

1. **Run deadcode detection**

   ```bash
   pls deadcode
   ```

2. **Verify each result with LSP**
   - Use "Find References" or "Go to References" in your editor
   - Check "Call Hierarchy" to see all callers
   - Confirm the code has no production usage

3. **Document false positives**
   - For items that appear unused but are actually used (e.g., reflection, dynamic calls)
   - Document the call chain as evidence
   - Include the reference path that proves it's used

4. **Remove confirmed deadcode**
   - Delete the unused functions/types/variables
   - **Important:** Functions only used by tests = deadcode

5. **Remove tests and verify**
   - Remove tests for deleted deadcode
   - Run `pls test` to ensure everything still works

## Important: Test-Only Usage

**Functions only used by tests are considered deadcode.**

If a function is only called by tests and not by production code, both the function and its tests should be removed.

## Summary

| Step | Action                                    |
| ---- | ----------------------------------------- |
| 1    | Run `pls deadcode`                        |
| 2    | Verify with LSP (Find References)         |
| 3    | Document false positives with call chains |
| 4    | Remove confirmed deadcode                 |
| 5    | Remove tests, run `pls test`              |
