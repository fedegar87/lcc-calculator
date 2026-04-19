/**
 * Citation data for LCCzero.
 *
 * Two-layer model (matching the sibling academic-tool pattern):
 *   - description = plain-English explanation of HOW the work feeds the tool
 *   - fullCitation = formal bibliographic record (APA-ish)
 *
 * Citations are grouped by topic cluster; each cluster is rendered by a
 * domain-tinted ReferenceModal next to the panel that uses those models.
 */

export interface Citation {
  id: string;
  title: string;
  authors: string;
  year: string;
  publication: string;
  description: string;
  link?: string;
  fullCitation?: string;
}

/** Foundational paper behind the tool (CRAVEzero sensitivity analysis). */
export const FOUNDATIONAL_CITATIONS: Citation[] = [
  {
    id: "pernetti-2021-scs",
    title:
      "Sensitivity analysis as support for reliable life cycle cost evaluation applied to eleven nearly zero-energy buildings in Europe",
    authors: "Pernetti R., Garzia F., Filippi Oberegger U.",
    year: "2021",
    publication: "Sustainable Cities and Society 74, 103139",
    description:
      "Foundational paper behind LCCzero. Applies DSA + EE sensitivity analysis to 11 nZEB case studies and identifies the four parameters that dominate LCC: interest rate, structural-element cost, construction maintenance cost, HVAC maintenance cost.",
    link: "https://doi.org/10.1016/j.scs.2021.103139",
    fullCitation:
      "Pernetti, R., Garzia, F., & Filippi Oberegger, U. (2021). Sensitivity analysis as support for reliable life cycle cost evaluation applied to eleven nearly zero-energy buildings in Europe. Sustainable Cities and Society, 74, 103139. https://doi.org/10.1016/j.scs.2021.103139",
  },
  {
    id: "pernetti-2019-spreadsheet",
    title:
      "Towards the definition of a nZEB cost spreadsheet as a support tool for the design",
    authors: "Pernetti R., Garzia F., Paoletti G., Weiss T.",
    year: "2019",
    publication: "IOP Conference Series, CRAVEzero output",
    description:
      "Direct precursor of LCCzero. Defines the Excel-based LCC spreadsheet (`200512_LCC_tool_beta_v2.xlsm`) that this web app productises.",
  },
  {
    id: "weiss-2019-cravezero",
    title:
      "Life cycle cost reduction and market acceleration for new nearly zero-energy buildings",
    authors:
      "Weiß T., Pernetti R., Garzia F., Köhler B., Stobbe M., Meier K., Berggren B.",
    year: "2019",
    publication: "IOP Conference Series, CRAVEzero output",
    description:
      "Frames the CRAVEzero programme: extra costs of nZEBs, processes, technologies and business models that informed the data collection behind the tool.",
  },
  {
    id: "cravezero-d22",
    title:
      "D2.2 — nZEB Life Cycle Costs: Spreadsheet with LCCs (case-study analysis)",
    authors: "CRAVEzero consortium",
    year: "2018",
    publication: "H2020 deliverable, GA 741223",
    description:
      "Case-study LCC benchmarks for the 13 frontrunner nZEBs. Source of the 60% investment / 40% operation / ~15% energy split surfaced on the landing page.",
    link: "https://www.cravezero.eu/wp-content/uploads/2018/09/CRAVEzero_D22_Spreadsheet-with-LCCs.pdf",
  },
  {
    id: "cravezero-d72",
    title: "D7.2 — Prototypical Implementation (CRAVEzero Pinboard)",
    authors: "CRAVEzero consortium",
    year: "2020",
    publication: "H2020 deliverable, GA 741223",
    description:
      "Reference implementation of the Pinboard tools that LCCzero builds upon — including the LCC tool layout and the 8-step methodology UX.",
    link: "https://www.cravezero.eu/wp-content/uploads/2020/05/CRAVEzero_D72_Prototypical%20Implementation.pdf",
  },
];

/** Methodology — ISO 15686-5 + EN 15459 + Morris/Campolongo sensitivity. */
export const METHODOLOGY_CITATIONS: Citation[] = [
  {
    id: "iso-15686-5",
    title: "Buildings and constructed assets — Service life planning — Part 5: Life-cycle costing",
    authors: "ISO/TC 59/SC 14",
    year: "2017",
    publication: "ISO 15686-5:2017",
    description:
      "International standard implemented by the LCCzero engine: Net Present Value over the analysis period as the discounted sum of cost streams.",
    link: "https://www.iso.org/standard/61148.html",
  },
  {
    id: "en-15459-1",
    title:
      "Energy performance of buildings — Economic evaluation procedure for energy systems in buildings — Part 1",
    authors: "CEN/TC 89",
    year: "2017",
    publication: "EN 15459-1:2017",
    description:
      "Source of the maintenance-cost factors (yearly % of investment) and component lifespans used by LCCzero for envelope and HVAC components.",
    link: "https://www.en-standard.eu/csn-en-15459-1-energy-performance-of-buildings-economic-evaluation-procedure-for-energy-systems-in-buildings-part-1-calculation-procedure-module-m1-14/",
  },
  {
    id: "ceec-2004",
    title: "Code of Measurement for Cost Planning",
    authors: "European Committee of Construction Economists (CEEC)",
    year: "2004",
    publication: "CEEC publication",
    description:
      "EU-harmonised cost-element breakdown adopted by the tool to structure construction costs (envelope, services, site works).",
  },
  {
    id: "morris-1991",
    title: "Factorial sampling plans for preliminary computational experiments",
    authors: "Morris M. D.",
    year: "1991",
    publication: "Technometrics 33(2), 161–174",
    description:
      "Original Elementary Effects (EE) global sensitivity method used in the foundational paper to rank input importance under varying baselines.",
  },
  {
    id: "campolongo-2007",
    title: "An effective screening design for sensitivity analysis of large models",
    authors: "Campolongo F., Cariboni J., Saltelli A.",
    year: "2007",
    publication: "Environmental Modelling & Software 22(10), 1509–1518",
    description:
      "Trajectory-spread improvement on Morris's EE method — the variant actually applied in Pernetti et al. 2021.",
  },
];

/** Boundary conditions: interest rate, prices, inflation. */
export const BOUNDARY_CITATIONS: Citation[] = [
  {
    id: "fred-eurodiscount",
    title: "Interest Rates, Discount Rate for Euro Area",
    authors: "Federal Reserve Bank of St. Louis (FRED)",
    year: "2018",
    publication: "FRED Economic Data",
    description:
      "Source of the 1.51% baseline real interest rate (Euro-area average 2009–2016) used in the foundational paper and as default in LCCzero.",
    link: "https://fred.stlouisfed.org/series/INTDSREZQ193N",
  },
  {
    id: "eurostat-electricity",
    title: "Electricity prices for households in the European Union",
    authors: "Eurostat",
    year: "2018",
    publication: "Eurostat statistics",
    description:
      "Reference electricity prices and inflation ranges for the case-study countries; bounds the variation ranges used in EE sensitivity.",
    link: "https://ec.europa.eu/eurostat/web/energy/data/database",
  },
  {
    id: "copiello-2017",
    title:
      "Evaluation of energy retrofit in buildings under conditions of uncertainty: The prominence of the discount rate",
    authors: "Copiello S., Gabrielli L., Bonifaci P.",
    year: "2017",
    publication: "Energy 137, 104–117",
    description:
      "Shows that the discount/interest rate explains 60–68% of LCC variance in retrofit decisions — corroborates LCCzero's prominence of `fin` parameters.",
  },
  {
    id: "di-giuseppe-2017",
    title:
      "Probabilistic life cycle costing of existing buildings retrofit interventions towards nZE target",
    authors: "Di Giuseppe E., Iannaccone M., Telloni M., D'Orazio M., Di Perna C.",
    year: "2017",
    publication: "Energy and Buildings 144, 416–432",
    description:
      "Closest methodological precedent — also couples LCC with Monte Carlo sensitivity analysis on a single building.",
  },
];

/** Energy modelling and PHPP. */
export const ENERGY_CITATIONS: Citation[] = [
  {
    id: "phpp-2012",
    title: "Passive House Planning Package (PHPP)",
    authors: "Feist W., Pfluger R., Schnieders J., Kah O., Kaufmann B., Krick B.",
    year: "2012",
    publication: "Passive House Institute, Darmstadt",
    description:
      "Software used to compute final energy demand (heating, cooling, DHW, auxiliaries, household) for the 11 case studies; default consumption profiles in LCCzero follow PHPP outputs.",
    link: "https://passivehouse.com/04_phpp/04_phpp.htm",
  },
  {
    id: "epbd-2010",
    title: "Energy Performance of Buildings Directive (recast)",
    authors: "European Parliament and Council",
    year: "2010",
    publication: "Directive 2010/31/EU",
    description:
      "Regulatory driver for the nZEB target: from 2021 all new EU buildings must be nearly zero-energy. Anchors the LCCzero use case.",
    link: "https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=CELEX%3A32010L0031",
  },
];

/** Residual value and end-of-life. */
export const RESIDUAL_CITATIONS: Citation[] = [
  {
    id: "vazquez-lopez-2020",
    title:
      "Assessment model of end-of-life costs and waste quantification in selective demolitions: Case studies of nearly zero-energy buildings",
    authors:
      "Vázquez-López E., Garzia F., Pernetti R., Solís-Guzmán J., Marrero M.",
    year: "2020",
    publication: "Sustainability 12, 6255",
    description:
      "Method for estimating end-of-life costs and waste in nZEB demolitions. LCCzero excludes EoL by default (data gaps across EU) but exposes hooks for this method.",
    link: "https://doi.org/10.3390/su12156255",
  },
  {
    id: "berggren-2018",
    title:
      "LCC analysis of a Swedish Net Zero Energy Building – including co-benefits",
    authors: "Berggren B., Wall M., Weiss T., Garzia F., Pernetti R.",
    year: "2018",
    publication: "Conference proceedings",
    description:
      "Co-benefits framing for LCC of net-zero buildings — informs the income/NPV layer in LCCzero (a method improvement over the original Excel).",
  },
];

/** Convenience: every citation, indexed by id. */
export const ALL_CITATIONS: Record<string, Citation> = Object.fromEntries(
  [
    ...FOUNDATIONAL_CITATIONS,
    ...METHODOLOGY_CITATIONS,
    ...BOUNDARY_CITATIONS,
    ...ENERGY_CITATIONS,
    ...RESIDUAL_CITATIONS,
  ].map((c) => [c.id, c]),
);
