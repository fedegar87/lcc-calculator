export const DEMO_USER = {
  name: "Demo User",
  email: "demo@lcczero.dev",
  password: "demo123",
};

export const PROJECT_META = {
  name: "CRAVEzero Reference Building",
  buildingUse: "RESIDENTIAL_MULTI" as const,
  country: "Austria",
  city: "Innsbruck",
  constructionYear: 2020,
};

export const BOUNDARY_CONDITIONS = {
  referencePeriod: 40,
  interestRate: 0.0151,
  inflationRate: 0.0056,
  energyPrices: [
    { index: 3, name: "Natural Gas", pricePerKwh: 0.065, annualIncrease: 0.02 },
    {
      index: 12,
      name: "National Electricity-Mix",
      pricePerKwh: 0.22,
      annualIncrease: 0.025,
    },
    {
      index: 13,
      name: "Electricity from Photovoltaics",
      pricePerKwh: 0.12,
      annualIncrease: 0.015,
    },
  ],
};
