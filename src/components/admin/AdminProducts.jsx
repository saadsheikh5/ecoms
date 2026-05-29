import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

// --- Helper: Generate all length × density combinations ---
function generateVariants(lengths, densities, existingVariants = []) {
  const existingByOption = new Map(
    existingVariants.map((variant) => [`${variant.length}||${variant.density}`, variant])
  );
  const variants = [];
  lengths.forEach(length => {
    densities.forEach(density => {
      const existingVariant = existingByOption.get(`${length}||${density}`);
      variants.push(existingVariant || { length, density, price: '', stock: '' });
    });
  });
  return variants;
}

// --- Tag Input: type a value, press Enter or comma to add ---
function TagInput({ label, placeholder, tags, setTags }) {
  const [inputValue, setInputValue] = useState('');

  const addTag = () => {
    const val = inputValue.trim();
    if (val && !tags.includes(val)) {
      setTags([...tags, val]);
    }
    setInputValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const removeTag = (tag) => {
    setTags(tags.filter(t => t !== tag));
  };

  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
        {label}
      </label>
      <div className="flex flex-wrap gap-2 border border-gray-300 rounded p-2 min-h-[44px] focus-within:border-[#d9006c] focus-within:ring-1 focus-within:ring-[#d9006c]">
        {tags.map(tag => (
          <span
            key={tag}
            className="flex items-center gap-1 bg-[#d9006c] text-white text-xs font-semibold px-2 py-1 rounded"
          >
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className="hover:text-gray-300">
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[100px] outline-none text-sm bg-transparent"
        />
      </div>
      <p className="text-[11px] text-gray-400 mt-1">Type a value and press Enter to add.</p>
    </div>
  );
}

// --- Wig Variants Sub-Component ---
function WigVariantsSection({ variants, setVariants }) {
  const didMountRef = useRef(false);
  const [lengths, setLengths] = useState(() => (
    [...new Set((variants || []).map((variant) => variant.length).filter(Boolean))]
  ));
  const [densities, setDensities] = useState(() => (
    [...new Set((variants || []).map((variant) => variant.density).filter(Boolean))]
  ));

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    if (lengths.length > 0 && densities.length > 0) {
      setVariants(prev => generateVariants(lengths, densities, prev));
    } else {
      setVariants([]);
    }
  }, [lengths, densities]);

  const updateVariant = (index, field, value) => {
    setVariants(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v));
  };

  const deleteVariant = (index) => {
    setVariants(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="mt-6 border-t border-gray-200 pt-6 space-y-5">
      <div>
        <h4 className="text-base font-bold text-[#d9006c] uppercase tracking-widest mb-1">
          Wig Variants
        </h4>
        <p className="text-xs text-gray-500 mb-4">
          Enter lengths and densities — variants will be auto-generated for every combination.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TagInput
            label="Hair Lengths"
            placeholder="e.g. 14 inch, 16 inch..."
            tags={lengths}
            setTags={setLengths}
          />
          <TagInput
            label="Hair Densities"
            placeholder="e.g. 150%, 180%..."
            tags={densities}
            setTags={setDensities}
          />
        </div>
      </div>

      {variants.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">
            Generated Variants ({variants.length})
          </p>
          <div className="overflow-hidden border border-gray-200 rounded">
            <table className="w-full table-fixed text-sm">
              <thead>
                <tr className="bg-[#f6f2ee] border-b border-gray-200">
                  <th className="w-[22%] px-2 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-gray-500">Length</th>
                  <th className="w-[22%] px-2 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-gray-500">Density</th>
                  <th className="w-[22%] px-2 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-gray-500">Price ($)</th>
                  <th className="w-[18%] px-2 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-gray-500">Stock</th>
                  <th className="w-[16%] px-2 py-3 text-right text-[11px] font-bold uppercase tracking-widest text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {variants.map((variant, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-2 py-2">
                      <input
                        type="text" placeholder="Length"
                        value={variant.length}
                        onChange={(e) => updateVariant(index, 'length', e.target.value)}
                        className="w-full min-w-0 border border-gray-300 rounded px-2 py-1 text-sm font-semibold text-[#d9006c] focus:border-[#d9006c] focus:ring-1 focus:ring-[#d9006c] outline-none"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text" placeholder="Density"
                        value={variant.density}
                        onChange={(e) => updateVariant(index, 'density', e.target.value)}
                        className="w-full min-w-0 border border-gray-300 rounded px-2 py-1 text-sm focus:border-[#d9006c] focus:ring-1 focus:ring-[#d9006c] outline-none"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number" step="0.01" min="0" placeholder="0.00"
                        value={variant.price}
                        onChange={(e) => updateVariant(index, 'price', e.target.value)}
                        className="w-full min-w-0 border border-gray-300 rounded px-2 py-1 text-sm focus:border-[#d9006c] focus:ring-1 focus:ring-[#d9006c] outline-none"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number" min="0" placeholder="0"
                        value={variant.stock}
                        onChange={(e) => updateVariant(index, 'stock', e.target.value)}
                        className="w-full min-w-0 border border-gray-300 rounded px-2 py-1 text-sm focus:border-[#d9006c] focus:ring-1 focus:ring-[#d9006c] outline-none"
                      />
                    </td>
                    <td className="px-2 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => deleteVariant(index)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        title="Delete variant"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {lengths.length > 0 && densities.length === 0 && (
        <p className="text-xs text-amber-600 font-semibold">⚠ Add at least one density to generate variants.</p>
      )}
      {densities.length > 0 && lengths.length === 0 && (
        <p className="text-xs text-amber-600 font-semibold">⚠ Add at least one length to generate variants.</p>
      )}
    </div>
  );
}

// --- Main AdminProducts Component ---
export default function AdminProducts({ products, setProducts, categories }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [error, setError] = useState('');

  const defaultProductState = {
    id: '',
    title: '',
    adminCategory: categories[0]?.name || 'Wigs',
    price: 0,
    stock: 10,
    image: '',
    images: [],
    imageFiles: [],
    description: '',
    isFeatured: false,
    variants: [],
  };

  const [currentProduct, setCurrentProduct] = useState(defaultProductState);
  const [wigVariants, setWigVariants] = useState([]);

  const isWigCategory = currentProduct.adminCategory === 'Wigs';
  const visibleProducts = categoryFilter === 'All Categories'
    ? products
    : products.filter(product => (product.adminCategory || product.category) === categoryFilter);

  const openAddModal = () => {
    setModalMode('add');
    setCurrentProduct({ ...defaultProductState, id: `prod-${Date.now()}` });
    setWigVariants([]);
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setModalMode('edit');
    setCurrentProduct({
      ...product,
      title: product.title || product.name || '',
      price: typeof product.price === 'string'
        ? parseFloat(product.price.replace(/[^0-9.-]+/g, ''))
        : product.price,
      images: product.images?.length ? product.images : (product.image ? [product.image] : []),
      imageFiles: [],
    });
    setWigVariants(product.variants || []);
    setIsModalOpen(true);
  };

  const getExistingImages = () => (
    (currentProduct.images || []).filter((image) => !String(image).startsWith('data:'))
  );

  const handleImageSelection = (files) => {
    const selectedFiles = Array.from(files || []);
    if (selectedFiles.length === 0) return;

    const readers = selectedFiles.map((file) => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    }));

    Promise.all(readers).then((previews) => {
      setCurrentProduct((product) => {
        const nextImages = [...(product.images || []), ...previews].slice(0, 8);
        const nextFiles = [...(product.imageFiles || []), ...selectedFiles].slice(0, 8);

        return {
          ...product,
          images: nextImages,
          imageFiles: nextFiles,
          image: nextImages[0] || '',
        };
      });
    });
  };

  const handleRemoveImage = (indexToRemove) => {
    setCurrentProduct((product) => {
      let previewIndex = -1;
      const nextFiles = [...(product.imageFiles || [])];
      const nextImages = (product.images || []).filter((image, index) => {
        const isPreview = String(image).startsWith('data:');
        if (isPreview) previewIndex += 1;
        const keep = index !== indexToRemove;
        if (!keep && isPreview) nextFiles.splice(previewIndex, 1);
        return keep;
      });

      return {
        ...product,
        images: nextImages,
        imageFiles: nextFiles,
        image: nextImages[0] || '',
      };
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setError('');
      try {
        await setProducts(products.filter(p => p.id !== id));
      } catch (err) {
        setError(err.message || 'Unable to delete product while the backend is unavailable.');
      }
    }
  };

  const handleToggleFeatured = async (product) => {
    const isWig = (product.adminCategory || product.category) === 'Wigs';
    if (!isWig) return;

    setError('');
    try {
      await setProducts(products.map(p => (
        p.id === product.id ? { ...p, isFeatured: !p.isFeatured } : p
      )));
    } catch (err) {
      setError(err.message || 'Unable to update featured status while the backend is unavailable.');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const variantPrices = wigVariants
      .map(v => parseFloat(v.price))
      .filter(price => !Number.isNaN(price));
    const basePrice = parseFloat(currentProduct.price);

    if (isWigCategory && wigVariants.some(v => (
      Number.isNaN(parseFloat(v.price)) ||
      Number.isNaN(parseInt(v.stock, 10))
    ))) {
      setError('Every wig variant needs a price and stock quantity before saving.');
      return;
    }

    if ((currentProduct.images || []).length === 0 && (currentProduct.imageFiles || []).length === 0) {
      setError('Add at least one product image before saving.');
      return;
    }

    const formattedProduct = {
      ...currentProduct,
      name: currentProduct.title,
      image: currentProduct.images?.[0] || '',
      price: isWigCategory && variantPrices.length > 0
        ? `From $${Math.min(...variantPrices).toFixed(2)}`
        : `$${(Number.isNaN(basePrice) ? 0 : basePrice).toFixed(2)}`,
      isFeatured: isWigCategory ? Boolean(currentProduct.isFeatured) : false,
      variants: isWigCategory ? wigVariants : [],
      images: getExistingImages(),
    };

    setError('');
    try {
      if (modalMode === 'add') {
        await setProducts([formattedProduct, ...products]);
      } else {
        await setProducts(products.map(p => p.id === currentProduct.id ? formattedProduct : p));
      }
      setIsModalOpen(false);
    } catch (err) {
      setError(err.message || 'Unable to save product while the backend is unavailable.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="uppercase tracking-[0.3em] text-sm text-[#3a5c4b]">Inventory</p>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2 text-[#d9006c]">Products</h2>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-[#d9006c] text-white px-6 py-3 rounded uppercase tracking-widest text-sm hover:bg-[#ec4899] transition-colors whitespace-nowrap shadow-sm"
        >
          <Plus size={18} />
          Add Product
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-[#e7e1d8] p-4">
        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
          Filter By Category
        </label>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full sm:w-72 border border-gray-300 rounded p-3 text-sm focus:border-[#d9006c] focus:ring-1 focus:ring-[#d9006c] outline-none bg-white"
        >
          <option value="All Categories">All Categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm border border-[#e7e1d8] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#fcfbf9] border-b border-[#e7e1d8]">
                <th className="px-6 py-4 uppercase tracking-widest text-xs font-semibold text-gray-500">Product</th>
                <th className="px-6 py-4 uppercase tracking-widest text-xs font-semibold text-gray-500">Category</th>
                <th className="px-6 py-4 uppercase tracking-widest text-xs font-semibold text-gray-500">Price</th>
                <th className="px-6 py-4 uppercase tracking-widest text-xs font-semibold text-gray-500">Featured</th>
                <th className="px-6 py-4 uppercase tracking-widest text-xs font-semibold text-gray-500">Variants</th>
                <th className="px-6 py-4 uppercase tracking-widest text-xs font-semibold text-gray-500">Stock</th>
                <th className="px-6 py-4 uppercase tracking-widest text-xs font-semibold text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e7e1d8]">
              {visibleProducts.map((product) => (
                <tr key={product.id} className="hover:bg-[#fcfbf9] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={product.image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23e6e1da" width="100" height="100"/%3E%3Ctext x="50" y="50" font-family="Arial" font-size="10" fill="%23999" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E'}
                        alt={product.title || product.name}
                        className="w-12 h-12 object-contain rounded bg-gray-100 shadow-sm"
                        onError={(e) => e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23e6e1da" width="100" height="100"/%3E%3Ctext x="50" y="50" font-family="Arial" font-size="10" fill="%23999" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E'}
                      />
                      <span className="font-semibold text-[#d9006c]">{product.title || product.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs">{product.adminCategory}</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-[#d9006c] text-sm">{product.price}</td>
                  <td className="px-6 py-4">
                    {(product.adminCategory || product.category) === 'Wigs' ? (
                      <button
                        onClick={() => handleToggleFeatured(product)}
                        className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-widest transition-colors ${
                          product.isFeatured
                            ? 'bg-[#d9006c] text-white hover:bg-[#ec4899]'
                            : 'bg-[#f6f2ee] text-[#d9006c] hover:bg-[#e7e1d8]'
                        }`}
                        title={product.isFeatured ? 'Remove from Featured Wigs' : 'Add to Featured Wigs'}
                      >
                        {product.isFeatured ? 'Remove' : 'Feature'}
                      </button>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {product.variants && product.variants.length > 0 ? (
                      <span className="bg-blue-50 text-blue-700 font-bold px-2 py-1 rounded text-xs">
                        {product.variants.length} variants
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-bold ${
                      !product.variants?.length && product.stock < 5 ? 'text-red-500' : 'text-green-600'
                    }`}>
                      {product.variants?.length > 0 ? '—' : product.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(product)}
                      className="p-2 text-gray-400 hover:text-[#d9006c] transition-colors rounded hover:bg-gray-100"
                      title="Edit Product"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded hover:bg-red-50"
                      title="Delete Product"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {visibleProducts.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              No products found for this category.
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 z-[100] overflow-y-auto">
          <div className="bg-white rounded-lg p-6 sm:p-8 max-w-3xl w-full shadow-2xl my-8">
            <h3 className="text-2xl font-bold mb-6 text-[#d9006c] uppercase tracking-wide">
              {modalMode === 'add' ? 'Add New Product' : 'Edit Product'}
            </h3>

            <form onSubmit={handleSave} className="space-y-5">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Product Name</label>
                <input
                  type="text"
                  required
                  value={currentProduct.title}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, title: e.target.value, name: e.target.value })}
                  className="w-full border border-gray-300 rounded p-3 text-sm focus:border-[#d9006c] focus:ring-1 focus:ring-[#d9006c] outline-none"
                  placeholder="e.g., Body Wave Wig"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Category</label>
                <select
                  value={currentProduct.adminCategory}
                  onChange={(e) => {
                    setCurrentProduct({ ...currentProduct, adminCategory: e.target.value });
                    setWigVariants([]);
                  }}
                  className="w-full border border-gray-300 rounded p-3 text-sm focus:border-[#d9006c] focus:ring-1 focus:ring-[#d9006c] outline-none bg-white"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Description</label>
                <textarea
                  rows={2}
                  value={currentProduct.description}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, description: e.target.value })}
                  className="w-full border border-gray-300 rounded p-3 text-sm focus:border-[#d9006c] focus:ring-1 focus:ring-[#d9006c] outline-none resize-none"
                  placeholder="Short product description..."
                />
              </div>

              {isWigCategory && (
                <label className="flex items-center gap-3 rounded border border-[#e7e1d8] bg-[#fcfbf9] p-3 text-sm font-semibold text-[#d9006c]">
                  <input
                    type="checkbox"
                    checked={Boolean(currentProduct.isFeatured)}
                    onChange={(e) => setCurrentProduct({ ...currentProduct, isFeatured: e.target.checked })}
                    className="h-4 w-4 accent-[#d9006c]"
                  />
                  Show this wig in Featured Wigs
                </label>
              )}

              {/* Price & Stock — only shown if NOT a wig with variants */}
              {(!isWigCategory || wigVariants.length === 0) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      required={!isWigCategory}
                      value={currentProduct.price}
                      onChange={(e) => setCurrentProduct({ ...currentProduct, price: e.target.value })}
                      className="w-full border border-gray-300 rounded p-3 text-sm focus:border-[#d9006c] focus:ring-1 focus:ring-[#d9006c] outline-none"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Stock</label>
                    <input
                      type="number"
                      min="0"
                      required={!isWigCategory}
                      value={currentProduct.stock}
                      onChange={(e) => setCurrentProduct({ ...currentProduct, stock: parseInt(e.target.value) })}
                      className="w-full border border-gray-300 rounded p-3 text-sm focus:border-[#d9006c] focus:ring-1 focus:ring-[#d9006c] outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Product Image Upload */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Product Images</label>
                {currentProduct.images?.length > 0 && (
                  <div className="grid grid-cols-4 gap-3 mb-3">
                    {currentProduct.images.map((image, index) => (
                      <div key={`${image}-${index}`} className="relative rounded border border-gray-200 bg-gray-50 p-1">
                        <img
                          src={image}
                          alt={`Product preview ${index + 1}`}
                          className="w-full aspect-square object-contain rounded"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white shadow hover:bg-red-700"
                          title="Remove image"
                        >
                          <X size={14} />
                        </button>
                        {index === 0 && (
                          <span className="absolute bottom-1 left-1 rounded bg-[#d9006c] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
                            Main
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      handleImageSelection(e.target.files);
                      e.target.value = '';
                    }}
                    className="w-full border border-gray-300 rounded p-2 text-sm focus:border-[#d9006c] outline-none file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[#d9006c] file:text-white hover:file:bg-[#ec4899]"
                  />
                </div>
                <p className="mt-1 text-[11px] text-gray-400">You can upload up to 8 images. The first image is used on product cards.</p>
              </div>

              {/* Wig Variants Section — only for Wigs */}
              {isWigCategory && (
                <WigVariantsSection
                  variants={wigVariants}
                  setVariants={setWigVariants}
                />
              )}

              {/* Actions */}
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
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}



