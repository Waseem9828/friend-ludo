import React from 'react';
import { Outlet } from 'react-router-dom';

// Direct Entry Mode: Allows owner to enter admin panel directly
export default function ProtectedRoute() {
  return <Outlet />;
}
