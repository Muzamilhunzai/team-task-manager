import React from 'react';
import SaaSLayout from '../components/SaaSLayout';
import { useAuth } from "../contexts/AuthContext";

export default function AppLayout({ children }) {
  return <SaaSLayout>{children}</SaaSLayout>;
}

