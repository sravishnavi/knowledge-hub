import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Edit, Trash2, Eye, Calendar, User, Send, Loader2, FileText, Image, Download } from "lucide-react";
import { format } from "date-fns";

export default function ArticleDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [article, setArticle] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchArticle();
      fetchComments();
      incrementViews();
    }
  }, [id]);

  async function fetchArticle() {
    const { data } = await supabase
      .from("articles")
      .select("*, categories(name), profiles!articles_author_id_fkey(name)")
      .eq("id", id!)
      .single() as any;
    setArticle(data);
    setLoading(false);
  }

  async function fetchComments() {
    const { data } = await supabase
      .from("comments")
      .select("*, profiles!comments_user_id_fkey(name)")
      .eq("article_id", id!)
      .order("created_at", { ascending: true }) as any;
    setComments(data || []);
  }

  async function incrementViews() {
    try {
      await supabase.from("articles").update({ views: (article?.views || 0) + 1 } as any).eq("id", id!);
    } catch {
      // ignore
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this article?")) return;
    await supabase.from("articles").delete().eq("id", id!);
    toast({ title: "Article deleted" });
    navigate("/articles");
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    setSubmitting(true);
    await supabase.from("comments").insert({ article_id: id!, user_id: user.id, comment_text: newComment.trim() });
    setNewComment("");
    setSubmitting(false);
    fetchComments();
  }

  async function handleDeleteComment(commentId: string) {
    await supabase.from("comments").delete().eq("id", commentId);
    fetchComments();
  }

  if (loading) return <AppLayout><div className="text-center py-12 text-muted-foreground">Loading...</div></AppLayout>;
  if (!article) return <AppLayout><div className="text-center py-12 text-muted-foreground">Article not found</div></AppLayout>;

  const isAuthor = user?.id === article.author_id;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto fade-in">
        <Button variant="ghost" className="mb-4" onClick={() => navigate("/articles")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Articles
        </Button>

        <div className="bg-card rounded-2xl border p-8 mb-6">
          <div className="flex items-center gap-2 mb-4">
            {article.categories?.name && <Badge variant="secondary">{article.categories.name}</Badge>}
            {article.tags?.map((tag: string) => (
              <Badge key={tag} variant="outline">{tag}</Badge>
            ))}
          </div>

          <h1 className="text-3xl font-extrabold mb-2">{article.title}</h1>
          {article.description && <p className="text-muted-foreground mb-6">{article.description}</p>}

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6 border-b pb-4">
            <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> {article.profiles?.name || "Unknown"}</span>
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {format(new Date(article.created_at), "MMM d, yyyy")}</span>
            <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {article.views || 0} views</span>
          </div>

          <div className="prose prose-sm max-w-none whitespace-pre-wrap">{article.content}</div>

          {(isAuthor || isAdmin) && (
            <div className="flex gap-2 mt-8 pt-6 border-t">
              {isAuthor && (
                <Button variant="outline" onClick={() => navigate(`/articles/${id}/edit`)}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
              )}
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            </div>
          )}
        </div>

        {/* Comments */}
        <div className="bg-card rounded-2xl border p-6">
          <h2 className="text-lg font-bold mb-4">Comments ({comments.length})</h2>

          {user && (
            <form onSubmit={handleAddComment} className="flex gap-2 mb-6">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[60px]"
              />
              <Button type="submit" size="icon" disabled={submitting || !newComment.trim()}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          )}

          <div className="space-y-3">
            {comments.map((c: any) => (
              <div key={c.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {c.profiles?.name?.charAt(0) || "?"}
                    </div>
                    <span className="text-sm font-medium">{c.profiles?.name || "Unknown"}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(c.created_at), "MMM d, h:mm a")}</span>
                  </div>
                  {user?.id === c.user_id && (
                    <button onClick={() => handleDeleteComment(c.id)} className="text-xs text-destructive hover:underline">Delete</button>
                  )}
                </div>
                <p className="text-sm">{c.comment_text}</p>
              </div>
            ))}
            {comments.length === 0 && <p className="text-sm text-muted-foreground">No comments yet. Be the first!</p>}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
