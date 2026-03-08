import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { FileText, FolderOpen, Eye, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

interface Stats {
  totalArticles: number;
  totalCategories: number;
  totalViews: number;
  totalComments: number;
}

interface RecentArticle {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  views: number | null;
  category_name?: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ totalArticles: 0, totalCategories: 0, totalViews: 0, totalComments: 0 });
  const [recent, setRecent] = useState<RecentArticle[]>([]);
  const [popular, setPopular] = useState<RecentArticle[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [articles, categories, comments] = await Promise.all([
      supabase.from("articles").select("id, title, description, created_at, views, category_id, categories(name)").order("created_at", { ascending: false }),
      supabase.from("categories").select("id", { count: "exact", head: true }),
      supabase.from("comments").select("id", { count: "exact", head: true }),
    ]);

    const articleData = (articles.data || []) as any[];
    const totalViews = articleData.reduce((sum: number, a: any) => sum + (a.views || 0), 0);

    setStats({
      totalArticles: articleData.length,
      totalCategories: categories.count || 0,
      totalViews,
      totalComments: comments.count || 0,
    });

    setRecent(articleData.slice(0, 5).map((a: any) => ({
      ...a,
      category_name: a.categories?.name,
    })));

    setPopular(
      [...articleData]
        .sort((a: any, b: any) => (b.views || 0) - (a.views || 0))
        .slice(0, 5)
        .map((a: any) => ({ ...a, category_name: a.categories?.name }))
    );
  }

  const statCards = [
    { label: "Total Articles", value: stats.totalArticles, icon: FileText, color: "text-primary" },
    { label: "Categories", value: stats.totalCategories, icon: FolderOpen, color: "text-accent" },
    { label: "Total Views", value: stats.totalViews, icon: Eye, color: "text-info" },
    { label: "Comments", value: stats.totalComments, icon: MessageSquare, color: "text-warning" },
  ];

  return (
    <AppLayout>
      <div className="fade-in">
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-description">Overview of your knowledge base</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((s) => (
            <div key={s.label} className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-3xl font-extrabold mt-1">{s.value}</p>
                </div>
                <s.icon className={`h-10 w-10 ${s.color} opacity-80`} />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl border p-6">
            <h2 className="text-lg font-bold mb-4">Recent Articles</h2>
            {recent.length === 0 ? (
              <p className="text-muted-foreground text-sm">No articles yet. Create your first one!</p>
            ) : (
              <div className="space-y-3">
                {recent.map((a) => (
                  <Link key={a.id} to={`/articles/${a.id}`} className="block rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm truncate">{a.title}</h3>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">{format(new Date(a.created_at), "MMM d")}</span>
                    </div>
                    {a.category_name && <span className="text-xs text-primary mt-1 inline-block">{a.category_name}</span>}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card rounded-xl border p-6">
            <h2 className="text-lg font-bold mb-4">Most Viewed</h2>
            {popular.length === 0 ? (
              <p className="text-muted-foreground text-sm">No articles yet.</p>
            ) : (
              <div className="space-y-3">
                {popular.map((a) => (
                  <Link key={a.id} to={`/articles/${a.id}`} className="block rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm truncate">{a.title}</h3>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2 flex items-center gap-1">
                        <Eye className="h-3 w-3" /> {a.views || 0}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
