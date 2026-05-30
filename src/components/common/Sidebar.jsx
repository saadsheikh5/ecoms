import React from 'react';
import { X } from 'lucide-react';

export default function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  setSelectedProductType,
  setActivePage,
  setProductSectionTarget,
  setSearchQuery
}) {
  if (!sidebarOpen) return null;

  const bonnetsDisplayLabel = 'Bonnets And Fashion/Lace Head Bands';
  const categories = [
    { label: 'Wigs', sectionId: 'products-wigs' },
    { label: bonnetsDisplayLabel, sectionId: 'products-bonnets' },
    { label: 'Lace Tints', sectionId: 'products-lace-tints' },
    { label: 'Lace Glues', sectionId: 'products-lace-glues' },
    { label: 'Hair Care', sectionId: 'products-hair-care' },
  ];

  const handleCategoryClick = (sectionId) => {
    setSearchQuery?.('');
    setSelectedProductType('All Products');
    setProductSectionTarget(sectionId);
    setActivePage('products');
    setSidebarOpen(false);
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/40 z-40"
        onClick={() => setSidebarOpen(false)}
      ></div>
      <div className="fixed left-0 top-0 h-full w-64 bg-white z-50 shadow-xl overflow-y-auto">
        <div className="p-6">
          <button 
            onClick={() => setSidebarOpen(false)}
            className="absolute top-4 right-4 text-[#1a1a1a]"
          >
            <X size={24} />
          </button>
          
          <h2 className="text-2xl font-bold text-[#1a1a1a] mb-8 mt-8">Menu</h2>
          
          <div className="space-y-4">
            {categories.map(category => (
              <button
                key={category.sectionId}
                onClick={() => handleCategoryClick(category.sectionId)}
                className="block w-full text-left font-bold text-[#1a1a1a] text-lg hover:text-[#d9006c] transition"
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

