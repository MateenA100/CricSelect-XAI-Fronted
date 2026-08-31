async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { Accept: "application/json", ...(options.headers ?? {}) },
  });
  const payload = await response.json().catch(() => ({
    status: "error",
    message: "The server returned an invalid response.",
  }));

  if (!response.ok) {
    throw new Error(payload.message ?? "The request could not be completed.");
  }
  return payload;
}

function queryString(params) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  });
  return query.toString();
}

export function searchPlayers({ league, query, limit = 20 }) {
  return apiRequest(`/api/players?${queryString({ league, q: query, limit })}`);
}

export function fetchOverview({ league }) {
  return apiRequest(`/api/overview?${queryString({ league })}`);
}

export function fetchLeagueComparison() {
  return apiRequest("/api/league-comparison");
}

export function fetchKMeansProfiles({ league }) {
  return apiRequest(`/api/kmeans/profiles?${queryString({ league })}`);
}

export function fetchSystemStatus() {
  return apiRequest("/api/system-status");
}

export function fetchKnnValidation() {
  return apiRequest("/api/knn/validation");
}

export function fetchPlayerDirectory({ league, query, role, cluster, sortBy }) {
  return apiRequest(
    `/api/player-directory?${queryString({
      league,
      q: query,
      role,
      cluster,
      sort_by: sortBy,
    })}`
  );
}

export function fetchPlayerProfile({ playerName, league }) {
  return apiRequest(`/api/player-profile?${queryString({ player_name: playerName, league })}`);
}

export function fetchRecommendations({
  playerName,
  league,
  topK = 5,
  sameLeague = false,
  minimumReliability = 0,
  styleMatch = false,
}) {
  return apiRequest(
    `/api/knn/recommendations?${queryString({
      player_name: playerName,
      league,
      top_k: topK,
      same_league: sameLeague,
      minimum_reliability: minimumReliability,
      style_match: styleMatch,
    })}`
  );
}

export function fetchIlpTeam({ league, scope = "league" }) {
  return apiRequest(`/api/ilp/team?${queryString({ league, scope })}`);
}

export function fetchIlpValidation() {
  return apiRequest("/api/ilp/validation");
}

export function optimiseShortlistTeam({ league, players }) {
  return apiRequest("/api/ilp/shortlist-team", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ league, players }),
  });
}

export function searchForecastPlayers({ league, query, limit = 20 }) {
  return apiRequest(`/api/forecast/players?${queryString({ league, q: query, limit })}`);
}

export function fetchPlayerForecast({ playerName, league }) {
  return apiRequest(`/api/forecast/player?${queryString({ player_name: playerName, league })}`);
}

export function fetchModelComparison() {
  return apiRequest("/api/forecast/model-comparison");
}

export function fetchPlayerExplanation({ playerName, league }) {
  return apiRequest(`/api/explanations/player?${queryString({ player_name: playerName, league })}`);
}
