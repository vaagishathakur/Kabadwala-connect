import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RecyclerLoginPage from './pages/RecyclerLoginPage';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import IncomingLots from './pages/IncomingLots';
import LotDetail from './pages/LotDetail';
import HandoverConfirm from './pages/HandoverConfirm';
import RateManagement from './pages/RateManagement';
import TransactionHistory from './pages/TransactionHistory';
import EPRReports from './pages/EPRReports';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<RecyclerLoginPage />} />
        
        <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<DashboardHome />} />
          <Route path="lots" element={<IncomingLots />} />
          <Route path="lots/:id" element={<LotDetail />} />
          <Route path="handover" element={<HandoverConfirm />} />
          <Route path="rates" element={<RateManagement />} />
          <Route path="history" element={<TransactionHistory />} />
          <Route path="epr-reports" element={<EPRReports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
