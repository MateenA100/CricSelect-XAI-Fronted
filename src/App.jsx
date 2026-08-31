import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LeagueProvider } from "./context/LeagueContext";
import { ShortlistProvider } from "./context/ShortlistContext";
import DashboardLayout from "./layouts/DashboardLayout";
import OverviewPage from "./pages/OverviewPage";
import PlayerProfilePage from "./pages/PlayerProfilePage";
import PlayerDirectoryPage from "./pages/PlayerDirectoryPage";
import KMeansProfilesPage from "./pages/KMeansProfilesPage";
import SystemStatusPage from "./pages/SystemStatusPage";
import PlayerComparisonPage from "./pages/PlayerComparisonPage";
import KnnValidationPage from "./pages/KnnValidationPage";
import LeagueComparisonPage from "./pages/LeagueComparisonPage";
import ShortlistPage from "./pages/ShortlistPage";
import ForecastPage from "./pages/ForecastPage";
import SimilarPlayersPage from "./pages/SimilarPlayersPage";
import TeamOptimiserPage from "./pages/TeamOptimiserPage";
import ExplainabilityPage from "./pages/ExplainabilityPage";

function App() {
  return (
    <LeagueProvider>
      <ShortlistProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<DashboardLayout />}>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/players" element={<PlayerDirectoryPage />} />
            <Route path="/player-profile" element={<PlayerProfilePage />} />
            <Route path="/kmeans-profiles" element={<KMeansProfilesPage />} />
            <Route path="/system-status" element={<SystemStatusPage />} />
            <Route path="/player-comparison" element={<PlayerComparisonPage />} />
            <Route path="/knn-validation" element={<KnnValidationPage />} />
            <Route path="/league-comparison" element={<LeagueComparisonPage />} />
            <Route path="/shortlist" element={<ShortlistPage />} />
            <Route path="/forecast" element={<ForecastPage />} />
            <Route path="/similar-players" element={<SimilarPlayersPage />} />
            <Route path="/team-optimiser" element={<TeamOptimiserPage />} />
            <Route path="/explainability" element={<ExplainabilityPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ShortlistProvider>
    </LeagueProvider>
  );
}

export default App;
