// Claude Sonnet 4.6 (via Anthropic API) shapes a Catholic artist's
// vocation profile from their ten questionnaire answers. Replaces the
// earlier Workers AI / Llama path — Sonnet handles register and
// thinness-detection better. Falls back to a clear error if the
// ANTHROPIC_API_KEY secret is unset.

import type { Env } from '../types';

export interface QuestionnaireResponses {
  q1_first_call: string | null;
  q2_lineage: string | null;
  q3_canon: string | null;
  q4_patron_saints: string | null;
  q5_rhythm: string | null;
  q6_materials: string | null;
  q7_for_parish: string | null;
  q8_for_home: string | null;
  q9_the_cost: string | null;
  q10_the_prayer: string | null;
}

export interface ExpansionNudge {
  field: keyof QuestionnaireResponses;
  nudge: string;
}

export interface Synthesis {
  mission_statement: string;
  studio_rhythm: string;
  process_note: string;
  needs_expansion: ExpansionNudge[];
}

const MODEL = 'claude-sonnet-4-6';

const SYSTEM_PROMPT = `You are a quiet editor for a Catholic artist's vocation profile. The artist has answered ten short questions about their call, lineage, materials, rhythm, and prayer. Your job has two parts.

PART 1 — Synthesize three short text fields:
1. mission_statement (≤ 25 words, FIRST PERSON): a single sentence capturing how the artist describes their calling. Use their exact phrasing where you can.
2. studio_rhythm (≤ 120 words, THIRD PERSON): 2–3 sentences describing how the artist actually works — Liturgy of the Hours, particular fasts, light, materials, music, silence. Only what they said.
3. process_note (≤ 200 words, THIRD PERSON): 2–3 paragraphs describing their formation, tradition, and what they make for the parish and for the household.

You MAY improve the rhythm and register of their prose — em-dashes, careful punctuation, modest structural lifts. You MAY NOT add factual details they did not provide.

PART 2 — Flag thin answers (needs_expansion):
For each of the ten questions where the artist's answer is too thin to write a worthy profile from — generic ("I went to art school"), unspecific ("religious paintings"), or perfunctory ("I hope they like it") — emit a brief, warm nudge encouraging them to write more. Use the second person, addressed to the artist. Keep each nudge to 1–2 sentences. Omit any field that is already rich.

CRITICAL RULES:
- Do NOT invent facts. No saints they didn't name, no schools they didn't attend, no atmospheric details they didn't describe.
- Do NOT use marketing language ("renowned", "passionate", "deeply meaningful", "beloved").
- Write in a calm, classical register — the prose of a parish monograph, not a tech blog.
- If a field has too little material to write truthfully, emit an empty string for that field and a nudge for the questions it would have drawn from.
- Output ONLY a JSON object with these four keys: mission_statement, studio_rhythm, process_note, needs_expansion. No preamble. No code fences. No trailing commentary.

needs_expansion shape: array of objects, each { "field": "<one of q1_first_call, q2_lineage, q3_canon, q4_patron_saints, q5_rhythm, q6_materials, q7_for_parish, q8_for_home, q9_the_cost, q10_the_prayer>", "nudge": "..." }.`;

function userPrompt(r: QuestionnaireResponses): string {
  const lines: string[] = [];
  const add = (label: string, v: string | null) => {
    lines.push(`${label}\n${(v ?? '').trim() || '[no answer]'}`);
  };
  add('q1 — The first work that called them:', r.q1_first_call);
  add('q2 — Who taught them; where they trained:', r.q2_lineage);
  add('q3 — The tradition they work in:', r.q3_canon);
  add('q4 — Patron saints who accompany the work:', r.q4_patron_saints);
  add('q5 — The rhythm of their day:', r.q5_rhythm);
  add('q6 — Their materials:', r.q6_materials);
  add('q7 — What they make for the parish:', r.q7_for_parish);
  add('q8 — What they make for the home:', r.q8_for_home);
  add('q9 — The discipline that hurts most:', r.q9_the_cost);
  add('q10 — The prayer they offer over the delivered work:', r.q10_the_prayer);
  return lines.join('\n\n');
}

function extractJson(text: string): unknown {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('no JSON object in model output');
  return JSON.parse(text.slice(start, end + 1));
}

interface AnthropicResponse {
  content?: Array<{ type: string; text?: string }>;
  error?: { message?: string };
}

function isValidField(s: string): s is ExpansionNudge['field'] {
  return [
    'q1_first_call', 'q2_lineage', 'q3_canon', 'q4_patron_saints',
    'q5_rhythm', 'q6_materials', 'q7_for_parish', 'q8_for_home',
    'q9_the_cost', 'q10_the_prayer',
  ].includes(s);
}

export async function synthesizeVocation(
  env: Env,
  responses: QuestionnaireResponses,
): Promise<Synthesis> {
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error(
      'ANTHROPIC_API_KEY not set — the synthesizer is offline. ' +
      'Operator: set it with `wrangler secret put ANTHROPIC_API_KEY`.',
    );
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt(responses) }],
    }),
  });

  const data = (await res.json()) as AnthropicResponse;
  if (!res.ok) {
    throw new Error(
      `Anthropic API ${res.status}: ${data.error?.message ?? res.statusText}`,
    );
  }

  const text = data.content?.find((b) => b.type === 'text')?.text ?? '';
  if (!text) throw new Error('empty model response');

  const parsed = extractJson(text) as Partial<Synthesis> & { needs_expansion?: unknown };
  const nudges: ExpansionNudge[] = Array.isArray(parsed.needs_expansion)
    ? (parsed.needs_expansion as Array<{ field?: string; nudge?: string }>)
        .filter((n) => n.field && n.nudge && isValidField(n.field))
        .map((n) => ({ field: n.field as ExpansionNudge['field'], nudge: String(n.nudge) }))
    : [];

  return {
    mission_statement: String(parsed.mission_statement ?? '').trim(),
    studio_rhythm: String(parsed.studio_rhythm ?? '').trim(),
    process_note: String(parsed.process_note ?? '').trim(),
    needs_expansion: nudges,
  };
}
