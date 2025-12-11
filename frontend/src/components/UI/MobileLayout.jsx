import React from "react";
import { Outlet } from "react-router-dom"; // C'est l'élément clé !
import MobileMenu  from "./MobileMenu";
import {useAuth} from "../../contexts/AuthContext"

const MobileLayout = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* --- ZONE DU CONTENU (Les pages) --- */}
      <div className="pb-20 md:pb-0">
        <Outlet />
      </div>
      {user && <MobileMenu user={user} />}
    </div>
  );
};

export default MobileLayout;