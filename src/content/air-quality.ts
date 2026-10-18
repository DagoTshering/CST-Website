/**
 * The "Live Campus Air & Climate Data" page (/air-quality): the public AirGradient dashboard for
 * the air-quality monitor on the CST campus, embedded as it is (no token, no proxy). Change the
 * dashboard here; nothing else refers to its address.
 */
export const airQuality = {
  /** The dashboard's public display page. */
  dashboardUrl: "https://app.airgradient.com/display/dz1BeeNqxG/charts",
  /** The embedded frame's accessible name. */
  frameTitle: "CST campus air quality dashboard, provided by AirGradient",
  intro: "Real-time air quality and climate readings from the monitor installed on the CST campus.",
} as const;
