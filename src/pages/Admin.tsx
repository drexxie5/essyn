import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Users, Ban, Shield, CreditCard, Search, 
  ArrowLeft, Crown, AlertTriangle, Check, X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database['public']['Tables']['profiles']['Row'];
type Report = Database['public']['Tables']['reports']['Row'];
type Payment = Database['public']['Tables']['payments']['Row'];

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<Profile[]>([]);
  const [reports, setReports] = useState<(Report & { reporter?: Profile; reported?: Profile })[]>([]);
  const [payments, setPayments] = useState<(Payment & { user?: Profile })[]>([]);

  useEffect(() => {
    checkAdminAndFetch();
  }, []);

  const checkAdminAndFetch = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      // Check if user is admin
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        toast.error("Access denied. Admin only.");
        navigate("/discover");
        return;
      }

      setIsAdmin(true);
      await Promise.all([fetchUsers(), fetchReports(), fetchPayments()]);
    } catch (error) {
      console.error("Admin check error:", error);
      navigate("/discover");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setUsers(data || []);
  };

  const fetchReports = async () => {
    const { data } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    
    if (data && data.length > 0) {
      // Get reporter and reported profiles
      const userIds = [...new Set(data.flatMap(r => [r.reporter_id, r.reported_user_id]))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]));
      
      setReports(data.map(r => ({
        ...r,
        reporter: profileMap.get(r.reporter_id),
        reported: profileMap.get(r.reported_user_id),
      })));
    }
  };

  const fetchPayments = async () => {
    const { data } = await supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]));
      
      setPayments(data.map(p => ({
        ...p,
        user: profileMap.get(p.user_id),
      })));
    }
  };

  const handleBanUser = async (userId: string, isBanned: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_banned: !isBanned })
        .eq("id", userId);

      if (error) throw error;
      
      toast.success(isBanned ? "User unbanned" : "User banned");
      fetchUsers();
    } catch (error) {
      toast.error("Failed to update user");
    }
  };

  const handleResolveReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from("reports")
        .update({ resolved: true })
        .eq("id", reportId);

      if (error) throw error;
      
      toast.success("Report resolved");
      fetchReports();
    } catch (error) {
      toast.error("Failed to resolve report");
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <AppLayout title="Admin">
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </AppLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AppLayout showNav={false} showHeader={false}>
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
          <div className="flex items-center gap-3 h-14 px-4 max-w-4xl mx-auto">
            <button onClick={() => navigate("/discover")} className="p-2 -ml-2">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-display font-bold">Admin Panel</span>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6">
          <Tabs defaultValue="users" className="space-y-4">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Users</span>
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="hidden sm:inline">Reports</span>
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                <span className="hidden sm:inline">Payments</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="glass rounded-xl p-4 flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.profile_image_url || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user.username[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{user.username}</span>
                        {user.is_premium && <Crown className="w-3 h-3 text-secondary" />}
                        {user.is_banned && <Ban className="w-3 h-3 text-destructive" />}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <Button
                      size="sm"
                      variant={user.is_banned ? "outline" : "destructive"}
                      onClick={() => handleBanUser(user.id, !!user.is_banned)}
                    >
                      {user.is_banned ? "Unban" : "Ban"}
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="reports" className="space-y-4">
              {reports.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No reports</p>
              ) : (
                <div className="space-y-2">
                  {reports.map((report) => (
                    <div key={report.id} className="glass rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-sm">
                            <strong>{report.reporter?.username || "Unknown"}</strong>
                            {" reported "}
                            <strong>{report.reported?.username || "Unknown"}</strong>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">{report.reason}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(report.created_at || "").toLocaleDateString()}
                          </p>
                        </div>
                        {!report.resolved ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => report.reported?.id && handleBanUser(report.reported.id, false)}
                            >
                              Ban User
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResolveReport(report.id)}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Resolved</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="payments" className="space-y-4">
              {payments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No payments</p>
              ) : (
                <div className="space-y-2">
                  {payments.map((payment) => (
                    <div key={payment.id} className="glass rounded-xl p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-secondary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{payment.user?.username || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">
                          ₦{payment.amount.toLocaleString()} • {payment.plan_type} • {payment.status}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(payment.created_at || "").toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </AppLayout>
  );
};

export default Admin;
