# tools/

Scripts that regenerate data files in `js/data/` from authoritative external sources.

Run these whenever the upstream data changes, or to verify the stored values.
The scripts write to stdout; redirect to the data file or diff manually.

## Pattern

Each script:
1. Fetches data from the cited source URL.
2. Outputs a JavaScript ES module with a frozen export and a `SOURCE` object.
3. Prints a note about what changed (if anything).

Example (hypothetical):

```
node tools/fetch-elements.js > js/data/elements.js
```

Then commit the updated data file with the retrieval date in the `SOURCE` object.

## Why keep the raw data in the repo?

The lab runs entirely in the browser with no server, so data files must be
static assets.  Regeneration scripts let any contributor re-derive and verify
the values rather than trusting hand-typed numbers.
