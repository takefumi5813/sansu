> 前版の統合仕様記録です。2026-10-11の出題範囲・報酬・画面更新はREADME.md、reports/campaign-update.md、reports/core-report.mdの更新節を優先してください。

# Pilot integration contract
All content is UTF-8 JSON. Never modify sources/, Notion, existing Dropbox files, or remote GitHub.

Content files contain {"problems":[],"units":[],"links":[],"analysis":[]}.
Problem: id, unitId, category (calc/oneline/geometry), text (exact source), source {title,path,locator,url?,verification}, answer {n:string,d:string,unit:string,dimension:scalar|length|area|volume|time|speed|percent, acceptedUnits?:object}, difficulty:number, star?:1|2|3, score?:number, expression?:string, figure?:string (relative figs/ path), figureRequired:boolean, explanation:{steps:[{id,title,body,equation:string,visual?:{kind:string,...},checkpoint?:{prompt,answer:{n,d,unit,dimension}}}]}, variant?:{text,answer,explanation}, scopeUnits:string[], homeStudy:boolean, revision:1.
Answer formats (2026-10-12 追加): answer is one of
- single (unchanged): {n,d,unit,dimension,acceptedUnits?}
- ratio: {dimension:'ratio',terms:string[] (2項以上の正の整数、既約で記入),unit:''}. 入力 "3:2" "3：2" "3対2"（全角可、3項以上も同形式）。項数・正の整数が守られていれば valid。既約かつ terms と完全一致のみ correct。既約でない等価な比は correct:false で error/hint「最も簡単な整数の比で答えよう」。
- parts: {parts:[{label,...single|ratio},...]}（入れ子不可）。raw は欄数と同じ長さの文字列配列。全欄 correct のときだけ correct。無効な欄があれば valid:false, error「(label) …」, invalidPart。結果に parts:[{valid,correct,error?,hint?}]、normalized は各欄の配列。
SansuCore.formatAnswer(spec) は表示用文字列（例「(1) 22 cm　(2) 56 cm²」「3：2」）。checkpoint.answer は single のまま。
Unit: id,name,domain,definition,representativeId,decision,prerequisites:string[].
Link: from,to,relation:contrast|extension|transfer|prerequisite,difference:string.
Pilot examples should be 3 calc + 3 oneline + 3 geometry where source fidelity is actually verifiable; fewer is acceptable only with documented source limitation. No invented source text or reconstructed original figures. Original DB figures for geometry; educational SVG is allowed only in explanation.
Do not display unit names before independent answers (avoid revealing strategy). No API/AI calls in pilot runtime (Phase A).

Core browser global SansuCore (also module.exports for node tests):
- initialState(): {schemaVersion:1,xp:0,stars:0,units:{},attempts:[],rewards:{},daily:{},drafts:{},inventory:{heroes:[],equipment:[]}}
- dayKey(now?:Date): JST YYYY-MM-DD; addDays(day,n); level(xp)
- parseAnswer(raw,answerSpec): {valid:boolean,value?:{n:string,d:string},error?:string}; exact rational/unit comparison via grade(raw,spec): {valid,correct,error?,normalized?}
- selectProblem(problems,state,filters,day): problem|null; filters {category,mode:'all'|'gnorev',domains?:[],difficulty:6|8|9|10,star:1|2|3,grade:5|6,scopeUnits:string[]}; due repair then due review then new; no automatic early repeats.
- commitAttempt(state,problem,{id,day,raw,assisted?:boolean,purpose?:'normal'|'variant'|'practice',checkpointPassed?:boolean,chainIndex?:number}): {state,result:{valid,correct,error?,xp,stars,stage,due,graduated,needsGraduationCheck?,duplicate?}}; pure returned cloned state, invalid input no changes; stage3 correct requires checkpoint before committing. Noncalc stage first-ever reward only; wrong/assisted stage decrement and +3 days; pass stage1+14,stage2+60,stage3+180,stage4 null; early correct no progress/reward; variant never mastery or XP; calculation first 2 distinct expressions per JST day paid 3/5/7; chain bonus 1 then2 capped3/day and only on base rewarded pass. first successful answer or post-error numeric checkpoint increments daily 1/5 completion exactly once. Handle checkpoint completion with completeLearning(state,problem,{attemptId,day,checkpointId}) separate from submit.
- getRelated(problems,links,current,state,{direction:'same'|'up',filters,day}): problem|null
- calcScore(expression): {score,star,answer:{n,d},features}; scoring formula in approved design. Rational arithmetic AST, safe parser no eval. Unsupported explicit result, never silently star1.
- createStorage(dbName='sansu-pilot-v1'): async {load(),save(state),close()} using IndexedDB one state transaction, localStorage only preferences not durable fallback. UI must surface storage failures; serialize commits; never claim unsaved state persisted.

Root owns src/app.js, src/style.css, src/shell.html, build script, combined data, dist/index.html and browser tests.
Core agent owns src/core.js, tests/core.test.cjs, reports/core-report.md and references/legacy-* snapshots/catalog JSON.
Arithmetic content agent owns content/arithmetic.json and reports/arithmetic-analysis.md.
Geometry agent owns content/geometry.json, dist/figs/* and reports/geometry-analysis.md.
