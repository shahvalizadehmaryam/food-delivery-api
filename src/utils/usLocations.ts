// Helper for US state codes and cities (used by /auth/register validation)
import { City } from "country-state-city";

const US_COUNTRY_CODE = "US";

// Allowed US state / district codes (50 states + DC)
const US_STATE_CODES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "DC",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
] as const;

/** Returns true if the value is a valid US state code */
const isValidUsState = (stateCode: string): boolean =>
  (US_STATE_CODES as readonly string[]).includes(stateCode.toUpperCase());

/**
 * Returns true if cityName exists in the given US state.
 * Comparison is case-insensitive.
 */
const isValidCityForState = (stateCode: string, cityName: string): boolean => {
  const cities = City.getCitiesOfState(
    US_COUNTRY_CODE,
    stateCode.toUpperCase(),
  );
  const normalized = cityName.trim().toLowerCase();
  return cities.some((c) => c.name.toLowerCase() === normalized);
};

export default {
  US_STATE_CODES,
  isValidUsState,
  isValidCityForState,
};
