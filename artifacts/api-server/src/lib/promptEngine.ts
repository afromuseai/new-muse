import { Plan } from "./plans";
import { canUseFeature } from "./planGuard";

type PromptInput = {
  prompt: string;
  beatDNA?: string;
  sectionIdentity?: string;
  vocalIdentity?: string;
};

export function buildPrompt(input: PromptInput, plan: Plan) {
  let finalPrompt = input.prompt;

  // 🥁 BEAT DNA
  if (input.beatDNA && canUseFeature(plan, "beatDNA")) {
    finalPrompt += `\n[Beat DNA]: ${input.beatDNA}`;
  }

  // 🧱 SECTION IDENTITY
  if (input.sectionIdentity && canUseFeature(plan, "sectionIdentity")) {
    finalPrompt += `\n[Section Identity]: ${input.sectionIdentity}`;
  }

  // 🎤 VOCAL IDENTITY
  if (input.vocalIdentity && canUseFeature(plan, "vocalIdentity")) {
    finalPrompt += `\n[Vocal Identity]: ${input.vocalIdentity}`;
  }

  return finalPrompt;
}