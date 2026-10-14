# Prompt 2 – Build the next phase from the roadmap (reusable)

Use this for every later phase. Change the phase number, or name fields instead.

---

Read `CLAUDE.md` and `docs/ROADMAP.md`. Build **Phase N** from the roadmap (or: the unticked benches in *<field>* and *<field>*).

Start in plan mode. For each bench, the plan must state:
- the model: which equations or algorithm, with units and the source for each constant;
- what the user can change and what the readouts show;
- which known results the tests will check (analytic solutions, textbook examples or published data);
- which existing benches it relates to.

Wait for my approval of the plan. Then build the benches one at a time: Model and tests first, then View and Bench, then register it. One commit per bench, run `npm test` before each commit, and check every bench in the browser at desktop and phone width in both themes.

If a bench needs shared maths or data that does not exist yet, add it to `js/core/` or `js/data/` in its own commit, with tests.

When done, tick the benches in the roadmap, update the README table, and give me a summary that lists any scientific point you were unsure about.
