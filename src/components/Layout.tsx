import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Sidebar from './Sidebar';

export default function Layout() {
  const navigate = useNavigate();

  useEffect(() => {
    checkAccessExpiry();
  }, []);

  function checkAccessExpiry() {
    const accessData = localStorage.getItem('mvpAccess');
    if (accessData) {
      const { expiryTime } = JSON.parse(accessData);
      if (Date.now() > expiryTime) {
        navigate('/');
      }
    }
  }

  return (
    <div className="flex min-h-screen bg-[#0F172A]">
      <Sidebar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
