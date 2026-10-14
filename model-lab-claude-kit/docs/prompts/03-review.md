# Prompt 3 – Scientific and code review (run after every phase)

---

Review the benches added in the last phase (see `git log` since the last tag, or the benches ticked most recently in `docs/ROADMAP.md`). Do not change anything yet; write findings first.

**Science.** For each bench:
- Check every equation, constant and unit against its cited source.
- Check that the "Derive it" steps are correct and in a logical order.
- Check that every paper in `research.papers` exists, with correct authors and year.
- Check that "Where it breaks" names the model's real limitations.
- Try extreme slider values and report anything unphysical: negative concentrations, NaN, runaway values.

**Code.** Check the `CLAUDE.md` rules: no DOM code in Models, one class per file, colours from tokens, comments present, tests meaningful rather than trivially passing.

**Experience.** Open every bench at 400 px and 1280 px, in light and dark mode. Report clipped labels, overlapping text, unreadable colours or console errors.

Write the findings to `docs/reviews/phase-N.md`, grouped by severity (wrong science, broken, rough edge). Then fix the wrong-science and broken items, one commit each, and tag the release `phase-N`.
