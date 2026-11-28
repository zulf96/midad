# REA findings — ترقيم السؤال/الجواب

- Target: `midad-app.html` → extracted `midad-app.js` (SHA-256 `8ad658eaf69890196223e53734200c21af3929a916dd0f2f575dae06daa73838`).
- Tool: `analyze_javascript_application` + `trace_application_feature` (seed `renumberQuestions`, direction `outgoing`).
- Evidence: `ev_67ca467b39b89b9dc5ebc0340789882e1c2608e60eebcbc7ffd4d1fbcf54b9eb` (parent), `ev_a37f9840d4a728d28fde437a264da6583c0a2947095574d2601291ee4a2cd922` (trace).
- Observation (static, inferred; not runtime proof): inside `docCanvas` `input` listener, original calls `renumberQuestions()` **before** `syncBodyFromDom(el)` whenever the edited element has `data-sec` and field `body`.
- Root fix applied: `on_edit` in `app.rs` now renumbers QA badges on every body input and updates the DOM when changed.
- Limitations: REA parsed JavaScript as inert text; static relationships do not prove runtime reachability. Coverage partial (alias-selection budget 512).
