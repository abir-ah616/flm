import { useEffect, useState } from "react";
import { supabase, Tournament } from "../lib/supabase";
import { MagicCard } from "../components/MagicCard";
import { motion } from "framer-motion";
import { ListOrdered, Search, ArrowUpDown, Edit, Trash2, ArrowLeft } from "lucide-react";
import { useAuth } from "../lib/auth-context";
import { logTournamentDeletion } from "../lib/audit-helper";

type SortField = "date" | "tournament_name" | "status" | "created_at";
type SortOrder = "asc" | "desc";

export function AllTournamentsPage() {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [filteredTournaments, setFilteredTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  useEffect(() => {
    fetchAllTournaments();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [tournaments, searchTerm, statusFilter, sortField, sortOrder]);

  const fetchAllTournaments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tournaments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tournaments:", error);
    } else {
      setTournaments(data || []);
    }
    setLoading(false);
  };

  const applyFiltersAndSort = () => {
    let filtered = [...tournaments];

    if (searchTerm) {
      filtered = filtered.filter((t) =>
        t.tournament_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === "date" || sortField === "created_at") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredTournaments(filtered);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tournament?")) {
      return;
    }

    const tournament = tournaments.find((t) => t.id === id);
    if (!tournament || !user?.email) return;

    const logged = await logTournamentDeletion(tournament, user.email);
    if (!logged) {
      alert("Error logging tournament deletion");
      return;
    }

    const { error } = await supabase.from("tournaments").delete().eq("id", id);

    if (error) {
      console.error("Error deleting tournament:", error);
      alert("Error deleting tournament");
    } else {
      fetchAllTournaments();
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "qualified":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "delayed":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "canceled":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 pt-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex justify-start mb-6">
            <button
              onClick={() => {
                window.history.pushState({}, "", "/admin");
                window.dispatchEvent(new PopStateEvent("popstate"));
              }}
              className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Admin
            </button>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 mb-4 shadow-lg shadow-cyan-500/50">
              <ListOrdered className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-3">
              All Tournaments
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              Complete tournament database
            </p>
          </div>
        </motion.div>

        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search tournaments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-slate-100"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-slate-100"
            >
              <option value="all">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="delayed">Delayed</option>
              <option value="completed">Completed</option>
              <option value="qualified">Qualified</option>
              <option value="canceled">Canceled</option>
            </select>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleSort("date")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                sortField === "date"
                  ? "bg-cyan-500 text-white"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              Date
              <ArrowUpDown className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleSort("tournament_name")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                sortField === "tournament_name"
                  ? "bg-cyan-500 text-white"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              Name
              <ArrowUpDown className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleSort("status")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                sortField === "status"
                  ? "bg-cyan-500 text-white"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              Status
              <ArrowUpDown className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleSort("created_at")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                sortField === "created_at"
                  ? "bg-cyan-500 text-white"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              Created
              <ArrowUpDown className="w-4 h-4" />
            </button>
            <div className="flex-1" />
            <div className="text-sm text-slate-600 dark:text-slate-400 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
              {filteredTournaments.length} tournament{filteredTournaments.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        {filteredTournaments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
              <ListOrdered className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-2xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
              No tournaments found
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              Try adjusting your search or filters
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredTournaments.map((tournament, index) => (
              <motion.div
                key={tournament.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <MagicCard className="p-4 sm:p-6" gradientColor="#06b6d4">
                  <div className="flex flex-col gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 flex-1">
                          {tournament.tournament_name}
                        </h3>
                        <div
                          className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${getStatusBadgeColor(
                            tournament.status
                          )}`}
                        >
                          {tournament.status.toUpperCase()}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Date:</span>
                          <span className="ml-2 text-slate-800 dark:text-slate-200 font-medium">
                            {new Date(tournament.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Start:</span>
                          <span className="ml-2 text-slate-800 dark:text-slate-200 font-medium">
                            {new Date(tournament.start_time).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Maps:</span>
                          <span className="ml-2 text-slate-800 dark:text-slate-200 font-medium">
                            {tournament.maps}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Room:</span>
                          <span className="ml-2 text-slate-800 dark:text-slate-200 font-medium truncate">
                            {tournament.room_type}
                          </span>
                        </div>
                      </div>
                    </div>
                    {user && (
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => {
                            window.history.pushState({}, "", `/admin?edit=${tournament.id}`);
                            window.dispatchEvent(new PopStateEvent("popstate"));
                          }}
                          className="flex-1 sm:flex-none p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(tournament.id)}
                          className="flex-1 sm:flex-none p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </MagicCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
