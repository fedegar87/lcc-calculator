---
title: "LCCzero — Modernizzazione metodologica e visuale del tool LCC per edifici nZEB"
date: 2026-05-14
author: "Report tecnico generato per F. Garzia (EURAC), su richiesta esplicita"
revision: "1.1 post-audit corrections, 2026-05-15"
versione_fonti:
  ISO_15686-5: "2017 (corrente)"
  EN_15459-1: "2017 (corrente, modulo M1-14)"
  EN_16627: "2015 (corrente)"
  EN_15978: "2011/adoption status jurisdiction-dependent; revision to be method-profiled"
  EN_15643: "2021 (versione unificata)"
  EPBD_recast: "Direttiva (UE) 2024/1275 (in vigore 28 mag 2024, recepimento 29 mag 2026)"
  Reg_244_2012: "historical baseline; repealed from 2026-01-01"
  Reg_2025_2273: "active EPBD cost-optimal framework from 2026-01-01; first reporting by 2028-06-30"
  Level_s: "v1.1 (gen 2021)"
  IEA_WEO: "World Energy Outlook 2025"
  EU_ETS_forecast: "consensus GMK 2025 (€126/t 2030)"
  FEMP_NIST: "Handbook 135 current FEMP material + Annual Supplement + BLCC web tool"
---

# LCCzero, modernizzazione metodologica e visuale del tool LCC per edifici nZEB

Questo documento risponde al brief di committenza per la riscrittura del tool LCC originato in CRAVEzero. La Parte A definisce l'architettura di calcolo, la Parte B definisce l'output. Le raccomandazioni sono ancorate alla letteratura citata e si compongono in una proposta internamente coerente: i metodi che producono distribuzioni di output (Sobol, Monte Carlo) determinano le scelte di visualizzazione (fan chart, violin, P10/P50/P90), e l'aggancio EPBD detta la forma canonica della curva cost-optimal.

## Indice

- Parte A. Calcoli e metodologia
  - A.1 Sintesi della ricerca bibliografica
  - A.2 Architettura metodologica raccomandata
  - A.3 Aree A-J di miglioramento
  - A.4 Schema di test e validazione
  - A.5 Schema di parametrizzazione
  - A.6 Aree dove la letteratura è insufficiente
- Parte B. Visualizzazione e reporting
  - B.1 Sintesi della ricerca bibliografica
  - B.2 Audience analysis
  - B.3 Catalogo dei grafici raccomandati
  - B.4 Layout di dashboard
  - B.5 Schema del PDF report
  - B.6 Schema di export
  - B.7 Sistema di temi e palette
- Open issues
- Bibliografia
- Appendice. Snippet di pattern di calcolo
- Stima oraria di implementazione

---

# Parte A. Calcoli e metodologia

## A.1 Sintesi della ricerca bibliografica

| Fonte | Tipo | Anno / Edizione | Rilevanza per LCCzero | Uso nel report |
|---|---|---|---|---|
| ISO 15686-5 | Norma ISO | 2017 (corrente) | Definizione e perimetro LCC, struttura cost categories, real vs nominal, residual value | Architettura A.3 A, A.3 B, A.4 |
| EN 15459-1 | Norma EN | 2017 (modulo M1-14) | Procedura economica per sistemi energetici, formula global cost, payback scontato, residual value formula | A.3 A, A.3 B, A.3 D |
| EN 15459-2 (CEN/TR) | Technical Report | 2017 | Spiegazioni e giustificazioni di EN 15459-1 | A.3 A note |
| EN 16627 | Norma EN | 2015 | LCC dei moduli A1-A5, B1-B7, C1-C4, D coerenti con LCA | A.3 A, A.3 B, B.5 |
| EN 15978 | Norma EN | 2011 / adoption status jurisdiction-dependent | LCA building modules, gancio LCC-LCA, EPD link; versionare lo status per method profile | A.3 G |
| EN 15643 | Framework | 2021 | Cornice unificata sostenibilità (env+eco+social) | A.2 |
| ISO 14040 / 14044 | Norma ISO | 2006 con corrigenda | Principi LCA | A.3 G |
| EPBD recast Dir. (UE) 2024/1275 | Direttiva | 2024 | Obbligo cost-optimal, definizione ZEB, framework Art. 6(1), recepimento 29/05/2026 | A.2, A.3 H |
| Reg. Delegato (UE) 244/2012 | Regolamento | 2012, storico | Baseline storica per report cost-optimal precedenti; abrogato dal 1 gennaio 2026 | A.3 C, A.3 D, A.3 G |
| Reg. Delegato (UE) 2025/2273 | Regolamento | 2025, attivo dal 2026-01-01 | Framework comparativo EPBD attivo per calcolare livelli cost-optimal; reporting alla Commissione entro 2028-06-30 | A.3 C, A.3 D, A.3 H |
| JRC Level(s) ind. 6.1 | Framework | v1.1 (2021) | Periodo 50 anni, costi reali (no inflazione), €/m² | A.3 A, B.5 |
| NIST/FEMP Handbook 135 + BLCC | Manuale/tool | current FEMP material + Annual Supplement | Riferimento federale USA e comparatore BLCC; verificare edizione/DOI citata, PDF pubblico spesso HB 135-2020 | A.3 A, A.3 C |
| Pernetti, Garzia, Filippi Oberegger 2021 | Articolo | SCS 74, 103139 | DSA + Elementary Effects su LCC di 11 nZEB europei; parametri ad alto impatto: interest rate, structural-element cost, construction maintenance cost, HVAC maintenance cost, electricity prices | A.3 F, screening SA |
| Becchio, Corgnati et al. 2015 e seguenti | Articoli | 2014-2020 | Cost-optimal italiano, gap 212-313 €/m² rispetto al cost-optimal | A.3 H |
| Hamdy, Hasan, Sirén 2013 | Articolo | Energy and Buildings 56 | Multi-stage simulation-based optimization cost-optimal Finlandia | A.3 H |
| D'Agostino, Parker, Bertoldi (JRC) | Report e articoli | 2018-2023 | Stato di implementazione cost-optimal negli SM | A.3 H |
| Almeida, Ferreira (Annex 56) | Articoli e deliverable | 2014-2018 | Renovation cost-effective IEA EBC Annex 56 | A.3 A, A.3 H |
| Saltelli et al. 2010 | Articolo | Computer Physics Communications 181 | Estimatori variance-based per Sobol Si e STi, design e costo computazionale | A.3 F |
| Tian 2013 | Articolo | Renewable and Sustainable Energy Reviews 20 | Review sensitivity analysis methods in building energy | A.3 F |
| Hopfe, Hensen 2011 | Articolo | Building and Environment 46 | Uncertainty in building performance simulation | A.3 F |
| Schwartz, Raslan, Mumovic | Articoli | 2018-2022 | LCC probabilistico di refurbishment, comunicazione incertezza | A.3 F, B.3 |
| Weitzman 2001 | Articolo | American Economic Review 91(1) | Gamma discounting, declining DR per orizzonti lunghi | A.3 C |
| Arrow et al. 2014 | Articolo | Review of Environmental Economics and Policy 8(2) | Conferma operatività declining DR | A.3 C |
| EU DG REGIO Guide CBA 2014-2020 | Linea guida | 2014 | Social Discount Rate 3% (UE-15) e 5% (UE-13/Coesione), prospettiva macroeconomica | A.3 C |
| IEA World Energy Outlook 2025 | Report | 2025 | Fonte per famiglie di scenario; ogni numero operativo richiede table ID/versione, geografia, carrier, settore, valuta e metodo di conversione | A.3 D |
| Enerdata, BNEF, consensus GMK 2025 | Report | 2025 | Scenario input per ETS/carbon price; non default normativo senza metadati e distinzione ETS scope | A.3 D, A.3 G |
| ASHRAE Service Life Database (TRP-1237) | Database | 2005, aggiornato | 38.000 record service life e maintenance cost equipment HVAC | A.3 E, A.5 |
| One Click LCA documentazione | Tecnica | 2024-2025 | Pattern di interfaccia LCC commerciale, allineamento EN 16627 + ISO 15686-5 + PD 156865 | A.3 J, B.3 |
| NIST BLCC manuale | Manuale | 2025 | Pattern di reporting federale USA | B.3, B.5 |

Questa lista è il fondamento citazionale. Le voci entrano nel testo per nome (Autore, Anno), con riferimenti URL completi in Bibliografia a fine documento.

## A.2 Architettura metodologica raccomandata

La logica di calcolo si organizza in sei strati, dal più stabile al più volatile, in modo che le parti soggette a evoluzione normativa restino isolabili.

```
Layer 1. Time skeleton
   periodo di analisi, convenzione cash-flow, base year, calendario sostituzioni

Layer 2. Money frame
   real vs nominal, single discount rate vs scenario set, currency

Layer 3. Cost engine
   WBS hierarchical (A construction, B systems, C RES, D other, E external)
   per ogni voce: investment + replacement(t) + maintenance(t) + residual value
   formulazione discreta a fine anno, espandibile a mid-year per terms calibration

Layer 4. Energy and revenue engine
   carriers (heating, cooling, DHW, electric domestic+auxiliary, exported PV)
   prezzi base + escalation scenario set
   feed-in rules per Paese, self-consumption split

Layer 5. Uncertainty layer (opzionale, attivato dall'utente)
   distribuzioni associate alle voci sensibili, Monte Carlo + LHS, Sobol Si/STi
   output stocastici aggregati ai KPI dei layer 3-4

Layer 6. Carbon overlay (opzionale, off di default)
   embodied carbon (EPD), operational carbon, shadow price ETS
   coerente con EN 15978 + EN 16627 modular system
```

L'aggregazione tra layer avviene per cash-flow time-series. Ogni voce di costo entra come oggetto `CostStream(category, year_t, amount_t, currency, real_or_nominal, source)` e si aggrega per somma su categoria, su anno, e su gerarchia WBS. Questo dissolve il problema dei VLOOKUP hardcoded del tool Excel, perché la gerarchia è dato, non codice.

L'interfaccia di calcolo è una pipeline funzionale: input validato (JSON Schema) -> time skeleton -> cost engine -> energy engine -> uncertainty layer -> carbon overlay -> aggregator -> KPIs. Ogni stadio è puro: a parità di input, identico output. Questa proprietà permette caching aggressivo per Monte Carlo (più di 100.000 valutazioni se necessario, scope A.3 F).

## A.3 Aree A-J di miglioramento

### A.3.A Schema temporale e flussi di cassa

**Problema nel tool originale.** Tre orizzonti incongruenti coesistono: 100 anni di iterazione di formula, 40 anni di taglio per manutenzione e per grafici, esclusione hard-coded dell'anno 50. La parte 41-100 della LCC è inerte, e l'esclusione del solo anno 50 non ha giustificazione metodologica. L'inflazione applicata alle sostituzioni dei componenti edili usa il tasso di escalation dell'energia, errore concettuale rilevato anche in (Pernetti et al., 2021).

**Cosa dice la letteratura.** I tre regimi normativi principali divergono e devono essere riconciliati.

- ISO 15686-5:2017 lascia il periodo di analisi al committente, ma raccomanda esplicitazione di "period of analysis", "service life" e "study period" come variabili indipendenti, e calcolo in real terms quando si confrontano alternative.
- EN 15459-1:2017 prescrive il global cost al present value, con riferimento al base year e residual value computato pro-rata sulla service life se l'ultima sostituzione supera il calculation period.
- Il Regolamento Delegato (UE) 2025/2273 è il framework EPBD cost-optimal attivo dal 2026-01-01; i dettagli operativi devono essere estratti dal testo legale e dagli annex. Il Reg. 244/2012 resta baseline storica per confronti con report precedenti.
- Level(s) indicator 6.1 prescrive 50 anni come "reference study period" con costi reali (no inflazione), in €/m² di superficie utile.
- NIST/FEMP BLCC e Handbook 135 sono comparatori federali USA; usare il limite temporale e il discount-rate FEMP solo nel profilo NIST, non come vincolo generale UE.

Pernetti et al. (2021) hanno applicato DSA + Elementary Effects a 11 nZEB europei; la fonte supporta l'uso di screening SA e l'attenzione a interest rate, costi strutturali, costi di manutenzione e prezzi elettrici. Non va citata come evidenza di un'analisi Sobol già applicata.

**Soluzioni candidate.**

1. Orizzonte fisso 30 anni, allineato con la prassi EPBD storica e da riverificare nel profilo 2025/2273. Pro: compatibilità diretta con il reporting cost-optimal quando il method profile lo richiede. Contro: ignora componenti strutturali con vita >50 anni, sottopesa effetti long-tail.
2. Orizzonte fisso 50 anni, allineato con Level(s). Pro: coerente con il framework volontario UE attualmente più strutturato per uso integrato LCA+LCC. Contro: extrapola scenari energetici e tassi su periodi molto incerti.
3. Orizzonte parametrico (30, 40, 50, 60), default 50, con sensitività automatica sui valori non scelti. Pro: rispetta i casi d'uso multipli (cost-optimal vs LCSA vs sustainability assessment). Contro: maggiore complessità di interfaccia, output multi-scenario di default.

**Raccomandazione.** Adottare la soluzione 3 con default 50 anni e sensitività automatica almeno su 30 e 60 anni. Marcare il regime in uso nel report. Questa scelta permette al tool di servire contemporaneamente reporting EPBD (estrarre la vista a 30) e analisi Level(s) (default 50). Cash-flow convention: end-of-year, allineata con (EN 15459-1, 2017) e (NIST Handbook 135). Real terms come modalità di default, nominal terms come modalità opzionale per casi con vincoli contrattuali specifici.

**Cicli di sostituzione.** Sostituire la regola `MOD(anno, vita_tecnica)=0` con un calendario esplicito generato per categoria di componente. Per ogni elemento WBS, due regimi:

- Deterministico: ciclo regolare, identica formula di Excel ma senza esclusioni arbitrarie di anno specifico.
- Probabilistico opzionale: distribuzione Weibull a due parametri (η scala, β forma), con η pari alla vita tecnica nominale e β scelto per categoria (β=2.5-3.5 per HVAC ordinario, β=4-6 per envelope strutturale, β=1.5-2 per finiture); inizializzazione da ASHRAE Service Life Database per HVAC (TRP-1237, Abramson et al., 2005) e da BCIS Building Maintenance Information per envelope. La Weibull permette di catturare sia early-failure che wear-out, ed è la convenzione consolidata nella reliability engineering applicata all'edilizia (cfr. ASCE proceedings su Condition and Reliability Prediction Models).

### A.3.B Trattamento del valore residuo

**Problema nel tool originale.** Spalmato implicitamente, non documentato. EN 15459-1 prescrive un trattamento esplicito.

**Cosa dice la letteratura.** EN 15459-1:2017 e ISO 15686-5:2017 convergono su una formulazione pro-rata: se l'ultima sostituzione di un componente di vita V genera valore acquisito a t1 e l'orizzonte di analisi termina a t2 < t1+V, il valore residuo è (V-(t2-t1))/V * costo_sostituzione, attualizzato a t2. Tre varianti compatibili con questa logica:

- Lineare puro (la più comune, prescritta in 15459-1).
- Declining balance (decrescimento accelerato, mutuato dalla pratica fiscale, non raccomandato per LCC tecnica).
- Service-life-prorated con curva di obsolescenza (utile per impianti dove il valore funzionale decade più rapidamente del valore strutturale).

**Raccomandazione.** Adottare la formulazione lineare di EN 15459-1:2017 come default. Esporre un flag opzionale "valore residuo non-lineare" che applichi una curva calibrabile per famiglia di componenti, off di default. Il valore del land non entra (assunzione: il tool è LCC dell'asset costruito, non valuation immobiliare; il land è invariante tra alternative confrontate).

### A.3.C Tassi di sconto

**Problema nel tool originale.** Quattro punti di definizione (Project Information, Energy Cost!D9, Maintenance!D5, formule sparse), nessuno autoritativo. Tasso unico per tutto.

**Cosa dice la letteratura e la normativa.**

- Reg. (UE) 244/2012 obbligava sensitività su tassi e scenari nel framework storico. Nel profilo EPBD_2025, i requisiti esatti di sensitività devono essere estratti da Reg. Delegato (UE) 2025/2273 e relativi annex prima di codificarli.
- DG REGIO Guide CBA 2014-2020 raccomanda 3% per UE-15 e 5% per UE-13 e Paesi della Coesione (prospettiva sociale, real).
- NIST FEMP 2025 fissa 3% reale per investimenti federali a 1-30 anni.
- Letteratura: Weitzman (2001), in AER 91(1):260-271, dimostra che l'incertezza sulla scelta del tasso, modellata come distribuzione gamma, equivale matematicamente a un tasso che decresce nel tempo. Arrow et al. (2014) consolidano l'argomento e il UK Treasury Green Book lo ha operativizzato (3.5% per anni 0-30, 3.0% per 31-75, 2.5% per 76-125, 2.0% per 126-200, 1.5% oltre 200).

**Soluzioni candidate.**

1. Single discount rate parametrico, default 3% reale, sensitività obbligatoria a 1.5% e 5%.
2. Dual rate: tasso finanziario per la prospettiva privata (investimento, manutenzione, energia, ricavi), tasso sociale per la prospettiva macroeconomica EPBD (carbonio shadow). Coerente con la separazione macro/financial del framework EPBD, da versionare nel method profile 2025/2273.
3. Declining schedule alla Weitzman/UK Green Book per orizzonti >30 anni.

**Raccomandazione.** Implementare opzione 2 di default (single financial DR per il core LCC, single social DR per la prospettiva macroeconomica EPBD con eventuale shadow carbonio) con possibilità di switch a opzione 3 quando l'orizzonte attivato è >30 anni. Single source of truth nel database: tabella `discount_rate(type, value, effective_from, source, currency)` con `type` in {financial, social, escalation_energy_x, cpi_general, cpi_construction}. Tutte le formule leggono da qui, mai da costanti in linea. Questo elimina la quadruplicazione del tool Excel.

### A.3.D Costi energetici

**Problema nel tool originale.** Inflazione energetica unica, applicata anche fuori dal dominio energia (manutenzione, sostituzioni edili). PV revenue non inflazionata, inconsistente. PHPP letto via path Windows assoluto, dipendenza fragile.

**Cosa dice la letteratura.**

- Eurostat distingue HICP all-items (CPI generale), HICP energy, e indici costruzione (Producer Price Indices for construction). Sono indipendenti e con dinamiche divergenti, specie dal 2022.
- IEA World Energy Outlook 2025 fornisce due scenari operativi: Current Policies Scenario (CPS) e Stated Policies Scenario (STEPS). Per il gas UE, +30-40% in CPS vs STEPS al 2035. Domanda elettrica UE +40% al 2035 in STEPS, con pressione su prezzi per ritardi infrastrutturali di rete.
- Il framework EPBD richiede attenzione agli sviluppi dei prezzi energetici; il profilo 2025/2273 deve versionare gli scenari e i requisiti di sensitività con source table e annex di riferimento.
- (Pernetti et al., 2021) supporta l'uso di SA per identificare i parametri ad alto impatto. Qualsiasi quota puntuale dei costi energetici sul totale LCC va citata solo con tabella/pagina full-text verificata.

**Soluzioni candidate.**

1. Single escalation rate per carrier, deterministico (status quo Excel).
2. Scenario set: CPS, STEPS, eventualmente APS (Announced Pledges) come terzo, mappati a curve di prezzo per carrier e per Paese.
3. Scenario set + stochastic overlay (banda di incertezza intorno a ciascuno scenario).

**Raccomandazione.** Soluzione 2 di default, soluzione 3 quando l'utente attiva il layer di incertezza. Ogni carrier (elettrico, gas, gasolio, biomassa, district heating, PV export) ha:

- Prezzo base (€/kWh, anno 0) con default Eurostat per Paese.
- Escalation profile: time series ([year, rate]) per scenario.
- Inflazione differenziata: HICP energy per i carrier, HICP all-items per CPI generale, PPI construction per i flussi manutentivi.

Output: split chiaro tra "consumo evitato" (delta vs reference) e "consumo netto", in coerenza con la prassi cost-optimal EPBD. PV revenue inflazionata coerentemente con il prezzo elettrico residenziale di self-consumption e con il feed-in tariff per la quota esportata. Storage entra come componente del cost engine con perdite round-trip e degradazione (tipicamente 2-3% capacità l'anno, riferimento NREL ATB) modellate nel calendario di sostituzione.

**Carbon shadow price.** Esposto come scenario opzionale per la prospettiva macroeconomica. I valori EU ETS/forward (ad esempio GMK 2025) sono scenario input di mercato, non default normativi: devono riportare source URL, publication date, ETS scope, valuta/base year e curva annua. Il Reg. 244/2012 resta solo baseline storica.

### A.3.E Manutenzione

**Problema nel tool originale.** Modello "% costo capitale" applicato uniformemente, e su 40 anni mentre la LCC gira a 100, e indicizzato con escalation energia.

**Cosa dice la letteratura.** Il modello "% di capitale" è il minimo accettabile, ma criticato in Manfren, Aste, Tagliabue e altri lavori del Politecnico di Milano per inadeguatezza rispetto ai pattern reali, dove la manutenzione condition-based supera in efficacia quella planned. ASHRAE Service Life Database e BCIS Building Maintenance Information forniscono tassi guasto e costi unitari per categoria.

**Soluzioni candidate.**

1. % di capitale uniforme (status quo).
2. % di capitale per categoria WBS, calibrato da database settoriali.
3. Modello activity-based: voce per voce, planned + condition-based + corrective, con database ASHRAE/BCIS.

**Raccomandazione.** Soluzione 2 di default, soluzione 3 esposta come opzione "advanced". Default per categoria: envelope opaco 0.5% capitale/anno, finestre 0.8%, copertura 0.7%, HVAC 1.5-2.5%, impianto elettrico 0.5%, BACS 1.0%, PV 1.0-1.5%. Indicizzazione: CPI construction, non escalation energia. Per ciascun componente la maintenance entra come `CostStream(category=B, subcategory=Y, ...)` separato dall'investment, in modo che nei breakdown sia possibile separare i due contributi.

### A.3.F Incertezza e sensitività

**Problema nel tool originale.** Assente. Input deterministici, output deterministici, nessuna informazione su robustezza delle conclusioni.

**Cosa dice la letteratura.** Tian (2013) classifica i metodi di sensitivity analysis (SA) in locali e globali, e in quattro famiglie globali: regression, screening, variance-based, meta-model. Saltelli et al. (2010, Computer Physics Communications 181) consolidano gli estimatori variance-based per indici Sobol di primo ordine (Si) e totale (STi), con costo computazionale N*(2k+2). Hopfe e Hensen (2011, Building and Environment 46) sono riferimento metodologico per uncertainty in building performance simulation. Pernetti et al. (2021) vanno invece citati per DSA + Elementary Effects applicati alla LCC di 11 nZEB europei: sono evidenza per screening pratico dei driver, non per Sobol gia eseguito.

**Soluzioni candidate.**

1. SA locale OAT (One-At-a-Time): rapidissima, fuorviante per LCC non lineari. Esclusa.
2. Morris elementary effects come screening: costo basso (N*(k+1) valutazioni con N=10-20 traiettorie), individua i parametri rilevanti su cui poi attivare Sobol.
3. Sobol Si + STi via Saltelli (2010): costo N*(2k+2). Per k=20 parametri e N=1024 (sample size minimo Saltelli per estimatori convergenti), 43.008 valutazioni. Sostenibile con modello deterministico LCC <1s (target <12 ore wall-clock single-thread, <2 ore con parallel 8x).
4. Polynomial Chaos Expansion (PCE): efficiente in dimensione moderata, costo computazionale calante con la dimensione di troncamento, ma richiede expertise di tuning.
5. Monte Carlo + LHS per uncertainty propagation, senza decomposizione: meno informativo ma più rapido (N=2.000-10.000 sufficienti per stime di P10/P50/P90 stabili).

**Raccomandazione.** Pipeline a due stadi.

- Stadio 1 (default ON): Morris screening sui ~20 parametri principali, ranking dei mu*-star, restituzione lista parametri "alti".
- Stadio 2 (opt-in): Sobol Si/STi sui parametri identificati ad alto effetto in stadio 1, default N=1024, con runtime target <30s grazie a parallel evaluations (Web Worker pool, server-side). In aggiunta, MC con LHS, N=5000 per produrre P10/P50/P90 di NPV e LCC, tornado plot, CDF, e violin di KPI principali.

**Distribuzioni di default.** La libreria distribuzionale è formalizzata nella tabella di A.5. Indicativamente: tasso di sconto come triangular (1.5%, 3%, 5%) o normal con media 3% e sigma 0.8 percentuale; escalation energia come scenari discreti pesati; costi di investimento come lognormal; service life Weibull come sopra; comportamento di occupazione e demand come uniform o triangular. Tutte queste distribuzioni sono default editoriali finché non vengono calibrate su fonte empirica versionata; l'utente deve poterle sovrascrivere con audit trail.

**Reporting.** Per ogni KPI principale, mostrare media, mediana, P10, P50, P90, e indicatore "probability of negative NPV" o equivalenti (esposizione finanziaria). Per il decisore non tecnico, una banda P10-P90 sul valore centrale è sufficiente; per l'analista, CDF, violin, e tornado restano disponibili come viste di dettaglio. Schwartz, Raslan e Mumovic hanno mostrato come questa stratificazione di output supporti decisioni robuste (cfr. Bibliografia).

### A.3.G Carbonio

**Problema nel tool originale.** Assente: nessuna integrazione LCA. Cost-optimal calcolato senza accounting di CO2 embodied, ignorando il vincolo crescente della Tassonomia UE e dell'EPBD recast.

**Cosa dice la letteratura e la normativa.**

- EN 15978:2011 e/o la sua adozione nazionale applicabile definiscono moduli A1-A5 (product, transport, construction), B1-B7 (use), C1-C4 (end-of-life), D (benefits beyond system boundary). Lo status di revisione/adozione va versionato per giurisdizione nel method profile. EN 16627:2015 è il pendant economico, isomorfo per moduli.
- EPD database europei: ÖKOBAUDAT (DE), INIES (FR), EPD International, MRPI (NL). I dati sono in unità funzionali per kg o m³ di prodotto, con LCIA factors (kg CO2 eq, MJ, ecc.).
- Carbon shadow pricing: EU ETS forward e NGFS scenarios come input scenario versionati, non default normativi non qualificati.
- Level(s) indicator 1.2 (LCA) e Marginal Abatement Cost (MAC) curves sono framework consolidati per €/tCO2 avoided.

**Raccomandazione.** Integrare un modulo LCSA (Life Cycle Sustainability Assessment) coerente con la coppia EN 15978 + EN 16627. Per ogni voce della WBS, oltre al costo monetario, esporre un campo `carbon_intensity(kg CO2eq per unit)` con default da EPD database. Il monetary equivalent del carbonio entra come overlay nei flussi macroeconomici (separato dal financial per esplicita scelta di layer), in modo che la curva cost-optimal possa essere disegnata in tre versioni: financial cost, macroeconomic cost (con shadow ETS), LCSA-aggregated (financial + carbon shadow + co-benefits). La compatibilità con EPBD recast 2024/1275, che impone reporting carbonio incorporato per nuovi edifici dal 2030 con LCGWP, è garantita da questa scelta architetturale.

### A.3.H Indicatori economici

**Problema nel tool originale.** Solo LCC cumulata e percentuali parziali. NPV non esplicito. IRR/payback non calcolati.

**Cosa dice la letteratura.**

- Il framework EPBD cost-optimal usa il concetto di **Global Cost** come indicatore primario. Nel tool, la formula operativa va versionata nel profilo 2025/2273; la formulazione di Reg. 244/2012 resta utile come baseline storica, non come fonte attiva unica.
- ISO 15686-5 e EN 16627 distinguono LCC (financial perspective) da LCSA (broader). EN 15459-1 fornisce il discounted payback period come indicatore complementare.
- NIST BLCC produce LCC, SIR (Savings to Investment Ratio), AIRR (Adjusted Internal Rate of Return), discounted payback.
- IRR ha problemi noti di radici multiple su cash-flow con segni alternati (tipico nelle ristrutturazioni con sostituzioni periodiche). MIRR (Modified IRR) li risolve assumendo reinvestimento al financing rate.

**Raccomandazione.** Implementare e mostrare i seguenti indicatori, in due livelli:

- Livello stakeholder (sempre visibile): Global Cost (€/m²), NPV (€), LCC totale (€), payback scontato (anni), carbon footprint LCA totale (kg CO2eq/m²).
- Livello analyst (visibile in modalità expert): IRR, MIRR, SIR, equivalent annual cost (EAC), levelized cost of energy saved (LCOE-saved, €/kWh), cost-benefit ratio.

La curva cost-optimal EPBD è la vista canonica per chi confronta varianti: x = primary energy demand (kWh/m² anno), y = global cost (€/m²). Soluzioni dominate, frontiera, e cost-optimal point sono evidenziati. Sia (Becchio et al., 2015) sia (Hamdy et al., 2013) usano questa forma U-shaped come deliverable.

### A.3.I Co-benefits e externalities (fuori scope)

Il brief originale aveva incluso questa area come "opzionale ma fortemente raccomandata". A riflessione, la monetizzazione di co-benefits IEQ (produttività, sick-leave, hedonic price, dose-risposta CO2-cognizione, premio di valore commerciale per edifici green) appartiene a un dominio scientifico distinto da quello del LCC ingegneristico di un edificio nZEB. Il tool CRAVEzero originale non li trattava, l'EPBD non li impone, e nessuno dei tool comparabili in scope (NIST BLCC, One Click LCA, Lcpy, Athena IE) li espone come parte del calcolo LCC. Sono quindi esclusi dall'architettura proposta.

Conseguenze sull'architettura: il Layer 6 dei co-benefits è stato sostituito dal Carbon overlay (A.2), gli indicatori di productivity/sick-leave/hedonic rental premium non compaiono né in B.3, né in B.5, né in B.6, e la tabella A.5 non li parametrizza. La separazione è netta per evitare di dare al LCC tool una valenza che non gli appartiene metodologicamente. Eventuali analisi su quei domini si fanno in pipeline separate e si comunicano alla LCC solo come scelta di scenario di input (es. una variante "BACS-equipped" può avere una domanda di energia diversa, che è quello che la LCC sa trattare).

Carbonio rimane invece in scope (A.3 G) perché EPBD 2024/1275 lo impone progressivamente, EN 16627 e EN 15978 lo prevedono come coppia, e il pricing shadow è un parametro economico, non una stima di esternalità sanitaria.

### A.3.J Aspetti implementativi

**Validation.** Un set di benchmark cases è la prova di non regressione metodologica. Proposta: 4-6 casi canonici derivati da letteratura pubblica e da CRAVEzero pinboard. Per ciascuno, expected NPV, LCC, IRR con tolleranza ±2% rispetto al riferimento pubblicato. Cross-check contro NIST BLCC (3 casi residenziali) per Global Cost. Cross-check contro Pernetti et al. (2021) per LCC su nZEB europei con sensitivity matching.

**Reproducibility.** Hash SHA-256 di input + version del metodo di calcolo come trailing nel report. Versioning semantico del metodo (es. method=2.3.0) e archivio storico delle versioni passate, in modo che ricalcoli di vecchi progetti restituiscano i numeri originari.

**API spec.** Input schema in JSON Schema (Draft 2020-12), output schema strutturato (cfr. B.6). Endpoint REST + tRPC interno, calcolo deterministico in <1s, stocastico in <30s.

**Sensitivity-aware data entry.** Per ogni input con distribuzione attesa (cfr. A.5), l'interfaccia chiede di default valore centrale + opzionale range (low/high), e propaga al layer uncertainty. Default chiari per ridurre la fatica.

## A.4 Schema di test e validazione

Test suite proposta, in ordine di gerarchia.

| Livello | Cosa testa | Metodo | Tolleranza |
|---|---|---|---|
| Unit | Discounting kernel (sum_t cf_t / (1+r)^t), residual value prorata, MIRR | Casi noti analitici, EN 15459-1 worked examples | esatto, ε=1e-9 |
| Component | Cost engine, energy engine, uncertainty layer indipendenti | Mock dati, snapshot test | esatto su valori, ±0.5% su time-series |
| Integration | End-to-end deterministic per 4 reference cases (es. CRAVEzero pinboard cases) | Confronto con valori pubblicati | ±2% NPV, ±5% IRR |
| Cross-tool | Stesso input fed a NIST BLCC web (per casi compatibili) | Differenza assoluta e relativa | ±3% su LCC, identificazione e documentazione di ogni differenza >5% |
| Statistical | MC convergence (LCC mean, P10/P90 stabili al variare di N) | Aumento N progressivo, plot di convergenza | mean ±0.5% di stabilità a N target |
| Methodological | Sobol indici stimati su modello surrogato analitico noto | Confronto con valori teorici | ±5% su Si, ±10% su STi |

Reproducibility test: due esecuzioni dello stesso input, con stesso seed, devono dare risultati bit-identical sui KPI deterministici; per KPI stocastici, identici per seed identico. Test di regressione su PR.

## A.5 Schema di parametrizzazione

Lista non esaustiva ma orientativa degli input principali esposti all'utente. Ogni voce ha: nome, unità, default, range plausibile, distribuzione tipica per l'uncertainty layer, fonte del default.

| Parametro | Unità | Default | Range plausibile | Distribuzione | Fonte default |
|---|---|---|---|---|---|
| Periodo di analisi | anni | 50 | {30, 40, 50, 60} | discreta a scelta | Level(s) 6.1 |
| Tasso di sconto finanziario | % reale | 3.0 | 1.5-6.0 | Triangular(1.5, 3.0, 5.0) | EU DG REGIO + FEMP |
| Tasso di sconto sociale | % reale | 3.0 | 1.5-5.0 | Triangular(1.5, 3.0, 5.0) | DG REGIO Cohesion |
| CPI generale (HICP all-items) | %/anno | 2.0 | 1.0-4.0 | Normal(2.0, 0.8) | Eurostat 10-year avg, ECB target |
| CPI costruzione (PPI construction) | %/anno | 2.5 | 1.0-5.0 | Normal(2.5, 1.2) | Eurostat PPI |
| Escalation elettrico residenziale | %/anno | scenario | -1 .. +6 (per scenario) | Discreta CPS/STEPS/APS, pesata | IEA WEO 2025 |
| Escalation gas naturale | %/anno | scenario | -1 .. +5 | Discreta CPS/STEPS | IEA WEO 2025 |
| Prezzo carbonio shadow | €/tCO2eq | 126 (2030) | 80-200 (2030) | Triangular | Consensus GMK 2025, BNEF |
| Vita tecnica envelope opaco | anni | 50 | 30-70 | Weibull(η=50, β=5) | ISO 15686-7 + practice |
| Vita tecnica finestre | anni | 30 | 20-40 | Weibull(η=30, β=4) | ISO 15686-7 |
| Vita tecnica HVAC | anni | 20 | 12-25 | Weibull(η=20, β=3) | ASHRAE TRP-1237 |
| Vita tecnica BACS | anni | 15 | 10-20 | Weibull(η=15, β=3) | EN 50090, IEC |
| Vita tecnica PV moduli | anni | 25 | 20-30 | Weibull(η=25, β=5) | manufacturer warranty practice |
| Vita tecnica inverter | anni | 12 | 10-15 | Weibull(η=12, β=3) | NREL ATB |
| Manutenzione envelope opaco | %CI/anno | 0.5 | 0.3-1.0 | Triangular | BCIS, Manfren et al. |
| Manutenzione HVAC | %CI/anno | 2.0 | 1.5-3.0 | Triangular | BCIS, ASHRAE |
| Manutenzione PV | %CI/anno | 1.2 | 0.8-2.0 | Triangular | NREL ATB |
| Self-consumption rate | %  | 30 (resid.), 50 (terz.) | 10-90 | Beta(α,β) site-specific | misure di campo CRAVEzero |
| Domanda riscaldamento | kWh/m² anno | EPC | 15-200 | Triangular | EPC + simulazione |
| Domanda raffrescamento | kWh/m² anno | EPC | 5-80 | Triangular | EPC + simulazione |
| Domanda ACS | kWh/m² anno | 25 (resid.) | 15-50 | Triangular | EN 16798-1 |
| Domanda elettrico domestico | kWh/m² anno | 25 (resid.) | 15-50 | Lognormal | EN 16798-1 |
| Produzione PV | kWh/m² PV anno | 1100 (centro UE) | 700-1600 | Lognormal | PVGIS |
| Residual value method | enum | linear prorata | {linear, declining, custom} | --- | EN 15459-1 |

## A.6 Aree dove la letteratura è insufficiente

Riconoscere onestamente i punti dibattuti previene di sovrarappresentare la solidità del tool.

- **Declining discount rate operativo.** Weitzman e Arrow forniscono il razionale, ma la calibrazione del schedule (cut-off di 30/75/125 anni del UK Treasury) è arbitraria. Adottare la curva UK Green Book come default, dichiarando l'assunzione.
- **Service life di componenti nuovi (smart, BACS, batterie 2.gen).** Le distribuzioni Weibull con η/β consolidati non sono disponibili per tutte le tecnologie emergenti. Per batterie LFP, ad esempio, dati pubblici di cicli reali a 80% capacity retention sono ancora frammentari. Esporre le distribuzioni come modificabili con caveat documentato.
- **Future regulatory framework dei feed-in tariff.** Differenze tra Paesi UE alte, dynamic pricing e capacity market in evoluzione. Modellizzazione semplificata di default, esposizione di hook per scenari custom.
- **Embodied carbon coupling.** EN 15978 e EN 16627 sono progettati per uso coordinato, ma la coerenza dei dati (EPD usati in LCA + costi di mercato dello stesso componente) richiede attenzione. Iniziative ÖKOBAUDAT+BNB lo facilitano per la Germania, meno per Italia.
- **Cost-optimal vs Pareto multi-obiettivo con carbonio.** Cost-optimal classico ha un unico KPI (Cg minimo). Pareto bi-obiettivo (LCC vs Carbon) è più informativo ma più complesso da comunicare. La letteratura suggerisce hybrid display (vedi Parte B).

---

# Parte B. Visualizzazione e reporting

## B.1 Sintesi della ricerca bibliografica

| Fonte | Tipo | Rilevanza |
|---|---|---|
| Few S., Information Dashboard Design (2013) | Libro | Principi di design dashboard, antipattern (gauge superflui, 3D, color overuse) |
| Tufte E., The Visual Display of Quantitative Information | Libro | Data-ink ratio, chartjunk, small multiples |
| Knaflic C. N., Storytelling with Data | Libro | Annotazione, focus, narrativa di un grafico |
| Munzner T., Visualization Analysis and Design | Libro | Tassonomia di task: discover / present / enjoy; encoding channels |
| Card, Mackinlay, Shneiderman | Articolo | Information seeking mantra: overview first, zoom and filter, details on demand |
| WCAG 2.2 (W3C) | Standard | Contrast 3:1 non-text, 4.5:1 text, 1.4.1 colore non come unico canale, alt text |
| ColorBrewer 2.0 (Brewer & Harrower) | Tool | Palette categoriche/sequenziali/divergenti colorblind-safe |
| JRC Level(s) reporting workbook | Template UE | Output reporting LCC e LCA |
| ISO 15686-5 e EN 16627 | Norma | Requisiti minimi di reporting per LCC |
| One Click LCA help center | Tool reference | Pattern interfaccia LCC commerciale, automatic O&M, BIM import |
| NIST BLCC documentation (NIST HB 135 2025) | Tool reference | Layout report federale USA |
| (Becchio, Corgnati, 2015), (Hamdy et al., 2013) | Articoli | Esempi pubblicati di curva cost-optimal nZEB |
| IEA Energy Sankey tool | Tool | Reference per Sankey energetici interactive |
| Saltelli, Tarantola, Campolongo, Ratto | Libro | Visualizzazione canonica di Sobol indices (bar ranked, heatmap) |
| (Pernetti et al., 2021) | Articolo | Esempio applicato di tornado e ranking parameter influence in LCC nZEB |
| Recharts / Plotly / ECharts / D3 / Visx / Tremor docs | Tool | Capabilities, performance, license per la scelta di libreria |
| npm-compare, bundlephobia | Tool web | Download e bundle size 2026 |

## B.2 Audience analysis

Il tool serve quattro classi di utenti con bisogni informativi distinti.

**Progettista / Energy manager (utente primario, expert).** Vuole esplorare alternative, confrontarle, identificare cost-optimal. Lavora in sessioni lunghe, accetta complessità, beneficia di interattività e di drill-down. Vista predefinita: dashboard analyst.

**Developer immobiliare / Asset manager.** Vuole KPI sintetici (NPV, payback, ROI, premio di valore stimato), un orizzonte temporale visualizzato come "denaro nel tempo", e robustezza (banda di confidenza). Sessione breve. Vista: dashboard decision (KPI cards prominenti).

**Ricercatore / PhD.** Vuole accesso completo (tornado, Sobol, MC distribuzioni, export dati). Vista: analyst + export panels.

**Decisore PA / Pubblica amministrazione (valutazioni di gara).** Vuole un report PDF firmabile, con metodologia esplicita, confronto tra varianti standardizzato, e indicatori cost-optimal allineati EPBD. Vista: report stampabile + filter cost-optimal compliance.

Le quattro audience non condividono lo stesso schermo. Tre viste, una è duplicata: decision (developer + PA in browser), analyst (progettista + ricercatore), report PDF (PA + developer per archiviazione). Decisione di prodotto: separare con tab top-level, condividere il dataset sottostante.

## B.3 Catalogo dei grafici raccomandati

Per ogni grafico: cosa mostra, agganci di calcolo (Parte A), tipo, libreria suggerita, data spec, edge cases, alternative considerate. Il numero progressivo serve come riferimento da B.4 layout e B.5 PDF.

### B.3.1 Cost-Optimal curve (Pareto-EPBD)

- Cosa mostra. Per ogni variante progettuale: x = primary energy demand (kWh/m² anno), y = global cost Cg (€/m²). Frontiera U-shaped evidenziata (Becchio et al., 2015; Hamdy et al., 2013), cost-optimal point marcato.
- Aggancio A. A.3 H (Global Cost), A.3 D (PED da energy engine).
- Tipo. Scatter + frontier line + marker.
- Libreria. Recharts (sufficiente, SVG, fino a 100-200 punti) o Apache ECharts se >500 punti.
- Data spec. `{variant_id, ped: number, cg: number, baseline: bool, cost_optimal: bool, scenario_id}` per singolo scenario. Multi-scenario gestiti con piccoli multipli o con dropdown.
- Edge cases. Varianti non dominate vs dominate (color encoding distinct), banda di incertezza P10-P90 come ellisse intorno al punto se uncertainty layer attivo.
- Alternative considerate. Tradizionale bar comparison (rigettata: cost-optimal richiede assi continui). Parallel coordinates (utile come complemento ma non sostituto).

### B.3.2 KPI cards (decision view)

- Cosa mostra. Sei card affiancate: NPV, LCC totale (€), LCC/m² (€/m²), Discounted payback (anni), IRR (% o "N/A" se multiple roots), Carbon footprint LCA (kg CO2eq/m²). Ognuna con valore centrale, banda P10-P90 sotto, delta vs baseline.
- Aggancio A. A.3 H.
- Tipo. Card grid, no chart. Componente custom su shadcn/ui.
- Edge cases. Valore negativo, NaN per IRR, valore enorme (rounding intelligente).

### B.3.3 LCC breakdown ad albero (treemap)

- Cosa mostra. Quota di LCC per categoria WBS (A construction, B systems, C RES, D other, E external), drill-down a sotto-categoria.
- Aggancio A. A.2 cost engine aggregator.
- Tipo. Treemap interattivo, click per zoom.
- Libreria. Apache ECharts (built-in, accessibile) o Nivo Treemap.
- Data spec. `{name, value, children[]}` ricorsivo.
- Edge cases. Categorie con valore negativo (residual value): mostrare in cella separata con pattern, non come "size negativo".
- Alternative. Sunburst (più complesso per la stessa info). Pie chart (rifiutato: non gestisce gerarchia).

### B.3.4 Cash-flow waterfall

- Cosa mostra. Per orizzonte di analisi intero, decomposizione del global cost: investimento iniziale, somma di sostituzioni discounted, somma di manutenzione discounted, somma di energia discounted, ricavi discounted (negativi), residual value (negativo).
- Aggancio A. A.2 aggregator across cash-flow time-series.
- Tipo. Waterfall verticale.
- Libreria. Apache ECharts (custom waterfall), Plotly (built-in), o Recharts con custom render.
- Data spec. `{label, value, type: 'increase'|'decrease'|'total'}`.

### B.3.5 Cumulative discounted cash-flow

- Cosa mostra. Curva temporale: asse x = anni 0..N, asse y = cumulative LCC (€). Marker su break-even (se applicabile), banda di incertezza P10-P90 come fan chart.
- Aggancio A. A.2 cost engine + A.3 F uncertainty.
- Tipo. Line chart con band area.
- Libreria. Recharts (semplice) o ECharts (con fan chart custom).
- Data spec. `{year, cum_discounted_lcc, p10, p50, p90}[]`.
- Edge cases. Periodi di analisi diversi mostrati come piccoli multipli.

### B.3.6 Stacked area "spend per category over time"

- Cosa mostra. Per ogni anno dell'orizzonte, decomposizione del flusso annuale discounted per categoria WBS (envelope, HVAC, RES, energia, manutenzione, ricavi).
- Aggancio A. A.2.
- Tipo. Stacked area chart con stream option.
- Libreria. Recharts (con AreaChart stacked) o Visx (stream graph se serve).
- Data spec. `{year, env, hvac, res, energy_cost, maint, revenue}[]`.
- Edge cases. Anni con sostituzioni grandi vanno mostrati come step-line di superficie (no smoothing che nasconde i picchi).

### B.3.7 Sankey diagramma di flussi di costo

- Cosa mostra. Flusso del denaro dalla source (financing, owner equity) alla destinazione (capex envelope, capex HVAC, opex energy, opex maintenance, end-of-life, eventual revenue, residual value).
- Aggancio A. A.2.
- Tipo. Sankey.
- Libreria. Apache ECharts (built-in Sankey, accessibile e performante).
- Data spec. nodes + links con `{source, target, value}`.
- Edge cases. Flussi molto piccoli vanno raggruppati in "altro" sotto soglia 1% per leggibilità.

### B.3.8 Sankey di flussi energetici

- Cosa mostra. Per il building, sorgenti (rete elettrica, gas, sole) -> vettori (elettrico, gas, calore, ACS) -> servizi (heating, cooling, DHW, plug). Quantità in kWh/anno o €/anno.
- Tipo. Sankey.
- Libreria. Apache ECharts.
- Riferimento di prassi. IEA Energy Sankey tool è il riferimento internazionale.

### B.3.9 Tornado diagram (sensitivity)

- Cosa mostra. Per ogni parametro, barra bidirezionale ordinata per impatto sulla LCC (low value ridotta vs high value). Mostra rank dei driver in modo intuitivo per non tecnici.
- Aggancio A. A.3 F.
- Tipo. Tornado horizontal bar.
- Libreria. Recharts (BarChart con layout vertical) o Plotly.
- Data spec. `{parameter, low_value, high_value, baseline}[]`.

### B.3.10 Sobol indices visualization

- Cosa mostra. Per ogni parametro, due barre affiancate: Si (primo ordine) e STi (totale). Ordinate per STi decrescente.
- Aggancio A. A.3 F.
- Tipo. Grouped horizontal bar chart, o radial / sunburst per indici di interazione.
- Libreria. Recharts o Apache ECharts.
- Data spec. `{parameter, S_i, ST_i}[]`.
- Alternative. Heatmap per second-order interactions (Sij). Da esporre solo in advanced mode.

### B.3.11 Distribuzione PDF/CDF dei KPI

- Cosa mostra. Per NPV o LCC, distribuzione di probabilità (PDF kernel-density) o cumulata (CDF). P10/P50/P90 marcati. Probability of negative NPV evidenziata.
- Aggancio A. A.3 F output MC.
- Tipo. Density chart (PDF) o step (CDF).
- Libreria. Plotly (built-in violin/box/distribution), Apache ECharts custom, o Observable Plot.

### B.3.12 Box / violin per scenario comparison

- Cosa mostra. Per ciascuno scenario energy (CPS, STEPS, APS), distribuzione del KPI principale.
- Aggancio A. A.3 D e F.
- Tipo. Box plot + violin overlay.
- Libreria. Plotly (più semplice) o ECharts.

### B.3.13 Confronto multi-variante (small multiples)

- Cosa mostra. Per 3-6 varianti progettuali, ripetere 4-6 micro-charts identici (KPI tile + waterfall + cumulative). Layout a griglia.
- Aggancio A. A.2 multi-variant.
- Tipo. Small multiples.
- Libreria. Componibile in qualsiasi libreria; Recharts grid + flexbox è sufficiente.
- Alternative. Parallel coordinates (esposto come vista separata).

### B.3.14 Difference bar (variante vs reference)

- Cosa mostra. Per ogni categoria WBS, delta in € o % vs reference variant. Banda di incertezza opzionale.
- Aggancio A. A.2.
- Tipo. Diverging bar chart, valori negativi a sinistra (risparmio), positivi a destra (extra cost).
- Libreria. Recharts.

### B.3.15 Parallel coordinates (multi-criteria)

- Cosa mostra. Per varianti progettuali, una linea che attraversa assi paralleli (PED, LCC, NPV, carbon, IRR, residual value). Filtri brush per esplorare cluster.
- Aggancio A. A.3 H + A.3 G carbon overlay.
- Tipo. Parallel coordinates plot.
- Libreria. Plotly (built-in) o D3 con Visx primitives.
- Cautela. Funziona per audience expert; non default per stakeholder.

### B.3.16 Radar / spider (multi-criteria sintetico)

- Cosa mostra. Per 2-3 varianti, performance normalizzata su 4-6 dimensioni (cost, carbon, primary energy, residual value, robustness, payback).
- Tipo. Radar chart.
- Libreria. Recharts (built-in) o ECharts.
- Cautela. Tufte e Few criticano il radar per imprecisione visiva: usarlo solo come supporto, non come grafico primario di confronto numerico.

### B.3.17 Step-line per costi discreti di sostituzione

- Cosa mostra. Costi puntuali nel calendario di sostituzioni (anno per anno) sovrapposti alla curva di manutenzione.
- Aggancio A. A.3 A cycle modeling.
- Tipo. Step-line + line.
- Libreria. Recharts.

### B.3.18 Pareto frontier multi-variante

- Cosa mostra. Per N varianti, scatter su 2 obiettivi (es. LCC vs Carbon), frontier evidenziata. Estensione 3D opzionale (LCC + Carbon + Comfort).
- Aggancio A. A.3 G + I.
- Tipo. Scatter + frontier line.
- Libreria. Recharts (2D), Plotly (3D opzionale).

### B.3.19 Cost-vs-energy efficiency (Marginal Abatement Cost)

- Cosa mostra. Per ogni misura, barra width proporzionale al CO2 abated, altezza pari a €/tCO2 abated. MAC curve classica.
- Aggancio A. A.3 G.
- Tipo. Step-bar / MAC curve.
- Libreria. D3 / Visx (rendering custom), o Plotly hack.

### B.3.20 Reference-baseline comparison snapshot

- Cosa mostra. KPI side-by-side: variante selezionata vs reference building (NPV, LCC, payback, Carbon). Tabellare con sparkline.
- Tipo. Tabella interattiva con sparkline cell.
- Libreria. tanstack-table + Recharts ResponsiveContainer.

### Scelta di libreria (sintesi)

| Libreria | Versione 2026 | Licenza | Pro | Contro | Quando usarla |
|---|---|---|---|---|---|
| Recharts | 2.x stabile, 3.x in arrivo | MIT | React-first, declarativo, integra bene con shadcn/ui | SVG, lento >10k punti, nessun Sankey built-in | Default per la maggior parte dei grafici (KPI cards, bar, line, area, tornado, scatter) |
| Apache ECharts (echarts-for-react) | 5.x | Apache 2.0 | Sankey, Treemap, heatmap built-in, canvas rendering, performance fino a 100k+ punti con sampling | Bundle ~340 kB gzipped, API meno React-idiomatica | Sankey, Treemap, dataset grandi, cost-optimal con >500 varianti |
| Plotly.js (react-plotly.js) | 2.x | MIT | Distribution charts (violin, box, ridgeline), 3D, scientific | Bundle ~1 MB+, API imperativa | Distribution e statistical view, modalità "scientific export" |
| Observable Plot | 0.6.x | ISC | API alta espressività, perfetto per piccole composizioni | Integrazione React non plug-and-play, tooltip rigidi | Visualizzazioni one-off complesse, esplorative |
| Visx | 3.x | MIT | Primitive D3 + React, custom totale | Costo di tempo alto, manutenzione | Solo quando una vista non è componibile dalle precedenti (es. fan chart custom) |
| D3.js | 7.x | ISC | Massimo controllo | Esclude productivity benefits del React-idiomatic | Solo per blocchi atomici (es. MAC curve, ridgeline custom) |
| Tremor | 3.x | Apache 2.0 | KPI cards / dashboard layout built-in su Recharts | Lock-in stilistico | Considerabile per Decision dashboard se accelera molto |

**Raccomandazione di stack.** Recharts come libreria primaria, Apache ECharts come "specialty" per Sankey, Treemap, e dataset >1000 punti, Plotly come opzionale per Distribution panel. Bundle splitting per pagina, lazy-loading di ECharts e Plotly solo quando il pannello è aperto. Stack motivato da: licenza permissiva (MIT/Apache 2.0), accessibilità nativa, React-friendliness, e copertura di tutti i 20 grafici proposti senza ricorrere a librerie commerciali (Highcharts escluso per costo di licenza commerciale).

## B.4 Layout di dashboard

Tre viste top-level (tab), descritte come griglie ASCII.

**Vista Decision (decisore non-tecnico).**

```
+----------------------------------------------------------+
| Header: building, variante, scenario, periodo, currency  |
+----------------------------------------------------------+
| KPI cards (B.3.2)                                        |
|  NPV | LCC tot | LCC/m2 | Payback | IRR | Carbon         |
+----------------------------------------------------------+
| Cost-Optimal curve (B.3.1)        | Treemap WBS (B.3.3)  |
|                                   |                      |
+----------------------------------------------------------+
| Cumulative cash-flow w/band (B.3.5) | Difference bar     |
|                                     | vs reference (3.14)|
+----------------------------------------------------------+
| Sentence-level summary (auto-narrative)                  |
+----------------------------------------------------------+
```

L'autonarrativa testuale traduce i numeri principali in un paragrafo coerente: "La variante A presenta un NPV di X €, payback scontato Y anni, con 80% di probabilità di essere economicamente vantaggiosa rispetto al reference. Il driver dominante è Z." Knaflic (Storytelling with Data) raccomanda questa pratica come ponte tra dati e decisione.

**Vista Analyst (progettista, ricercatore).**

```
+----------------------------------------------------------+
| Header con selettori multi-scenario                      |
+----------------------------------------------------------+
| Cost-optimal multi-scenario (B.3.1 con scenario set)     |
+----------------------------------------------------------+
| Sankey costi (B.3.7)         | Sankey energia (B.3.8)    |
+----------------------------------------------------------+
| Waterfall (B.3.4)            | Stacked area time (B.3.6) |
+----------------------------------------------------------+
| Tornado (B.3.9)              | Sobol Si/STi (B.3.10)     |
+----------------------------------------------------------+
| NPV distribution (B.3.11)    | Scenario box plot (B.3.12)|
+----------------------------------------------------------+
| Parallel coordinates (B.3.15) full width                 |
+----------------------------------------------------------+
```

**Vista Compare (multi-variante).**

```
+----------------------------------------------------------+
| Variants selector: A, B, C, D (multi-select)             |
+----------------------------------------------------------+
| Pareto frontier 2D (B.3.18)                              |
+----------------------------------------------------------+
| Small multiples grid (B.3.13): 4 mini-dashboard          |
| A | B | C | D                                            |
+----------------------------------------------------------+
| Radar (B.3.16) di sintesi multi-criteria                 |
+----------------------------------------------------------+
| Tabella sortable con sparkline (B.3.20)                  |
+----------------------------------------------------------+
```

**Gerarchia di lettura.** Ogni vista segue il mantra di Shneiderman: overview (top), zoom & filter (mid), details on demand (bottom). Ogni tile è cliccabile per espandere a full-screen modal, con drill-down a tabella sottostante.

**Responsive design.** Su breakpoint <1024 px: collasso a singola colonna, grafici full-width, Treemap diventa lista sortable, Sankey diventa stacked bar (degrado controllato). Su <640 px: solo KPI cards + cumulative cash-flow + Treemap collassato.

## B.5 Schema del PDF report

Layout pensato per stampa A4 portrait, 1-2 grafici per pagina, font Inter come definito nel design system del progetto (cfr. user MEMORY).

```
Pagina 1. Front matter
  Titolo, building identificato, autore, data, versione metodo, hash input

Pagina 2. Executive summary
  3 KPI principali (NPV, LCC/m2, payback) come callout grandi
  Sentence-level summary (paragrafo)
  Cost-Optimal positioning rispetto al reference

Pagina 3-4. Methodology
  Periodo, tassi, scenari, distribuzioni
  Tabella di parametrizzazione applicata (subset di A.5)
  Compliance: EPBD cost-optimal, ISO 15686-5, EN 16627, Level(s)

Pagina 5. Inputs
  Riassunto WBS, demand profile, EPC class

Pagina 6-7. Results, deterministic
  Cost-Optimal curve (se multi-variante)
  Waterfall
  Cumulative cash-flow
  Treemap WBS
  Indicatori economici tabellari (NPV, LCC, Cg, IRR, MIRR, payback, EAC)

Pagina 8-9. Results, probabilistic (se uncertainty layer attivo)
  Tornado
  Sobol Si/STi
  NPV distribution (CDF) + Probability of negative NPV
  Scenario comparison box plot

Pagina 10. Carbon (se overlay attivo)
  Carbon footprint LCA breakdown
  LCSA aggregated cost (financial + carbon shadow)
  MAC curve

Pagina 11. Conclusions and recommendations
  Variante raccomandata + rationale
  Sensitivity highlights
  Limiti dell'analisi (esplicito)

Pagina 12+. Appendix
  Bibliografia (auto-generata dalle assunzioni applicate)
  Glossario indicatori
  Input data table completa
```

Localizzazione i18n: italiano, inglese, tedesco minimo. Formati di numero (separatore decimale virgola per IT/DE, punto per EN), date (dd/mm/yyyy IT/DE, mm/dd/yyyy o yyyy-mm-dd EN), currency simboli e formato. PDF/A-2b come export di default per archiviazione long-term.

Reporting compliance: ogni pagina ha footer con metadata "Calculated with LCCzero v.X.Y, method v.Z, page n/N", garantisce auditability nel tempo. Hash input nel front matter permette re-run da archivio.

## B.6 Schema di export

**JSON strutturato (default analyst e developer).**

```
{
  "metadata": { "id", "version_method", "version_tool", "hash_input", "timestamp", "locale" },
  "input": { "building": {...}, "wbs": [...], "params": {...} },
  "results": {
    "deterministic": {
      "global_cost": ..., "npv": ..., "lcc_total": ..., "lcc_per_sqm": ...,
      "payback_discounted": ..., "irr": ..., "mirr": ..., "eac": ...,
      "breakdown_by_category": [...],
      "cash_flow_yearly": [{ "year": 0, "investment": ..., "maintenance": ..., ... }, ...]
    },
    "probabilistic": {
      "mc_samples_count": ..., "kpis": { "npv": { "p10": ..., "p50": ..., "p90": ..., "mean": ..., "std": ..., "prob_negative": ... }, ... },
      "sobol": [{ "parameter": ..., "s_i": ..., "st_i": ..., "ci_95": [...] }, ...]
    },
    "scenarios": { "cps": {...}, "steps": {...}, "aps": {...} },
    "carbon": { "lca_total_kgco2": ..., "lcsa_aggregated_cost": ... }
  }
}
```

**CSV** una serie temporale per file (cash flow, energy demand, costs by category) per facilità di import in Excel/Python/R.

**Excel "compatibility"** file `.xlsx` con sheet structure analoga al CRAVEzero originale, in modo che utenti legacy possano confrontare i numeri linea per linea. Generato lato server con ExcelJS o xlsx-populate.

**PDF/A** generato lato server con Puppeteer headless + print CSS, o react-pdf, in funzione delle preferenze del team. PDF/A-2b la variante di archiviazione (no JavaScript embedded, font embedded, color management).

**Hash di reproducibility** in tutti i formati: SHA-256 di input.json + method_version come campo di metadata.

## B.7 Sistema di temi e palette

EURAC brand (#C8102E, eurac-red) come accent monocromatico, da usare per highlights, primary CTA, reference baseline. Sistema costruito su tre famiglie di palette: categoriale (WBS), sequenziale (intensità di costo, time-decay), divergente (delta vs reference).

**Palette categoriale (WBS 5+1 categorie principali, colorblind-safe).** Da ColorBrewer 2.0 Set2 a 6 classi, leggermente desaturata:

- A Construction: #66c2a5
- B Systems: #fc8d62
- C RES: #8da0cb
- D Other: #e78ac3
- E External: #a6d854
- Residual / Revenue: #ffd92f

Verifica con simulatori deuteranopia/protanopia (es. Stark, Color Oracle). Tutti i pari a 3:1 contrast su background neutro #fafafa.

**Palette sequenziale (costo intensity, time).** Da viridis (perceptually uniform, colorblind-safe): #440154 -> #404788 -> #2a788e -> #22a884 -> #7ad151 -> #fde725. Default per Sankey heat, Heatmap Sobol-second-order, age-of-cash-flow.

**Palette divergente (delta vs reference).** RdBu inverted o GnBu-vs-OrRd: saving (verde) -> neutro -> extra cost (rosso EURAC). Necessità di rispettare contrast nel light e dark mode.

**Dark mode.** Tutti i grafici devono funzionare in light e dark theme con palette adattata. Mai usare solo luminance per distinguere categorie. Background dark #0a0a0a (vicino nero ma non puro per ridurre eye strain).

**Stampa B/N.** Verificare ogni grafico in grayscale: distinzione mantenuta da pattern (per bar/area: hatching, stripes, dots), non solo da colore. WCAG 1.4.1 conformance.

**Typography in chart.** Inter come font primario (già nel design system del progetto). Title 14 px bold, axis 11 px regular, annotation 10 px. Numeri ad alta densità arrotondati con separatori locali (es. 1.234.567 IT/DE, 1,234,567 EN).

**Interaction state.** Hover: opacity 1.0 con outline; non-hover: opacity 0.6. Selection persistente: outline blue (#0a84ff) compatibile dark+light. Keyboard navigation: focus ring identico all'outline selection, supporto Tab e arrow keys per scorrere serie.

---

# Pensiero critico

## I tre punti più deboli di questa proposta

1. **Default delle distribuzioni di incertezza calibrate su poche fonti.** La libreria distribuzionale in A.5 (lognormal per costi, Weibull per service life, triangular per tassi) deriva da prassi consolidata e da scelte editoriali, non da calibrazione completa in Pernetti et al. (2021). Per categorie come BACS o batterie LFP i parametri Weibull (η, β) sono estrapolati con basi empiriche frammentarie. Conseguenza: l'output stocastico iniziale può essere over-confident. Mitigazione: marcare le distribuzioni come "default editoriale" e permettere all'utente di override, con audit trail della scelta.
2. **La pipeline Sobol+MC ha runtime non garantiti su tutti i casi.** Target <30s per analisi stocastica è realistico con N=1024 e k=20 parametri *se* il calcolo deterministico singolo è <1s. Per casi con WBS molto granulare (es. 200 voci di costo) o carrier multipli con time series complete, 1s non è scontato. Mitigazione: profilare il deterministic engine prima di committarsi al target, e implementare una "Sobol degradata" (N=256, screening Morris solo) come fallback con avviso.
3. **La scelta di stack chart (Recharts + ECharts + Plotly) lascia un'API surface ampia.** Tre librerie significano tre stili di codice, tre bundle, tre superfici di bug. L'alternativa minimalista (solo ECharts) coprirebbe tutti i 20 grafici proposti con un singolo paradigma, ma rinuncerebbe alla naturalezza React-idiomatic di Recharts. La raccomandazione resta tre librerie con lazy-loading, ma il committente deve essere consapevole del trade-off di maintenance.

## Bet di copertura normativa a 5 anni

- **EPBD recast scenario.** Il recepimento di Direttiva 2024/1275 è dovuto entro 29/05/2026. Il pacchetto delegato del 30/06/2025 ha già aggiornato la metodologia cost-optimal. Architettura del tool è compatibile: il layer "metodo" è isolabile, parametrizzabile per tasso di sconto, periodo, scenari, e già supporta dual perspective (macro/financial). Rischio basso.
- **Whole-life carbon mandatory scenario.** EPBD 2024/1275 introduce il calcolo del Global Warming Potential su ciclo vita per nuovi edifici, scadenza graduale a partire dal 2028. A.3 G ne anticipa l'aggancio. Rischio basso se il modulo LCSA è implementato fin dall'inizio.
- **Mandatory uncertainty reporting scenario.** Il framework EPBD richiede sensitivity/reporting su assunzioni economiche; per 2025/2273 i requisiti esatti vanno estratti dall'annex prima di codificare default. Una stretta verso UQ probabilistica obbligatoria è plausibile ma non annunciata.
- **Mandatory BIM/IFC interoperability.** EPBD non lo impone ma la pratica nazionale (es. Italia DM 560/2017 BIM obbligatorio sopra soglia) sì. L'input WBS deve permettere import da IFC quantity takeoff. Rischio medio: prevedere un adapter IFC come milestone successiva.

## Distinzione: obbligo vs raccomandazione vs opinione informata

- **Obbligato (normativa).** Cost-optimal reporting EPBD secondo Reg. Delegato (UE) 2025/2273, con method profile versionato per periodo, prospettiva, cost boundary, scenari e fonti. Modalità calcolo coerente con EN 15459-1 (residual value pro-rata, global cost present value) e coerenza con EN 16627 moduli A1-A5, B1-B7, C1-C4, D.
- **Raccomandato (letteratura consolidata).** Real terms come default, single source of truth dei tassi, separazione CPI generale / CPI costruzione / escalation energia, MC+LHS con N=5000 per uncertainty propagation, Sobol Si/STi con Saltelli (2010), Weibull service life per probabilistic replacement, banda P10-P90 nei grafici per stakeholder.
- **Opinione informata.** Default 50 anni (è una scelta tra Level(s) e prassi EPBD, motivata ma soggettiva), tre librerie chart vs una, modulo carbonio attivabile, autonarrativa testuale a complemento KPI, stack di colori EURAC come default.

## Conflitti tra fonti dichiarati esplicitamente

- ISO 15686-5 lascia il periodo al committente. Level(s) prescrive 50 anni. La prassi EPBD va versionata nel profilo 2025/2273. NIST/FEMP BLCC è comparatore USA, non vincolo UE generale. Scelta motivata: 50 anni di default per Level(s) con sensitività automatica e profilo EPBD separato.
- I tassi di sconto devono essere posseduti dal method profile: EPBD_2025, LEVELS_50Y, NIST/FEMP o CUSTOM. Non hard-codare il 3% di Reg. 244/2012 come default universale.
- EN 15978 e EN 16627 fanno coppia per moduli ma usano definizioni diverse di "system boundary" rispetto a ISO 15686-5. EN 16627 prevale per coerenza europea.

## Confronto con tool open-source esistenti

- **NIST BLCC** (basato su Handbook 135/FEMP material). Differenze: profilo federale USA, deterministico, con discount-rate/periodo da current FEMP material. Tool proposto offre orizzonti parametrici, UQ opzionale, e copertura EU normativa. La forma di reporting di BLCC ispira il PDF schema (B.5).
- **One Click LCA**. Differenze: commerciale, LCC come modulo aggiuntivo, dataset proprietario costi. Tool proposto è open-source-friendly, integra UQ nativamente, e supporta scenari EU specifici. Il pattern di "automatic O&M based on location" è da replicare.
- **Lcpy (Python)**. Differenze: libreria di calcolo, non tool con UI. Tool proposto è full-stack. Lcpy è ottimo riferimento per la coerenza calculation engine; può essere studiato per validare il discounting kernel.

## Cosa NON copre la proposta

- **Co-benefits IEQ-productivity-salute.** Monetizzazione di productivity gain, sick-leave avoidance, dose-risposta CO2-cognizione, hedonic rental premium sono fuori scope. Il LCC tool calcola costi di costruzione, energia, manutenzione, fine vita, carbonio. La monetizzazione di esternalità sanitarie e di valore commerciale appartiene a pipeline separate e a dataset di campo che il LCC non possiede.
- **Social LCA** (sLCA). EN 15643-3 (sociale) e UNEP SETAC guidelines esistono ma la metodologia è ancora poco standardizzata. Esclusa.
- **Behaviour modelling esplicito.** Le scelte dell'occupante influenzano enormemente la performance reale vs progettata, ma modellarlo richiederebbe integrazione con simulatore (IEA EBC Annex 79). Esposto come scenario di sensitività solo come range parametrico, non come modello comportamentale full.
- **Real estate market valuation.** Fuori scope: il tool calcola la LCC dell'asset costruito, non il valore di mercato.
- **Externality monetization piene** (acqua, biodiversità, ecc.). EN 16627 le contempla concettualmente; default conservativi le ignorano.

---

# Open issues (decisioni che il committente deve prendere)

1. **Periodo di analisi default.** 30 anni (EPBD cost-optimal compliance) vs 50 anni (Level(s)). La proposta raccomanda 50 con sensitività automatica, ma se il caso d'uso primario sono valutazioni di gara PA, default 30 può essere più allineato. Decidere.
2. **Modulo carbonio.** Implementare fin dal MVP o lasciare a versione 2.0? La proposta lo include nell'architettura ma il dataset EPD italiano è frammentato. Decisione di scope.
3. **Stack chart.** Tre librerie (Recharts + ECharts + Plotly) come da raccomandazione, oppure stack ridotto (solo ECharts) per minore complessità di maintenance.
4. **Currency multi-tenancy.** Solo €, o supportare multi-currency con tasso di cambio storico per progetti pre-Euro? Probabilmente solo €, ma da decidere.
5. **Anonymous access policy.** Il progetto ha già abilitato accesso anonimo a alcuni progetti seed (cfr. commit recenti). LCC con dati sensibili (costi di mercato confidenziali) può essere problematico. Definire policy granulare.
6. **Validation cases.** Quali 4-6 reference cases pubblici scegliere per il test set? Proposta: 2 case study CRAVEzero, 2 da Pernetti et al. 2021, 2 ricostruiti via NIST BLCC. Confermare.
7. **Audience prioritaria nei primi 6 mesi.** Progettisti, ricercatori, decisori PA, developer. Le viste sono tutte progettate ma le priorità di polish possono cambiare la roadmap. Decidere ordine di priorità.
8. **Stack uncertainty layer.** Implementare server-side (Node worker pool, Python child process) o client-side (Web Workers)? Trade-off su scalabilità multi-tenant vs latency.
9. **EPD database integration.** ÖKOBAUDAT è il più ricco, INIES è il più italiano-vicino, EPD International è generico. Scegliere uno o supportare adapter multipli.

---

# Bibliografia

Citazioni in stile breve `(Autore, Anno)` nel testo; lista alfabetica completa di seguito. Versione di ciascuna fonte indicata nel front matter del documento.

- Abramson B., et al. (2005). *Service Life and Maintenance Cost Database for Common Building HVAC Equipment*. ASHRAE Research Project TRP-1237. ASHRAE.
- Almeida M., Ferreira M. (2018). Cost effective energy and carbon emissions optimization in building renovation (IEA EBC Annex 56). *Energy and Buildings*.
- Arrow K. J., Cropper M. L., Gollier C., Groom B., Heal G. M., Newell R. G., Nordhaus W. D., Pindyck R. S., Pizer W. A., Portney P. R., Sterner T., Tol R. S. J., Weitzman M. L. (2014). Should Governments Use a Declining Discount Rate in Project Analysis? *Review of Environmental Economics and Policy* 8(2), 145-163.
- Becchio C., Corgnati S. P., Kindinis A., Pagliolico S. (2017). Improving environmental sustainability of concrete products: Investigation on MWC thermal and mechanical properties. *Energy and Buildings* 133, 727-738.
- Becchio C., Corgnati S. P., Vio M., Crespi G., Prendin L., Magagnini M. (2018). Toward NZEB by optimizing HVAC system configuration in different climates. *Energy Procedia* 140, 9-19.
- Bertoldi P., Boza-Kiss B., Castellazzi L., D'Agostino D., Maduta C., Paci D., Ribeiro Serrenho T., Zangheri P. (2020). *Energy Performance of Buildings, Reaching the Climate-Neutrality Goal*. Joint Research Centre.
- BPIE (2015). *Implementing the Cost-Optimal Methodology in EU Countries*. Buildings Performance Institute Europe. https://bpie.eu/wp-content/uploads/2015/10/Implementing_Cost_Optimality.pdf
- Card S. K., Mackinlay J. D., Shneiderman B. (1999). *Readings in Information Visualization: Using Vision to Think*. Morgan Kaufmann.
- CEN (2011). *EN 15978:2011 Sustainability of construction works - Assessment of environmental performance of buildings - Calculation method*. European Committee for Standardization.
- CEN (2015). *EN 16627:2015 Sustainability of construction works - Assessment of economic performance of buildings - Calculation methods*. European Committee for Standardization.
- CEN (2017). *EN 15459-1:2017 Energy performance of buildings - Economic evaluation procedure for energy systems in buildings - Part 1: Calculation procedures, Module M1-14*. European Committee for Standardization.
- CEN (2017). *CEN/TR 15459-2:2017 Energy performance of buildings - Economic evaluation procedure for energy systems in buildings - Part 2: Explanation and justification of EN 15459-1*. European Committee for Standardization.
- CEN (2021). *EN 15643:2021 Sustainability of construction works - Framework for assessment of buildings and civil engineering works*. European Committee for Standardization.
- CRAVEzero Consortium (2020). *D7.2 Prototypical implementation*. H2020 project deliverable. https://www.cravezero.eu/wp-content/uploads/2020/05/CRAVEzero_D72_Prototypical%20Implementation.pdf
- Dodd N., Donatello S., Garbarino E., Gama-Caldas M. (2017-2021). *Level(s), a common EU framework of core sustainability indicators*. Joint Research Centre, Publication versions 1.0 and 1.1. https://susproc.jrc.ec.europa.eu/product-bureau/sites/default/files/2021-01/UM3_Indicator_6.1_v1.1_21pp.pdf
- D'Agostino D., Parker D. S. (2018). A framework for the cost-optimal design of nearly zero energy buildings (NZEBs) in representative climates across Europe. *Energy* 149, 814-829.
- Enerdata (2025). *Carbon price forecast under the EU ETS*. Executive Briefing. https://www.enerdata.net/publications/executive-briefing/carbon-price-forecast-under-eu-ets.pdf
- European Commission (2014). *Guide to Cost-Benefit Analysis of Investment Projects, Economic appraisal tool for Cohesion Policy 2014-2020*. DG REGIO. Publications Office of the EU. https://op.europa.eu/en/publication-detail/-/publication/120c6fcc-3841-4596-9256-4fd709c49ae4
- European Commission (2012). *Commission Delegated Regulation (EU) No 244/2012*. Historical cost-optimal baseline, repealed from 2026-01-01. EUR-Lex. https://eur-lex.europa.eu/eli/reg_del/2012/244/oj/eng
- European Commission (2025). *Commission Delegated Regulation (EU) 2025/2273 establishing the comparative methodology framework for calculating cost-optimal levels of minimum energy performance requirements for buildings and building elements*. EUR-Lex. https://eur-lex.europa.eu/eli/reg_del/2025/2273/oj/eng
- European Parliament and Council (2024). *Directive (EU) 2024/1275 on the energy performance of buildings (recast)*. EUR-Lex. https://eur-lex.europa.eu/eli/dir/2024/1275/oj/eng
- Few S. (2013). *Information Dashboard Design: Displaying Data for At-a-Glance Monitoring*. Analytics Press.
- Gollier C. (2002). Discounting an uncertain future. *Journal of Public Economics* 85(2), 149-166.
- Hamdy M., Hasan A., Sirén K. (2013). A multi-stage optimization method for cost-optimal and nearly-zero-energy building solutions in line with the EPBD-recast 2010. *Energy and Buildings* 56, 189-203.
- Hermelink A., Grözinger J. (2010). *Economic evaluation of energy savings*. Ecofys for European Commission.
- Hopfe C. J., Hensen J. L. M. (2011). Uncertainty analysis in building performance simulation for design support. *Building and Environment* 46(10), 2104-2113.
- IEA (2025). *World Energy Outlook 2025*. International Energy Agency. https://www.iea.org/reports/world-energy-outlook-2025
- ISO (2017). *ISO 15686-5:2017 Buildings and constructed assets - Service life planning - Part 5: Life-cycle costing*. International Organization for Standardization. https://www.iso.org/standard/61148.html
- Islam H., Jollands M., Setunge S. (2015). Life cycle assessment and life cycle cost implication of residential buildings, a review. *Renewable and Sustainable Energy Reviews* 42, 129-140.
- Knaflic C. N. (2015). *Storytelling with Data: A Data Visualization Guide for Business Professionals*. Wiley.
- Manfren M., Aste N., Moshksar R. (2013). Calibration and uncertainty analysis for computer models, a meta-model based approach for integrated building energy simulation. *Applied Energy* 103, 627-641.
- Munzner T. (2014). *Visualization Analysis and Design*. CRC Press.
- NIST/FEMP (current). *Handbook 135 material, Annual Supplement, and BLCC web tool*. Verify edition/DOI when cited; public Handbook PDF often resolves to HB 135-2020. https://www.energy.gov/femp/building-life-cycle-cost-programs
- NIST (2024). *Energy Price Indices and Discount Factors for Life-Cycle Cost Analysis (Annual Supplement)*. https://nvlpubs.nist.gov/nistpubs/ir/2024/NIST.IR.85-3273-39.pdf
- Pernetti R., Garzia F., Filippi Oberegger U. (2021). Sensitivity analysis as support for reliable life cycle cost evaluation applied to eleven nearly zero-energy buildings in Europe. *Sustainable Cities and Society* 74, 103139.
- Saltelli A., Annoni P., Azzini I., Campolongo F., Ratto M., Tarantola S. (2010). Variance based sensitivity analysis of model output, Design and estimator for the total sensitivity index. *Computer Physics Communications* 181(2), 259-270.
- Schwartz Y., Raslan R., Mumovic D. (2018). The life cycle carbon footprint of refurbished and new buildings, A systematic review of case studies. *Renewable and Sustainable Energy Reviews* 81, 231-241.
- Tian W. (2013). A review of sensitivity analysis methods in building energy analysis. *Renewable and Sustainable Energy Reviews* 20, 411-419.
- Tufte E. (2001). *The Visual Display of Quantitative Information*, 2nd ed. Graphics Press.
- W3C (2023). *Web Content Accessibility Guidelines (WCAG) 2.2*. https://www.w3.org/TR/WCAG22/
- Weitzman M. L. (2001). Gamma Discounting. *American Economic Review* 91(1), 260-271.

---

# Appendice. Snippet di pattern di calcolo

I frammenti sono illustrativi e non sono completi. Sono in TypeScript (engine di runtime) e Python (script di analisi statistica e validazione), coerenti con lo stack del progetto.

## Discounting kernel (TypeScript)

```ts
export type CashFlow = { year: number; amount: number };

export function presentValue(
  cashFlows: CashFlow[],
  discountRate: number,
  baseYear = 0,
): number {
  return cashFlows.reduce((acc, cf) => {
    const dt = cf.year - baseYear;
    return acc + cf.amount / Math.pow(1 + discountRate, dt);
  }, 0);
}

export function globalCost(
  initialInvestment: number,
  annualCosts: CashFlow[],
  finalValue: number,
  endYear: number,
  discountRate: number,
): number {
  const pvCosts = presentValue(annualCosts, discountRate);
  const pvFinalValue = finalValue / Math.pow(1 + discountRate, endYear);
  return initialInvestment + pvCosts - pvFinalValue;
}
```

## Residual value pro-rata (EN 15459-1)

```ts
export function residualValueLinear(
  replacementCost: number,
  serviceLife: number,
  yearsLeftAtEnd: number,
): number {
  if (yearsLeftAtEnd <= 0) return 0;
  return (replacementCost * yearsLeftAtEnd) / serviceLife;
}
```

## Replacement calendar (deterministico)

```ts
export function replacementYears(
  serviceLife: number,
  horizon: number,
): number[] {
  const years: number[] = [];
  let t = serviceLife;
  while (t <= horizon) {
    years.push(t);
    t += serviceLife;
  }
  return years;
}
```

## Weibull service life sample (Python, validation)

```python
import numpy as np
def sample_replacement_years(eta: float, beta: float, horizon: int, n_components: int, rng):
    lifetimes = rng.weibull(beta, size=n_components) * eta
    return np.minimum(lifetimes, horizon)
```

## Sobol Si and STi estimation (Python, validation)

```python
import numpy as np
from SALib.sample import saltelli
from SALib.analyze import sobol

def sobol_indices(problem, model_fn, N=1024, seed=42):
    rng = np.random.default_rng(seed)
    X = saltelli.sample(problem, N, calc_second_order=False)
    Y = np.array([model_fn(row) for row in X])
    Si = sobol.analyze(problem, Y, calc_second_order=False)
    return Si  # contains 'S1', 'ST', and 'S1_conf', 'ST_conf'
```

## Cost-Optimal frontier identification

```ts
export function paretoCostOptimal(
  variants: { id: string; ped: number; cg: number }[],
): string[] {
  const sorted = [...variants].sort((a, b) => a.ped - b.ped);
  const frontier: string[] = [];
  let bestCg = Infinity;
  for (const v of sorted) {
    if (v.cg < bestCg) {
      frontier.push(v.id);
      bestCg = v.cg;
    }
  }
  return frontier;
}
```

---

# Stima oraria di implementazione

Sigle: S = 1-8 ore, M = 8-32 ore, L = 32-120 ore, XL = oltre 120 ore. Le stime sono dev-hours nette per uno sviluppatore senior che conosca lo stack del progetto (Next.js 15, tRPC, Prisma 7, Recharts). Non includono review, test, code review, deploy.

| Raccomandazione | Area | Effort | Note |
|---|---|---|---|
| Time skeleton parametrico (30/40/50/60) | A.3 A | S | Parametro + multi-run wrapper |
| Real-vs-nominal mode | A.3 A | S | Branch nel discount kernel |
| Cash-flow convention end-of-year (uniforme) | A.3 A | S | Già il default di Excel |
| Replacement deterministic calendar refactor | A.3 A | M | Sostituire VLOOKUP; aggregazione esplicita |
| Replacement probabilistic Weibull | A.3 A | M | Distribuzione + sampler integrato MC |
| Residual value pro-rata EN 15459-1 | A.3 B | S | Funzione pura, validata su worked example |
| Single source of truth tassi (DB) | A.3 C | M | Modello Prisma + UI per editing |
| Dual rate (financial + social) | A.3 C | M | Wiring + branching nei calcoli |
| Declining DR opzionale | A.3 C | M | Schedule UK Green Book + flag |
| Energy escalation scenario set (CPS/STEPS/APS) | A.3 D | M | Dati seed + selettore |
| Carrier-specific inflation differential | A.3 D | M | Refactor escalation per carrier |
| Carbon shadow price overlay | A.3 D, G | M | Layer macro separato |
| Storage degradation modeling | A.3 D | M | Cycle counting + cap fade |
| Maintenance per category default | A.3 E | S | Tabella seed |
| Maintenance activity-based opzionale | A.3 E | L | Database ASHRAE/BCIS import |
| Morris screening | A.3 F | M | Implementazione + UI |
| Sobol Si/STi engine | A.3 F | L | Worker pool, sample size tuning |
| Monte Carlo + LHS (N=5000) per KPI distribution | A.3 F | M | Worker pool, output stocastico |
| Carbon module (EN 15978 + EN 16627 coupled) | A.3 G | L | EPD database adapter |
| Reproducibility hash + method versioning | A.3 J | S | Util + metadata |
| API JSON Schema + tRPC v11 binding | A.3 J | M | Validation con zod |
| Benchmark validation suite (4-6 cases) | A.4 | M | Test data + fixtures |
| Cross-tool validation NIST BLCC | A.4 | M | Casi compatibili, doc differenze |
| Cost-Optimal scatter (B.3.1) | B.3 | S | Recharts + frontier line custom |
| KPI cards (B.3.2) | B.3 | S | shadcn/ui Card |
| LCC Treemap (B.3.3) | B.3 | M | ECharts integration |
| Waterfall (B.3.4) | B.3 | M | ECharts o custom Recharts |
| Cumulative cash-flow + fan band (B.3.5) | B.3 | M | Recharts + Area band overlay |
| Stacked area time (B.3.6) | B.3 | S | Recharts |
| Sankey costi (B.3.7) e energia (B.3.8) | B.3 | M | ECharts + node-link spec |
| Tornado (B.3.9) | B.3 | S | Recharts horizontal |
| Sobol Si/STi viz (B.3.10) | B.3 | M | Recharts grouped + optional heatmap |
| Distribution PDF/CDF (B.3.11) | B.3 | M | Plotly violin/density |
| Box/violin scenario (B.3.12) | B.3 | S | Plotly |
| Small multiples multi-variante (B.3.13) | B.3 | M | Grid layout + componenti riusabili |
| Difference bar (B.3.14) | B.3 | S | Recharts |
| Parallel coordinates (B.3.15) | B.3 | M | Plotly |
| Radar (B.3.16) | B.3 | S | Recharts |
| Step-line sostituzioni (B.3.17) | B.3 | S | Recharts |
| Pareto multi-variante (B.3.18) | B.3 | M | Recharts + frontier |
| MAC curve (B.3.19) | B.3 | M | D3/Visx custom |
| Tabella sortable con sparkline (B.3.20) | B.3 | M | tanstack-table + Recharts |
| Decision dashboard layout | B.4 | M | shadcn/ui grid + responsive |
| Analyst dashboard layout | B.4 | M | Same pattern |
| Compare dashboard layout | B.4 | M | Same pattern |
| PDF/A report generator | B.5 | L | Puppeteer / react-pdf + i18n |
| JSON export schema | B.6 | S | Solo serialization |
| CSV multi-series export | B.6 | S | Util |
| Excel "compatibility" export | B.6 | M | ExcelJS template |
| Palette + theme system | B.7 | M | Tokens + Tailwind v4 config |
| Dark mode chart adaptation | B.7 | M | Color tokens propagation |
| Accessibility WCAG 2.2 audit | B.7 | M | Manual + axe / lighthouse |
| Italian / English / German i18n | B.5, B.7 | M | next-intl + traduzioni |

Totale aggregato indicativo: 30-45 voci, con composizione tipica ~10 S, ~25 M, ~6 L. Effort totale per coprire l'intera proposta: circa 800-1500 dev-hours (4-9 mesi-uomo senior). Una roadmap prioritaria realistica per MVP: tutte le S e le M del cost engine, uncertainty layer base, 8-10 grafici core (KPI cards, Cost-Optimal, Treemap, Waterfall, Cumulative, Tornado, Stacked area, Difference bar), PDF report base, palette accessibile. Stima MVP: 250-400 dev-hours.
