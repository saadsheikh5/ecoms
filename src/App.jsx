import React, { useState, useEffect, useRef } from 'react';
import { 
  wigCategories as defaultWigCategories, 
  featuredProducts as defaultFeaturedProducts, 
  beautyProducts as defaultBeautyProducts,
  bonnets as defaultBonnets,
  productCategories as defaultProductCategories
} from './constants/products';
import { 
  fetchWigCategories, 
  fetchFeaturedProducts, 
  fetchBeautyProducts,
  fetchBonnets,
  fetchHomepageReviews
} from './services/api';
import { isMockDataAllowed, API_STATUS } from './api/status';
import { useApiStatus } from './context/ApiStatusContext';
import { Facebook, Instagram, MessageCircle } from 'lucide-react';

// Shared Components
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import Footer from './components/common/Footer';
import MaintenanceNotice from './components/common/MaintenanceNotice';
import BrowseOnlyBanner from './components/common/BrowseOnlyBanner';

// Homepage Components
import Hero from './components/home/Hero';
import StyleCategories from './components/home/StyleCategories';
import PromoBanner from './components/home/PromoBanner';
import FeaturedProducts from './components/home/FeaturedProducts';
import Reviews from './components/home/Reviews';
import SocialSection from './components/home/SocialSection';

// Page Components
import CartPage from './components/pages/CartPage';
import ProductDetailsPage from './components/pages/ProductDetailsPage';
import ProductsPage from './components/pages/ProductsPage';
import CheckoutPage from './components/pages/CheckoutPage';
import AdminPage from './components/pages/AdminPage';

const CART_STORAGE_KEY = 'jtsBeautyCart';
const BONNETS_DISPLAY_LABEL = 'Bonnets And Fashion/Lace Bands';
const SOCIAL_LINKS = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/jtsbeautyworld?utm_source=qr&igsh=MXgxOHV0cWZvdHE2Zg==',
    icon: Instagram,
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/share/177aaiVESS/',
    icon: Facebook,
  },
  {
    label: 'WhatsApp',
    href: 'https://wa.me/15612553698',
    icon: MessageCircle,
  },
];
let savedCartCache;

const STATIC_PRODUCT_CATEGORIES = {
  Wigs: defaultProductCategories.Wigs || [],
  Bonnets: defaultProductCategories.Bonnets || [],
  'Lace Tints': defaultProductCategories['Lace Tints'] || [],
  'Hair Products': defaultProductCategories['Hair Products'] || [],
  'Lace Glues': defaultProductCategories['Lace Glues'] || [],
};

const getCartItemQuantity = (item) => {
  const quantity = Number(item.quantity);
  return Number.isFinite(quantity) ? Math.max(0, quantity) : 1;
};

const getCartCount = (items) => items.reduce(
  (total, item) => total + Math.max(1, getCartItemQuantity(item)),
  0
);

const getCartItemKey = (item) => {
  const productId = item._id || item.id || item.title || item.name || '';
  const specsKey = item.specs ? JSON.stringify(item.specs) : '';
  return `${productId}|${item.price || ''}|${specsKey}`;
};

const loadSavedCart = () => {
  if (savedCartCache) return savedCartCache;

  try {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    const parsedCart = storedCart ? JSON.parse(storedCart) : [];
    savedCartCache = Array.isArray(parsedCart) ? parsedCart : [];
  } catch (error) {
    console.warn('Unable to restore saved cart.', error);
    savedCartCache = [];
  }

  return savedCartCache;
};

function PaymentResultPage({ type, setActivePage, onOrderSuccess }) {
  const isSuccess = type === 'success';
  const didClearCart = useRef(false);

  useEffect(() => {
    if (isSuccess && !didClearCart.current) {
      didClearCart.current = true;
      onOrderSuccess?.({ redirect: false });
    }
  }, [isSuccess, onOrderSuccess]);

  return (
    <section className="min-h-screen bg-[#D5E8D4] px-4 py-8 sm:px-8 flex items-center">
      <div className="max-w-2xl mx-auto w-full bg-white border border-[#D5E8D4] shadow-xl p-8 sm:p-12 text-center">
        <p className="uppercase tracking-[0.3em] text-sm text-[#d9006c] font-bold">
          {isSuccess ? 'Checkout Complete' : 'Checkout Cancelled'}
        </p>
        <h2 className="text-4xl sm:text-5xl font-black mt-4 uppercase text-[#d9006c]">
          {isSuccess ? 'Thank You' : 'No Payment Taken'}
        </h2>
        <p className="mt-5 text-gray-600 leading-relaxed">
          {isSuccess
            ? 'Stripe is processing your payment. Your order will be confirmed after secure payment verification.'
            : 'Your Stripe checkout was cancelled. Your cart has not been charged.'}
        </p>
        <button
          type="button"
          onClick={() => setActivePage(isSuccess ? 'home' : 'checkout')}
          className="mt-8 w-full sm:w-auto bg-[#d9006c] text-white px-4 py-3 text-sm uppercase tracking-[0.2em] font-semibold hover:bg-[#ec4899] transition-all duration-300"
        >
          {isSuccess ? 'Continue Shopping' : 'Return To Checkout'}
        </button>
      </div>
    </section>
  );
}

export default function App() {
  const apiStatus = useApiStatus();
  const [catalogSource, setCatalogSource] = useState('static');
  const liveCommerceReady = apiStatus.isAvailable && catalogSource === 'live';
  const browseOnlyMode = apiStatus.status === API_STATUS.OFFLINE;
  const commerceDisabled = browseOnlyMode;
  // Global State
  const savedCart = loadSavedCart();
  const [cartCount, setCartCount] = useState(getCartCount(savedCart));
  const [selectedCategory, setSelectedCategory] = useState('All Wigs');
  const [selectedProductType, setSelectedProductType] = useState('All Products');
  const [activePage, setActivePage] = useState('home');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cart, setCart] = useState(savedCart);
  const [cartDetails, setCartDetails] = useState(savedCart);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [productSectionTarget, setProductSectionTarget] = useState('');
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [catalogRefreshKey, setCatalogRefreshKey] = useState(0);

  // Dynamic Product Data States (Backend Ready)
  const [wigCategories, setWigCategories] = useState(defaultWigCategories);
  const [featuredProducts, setFeaturedProducts] = useState(defaultFeaturedProducts);
  const [beautyProducts, setBeautyProducts] = useState(defaultBeautyProducts);
  const [bonnets, setBonnets] = useState(defaultBonnets);
  const [productCategories, setProductCategories] = useState(STATIC_PRODUCT_CATEGORIES);
  const [homeReviews, setHomeReviews] = useState([]);

  // Fetch product data on load to synchronize with the API service layer
  useEffect(() => {
    async function loadData() {
      try {
        const wigs = await fetchWigCategories();
        setWigCategories(wigs);
        
        const featured = await fetchFeaturedProducts();
        setFeaturedProducts(featured);
        
        const beauty = await fetchBeautyProducts();
        setBeautyProducts(beauty);

        const bonnetsData = await fetchBonnets();
        setBonnets(bonnetsData);

        // Compute categories mapping dynamically from the fetched lists
        // Backend uses `title`, mock data uses `name` — check both
        const hairCare = beauty.filter(p => p.category === 'Hair Products');
        const tints = beauty.filter(p => p.category === 'Lace Tints');
        const directGlues = beauty.filter(p => p.category === 'Lace Glues');
        const glueLikeHairCare = hairCare.filter(p => {
          const label = (p.name || p.title || '').toLowerCase();
          return label.includes('glue');
        });
        const glues = [...directGlues, ...glueLikeHairCare];
        const hairCareFiltered = hairCare.filter(p => !glueLikeHairCare.includes(p));

        setProductCategories({
          'Wigs': wigs.concat(featured.filter(p => p.category === 'Wigs')),
          'Bonnets': bonnetsData,
          'Lace Tints': tints,
          'Hair Products': hairCareFiltered,
          'Lace Glues': glues,
        });
        setCatalogSource(apiStatus.isAvailable ? 'live' : 'cached');

        if (apiStatus.isAvailable) {
          try {
            const reviewsData = await fetchHomepageReviews();
            setHomeReviews(reviewsData.map(review => ({
              id: review._id || review.id,
              customer: review.customerName || review.customer,
              product: review.product,
              category: review.category,
              rating: review.rating,
              comment: review.comment,
              showOnHome: Boolean(review.showOnHome),
            })));
          } catch (reviewError) {
            console.warn('Unable to load homepage reviews.', reviewError);
            setHomeReviews([]);
          }
        } else {
          setHomeReviews([]);
        }
      } catch (error) {
        console.error("Failed to load products from API service:", error);
        if (!isMockDataAllowed) {
          setWigCategories(defaultWigCategories);
          setFeaturedProducts(defaultFeaturedProducts);
          setBeautyProducts(defaultBeautyProducts);
          setBonnets(defaultBonnets);
          setProductCategories(STATIC_PRODUCT_CATEGORIES);
          setCatalogSource('static');
          setHomeReviews([]);
        }
      }
    }
    loadData();
  }, [apiStatus.isAvailable, apiStatus.retryCount, catalogRefreshKey]);

  // Header Hide/Show on Scroll Handler
  useEffect(() => {
    let lastScrollY = 0;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsNavVisible(false);
      } else {
        setIsNavVisible(true);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Admin Route Interceptor
  useEffect(() => {
    const syncAdminRoute = () => {
      if (window.location.hash.startsWith('#payment-success')) {
        setActivePage('payment-success');
      } else if (window.location.hash.startsWith('#payment-cancel')) {
        setActivePage('payment-cancel');
      } else if (window.location.hash === '#admin' || window.location.hash.startsWith('#/admin') || window.location.pathname.endsWith('/admin')) {
        setActivePage('admin');
      }
    };
    syncAdminRoute();
    window.addEventListener('hashchange', syncAdminRoute);
    return () => window.removeEventListener('hashchange', syncAdminRoute);
  }, []);

  // Persist cart across page refreshes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartDetails));
      savedCartCache = cartDetails;
    } catch (error) {
      console.warn('Unable to save cart.', error);
    }
  }, [cartDetails]);

  // Compute Categories for Homepage Grids
  // Backend uses `title`, mock data uses `name` — check both
  const hairCareProducts = beautyProducts.filter(p => p.category === 'Hair Products');
  const laceTints = beautyProducts.filter(p => p.category === 'Lace Tints');
  const directLaceGlues = beautyProducts.filter(p => p.category === 'Lace Glues');
  const glueLikeHairCareProducts = hairCareProducts.filter(p => {
    const label = (p.name || p.title || '').toLowerCase();
    return label.includes('glue');
  });
  const laceGlues = [...directLaceGlues, ...glueLikeHairCareProducts];
  const hairProducts = hairCareProducts.filter(p => !glueLikeHairCareProducts.includes(p));

  // Filtered Wigs for "Shop By Style"
  const filteredWigs = selectedCategory === 'All Wigs' 
    ? wigCategories 
    : wigCategories.filter(wig => wig.title === selectedCategory);

  // Cart Handlers
  const handleAddToCart = (product, quantity = 1) => {
    if (commerceDisabled) {
      setToastMessage('Shopping is temporarily unavailable. Browsing remains available.');
      setTimeout(() => setToastMessage(''), 3000);
      return;
    }

    if (!product?._id && !product?.id && !isMockDataAllowed) {
      setToastMessage('This item is not linked to live inventory');
      setTimeout(() => setToastMessage(''), 3000);
      return;
    }

    const amountToAdd = Math.max(1, Number(quantity) || 1);
    const incomingKey = getCartItemKey(product);
    const existingItem = cartDetails.find(item => getCartItemKey(item) === incomingKey);

    const nextCart = existingItem
      ? cartDetails.map(item => (
          item.cartId === existingItem.cartId
            ? { ...item, quantity: getCartItemQuantity(item) + amountToAdd }
            : item
        ))
      : [
          ...cartDetails,
          {
            ...product,
            cartId: Date.now(),
            quantity: amountToAdd
          }
        ];

    setCart(nextCart);
    setCartDetails(nextCart);
    setCartCount(getCartCount(nextCart));
    setToastMessage(`Added to cart`);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleRemoveFromCart = (cartId) => {
    const newCart = cart.filter(item => item.cartId !== cartId);
    const newCartDetails = cartDetails.filter(item => item.cartId !== cartId);
    setCart(newCart);
    setCartDetails(newCartDetails);
    setCartCount(getCartCount(newCartDetails));
  };

  const handleUpdateCartQuantity = (cartId, change) => {
    const nextCart = cartDetails
      .map(item => (
        item.cartId === cartId
          ? { ...item, quantity: Math.max(0, getCartItemQuantity(item) + change) }
          : item
      ))
      .filter(item => getCartItemQuantity(item) > 0);

    setCart(nextCart);
    setCartDetails(nextCart);
    setCartCount(getCartCount(nextCart));
  };

  const handleOrderSuccess = ({ redirect = true } = {}) => {
    setCart([]);
    setCartDetails([]);
    setCartCount(0);
    localStorage.removeItem(CART_STORAGE_KEY);
    savedCartCache = [];
    if (redirect) {
      setActivePage('home');
    }
  };

  // Render Admin View Separately
  if (activePage === 'admin') {
    return (
      <AdminPage 
        setActivePage={setActivePage}
        productCategories={productCategories}
        wigCategories={wigCategories}
        onReviewsChange={setHomeReviews}
        onProductsChange={() => setCatalogRefreshKey((key) => key + 1)}
        apiAvailable={apiStatus.isAvailable}
        commerceReady={liveCommerceReady}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#D5E8D4] text-[#1a1a1a] font-sans">
      {/* Top Welcome Bar */}
      <div className="bg-[#D5E8D4] text-[#1a1a1a] px-3 sm:px-6 py-2 text-[10px] sm:text-xs uppercase font-medium">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-2 sm:flex-row sm:justify-between">
          <span className="text-center tracking-[0.2em]">
            Welcome To JTS Wigs - Luxury Wigs
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 tracking-[0.14em]">
            {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={`Follow JTS Beauty on ${label}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#d9006c] bg-[#d9006c] px-2.5 py-1 text-white shadow-sm transition hover:bg-[#ec4899] hover:border-[#ec4899]"
              >
                <Icon size={14} strokeWidth={2.2} />
                <span>{label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Shared Header Navigation */}
      <Header
        cartCount={cartCount}
        setActivePage={setActivePage}
        setSelectedProductType={setSelectedProductType}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setSidebarOpen={setSidebarOpen}
        sidebarOpen={sidebarOpen}
        isNavVisible={isNavVisible}
        commerceDisabled={commerceDisabled}
      />

      {apiStatus.status === API_STATUS.OFFLINE && apiStatus.canShowOffline && (
        <BrowseOnlyBanner
          mode="offline"
          onRetry={apiStatus.retry}
          isChecking={apiStatus.isChecking}
        />
      )}

      {/* Shared Sidebar Drawer */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        setSelectedProductType={setSelectedProductType}
        setActivePage={setActivePage}
        setProductSectionTarget={setProductSectionTarget}
        setSearchQuery={setSearchQuery}
      />

      {/* Routing Controller */}
      {activePage === 'home' && (
        <>
          {/* Hero Banner */}
          <Hero onShopNowClick={() => {
            const categoriesSection = document.getElementById('categories');
            if (categoriesSection) {
              categoriesSection.scrollIntoView({ behavior: 'smooth' });
            }
          }} />


          {/* Promo Hair Care Banner */}
          <PromoBanner 
            setActivePage={setActivePage} 
            setSelectedProductType={setSelectedProductType}
            setProductSectionTarget={setProductSectionTarget}
            setSearchQuery={setSearchQuery}
          />

          {/* Wig Style Collection */}
          <StyleCategories
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            wigCategories={wigCategories}
            filteredWigs={filteredWigs}
            setSelectedProduct={setSelectedProduct}
            setActivePage={setActivePage}
            handleAddToCart={handleAddToCart}
            commerceDisabled={commerceDisabled}
          />

          {/* Featured Wigs Grid */}
          <FeaturedProducts
            featuredProducts={featuredProducts}
            setSelectedProduct={setSelectedProduct}
            setActivePage={setActivePage}
            handleAddToCart={handleAddToCart}
            setSelectedProductType={setSelectedProductType}
            commerceDisabled={commerceDisabled}
          />

          {commerceDisabled && (
            <MaintenanceNotice
              title="Shopping Temporarily Paused"
              message="You can still browse our catalog and explore products. Add to cart, checkout, account, inventory, and payment actions are disabled until store services reconnect."
              onRetry={apiStatus.retry}
              isChecking={apiStatus.isChecking}
              compact
            />
          )}

          {/* Bonnets and head bands section */}
          <section id="bonnets" className="scroll-mt-28 bg-white py-8 px-4 sm:px-6 lg:px-10">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-6">
                <p className="uppercase tracking-[0.3em] text-sm text-[#d9006c] font-bold">
                  Accessories & Care
                </p>
                <h2 className="text-4xl sm:text-5xl font-bold mt-2">
                  {BONNETS_DISPLAY_LABEL}
                </h2>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
                {bonnets.map((product, index) => (
                  <div
                    key={`bonnet-home-${index}`}
                    onClick={() => { setSelectedProduct(product); setActivePage('details'); }}
                    className="bg-white overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 group cursor-pointer"
                  >
                    <div className="overflow-hidden bg-white">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-44 sm:h-64 w-full object-contain group-hover:scale-105 transition duration-500"
                        onError={(e) => e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23e6e1da" width="100" height="100"/%3E%3Ctext x="50" y="50" font-family="Arial" font-size="14" fill="%23999" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E'}
                      />
                    </div>

                    <div className="p-5 text-center">
                      <h3 className="font-semibold text-lg">{product.name}</h3>
                      <p className="text-[#1a1a1a] font-bold mt-4 text-xl">{product.price}</p>

                      <div className="space-y-3 mt-5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProduct(product);
                            setActivePage('details');
                          }}
                          className="w-full border border-[#d9006c] px-4 py-3 text-sm uppercase tracking-[0.2em] hover:bg-[#d9006c] hover:text-white transition-all duration-300"
                        >
                          View Details
                        </button>

                        <button
                          onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                          disabled={commerceDisabled}
                          title={commerceDisabled ? 'Shopping is temporarily unavailable while store services reconnect.' : 'Add to cart'}
                          className="w-full bg-[#d9006c] text-white px-4 py-3 text-sm uppercase tracking-[0.2em] hover:bg-[#ec4899] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {commerceDisabled ? 'Unavailable' : 'Add To Cart'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Lace Tints Section */}
          <section className="bg-white py-8 px-4 sm:px-6 lg:px-10">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-6">
                <p className="uppercase tracking-[0.3em] text-sm text-[#d9006c] font-bold">
                  Accessories & Care
                </p>
                <h2 className="text-4xl sm:text-5xl font-bold mt-2">
                  Lace Tints
                </h2>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
                {laceTints.map((product, index) => (
                  <div
                    key={`lacetint-${index}`}
                    onClick={() => { setSelectedProduct(product); setActivePage('details'); }}
                    className="bg-white overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 group cursor-pointer"
                  >
                    <div className="overflow-hidden bg-white">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-44 sm:h-64 w-full object-contain group-hover:scale-105 transition duration-500"
                        onError={(e) => e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23e6e1da" width="100" height="100"/%3E%3Ctext x="50" y="50" font-family="Arial" font-size="14" fill="%23999" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E'}
                      />
                    </div>

                    <div className="p-5 text-center">
                      <h3 className="font-semibold text-lg">{product.name}</h3>
                      <p className="text-[#1a1a1a] font-bold mt-4 text-xl">{product.price}</p>

                      <button 
                        onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                        disabled={commerceDisabled}
                        title={commerceDisabled ? 'Shopping is temporarily unavailable while store services reconnect.' : 'Add to cart'}
                        className="w-full bg-[#d9006c] text-white px-4 py-3 text-sm uppercase tracking-[0.2em] hover:bg-[#ec4899] transition-all duration-300 mt-5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {commerceDisabled ? 'Unavailable' : 'Add To Cart'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Hair Care Products Section */}
          <section className="bg-white py-8 px-4 sm:px-6 lg:px-10">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-6">
                <p className="uppercase tracking-[0.3em] text-sm text-[#d9006c] font-bold">
                  Accessories & Care
                </p>
                <h2 className="text-4xl sm:text-5xl font-bold mt-2">
                  Hair Care Products
                </h2>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
                {hairProducts.map((product, index) => (
                  <div
                    key={`haircare-${index}`}
                    onClick={() => { setSelectedProduct(product); setActivePage('details'); }}
                    className="bg-white overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 group cursor-pointer"
                  >
                    <div className="overflow-hidden bg-white">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-44 sm:h-64 w-full object-contain group-hover:scale-105 transition duration-500"
                        onError={(e) => e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23e6e1da" width="100" height="100"/%3E%3Ctext x="50" y="50" font-family="Arial" font-size="14" fill="%23999" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E'}
                      />
                    </div>

                    <div className="p-5 text-center">
                      <h3 className="font-semibold text-lg">{product.name}</h3>
                      <p className="text-[#1a1a1a] font-bold mt-4 text-xl">{product.price}</p>

                      <button 
                        onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                        disabled={commerceDisabled}
                        title={commerceDisabled ? 'Shopping is temporarily unavailable while store services reconnect.' : 'Add to cart'}
                        className="w-full bg-[#d9006c] text-white px-4 py-3 text-sm uppercase tracking-[0.2em] hover:bg-[#ec4899] transition-all duration-300 mt-5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {commerceDisabled ? 'Unavailable' : 'Add To Cart'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Lace Glues Section */}
          <section className="bg-white py-8 px-4 sm:px-6 lg:px-10">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-6">
                <p className="uppercase tracking-[0.3em] text-sm text-[#d9006c] font-bold">
                  Accessories & Care
                </p>
                <h2 className="text-4xl sm:text-5xl font-bold mt-2">
                  Lace Glues
                </h2>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
                {laceGlues.map((product, index) => (
                  <div
                    key={`laceglue-${index}`}
                    onClick={() => { setSelectedProduct(product); setActivePage('details'); }}
                    className="bg-white overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 group cursor-pointer"
                  >
                    <div className="overflow-hidden bg-white">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-44 sm:h-64 w-full object-contain group-hover:scale-105 transition duration-500"
                        onError={(e) => e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23e6e1da" width="100" height="100"/%3E%3Ctext x="50" y="50" font-family="Arial" font-size="14" fill="%23999" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E'}
                      />
                    </div>

                    <div className="p-5 text-center">
                      <h3 className="font-semibold text-lg">{product.name}</h3>
                      <p className="text-[#1a1a1a] font-bold mt-4 text-xl">{product.price}</p>

                      <button 
                        onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                        disabled={commerceDisabled}
                        title={commerceDisabled ? 'Shopping is temporarily unavailable while store services reconnect.' : 'Add to cart'}
                        className="w-full bg-[#d9006c] text-white px-4 py-3 text-sm uppercase tracking-[0.2em] hover:bg-[#ec4899] transition-all duration-300 mt-5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {commerceDisabled ? 'Unavailable' : 'Add To Cart'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Testimonial Reviews */}
          <Reviews reviews={homeReviews} />

          {/* Instagram / TikTok Social Grid */}
          <SocialSection />

        </>
      )}

      {activePage === 'cart' && (
        <CartPage
          cart={cart}
          cartDetails={cartDetails}
          handleRemoveFromCart={handleRemoveFromCart}
          handleUpdateCartQuantity={handleUpdateCartQuantity}
          setActivePage={setActivePage}
          commerceDisabled={commerceDisabled}
          apiStatus={apiStatus}
        />
      )}


      {activePage === 'details' && selectedProduct && (
        <ProductDetailsPage
          selectedProduct={selectedProduct}
          setActivePage={setActivePage}
          handleAddToCart={handleAddToCart}
          commerceDisabled={commerceDisabled}
        />
      )}

      {activePage === 'products' && (
        <ProductsPage
          selectedProductType={selectedProductType}
          setActivePage={setActivePage}
          wigCategories={wigCategories}
          productCategories={productCategories}
          setSelectedProduct={setSelectedProduct}
          handleAddToCart={handleAddToCart}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          productSectionTarget={productSectionTarget}
          setProductSectionTarget={setProductSectionTarget}
          commerceDisabled={commerceDisabled}
          apiStatus={apiStatus}
        />
      )}

      {activePage === 'checkout' && (
        <CheckoutPage
          cartDetails={cartDetails}
          setActivePage={setActivePage}
          onOrderSuccess={handleOrderSuccess}
          apiAvailable={apiStatus.isAvailable}
          apiStatus={apiStatus}
        />
      )}

      {activePage === 'payment-success' && (
        <PaymentResultPage
          type="success"
          setActivePage={setActivePage}
          onOrderSuccess={handleOrderSuccess}
        />
      )}

      {activePage === 'payment-cancel' && (
        <PaymentResultPage type="cancel" setActivePage={setActivePage} />
      )}

      {/* Shared Footer Info */}
      <Footer
        setActivePage={setActivePage}
        setSelectedProductType={setSelectedProductType}
        setSelectedCategory={setSelectedCategory}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#d9006c] text-white px-8 py-5 rounded shadow-2xl z-[100] transition-opacity duration-300 flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#d4c2aa]" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span className="font-semibold tracking-wide">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}




