import React, { useEffect } from 'react';
import MaintenanceNotice from '../common/MaintenanceNotice';

export default function ProductsPage({
  selectedProductType,
  setActivePage,
  wigCategories,
  productCategories,
  setSelectedProduct,
  handleAddToCart,
  searchQuery = '',
  setSearchQuery,
  productSectionTarget = '',
  setProductSectionTarget,
  commerceDisabled = false,
  apiStatus
}) {
  const bonnetsDisplayLabel = 'Bonnets And Fashion/Lace Bands';
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const isSearching = normalizedQuery.length > 0;

  const getProductText = (product) => [
    product.title,
    product.name,
    product.description,
    product.details,
    product.category,
    product.type,
    product.style,
    product.price,
  ].filter(Boolean).join(' ').toLowerCase();

  const filterProducts = (products = []) => {
    if (!isSearching) return products;
    return products.filter((product) => getProductText(product).includes(normalizedQuery));
  };

  const displayedWigs = filterProducts(wigCategories);
  const displayedBonnets = filterProducts(productCategories['Bonnets']);
  const displayedLaceTints = filterProducts(productCategories['Lace Tints']);
  const displayedLaceGlues = filterProducts(productCategories['Lace Glues']);
  const displayedHairProducts = filterProducts(productCategories['Hair Products']);
  const searchResults = [
    ...(filterProducts(productCategories['Wigs']) || []),
    ...displayedBonnets,
    ...displayedLaceTints,
    ...displayedLaceGlues,
    ...displayedHairProducts,
  ].filter((product, index, products) => {
    const key = product.id || product._id || product.title || product.name || `${product.image}-${product.price}`;
    return products.findIndex((item) => {
      const itemKey = item.id || item._id || item.title || item.name || `${item.image}-${item.price}`;
      return itemKey === key;
    }) === index;
  });
  const resultCount = searchResults.length;

  useEffect(() => {
    if (!productSectionTarget || isSearching) return;

    const scrollTimer = window.setTimeout(() => {
      const section = document.getElementById(productSectionTarget);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      setProductSectionTarget?.('');
    }, 50);

    return () => window.clearTimeout(scrollTimer);
  }, [productSectionTarget, isSearching, setProductSectionTarget]);

  const renderProductCard = (product, key) => {
    const productName = product.title || product.name;
    const isWig = product.category === 'Wigs' || Boolean(product.title);

    return (
      <div
        key={key}
        onClick={() => { setSelectedProduct(product); setActivePage('details'); }}
        className="bg-white overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 group cursor-pointer flex flex-col h-full"
      >
        <div className="overflow-hidden bg-white">
          <img
            src={product.image}
            alt={productName}
            className="h-36 sm:h-48 w-full object-contain group-hover:scale-105 transition duration-500"
            onError={(e) => e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23e6e1da" width="100" height="100"/%3E%3Ctext x="50" y="50" font-family="Arial" font-size="14" fill="%23999" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E'}
          />
        </div>

        <div className="p-5 text-center flex flex-col flex-grow">
          <h3 className={isWig ? 'text-xl font-semibold uppercase tracking-wide' : 'font-semibold text-lg'}>
            {productName}
          </h3>
          {product.description && (
            <p className="text-sm text-gray-500 mt-2 flex-grow line-clamp-2">{product.description}</p>
          )}

          <div className="mt-auto">
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

        {commerceDisabled && (
          <MaintenanceNotice
            onRetry={apiStatus?.retry}
            isChecking={apiStatus?.isChecking}
            compact
          />
        )}
      </div>
    );
  };

  return (
    <section className="min-h-screen bg-[#D5E8D4] px-4 py-8 sm:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div>
            <p className="uppercase tracking-[0.3em] text-sm text-[#d9006c] font-bold">
              Browse Collection
            </p>
            <h2 className="text-5xl font-black mt-3 uppercase">
              {isSearching
                ? resultCount > 0 ? 'Search Results' : 'No Results'
                : selectedProductType === 'All Products'
                  ? 'All Products'
                  : selectedProductType === 'Bonnets'
                    ? bonnetsDisplayLabel
                    : selectedProductType}
            </h2>
            {isSearching && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <p className="text-sm text-[#d9006c]">
                  {resultCount > 0
                    ? `${resultCount} result${resultCount === 1 ? '' : 's'} for "${searchQuery}"`
                    : `No results for "${searchQuery}"`}
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="border border-[#d9006c] px-4 py-2 text-xs uppercase tracking-[0.15em] hover:bg-[#d9006c] hover:text-white transition-all duration-300"
                >
                  Clear Search
                </button>
              </div>
            )}
          </div>
        </div>

        {isSearching && (
          <>
            {resultCount > 0 ? (
              <div className="mb-8">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
                  {searchResults.map((product, index) => renderProductCard(product, `search-${index}`))}
                </div>
              </div>
            ) : (
              <div className="bg-white px-6 py-12 text-center shadow-sm">
                <p className="text-[#d9006c]">
                  Try a different product name, style, or category.
                </p>
              </div>
            )}
          </>
        )}

        {/* WIGS SECTION */}
        {!isSearching && (selectedProductType === 'Wigs' || selectedProductType === 'All Products') && (
          <div id="products-wigs" className="mb-8 scroll-mt-28">
            {selectedProductType === 'All Products' && (
              <h3 className="text-4xl font-bold uppercase tracking-wide mb-8 text-[#1a1a1a]">Wigs</h3>
            )}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
              {displayedWigs.map((wig, index) => (
                <div
                  key={`wig-${index}`}
                  onClick={() => { setSelectedProduct(wig); setActivePage('details'); }}
                  className="bg-white overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 group cursor-pointer flex flex-col h-full"
                >
                  <div className="overflow-hidden bg-white">
                    <img
                      src={wig.image}
                      alt={wig.title}
                      className="h-36 sm:h-48 w-full object-contain group-hover:scale-105 transition duration-500"
                    />
                  </div>

                  <div className="p-5 text-center flex flex-col flex-grow">
                    <h3 className="text-xl font-semibold uppercase tracking-wide">
                      {wig.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-2 flex-grow line-clamp-2">{wig.description}</p>
                    
                    <div className="mt-auto">
                      <p className="mt-4 font-bold text-lg text-[#1a1a1a] ">{wig.price}</p>

                      <div className="space-y-3 mt-5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProduct(wig);
                            setActivePage('details');
                          }}
                          className="border border-[#d9006c] text-[#1a1a1a] px-5 py-3 text-sm uppercase tracking-[0.2em] hover:bg-[#d9006c] hover:text-white transition-all duration-300 w-full"
                        >
                          View Details
                        </button>

                        <button
                          onClick={(e) => { e.stopPropagation(); handleAddToCart(wig); }}
                          disabled={commerceDisabled}
                          title={commerceDisabled ? 'Shopping is temporarily unavailable while store services reconnect.' : 'Add to cart'}
                          className="w-full bg-[#d9006c] text-white px-4 py-3 text-sm uppercase tracking-[0.2em] hover:bg-[#ec4899] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {commerceDisabled ? 'Unavailable' : 'Add To Cart'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BONNETS AND HEAD BANDS SECTION */}
        {!isSearching && (selectedProductType === 'Bonnets' || selectedProductType === 'All Products') && (
          <div id="products-bonnets" className="mb-8 scroll-mt-28">
            {selectedProductType === 'All Products' && (
              <h3 className="text-4xl font-bold uppercase tracking-wide mb-8 text-[#1a1a1a]">
                {bonnetsDisplayLabel}
              </h3>
            )}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
              {displayedBonnets.map((product, index) => (
                <div
                  key={`bonnet-${index}`}
                  onClick={() => { setSelectedProduct(product); setActivePage('details'); }}
                  className="bg-white overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 group cursor-pointer flex flex-col h-full"
                >
                  <div className="overflow-hidden bg-white">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-36 sm:h-48 w-full object-contain group-hover:scale-105 transition duration-500"
                      onError={(e) => e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23e6e1da" width="100" height="100"/%3E%3Ctext x="50" y="50" font-family="Arial" font-size="14" fill="%23999" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E'}
                    />
                  </div>

                  <div className="p-5 text-center flex flex-col flex-grow">
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    
                    <div className="mt-auto">
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
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LACE SECTION */}
        {!isSearching && (selectedProductType === 'Lace Tints' || selectedProductType === 'All Products') && (
          <div id="products-lace-tints" className="mb-8 scroll-mt-28">
            {selectedProductType === 'All Products' && (
              <h3 className="text-4xl font-bold uppercase tracking-wide mb-8 text-[#1a1a1a]">Lace Tints</h3>
            )}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
              {displayedLaceTints.map((product, index) => (
                <div
                  key={`lace-${index}`}
                  onClick={() => { setSelectedProduct(product); setActivePage('details'); }}
                  className="bg-white overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 group cursor-pointer flex flex-col h-full"
                >
                  <div className="overflow-hidden bg-white">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-36 sm:h-48 w-full object-contain group-hover:scale-105 transition duration-500"
                      onError={(e) => e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23e6e1da" width="100" height="100"/%3E%3Ctext x="50" y="50" font-family="Arial" font-size="14" fill="%23999" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E'}
                    />
                  </div>

                  <div className="p-5 text-center flex flex-col flex-grow">
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    
                    <div className="mt-auto">
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
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LACE GLUES SECTION */}
        {!isSearching && (selectedProductType === 'Lace Glues' || selectedProductType === 'Hair Products' || selectedProductType === 'All Products') && (
          <div id="products-lace-glues" className="mb-8 scroll-mt-28">
            {selectedProductType === 'All Products' && (
              <h3 className="text-4xl font-bold uppercase tracking-wide mb-8 text-[#1a1a1a]">Lace Glues</h3>
            )}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
              {displayedLaceGlues.map((product, index) => (
                <div
                  key={`laceglue-${index}`}
                  onClick={() => { setSelectedProduct(product); setActivePage('details'); }}
                  className="bg-white overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 group cursor-pointer flex flex-col h-full"
                >
                  <div className="overflow-hidden bg-white">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-36 sm:h-48 w-full object-contain group-hover:scale-105 transition duration-500"
                      onError={(e) => e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23e6e1da" width="100" height="100"/%3E%3Ctext x="50" y="50" font-family="Arial" font-size="14" fill="%23999" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E'}
                    />
                  </div>

                  <div className="p-5 text-center flex flex-col flex-grow">
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    
                    <div className="mt-auto">
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
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HAIR CARE PRODUCTS SECTION */}
        {!isSearching && (selectedProductType === 'Hair Products' || selectedProductType === 'All Products') && (
          <div id="products-hair-care" className="mb-8 scroll-mt-28">
            {selectedProductType === 'All Products' && (
              <h3 className="text-4xl font-bold uppercase tracking-wide mb-8 text-[#1a1a1a]">Hair Care</h3>
            )}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
              {displayedHairProducts.map((product, index) => (
                <div
                  key={`haircare-${index}`}
                  onClick={() => { setSelectedProduct(product); setActivePage('details'); }}
                  className="bg-white overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 group cursor-pointer flex flex-col h-full"
                >
                  <div className="overflow-hidden bg-white">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-36 sm:h-48 w-full object-contain group-hover:scale-105 transition duration-500"
                      onError={(e) => e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23e6e1da" width="100" height="100"/%3E%3Ctext x="50" y="50" font-family="Arial" font-size="14" fill="%23999" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E'}
                    />
                  </div>

                  <div className="p-5 text-center flex flex-col flex-grow">
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    
                    <div className="mt-auto">
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
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4">
          <button
            onClick={() => setActivePage('home')}
            className="w-full bg-[#d9006c] text-white px-4 py-3 text-sm uppercase tracking-[0.2em] font-semibold hover:bg-[#ec4899] transition-all duration-300"
          >
            Back
          </button>
        </div>

      </div>
    </section>
  );
}






