import React, { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export default function AdminCategories({ categories, setCategories }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  
  const defaultCategoryState = { id: '', name: '', productCount: 0 };
  const [currentCategory, setCurrentCategory] = useState(defaultCategoryState);

  const openAddModal = () => {
    setModalMode('add');
    setCurrentCategory({ ...defaultCategoryState, id: `CAT-${Date.now()}` });
    setIsModalOpen(true);
  };

  const openEditModal = (category) => {
    setModalMode('edit');
    setCurrentCategory(category);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      setCategories(categories.filter(c => c.id !== id));
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (modalMode === 'add') {
      setCategories([...categories, currentCategory]);
    } else {
      setCategories(categories.map(c => c.id === currentCategory.id ? currentCategory : c));
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="uppercase tracking-[0.3em] text-sm text-[#3a5c4b]">Taxonomy</p>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2 text-[#d9006c]">Categories</h2>
        </div>
        
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 bg-[#d9006c] text-white px-6 py-3 rounded uppercase tracking-widest text-sm hover:bg-[#ec4899] transition-colors whitespace-nowrap shadow-sm"
        >
          <Plus size={18} />
          Add Category
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-[#e7e1d8] overflow-hidden max-w-4xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-[#fcfbf9] border-b border-[#e7e1d8]">
                <th className="px-6 py-4 uppercase tracking-widest text-xs font-semibold text-gray-500 w-24">ID</th>
                <th className="px-6 py-4 uppercase tracking-widest text-xs font-semibold text-gray-500">Name</th>
                <th className="px-6 py-4 uppercase tracking-widest text-xs font-semibold text-gray-500">Products</th>
                <th className="px-6 py-4 uppercase tracking-widest text-xs font-semibold text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e7e1d8]">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-[#fcfbf9] transition-colors">
                  <td className="px-6 py-4 text-gray-500 text-sm font-mono">{category.id}</td>
                  <td className="px-6 py-4 font-bold text-[#d9006c]">{category.name}</td>
                  <td className="px-6 py-4">
                    <span className="bg-gray-100 text-[#d9006c] font-bold px-3 py-1 rounded-full text-xs">
                      {category.productCount} items
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => openEditModal(category)}
                      className="p-2 text-gray-400 hover:text-[#d9006c] transition-colors rounded hover:bg-gray-100"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(category.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded hover:bg-red-50"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {categories.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              No categories found.
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-lg p-6 sm:p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 text-[#d9006c] uppercase tracking-wide">
              {modalMode === 'add' ? 'Add Category' : 'Edit Category'}
            </h3>
            
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Category Name</label>
                <input 
                  type="text" 
                  required
                  value={currentCategory.name}
                  onChange={(e) => setCurrentCategory({...currentCategory, name: e.target.value})}
                  className="w-full border border-gray-300 rounded p-3 text-sm focus:border-[#d9006c] focus:ring-1 focus:ring-[#d9006c] outline-none transition-all" 
                  placeholder="e.g., Luxury Wigs"
                  autoFocus
                />
              </div>
              
              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded text-gray-600 font-semibold text-sm hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 rounded bg-[#d9006c] text-white font-semibold text-sm hover:bg-[#ec4899] transition-colors shadow-sm"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


