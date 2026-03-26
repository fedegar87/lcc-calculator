// EN 15459 HVAC components and energy sources from audit JSON
// Source: CRAVEzero workbook, extracted in Phase 2

import en15459Data from '../../scripts/output/en15459.json';
import energySourcesData from '../../scripts/output/energy_sources.json';

export interface EN15459Component {
  index: number;
  name: string;
  lifespanMin: number;
  lifespanMax: number;
  lifespanAvg: number;
  maintenancePctMin: number | null;
  maintenancePctMax: number | null;
  maintenancePctAvg: number | null;
}

export const EN15459_COMPONENTS: EN15459Component[] =
  en15459Data.components.map((c) => ({
    index: c.index,
    name: c.name,
    lifespanMin: c.lifespan_min,
    lifespanMax: c.lifespan_max,
    lifespanAvg: c.lifespan_avg,
    maintenancePctMin: c.maintenance_pct_min,
    maintenancePctMax: c.maintenance_pct_max,
    maintenancePctAvg: c.maintenance_pct_avg,
  }));

export interface EnergySource {
  index: number;
  name: string;
  category: string;
}

// Filter out header entry (index 1, is_header: true) -> 18 selectable sources
export const ENERGY_SOURCES: EnergySource[] = energySourcesData.sources
  .filter((s) => !s.is_header)
  .map((s) => ({
    index: s.index,
    name: s.name,
    category: s.category,
  }));

export function getEN15459Component(
  index: number,
): EN15459Component | undefined {
  return EN15459_COMPONENTS.find((c) => c.index === index);
}

export function getEnergySource(index: number): EnergySource | undefined {
  return ENERGY_SOURCES.find((s) => s.index === index);
}
