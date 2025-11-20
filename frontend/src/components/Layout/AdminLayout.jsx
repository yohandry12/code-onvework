import React from "react";
import { Outlet } from "react-router-dom";
import AdminHeader from "../../components/admin/AdminHeader";
import Footer from "../../components/Layout/Footer";

const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <AdminHeader />
      <main className="flex-grow">
        {/* Le contenu des pages admin (Dashboard, Users, etc.) sera rendu ici */}
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default AdminLayout;
