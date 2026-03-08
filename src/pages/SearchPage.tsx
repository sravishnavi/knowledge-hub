import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [sortBy, setSortBy] = useState<"latest" | "views">("latest");

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearched(true);

    const { data } = await supabase
      .from("articles")
      .select("id, title, description, created_at, views, tags, categories(name)")
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,content.ilike.%${query}%`)
      .order(sortBy === "latest" ? "created_at" : "views", { ascending: false }) as any;

    setResults(data || []);
  }

  const sorted = [...results].sort((a, b) => {
    if (sortBy === "views") return (b.views || 0) - (a.views || 0);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto fade-in">
        <div className="page-header">
          <h1 className="page-title">Search</h1>
          <p className="page-description">Find articles by title, content, or tags</p>
        </div>

        <form onSubmit={handleSearch} className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles..."
            className="search-input pl-10"
          />
        </form>

        {searched && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">{results.length} result{results.length !== 1 ? "s" : ""}</p>
            <div className="flex gap-2">
              <button onClick={() => setSortBy("latest")} className={`text-xs px-2 py-1 rounded ${sortBy === "latest" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>Latest</button>
              <button onClick={() => setSortBy("views")} className={`text-xs px-2 py-1 rounded ${sortBy === "views" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>Most Viewed</button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {sorted.map((a: any) => (
            <Link key={a.id} to={`/articles/${a.id}`} className="article-card block">
              <div className="flex items-center gap-2 mb-1">
                {a.categories?.name && <Badge variant="secondary" className="text-xs">{a.categories.name}</Badge>}
              </div>
              <h3 className="font-bold mb-1">{a.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{a.description}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {format(new Date(a.created_at), "MMM d, yyyy")}</span>
                <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {a.views || 0}</span>
              </div>
            </Link>
          ))}
          {searched && results.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">No articles found for "{query}"</p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
