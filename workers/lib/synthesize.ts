// Workers AI: synthesize a vocation questionnaire into a public
// artist profile. Uses Llama 3.1 8B Instruct (free on the Workers AI
// platform). The model is instructed to never invent — it must
// prefer the artist's exact phrasing, omit what they didn't say,
// and write nothing speculative.

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

export interface Synthesis {
  mission_statement: string;  // ≤ 25 words, first person
  studio_rhythm: string;      // ≤ 120 words, third person
  process_note: string;       // ≤ 200 words, third person
}

const SYSTEM_PROMPT = `You are a quiet, careful editor for an artist
profile. The artist has answered ten short questions about their
vocation, lineage, materials, rhythm, and prayer. Your job is to
shape these into three short text fields, NOTHING MORE:

1. mission_statement: a single sentence ≤ 25 words, FIRST PERSON,
   capturing how the artist describes their calling. Use their
   exact phrasing where you can.
2. studio_rhythm: 2-3 sentences ≤ 120 words, THIRD PERSON,
   describing how the artist actually works — Liturgy of the Hours,
   particular fasts, light, materials, music, silence. Only what
   they said.
3. process_note: 2-3 paragraphs ≤ 200 words, THIRD PERSON,
   describing their formation, tradition, and what they make. Pull
   from lineage, canon, patron saints, parish work, household work.

CRITICAL RULES:
- Do NOT invent details the artist did not provide.
- Do NOT use marketing language ("renowned", "passionate", "beautiful").
- Prefer the artist's exact words wherever possible.
- If a question was left empty, omit anything that would have come
  from it; do not guess.
- Write in a calm, classical register — the prose of a parish
  monograph, not a tech blog.
- Output ONLY a JSON object with the three keys, no preamble.

If you cannot write a field truthfully from what the artist said,
emit an empty string for that field.`;

function userPrompt(r: QuestionnaireResponses): string {
  const lines: string[] = [];
  const add = (label: string, v: string | null) => {
    if (v && v.trim()) lines.push(`${label}\n${v.trim()}`);
  };
  add('1. The first work that called them:', r.q1_first_call);
  add('2. Who taught them; where they trained:', r.q2_lineage);
  add('3. The tradition they work in:', r.q3_canon);
  add('4. Patron saints who accompany the work:', r.q4_patron_saints);
  add('5. The rhythm of their day:', r.q5_rhythm);
  add('6. Their materials:', r.q6_materials);
  add('7. What they make for the parish:', r.q7_for_parish);
  add('8. What they make for the home:', r.q8_for_home);
  add('9. The discipline that hurts most:', r.q9_the_cost);
  add('10. The prayer they offer over the delivered work:', r.q10_the_prayer);
  return lines.join('\n\n');
}

function extractJson(text: string): unknown {
  // Llama sometimes wraps JSON in ```json fences or chatty preamble.
  // Find the first { and last }, parse that slice.
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('no JSON object in model output');
  return JSON.parse(text.slice(start, end + 1));
}

function truncWords(s: string, max: number): string {
  const words = s.trim().split(/\s+/);
  if (words.length <= max) return s.trim();
  return words.slice(0, max).join(' ') + '…';
}

export async function synthesizeVocation(
  env: Env,
  responses: QuestionnaireResponses,
): Promise<Synthesis> {
  const result = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt(responses) },
    ],
    temperature: 0.4,
    max_tokens: 800,
  }) as { response?: string };

  if (!result.response) throw new Error('empty model response');
  const parsed = extractJson(result.response) as Partial<Synthesis>;

  return {
    mission_statement: truncWords(parsed.mission_statement?.toString() ?? '', 30),
    studio_rhythm: truncWords(parsed.studio_rhythm?.toString() ?? '', 140),
    process_note: truncWords(parsed.process_note?.toString() ?? '', 230),
  };
}
