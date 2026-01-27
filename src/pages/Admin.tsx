import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, AlertTriangle, CreditCard, Search, Ban, Check, 
  Crown, Trash2, Shield, Calendar, ArrowLeft, BarChart3, 
  MessageCircle, Heart, TrendingUp, Eye, BadgeCheck
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { format, subDays } from "date-fns";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database['public']['Tables']['profiles']['Row'];
type Report = Database['public']['Tables']['reports']['Row'];
type Payment = Database['public']['Tables']['payments']['Row'];

interface DashboardStats {
  totalUsers: number;
  premiumUsers: number;
  newUsersToday: number;
  totalRevenue: number;
  activeChats: number;
  totalLikes: number;
  pendingReports: number;
}

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    premiumUsers: 0,
    newUsersToday: 0,
    totalRevenue: 0,
    activeChats: 0,
    totalLikes: 0,
    pendingReports: 0,
  });
  
  // Data states
  const [users, setUsers] = useState<Profile[]>([]);
  const [reports, setReports] = useState<(Report & { reporter?: Profile; reported?: Profile })[]>([]);
  const [payments, setPayments] = useState<(Payment & { user?: Profile })[]>([]);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      toast.error("Access denied. Admin privileges required.");
      navigate("/profile");
      return;
    }

    setIsAdmin(true);
    fetchAllData();
  };

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchUsers(), fetchReports(), fetchPayments(), fetchStats()]);
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get total users
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Get premium users
      const { count: premiumUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("is_premium", true);

      // Get new users today
      const { count: newUsersToday } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today.toISOString());

      // Get total revenue
      const { data: paymentsData } = await supabase
        .from("payments")
        .select("amount")
        .eq("status", "completed");
      
      const totalRevenue = paymentsData?.reduce((sum, p) => sum + p.amount, 0) || 0;

      // Get active chats
      const { count: activeChats } = await supabase
        .from("chats")
        .select("*", { count: "exact", head: true });

      // Get total likes
      const { count: totalLikes } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true });

      // Get pending reports
      const { count: pendingReports } = await supabase
        .from("reports")
        .select("*", { count: "exact", head: true })
        .eq("resolved", false);

      setStats({
        totalUsers: totalUsers || 0,
        premiumUsers: premiumUsers || 0,
        newUsersToday: newUsersToday || 0,
        totalRevenue,
        activeChats: activeChats || 0,
        totalLikes: totalLikes || 0,
        pendingReports: pendingReports || 0,
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    setUsers(data || []);
  };

  const fetchReports = async () => {
    const { data } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      const enriched = await Promise.all(
        data.map(async (report) => {
          const [reporter, reported] = await Promise.all([
            supabase.from("profiles").select("*").eq("id", report.reporter_id).maybeSingle(),
            supabase.from("profiles").select("*").eq("id", report.reported_user_id).maybeSingle(),
          ]);
          return { ...report, reporter: reporter.data, reported: reported.data };
        })
      );
      setReports(enriched);
    }
  };

  const fetchPayments = async () => {
    const { data } = await supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      const enriched = await Promise.all(
        data.map(async (payment) => {
          const { data: user } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", payment.user_id)
            .maybeSingle();
          return { ...payment, user };
        })
      );
      setPayments(enriched);
    }
  };

  const toggleBan = async (userId: string, currentlyBanned: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_banned: !currentlyBanned })
      .eq("id", userId);

    if (error) {
      toast.error("Failed to update user status");
    } else {
      toast.success(currentlyBanned ? "User unbanned" : "User banned");
      fetchUsers();
      fetchStats();
    }
  };

  const grantPremium = async (userId: string, planType: "weekly" | "monthly") => {
    const now = new Date();
    const expiresAt = new Date(now);
    
    if (planType === "weekly") {
      expiresAt.setDate(expiresAt.getDate() + 7);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        is_premium: true,
        subscription_plan: planType,
        subscription_start: now.toISOString(),
        subscription_expires: expiresAt.toISOString(),
      })
      .eq("id", userId);

    if (error) {
      toast.error("Failed to grant premium");
    } else {
      toast.success(`Premium ${planType} granted!`);
      fetchUsers();
      fetchStats();
    }
  };

  const revokePremium = async (userId: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({
        is_premium: false,
        subscription_plan: null,
        subscription_start: null,
        subscription_expires: null,
      })
      .eq("id", userId);

    if (error) {
      toast.error("Failed to revoke premium");
    } else {
      toast.success("Premium revoked");
      fetchUsers();
      fetchStats();
    }
  };

  const toggleVerification = async (userId: string, currentlyVerified: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ 
        is_verified: !currentlyVerified,
        verification_expires: !currentlyVerified ? null : null, // Admin verification is permanent
      })
      .eq("id", userId);

    if (error) {
      toast.error("Failed to update verification status");
    } else {
      toast.success(currentlyVerified ? "Verification removed" : "User verified!");
      fetchUsers();
    }
  };

  const resolveReport = async (reportId: string) => {
    const { error } = await supabase
      .from("reports")
      .update({ resolved: true })
      .eq("id", reportId);

    if (error) {
      toast.error("Failed to resolve report");
    } else {
      toast.success("Report resolved");
      fetchReports();
      fetchStats();
    }
  };

  const removeProfileImage = async (userId: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ profile_image_url: "/placeholder.svg", profile_images: [] })
      .eq("id", userId);

    if (error) {
      toast.error("Failed to remove image");
    } else {
      toast.success("Profile images removed");
      fetchUsers();
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      // First delete messages where user is in a chat
      const { data: userChats } = await supabase
        .from("chats")
        .select("id")
        .or(`user_one_id.eq.${userId},user_two_id.eq.${userId}`);
      
      if (userChats && userChats.length > 0) {
        const chatIds = userChats.map(c => c.id);
        await supabase.from("messages").delete().in("chat_id", chatIds);
        await supabase.from("chats").delete().or(`user_one_id.eq.${userId},user_two_id.eq.${userId}`);
      }

      // Delete related data
      await Promise.all([
        supabase.from("likes").delete().or(`liker_id.eq.${userId},liked_id.eq.${userId}`),
        supabase.from("matches").delete().or(`user_one_id.eq.${userId},user_two_id.eq.${userId}`),
        supabase.from("notifications").delete().eq("user_id", userId),
        supabase.from("reports").delete().or(`reporter_id.eq.${userId},reported_user_id.eq.${userId}`),
        supabase.from("user_roles").delete().eq("user_id", userId),
      ]);

      // Finally delete profile
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (error) {
        console.error("Delete error:", error);
        toast.error("Failed to delete user: " + error.message);
      } else {
        toast.success("User deleted successfully");
        fetchAllData();
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete user");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <AppLayout title="Admin">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Checking admin access...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showNav={false} showHeader={false}>
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
          <div className="flex items-center gap-3 h-14 px-4 max-w-6xl mx-auto">
            <button onClick={() => navigate("/profile")} className="p-2 -ml-2">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-display font-bold">Admin Panel</span>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-6">
          {/* Dashboard Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Total Users</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
              <p className="text-xs text-green-500">+{stats.newUsersToday} today</p>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-4 h-4 text-secondary" />
                <span className="text-xs text-muted-foreground">Premium</span>
              </div>
              <p className="text-2xl font-bold">{stats.premiumUsers}</p>
              <p className="text-xs text-muted-foreground">{((stats.premiumUsers / stats.totalUsers) * 100 || 0).toFixed(1)}% of users</p>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-xs text-muted-foreground">Revenue</span>
              </div>
              <p className="text-2xl font-bold">₦{stats.totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">All time</p>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <span className="text-xs text-muted-foreground">Pending Reports</span>
              </div>
              <p className="text-2xl font-bold">{stats.pendingReports}</p>
              <p className="text-xs text-muted-foreground">Needs review</p>
            </div>
          </div>

          {/* Additional Stats Row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="glass rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold">{stats.totalLikes}</p>
                <p className="text-xs text-muted-foreground">Total Likes</p>
              </div>
            </div>
            <div className="glass rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-lg font-bold">{stats.activeChats}</p>
                <p className="text-xs text-muted-foreground">Active Chats</p>
              </div>
            </div>
            <div className="glass rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-lg font-bold">{payments.length}</p>
                <p className="text-xs text-muted-foreground">Transactions</p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="users" className="space-y-4">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Users</span>
                <span className="sm:hidden">({users.length})</span>
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="hidden sm:inline">Reports</span>
                {stats.pendingReports > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-destructive text-destructive-foreground text-xs">
                    {stats.pendingReports}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                <span className="hidden sm:inline">Payments</span>
              </TabsTrigger>
            </TabsList>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name, email, or city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No users found</div>
                ) : (
                  filteredUsers.map((user) => (
                    <div key={user.id} className="glass rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <img
                          src={user.profile_image_url || "/placeholder.svg"}
                          alt=""
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{user.username}</span>
                            {(user as any).is_verified && <VerifiedBadge size="sm" />}
                            {user.is_premium && (
                              <span className="px-2 py-0.5 rounded-full bg-gradient-gold text-secondary-foreground text-xs">
                                Premium
                              </span>
                            )}
                            {user.is_banned && (
                              <span className="px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground text-xs">
                                Banned
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                          <p className="text-xs text-muted-foreground">
                            {user.city} • {user.age}yo • {user.gender} • Interested in: {user.interested_in}
                          </p>
                          {user.subscription_expires && (
                            <p className="text-xs text-muted-foreground">
                              Expires: {format(new Date(user.subscription_expires), "PPp")}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/user/${user.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-3">
                        <Button
                          size="sm"
                          variant={user.is_banned ? "default" : "destructive"}
                          onClick={() => toggleBan(user.id, user.is_banned || false)}
                        >
                          {user.is_banned ? <Check className="w-3 h-3 mr-1" /> : <Ban className="w-3 h-3 mr-1" />}
                          {user.is_banned ? "Unban" : "Ban"}
                        </Button>

                        {!user.is_premium ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => grantPremium(user.id, "weekly")}
                            >
                              <Crown className="w-3 h-3 mr-1" />
                              +Weekly
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => grantPremium(user.id, "monthly")}
                            >
                              <Crown className="w-3 h-3 mr-1" />
                              +Monthly
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => revokePremium(user.id)}
                          >
                            Revoke Premium
                          </Button>
                        )}

                        {user.profile_image_url && user.profile_image_url !== "/placeholder.svg" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeProfileImage(user.id)}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Remove Images
                          </Button>
                        )}

                        {(user as any).is_verified ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleVerification(user.id, true)}
                          >
                            <BadgeCheck className="w-3 h-3 mr-1" />
                            Unverify
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-blue-500 text-blue-500 hover:bg-blue-500/10"
                            onClick={() => toggleVerification(user.id, false)}
                          >
                            <BadgeCheck className="w-3 h-3 mr-1" />
                            Verify
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (confirm(`Delete ${user.username}? This cannot be undone.`)) {
                              deleteUser(user.id);
                            }
                          }}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : reports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No reports</div>
              ) : (
                reports.map((report) => (
                  <div key={report.id} className={`glass rounded-xl p-4 ${report.resolved ? "opacity-60" : ""}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-destructive">
                            {report.reported?.username || "Unknown"}
                          </span>
                          <span className="text-muted-foreground text-sm">reported by</span>
                          <span className="font-medium">{report.reporter?.username || "Unknown"}</span>
                        </div>
                        <p className="text-sm mt-1">{report.reason}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(report.created_at!), "PPp")}
                        </p>
                      </div>
                      {report.resolved ? (
                        <span className="text-xs text-green-500 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Resolved
                        </span>
                      ) : null}
                    </div>

                    {!report.resolved && (
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" onClick={() => resolveReport(report.id)}>
                          <Check className="w-3 h-3 mr-1" />
                          Resolve
                        </Button>
                        {report.reported && !report.reported.is_banned && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              toggleBan(report.reported_user_id, false);
                              resolveReport(report.id);
                            }}
                          >
                            <Ban className="w-3 h-3 mr-1" />
                            Ban User
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/user/${report.reported_user_id}`)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View Profile
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments" className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : payments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No payments</div>
              ) : (
                payments.map((payment) => (
                  <div key={payment.id} className="glass rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={payment.user?.profile_image_url || "/placeholder.svg"}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-medium">{payment.user?.username || "Unknown"}</p>
                          <p className="text-sm text-muted-foreground">{payment.user?.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-500">
                          ₦{payment.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {payment.plan_type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <span className={`px-2 py-0.5 rounded-full ${
                        payment.status === "completed" ? "bg-green-500/20 text-green-500" : "bg-yellow-500/20 text-yellow-500"
                      }`}>
                        {payment.status}
                      </span>
                      <span>TX: {payment.flutterwave_transaction_id}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(payment.created_at!), "PPp")}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </AppLayout>
  );
};

export default Admin;
