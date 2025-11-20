import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiService } from "../../services/api";
import { Sparkles, Briefcase } from "lucide-react";

const AIJobSuggestions = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const response = await apiService.users.getAIJobMatches();
        if (response.success) {
          setSuggestions(response.matches);
        }
      } catch (error) {
        console.error("Impossible de charger les suggestions IA:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSuggestions();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-center text-gray-500 animate-pulse">
          Recherche de missions pour vous...
        </p>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null; // Ou un message indiquant qu'aucune suggestion n'est disponible
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Sparkles className="h-5 w-5 mr-2 text-purple-500" />
        Missions recommandées pour vous
      </h2>
      <div className="space-y-4">
        {suggestions.map((job) => (
          <Link
            to={`/jobs/${job.id}`}
            key={job.id}
            className="block p-4 bg-gray-50 rounded-lg hover:bg-indigo-50 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">{job.title}</h3>
              <span className="text-sm font-bold text-indigo-600">{`${job.budgetMin} - ${job.budgetMax} ${job.budgetCurrency}`}</span>
            </div>
            <p className="text-sm text-gray-600 mt-2 italic">
              <span className="font-semibold">Pourquoi c'est pour vous :</span>{" "}
              {job.reason}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AIJobSuggestions;
