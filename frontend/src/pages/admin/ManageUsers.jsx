import React, { useState, useEffect, useCallback } from "react";
import { apiService } from "../../services/api";
import { useDebounce } from "use-debounce";
import EditUserModal from "../../components/admin/EditUserModal";
import AddUserSlideOver from "../../components/admin/AddUserSlideOver";

// --- Icônes pour l'UI ---
import {
  UserPlusIcon,
  MagnifyingGlassIcon as SearchIcon,
  FunnelIcon as FilterIcon,
  ArrowPathIcon as RefreshIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  AdjustmentsHorizontalIcon as ToggleLeftIcon,
  AdjustmentsVerticalIcon as ToggleRightIcon,
  TrashIcon,
  PencilIcon as EditIcon,
} from "@heroicons/react/24/outline";

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);

  // --- NOUVEAUX ÉTATS POUR L'ÉDITION ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // --- 2. NOUVEL ÉTAT POUR GÉRER LE PANNEAU LATÉRAL ---
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  // Filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [debouncedSearch] = useDebounce(searchTerm, 500);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiService.users.adminGetAll({
        page,
        search: debouncedSearch,
        role: roleFilter,
        status: statusFilter,
      });
      setUsers(response.users);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Erreur de chargement des utilisateurs", error);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleStatusToggle = async (user) => {
    const confirmAction = window.confirm(
      `Voulez-vous vraiment ${
        user.isActive ? "désactiver" : "activer"
      } cet utilisateur ?`
    );
    if (!confirmAction) return;

    try {
      await apiService.users.adminUpdateStatus(user.id, !user.isActive);
      // Recharger les données pour refléter le changement
      fetchUsers();
    } catch (error) {
      alert("Erreur lors de la mise à jour du statut.");
    }
  };

  const handleDeleteUser = async (user) => {
    const userName =
      `${user.profile?.firstName || ""} ${
        user.profile?.lastName || ""
      }`.trim() || user.email;
    const confirmDelete = window.confirm(
      `Voulez-vous vraiment supprimer définitivement l'utilisateur ${userName} ? Cette action est irréversible.`
    );

    if (!confirmDelete) return;

    try {
      await apiService.users.adminDelete(user.id);
      alert("Utilisateur supprimé avec succès.");
      // Recharger les données pour que la liste soit à jour
      fetchUsers();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      alert("La suppression a échoué. Veuillez réessayer.");
    }
  };

  const handleOpenEditModal = (user) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedUser(null);
    // On rafraîchit la liste au cas où des modifications ont été faites
    fetchUsers();
  };

  // 3. LA FONCTION 'onClose' DU PANNEAU RAFRAÎCHIT LA LISTE
  const handleCloseAddUser = () => {
    setIsAddUserOpen(false);
    fetchUsers(); // On recharge les utilisateurs après l'ajout
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestion des utilisateurs
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {pagination?.totalResults || 0} utilisateurs trouvés
          </p>
        </div>
        <button
          className="mt-4 sm:mt-0 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700"
          onClick={() => setIsAddUserOpen(true)}
        >
          <UserPlusIcon className="w-5 h-5" />
          Ajouter un utilisateur
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        {/* --- Filtres --- */}
        <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 border-b">
          <div className="relative col-span-1 sm:col-span-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Chercher par nom, email..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full p-2 border rounded-lg bg-white"
          >
            <option value="">Tous les rôles</option>
            <option value="candidate">Candidat</option>
            <option value="client">Client</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full p-2 border rounded-lg bg-white"
          >
            <option value="">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
          </select>
        </div>

        {/* --- Tableau --- */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Dernière activité
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">
                      {user.profile?.firstName} {user.profile?.lastName}
                    </div>
                    <div className="text-sm text-gray-500 capitalize">
                      {user.role}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.isActive ? (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Actif
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                        Inactif
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.lastLogin).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleStatusToggle(user)}
                        title={user.isActive ? "Désactiver" : "Activer"}
                      >
                        {user.isActive ? (
                          <ToggleRightIcon className="w-6 h-6 text-green-500" />
                        ) : (
                          <ToggleLeftIcon className="w-6 h-6 text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(user)}
                        className="text-gray-400 hover:text-blue-500"
                        title="Modifier l'utilisateur"
                      >
                        <EditIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="text-gray-400 hover:text-red-500"
                        title="Supprimer l'utilisateur"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- Pagination --- */}
        <div className="p-4 flex items-center justify-between border-t">
          <p className="text-sm text-gray-600">
            Page {pagination?.currentPage} sur {pagination?.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="p-2 border rounded-md disabled:opacity-50"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <button
              disabled={page >= pagination?.totalPages}
              onClick={() => setPage(page + 1)}
              className="p-2 border rounded-md disabled:opacity-50"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      {/* 2. AFFICHER LA MODALE QUAND l'état est vrai */}
      {isEditModalOpen && (
        <EditUserModal user={selectedUser} onClose={handleCloseEditModal} />
      )}
      {/* 5. ON AFFICHE LE COMPOSANT DU PANNEAU LATÉRAL */}
      <AddUserSlideOver isOpen={isAddUserOpen} onClose={handleCloseAddUser} />
    </div>
  );
};

export default ManageUsers;
