// Types for edit-rankings feature

export type RankingEntry = {
  registration_id: number;
  ranking_position: number;
  ranking_score: number;
};

export type UpdateRankingsPayload = {
  rankings: RankingEntry[];
};

export type EditRankingPlayerRow = {
  registration_id: number;
  user_display_name: string;
  pseudo_winamax: string;
  photo_url: string | null;
  ranking_position: number | null;
  ranking_score: number | null;
  has_existing_ranking: boolean;
};

// Validation helpers (no Zod dependency — matches project patterns)
export function validateRankingEntry(entry: unknown): entry is RankingEntry {
  if (typeof entry !== "object" || entry === null) return false;
  const e = entry as Record<string, unknown>;
  e.registration_id = Number(e.registration_id);
  e.ranking_position = Number(e.ranking_position);
  e.ranking_score = Number(e.ranking_score);
  return (
    typeof e.registration_id === "number" &&
    Number.isInteger(e.registration_id) &&
    e.registration_id > 0 &&
    typeof e.ranking_position === "number" &&
    Number.isInteger(e.ranking_position) &&
    e.ranking_position >= 1 &&
    typeof e.ranking_score === "number" &&
    Number.isInteger(e.ranking_score) &&
    e.ranking_score >= 0
  );
}

export function validateUpdateRankingsPayload(
  body: unknown,
):
  | { success: true; data: UpdateRankingsPayload }
  | { success: false; error: string } {
  if (typeof body !== "object" || body === null) {
    return { success: false, error: "Request body must be an object" };
  }

  const b = body as Record<string, unknown>;
  if (!Array.isArray(b.rankings)) {
    return { success: false, error: "'rankings' must be an array" };
  }

  if (b.rankings.length === 0) {
    return { success: false, error: "'rankings' must not be empty" };
  }

  for (let i = 0; i < b.rankings.length; i++) {
    if (!validateRankingEntry(b.rankings[i])) {
      console.log(b.rankings[i]);
      console.log(validateRankingEntry(b.rankings[i]));
      return {
        success: false,
        error: `Invalid ranking entry at index ${i}: position must be >= 1 (int), score must be >= 0 (int), registration_id must be > 0 (int)`,
      };
    }
  }

  // Check for duplicate registration_ids
  const ids = b.rankings.map((r: RankingEntry) => r.registration_id);
  const uniqueIds = new Set(ids);
  if (uniqueIds.size !== ids.length) {
    return {
      success: false,
      error: "Duplicate registration_id found in rankings",
    };
  }

  return { success: true, data: { rankings: b.rankings as RankingEntry[] } };
}
