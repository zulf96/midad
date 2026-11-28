# Graph Report - midad  (2026-11-28)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 467 nodes · 1418 edges · 29 communities (22 shown, 7 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 45 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- activeDoc
- toast
- normalizeDoc
- main.js
- currentTableCtx
- midad-app.js
- updRender
- onCanvasPointerDown
- handleInsert
- exportDocx
- runFind
- docxToSections
- spellIssues
- syncEditorChrome
- blockFromNode
- renderReview
- hideQuickBar
- qaExec
- placeCaretInBody
- copyMovable
- createZip
- readDocxZip
- closeArabicMore
- closeTableMore
- disarmPainter
- replaceRangeContent
- getTableContext
- openTashkeelDialog
- qaCaretTo

## God Nodes (most connected - your core abstractions)
1. `toast()` - 93 edges
2. `activeDoc()` - 61 edges
3. `syncBodyFromDom()` - 43 edges
4. `renderEditor()` - 32 edges
5. `currentTableCtx()` - 23 edges
6. `commitUndo()` - 22 edges
7. `updateToolbarState()` - 21 edges
8. `afterTableChange()` - 21 edges
9. `ensureBodySelection()` - 20 edges
10. `markUndoState()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `hydrateFromDesktop()` --indirect_call--> `normalizeCustomCover()`  [INFERRED]
  midad-app.js → midad-app.js  _Bridges community 0 → community 2_
- `normalizeDict()` --indirect_call--> `normAr()`  [INFERRED]
  midad-app.js → midad-app.js  _Bridges community 12 → community 2_
- `textSelectionToTable()` --indirect_call--> `updateTableBar()`  [INFERRED]
  midad-app.js → midad-app.js  _Bridges community 4 → community 8_
- `addComment()` --calls--> `activeDoc()`  [EXTRACTED]
  midad-app.js → midad-app.js  _Bridges community 0 → community 1_
- `afterTableChange()` --calls--> `activeDoc()`  [EXTRACTED]
  midad-app.js → midad-app.js  _Bridges community 0 → community 4_

## Import Cycles
- None detected.

## Communities (29 total, 7 thin omitted)

### Community 0 - "activeDoc"
Cohesion: 0.06
Nodes (65): activeDoc(), addBlankPage(), addSection(), applyCustomMargins(), applyMargins(), applyPageSize(), applySplitChunks(), applyUndoSnapshot() (+57 more)

### Community 1 - "toast"
Cohesion: 0.10
Nodes (65): addComment(), appendNoteItem(), applyAutoCorrect(), applyBlockClass(), applyBorderClass(), applyFontSizeToSelection(), applyInlineClass(), applyInlineStyle() (+57 more)

### Community 2 - "normalizeDoc"
Cohesion: 0.08
Nodes (40): backCoverHtml(), backFeaturesHtml(), backFootMeta(), blankSectionHtml(), coverClassOk(), coverElTools(), coverHtml(), footAuthorHtml() (+32 more)

### Community 3 - "main.js"
Cohesion: 0.10
Nodes (29): { app, BrowserWindow, Menu, dialog, session, shell, ipcMain }, appIconPath(), autoUpdateSupported(), backupsDir(), beginDownload(), buildMenu(), checkForUpdatesManually(), createWindow() (+21 more)

### Community 4 - "currentTableCtx"
Cohesion: 0.15
Nodes (36): afterTableChange(), cellAtPosition(), currentTableCtx(), evaluateTableFormula(), focusCellStart(), formulaValues(), getTableGrid(), markTableEdit() (+28 more)

### Community 5 - "midad-app.js"
Cohesion: 0.07
Nodes (5): borderHost(), classSuffix(), hideUpdatePrompt(), isArabicLetter(), selectedTextChunks()

### Community 6 - "updRender"
Cohesion: 0.15
Nodes (26): handleUpdateCancelled(), handleUpdateError(), handleUpdateFound(), handleUpdateReady(), handleUpdateResult(), hideUpdateBanner(), openUpdateCenter(), setUpdState() (+18 more)

### Community 7 - "onCanvasPointerDown"
Cohesion: 0.16
Nodes (21): applyHeight(), applySize(), applyWidth(), bodyWidth(), cycleLayer(), deselectAll(), elementOf(), heightOf() (+13 more)

### Community 8 - "handleInsert"
Cohesion: 0.10
Nodes (21): fillRefTargets(), gridToTableHtml(), handleInsert(), openEquationDialog(), openImageDialog(), openNoteDialog(), openProblemDialog(), openQaDialog() (+13 more)

### Community 9 - "exportDocx"
Cohesion: 0.13
Nodes (20): bodyToWml(), collectImages(), docxContentTypes(), docxCoreProps(), docxDocument(), docxDocumentRels(), docxRels(), docxStyles() (+12 more)

### Community 10 - "runFind"
Cohesion: 0.18
Nodes (16): buildFindRegExp(), clearFind(), closeFind(), collectFindRanges(), escapeRegExp(), findOptions(), gotoFind(), openFind() (+8 more)

### Community 11 - "docxToSections"
Cohesion: 0.26
Nodes (14): bytesToDataUrl(), docxFlag(), docxImage(), docxInline(), docxKid(), docxKids(), docxParagraph(), docxPlain() (+6 more)

### Community 12 - "spellIssues"
Cohesion: 0.20
Nodes (12): editDistance(), handleProof(), htmlToWords(), collect(), isKnownArabic(), normAr(), runGrammarCheck(), runSpellCheck() (+4 more)

### Community 13 - "syncEditorChrome"
Cohesion: 0.28
Nodes (9): applyAdvancedPage(), brandVisible(), isValidFontValue(), loadSystemFonts(), populateFontOptions(), renderCoverElementsToggles(), renderCustomColorsList(), renderCustomFontsList() (+1 more)

### Community 14 - "blockFromNode"
Cohesion: 0.25
Nodes (8): blockFromNode(), blockTextMap(), captureSelectionFormat(), findTextBlocks(), openCharSpacingDialog(), openParaSpacingDialog(), rememberSpacingRange(), selectionBlockInfo()

### Community 15 - "renderReview"
Cohesion: 0.29
Nodes (7): fmtTime(), handleReview(), openCommentDialog(), openReviewDialog(), renderReview(), reviewCard(), toggleTracking()

### Community 16 - "hideQuickBar"
Cohesion: 0.40
Nodes (5): hideQuickBar(), positionFormatPopover(), renderFormatPopover(), toggleFormatPopover(), updateQuickBar()

### Community 17 - "qaExec"
Cohesion: 0.60
Nodes (5): qaApplyListStyle(), qaCurrentList(), qaExec(), qaSyncToolbar(), qaTargetField()

### Community 18 - "placeCaretInBody"
Cohesion: 0.50
Nodes (4): caretBlockList(), isEmptyParagraph(), placeCaretInBody(), setCaret()

### Community 19 - "copyMovable"
Cohesion: 0.50
Nodes (4): cloneMovableHtml(), copyMovable(), movableKindLabel(), showPasteChip()

### Community 20 - "createZip"
Cohesion: 0.50
Nodes (4): createZip(), zipCentralHeader(), zipEndCentralDirectory(), zipLocalHeader()

### Community 21 - "readDocxZip"
Cohesion: 0.50
Nodes (4): inflateRawBytes(), readDocxZip(), zipU16(), zipU32()

## Knowledge Gaps
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `toast()` connect `toast` to `activeDoc`, `normalizeDoc`, `currentTableCtx`, `midad-app.js`, `updRender`, `handleInsert`, `exportDocx`, `runFind`, `spellIssues`, `blockFromNode`, `renderReview`, `qaExec`, `copyMovable`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `syncBodyFromDom()` (e.g. with `applyBorderClass()` and `replaceAllMatches()`) actually correct?**
  _`syncBodyFromDom()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `activeDoc` be split into smaller, more focused modules?**
  _Cohesion score 0.06057692307692308 - nodes in this community are weakly interconnected._
- **Why does `scopeCoverCss()` connect `normalizeDoc` to `midad-app.js`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Should `toast` be split into smaller, more focused modules?**
  _Cohesion score 0.09903846153846153 - nodes in this community are weakly interconnected._
- **Why does `activeDoc()` connect `activeDoc` to `toast`, `normalizeDoc`, `currentTableCtx`, `midad-app.js`, `exportDocx`, `spellIssues`, `syncEditorChrome`, `renderReview`, `hideQuickBar`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **Should `normalizeDoc` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._