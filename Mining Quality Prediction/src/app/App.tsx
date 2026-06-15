import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import DatasetInsightsPage from './components/DatasetInsightsPage';
import MiningSitesPage from './components/MiningSitesPage';
import ModelComparisonPage from './components/ModelComparisonPage';

export default function App() {
  return (
    <Router>
      <div className="size-full">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dataset-insights" element={<DatasetInsightsPage />} />
          <Route path="/mining-sites" element={<MiningSitesPage />} />
          <Route path="/model-comparison" element={<ModelComparisonPage />} />
        </Routes>
      </div>
    </Router>
  );
}