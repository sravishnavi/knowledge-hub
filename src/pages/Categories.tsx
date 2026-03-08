import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, FolderOpen, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function Categories() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchCategories(); }, []);

  async function fetchCategories() {
    const { data } = await supabase.from("categories").select("*").order("name");
    setCategories(data || []);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const { error } = await supabase.from("categories").insert({ name: name.trim(), description: description.trim() });
    setLoading(false);
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else { toast({ title: "Category created" }); setName(""); setDescription(""); fetchCategories(); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category?")) return;
    await supabase.from("categories").delete().eq("id", id);
    toast({ title: "Category deleted" });
    fetchCategories();
  }

  return (
    <AppLayout>
      <div className="fade-in">
        <div className="page-header">
          <h1 className="page-title">Categories</h1>
          <p className="page-description">Organize knowledge articles by category</p>
        </div>

        {isAdmin && (
          <form onSubmit={handleCreate} className="bg-card rounded-xl border p-6 mb-6 flex flex-col sm:flex-row gap-3">
            <Input placeholder="Category name" value={name} onChange={(e) => setName(e.target.value)} required className="sm:w-48" />
            <Input placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} className="flex-1" />
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Add
            </Button>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((c) => (
            <div key={c.id} className="bg-card rounded-xl border p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FolderOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold">{c.name}</h3>
                    {c.description && <p className="text-sm text-muted-foreground">{c.description}</p>}
                  </div>
                </div>
                {isAdmin && (
                  <button onClick={() => handleDelete(c.id)} className="text-destructive hover:text-destructive/80 p-1">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-3">Created {format(new Date(c.created_at), "MMM d, yyyy")}</p>
            </div>
          ))}
          {categories.length === 0 && (
            <p className="text-muted-foreground col-span-full text-center py-8">No categories yet</p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
