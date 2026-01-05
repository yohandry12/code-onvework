import React, { useEffect, useState } from "react";
import { apiService } from "../../services/api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import CreateCourse from "../CreateCourse";
import { Search } from "lucide-react";

const AdminCreateTraining = () => {
  const [trainers, setTrainers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiService.users.adminGetAll({
          role: "trainer",
          limit: 1000,
        });
        if (res.success) setTrainers(res.users || []);
      } catch (err) {
        console.error(err);
        toast.error("Impossible de charger la liste des formateurs");
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!query) return setFiltered([]);
    const q = query.toLowerCase();
    setFiltered(
      trainers.filter(
        (t) =>
          t.email?.toLowerCase().includes(q) ||
          t.profile?.firstName?.toLowerCase().includes(q) ||
          t.profile?.lastName?.toLowerCase().includes(q)
      )
    );
  }, [query, trainers]);

  if (showForm && selected) {
    return <CreateCourse trainerId={selected.id} />;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold mb-2">
            Créer une formation (Admin)
          </h1>
          <p className="text-sm text-gray-500 mb-4">
            Sélectionnez d'abord le formateur propriétaire de la formation.
          </p>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un formateur par nom ou email..."
              className="w-full pl-10 pr-4 py-3 border rounded-xl"
            />
          </div>

          <div className="max-h-64 overflow-y-auto rounded-md border border-gray-100">
            {(filtered.length > 0 ? filtered : trainers).map((t) => (
              <div
                key={t.id}
                onClick={() => setSelected(t)}
                className={`p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 ${
                  selected?.id === t.id
                    ? "bg-emerald-50 border-l-4 border-emerald-500"
                    : ""
                }`}
              >
                <div>
                  <div className="font-semibold">
                    {t.profile?.firstName} {t.profile?.lastName}
                  </div>
                  <div className="text-xs text-gray-500">{t.email}</div>
                </div>
                <div className="text-xs text-gray-400">ID {t.id}</div>
              </div>
            ))}
            {trainers.length === 0 && (
              <div className="p-4 text-gray-500">Aucun formateur trouvé.</div>
            )}
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              disabled={!selected}
              onClick={() => setShowForm(true)}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              Créer pour ce formateur
            </button>
            <button
              onClick={() => navigate("/admin/trainings")}
              className="px-4 py-2 rounded-lg border"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCreateTraining;
