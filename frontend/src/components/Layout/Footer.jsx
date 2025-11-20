import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo et description */}
          <div className="md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">O</span>
              </div>
              <span className="font-bold text-xl">Onvework</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Plateforme moderne connectant candidats et clients pour des
              missions freelance.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-semibold mb-4">Navigation</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Accueil
                </Link>
              </li>
              <li>
                <Link
                  to="/jobs"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Trouver des missions
                </Link>
              </li>
              <li>
                <Link
                  to="/talents"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Nos Talents
                </Link>
              </li>
            </ul>
          </div>

          {/* Pour les candidats */}
          {/* <div>
            <h3 className="font-semibold mb-4">Candidats</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="#"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Trouver un emploi
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Conseils carrière
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Guide freelance
                </a>
              </li>
            </ul>
          </div> */}

          {/* Pour les clients */}
          {/* <div>
            <h3 className="font-semibold mb-4">Clients</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="#"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Poster une offre
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Trouver des talents
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Tarification
                </a>
              </li>
            </ul>
          </div> */}
        </div>

        {/* Barre du bas */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2024 Overwork. Tous droits réservés.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a
              href="#"
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Conditions d'utilisation
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Politique de confidentialité
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
