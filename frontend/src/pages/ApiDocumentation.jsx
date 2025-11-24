// src/pages/ApiDocumentation.jsx
import React, { useState } from "react";
import { apiDocs } from "../data/apiDocs";

// Petit utilitaire pour créer des IDs propres (ex: "Missions (Jobs)" -> "missions-jobs")
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-") // Remplace les espaces par des tirets
    .replace(/[^\w-]+/g, "") // Enlève les caractères spéciaux
    .replace(/--+/g, "-") // Remplace les tirets multiples
    .trim();
};

const MethodBadge = ({ method }) => {
  const colors = {
    GET: "bg-blue-100 text-blue-800 border-blue-200",
    POST: "bg-green-100 text-green-800 border-green-200",
    PUT: "bg-orange-100 text-orange-800 border-orange-200",
    PATCH: "bg-yellow-100 text-yellow-800 border-yellow-200",
    DELETE: "bg-red-100 text-red-800 border-red-200",
  };

  return (
    <span
      className={`px-2 py-1 text-xs font-bold rounded border ${
        colors[method] || "bg-gray-100"
      }`}
    >
      {method}
    </span>
  );
};

const ApiDocumentation = () => {
  const [activeSection, setActiveSection] = useState(apiDocs[0].title);

  // Fonction pour gérer le click et le scroll
  const handleNavClick = (title) => {
    setActiveSection(title);

    // Sur mobile, on change juste la vue (comportement onglet).
    // Sur desktop, on scroll vers l'élément.
    const elementId = slugify(title);
    const element = document.getElementById(elementId);

    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-800">
      {/* Sidebar de navigation (Fixe à gauche) */}
      <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto hidden md:block flex-shrink-0">
        <div className="p-6">
          <h1 className="text-xl font-bold text-indigo-600 mb-6">API Docs</h1>
          <nav className="space-y-1">
            {apiDocs.map((section) => (
              <button
                key={section.title}
                onClick={() => handleNavClick(section.title)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeSection === section.title
                    ? "bg-indigo-50 text-indigo-700 border-r-4 border-indigo-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {section.title}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Contenu Principal (Scrollable) */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
        <div className="max-w-4xl mx-auto pb-20">
          {/* Header Mobile */}
          <div className="md:hidden mb-6 sticky top-0 bg-gray-50 pt-4 pb-2 z-10">
            <h1 className="text-2xl font-bold text-indigo-600">
              Documentation API
            </h1>
            <p className="text-sm text-gray-500 mt-1 mb-4">
              Base URL: <code className="bg-gray-200 px-1 rounded">/api</code>
            </p>

            {/* Menu déroulant simple pour mobile */}
            <select
              value={activeSection}
              onChange={(e) => handleNavClick(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md bg-white"
            >
              {apiDocs.map((s) => (
                <option key={s.title} value={s.title}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          {apiDocs.map((section) => (
            <div
              key={section.title}
              id={slugify(section.title)} // ID généré dynamiquement pour le scroll
              className={`mb-16 scroll-mt-8 ${
                // Logique d'affichage :
                // Mobile : On affiche SEULEMENT la section active
                // Desktop (md) : On affiche TOUTES les sections (block) pour permettre le scroll
                activeSection === section.title ? "block" : "hidden md:block"
              }`}
            >
              <div className="border-b border-gray-200 pb-4 mb-6">
                <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  {section.title}
                </h2>
                <p className="text-gray-600 mt-2 text-lg">
                  {section.description}
                </p>
              </div>

              <div className="space-y-12">
                {section.endpoints.map((endpoint, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-shadow hover:shadow-md"
                  >
                    {/* Header de l'endpoint */}
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <MethodBadge method={endpoint.method} />
                        <code className="text-sm font-mono text-gray-700 font-semibold break-all">
                          {endpoint.url}
                        </code>
                      </div>
                      {endpoint.access && (
                        <span className="text-xs font-medium text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded-full whitespace-nowrap">
                          {endpoint.access}
                        </span>
                      )}
                    </div>

                    {/* Corps de l'endpoint */}
                    <div className="p-6">
                      <p className="text-gray-700 mb-6 leading-relaxed">
                        {endpoint.description}
                      </p>

                      {endpoint.note && (
                        <div className="mb-6 p-4 bg-blue-50 text-blue-800 text-sm rounded-md border-l-4 border-blue-500">
                          <strong className="font-semibold block mb-1">
                            Note :
                          </strong>
                          {endpoint.note}
                        </div>
                      )}

                      {/* Paramètres URL */}
                      {endpoint.params && (
                        <div className="mb-6">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                            Query Params
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {endpoint.params.map((param, i) => (
                              <code
                                key={i}
                                className="text-xs bg-gray-100 text-pink-600 px-2 py-1 rounded border border-gray-200 font-mono"
                              >
                                {param}
                              </code>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid lg:grid-cols-2 gap-6">
                        {/* Body Request */}
                        {endpoint.body && (
                          <div className="flex flex-col">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                              Body (Requête)
                            </h4>
                            <div className="relative group flex-grow">
                              <pre className="bg-gray-900 text-gray-100 p-4 rounded-md text-xs font-mono overflow-x-auto h-full max-h-64 scrollbar-thin scrollbar-thumb-gray-700">
                                {typeof endpoint.body === "string"
                                  ? endpoint.body
                                  : JSON.stringify(endpoint.body, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}

                        {/* Response Example */}
                        {endpoint.response && (
                          <div className="flex flex-col">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                              Réponse (Exemple)
                            </h4>
                            <div className="relative group flex-grow">
                              <pre className="bg-gray-900 text-green-400 p-4 rounded-md text-xs font-mono overflow-x-auto h-full max-h-64 scrollbar-thin scrollbar-thumb-gray-700">
                                {JSON.stringify(endpoint.response, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default ApiDocumentation;
