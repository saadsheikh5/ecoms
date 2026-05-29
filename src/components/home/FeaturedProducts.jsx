import React from 'react';

export default function FeaturedProducts({
  featuredProducts,
  setSelectedProduct,
  setActivePage,
  handleAddToCart,
  setSelectedProductType,
  commerceDisabled = false
}) {
  const handleViewAll = () => {
    window.scrollTo(0, 0);
    if (setSelectedProductType) {
      setSelectedProductType('Wigs');
    }
    setActivePage('products');
  };

  return (
    <section id="products" className="py-8 px-4 sm:px-6 lg:px-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-6">
          <div>
            <p className="uppercase tracking-[0.3em] text-sm text-[#d9006c] font-bold">
              Best Sellers
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold mt-2">
              Featured Wigs
            </h2>
          </div>

          <button 
            onClick={handleViewAll} 
            className="border border-[#d9006c] text-[#d9006c] px-6 py-3 uppercase tracking-[0.2em] text-sm hover:bg-[#d9006c] hover:text-white transition-all duration-300 w-fit"
          >
            View All
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredProducts.map((product, index) => (
            <div
              key={index}
              onClick={() => { setSelectedProduct(product); setActivePage('details'); }}
              className="bg-white overflow-hidden group shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col h-full"
            >
              <div className="overflow-hidden relative bg-white">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-48 md:h-[240px] object-contain group-hover:scale-105 transition duration-500"
                />
                <div className="absolute top-4 left-4 bg-white px-4 py-2 text-xs uppercase tracking-[0.2em] font-semibold">
                  New
                </div>
              </div>

              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-2xl font-semibold leading-snug">
                  {product.title}
                </h3>
                <p className="text-gray-500 mt-2 text-sm leading-relaxed flex-grow line-clamp-2">
                  {product.description}
                </p>

                <div className="flex items-center justify-between mt-6 pt-2">
                  <p className="text-2xl font-bold">{product.price}</p>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProduct(product);
                        setActivePage('details');
                      }}
                      className="border border-[#d9006c] text-[#d9006c] px-4 py-2 text-xs uppercase tracking-[0.15em] hover:bg-[#d9006c] hover:text-white transition-all duration-300"
                    >
                      Details
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
    </section>
  );
}


