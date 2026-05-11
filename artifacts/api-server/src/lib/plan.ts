export type Plan = "FREE" | "CREATOR_PRO" | "ARTIST_PRO";

export const PLAN_FEATURES = {
  FREE: {
    models: ["chirp-v4-5"],
    beatDNA: false,
    sectionIdentity: false,
    vocalIdentity: false,
  },

  CREATOR_PRO: {
    models: ["chirp-v4-5", "chirp-v5"],
    beatDNA: true,
    sectionIdentity: true,
    vocalIdentity: true,
  },

  ARTIST_PRO: {
    models: ["chirp-v4-0", "chirp-v4-5", "chirp-v4-5-plus", "chirp-v5"],
    beatDNA: true,
    sectionIdentity: true,
    vocalIdentity: true,
  },
};