import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Star, 
  Ticket, 
  Settings,
  LogOut
} from 'lucide-react';

// Import all sub-pages
import AdminLogin from '../admin/AdminLogin';
import AdminDashboard from '../admin/AdminDashboard';
import AdminProducts from '../admin/AdminProducts';
import AdminOrders from '../admin/AdminOrders';
import AdminCustomers from '../admin/AdminCustomers';
import AdminCategories from '../admin/AdminCategories';
import AdminReviews from '../admin/AdminReviews';
import AdminCoupons from '../admin/AdminCoupons';
import AdminSettings from '../admin/AdminSettings';

// Import API Helpers
import {
  fetchAdminProducts,
  fetchAdminOrders,
  updateAdminOrderStatus,
  deleteAdminOrder,
  fetchAdminReviews,
  createAdminReview,
  updateAdminReview,
  deleteAdminReview,
  fetchAdminCoupons,
  createAdminCoupon,
  deleteAdminCoupon,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct
} from '../../services/api';
import { verifyAdminEmailChange, verifyAdminSession } from '../../api/services';
import { isMockDataAllowed } from '../../api/status';

const API_ORIGIN = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : 'https://ecoms-e28hqt4e.b4a.run/api')).replace(/\/api\/?$/, '');

function resolveMediaUrl(url) {
  if (!url || typeof url !== 'string') return url;
  if (/^(data:|blob:)/i.test(url)) return url;
  if (/^https?:/i.test(url)) {
    try {
      const parsedUrl = new URL(url);
      const isLocalUpload = ['localhost', '127.0.0.1', '::1'].includes(parsedUrl.hostname) && parsedUrl.pathname.startsWith('/uploads/');
      return isLocalUpload ? `${API_ORIGIN}${parsedUrl.pathname}` : url;
    } catch {
      return url;
    }
  }
  if (url.startsWith('/uploads/') || url.startsWith('uploads/')) {
    return `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`;
  }
  return url;
}

// Import Mock Data
import { 
  defaultMockOrders, 
  defaultMockCustomers, 
  defaultMockReviews, 
  defaultMockCoupons, 
  defaultMockCategories 
} from '../admin/mockData';

// Custom Sidebar Link Component
const SidebarLink = ({ to, icon: Icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname.startsWith(to) || (to === '/' && location.pathname === '/');
  
  return (
    <Link 
      to={to}
      className={`flex items-center gap-3 px-4 py-3 uppercase tracking-widest text-sm transition-colors ${
        isActive 
          ? 'bg-white text-[#d9006c]' 
          : 'text-gray-300 hover:bg-[#ec4899] hover:text-white'
      }`}
    >
      <Icon size={18} />
      {label}
    </Link>
  );
};

// Main Admin Layout (shown after login)
function AdminEmailVerification({ onLogout }) {
  const [status, setStatus] = useState({ loading: true, type: '', message: '' });

  useEffect(() => {
    const query = window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '';
    const token = new URLSearchParams(query).get('token');

    async function verify() {
      if (!token) {
        setStatus({ loading: false, type: 'error', message: 'Email verification token is missing.' });
        return;
      }

      try {
        const response = await verifyAdminEmailChange(token);
        localStorage.removeItem('adminToken');
        setStatus({
          loading: false,
          type: 'success',
          message: response.message || 'Email verified successfully. Please sign in with your new email.',
        });
        setTimeout(() => onLogout?.(), 1800);
      } catch (error) {
        setStatus({ loading: false, type: 'error', message: error.message });
      }
    }

    verify();
  }, [onLogout]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-[#e7e1d8] p-8 max-w-xl">
      <h2 className="text-2xl font-bold text-[#d9006c] uppercase tracking-wide mb-4">Verify Email</h2>
      <div className={`text-sm px-4 py-3 rounded ${status.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
        {status.loading ? 'Verifying email address...' : status.message}
      </div>
    </div>
  );
}

function AdminResetPasswordRedirect({ onLogout }) {
  useEffect(() => {
    localStorage.removeItem('adminToken');
    onLogout?.();
  }, [onLogout]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-[#e7e1d8] p-8 max-w-xl">
      <h2 className="text-2xl font-bold text-[#d9006c] uppercase tracking-wide mb-4">Reset Password</h2>
      <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded">
        Opening password reset form...
      </div>
    </div>
  );
}

function AdminLayout({ setActivePage, products, setProducts, orders, setOrders, customers, setCustomers, reviews, setReviews, coupons, setCoupons, categories, setCategories, onLogout, isLoading }) {
  const handleBackToStore = () => {
    if (window.location.hash.includes('#/admin') || window.location.hash === '#admin') {
      window.history.pushState("", document.title, window.location.pathname + window.location.search);
    }
    setActivePage('home');
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    onLogout();
  };

  return (
    <div className="min-h-screen bg-[#D5E8D4] text-[#d9006c] font-sans flex flex-col md:flex-row">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-[#d9006c] text-white flex flex-col shadow-xl flex-shrink-0 min-h-screen md:sticky md:top-0">
        <div className="p-6 border-b border-[#222222]">
          <h2 className="text-2xl font-bentley-script text-[#d4c2aa]">JTS Beauty</h2>
          <p className="uppercase tracking-[0.2em] text-xs text-gray-300 mt-2">Admin Portal</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <SidebarLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <SidebarLink to="/products" icon={Package} label="Products" />
          <SidebarLink to="/orders" icon={ShoppingCart} label="Orders" />
          <SidebarLink to="/reviews" icon={Star} label="Reviews" />
          <SidebarLink to="/coupons" icon={Ticket} label="Coupons" />
          <SidebarLink to="/settings" icon={Settings} label="Settings" />
        </nav>

        <div className="p-4 border-t border-[#222222] space-y-2">
          <button 
            onClick={handleBackToStore}
            className="flex items-center justify-center gap-2 w-full border border-[#d4c2aa] text-[#d4c2aa] px-4 py-2.5 text-sm uppercase tracking-widest hover:bg-[#d4c2aa] hover:text-[#d9006c] transition-colors"
          >
            View Store
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full bg-red-900/30 border border-red-700/50 text-red-300 px-4 py-2.5 text-sm uppercase tracking-widest hover:bg-red-800/50 transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden p-4 sm:p-8 lg:p-12">
        <div className="max-w-6xl mx-auto">
          {isLoading && (
            <div className="bg-[#d9006c]/10 text-[#d9006c] p-3 rounded mb-6 text-sm uppercase tracking-widest font-semibold text-center animate-pulse">
              Synchronizing Live Database Records...
            </div>
          )}
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
            
            <Route path="/dashboard" element={<AdminDashboard products={products} orders={orders} customers={customers} />} />
            <Route path="/products" element={<AdminProducts products={products} setProducts={setProducts} categories={categories} />} />
            <Route path="/orders" element={<AdminOrders orders={orders} setOrders={setOrders} categories={categories} />} />
            <Route path="/customers" element={<AdminCustomers customers={customers} setCustomers={setCustomers} />} />
            <Route path="/categories" element={<AdminCategories categories={categories} setCategories={setCategories} />} />
            <Route path="/reviews" element={<AdminReviews reviews={reviews} setReviews={setReviews} categories={categories} />} />
            <Route path="/coupons" element={<AdminCoupons coupons={coupons} setCoupons={setCoupons} />} />
            <Route path="/settings" element={<AdminSettings onLogout={onLogout} />} />
            <Route path="/verify-email" element={<AdminEmailVerification onLogout={onLogout} />} />
            <Route path="/admin/verify-email" element={<AdminEmailVerification onLogout={onLogout} />} />
            <Route path="/admin/reset-password" element={<AdminResetPasswordRedirect onLogout={onLogout} />} />
            
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

// Root AdminPage — handles auth state
export default function AdminPage({ setActivePage, productCategories, onReviewsChange, apiAvailable = true }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(() => !!localStorage.getItem('adminToken'));
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Admin state starts with mock data only in local development.
  const initialProducts = Object.entries(productCategories || {}).flatMap(([category, products]) => 
    (products || []).map((p, idx) => ({
      ...p,
      adminCategory: category,
      id: p.id || p._id || `${category}-${idx}`,
      stock: 15,
      isFeatured: Boolean(p.isFeatured || p.type === 'Featured'),
    }))
  );
  
  const [products, setProducts] = useState(() => isMockDataAllowed ? initialProducts : []);
  const [orders, setOrders] = useState(() => isMockDataAllowed ? defaultMockOrders : []);
  const [customers, setCustomers] = useState(() => isMockDataAllowed ? defaultMockCustomers : []);
  const [reviews, setReviews] = useState(() => isMockDataAllowed ? defaultMockReviews : []);
  const [coupons, setCoupons] = useState(() => isMockDataAllowed ? defaultMockCoupons : []);
  const [categories, setCategories] = useState(() => isMockDataAllowed ? defaultMockCategories : []);

  const forceLogout = (message) => {
    localStorage.removeItem('adminToken');
    setIsLoggedIn(false);
    setAuthError(message);
  };

  // --- MERN API Data Normalizers ---
  const normalizeProducts = (apiProducts) => {
    return apiProducts.map(p => {
      const isWig = (p.category || p.adminCategory) === 'Wigs';
      let priceStr = p.price;
      if (typeof p.price === 'number') {
        // Wigs show "From $X", all others show "$X.XX"
        priceStr = isWig ? `From $${p.price.toFixed(0)}` : `$${p.price.toFixed(2)}`;
      } else if (typeof p.price === 'string' && !p.price.includes('$')) {
        const num = parseFloat(p.price);
        if (!isNaN(num)) {
          priceStr = isWig ? `From $${num.toFixed(0)}` : `$${num.toFixed(2)}`;
        }
      }
      return {
        ...p,
        id: p._id || p.id,
        title: p.title || p.name,
        name: p.name || p.title,
        adminCategory: p.category || p.adminCategory || 'Wigs',
        isFeatured: Boolean(p.isFeatured),
        price: priceStr,
        stock: p.stock !== undefined ? p.stock : 10,
        image: resolveMediaUrl(p.image),
        images: (p.images?.length ? p.images : (p.image ? [p.image] : [])).map(resolveMediaUrl),
      };
    });
  };

  const normalizeOrders = (apiOrders, productCatalog = products) => {
    return apiOrders.map(o => {
      const orderItems = o.items || [];
      const orderDate = new Date(o.createdAt || o.date);
      const hasValidOrderDate = !Number.isNaN(orderDate.getTime());
      const categoriesForOrder = orderItems.map(item => {
        if (item.category) return item.category;

        const matchingProduct = productCatalog.find(product => (
          product.id === item.product ||
          product._id === item.product ||
          product.title === item.title ||
          product.name === item.title
        ));

        return matchingProduct?.adminCategory || matchingProduct?.category;
      }).filter(Boolean);

      return {
        id: o._id || o.id,
        customer: o.customerName || o.customer,
        customerEmail: o.email || o.customerEmail,
        date: hasValidOrderDate
          ? orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : o.date,
        time: hasValidOrderDate
          ? orderDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
          : o.time || 'N/A',
        total: o.total,
        status: o.orderStatus || o.status,
        paymentMethod: o.paymentMethod || 'Credit Card',
        items: orderItems,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
        categories: [...new Set(categoriesForOrder)]
      };
    });
  };

  const normalizeReviews = (apiReviews) => {
    const defaultCategory = categories[0]?.name || 'Wigs';
    return apiReviews.map(r => ({
      id: r._id || r.id,
      customer: r.customerName || r.customer,
      product: r.product,
      category: r.category || defaultCategory,
      rating: r.rating,
      comment: r.comment,
      showOnHome: Boolean(r.showOnHome),
      date: new Date(r.createdAt || r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }));
  };

  const normalizeCoupons = (apiCoupons) => {
    return apiCoupons.map(c => ({
      id: c._id || c.id,
      code: c.code,
      discount: c.discountType === 'percentage' ? `${c.discountValue}%` : `$${c.discountValue}`,
      discountType: c.discountType,
      discountValue: c.discountValue,
      minOrderAmount: c.minOrderAmount || 0,
      status: c.isActive ? 'Active' : 'Expired',
      isActive: c.isActive,
      usage: c.usageCount || 0,
      expiryDate: c.expiryDate
    }));
  };

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setIsCheckingSession(false);
      return;
    }
    if (!apiAvailable) {
      setIsLoggedIn(true);
      setAuthError('');
      setIsCheckingSession(false);
      return;
    }

    async function checkSession() {
      try {
        await verifyAdminSession();
        setIsLoggedIn(true);
        setAuthError('');
      } catch (err) {
        forceLogout(err.message || 'Admin session could not be verified.');
      } finally {
        setIsCheckingSession(false);
      }
    }

    checkSession();
  }, [apiAvailable]);

  // --- Load MERN Data on Authorization ---
  useEffect(() => {
    if (!isLoggedIn || !apiAvailable) return;

    async function loadAdminData() {
      setIsLoading(true);
      try {
        const liveProducts = await fetchAdminProducts();
        let productCatalog = products;
        if (liveProducts && liveProducts.length > 0) {
          productCatalog = normalizeProducts(liveProducts);
          setProducts(productCatalog);
          
          // Dynamically compute category product counts from live products
          const categoryBase = categories.length > 0 ? categories : defaultMockCategories;
          const computedCats = categoryBase.map(cat => {
            const count = liveProducts.filter(p => p.category === cat.name).length;
            return { ...cat, productCount: count };
          });
          setCategories(computedCats);
        }

        const liveOrders = await fetchAdminOrders();
        if (liveOrders) {
          setOrders(normalizeOrders(liveOrders, productCatalog));
          
          // Derive customers from orders
          const uniqueCustomers = [];
          liveOrders.forEach(o => {
            if (!uniqueCustomers.some(c => c.email === o.email)) {
              uniqueCustomers.push({
                id: `CUST-${Math.floor(100 + Math.random() * 900)}`,
                name: o.customerName,
                email: o.email,
                totalSpent: o.total,
                ordersCount: 1,
                joinDate: new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
              });
            } else {
              const cust = uniqueCustomers.find(c => c.email === o.email);
              cust.totalSpent += o.total;
              cust.ordersCount += 1;
            }
          });
          if (uniqueCustomers.length > 0) setCustomers(uniqueCustomers);
        }

        const liveReviews = await fetchAdminReviews();
        if (liveReviews) {
          const normalizedReviews = normalizeReviews(liveReviews);
          setReviews(normalizedReviews);
          onReviewsChange?.(normalizedReviews);
        }

        const liveCoupons = await fetchAdminCoupons();
        if (liveCoupons) setCoupons(normalizeCoupons(liveCoupons));

      } catch (err) {
        console.error('Unable to load admin data.', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadAdminData();
  }, [isLoggedIn, apiAvailable]);

  // --- Live API Setter Synchronizers (MERN Layer) ---

  const handleProductsChange = async (newProductsOrFunction) => {
    let nextProducts = typeof newProductsOrFunction === 'function' 
      ? newProductsOrFunction(products) 
      : newProductsOrFunction;

    // 1. Delete Action Detection
    if (nextProducts.length < products.length) {
      const deletedId = products.find(p => !nextProducts.some(np => np.id === p.id))?.id;
      if (deletedId) {
        try {
          await deleteAdminProduct(deletedId);
        } catch (err) {
          throw err;
        }
      }
    } 
    // 2. Add Action Detection
    else if (nextProducts.length > products.length) {
      const addedProduct = nextProducts[0];
      if (addedProduct) {
        try {
          const payload = {
            title: addedProduct.title || addedProduct.name,
            category: addedProduct.adminCategory || addedProduct.category || 'Wigs',
            price: parseFloat(String(addedProduct.price).replace(/[^0-9.-]+/g, '')) || 0,
            stock: addedProduct.stock || 0,
            description: addedProduct.description || '',
            image: addedProduct.image || '',
            imageFile: addedProduct.imageFile || null,
            imageFiles: addedProduct.imageFiles || [],
            images: addedProduct.images || [],
            isFeatured: Boolean(addedProduct.isFeatured),
            variants: addedProduct.variants || []
          };
          const created = await createAdminProduct(payload);
          nextProducts[0] = normalizeProducts([{ ...addedProduct, ...created }])[0];
        } catch (err) {
          throw err;
        }
      }
    } 
    // 3. Update Action Detection
    else {
      const updatedProduct = nextProducts.find(np => {
        const old = products.find(p => p.id === np.id);
        return old && (
          old.title !== np.title ||
          old.adminCategory !== np.adminCategory ||
          old.price !== np.price ||
          old.stock !== np.stock ||
          old.description !== np.description ||
          old.image !== np.image ||
          JSON.stringify(old.images || []) !== JSON.stringify(np.images || []) ||
          (np.imageFiles || []).length > 0 ||
          old.isFeatured !== np.isFeatured ||
          JSON.stringify(old.variants) !== JSON.stringify(np.variants)
        );
      });
      if (updatedProduct) {
        try {
          const payload = {
            title: updatedProduct.title || updatedProduct.name,
            category: updatedProduct.adminCategory || updatedProduct.category || 'Wigs',
            price: parseFloat(String(updatedProduct.price).replace(/[^0-9.-]+/g, '')) || 0,
            stock: updatedProduct.stock || 0,
            description: updatedProduct.description || '',
            image: updatedProduct.image || '',
            imageFile: updatedProduct.imageFile || null,
            imageFiles: updatedProduct.imageFiles || [],
            images: updatedProduct.images || [],
            isFeatured: Boolean(updatedProduct.isFeatured),
            variants: updatedProduct.variants || []
          };
          const updated = await updateAdminProduct(updatedProduct.id, payload);
          const normalizedUpdated = normalizeProducts([{ ...updatedProduct, ...updated }])[0];
          nextProducts = nextProducts.map(p => p.id === updatedProduct.id ? normalizedUpdated : p);
        } catch (err) {
          throw err;
        }
      }
    }

    setProducts(nextProducts);
  };

  const handleOrdersChange = async (newOrdersOrFunc) => {
    let nextOrders = typeof newOrdersOrFunc === 'function' ? newOrdersOrFunc(orders) : newOrdersOrFunc;
    
    // Status Update Action Detection
    const updatedOrder = nextOrders.find(no => {
      const old = orders.find(o => o.id === no.id);
      return old && old.status !== no.status;
    });
    
    if (updatedOrder) {
      try {
        const orderStatus = updatedOrder.status;
        const paymentStatus = orderStatus === 'Delivered' ? 'Paid' : 'Unpaid';
        await updateAdminOrderStatus(updatedOrder.id, orderStatus, paymentStatus);
      } catch (err) {
        throw err;
      }
    }
    
    setOrders(nextOrders);
  };

  const handleReviewsChange = async (newReviewsOrFunc) => {
    let nextReviews = typeof newReviewsOrFunc === 'function' ? newReviewsOrFunc(reviews) : newReviewsOrFunc;
    
    // Delete Review Action Detection
    if (nextReviews.length < reviews.length) {
      const deletedId = reviews.find(r => !nextReviews.some(nr => nr.id === r.id))?.id;
      if (deletedId) {
        try {
          await deleteAdminReview(deletedId);
        } catch (err) {
          throw err;
        }
      }
    }
    // Add Review Action Detection
    else if (nextReviews.length > reviews.length) {
      const addedReview = nextReviews[0];
      if (addedReview) {
        try {
          const created = await createAdminReview({
            product: addedReview.product,
            category: addedReview.category,
            customerName: addedReview.customer,
            rating: addedReview.rating,
            comment: addedReview.comment,
            showOnHome: Boolean(addedReview.showOnHome),
          });
          nextReviews[0] = {
            ...addedReview,
            ...normalizeReviews([created])[0],
            id: created._id || created.id,
          };
        } catch (err) {
          throw err;
        }
      }
    }
    // Update Review Action Detection
    else {
      const updatedReview = nextReviews.find(nr => {
        const old = reviews.find(r => r.id === nr.id);
        return old && (
          old.customer !== nr.customer ||
          old.product !== nr.product ||
          old.category !== nr.category ||
          old.rating !== nr.rating ||
          old.comment !== nr.comment ||
          old.showOnHome !== nr.showOnHome
        );
      });

      if (updatedReview) {
        try {
          const updated = await updateAdminReview(updatedReview.id, {
            product: updatedReview.product,
            category: updatedReview.category,
            customerName: updatedReview.customer,
            rating: updatedReview.rating,
            comment: updatedReview.comment,
            showOnHome: Boolean(updatedReview.showOnHome),
          });
          nextReviews = nextReviews.map(r => (
            r.id === updatedReview.id
              ? { ...r, ...normalizeReviews([updated])[0], id: updated._id || updated.id }
              : r
          ));
        } catch (err) {
          throw err;
        }
      }
    }
    
    setReviews(nextReviews);
    onReviewsChange?.(nextReviews);
  };

  const handleCouponsChange = async (newCouponsOrFunc) => {
    let nextCoupons = typeof newCouponsOrFunc === 'function' ? newCouponsOrFunc(coupons) : newCouponsOrFunc;
    
    // 1. Delete Action Detection
    if (nextCoupons.length < coupons.length) {
      const deletedId = coupons.find(c => !nextCoupons.some(nc => nc.id === c.id))?.id;
      if (deletedId) {
        try {
          await deleteAdminCoupon(deletedId);
        } catch (err) {
          throw err;
        }
      }
    } 
    // 2. Create Action Detection
    else if (nextCoupons.length > coupons.length) {
      const addedCoupon = nextCoupons[0];
      if (addedCoupon) {
        try {
          const payload = {
            code: addedCoupon.code,
            discountType: 'percentage',
            discountValue: parseFloat(String(addedCoupon.discountValue || addedCoupon.discount).replace('%', '')) || 10,
            minOrderAmount: Number(addedCoupon.minOrderAmount) || 0,
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
            isActive: addedCoupon.status === 'Active'
          };
          const created = await createAdminCoupon(payload);
          nextCoupons[0] = { ...addedCoupon, ...created, id: created._id || created.id };
        } catch (err) {
          throw err;
        }
      }
    }
    
    setCoupons(nextCoupons);
  };

  // Show login page if not authenticated
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-[#D5E8D4] flex items-center justify-center p-4">
        <div className="bg-white border border-[#D5E8D4] rounded-lg p-6 text-[#d9006c] uppercase tracking-widest text-sm font-semibold">
          Verifying Admin Session...
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <AdminLogin initialError={authError} onLogin={() => {
      setAuthError('');
      setIsLoggedIn(true);
    }} apiAvailable={apiAvailable} />;
  }

  // Show admin dashboard if authenticated
  return (
    <HashRouter>
      <AdminLayout
        setActivePage={setActivePage}
        products={products}
        setProducts={handleProductsChange}
        orders={orders}
        setOrders={handleOrdersChange}
        customers={customers}
        setCustomers={setCustomers}
        reviews={reviews}
        setReviews={handleReviewsChange}
        coupons={coupons}
        setCoupons={handleCouponsChange}
        categories={categories}
        setCategories={setCategories}
        onLogout={() => setIsLoggedIn(false)}
        isLoading={isLoading}
      />
    </HashRouter>
  );
}


