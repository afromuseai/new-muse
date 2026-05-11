import { PLAN_FEATURES, Plan } from "./plans";

export function getAllowedModels(plan: Plan) {
  return PLAN_FEATURES[plan].models;
}

export function canUseFeature(
  plan: Plan,
  feature: "beatDNA" | "sectionIdentity" | "vocalIdentity"
) {
  return PLAN_FEATURES[plan][feature];
}