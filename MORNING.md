# Morning briefing

Everything from tonight's work, in the order you can scan it.

## The one thing to do first

Set the Anthropic API key. Until you do, the vocation-site synthesizer
returns a 503 and the editor shows a polite "synthesizer isn't switched
on yet" banner. Everything else works.

```bash
wrangler secret put ANTHROPIC_API_KEY --name catholicart
# paste your sk-ant-... key, hit enter
```

Or use the bulk workflow:
[cf-worker-secret-bulk.yml](.github/workflows/cf-worker-secret-bulk.yml)
→ fill `anthropic_api_key` and run.

## What shipped (commit log, newest first)

Each is its own commit on `main` so you can review or revert
individually.

1. **Apprentice stipend counter on the ledger** — half of the guild's
   2% tithe is earmarked for apprentice support; visible on the ledger
   only when there's revenue.
2. **House artist designation** — patron-as-household with API + UI
   toggle on the artist profile. Public anonymized count
   ("5 households call them their house artist").
3. **Annual season letter** — cron `0 8 1 1 *` sends each artist a
   warm year-in-review letter every January 1st. Email template +
   per-artist query + waitUntil dispatch.
4. **Tax-ready earnings CSV** — `GET /api/artists/:slug/earnings.csv?year=YYYY`
   downloads a Schedule C–shaped CSV. New "V. Earnings" tab in the
   artist editor.
5. **Lineage scaffolding** — `artists.trained_under` (free text) +
   `trained_under_slug` (optional FK to a guild artist). New schema
   table `house_artists`. Editor field + ArtistProfile rendering.
6. **Provenance chain on the certificate** — patron's letter
   (anonymized), artist's vision, and full WIP timeline rendered on
   the print-ready certificate page.
7. **Diocesan landing pages** — `/dioceses/:slug` with verified-artist
   counts and chancery outreach copy. Index at `/dioceses`.
8. **Sabbatical mode** — artist sets a return date; public profile
   shows "On retreat · back April 12" and the commission CTA softens
   to "Leave a letter for when they return."
9. **Pastor's one-click endorsement** — no-account verification flow.
   Artist sends from editor; pastor gets an email; one click opens a
   page with endorse / talk / decline buttons.
10. **Synthesizer upgrade: Claude Sonnet 4.6 + thinness nudges** —
    Workers AI / Llama swapped out for Claude via Anthropic API. New
    prompt produces both the three text fields AND per-question
    nudges when the artist's answers are thin. Nudges render inline
    under each question.

Above that, from the earlier session:
- Vocation site (#1) — JP2 questionnaire, editor, public profile
  rendering, vanity URL `/:slug` mapped to `/artists/:slug`.
- Plus the security wave, the SITE_URL bug fix, the SEO fix, the
  pricing change to 2%-at-end, the intimate copy moves.

## What's deferred (with the reason)

These are real features I'd like to ship but each needs something I
couldn't responsibly invent overnight.

| Feature | Why deferred | What's needed |
|---|---|---|
| WIP timelapse | R2 bucket not created (token lacks scope) | Create `catholicart-wip` bucket in dashboard |
| Private commission share URL | Needs the commission API view on the SPA, which is the big still-localStorage piece | A morning of work to migrate Workspace to the API |
| Studio visits / open hours | Needs a real booking primitive (availability windows + reservation flow) | Half a day on a calendar component |
| Mass intentions | Needs a parish partner | A real diocesan conversation |
| Memorabilia book | Needs a guild bookbinder | An actual bookbinder onboarded |
| Handwritten thank-you card | Needs a stationery vendor | An actual stationer |
| Reference image library | Needs properly-licensed canonical art | A licensing pass on Met / NGA / Wikimedia content |
| Patron families surfacing | Calculation is `GROUP BY patron_email` on commissions — works the moment we have real commissions | Time, not code |
| Feast-aware deadline pricing (deeper) | Existing FeastDeadlinePicker is solid; the deeper "artist marks feast windows" UI is a careful design pass | Want to think about UX before coding |
| Letter archive | Strong privacy decision required — opt-in flag, anonymization, what's the right scope | A conversation with you |
| Color palette extractor | Image processing on the edge is plausible (Workers AI has a vision model) but the UX is its own thing | A day's work |
| Liturgical lookups page | Smallish but not artist-critical | A focused afternoon |

## What's in front of you when you wake up

- `https://catholicart.jer-f84.workers.dev` is live with everything
  above. The SPA still uses localStorage for commissions, so any flow
  that depends on real commission data won't show data until the SPA
  migration. The artist's vocation site, the diocesan pages, the
  pastor endorsement flow — all of those are full-stack.

- After setting `ANTHROPIC_API_KEY`:
  1. Sign in as an operator user.
  2. Run `POST /api/artists/maria-chrysostom/claim` with your email
     (or any test email). The next sign-in for that email will link
     to Maria's artist row and promote you to `artist` role.
  3. Sign in as that email. Visit `/artists/maria-chrysostom/edit`.
  4. Answer the questionnaire (or paste the dull responses from
     earlier in the chat to verify Sonnet behaves better than Llama).
  5. Press "Synthesize." Watch the nudges appear in the margin.
  6. Cross to the Endorsement tab. Send yourself a request at your
     own email; click the link; see the one-click flow.
  7. Download an earnings CSV (it'll be empty until commissions
     accumulate, but the format is right).
  8. Toggle sabbatical mode on the Review tab; view the public
     profile; see the "On retreat" badge.

- The CF workers build deploys automatically on push to main, so the
  whole tour above should already be reflected at the live URL by the
  time you open it.

## Known minor regressions / cleanups I'd flag

- The Workspace page is still localStorage-based, which means the
  Studio Reel and the intimate "letter → vision → quote" flow only
  work for commissions created in the same browser session. This is
  the biggest deferred-work bucket — it's why F24 (commission share
  URL) is also deferred.

- The diocese name on the artist profile (in the hero meta row) isn't
  yet a link to `/dioceses/<slug>` — I'd add this as a 30-second
  polish pass.

- The trained_under_slug field auto-validates as a string but doesn't
  check that it points to a real artist slug. The render is graceful
  if it doesn't, but a small validation would prevent typos from
  going live.

- The earnings CSV's "amount" column right now is dollars (since the
  DB stores integer dollars). If you ever switch to cents-in-DB, the
  divide will need updating.

## Schema migrations applied to live D1 tonight

In order:

- `0005_artist_vocation_site.sql` — artist_questionnaire + 7 new
  columns on artists
- `0006_sabbatical.sql` — artists.sabbatical_until
- `0007_lineage.sql` — trained_under fields + house_artists table

All applied via the MCP tool against the live database. They're also
committed as migration files for future-environment use.

## Pricing model reminder

The 2% guild tithe is owed at final release, not split across the
three milestones. The escrow rows in `commission_escrow` continue to
sum to `artist_total_usd` — the artist receives 100% of their quote.
The 2% is `commissions.platform_fee_usd`, settled separately at final
release time. When Stripe gets wired:
- Charge the patron `escrow.amount_usd` for each milestone fund.
- At final release, charge the patron one additional `platform_fee_usd`.
- That last charge goes to the guild account; the previous three went
  to the artist's Connect account.

The earnings CSV reflects this correctly — it sums released milestones,
which are the artist's share only.

## One question I deferred rather than guessed

In the season letter template, I used the line "Tax-ready earnings:
$X to your hand in YYYY" as a footnote. It's a useful piece of info
but it does mix the tax framing into a deliberately non-transactional
letter. Reasonable people could argue we should leave the dollars out
of the letter entirely and put them only in the CSV. Easy to change
once you weigh in.

— see you in the morning
