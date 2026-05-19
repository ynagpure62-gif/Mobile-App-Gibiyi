import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  CheckSquare, 
  Users, 
  Settings, 
  TrendingUp, 
  CreditCard, 
  AlertTriangle, 
  IndianRupee, 
  Search, 
  Plus, 
  Check, 
  X, 
  Copy, 
  ExternalLink,
  Smartphone,
  Eye,
  RefreshCw,
  Clock,
  ShieldCheck,
  Package,
  FileText
} from 'lucide-react';

// Interfaces
interface Product {
  id: string | number;
  title: string;
  category: string;
  price: number;
  stock: string | number;
  description: string;
  image_url?: string;
  created_at?: string;
}

interface PaymentProof {
  id: string;
  orderId: string;
  customerName: string;
  amount: number;
  utr: string;
  timestamp: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  screenshotUrl: string | null;
  notes?: string;
}

// Mock initial database products (Gibiyi / Custom Logo Store theme)
const initialProducts: Product[] = [
  { id: '1', title: 'Dynamic Tech Glow Logo', category: 'Custom Logo', price: 149.00, stock: 'Unlimited', description: 'Modern neon vector branding for tech startups, fully layered with glowing styles.', image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80' },
  { id: '2', title: 'Minimalist Signature Logo', category: 'Custom Logo', price: 99.00, stock: 'Unlimited', description: 'Clean, elegant, bespoke cursive typography logo representing premium personal branding.', image_url: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=400&q=80' },
  { id: '3', title: 'Gibiyi Store Premium Template', category: 'Web Templates', price: 299.00, stock: 12, description: 'Fully custom Expo Router e-commerce application template with pre-built screens.', image_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80' },
  { id: '4', title: 'Retro Badge Vector Pack', category: 'Asset Kits', price: 49.00, stock: 150, description: 'Over 50 hand-crafted vector badges, retro stamps, and customizable label textures.', image_url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=400&q=80' },
  { id: '5', title: 'Ultimate Brand Guild Book', category: 'E-Books', price: 29.00, stock: 'Unlimited', description: 'Comprehensive guide to building consistent UI/UX, defining color palettes, and copywriting.', image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80' },
];

// Mock payment proofs submitted via the manual checkout flows (such as QR payments)
const initialProofs: PaymentProof[] = [
  {
    id: 'proof-101',
    orderId: 'GBY-9204',
    customerName: 'Aniket Sharma',
    amount: 149.00,
    utr: '349208392019',
    timestamp: '10 mins ago',
    status: 'Pending',
    screenshotUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=600&q=80',
    notes: 'Paid via GPay. Please deliver the design files to aniket.sharma@example.com'
  },
  {
    id: 'proof-102',
    orderId: 'GBY-9198',
    customerName: 'Rajesh Kumar',
    amount: 299.00,
    utr: '829302830128',
    timestamp: '2 hours ago',
    status: 'Pending',
    screenshotUrl: 'https://images.unsplash.com/photo-1563013544-824ae1d704d3?auto=format&fit=crop&w=600&q=80',
    notes: 'Transaction successful, UTR matches. Please activate account access.'
  },
  {
    id: 'proof-103',
    orderId: 'GBY-9184',
    customerName: 'Sofia Patel',
    amount: 99.00,
    utr: '120392019382',
    timestamp: 'Yesterday',
    status: 'Approved',
    screenshotUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=600&q=80',
    notes: 'Verified and manual confirmation email sent.'
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'payments' | 'sessions'>('overview');
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [proofs, setProofs] = useState<PaymentProof[]>(initialProofs);
  const [liveStats, setLiveStats] = useState<{
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    logoRequests: any[];
  } | null>(null);
  
  // Search & Filters state
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProof, setSelectedProof] = useState<PaymentProof | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  
  // API Sync Status
  const [apiConnection, setApiConnection] = useState<'detecting' | 'connected' | 'fallback'>('detecting');
  const [backendUrl] = useState('http://localhost:8080');

  // New Product Form State
  const [newProduct, setNewProduct] = useState({
    title: '',
    category: 'Custom Logo',
    price: '',
    stock: 'Unlimited',
    description: '',
    image_url: ''
  });

  // Toasts / Custom notifications
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info' | 'error'} | null>(null);

  const triggerToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Detect local backend server (api-server)
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500); // 1.5 second timeout
        
        // Fetch products endpoint directly to verify connection and load listings
        const response = await fetch(`${backendUrl}/api/products`, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (response.ok) {
          setApiConnection('connected');
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            // Remap database fields (like imageUrl to image_url)
            const mapped = data.map((p: any) => ({
              id: p.id,
              title: p.title,
              category: p.category,
              price: parseFloat(p.price || "0"),
              stock: p.stock || 'Unlimited',
              description: p.description || 'No description provided.',
              image_url: (p.imageUrl || p.image_url) 
                ? ((p.imageUrl || p.image_url).startsWith('http') 
                   ? (p.imageUrl || p.image_url) 
                   : `${backendUrl}${p.imageUrl || p.image_url}`)
                : 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=400&q=80',
            }));
            setProducts(mapped);
          }
          
          // Fetch Live Admin statistics
          try {
            const statsRes = await fetch(`${backendUrl}/api/admin/stats`);
            if (statsRes.ok) {
              const statsData = await statsRes.json();
              setLiveStats(statsData);
            }
          } catch (err) {
            console.error("Failed to load admin stats:", err);
          }

          // Fetch Live orders and map to payment proof list
          try {
            const ordersRes = await fetch(`${backendUrl}/api/admin/orders`);
            if (ordersRes.ok) {
              const ordersData = await ordersRes.json();
              if (Array.isArray(ordersData)) {
                console.log(`Successfully fetched ${ordersData.length} orders from backend`);
                const mappedOrders = ordersData.map((order: any) => {
                  // Build full URL for screenshot if it's a relative path
                  let screenshotUrl = order.screenshotUrl || null;
                  if (screenshotUrl && screenshotUrl.startsWith('/')) {
                    screenshotUrl = `${backendUrl}${screenshotUrl}`;
                  }
                  return {
                    id: `proof-${order.id}`,
                    orderId: `GBY-${1000 + order.id}`,
                    customerName: order.userEmail || (order.userId && order.userId.startsWith('user_') ? `Client (${order.userId.slice(0, 8)})` : `Client`),
                    amount: parseFloat(order.totalAmount || "0"),
                    utr: order.utr || `TXN${912830200000 + order.id}`,
                    timestamp: new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    status: (order.status === 'completed' ? 'Approved' : order.status === 'rejected' ? 'Rejected' : 'Pending') as 'Approved' | 'Pending' | 'Rejected',
                    screenshotUrl,
                    notes: order.items?.map((it: any) => it.product?.title).join(', ') || 'Checkout sequence'
                  };
                });
                setProofs(mappedOrders);
              }
            } else {
              console.error("Backend orders fetch failed with status:", ordersRes.status);
            }
          } catch (err) {
            console.error("Failed to load live orders from", backendUrl, err);
          }

          // Fetch Live Users
          try {
            const usersRes = await fetch(`${backendUrl}/api/admin/users`);
            if (usersRes.ok) {
              const usersData = await usersRes.json();
              setDbUsers(usersData);
            }
          } catch (err) {
            console.error("Failed to load live users:", err);
          }

          triggerToast('Successfully synced with live E-Commerce Database!', 'success');
        } else {
          setApiConnection('fallback');
        }
      } catch (e) {
        setApiConnection('fallback');
      }
    };
    checkBackend();
  }, [backendUrl]);

  // Handle adding new product
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.title || !newProduct.price) {
      triggerToast('Please provide a title and price', 'error');
      return;
    }

    const payload = {
      title: newProduct.title,
      description: newProduct.description || "No description provided.",
      price: parseFloat(newProduct.price).toFixed(2),
      category: newProduct.category,
      style: "Minimalist",
      imageUrl: newProduct.image_url || 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=400&q=80',
      featured: false,
      popularity: Math.floor(Math.random() * 50) + 10,
    };

    if (apiConnection === 'connected') {
      fetch(`${backendUrl}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      .then(res => {
        if (!res.ok) throw new Error('Failed to save to database');
        return res.json();
      })
      .then((createdFromDb: any) => {
        const imgPath = createdFromDb.imageUrl || createdFromDb.image_url;
        const mappedProduct: Product = {
          id: createdFromDb.id,
          title: createdFromDb.title,
          category: createdFromDb.category,
          price: parseFloat(createdFromDb.price || "0"),
          stock: createdFromDb.stock || 'Unlimited',
          description: createdFromDb.description || 'No description provided.',
          image_url: imgPath 
            ? (imgPath.startsWith('http') ? imgPath : `${backendUrl}${imgPath}`) 
            : 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=400&q=80',
        };
        setProducts([mappedProduct, ...products]);
        setIsAddModalOpen(false);
        triggerToast(`"${mappedProduct.title}" successfully saved to live database!`, 'success');
        
        // Refresh stats dynamically
        fetch(`${backendUrl}/api/admin/stats`)
          .then(res => res.json())
          .then(stats => setLiveStats(stats))
          .catch(err => console.error(err));
      })
      .catch(err => {
        console.error(err);
        triggerToast('Database save failed, added in simulator mode.', 'error');
        // fallback
        const localCreated: Product = {
          id: `prod-${Date.now()}`,
          title: newProduct.title,
          category: newProduct.category,
          price: parseFloat(newProduct.price),
          stock: newProduct.stock === 'Unlimited' ? 'Unlimited' : parseInt(newProduct.stock) || 0,
          description: newProduct.description || 'No description provided.',
          image_url: newProduct.image_url || 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=400&q=80',
        };
        setProducts([localCreated, ...products]);
        setIsAddModalOpen(false);
      });
    } else {
      const localCreated: Product = {
        id: `prod-${Date.now()}`,
        title: newProduct.title,
        category: newProduct.category,
        price: parseFloat(newProduct.price),
        stock: newProduct.stock === 'Unlimited' ? 'Unlimited' : parseInt(newProduct.stock) || 0,
        description: newProduct.description || 'No description provided.',
        image_url: newProduct.image_url || 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=400&q=80',
      };
      setProducts([localCreated, ...products]);
      setIsAddModalOpen(false);
      triggerToast(`"${localCreated.title}" successfully added in simulator mode!`, 'success');
    }

    // Reset form
    setNewProduct({
      title: '',
      category: 'Custom Logo',
      price: '',
      stock: 'Unlimited',
      description: '',
      image_url: ''
    });
  };

  // Handle payment approval
  const handleApprovePayment = (id: string) => {
    const dbId = id.replace('proof-', '');
    if (apiConnection === 'connected') {
      fetch(`${backendUrl}/api/admin/orders/${dbId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      })
      .then(res => {
        if (!res.ok) throw new Error('Failed to update status in database');
        return res.json();
      })
      .then(() => {
        setProofs(prev => prev.map(p => p.id === id ? { ...p, status: 'Approved' } : p));
        const approvedProof = proofs.find(p => p.id === id);
        triggerToast(`Order ${approvedProof?.orderId} manual payment successfully verified in database!`, 'success');
        setSelectedProof(null);
        
        // Refresh stats dynamically
        fetch(`${backendUrl}/api/admin/stats`)
          .then(res => res.json())
          .then(stats => setLiveStats(stats))
          .catch(err => console.error(err));
      })
      .catch(err => {
        console.error(err);
        triggerToast('Failed to update database, approved locally.', 'error');
        setProofs(prev => prev.map(p => p.id === id ? { ...p, status: 'Approved' } : p));
        setSelectedProof(null);
      });
    } else {
      setProofs(prev => prev.map(p => p.id === id ? { ...p, status: 'Approved' } : p));
      const approvedProof = proofs.find(p => p.id === id);
      triggerToast(`Order ${approvedProof?.orderId} manual payment successfully verified!`, 'success');
      setSelectedProof(null);
    }
  };

  // Handle payment rejection
  const handleRejectPayment = (id: string) => {
    const dbId = id.replace('proof-', '');
    if (apiConnection === 'connected') {
      fetch(`${backendUrl}/api/admin/orders/${dbId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' }),
      })
      .then(res => {
        if (!res.ok) throw new Error('Failed to update status in database');
        return res.json();
      })
      .then(() => {
        setProofs(prev => prev.map(p => p.id === id ? { ...p, status: 'Rejected' } : p));
        const rejectedProof = proofs.find(p => p.id === id);
        triggerToast(`Order ${rejectedProof?.orderId} payment proof rejected in database.`, 'info');
        setSelectedProof(null);
        
        // Refresh stats dynamically
        fetch(`${backendUrl}/api/admin/stats`)
          .then(res => res.json())
          .then(stats => setLiveStats(stats))
          .catch(err => console.error(err));
      })
      .catch(err => {
        console.error(err);
        triggerToast('Failed to update database, rejected locally.', 'error');
        setProofs(prev => prev.map(p => p.id === id ? { ...p, status: 'Rejected' } : p));
        setSelectedProof(null);
      });
    } else {
      setProofs(prev => prev.map(p => p.id === id ? { ...p, status: 'Rejected' } : p));
      const rejectedProof = proofs.find(p => p.id === id);
      triggerToast(`Order ${rejectedProof?.orderId} payment proof rejected.`, 'info');
      setSelectedProof(null);
    }
  };

  // Copy UTR to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    triggerToast('UTR Number copied to clipboard!', 'info');
  };

  // Computed Metrics
  const totalRevenue = liveStats
    ? liveStats.totalRevenue
    : proofs
        .filter(p => p.status === 'Approved')
        .reduce((sum, p) => sum + p.amount, 1420.00); // 1420.00 base simulated previous sales

  const pendingPaymentsCount = proofs.filter(p => p.status === 'Pending').length;
  const totalOrdersCount = liveStats ? liveStats.totalOrders : proofs.length + 42; // Mock total historical orders

  // Categories list
  const categories = ['All', 'Custom Logo', 'Web Templates', 'Asset Kits', 'E-Books'];

  // Filtered products list
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(productSearch.toLowerCase()) || 
                          p.category.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex min-h-screen bg-[#06060c] text-slate-100 selection:bg-violet-500 selection:text-white">
      
      {/* --- TOAST NOTIFICATION --- */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl glass-panel shadow-2xl border-l-4 animate-bounce max-w-sm duration-300"
          style={{ 
            borderColor: notification.type === 'success' ? '#10b981' : notification.type === 'error' ? '#f43f5e' : '#8b5cf6',
            boxShadow: notification.type === 'success' ? '0 10px 30px -10px rgba(16, 185, 129, 0.3)' : '0 10px 30px -10px rgba(139, 92, 246, 0.3)'
          }}>
          <div className={`p-1.5 rounded-lg ${
            notification.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
            notification.type === 'error' ? 'bg-rose-500/20 text-rose-400' : 'bg-violet-500/20 text-violet-400'
          }`}>
            {notification.type === 'success' ? <Check size={18} /> : notification.type === 'error' ? <X size={18} /> : <FileText size={18} />}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{notification.message}</p>
          </div>
        </div>
      )}

      {/* --- SIDEBAR --- */}
      <aside className="w-72 bg-[#090912] border-r border-slate-800/60 p-6 flex flex-col justify-between hidden md:flex">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20 border border-violet-400/20">
              <span className="font-black text-xl text-white tracking-wider">G</span>
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white mb-0">Gibiyi Admin</h2>
              <p className="text-xs text-slate-500">Workspace Dashboard</p>
            </div>
          </div>

          {/* Quick Stats Panel */}
          <div className="p-4 rounded-xl bg-violet-950/15 border border-violet-900/30 mb-8">
            <div className="flex items-center gap-2 mb-1.5">
              <Smartphone size={14} className="text-violet-400" />
              <span className="text-xs font-semibold text-violet-300 uppercase tracking-wider">Mobile App Sync</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-2">Connected devices can load the app via Expo and push orders.</p>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-medium text-emerald-400">exp://192.168.31.46:8081</span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1.5">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'overview' 
                  ? 'bg-violet-600/15 text-violet-400 border border-violet-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 border border-transparent'
              }`}
            >
              <LayoutDashboard size={18} />
              Overview & Analytics
            </button>
            
            <button 
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'products' 
                  ? 'bg-violet-600/15 text-violet-400 border border-violet-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 border border-transparent'
              }`}
            >
              <ShoppingBag size={18} />
              Manage Products
              <span className="ml-auto text-xs font-semibold bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-700/50">{products.length}</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('payments')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'payments' 
                  ? 'bg-violet-600/15 text-violet-400 border border-violet-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 border border-transparent'
              }`}
            >
              <CheckSquare size={18} />
              Verify QR Payments
              {pendingPaymentsCount > 0 && (
                <span className="ml-auto text-xs font-bold bg-rose-500 text-white px-2 py-0.5 rounded-full animate-pulse">{pendingPaymentsCount}</span>
              )}
            </button>
            
            <button 
              onClick={() => setActiveTab('sessions')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'sessions' 
                  ? 'bg-violet-600/15 text-violet-400 border border-violet-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 border border-transparent'
              }`}
            >
              <Users size={18} />
              Database Users
            </button>
          </nav>
        </div>

        {/* Footer info */}
        <div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/50 mb-4">
            <div className="h-9 w-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-semibold border border-indigo-500/20">
              AD
            </div>
            <div>
              <p className="text-xs font-bold text-white mb-0">Administrator</p>
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></span> Active Session
              </span>
            </div>
          </div>
          <p className="text-[10px] text-slate-600 text-center">Gibiyi Core v1.0.4 &copy; 2026</p>
        </div>
      </aside>

      {/* --- MAIN PAGE CONTENT --- */}
      <main className="flex-1 flex flex-col min-h-screen">
        
        {/* HEADER */}
        <header className="h-18 bg-[#080811]/70 backdrop-blur-md border-b border-slate-800/40 px-6 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2 mb-0">
              {activeTab === 'overview' && 'Overview Analytics'}
              {activeTab === 'products' && 'Product Catalogue'}
              {activeTab === 'payments' && 'Payment Verification Queue'}
              {activeTab === 'sessions' && 'Workspace User Database'}
            </h1>
          </div>

          {/* Connection badge & search */}
          <div className="flex items-center gap-4">
            {/* Sync Indicators */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
              apiConnection === 'connected' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
              apiConnection === 'detecting' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
              'bg-violet-500/10 text-violet-400 border-violet-500/20'
            }`}>
              <span className={`relative flex h-2 w-2`}>
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  apiConnection === 'connected' ? 'bg-emerald-400' :
                  apiConnection === 'detecting' ? 'bg-amber-400' : 'bg-violet-400'
                }`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  apiConnection === 'connected' ? 'bg-emerald-500' :
                  apiConnection === 'detecting' ? 'bg-amber-500' : 'bg-violet-500'
                }`}></span>
              </span>
              <span>
                {apiConnection === 'connected' && 'API: Live Connected'}
                {apiConnection === 'detecting' && 'API: Syncing...'}
                {apiConnection === 'fallback' && 'API: Fallback Simulator'}
              </span>
            </div>

            <div className="h-4 w-px bg-slate-800"></div>

            {/* Reload button */}
            <button 
              onClick={() => {
                setApiConnection('detecting');
                triggerToast('Syncing with api-server databases...', 'info');
              }}
              className="p-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-lg hover:bg-slate-800 transition-colors"
              title="Refresh connection"
            >
              <RefreshCw size={15} className={`${apiConnection === 'detecting' ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* CONTAINER */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">

          {/* --- TAB 1: OVERVIEW & ANALYTICS --- */}
          {activeTab === 'overview' && (
            <>
              {/* Stat Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Total Revenue */}
                <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Revenue</p>
                      <h3 className="text-3xl font-extrabold text-white tracking-tight">₹{totalRevenue.toFixed(2)}</h3>
                    </div>
                    <div className="p-3 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                      <IndianRupee size={20} />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-xs font-bold text-emerald-400">
                    <TrendingUp size={14} />
                    <span>+12.4%</span>
                    <span className="text-slate-500 font-normal ml-1">vs last week</span>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-violet-500 to-indigo-500"></div>
                </div>

                {/* Total Orders */}
                <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Orders</p>
                      <h3 className="text-3xl font-extrabold text-white tracking-tight">{totalOrdersCount}</h3>
                    </div>
                    <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      <CreditCard size={20} />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs font-bold text-indigo-400">
                    <Clock size={14} className="animate-spin" />
                    <span>{proofs.length} checkout sessions today</span>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-blue-500"></div>
                </div>

                {/* Pending Payments Queue */}
                <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Pending QR Approvals</p>
                      <h3 className="text-3xl font-extrabold text-white tracking-tight">{pendingPaymentsCount}</h3>
                    </div>
                    <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <AlertTriangle size={20} />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-xs">
                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
                    <span className="text-rose-400 font-bold">Needs Manual UTR Review</span>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-rose-500 to-amber-500"></div>
                </div>

                {/* Catalogue Products */}
                <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Active Listings</p>
                      <h3 className="text-3xl font-extrabold text-white tracking-tight">{products.length}</h3>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <ShoppingBag size={20} />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-xs text-slate-400">
                    <Package size={14} className="text-emerald-400" />
                    <span>Integrated databases & assets</span>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                </div>

              </div>

              {/* Charts & Graphs Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Sales Analytics Chart (Custom SVG!) */}
                <div className="glass-panel p-6 rounded-2xl lg:col-span-2">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h4 className="text-base font-bold text-white mb-0">Sales Revenue Trend</h4>
                      <p className="text-xs text-slate-400">Hourly sales analytics on your Wi-Fi testing node</p>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <span className="px-3 py-1 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 font-bold">Today</span>
                      <span className="px-3 py-1 rounded-full text-slate-400 hover:text-slate-300 hover:bg-slate-800">Weekly</span>
                    </div>
                  </div>

                  {/* Bulletproof SVG Line Chart */}
                  <div className="relative w-full h-64 mt-4 bg-slate-950/40 rounded-xl border border-slate-900 p-4 flex items-end justify-between">
                    <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none">
                      <div className="w-full border-b border-slate-900/80 text-[10px] text-slate-600 pb-1 flex justify-between">
                        <span>₹50,000</span>
                        <span></span>
                      </div>
                      <div className="w-full border-b border-slate-900/80 text-[10px] text-slate-600 pb-1 flex justify-between">
                        <span>₹25,000</span>
                        <span></span>
                      </div>
                      <div className="w-full border-b border-slate-900/80 text-[10px] text-slate-600 pb-1 flex justify-between">
                        <span>₹12,500</span>
                        <span></span>
                      </div>
                      <div className="w-full text-[10px] text-slate-600 flex justify-between">
                        <span>₹0</span>
                        <span></span>
                      </div>
                    </div>

                    {/* SVG Curve */}
                    <svg className="absolute inset-0 h-full w-full p-4 overflow-hidden" viewBox="0 0 600 220" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="glowGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      {/* Area beneath path */}
                      <path 
                        d="M 20 200 Q 110 80 180 140 T 320 50 T 450 110 T 600 30 L 600 220 L 20 220 Z" 
                        fill="url(#glowGrad)" 
                        className="transition-all duration-700"
                      />
                      {/* Stroke path */}
                      <path 
                        d="M 20 200 Q 110 80 180 140 T 320 50 T 450 110 T 600 30" 
                        fill="none" 
                        stroke="#8b5cf6" 
                        strokeWidth="3.5" 
                        strokeLinecap="round"
                        className="transition-all duration-700"
                      />
                      {/* Indicator Circles */}
                      <circle cx="180" cy="140" r="5" fill="#c084fc" stroke="#080810" strokeWidth="2" />
                      <circle cx="320" cy="50" r="5" fill="#c084fc" stroke="#080810" strokeWidth="2" />
                      <circle cx="600" cy="30" r="6" fill="#10b981" stroke="#080810" strokeWidth="2" />
                    </svg>

                    {/* Chart Labels */}
                    <div className="w-full flex justify-between text-[11px] font-semibold text-slate-500 px-4 mt-auto pt-2 z-10 pointer-events-none">
                      <span>09:00 AM</span>
                      <span>12:00 PM</span>
                      <span>03:00 PM</span>
                      <span>06:00 PM</span>
                      <span>09:00 PM</span>
                    </div>
                  </div>
                </div>

                {/* Recent Activity Logs */}
                <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
                  <div>
                    <h4 className="text-base font-bold text-white mb-4">Core System Logger</h4>
                    <div className="space-y-4">
                      
                      <div className="flex gap-3 items-start text-xs border-b border-slate-900 pb-3">
                        <div className="p-1 rounded bg-violet-500/10 text-violet-400">
                          <Clock size={13} />
                        </div>
                        <div>
                          <p className="text-slate-300 font-medium leading-normal mb-0.5">Admin logged in from Wi-Fi</p>
                          <span className="text-[10px] text-slate-500">192.168.31.46 - Just Now</span>
                        </div>
                      </div>

                      <div className="flex gap-3 items-start text-xs border-b border-slate-900 pb-3">
                        <div className="p-1 rounded bg-emerald-500/10 text-emerald-400">
                          <Check size={13} />
                        </div>
                        <div>
                          <p className="text-slate-300 font-medium leading-normal mb-0.5">Payment #GBY-9184 Verified</p>
                          <span className="text-[10px] text-slate-500">UTR: 120392019382 - 30m ago</span>
                        </div>
                      </div>

                      <div className="flex gap-3 items-start text-xs border-b border-slate-900 pb-3">
                        <div className="p-1 rounded bg-indigo-500/10 text-indigo-400">
                          <Smartphone size={13} />
                        </div>
                        <div>
                          <p className="text-slate-300 font-medium leading-normal mb-0.5">Expo Go Mobile Connected</p>
                          <span className="text-[10px] text-slate-500">Android Device on Local Wi-Fi - 1h ago</span>
                        </div>
                      </div>

                      <div className="flex gap-3 items-start text-xs">
                        <div className="p-1 rounded bg-amber-500/10 text-amber-400">
                          <Settings size={13} />
                        </div>
                        <div>
                          <p className="text-slate-300 font-medium leading-normal mb-0.5">Database schema verified</p>
                          <span className="text-[10px] text-slate-500">Initialized SQLite client - 3h ago</span>
                        </div>
                      </div>

                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      triggerToast('All historical database logs are synchronised.', 'info');
                    }}
                    className="w-full mt-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition-colors"
                  >
                    View All Audit Logs
                  </button>
                </div>

              </div>
            </>
          )}


          {/* --- TAB 2: MANAGE PRODUCTS --- */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              
              {/* Controls bar */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                
                {/* Search */}
                <div className="relative w-full sm:w-80">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                    <Search size={16} />
                  </span>
                  <input 
                    type="text" 
                    placeholder="Search product title..." 
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all"
                  />
                </div>

                {/* Filters and Add */}
                <div className="flex gap-3 w-full sm:w-auto items-center justify-end">
                  {/* Category Filter Pills */}
                  <div className="flex gap-1.5 p-1 bg-slate-950 border border-slate-900 rounded-xl overflow-x-auto">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                          selectedCategory === cat 
                            ? 'bg-violet-600 text-white' 
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Add button */}
                  <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-bold text-white hover:opacity-90 shadow-md shadow-violet-500/10 tracking-tight transition-all shrink-0"
                  >
                    <Plus size={16} />
                    Add Product
                  </button>
                </div>

              </div>

              {/* Products Table/Grid */}
              {filteredProducts.length === 0 ? (
                <div className="glass-panel p-12 rounded-2xl text-center">
                  <Package size={48} className="text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 font-semibold mb-1">No products found</p>
                  <p className="text-xs text-slate-500">Try broadening your search term or selecting another category.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map(prod => (
                    <div key={prod.id} className="glass-card rounded-2xl overflow-hidden flex flex-col justify-between">
                      <div>
                        {/* Image */}
                        <div className="h-44 w-full relative bg-slate-900 border-b border-slate-900">
                          <img 
                            src={prod.image_url} 
                            alt={prod.title} 
                            className="w-full h-full object-contain"
                          />
                          <span className="absolute top-3 left-3 px-2.5 py-1 text-[10px] font-bold bg-[#080811]/90 backdrop-blur-md text-violet-400 border border-violet-500/20 rounded-full">
                            {prod.category}
                          </span>
                        </div>
                        {/* Info */}
                        <div className="p-5 space-y-2">
                          <h4 className="text-base font-bold text-white mb-1 line-clamp-1">{prod.title}</h4>
                          <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{prod.description}</p>
                        </div>
                      </div>

                      {/* Stock and Price */}
                      <div className="px-5 pb-5 pt-3 border-t border-slate-900 flex justify-between items-center">
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-semibold">Stock Status</p>
                          <span className={`text-xs font-bold flex items-center gap-1.5 mt-0.5 ${
                            prod.stock === 'Unlimited' ? 'text-emerald-400' :
                            typeof prod.stock === 'number' && prod.stock <= 15 ? 'text-rose-400' : 'text-slate-300'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              prod.stock === 'Unlimited' ? 'bg-emerald-400' :
                              typeof prod.stock === 'number' && prod.stock <= 15 ? 'bg-rose-400' : 'bg-slate-400'
                            }`}></span>
                            {prod.stock === 'Unlimited' ? 'Unlimited Supply' : `${prod.stock} left`}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-500 uppercase font-semibold">Price</p>
                          <span className="text-lg font-extrabold text-white">₹{parseFloat(prod.price as any).toFixed(2)}</span>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}

            </div>
          )}


          {/* --- TAB 3: VERIFY PAYMENTS (QR AND UTR CHECKS) --- */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              
              <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-900/30 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                    <ShieldCheck size={16} className="text-indigo-400" />
                    Manual QR Code Payment Auditor
                  </h4>
                  <p className="text-xs text-slate-400 leading-normal">
                    Whenever an Android user completes checkout using GPay/PhonePe manual QR code transfer, their submitted proof is sent here. Verify their screenshot matches the UTR in your bank ledger before approving!
                  </p>
                </div>
              </div>

              {/* Grid of Transaction proofs */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* List of transactions */}
                <div className="lg:col-span-2 space-y-4">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Audit Queue</h4>
                  
                  {proofs.length === 0 ? (
                    <div className="glass-panel p-10 rounded-2xl text-center">
                      <Check size={32} className="text-emerald-400 mx-auto mb-2" />
                      <p className="text-slate-300 font-bold">Audit queue clear!</p>
                      <p className="text-xs text-slate-500">No transactions currently need review.</p>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {proofs.map(pf => (
                        <div 
                          key={pf.id}
                          onClick={() => setSelectedProof(pf)}
                          className={`glass-card p-5 rounded-2xl cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border ${
                            selectedProof?.id === pf.id 
                              ? 'border-violet-500/50 bg-violet-600/5 shadow-lg' 
                              : pf.status === 'Pending' ? 'border-amber-500/20' : 'border-slate-800/40'
                          }`}
                        >
                          <div className="flex gap-4 items-center">
                            {/* Icon status */}
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold border ${
                              pf.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              pf.status === 'Rejected' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                              'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}>
                              {pf.status === 'Approved' ? <Check size={16} /> : pf.status === 'Rejected' ? <X size={16} /> : <Clock size={16} />}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-sm">{pf.orderId}</span>
                                <span className="text-[10px] font-semibold text-slate-500">{pf.timestamp}</span>
                              </div>
                              <p className="text-xs text-slate-400 font-medium mb-1">Customer: <span className="text-slate-200">{pf.customerName}</span></p>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-slate-500 font-semibold uppercase">UTR:</span>
                                <code className="text-[11px] text-indigo-300 bg-slate-900 border border-slate-800/80 px-2 py-0.5 rounded font-mono font-bold tracking-wider">{pf.utr}</code>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto border-t sm:border-t-0 border-slate-900 pt-3 sm:pt-0">
                            <div className="text-left sm:text-right">
                              <p className="text-[9px] text-slate-500 uppercase font-semibold">Amount Received</p>
                              <span className="text-base font-extrabold text-white">₹{pf.amount.toFixed(2)}</span>
                            </div>
                            
                            <div className="flex items-center gap-1 text-xs text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1.5 rounded-lg font-bold">
                              <Eye size={13} />
                              <span>Inspect Proof</span>
                            </div>
                          </div>

                        </div>
                      ))}
                    </div>
                  )}

                </div>

                {/* Audit inspector details pane */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Proof Inspector</h4>
                  
                  {selectedProof ? (
                    <div className="glass-panel p-6 rounded-2xl space-y-5 relative">
                      
                      {/* Title and stats */}
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-base font-bold text-white">{selectedProof.orderId}</h4>
                          <span className={`inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                            selectedProof.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            selectedProof.status === 'Rejected' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                            'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            <span className={`h-1 w-1 rounded-full ${
                              selectedProof.status === 'Approved' ? 'bg-emerald-400' :
                              selectedProof.status === 'Rejected' ? 'bg-rose-400' : 'bg-amber-400'
                            }`}></span>
                            {selectedProof.status}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-500 block">Payout Value</span>
                          <span className="text-xl font-black text-white">₹{selectedProof.amount.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Info grid */}
                      <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-4 space-y-3 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Sender Name</span>
                          <span className="text-slate-200 font-bold">{selectedProof.customerName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">UTR / Ref No.</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-indigo-300 font-mono font-bold tracking-wider">{selectedProof.utr}</span>
                            <button 
                              onClick={() => copyToClipboard(selectedProof.utr)}
                              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
                              title="Copy UTR Code"
                            >
                              <Copy size={12} />
                            </button>
                          </div>
                        </div>
                        {selectedProof.notes && (
                          <div className="border-t border-slate-900 pt-2 mt-1">
                            <span className="text-slate-500 block mb-1">Customer notes:</span>
                            <p className="text-slate-300 italic leading-relaxed text-[11px] mb-0">"{selectedProof.notes}"</p>
                          </div>
                        )}
                      </div>

                      {/* Screenshot image lightbox thumbnail */}
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                          <FileText size={13} className="text-indigo-400" />
                          Payment Screenshot Proof
                        </span>
                        {selectedProof.screenshotUrl ? (
                          <div 
                            onClick={() => setLightboxImage(selectedProof.screenshotUrl!)}
                            className="relative h-44 w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-900 group cursor-pointer hover:border-violet-500/40 transition-all shadow-md"
                          >
                            <img 
                              src={selectedProof.screenshotUrl} 
                              alt="Transaction Screenshot proof"
                              className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                            />
                            <div className="absolute inset-0 bg-[#06060c]/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="px-3 py-1.5 rounded-lg bg-[#06060c]/80 backdrop-blur text-xs font-semibold text-white flex items-center gap-1.5 shadow">
                                <ExternalLink size={12} /> Full Image Preview
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="relative h-44 w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex flex-col items-center justify-center gap-2">
                            <FileText size={32} className="text-slate-600" />
                            <p className="text-slate-500 text-xs font-medium">No screenshot uploaded</p>
                            <p className="text-slate-600 text-xs">User did not attach a payment screenshot</p>
                          </div>
                        )}
                      </div>

                      {/* Real Action Buttons */}
                      {selectedProof.status === 'Pending' ? (
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <button 
                            onClick={() => handleRejectPayment(selectedProof.id)}
                            className="py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-rose-950/20 hover:text-rose-400 hover:border-rose-900/40 text-xs font-bold text-slate-300 transition-all flex items-center justify-center gap-1.5"
                          >
                            <X size={14} />
                            Reject proof
                          </button>
                          <button 
                            onClick={() => handleApprovePayment(selectedProof.id)}
                            className="py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-xs font-bold text-white hover:opacity-95 shadow-md shadow-emerald-500/10 transition-all flex items-center justify-center gap-1.5"
                          >
                            <Check size={14} />
                            Approve Order
                          </button>
                        </div>
                      ) : (
                        <div className={`p-3 rounded-xl border text-center text-xs font-bold ${
                          selectedProof.status === 'Approved' ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/15' : 'bg-rose-500/5 text-rose-400 border-rose-500/15'
                        }`}>
                          {selectedProof.status === 'Approved' ? '✓ Transaction Audited & Completed' : '✕ Transaction Rejected'}
                        </div>
                      )}

                    </div>
                  ) : (
                    <div className="glass-panel p-6 rounded-2xl text-center text-slate-500 text-xs flex flex-col justify-center py-20">
                      <Eye size={24} className="mx-auto text-slate-700 mb-2" />
                      <p className="font-semibold">No proof selected</p>
                      <p className="text-slate-600">Select any transaction from the list on the left to review screenshots and UTR numbers.</p>
                    </div>
                  )}

                </div>

              </div>

            </div>
          )}


          {/* --- TAB 4: SESSIONS & DATABASE --- */}
          {activeTab === 'sessions' && (
            <div className="glass-panel p-8 rounded-2xl space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-900">
                <div>
                  <h4 className="text-base font-bold text-white mb-0.5">Database Security Auditor</h4>
                  <p className="text-xs text-slate-400">View real-time customer sessions registered in SQLite</p>
                </div>
                <span className="px-3 py-1 text-xs font-semibold bg-violet-600/10 text-violet-400 border border-violet-500/20 rounded-full">
                  SQLite Instance Active
                </span>
              </div>

              {/* Mock active users table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-900 text-slate-500 font-semibold">
                      <th className="py-3 px-4">User ID</th>
                      <th className="py-3 px-4">Customer Name</th>
                      <th className="py-3 px-4">Authentication Node</th>
                      <th className="py-3 px-4">Session Duration</th>
                      <th className="py-3 px-4">Origin IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60 font-medium">
                    {dbUsers.length === 0 ? (
                      <>
                        <tr className="hover:bg-slate-900/30">
                          <td className="py-3.5 px-4 text-slate-400 font-mono">usr_29381</td>
                          <td className="py-3.5 px-4 text-white font-bold">nikhil.nagpure@gmail.com</td>
                          <td className="py-3.5 px-4 text-indigo-400 font-semibold">Supabase Auth Node</td>
                          <td className="py-3.5 px-4 text-slate-400">12 mins active</td>
                          <td className="py-3.5 px-4 text-slate-500">192.168.31.205 (Mobile)</td>
                        </tr>
                        <tr className="hover:bg-slate-900/30">
                          <td className="py-3.5 px-4 text-slate-400 font-mono">usr_10293</td>
                          <td className="py-3.5 px-4 text-white font-bold">aniket.sharma@gmail.com</td>
                          <td className="py-3.5 px-4 text-indigo-400 font-semibold">Supabase Auth Node</td>
                          <td className="py-3.5 px-4 text-slate-400">30 mins active</td>
                          <td className="py-3.5 px-4 text-slate-500">192.168.31.112 (Mobile)</td>
                        </tr>
                      </>
                    ) : (
                      dbUsers.map((usr, i) => (
                        <tr key={usr.userId} className="hover:bg-slate-900/30">
                          <td className="py-3.5 px-4 text-slate-400 font-mono select-all">
                            {usr.userId.startsWith('user_') ? usr.userId.slice(0, 10) : `usr_${usr.userId.slice(0, 5)}`}
                          </td>
                          <td className="py-3.5 px-4 text-white font-bold select-all">
                            {usr.userEmail || "yashnagpure60@gmail.com"}
                          </td>
                          <td className="py-3.5 px-4 text-indigo-400 font-semibold">Supabase Auth Node</td>
                          <td className="py-3.5 px-4 text-slate-400">
                            Registered {new Date(usr.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">
                            192.168.31.{200 + i} (Mobile)
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </div>

      </main>

      {/* --- ADD PRODUCT MODAL/DRAWER --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000]/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg bg-[#0c0c16] rounded-2xl border border-slate-800 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in duration-200">
            
            {/* Header */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-900">
              <h3 className="text-base font-bold text-white flex items-center gap-2 mb-0">
                <ShoppingBag size={18} className="text-violet-400" />
                Add New Product to Catalogue
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 hover:bg-slate-900 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddProduct} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-400 block mb-1.5">Product Title</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Elegant Shield Handcrafted Logo"
                    value={newProduct.title}
                    onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500/50"
                  />
                </div>
                
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1.5">Category</label>
                  <select 
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-violet-500/50"
                  >
                    <option value="Custom Logo">Custom Logo</option>
                    <option value="Web Templates">Web Templates</option>
                    <option value="Asset Kits">Asset Kits</option>
                    <option value="E-Books">E-Books</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1.5">Price (INR)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    placeholder="e.g. 149.00"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1.5">Stock Allocation</label>
                  <select 
                    value={newProduct.stock === 'Unlimited' ? 'Unlimited' : 'Limited'}
                    onChange={(e) => setNewProduct({ 
                      ...newProduct, 
                      stock: e.target.value === 'Unlimited' ? 'Unlimited' : '50'
                    })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="Unlimited">Unlimited Supply</option>
                    <option value="Limited">Limited (Physical/Inventory)</option>
                  </select>
                </div>

                {newProduct.stock !== 'Unlimited' && (
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1.5">Stock Count</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 50"
                      value={newProduct.stock === 'Unlimited' ? '' : newProduct.stock}
                      onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-violet-500/50"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">Image URL</label>
                <input 
                  type="text" 
                  placeholder="Paste direct Unsplash/image link..."
                  value={newProduct.image_url}
                  onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">Description</label>
                <textarea 
                  rows={3}
                  placeholder="Introduce product features, formats, and design inclusions..."
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500/50 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-900">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-900 text-xs font-bold text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-xs font-bold text-white hover:opacity-95 shadow-md shadow-violet-500/10"
                >
                  Save Product
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* --- SCREENSHOT FULL PREVIEW LIGHTBOX --- */}
      {lightboxImage && (
        <div 
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#000]/90 backdrop-blur-md px-4 cursor-zoom-out animate-in fade-in duration-200"
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center justify-center animate-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setLightboxImage(null)}
              className="absolute -top-12 right-0 p-2.5 bg-slate-900/80 hover:bg-rose-500 hover:text-white text-slate-300 rounded-full border border-slate-800 transition-all cursor-pointer shadow-lg"
              title="Close Fullscreen Preview"
            >
              <X size={20} />
            </button>
            <img 
              src={lightboxImage} 
              alt="Payment screenshot full size proof" 
              className="max-w-full max-h-[80vh] rounded-2xl border border-slate-800 shadow-2xl object-contain bg-slate-950"
            />
            <p className="mt-3.5 text-xs text-slate-400 font-semibold flex items-center gap-2 bg-slate-950/80 border border-slate-900 px-4 py-2 rounded-full shadow-md select-none">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Payment Screenshot Fullsize Proof
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
