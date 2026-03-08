import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Users, FileText, FolderOpen, Activity } from "lucide-react";

export default function Admin() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ users: 0, articles: 0, categories: 0, comments: 0 });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !isAdmin) navigate("/dashboard");
  }, [isAdmin, loading]);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    const [articles, categories, comments, profiles] = await Promise.all([
      supabase.from("articles").select("id", { count: "exact", head: true }),
      supabase.from("categories").select("id", { count: "exact", head: true }),
      supabase.from("comments").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(10),
    ]);

    setStats({
      users: (profiles.data || []).length,
      articles: articles.count || 0,
      categories: categories.count || 0,
      comments: comments.count || 0,
    });
    setRecentUsers(profiles.data || []);
  }

  if (!isAdmin) return null;

  const statCards = [
    { label: "Total Users", value: stats.users, icon: Users },
    { label: "Total Articles", value: stats.articles, icon: FileText },
    { label: "Categories", value: stats.categories, icon: FolderOpen },
    { label: "Comments", value: stats.comments, icon: Activity },
  ];

  return (
    <AppLayout>
      <div className="fade-in">
        <div className="page-header">
          <h1 className="page-title">Admin Panel</h1>
          <p className="page-description">System overview and management</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((s) => (
            <div key={s.label} className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-3xl font-extrabold mt-1">{s.value}</p>
                </div>
                <s.icon className="h-10 w-10 text-primary opacity-80" />
              </div>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-xl border p-6">
          <h2 className="text-lg font-bold mb-4">Recent Users</h2>
          <div className="space-y-3">
            {recentUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {u.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="font-medium text-sm">{u.name || "Unnamed"}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
