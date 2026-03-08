import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Plus, Eye, Calendar } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface Article {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  views: number | null;
  tags: string[] | null;
  categories: { name: string } | null;
  profiles: { name: string } | null;
}

export default function Articles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchArticles();
    fetchCategories();
  }, []);

  async function fetchArticles() {
    const { data } = await supabase
      .from("articles")
      .select("id, title, description, created_at, views, tags, category_id, categories(name), author_id, profiles!articles_author_id_fkey(name)")
      .order("created_at", { ascending: false }) as any;
    setArticles(data || []);
    setLoading(false);
  }

  async function fetchCategories() {
    const { data } = await supabase.from("categories").select("id, name").order("name");
    setCategories(data || []);
  }

  const filtered = filterCategory
    ? articles.filter((a: any) => a.categories?.name === filterCategory)
    : articles;

  return (
    <AppLayout>
      <div className="fade-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="page-title">Articles</h1>
            <p className="page-description">Browse and manage knowledge articles</p>
          </div>
          <Button onClick={() => navigate("/articles/new")}>
            <Plus className="mr-2 h-4 w-4" /> New Article
          </Button>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setFilterCategory("")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!filterCategory ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setFilterCategory(c.name)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterCategory === c.name ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No articles found</p>
            <Button variant="outline" onClick={() => navigate("/articles/new")}>
              <Plus className="mr-2 h-4 w-4" /> Create your first article
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((article: any) => (
              <Link key={article.id} to={`/articles/${article.id}`} className="article-card block">
                <div className="flex items-center gap-2 mb-2">
                  {article.categories?.name && (
                    <Badge variant="secondary" className="text-xs">{article.categories.name}</Badge>
                  )}
                </div>
                <h3 className="font-bold text-base mb-1 line-clamp-2">{article.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{article.description}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(article.created_at), "MMM d, yyyy")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" /> {article.views || 0}
                  </span>
                </div>
                {article.tags && article.tags.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {article.tags.slice(0, 3).map((tag: string) => (
                      <span key={tag} className="text-xs bg-muted rounded px-2 py-0.5">{tag}</span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
