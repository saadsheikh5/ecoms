import React from 'react';

export default function PromoBanner({
  setActivePage,
  setSelectedProductType,
  setProductSectionTarget,
  setSearchQuery
}) {
  return (
    <section className="bg-[#D5E8D4] py-8 px-6 text-center">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-5xl sm:text-7xl font-black leading-none uppercase text-[#d9006c]">
          Hair Care Products
        </h2>

        <div className="w-44 h-2 bg-[#d9006c] mx-auto rounded-full mt-8 mb-6"></div>

        <button 
          onClick={() => {
            setSearchQuery?.('');
            if (setSelectedProductType) {
              setSelectedProductType('All Products');
            }
            setProductSectionTarget?.('products-hair-care');
            setActivePage('products');
          }} 
          className="bg-[#d9006c] text-white px-10 py-5 uppercase tracking-[0.2em] font-semibold hover:bg-[#ec4899] transition-all duration-300"
        >
          Shop Now
        </button>
      </div>
    </section>
  );
}

