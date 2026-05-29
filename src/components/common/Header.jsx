import React, { useEffect, useState } from 'react';
import { ShoppingBag, Search, Menu } from 'lucide-react';

const SETTINGS_STORAGE_KEY = 'jtsAdminSettings';
const DEFAULT_LOGO = 'images/logonew.png';

const getSavedLogo = () => {
  try {
    const savedSettings = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || '{}');
    return savedSettings.logo || DEFAULT_LOGO;
  } catch {
    return DEFAULT_LOGO;
  }
};

export default function Header({
  cartCount,
  setActivePage,
  setSelectedProductType,
  searchQuery,
  setSearchQuery,
  setSidebarOpen,
  sidebarOpen,
  isNavVisible,
  commerceDisabled = false
}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [logoSrc, setLogoSrc] = useState(getSavedLogo);

  useEffect(() => {
    const handleSettingsUpdated = (event) => {
      setLogoSrc(event.detail?.logo || getSavedLogo());
    };

    const handleStorage = (event) => {
      if (event.key === SETTINGS_STORAGE_KEY) {
        setLogoSrc(getSavedLogo());
      }
    };

    window.addEventListener('jts-settings-updated', handleSettingsUpdated);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('jts-settings-updated', handleSettingsUpdated);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      setIsSearchOpen(true);
      return;
    }

    setSearchQuery(query);
    setSelectedProductType('All Products');
    setActivePage('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className={`sticky top-0 z-50 bg-[#d9006c] text-white shadow-md transition-transform duration-300 ease-in-out ${
      isNavVisible ? 'translate-y-0' : '-translate-y-full'
    }`}>
      <div className="flex items-center justify-between px-3 sm:px-4 py-0 sm:py-1 h-14 sm:h-16 max-w-7xl mx-auto overflow-hidden">
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="space-y-1 hover:opacity-80 transition"
        >
          <Menu size={24} />
        </button>

        <div 
          className="cursor-pointer flex items-center justify-center gap-0 flex-1 mt-0 min-w-0" 
          onClick={() => setActivePage('home')}
        >
          <img
            src={logoSrc}
            alt="JTS Logo"
            className="h-48 sm:h-44 lg:h-60 object-contain align-middle translate-y-4 sm:translate-y-3"
            style={{ maxWidth: '190px' }}
            onError={() => setLogoSrc(DEFAULT_LOGO)}
          />
          <h1 
            className="-ml-5 sm:-ml-4 lg:-ml-6 text-[3.55rem] sm:text-5xl lg:text-6xl text-white whitespace-nowrap flex items-center font-bentley-script" 
            style={{ lineHeight: 0.95, letterSpacing: '-0.04em', fontWeight: 700 }}
          >
            JTS&nbsp;&nbsp;&nbsp;Beauty
          </h1>
        </div>

        <div className="flex gap-4 items-center text-xl">
          <form
            onSubmit={handleSearchSubmit}
            className={`hidden sm:flex items-center justify-end text-sm text-white transition-all duration-300 ${
              isSearchOpen
                ? 'w-44 md:w-56 gap-2 rounded-full bg-white/10 border border-white/25 px-3 py-2 shadow-sm focus-within:border-white'
                : 'w-6'
            }`}
          >
            <button
              type={isSearchOpen ? 'submit' : 'button'}
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search products"
              className="shrink-0"
            >
              <Search size={22} />
            </button>

            {isSearchOpen && (
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search"
                autoFocus
                onBlur={() => {
                  if (!searchQuery.trim()) {
                    setIsSearchOpen(false);
                  }
                }}
                className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-white/70"
              />
            )}
          </form>

          <button
            onClick={() => setIsSearchOpen(true)}
            className="sm:hidden"
            aria-label="Search products"
          >
            <Search size={22} />
          </button>

          <button
            onClick={() => setActivePage('cart')}
            title={commerceDisabled ? 'Cart changes and checkout are temporarily unavailable.' : 'View cart'}
            className="relative"
          >
            <ShoppingBag size={22} />
            <span className="absolute -top-2 -right-2 bg-white text-[#1a1a1a] text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
              {cartCount}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <nav className="border-t border-gray-100 bg-white text-[#1a1a1a] shadow-sm">
        {isSearchOpen && (
          <form
            onSubmit={handleSearchSubmit}
            className="sm:hidden mx-4 mt-4 flex items-center gap-2 rounded-full border border-[#d9006c]/25 bg-white px-4 py-2 shadow-sm focus-within:border-[#d9006c]"
          >
            <Search size={18} />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search wigs, bonnets, lace..."
              autoFocus
              onBlur={() => {
                if (!searchQuery.trim()) {
                  setIsSearchOpen(false);
                }
              }}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#1a1a1a]/55"
            />
          </form>
        )}

        <div className="flex whitespace-nowrap gap-8 px-8 py-4 text-sm sm:text-base items-center justify-around">
          <button 
            onClick={() => {
              setSelectedProductType('Wigs');
              setActivePage('products');
            }}
            className="hover:text-[#d9006c] transition font-bold"
          >
            Wigs
          </button>
          <button 
            onClick={() => {
              setSelectedProductType('Bonnets');
              setActivePage('products');
            }}
            className="hover:text-[#d9006c] transition font-bold"
          >
            Bonnets
          </button>
          <button 
            onClick={() => {
              setSelectedProductType('All Products');
              setActivePage('products');
            }}
            className="hover:text-[#d9006c] transition font-bold"
          >
            Products
          </button>
        </div>
      </nav>
    </header>
  );
}

