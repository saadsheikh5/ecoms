import React from 'react';

export default function StyleCategories({
  selectedCategory,
  setSelectedCategory,
  wigCategories,
  filteredWigs,
  setSelectedProduct,
  setActivePage,
  handleAddToCart,
  commerceDisabled = false
}) {
  return (
    <section id="categories" className="py-8 px-4 sm:px-6 lg:px-10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <p className="uppercase tracking-[0.3em] text-sm text-[#d9006c] font-bold">
            Wig Collections
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold mt-3">
            Shop By Style
          </h2>


        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
          {filteredWigs.map((wig, index) => (
            <div
              key={index}
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
                  <p className="mt-4 font-bold text-lg">{wig.price}</p>

                  <div className="space-y-3 mt-5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProduct(wig);
                        setActivePage('details');
                      }}
                      className="border border-[#d9006c] text-[#d9006c] px-5 py-3 text-sm uppercase tracking-[0.2em] hover:bg-[#d9006c] hover:text-white transition-all duration-300 w-full"
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
    </section>
  );
}


