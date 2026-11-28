# Graph Report - midad-graph  (2026-11-28)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 470 nodes · 1435 edges · 21 communities
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
- backCoverHtml
- liveWatermark
- insertHtml
- qaExec
- exportHtml
- renderReview
- createZip

## God Nodes (most connected - your core abstractions)
1. `toast()` - 96 edges
2. `activeDoc()` - 61 edges
3. `syncBodyFromDom()` - 43 edges
4. `renderEditor()` - 32 edges
5. `currentTableCtx()` - 23 edges
6. `commitUndo()` - 22 edges
7. `updateToolbarState()` - 21 edges
8. `afterTableChange()` - 21 edges
9. `markUndoState()` - 20 edges
10. `ensureBodySelection()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `hydrateFromDesktop()` --indirect_call--> `normalizeCustomCover()`  [INFERRED]
  midad-app.js → midad-app.js  _Bridges community 0 → community 2_
- `replaceAllMatches()` --indirect_call--> `syncBodyFromDom()`  [INFERRED]
  midad-app.js → midad-app.js  _Bridges community 0 → community 1_
- `normalizeDict()` --indirect_call--> `normAr()`  [INFERRED]
  midad-app.js → midad-app.js  _Bridges community 12 → community 2_
- `textSelectionToTable()` --indirect_call--> `updateTableBar()`  [INFERRED]
  midad-app.js → midad-app.js  _Bridges community 16 → community 4_
- `addComment()` --calls--> `activeDoc()`  [EXTRACTED]
  midad-app.js → midad-app.js  _Bridges community 0 → community 16_

## Import Cycles
- None detected.

## Communities (21 total, 0 thin omitted)

### Community 0 - "activeDoc"
Cohesion: 0.08
Nodes (58): activeDoc(), addBlankPage(), addSection(), applyCustomMargins(), applyMargins(), applySplitChunks(), applyUndoSnapshot(), askConfirm() (+50 more)

### Community 1 - "toast"
Cohesion: 0.14
Nodes (43): applyAutoCorrect(), applyBlockClass(), applyBorderClass(), applyFontSizeToSelection(), applyInlineClass(), applyInlineStyle(), applyPainterFormat(), applyStyle() (+35 more)

### Community 2 - "normalizeDoc"
Cohesion: 0.14
Nodes (20): coverClassOk(), handleImport(), loadState(), normalizeBackContent(), normalizeComments(), normalizeCustomCover(), normalizeDict(), normalizeDoc() (+12 more)

### Community 3 - "main.js"
Cohesion: 0.10
Nodes (29): { app, BrowserWindow, Menu, dialog, session, shell, ipcMain }, appIconPath(), autoUpdateSupported(), backupsDir(), beginDownload(), buildMenu(), checkForUpdatesManually(), createWindow() (+21 more)

### Community 4 - "currentTableCtx"
Cohesion: 0.13
Nodes (41): afterTableChange(), cellAtPosition(), closeTableMore(), currentTableCtx(), evaluateTableFormula(), focusCellStart(), formulaValues(), getTableGrid() (+33 more)

### Community 5 - "midad-app.js"
Cohesion: 0.06
Nodes (21): caretBlockList(), closeArabicMore(), disarmPainter(), getTableContext(), inflateRawBytes(), isEmptyParagraph(), openArabicMore(), openCharSpacingDialog() (+13 more)

### Community 6 - "updRender"
Cohesion: 0.15
Nodes (26): handleUpdateCancelled(), handleUpdateError(), handleUpdateFound(), handleUpdateReady(), handleUpdateResult(), hideUpdateBanner(), openUpdateCenter(), setUpdState() (+18 more)

### Community 7 - "onCanvasPointerDown"
Cohesion: 0.10
Nodes (32): applyHeight(), applySize(), applyWidth(), barButtonsHtml(), bodyWidth(), cloneMovableHtml(), commitSize(), copyMovable() (+24 more)

### Community 8 - "handleInsert"
Cohesion: 0.12
Nodes (17): fillRefTargets(), handleInsert(), openEquationDialog(), openImageDialog(), openNoteDialog(), openProblemDialog(), openQaDialog(), openQaEditor() (+9 more)

### Community 9 - "exportDocx"
Cohesion: 0.21
Nodes (13): bodyToWml(), collectImages(), docxContentTypes(), docxCoreProps(), docxDocument(), docxDocumentRels(), docxRels(), docxStyles() (+5 more)

### Community 10 - "runFind"
Cohesion: 0.13
Nodes (21): blockFromNode(), blockTextMap(), buildFindRegExp(), captureSelectionFormat(), clearFind(), closeFind(), collectFindRanges(), escapeRegExp() (+13 more)

### Community 11 - "docxToSections"
Cohesion: 0.21
Nodes (17): bytesToDataUrl(), docxFlag(), docxImage(), docxInline(), docxKid(), docxKids(), docxParagraph(), docxPlain() (+9 more)

### Community 12 - "spellIssues"
Cohesion: 0.20
Nodes (12): editDistance(), handleProof(), htmlToWords(), collect(), isKnownArabic(), normAr(), runGrammarCheck(), runSpellCheck() (+4 more)

### Community 13 - "syncEditorChrome"
Cohesion: 0.15
Nodes (16): applyAdvancedPage(), applyPageSize(), applyZoom(), brandVisible(), isValidFontValue(), loadSystemFonts(), marginsMmOf(), pageDims() (+8 more)

### Community 14 - "backCoverHtml"
Cohesion: 0.19
Nodes (20): backCoverHtml(), backFeaturesHtml(), backFootMeta(), blankSectionHtml(), coverElTools(), coverHtml(), footAuthorHtml(), frameHtml() (+12 more)

### Community 15 - "liveWatermark"
Cohesion: 0.38
Nodes (7): applyWatermarks(), liveWatermark(), normalizeWatermark(), syncWatermarkUi(), toggleWmGroups(), updateWmLabels(), wmActivePosition()

### Community 16 - "insertHtml"
Cohesion: 0.12
Nodes (21): addComment(), appendNoteItem(), bodyFromNode(), currentBody(), gridToTableHtml(), hidePasteChip(), hideQuickBar(), insertEquation() (+13 more)

### Community 17 - "qaExec"
Cohesion: 0.60
Nodes (5): qaApplyListStyle(), qaCurrentList(), qaExec(), qaSyncToolbar(), qaTargetField()

### Community 18 - "exportHtml"
Cohesion: 0.33
Nodes (7): downloadBlob(), exportFullBackup(), exportHtml(), exportJson(), openPreview(), prepareClone(), safeFileName()

### Community 19 - "renderReview"
Cohesion: 0.29
Nodes (7): fmtTime(), handleReview(), openCommentDialog(), openReviewDialog(), renderReview(), reviewCard(), toggleTracking()

### Community 20 - "createZip"
Cohesion: 0.50
Nodes (4): createZip(), zipCentralHeader(), zipEndCentralDirectory(), zipLocalHeader()

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `toast()` connect `toast` to `activeDoc`, `normalizeDoc`, `currentTableCtx`, `midad-app.js`, `updRender`, `onCanvasPointerDown`, `exportDocx`, `runFind`, `docxToSections`, `spellIssues`, `insertHtml`, `qaExec`, `exportHtml`, `renderReview`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `syncBodyFromDom()` (e.g. with `applyBorderClass()` and `replaceAllMatches()`) actually correct?**
  _`syncBodyFromDom()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `activeDoc` be split into smaller, more focused modules?**
  _Cohesion score 0.07622504537205081 - nodes in this community are weakly interconnected._
- **Why does `scopeCoverCss()` connect `normalizeDoc` to `midad-app.js`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Should `toast` be split into smaller, more focused modules?**
  _Cohesion score 0.14174972314507198 - nodes in this community are weakly interconnected._
- **Why does `activeDoc()` connect `activeDoc` to `toast`, `currentTableCtx`, `midad-app.js`, `onCanvasPointerDown`, `exportDocx`, `spellIssues`, `syncEditorChrome`, `backCoverHtml`, `liveWatermark`, `insertHtml`, `exportHtml`, `renderReview`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **Should `normalizeDoc` be split into smaller, more focused modules?**
  _Cohesion score 0.1368421052631579 - nodes in this community are weakly interconnected._