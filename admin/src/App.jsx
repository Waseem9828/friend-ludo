import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { store } from './redux/store';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import UserDetails from './pages/UserDetails';
import HoldGames from './pages/HoldGames';
import ResolvedGames from './pages/ResolvedGames';
import TotalGames from './pages/TotalGames';
import GameView from './pages/GameView';
import Deposits from './pages/Deposits';
import PendingDeposits from './pages/PendingDeposits';
import Withdrawals from './pages/Withdrawals';
import BankWithdrawals from './pages/BankWithdrawals';
import PendingKyc from './pages/PendingKyc';
import Bonus from './pages/Bonus';
import Penalty from './pages/Penalty';
import Settings from './pages/Settings';
import Admins from './pages/Admins';

import './App.css';

export default function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Direct Dashboard Access */}
            <Route path="/admin/login" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/register" element={<Navigate to="/admin/dashboard" replace />} />

            {/* Protected Admin Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="/admin/dashboard" element={<Dashboard />} />
                <Route path="/admin/users" element={<Users />} />
                <Route path="/admin/details/:id" element={<UserDetails />} />
                <Route path="/admin/hold-games" element={<HoldGames />} />
                <Route path="/admin/resolved-games" element={<ResolvedGames />} />
                <Route path="/admin/total-games" element={<TotalGames />} />
                <Route path="/admin/view-game/:id" element={<GameView />} />
                <Route path="/admin/deposits" element={<Deposits />} />
                <Route path="/admin/pending-deposit" element={<PendingDeposits />} />
                <Route path="/admin/pending-deposits" element={<PendingDeposits />} />
                <Route path="/admin/withdrawal-requests" element={<Withdrawals />} />
                <Route path="/admin/bank-withdrawals" element={<BankWithdrawals />} />
                <Route path="/admin/successful-withdrawls" element={<Withdrawals />} />
                <Route path="/admin/pending_kyc" element={<PendingKyc />} />
                <Route path="/admin/bonus" element={<Bonus />} />
                <Route path="/admin/penalty" element={<Penalty />} />
                <Route path="/admin/settings" element={<Settings />} />
                <Route path="/admin/admin" element={<Admins />} />
                <Route path="/super_admin_" element={<Admins />} />
              </Route>
            </Route>

            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Routes>

          <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
        </Router>
      </AuthProvider>
    </Provider>
  );
}
