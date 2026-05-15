---
title: "LCCzero - Piano operativo post-audit"
date: 2026-05-15
revision: "1.1 Codex review"
inputs:
  - "docs/research/2026-05-14-lcc-methodology-and-visualization.md (roadmap metodologica)"
  - "docs/research/2026-05-15-independent-audit-lcc-methodology-codebase.md (audit indipendente)"
  - "codebase corrente su main; tag v1.2 presente"
status: "piano operativo rivisto, pronto per approvazione"
---

# LCCzero, piano operativo post-audit

Il problema dopo l'audit e chiaro: la roadmap metodologica del 14 maggio e valida come brief di modernizzazione, ma contiene errori regolamentari e bibliografici puntuali; il codice attuale implementa invece un motore LCC/WLC deterministico molto piu ristretto. Questo piano separa le correzioni documentali, le patch di igiene del prodotto corrente e la modernizzazione v2.x.

Rispetto alla prima bozza prodotta dall'altro LLM, questa revisione applica cinque correzioni:

- ripulisce il mojibake del markdown;
- corregge la formulazione su Pernetti et al. 2021: l'evidenza accessibile supporta DSA + Elementary Effects, non Sobol;
- rende la patch off-by-one eseguibile con helper condivisi e test Vitest, non con logica duplicata in quattro punti;
- de-rischia `methodProfile`: in v1.3 deve essere metadata-only, con migrazione Prisma opzionale; la logica EPBD reale resta v2.x;
- elimina l'affermazione non ancora verificata che 2025/2273 richieda esattamente "due tassi reali macro e due finanziari". Quella regola va estratta dall'annex legale prima di codificarla.

## Indice

- 1. Stream di lavoro
- 2. Stream A, correzioni alla roadmap metodologica
- 3. Stream B, patch v1.3 sul codice attuale
- 4. Stream C, milestone v2.x di modernizzazione
- 5. Sequenziamento e gate
- 6. Piano delle prime due settimane
- 7. Verifica
- 8. Decisioni da chiudere
- 9. Fonti primarie

## 1. Stream di lavoro

Le azioni hanno rischi diversi e non vanno fuse nello stesso milestone.

- **Stream A. Correzioni editoriali al documento metodologico.** Costo basso, rischio basso. Serve a non propagare errori in future specifiche.
- **Stream B. Patch v1.3 sul codice attuale.** Reporting hygiene: off-by-one anni, assumption text non veritiera, default dispersi, metadata di metodo. Deve restare piccolo e non cambiare i numeri del motore.
- **Stream C. Modernizzazione v2.x.** Cash-flow ledger, profili EPBD/Level(s), scenari energia/carbonio, uncertainty layer, carbon overlay, export certification. Richiede milestone dedicati.

A e B possono partire subito. C deve aspettare almeno la chiusura delle correzioni B.1 e B.3, per evitare di costruire nuove viste sopra metadati e reporting ancora ambigui.

Nota sul processo: i tag git `v1.0`, `v1.1`, `v1.2` esistono; non risultano file GSD tracciati nel repository corrente. I riferimenti a GSD in questo piano sono quindi processuali, non contratti tecnici presenti nel repo.

## 2. Stream A, correzioni alla roadmap metodologica

File da editare: `docs/research/2026-05-14-lcc-methodology-and-visualization.md`.  
Effort: S.

### A.1 Baseline regolamentare: 244/2012 -> 2025/2273

- Frontmatter: sostituire `Reg_244_2012: "vigente, integrato..."` con una formulazione storica: `Reg_244_2012: "baseline storico, abrogato dal 1 gennaio 2026"`.
- Aggiungere `Reg_2025_2273: "framework cost-optimal attivo dal 1 gennaio 2026; reporting alla Commissione entro 30 giugno 2028"`.
- Tabella A.1: aggiungere riga autonoma per Delegated Regulation (EU) 2025/2273.
- Dove il testo usa 244/2012 come norma attiva, riformulare su 2025/2273 solo dopo avere estratto i requisiti specifici dal testo legale e dagli annex. Non portare automaticamente ogni dettaglio di 244/2012 nel nuovo framework.
- Bibliografia: mantenere 244/2012 come fonte storica e aggiungere 2025/2273 con URL EUR-Lex.

### A.2 Pernetti et al. 2021

Sostituire la riga che oggi attribuisce a Pernetti 2021 un "Sobol su LCC di 11 nZEB" con:

> DSA + Elementary Effects su LCC di 11 nZEB europei; parametri ad alto impatto: interest rate, construction and equipment maintenance costs, structural element costs, electricity prices; variazioni LCC fino al 37%, media 26% attorno alla mediana.

Azioni:

- rimuovere o qualificare ogni occorrenza di "Pernetti + Sobol";
- rimuovere l'affermazione "energia circa 12% della LCC" finche non viene indicata una tabella/pagina full-text che la supporti;
- usare Saltelli et al. 2010 per giustificare Sobol come estensione futura;
- usare Pernetti et al. 2021 per giustificare screening pratico e riduzione dei parametri rilevanti.

### A.3 NIST/FEMP

Sostituire `NIST Handbook 135 revisione 2025` con:

> NIST/FEMP Handbook 135 current material, Annual Supplement corrente e BLCC web tool; verificare edizione/DOI citata, perche il PDF pubblico spesso risolve a Handbook 135-2020.

Usare NIST come comparatore, non come fonte normativa UE.

### A.4 EN 15978

Sostituire status rigidi del tipo `2011 corrente, in revisione come BS EN 15978-1` con:

> usare EN 15978:2011 e/o adozione nazionale applicabile; monitorare revisione e adozione per giurisdizione; versionare il modulo LCA per method profile.

### A.5 IEA WEO ed ETS come scenario inputs

Numeri come gas UE CPS/STEPS, ETS 80-147/149 EUR/t e mediana 126 EUR/t non devono diventare default globali senza metadati.

Per ogni scenario servono:

- source URL;
- table ID/versione;
- carrier;
- geografia;
- settore;
- anno base e valuta;
- tax treatment;
- metodo di conversione in curva annua.

### A.6 Distribuzioni statistiche

In A.3.F e A.5, marcare lognormal, Weibull e triangular come:

> default editoriali fino a calibrazione su fonte empirica versionata; override utente richiesto con audit trail.

Output Stream A: documento metodologico con `revision: 1.1 post-audit` e changelog breve.

## 3. Stream B, patch v1.3 sul codice attuale

Obiettivo: migliorare reporting e tracciabilita senza cambiare il risultato numerico del motore.

### B.1 Fix off-by-one anni

Bug confermato: il motore produce array indicizzati 0..N, quindi `length = referencePeriod + 1`. Alcune viste leggono `cumulated.length` o mappano `year: i + 1`, mostrando 41 anni quando il reference period e 40.

File coinvolti:

- `src/components/results/charts/cost-evolution-line.tsx`
- `src/server/export/chart-renderer.tsx`
- `src/server/export/excel-workbook.ts`
- `src/server/export/pdf-document.tsx`

Implementazione raccomandata:

1. Estrarre helper puro, ad esempio `src/lib/results/time-series.ts`.
2. Implementare `getAnalysisYears(result): number = result.heatingCosts.cumulated.length - 1`.
3. Implementare `buildCostEvolutionRows(result)` che usa gli indici `1..N` e label `year = i`.
4. Usare lo stesso helper in chart client e chart server.
5. In Excel, iterare `for (let year = 1; year <= analysisYears; year++)` su energia e manutenzione.
6. In PDF, stampare `analysisYears`, non `cumulated.length`.

Test:

- Vitest unitario su `buildCostEvolutionRows`: per N=40 produce 40 righe, prima riga `year=1`, ultima `year=40`.
- Test Excel con workbook generato: fogli Energy e Maintenance hanno 40 righe dati per N=40, non 41.
- Test helper per N=50.

Effort: S.

### B.2 Dashboard assumption text dinamica

Problemi attuali in `src/components/results/results-dashboard.tsx`:

- "NPV computed over a 40-year analysis period" e hard-coded, ma il periodo e configurabile;
- Pernetti 2021 e usato come motivazione del periodo, cosa non supportata dall'evidenza;
- "End-of-life costs excluded by default" e fuorviante, perche il motore calcola residual value e `lccNetResidual`;
- "Real discount rate = 1.51% baseline" e hard-coded, mentre il result contiene `realInterestRate`.

Modifiche:

- trasformare `LCC_BREAKDOWN_ASSUMPTIONS` e `COST_EVOLUTION_ASSUMPTIONS` da costanti a funzioni, ad esempio `buildLccBreakdownAssumptions(result, formulaMode)` e `buildCostEvolutionAssumptions(result, formulaMode)`;
- mostrare `getAnalysisYears(result)` e `result.realInterestRate`;
- descrivere il residual value con precisione: "Residual value is calculated and shown separately as LCC net residual; headline LCC/WLC are gross of residual unless explicitly labelled";
- mantenere la nota tecnica: maintenance usa nominal rate e energy usa real-rate machinery piu escalation per carrier nel motore CRAVEzero corrente;
- rimuovere Pernetti come giustificazione del periodo.

Effort: S.

### B.3 Method profile metadata e default

La prima bozza proponeva subito un campo Prisma `methodProfile`. Per v1.3 e piu prudente introdurre il concetto come metadata di calcolo e lasciare la migrazione DB opzionale.

Implementazione v1.3 raccomandata:

1. Creare un modulo puro `src/engine/method-profiles.ts`.
2. Definire `MethodProfileId = "CRAVEZERO_LEGACY" | "EPBD_2025_DRAFT" | "LEVELS_50Y_DRAFT" | "CUSTOM"`.
3. Definire `getMethodDefaults(profile)` per reference period, interest rate, inflation rate e note metodologiche.
4. Estendere `EngineConfig` e `LCCResult` con `methodProfile`, default `CRAVEZERO_LEGACY`.
5. Includere `methodProfile` nello snapshot hash insieme a `formulaMode`.
6. Mostrare `methodProfile` in PDF, Excel e JSON client export.
7. Allineare i fallback della WLC form ai defaults di profilo. Lo schema Prisma puo mantenere default DB come fallback tecnico.

Migrazione Prisma:

- opzionale in v1.3;
- obbligatoria in v2.0 se i profili diventano selezionabili/persistenti per progetto;
- da evitare se il solo obiettivo v1.3 e correggere reporting e default.

Effort: M.

### B.4 Citations e text hygiene

`src/lib/citations.ts` e gia piu corretto del documento metodologico su Pernetti/Morris. Le azioni v1.3 devono essere conservative:

- verificare che nessuna dashboard assumption attribuisca Sobol a Pernetti 2021;
- correggere eventuale mojibake visibile nei testi dashboard;
- correggere le landing-page claim che oggi suggeriscono SA gia implementata, in particolare `src/components/landing/value-cards.tsx`, `src/components/landing/domain-tiles.tsx`, `src/components/landing/methodology-card.tsx`, `src/components/landing/what-it-does.tsx` e `src/components/landing/author-card.tsx`;
- sostituire formule tipo "sensitivity baked into the workflow" con wording onesto: "methodological precedent" o "planned sensitivity workflow";
- mantenere Berggren/co-benefits solo se il prodotto continua a mostrare un income/NPV extension layer; se i co-benefits restano fuori scope, riformulare la descrizione senza presentarli come requisito metodologico.

Effort: S.

Output Stream B: v1.3 "Reporting Hygiene", con numeri motore invariati e reporting corretto.

## 4. Stream C, milestone v2.x di modernizzazione

### v2.0 - Cash-flow ledger additivo

Obiettivo: introdurre un ledger `CostStream` senza rompere gli output esistenti.

Principio: prima additivo, poi sostitutivo. Non convertire subito l'intero engine "a stream only".

Phasing:

1. Definire `CostStream` in `src/engine/types.ts` con campi minimi: category, subcategory, year, amount, currency, discountBasis, source, profile.
2. Far emettere stream a construction, energy, maintenance, residual e income in parallelo agli array esistenti.
3. Aggiungere `LCCResult.streams?` dietro flag/config.
4. Scrivere test di parita: aggregati derivati dal ledger uguali agli aggregati v1.3 entro tolleranza.
5. Solo dopo la parita, valutare se spostare `aggregate.ts` a derivazione primaria dal ledger.

Effort: L.

### v2.1 - EPBD/Level(s) profile e cost-optimal scatter

Obiettivo: introdurre profili metodologici reali e la vista cost-optimal.

Gate prima di codare:

- redigere un annex interno "EPBD_2025_DRAFT calculation note" basato su 2025/2273 e relativi annex;
- separare cosa e richiesto da norma, cosa e default di prodotto, cosa e scenario.

Phasing:

1. Aggiungere input/output per primary energy demand o total primary energy use per variante. Non inferirlo dai costi.
2. Definire Global Cost per profilo EPBD, incluso perimetro costi, residual/final value, energia, emissioni e prospettiva.
3. Implementare scatter `PED/TPE vs Global Cost per m2`.
4. Implementare `LEVELS_50Y` come profilo reale: periodo 50 anni, real-cost basis, net present cost per usable floor area.
5. Aggiungere sensitivity/reporting secondo i requisiti effettivi del profilo, non per memoria di 244/2012.

Effort: L.

### v2.2 - Scenario catalog per energia e carbonio

Obiettivo: sostituire o affiancare gli scalari `annualIncrease` con curve versionate.

Non assumere che IEA WEO o GMK siano direttamente importabili come dataset machine-readable/licenziato. Trattarli inizialmente come fonti per fixture versionate e documentate.

Phasing:

1. Modellare `ScenarioRate(country, carrier, sector, source, scenario, year, price, carbonPrice, currency, baseYear, publicationDate, sourceUrl, tableId)`.
2. Ingestione iniziale da CSV/JSON controllato nel repo, non scraper web.
3. UI per selezionare scenario o mantenere custom scalar.
4. `energy.ts` supporta curve annue con fallback allo scalar attuale.
5. Carbon shadow price come curva separata, non mescolata al prezzo energia.

Effort: L.

### v2.3 - Uncertainty layer: Morris, LHS/MC, Sobol

Obiettivo: generare P10/P50/P90 e ranking dei driver senza bloccare il prodotto su runtime non verificati.

Sequenza:

1. Definire schema distribuzioni e audit trail.
2. Implementare LHS/Monte Carlo sui KPI principali.
3. Implementare Morris/Elementary Effects come screening economico.
4. Profilare su casi grandi.
5. Implementare Sobol Si/STi solo dopo profiling e riduzione dei parametri.
6. UI: fan band, tornado/ranking, CDF o distribuzione KPI.

Dipendenze: v2.0 necessario; v2.2 utile ma non strettamente bloccante se le distribuzioni includono ancora scalar inputs.

Effort: L+, probabilmente da spezzare in v2.3a e v2.3b.

### v2.4 - Carbon overlay EN 15978/EN 16627

Obiettivo: collegare costi e carbonio senza fingere precisione EPD dove non esiste.

Phasing:

1. Definire `CarbonStream` o campi carbon nei ledger items, con module tag A1-A5, B1-B7, C1-C4, D.
2. Iniziare con piccolo set di fattori medi documentati e source metadata.
3. Aggiungere adapter astratto per EPD database come follow-up, non come prerequisito.
4. Operational carbon da carrier/scenario emission factors.
5. Output: footprint totale, breakdown moduli, carbon shadow overlay, MAC curve solo quando esistono baseline/delta affidabili.

Effort: L.

### v2.5 - Export certification

Obiettivo: output citabile e riproducibile.

Phasing:

1. JSON Schema 2020-12 per input/output.
2. OpenAPI 3.1 solo quando il REST endpoint esiste.
3. Report manifest: engineVersion, methodProfile, methodVersion, formulaMode, source versions, snapshot hash.
4. PDF/A solo con validazione esplicita tramite tool dedicato; `react-pdf` da solo non deve essere dichiarato PDF/A.
5. CSV per ogni time series e ledger.
6. Validation cases: prima analitici e workbook-backed, poi BLCC/Level(s)/CRAVEzero pubblici dove i dati sono replicabili.

Effort: M+.

## 5. Sequenziamento e gate

```text
A doc fix
   \
    +-- B v1.3 reporting hygiene -- v2.0 ledger -- v2.1 profiles -- v2.2 scenarios
                                                  \-- v2.3 uncertainty
                                                   \-- v2.4 carbon -- v2.5 exports
```

Gate:

- v2.0: B.1 e B.3 completati.
- v2.1: annex EPBD_2025_DRAFT scritto e approvato.
- v2.2: almeno un dataset fixture versionato disponibile.
- v2.3: profiling baseline del motore e decisione worker/client/server.
- v2.4: scope carbon e fonti GWP approvati.
- v2.5: modello output v2.0-v2.4 stabile.

## 6. Piano delle prime due settimane

| Giorno | Stream | Azione | Output verificabile |
| --- | --- | --- | --- |
| 1 | A | Applicare A.1-A.6 al documento metodologico | Diff con revision 1.1 post-audit |
| 2 | B.1 | Estrarre helper time-series e correggere chart client/server | Vitest helper N=40/N=50 |
| 3 | B.1 | Correggere Excel/PDF year reporting | Test workbook rows, PDF text non 41 |
| 4 | B.2 | Assumption text dinamica | Dashboard mostra anni e real rate reali |
| 5-7 | B.3 | MethodProfile metadata e defaults | Result/export includono `CRAVEZERO_LEGACY`; numeri invariati |
| 8 | B.4 | Citations/text hygiene | Nessun Pernetti+Sobol in UI/docs corretti |
| 9 | B | `npm run test:run` e `npm run build` | Test/build verdi |
| 10 | B | Tag/release v1.3 se richiesto | Changelog reporting hygiene |
| 11-14 | C | Research/plan v2.0 | Type sketch `CostStream` + migration plan additivo |

## 7. Verifica

### Stream A

- `rg "Pernetti.*Sobol" docs/research/2026-05-14-lcc-methodology-and-visualization.md` non restituisce affermazioni positive.
- Nessuna occorrenza non qualificata di "energia circa 12%".
- 2025/2273 e citato come framework attivo; 244/2012 come storico.
- NIST/FEMP e EN 15978 hanno wording versionato.

### Stream B

- `npm run test:run`.
- `npm run build`.
- Cost-evolution chart mostra anni 1..N.
- Export chart server usa gli stessi rows del client.
- Excel Energy/Maintenance hanno N righe dati.
- PDF stampa N anni, non N+1.
- Dashboard assumptions non contengono hard-coded 40 anni, 1.51% o Pernetti come giustificazione del periodo.
- Landing-page copy non afferma che DSA/EE, Morris, Sobol, Monte Carlo o uncertainty siano gia funzionalita implementate.
- Se `methodProfile` entra in `LCCResult`, snapshot hash cambia in modo intenzionale e documentato.

### Stream C

Ogni milestone v2.x deve avere:

- calculation note;
- schema/type diff;
- fixture di input;
- test di parita o expected output;
- source-version manifest;
- rollback path.

## 8. Decisioni da chiudere

1. **Default prodotto per nuovi progetti.** Tenere 40 anni per `CRAVEZERO_LEGACY`; introdurre 50 anni solo in `LEVELS_50Y`. Decidere cosa vede un nuovo utente.
2. **Method profile persistence.** Metadata-only in v1.3 o campo Prisma subito? Raccomandazione: metadata-only in v1.3, Prisma in v2.0.
3. **EPBD profile.** Prima dell'implementazione serve annex tecnico su 2025/2273. Non codare requisiti da memoria di 244/2012.
4. **Scenario data licensing.** WEO/GMK come fonti manuali versionate o ingestion automatica solo se licenza e formato lo consentono.
5. **Carbon scope.** Piccolo set GWP documentato prima; EPD adapter dopo.
6. **Worker architecture uncertainty.** Start con batch deterministico profilabile; worker pool solo dopo misure.
7. **Validation cases.** Usare solo casi con dati pubblici sufficienti a replicare input e expected output.
8. **PDF/A.** Richiede validatore dedicato; non dichiarare compliance senza controllo.

## 9. Fonti primarie

- Delegated Regulation (EU) 2025/2273: https://eur-lex.europa.eu/eli/reg_del/2025/2273/oj/eng
- EPBD recast page, European Commission: https://energy.ec.europa.eu/topics/energy-efficiency/energy-efficient-buildings/energy-performance-buildings-directive_en
- ISO 15686-5:2017 public record: https://www.iso.org/standard/61148.html
- JRC Level(s) indicator 6.1: https://susproc.jrc.ec.europa.eu/product-bureau/sites/default/files/2021-01/UM3_Indicator_6.1_v1.1_21pp.pdf
- FEMP/NIST BLCC programs: https://www.energy.gov/femp/building-life-cycle-cost-programs
- Pernetti, Garzia, Filippi Oberegger 2021: https://bia.unibz.it/esploro/outputs/journalArticle/Sensitivity-analysis-as-support-for-reliable/991006255498101241
- IEA WEO 2025 overview: https://www.iea.org/reports/world-energy-outlook-2025/overview-and-key-findings
- GMK EU ETS consensus forecast: https://gmk.center/en/infographic/carbon-price-in-the-eu-ets-to-hit-e126-t-by-2030/

## Bottom line

Il piano e approvabile se resta disciplinato: v1.3 corregge reporting e metadata senza cambiare i numeri; v2.x inizia solo dopo una nota tecnica per ogni profilo metodologico. La tentazione da evitare e trasformare una patch di igiene in una riscrittura regolamentare non ancora specificata.
