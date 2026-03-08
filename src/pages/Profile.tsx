import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";

export default function Profile() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [articles, setArticles] = useState<any[]>([]);
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (profile) setName(profile.name);
    if (user) fetchArticles();
  }, [profile, user]);

  async function fetchArticles() {
    const { data } = await supabase.from("articles").select("id, title, created_at").eq("author_id", user!.id).order("created_at", { ascending: false });
    setArticles(data || []);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("profiles").update({ name }).eq("user_id", user!.id);
    setLoading(false);
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else toast({ title: "Profile updated" });
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else { toast({ title: "Password updated" }); setNewPassword(""); }
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto fade-in">
        <div className="page-header">
          <h1 className="page-title">Profile</h1>
        </div>

        <div className="bg-card rounded-2xl border p-8 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
              {profile?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <h2 className="text-xl font-bold">{profile?.name || "User"}</h2>
              <p className="text-muted-foreground text-sm">{profile?.email}</p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Joined {user?.created_at ? format(new Date(user.created_at), "MMM d, yyyy") : ""}
              </p>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
            </Button>
          </form>
        </div>

        <div className="bg-card rounded-2xl border p-8 mb-6">
          <h3 className="font-bold mb-4">Change Password</h3>
          <form onSubmit={handleChangePassword} className="flex gap-3">
            <Input type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
            <Button type="submit" variant="outline" disabled={changingPassword}>
              {changingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Update
            </Button>
          </form>
        </div>

        <div className="bg-card rounded-2xl border p-8">
          <h3 className="font-bold mb-4">Your Articles ({articles.length})</h3>
          <div className="space-y-2">
            {articles.map((a) => (
              <Link key={a.id} to={`/articles/${a.id}`} className="block rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{a.title}</span>
                  <span className="text-xs text-muted-foreground">{format(new Date(a.created_at), "MMM d, yyyy")}</span>
                </div>
              </Link>
            ))}
            {articles.length === 0 && <p className="text-sm text-muted-foreground">No articles yet</p>}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
