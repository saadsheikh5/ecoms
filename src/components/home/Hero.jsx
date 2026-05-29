import React from 'react';

export default function Hero({ onShopNowClick }) {
  const handleScrollToCategories = () => {
    if (onShopNowClick) {
      onShopNowClick();
    } else {
      const categoriesSection = document.getElementById('categories');
      if (categoriesSection) {
        categoriesSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <section
      id="home"
      className="relative min-h-[80vh] flex items-center justify-center text-center overflow-hidden"
    >
      <img
        src="images/bg-image.jpeg"
        alt="Luxury wigs"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/35"></div>

      <div className="relative z-10 px-6 max-w-3xl text-white">
        <p className="uppercase tracking-[0.3em] text-sm mb-5">
          Luxury Human Hair Wigs
        </p>
        <h2 className="text-5xl sm:text-7xl font-black leading-none mb-6">
          WE’VE GOT YOU COVERED
        </h2>
        <button 
          onClick={handleScrollToCategories}
          className="bg-[#d9006c] text-white px-10 py-4 font-semibold tracking-[0.15em] uppercase hover:bg-[#ec4899] transition-all duration-300"
        >
          Shop Now
        </button>
      </div>
    </section>
  );
}

