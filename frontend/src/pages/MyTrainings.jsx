import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiService } from "../services/api";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import TrainingCard from "../components/Training/TrainingCard";

const MyTrainings = () => {
  const { data, isLoading, isError } = useQuery(["my-trainings"], () =>
    apiService.trainings.getAllMyTrainings()
  );

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );

  if (isError) return <div>Erreur de chargement des formations.</div>;

  const trainings = data?.trainings || [];

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Mes Formations</h1>
          <div className="text-sm text-gray-500">
            {trainings.length} formations
          </div>
        </div>

        {trainings.length === 0 ? (
          <div className="p-8 bg-gray-50 rounded-xl text-center">
            <p className="text-gray-600">
              Vous n'avez pas encore de formations.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {trainings.map((t) => (
              <TrainingCard key={t.id} course={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTrainings;
