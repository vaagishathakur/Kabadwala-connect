import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './i18n/LanguageContext';
import RecyclerLoginPage from './pages/RecyclerLoginPage';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import IncomingLots from './pages/IncomingLots';
import LotDetail from './pages/LotDetail';
import HandoverConfirm from './pages/HandoverConfirm';
import RateManagement from './pages/RateManagement';
import TransactionHistory from './pages/TransactionHistory';
import EPRReports from './pages/EPRReports';
import IVRSimulator from './pages/IVRSimulator';
import AIScrapInspector from './pages/AIScrapInspector';
import MarginOptimizer from './pages/MarginOptimizer';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
      <Routes>
        <Route path="/login" element={<RecyclerLoginPage />} />
        
        <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<DashboardHome />} />
          <Route path="ai-inspector" element={<AIScrapInspector />} />
          <Route path="margin-optimizer" element={<MarginOptimizer />} />
          <Route path="lots" element={<IncomingLots />} />
          <Route path="lots/:id" element={<LotDetail />} />
          <Route path="handover" element={<HandoverConfirm />} />
          <Route path="rates" element={<RateManagement />} />
          <Route path="history" element={<TransactionHistory />} />
          <Route path="epr-reports" element={<EPRReports />} />
          <Route path="ivr-simulator" element={<IVRSimulator />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </LanguageProvider>
  );
}

export default App;
