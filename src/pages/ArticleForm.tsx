import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";

export default function ArticleForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
    if (isEdit) fetchArticle();
  }, [id]);

  async function fetchCategories() {
    const { data } = await supabase.from("categories").select("id, name").order("name");
    setCategories(data || []);
  }

  async function fetchArticle() {
    const { data } = await supabase.from("articles").select("*").eq("id", id!).single();
    if (data) {
      setTitle(data.title);
      setDescription(data.description || "");
      setContent(data.content || "");
      setCategoryId(data.category_id || "");
      setTagsInput((data.tags || []).join(", "));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
    const payload = {
      title,
      description,
      content,
      category_id: categoryId || null,
      tags,
      author_id: user.id,
    };

    if (isEdit) {
      const { error } = await supabase.from("articles").update(payload).eq("id", id!);
      if (error) toast({ variant: "destructive", title: "Error", description: error.message });
      else { toast({ title: "Article updated" }); navigate(`/articles/${id}`); }
    } else {
      const { data, error } = await supabase.from("articles").insert(payload).select("id").single();
      if (error) toast({ variant: "destructive", title: "Error", description: error.message });
      else { toast({ title: "Article created" }); navigate(`/articles/${data.id}`); }
    }
    setLoading(false);
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto fade-in">
        <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <div className="page-header">
          <h1 className="page-title">{isEdit ? "Edit Article" : "Create Article"}</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-2xl border p-8 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Article title" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input id="tags" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="react, tutorial, guide" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your article content here... (Markdown supported)" className="min-h-[300px] font-mono text-sm" required />
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Update Article" : "Publish Article"}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
