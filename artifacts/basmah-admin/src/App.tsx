import { useState, useEffect, useCallback } from "react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { useUpload } from "@workspace/object-storage-web";
import {
  ShoppingBag,
  Users,
  Shirt,
  Type,
  LogOut,
  LayoutDashboard,
  ChevronDown,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  Upload,
  BarChart3,
  Package,
  TrendingUp,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";

/* ─── Auth ─────────────────────────────────────────── */
const ADMIN_PASSWORD = "basmah2025";

/* ─── Types ─────────────────────────────────────────── */
type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

interface Order {
  id: number;
  teamId: number;
  teamName: string;
  customerName: string;
  jerseyNumber: string;
  size: string;
  color: string;
  quantity: number;
  totalPrice: number;
  customerPhone: string;
  customerCity: string;
  status: OrderStatus;
  createdAt: string;
}

interface Team {
  id: number;
  name: string;
  nameEn: string;
  league: string;
  basePrice: number;
  primaryColor: string;
  availableColors: string[];
  availableSizes: string[];
  orderCount: number;
}

interface JerseyColor {
  id: number;
  teamId: number;
  name: string;
  imageUrl: string;
  hexCode: string;
  isDefault: boolean;
  sortOrder: number;
}

interface NahfatPreset {
  id: number;
  text: string;
  category: string;
  isActive: boolean;
  sortOrder: number;
}

/* ─── API helpers ─────────────────────────────────────── */
async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`/api${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  if (res.status === 204) return null;
  return res.json();
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "معلّق",
  confirmed: "مؤكّد",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  cancelled: "ملغي",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  shipped: "bg-purple-100 text-purple-800 border-purple-200",
  delivered: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

/* ─── Login Screen ────────────────────────────────────── */
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem("admin_authed", "1");
      onLogin();
    } else {
      setError("كلمة المرور غير صحيحة");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500 mb-4 shadow-lg">
            <Shirt size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">بصمة</h1>
          <p className="text-slate-400 mt-1 text-sm">لوحة التحكم الإدارية</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl">
          <label className="block text-sm font-medium text-slate-300 mb-2">كلمة المرور</label>
          <div className="relative">
            <input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={e => { setPassword(e.target.value); setError(""); }}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="أدخل كلمة المرور"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          <button
            type="submit"
            className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            دخول
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── Sidebar ─────────────────────────────────────────── */
type Section = "dashboard" | "orders" | "teams" | "jerseys" | "nahfat";

const NAV_ITEMS: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "لوحة المعلومات", icon: <LayoutDashboard size={18} /> },
  { id: "orders", label: "الطلبات", icon: <ShoppingBag size={18} /> },
  { id: "teams", label: "الفرق", icon: <Users size={18} /> },
  { id: "jerseys", label: "صور الجيرسيهات", icon: <Shirt size={18} /> },
  { id: "nahfat", label: "النهفات", icon: <Type size={18} /> },
];

function Sidebar({ active, onSelect, onLogout }: { active: Section; onSelect: (s: Section) => void; onLogout: () => void }) {
  return (
    <aside className="w-56 bg-slate-900 border-l border-slate-700 flex flex-col h-screen sticky top-0" dir="rtl">
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700">
        <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center">
          <Shirt size={20} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-white text-sm">بصمة</p>
          <p className="text-xs text-slate-400">الإدارة</p>
        </div>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors text-right ${
              active === item.id
                ? "bg-emerald-500/10 text-emerald-400 border-r-2 border-emerald-500"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 text-slate-400 hover:text-red-400 text-sm py-2 transition-colors"
        >
          <LogOut size={16} />
          خروج
        </button>
      </div>
    </aside>
  );
}

/* ─── Dashboard ─────────────────────────────────────────── */
function Dashboard() {
  const [stats, setStats] = useState<{ totalOrders: number; totalRevenue: number; topTeam: string; popularSize: string } | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch("/orders/stats"),
      apiFetch("/orders"),
    ]).then(([s, o]) => {
      setStats(s);
      setOrders(o);
    }).catch(() => toast.error("فشل تحميل الإحصائيات")).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const pending = orders.filter(o => o.status === "pending").length;
  const confirmed = orders.filter(o => o.status === "confirmed").length;

  return (
    <div dir="rtl">
      <PageHeader title="لوحة المعلومات" subtitle="نظرة عامة على أداء المنصة" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="إجمالي الطلبات" value={stats?.totalOrders ?? 0} icon={<Package size={20} />} color="bg-blue-500" />
        <StatCard label="إجمالي الإيرادات" value={`${(stats?.totalRevenue ?? 0).toFixed(0)} د.أ`} icon={<BarChart3 size={20} />} color="bg-emerald-500" />
        <StatCard label="طلبات معلّقة" value={pending} icon={<RefreshCw size={20} />} color="bg-yellow-500" />
        <StatCard label="طلبات مؤكّدة" value={confirmed} icon={<TrendingUp size={20} />} color="bg-purple-500" />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">آخر الطلبات</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs">
              <tr>
                <th className="text-right px-4 py-3 font-medium">العميل</th>
                <th className="text-right px-4 py-3 font-medium">الفريق</th>
                <th className="text-right px-4 py-3 font-medium">المبلغ</th>
                <th className="text-right px-4 py-3 font-medium">الحالة</th>
                <th className="text-right px-4 py-3 font-medium">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.slice(0, 8).map(o => (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{o.customerName}</td>
                  <td className="px-4 py-3 text-slate-600">{o.teamName}</td>
                  <td className="px-4 py-3 text-slate-700">{o.totalPrice} د.أ</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[o.status]}`}>
                      {STATUS_LABELS[o.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{new Date(o.createdAt).toLocaleDateString("ar-JO")}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">لا توجد طلبات بعد</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4" dir="rtl">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${color} mb-3`}>
        <span className="text-white">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

/* ─── Orders ──────────────────────────────────────────── */
function OrdersSection() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch("/admin/orders")
      .then(setOrders)
      .catch(() => toast.error("فشل تحميل الطلبات"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(id: number, status: OrderStatus) {
    setUpdatingId(id);
    try {
      await apiFetch(`/admin/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      toast.success("تم تحديث الحالة");
    } catch {
      toast.error("فشل تحديث الحالة");
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) return <PageLoader />;

  return (
    <div dir="rtl">
      <PageHeader title="إدارة الطلبات" subtitle={`${orders.length} طلب إجمالاً`}>
        <button onClick={load} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg px-3 py-1.5">
          <RefreshCw size={14} />
          تحديث
        </button>
      </PageHeader>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs">
              <tr>
                <th className="text-right px-4 py-3 font-medium">#</th>
                <th className="text-right px-4 py-3 font-medium">العميل</th>
                <th className="text-right px-4 py-3 font-medium">الهاتف</th>
                <th className="text-right px-4 py-3 font-medium">المدينة</th>
                <th className="text-right px-4 py-3 font-medium">الفريق / الرقم</th>
                <th className="text-right px-4 py-3 font-medium">المقاس</th>
                <th className="text-right px-4 py-3 font-medium">الكمية</th>
                <th className="text-right px-4 py-3 font-medium">المبلغ</th>
                <th className="text-right px-4 py-3 font-medium">الحالة</th>
                <th className="text-right px-4 py-3 font-medium">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map(o => (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-400 font-mono">#{o.id}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{o.customerName}</td>
                  <td className="px-4 py-3 text-slate-600 font-mono dir-ltr" dir="ltr">{o.customerPhone}</td>
                  <td className="px-4 py-3 text-slate-600">{o.customerCity}</td>
                  <td className="px-4 py-3 text-slate-600">{o.teamName} / {o.jerseyNumber}</td>
                  <td className="px-4 py-3 text-slate-600">{o.size}</td>
                  <td className="px-4 py-3 text-slate-600">{o.quantity}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{o.totalPrice} د.أ</td>
                  <td className="px-4 py-3">
                    <StatusDropdown
                      status={o.status}
                      disabled={updatingId === o.id}
                      onChange={s => updateStatus(o.id, s)}
                    />
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{new Date(o.createdAt).toLocaleDateString("ar-JO")}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-slate-400">لا توجد طلبات بعد</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusDropdown({ status, disabled, onChange }: { status: OrderStatus; disabled: boolean; onChange: (s: OrderStatus) => void }) {
  const [open, setOpen] = useState(false);
  const statuses: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

  return (
    <div className="relative">
      <button
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[status]} hover:opacity-80 transition-opacity`}
      >
        {STATUS_LABELS[status]}
        <ChevronDown size={10} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 right-0 z-50 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-28">
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => { onChange(s); setOpen(false); }}
              className={`w-full text-right px-3 py-1.5 text-xs hover:bg-slate-50 flex items-center justify-between gap-2 ${s === status ? "font-semibold" : ""}`}
            >
              {STATUS_LABELS[s]}
              {s === status && <Check size={10} className="text-emerald-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Teams ─────────────────────────────────────────────── */
function TeamsSection() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/admin/teams")
      .then(setTeams)
      .catch(() => toast.error("فشل تحميل الفرق"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div dir="rtl">
      <PageHeader title="الفرق" subtitle={`${teams.length} فريق مسجّل`} />

      <div className="grid gap-4">
        {teams.map(team => (
          <div key={team.id} className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl border-2 border-white shadow-md flex-shrink-0"
                  style={{ backgroundColor: team.primaryColor }}
                />
                <div>
                  <h3 className="font-bold text-slate-800">{team.name}</h3>
                  <p className="text-sm text-slate-500">{team.nameEn} · {team.league}</p>
                </div>
              </div>
              <div className="text-left flex-shrink-0">
                <p className="font-bold text-slate-800">{team.basePrice} د.أ</p>
                <p className="text-xs text-slate-400">{team.orderCount} طلب</p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 items-center">
              <span className="text-xs text-slate-500">الألوان المتاحة:</span>
              {team.availableColors.map((c, i) => (
                <span key={i} className="w-5 h-5 rounded-full border border-white shadow-sm" style={{ backgroundColor: c }} title={c} />
              ))}
              <span className="text-xs text-slate-400 mr-2">المقاسات: {team.availableSizes.join(" · ")}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Jersey Images ─────────────────────────────────────── */
function JerseysSection() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [colors, setColors] = useState<JerseyColor[]>([]);
  const [loading, setLoading] = useState(true);
  const [colorsLoading, setColorsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newHex, setNewHex] = useState("#ffffff");
  const [newIsDefault, setNewIsDefault] = useState(false);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { uploadFile, isUploading, progress } = useUpload({
    onSuccess: (response) => {
      const publicPath = `/api/storage/objects${response.objectPath}`;
      setUploadedPath(publicPath);
      toast.success("تم رفع الصورة");
    },
    onError: () => toast.error("فشل رفع الصورة"),
  });

  useEffect(() => {
    apiFetch("/admin/teams")
      .then(setTeams)
      .catch(() => toast.error("فشل تحميل الفرق"))
      .finally(() => setLoading(false));
  }, []);

  function selectTeam(team: Team) {
    setSelectedTeam(team);
    setColors([]);
    setShowAddForm(false);
    setColorsLoading(true);
    apiFetch(`/admin/teams/${team.id}/colors`)
      .then(setColors)
      .catch(() => toast.error("فشل تحميل الألوان"))
      .finally(() => setColorsLoading(false));
  }

  async function handleDelete(colorId: number) {
    if (!selectedTeam) return;
    try {
      await apiFetch(`/admin/teams/${selectedTeam.id}/colors/${colorId}`, { method: "DELETE" });
      setColors(prev => prev.filter(c => c.id !== colorId));
      toast.success("تم الحذف");
    } catch {
      toast.error("فشل الحذف");
    }
  }

  async function handleAdd() {
    if (!selectedTeam || !newName || !uploadedPath) {
      toast.error("يرجى اختيار صورة وإدخال الاسم");
      return;
    }
    setSaving(true);
    try {
      const color = await apiFetch(`/admin/teams/${selectedTeam.id}/colors`, {
        method: "POST",
        body: JSON.stringify({
          name: newName,
          imageUrl: uploadedPath,
          hexCode: newHex,
          isDefault: newIsDefault,
          sortOrder: colors.length,
        }),
      });
      setColors(prev => [...prev, color]);
      setNewName("");
      setNewHex("#ffffff");
      setNewIsDefault(false);
      setUploadedPath(null);
      setShowAddForm(false);
      toast.success("تم إضافة لون الجيرسيه");
    } catch {
      toast.error("فشل الحفظ");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageLoader />;

  return (
    <div dir="rtl">
      <PageHeader title="صور الجيرسيهات" subtitle="رفع وإدارة صور الجيرسيهات لكل فريق" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team list */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">اختر فريقاً</div>
          <div className="divide-y divide-slate-100 max-h-[calc(100vh-240px)] overflow-y-auto">
            {teams.map(team => (
              <button
                key={team.id}
                onClick={() => selectTeam(team)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-slate-50 transition-colors ${selectedTeam?.id === team.id ? "bg-emerald-50 border-r-2 border-emerald-500" : ""}`}
              >
                <div className="w-7 h-7 rounded-lg flex-shrink-0" style={{ backgroundColor: team.primaryColor }} />
                <div>
                  <p className="text-sm font-medium text-slate-800">{team.name}</p>
                  <p className="text-xs text-slate-400">{team.nameEn}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Colors panel */}
        <div className="lg:col-span-2">
          {!selectedTeam ? (
            <div className="bg-white border border-slate-200 rounded-2xl flex items-center justify-center h-64 text-slate-400 text-sm">
              اختر فريقاً لإدارة صور جيرسيهاته
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800">{selectedTeam.name}</h3>
                  <p className="text-xs text-slate-400">{colors.length} لون مضاف</p>
                </div>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Plus size={14} />
                  إضافة لون
                </button>
              </div>

              {/* Add Form */}
              {showAddForm && (
                <div className="p-5 border-b border-slate-100 bg-slate-50">
                  <h4 className="font-medium text-slate-700 mb-4">إضافة لون جيرسيه جديد</h4>

                  {/* Image Upload */}
                  <div className="mb-4">
                    <label className="block text-sm text-slate-600 mb-2">صورة الجيرسيه *</label>
                    {uploadedPath ? (
                      <div className="relative inline-block">
                        <img src={uploadedPath} alt="uploaded" className="w-24 h-28 object-contain rounded-xl border border-slate-200 bg-slate-100" />
                        <button
                          onClick={() => setUploadedPath(null)}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async e => {
                            const file = e.target.files?.[0];
                            if (file) await uploadFile(file);
                          }}
                        />
                        {isUploading ? (
                          <div className="text-center">
                            <RefreshCw size={20} className="animate-spin text-emerald-500 mx-auto mb-1" />
                            <p className="text-xs text-emerald-600">{progress}%</p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <Upload size={20} className="text-slate-400 mx-auto mb-1" />
                            <p className="text-xs text-slate-400">اختر صورة</p>
                          </div>
                        )}
                      </label>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">اسم اللون *</label>
                      <input
                        type="text"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        placeholder="مثال: أبيض، أسود، أحمر"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">كود اللون</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={newHex}
                          onChange={e => setNewHex(e.target.value)}
                          className="w-10 h-9 rounded border border-slate-200 cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={newHex}
                          onChange={e => setNewHex(e.target.value)}
                          className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-300"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="checkbox"
                      id="isDefault"
                      checked={newIsDefault}
                      onChange={e => setNewIsDefault(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="isDefault" className="text-sm text-slate-600">اجعله اللون الافتراضي</label>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleAdd}
                      disabled={saving || isUploading}
                      className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                      <Check size={14} />
                      {saving ? "جاري الحفظ..." : "حفظ"}
                    </button>
                    <button
                      onClick={() => { setShowAddForm(false); setUploadedPath(null); setNewName(""); }}
                      className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                      <X size={14} />
                      إلغاء
                    </button>
                  </div>
                </div>
              )}

              {/* Colors List */}
              {colorsLoading ? (
                <div className="flex items-center justify-center py-12"><RefreshCw size={20} className="animate-spin text-emerald-500" /></div>
              ) : (
                <div className="p-4">
                  {colors.length === 0 ? (
                    <p className="text-center text-slate-400 py-8 text-sm">لا توجد ألوان بعد. أضف أول لون جيرسيه.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {colors.map(c => (
                        <div key={c.id} className="relative group border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                          {c.isDefault && (
                            <div className="absolute top-2 right-2 z-10 bg-emerald-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">افتراضي</div>
                          )}
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="absolute top-2 left-2 z-10 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={10} />
                          </button>
                          <div className="h-28 flex items-center justify-center p-2 bg-white">
                            <img
                              src={c.imageUrl}
                              alt={c.name}
                              className="max-h-full object-contain"
                              onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' fill='%23e2e8f0'%3E%3Crect width='80' height='80'/%3E%3C/svg%3E"; }}
                            />
                          </div>
                          <div className="px-2 py-2 flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded-full border border-slate-200 flex-shrink-0" style={{ backgroundColor: c.hexCode }} />
                            <span className="text-xs font-medium text-slate-700 truncate">{c.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Nahfat ─────────────────────────────────────────────── */
function NahfatSection() {
  const [presets, setPresets] = useState<NahfatPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [editCat, setEditCat] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [addText, setAddText] = useState("");
  const [addCat, setAddCat] = useState("عربي");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch("/admin/nahfat")
      .then(setPresets)
      .catch(() => toast.error("فشل تحميل النهفات"))
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd() {
    if (!addText.trim()) { toast.error("أدخل نص النهفة"); return; }
    setSaving(true);
    try {
      const p = await apiFetch("/admin/nahfat", {
        method: "POST",
        body: JSON.stringify({ text: addText, category: addCat, isActive: true, sortOrder: presets.length }),
      });
      setPresets(prev => [...prev, p]);
      setAddText("");
      setAddCat("عربي");
      setShowAdd(false);
      toast.success("تم إضافة النهفة");
    } catch {
      toast.error("فشل الإضافة");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(id: number) {
    setSaving(true);
    try {
      const p = await apiFetch(`/admin/nahfat/${id}`, {
        method: "PUT",
        body: JSON.stringify({ text: editText, category: editCat }),
      });
      setPresets(prev => prev.map(x => x.id === id ? p : x));
      setEditingId(null);
      toast.success("تم التحديث");
    } catch {
      toast.error("فشل التحديث");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(preset: NahfatPreset) {
    try {
      const p = await apiFetch(`/admin/nahfat/${preset.id}`, {
        method: "PUT",
        body: JSON.stringify({ isActive: !preset.isActive }),
      });
      setPresets(prev => prev.map(x => x.id === preset.id ? p : x));
    } catch {
      toast.error("فشل التحديث");
    }
  }

  async function handleDelete(id: number) {
    try {
      await apiFetch(`/admin/nahfat/${id}`, { method: "DELETE" });
      setPresets(prev => prev.filter(x => x.id !== id));
      toast.success("تم الحذف");
    } catch {
      toast.error("فشل الحذف");
    }
  }

  const categories = [...new Set(presets.map(p => p.category))];

  if (loading) return <PageLoader />;

  return (
    <div dir="rtl">
      <PageHeader title="إدارة النهفات" subtitle={`${presets.length} نهفة مسجّلة`}>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus size={14} />
          إضافة نهفة
        </button>
      </PageHeader>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-4">
          <h3 className="font-semibold text-slate-700 mb-3">نهفة جديدة</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-sm text-slate-600 mb-1">نص النهفة *</label>
              <input
                type="text"
                value={addText}
                onChange={e => setAddText(e.target.value)}
                placeholder="مثال: يا محارب ما بتهاب..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">الفئة</label>
              <input
                type="text"
                value={addCat}
                onChange={e => setAddCat(e.target.value)}
                placeholder="مثال: عربي، إنجليزي"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleAdd}
              disabled={saving}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Check size={14} />
              {saving ? "جاري الحفظ..." : "حفظ"}
            </button>
            <button
              onClick={() => { setShowAdd(false); setAddText(""); }}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg"
            >
              <X size={14} />
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Presets by category */}
      {(categories.length ? categories : [""]).map(cat => {
        const catPresets = presets.filter(p => cat === "" || p.category === cat);
        if (catPresets.length === 0) return null;
        return (
          <div key={cat} className="bg-white border border-slate-200 rounded-2xl overflow-hidden mb-4">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
              <span className="text-sm font-semibold text-slate-600">{cat || "عام"}</span>
              <span className="text-xs text-slate-400 mr-2">({catPresets.length})</span>
            </div>
            <div className="divide-y divide-slate-100">
              {catPresets.map(p => (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                  {editingId === p.id ? (
                    <>
                      <input
                        type="text"
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                      />
                      <input
                        type="text"
                        value={editCat}
                        onChange={e => setEditCat(e.target.value)}
                        className="w-24 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                      />
                      <button onClick={() => handleEdit(p.id)} disabled={saving} className="text-emerald-600 hover:text-emerald-700">
                        <Check size={16} />
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-600">
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <p className={`flex-1 text-sm ${p.isActive ? "text-slate-800" : "text-slate-400 line-through"}`}>{p.text}</p>
                      <button
                        onClick={() => toggleActive(p)}
                        className={`text-xs px-2 py-0.5 rounded-full border font-medium transition-colors ${p.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"}`}
                      >
                        {p.isActive ? "مفعّل" : "معطّل"}
                      </button>
                      <button
                        onClick={() => { setEditingId(p.id); setEditText(p.text); setEditCat(p.category); }}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {presets.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl py-12 text-center text-slate-400 text-sm">
          لا توجد نهفات بعد. أضف أول نهفة!
        </div>
      )}
    </div>
  );
}

/* ─── Shared helpers ──────────────────────────────────────── */
function PageLoader() {
  return (
    <div className="flex items-center justify-center py-16">
      <RefreshCw size={24} className="animate-spin text-emerald-500" />
    </div>
  );
}

function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-6" dir="rtl">
      <div>
        <h1 className="text-xl font-bold text-slate-800">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {children && <div className="flex gap-2">{children}</div>}
    </div>
  );
}

/* ─── Main App ──────────────────────────────────────────────── */
export default function App() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("admin_authed") === "1");
  const [section, setSection] = useState<Section>("dashboard");

  if (!authed) {
    return (
      <>
        <LoginScreen onLogin={() => setAuthed(true)} />
        <Toaster position="top-center" richColors />
      </>
    );
  }

  function logout() {
    sessionStorage.removeItem("admin_authed");
    setAuthed(false);
  }

  return (
    <div className="flex min-h-screen bg-slate-100" dir="rtl">
      <Sidebar active={section} onSelect={setSection} onLogout={logout} />
      <main className="flex-1 p-6 overflow-y-auto">
        {section === "dashboard" && <Dashboard />}
        {section === "orders" && <OrdersSection />}
        {section === "teams" && <TeamsSection />}
        {section === "jerseys" && <JerseysSection />}
        {section === "nahfat" && <NahfatSection />}
      </main>
      <Toaster position="top-center" richColors />
    </div>
  );
}
