// Annual season letter — sent on January 1st (or whenever the cron
// fires) to each guild artist who had work completed in the previous
// year. A short reflection: what they made, who received it, what was
// blessed. Not metrics; memory.

import type { Env } from '../types';
import { all } from './db';
import { sendEmail } from './email';
import { seasonLetterToArtist } from './email-templates';

interface ArtistWithYear {
  artist_id: string;
  artist_name: string;
  artist_email: string;
  works_completed: number;
  patrons_served: number;
  feasts: string[];        // distinct feast_name values
  total_to_artist: number; // sum artist_total_usd of delivered/blessed
}

export async function sendSeasonLetters(env: Env, year: number): Promise<{ sent: number; skipped: number }> {
  // Find artists with any commission delivered or blessed in the given year.
  const rows = await all<{
    artist_id: string;
    artist_name: string;
    artist_email: string | null;
    works_completed: number;
    patrons_served: number;
    total_to_artist: number;
  }>(env.DB,
    `SELECT a.id AS artist_id,
            a.name AS artist_name,
            u.email AS artist_email,
            COUNT(DISTINCT c.id) AS works_completed,
            COUNT(DISTINCT c.patron_email) AS patrons_served,
            COALESCE(SUM(c.artist_total_usd), 0) AS total_to_artist
       FROM artists a
       JOIN commissions c ON c.artist_id = a.id
       LEFT JOIN users u ON u.id = a.user_id
       WHERE c.stage IN ('delivered', 'blessed')
         AND c.completed_at LIKE ?
       GROUP BY a.id`,
    `${year}%`,
  );

  let sent = 0;
  let skipped = 0;

  for (const r of rows) {
    if (!r.artist_email) {
      skipped++;
      continue;
    }
    // Distinct feast names for this artist this year.
    const feastRows = await all<{ feast_name: string }>(env.DB,
      `SELECT DISTINCT feast_name FROM commissions
         WHERE artist_id = ?
           AND completed_at LIKE ?
           AND feast_name IS NOT NULL
           AND feast_name != ''`,
      r.artist_id, `${year}%`);
    const feasts = feastRows.map((f) => f.feast_name);

    const data: ArtistWithYear = {
      artist_id: r.artist_id,
      artist_name: r.artist_name,
      artist_email: r.artist_email,
      works_completed: r.works_completed,
      patrons_served: r.patrons_served,
      feasts,
      total_to_artist: r.total_to_artist,
    };

    const event = seasonLetterToArtist(env.SITE_URL, data, year);
    await sendEmail(env, { kind: 'season.letter', payload: { artist_id: r.artist_id, year }, ...event });
    sent++;
  }

  return { sent, skipped };
}
