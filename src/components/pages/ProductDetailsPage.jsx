import React, { useState, useEffect, useLayoutEffect } from 'react';
import { Star, MessageSquare, CheckCircle, ArrowLeft } from 'lucide-react';
import { getReviews, createReview } from '../../api/services';
import { isMockDataAllowed } from '../../api/status';

export default function ProductDetailsPage({
  selectedProduct,
  setActivePage,
  handleAddToCart,
  commerceDisabled = false
}) {
  const [selectedLength, setSelectedLength] = useState('');
  const [selectedDensity, setSelectedDensity] = useState('');
  const [activeImage, setActiveImage] = useState(selectedProduct?.image || '');
  
  // Reviews States
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [formName, setFormName] = useState('');
  const [formRating, setFormRating] = useState(5);
  const [formComment, setFormComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const productId = selectedProduct.id || selectedProduct._id || selectedProduct.title || selectedProduct.name;
  const productName = selectedProduct.title || selectedProduct.name;
  const productCategory = selectedProduct.adminCategory || selectedProduct.category || 'Wigs';
  const productImages = selectedProduct.images?.length
    ? selectedProduct.images
    : (selectedProduct.image ? [selectedProduct.image] : []);

  // Derive if it's a wig category
  const isWigCategory = selectedProduct.category === 'Wigs' || selectedProduct.adminCategory === 'Wigs' || !!selectedProduct.style;

  // Look up matching variant dynamically if selected
  const selectedVariant = isWigCategory && selectedProduct.variants
    ? selectedProduct.variants.find(v => v.length === selectedLength && v.density === selectedDensity)
    : null;

  // Dynamically update active price
  const activePrice = (() => {
    if (selectedVariant) {
      // A specific variant is chosen — show exact price with $ sign
      if (typeof selectedVariant.price === 'number') return `$${selectedVariant.price.toFixed(2)}`;
      if (typeof selectedVariant.price === 'string' && !selectedVariant.price.includes('$')) {
        const num = parseFloat(selectedVariant.price);
        return !isNaN(num) ? `$${num.toFixed(2)}` : selectedVariant.price;
      }
      return selectedVariant.price;
    }
    // No variant selected — show base product price (already normalized to "From $X" for wigs)
    return selectedProduct.price;
  })();

  // Dynamically update active stock
  const activeStock = selectedVariant
    ? selectedVariant.stock
    : (selectedProduct.stock !== undefined ? selectedProduct.stock : 10);

  // Extract unique available lengths and densities from variants dynamically
  const availableLengths = isWigCategory && selectedProduct.variants && selectedProduct.variants.length > 0
    ? [...new Set(selectedProduct.variants.map(v => v.length))]
    : isMockDataAllowed ? ['14 inch', '16 inch', '18 inch', '20 inch', '22 inch', '24 inch', '30 inch'] : [];

  const availableDensities = isWigCategory && selectedProduct.variants && selectedProduct.variants.length > 0
    ? [...new Set(selectedProduct.variants.map(v => v.density))]
    : isMockDataAllowed ? ['150%', '180%', '200%', '230%', '250%'] : [];

  // --- Fetch Reviews on Mount ---
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [productId]);

  useEffect(() => {
    setActiveImage(productImages[0] || selectedProduct.image || '');
  }, [selectedProduct, productImages[0]]);

  useEffect(() => {
    async function loadReviews() {
      setLoadingReviews(true);
      try {
        const liveReviews = await getReviews(productName);
        setReviews(liveReviews);
      } catch (err) {
        if (!isMockDataAllowed) {
          setReviews([]);
          return;
        }
        console.warn('Backend reviews offline. Development mock reviews are being used.', err);
        const initialMocks = [
          {
            id: 'mock-1',
            customerName: 'Sarah Smith',
            category: productCategory,
            rating: 5,
            comment: 'Absolutely love the quality! The lace melts perfectly into the skin.',
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'mock-2',
            customerName: 'Jane Doe',
            category: productCategory,
            rating: 4,
            comment: 'Matches my skin perfectly. Very comfortable to wear all day.',
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'mock-3',
            customerName: 'Alicia Keys',
            category: productCategory,
            rating: 5,
            comment: 'So soft and holds curls incredibly well. Will purchase again!',
            createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
          }
        ];
        const storedReviews = localStorage.getItem(`local_reviews_${productId}`);
        if (storedReviews) {
          setReviews(JSON.parse(storedReviews));
        } else {
          setReviews(initialMocks);
          localStorage.setItem(`local_reviews_${productId}`, JSON.stringify(initialMocks));
        }
      } finally {
        setLoadingReviews(false);
      }
    }

    if (selectedProduct) {
      loadReviews();
    }
  }, [selectedProduct, productId, productName, productCategory]);

  if (!selectedProduct) return null;

  const handleAddToCartWithSpecs = () => {
    if (commerceDisabled) {
      alert('Cart actions are temporarily unavailable while the store reconnects to the API.');
      return;
    }

    if (isWigCategory && (!selectedLength || !selectedDensity)) {
      alert("Please select both length and density before adding to cart.");
      return;
    }

    const productWithSpecs = {
      ...selectedProduct,
      price: activePrice,
      stock: activeStock,
      specs: isWigCategory ? {
        length: selectedLength,
        density: selectedDensity,
        sku: selectedVariant?.sku || ''
      } : null
    };
    handleAddToCart(productWithSpecs);
  };

  // --- Submit Review Handler ---
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!formName.trim() || !formComment.trim()) return;

    setSubmittingReview(true);
    const newReview = {
      product: productName,
      category: productCategory,
      customerName: formName,
      rating: formRating,
      comment: formComment
    };

    try {
      const addedReview = await createReview(newReview);
      setReviews([addedReview, ...reviews]);
      setSubmitSuccess(true);
    } catch (err) {
      if (!isMockDataAllowed) {
        console.error('Review submission failed while API is unavailable.', err);
        return;
      }
      console.warn('Backend reviews submit failed. Saving development review to local storage.', err);
      const mockSubmitted = {
        id: `mock-${Date.now()}`,
        customerName: formName,
        category: productCategory,
        rating: formRating,
        comment: formComment,
        createdAt: new Date().toISOString()
      };
      const updated = [mockSubmitted, ...reviews];
      setReviews(updated);
      localStorage.setItem(`local_reviews_${productId}`, JSON.stringify(updated));
      setSubmitSuccess(true);
    } finally {
      setSubmittingReview(false);
      setFormName('');
      setFormComment('');
      setFormRating(5);
      setTimeout(() => setSubmitSuccess(false), 5000);
    }
  };

  // Calculations for reviews stats
  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '5.0';

  const starCounts = [5, 4, 3, 2, 1].map(stars => {
    const count = reviews.filter(r => r.rating === stars).length;
    const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
    return { stars, percentage, count };
  });

  return (
    <section className="min-h-screen bg-[#D5E8D4] px-4 py-8 sm:px-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => setActivePage('products')}
          className="flex items-center justify-center gap-2 bg-[#d9006c] text-white px-4 py-3 text-sm uppercase tracking-[0.2em] font-semibold hover:bg-[#ec4899] transition-all duration-300 mb-8 w-full sm:w-fit"
        >
          <ArrowLeft size={16} />
          Back to Products
        </button>
        
        {/* Main Product Info Card */}
        <div className="bg-white shadow-sm border border-[#f9c0d9] overflow-hidden p-0 sm:p-10 lg:p-14">
          <div className="grid lg:grid-cols-2 gap-0 sm:gap-10 lg:gap-14 items-start">
            {/* Left: Product Image */}
            <div className="overflow-hidden bg-white sm:bg-gray-50 sm:border sm:border-gray-100 sm:shadow-sm">
              <img
                src={activeImage || selectedProduct.image}
                alt={productName}
                className="w-full h-64 sm:h-[600px] object-contain transition-transform duration-500 hover:scale-105"
                onError={(e) => e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23e6e1da" width="100" height="100"/%3E%3Ctext x="50" y="50" font-family="Arial" font-size="14" fill="%23999" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E'}
              />
              {productImages.length > 1 && (
                <div className="grid grid-cols-5 gap-2 border-t border-gray-100 bg-white p-3">
                  {productImages.map((image, index) => (
                    <button
                      type="button"
                      key={`${image}-${index}`}
                      onClick={() => setActiveImage(image)}
                      className={`aspect-square rounded border bg-gray-50 p-1 transition-colors ${
                        activeImage === image ? 'border-[#d9006c]' : 'border-gray-200 hover:border-[#d9006c]'
                      }`}
                    >
                      <img src={image} alt={`${productName} ${index + 1}`} className="h-full w-full object-contain" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Info */}
            <div className="p-5 sm:p-0 space-y-5 sm:space-y-8 text-center sm:text-left">
              <div>
                <p className="uppercase tracking-[0.3em] text-xs text-[#d9006c] font-bold">
                  Premium Category
                </p>
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold mt-2 text-[#d9006c] leading-tight">
                  {productName}
                </h1>
                
                {/* Visual Average Rating stars */}
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-4">
                  <div className="flex text-amber-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={18}
                        fill={s <= Math.round(parseFloat(averageRating)) ? "currentColor" : "none"}
                        className="stroke-amber-500"
                      />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-[#d9006c]">{averageRating}</span>
                  <span className="text-xs text-gray-400">({reviews.length} Customer Reviews)</span>
                </div>
              </div>

              <p className="text-2xl sm:text-4xl font-extrabold text-[#d9006c]">
                {activePrice}
              </p>

              <div className="text-xs uppercase tracking-widest font-bold text-gray-500 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                Availability:
                {commerceDisabled ? (
                  <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded">Live inventory unavailable</span>
                ) : isWigCategory && (!selectedLength || !selectedDensity) ? (
                  <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded">Select options to check stock</span>
                ) : activeStock > 0 ? (
                  <span className="text-green-700 bg-green-50 px-2 py-0.5 rounded">In Stock ({activeStock} available)</span>
                ) : (
                  <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded">Out of Stock</span>
                )}
              </div>

              <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                {selectedProduct.description || selectedProduct.details || 'Premium quality product meticulously crafted for excellence, aesthetic durability, and seamless style blending.'}
              </p>

              {/* Specifications selectors for Wigs */}
              {isWigCategory && (
                <div className="space-y-4">
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500">
                    Custom Options
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <select 
                      value={selectedLength}
                      onChange={(e) => setSelectedLength(e.target.value)}
                      disabled={commerceDisabled || availableLengths.length === 0}
                      className="border border-gray-300 rounded p-3 text-sm bg-white focus:border-[#d9006c] outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Select Length</option>
                      {availableLengths.map(len => (
                        <option key={len} value={len}>{len}</option>
                      ))}
                    </select>

                    <select 
                      value={selectedDensity}
                      onChange={(e) => setSelectedDensity(e.target.value)}
                      disabled={commerceDisabled || availableDensities.length === 0}
                      className="border border-gray-300 rounded p-3 text-sm bg-white focus:border-[#d9006c] outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Select Density</option>
                      {availableDensities.map(den => (
                        <option key={den} value={den}>{den} Density</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4">
                <button
                  onClick={handleAddToCartWithSpecs}
                  disabled={commerceDisabled || (isWigCategory && (availableLengths.length === 0 || availableDensities.length === 0))}
                  title={commerceDisabled ? 'Shopping is temporarily unavailable while store services reconnect.' : 'Add to cart'}
                  className="flex-1 bg-[#d9006c] text-white px-4 py-3 text-sm uppercase tracking-[0.2em] font-semibold hover:bg-[#ec4899] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {commerceDisabled ? 'Cart Unavailable' : 'Add To Cart'}
                </button>
                <button
                  onClick={() => setActivePage('products')}
                  className="flex-1 bg-[#d9006c] text-white px-4 py-3 text-sm uppercase tracking-[0.2em] font-semibold hover:bg-[#ec4899] transition-all duration-300"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CUSTOMER REVIEWS & FEEDBACK SYSTEM */}
        <div className="bg-white rounded-lg shadow-sm border border-[#e7e1d8] overflow-hidden p-6 sm:p-10 lg:p-14 mt-8 space-y-12">
          
          {/* Header Title */}
          <div className="border-b border-gray-100 pb-6">
            <h2 className="text-2xl font-bold uppercase tracking-wider text-[#d9006c] flex items-center gap-3">
              <MessageSquare size={24} className="text-[#d9006c]" />
              Customer Experience
            </h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-10 items-start">
            
            {/* Column 1: Rating breakdown */}
            <div className="space-y-6 lg:border-r border-gray-100 lg:pr-8">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-2">Overall Rating</p>
                <div className="flex items-end gap-3">
                  <span className="text-6xl font-black text-[#d9006c] leading-none">{averageRating}</span>
                  <div className="space-y-1 pb-1">
                    <div className="flex text-amber-500">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={14}
                          fill={s <= Math.round(parseFloat(averageRating)) ? "currentColor" : "none"}
                          className="stroke-amber-500"
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 font-medium">Based on {reviews.length} reviews</p>
                  </div>
                </div>
              </div>

              {/* Progress bars */}
              <div className="space-y-3 pt-2">
                {starCounts.map(({ stars, percentage, count }) => (
                  <div key={stars} className="flex items-center gap-3 text-xs text-gray-600 font-semibold">
                    <span className="w-12 text-right">{stars} star</span>
                    <div className="flex-1 bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-amber-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-8 text-gray-400">({count})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: Write a review form */}
            <div className="bg-[#fcfbf9] rounded-lg p-6 border border-[#e7e1d8] space-y-5">
              <h3 className="text-lg font-bold text-[#d9006c] uppercase tracking-wider">
                Write a Review
              </h3>

              {submitSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded flex items-center gap-2">
                  <CheckCircle size={16} />
                  Thank you! Your review was successfully submitted.
                </div>
              )}

              <form onSubmit={handleSubmitReview} className="space-y-4">
                {/* Star rating selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                    Your Rating
                  </label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="transition-colors outline-none"
                      >
                        <Star
                          size={28}
                          fill={star <= (hoverRating || formRating) ? "#f59e0b" : "none"}
                          className={`stroke-2 ${
                            star <= (hoverRating || formRating)
                              ? "stroke-amber-500 text-amber-500"
                              : "stroke-gray-300 text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Sophia L."
                    className="w-full border border-gray-300 rounded p-2.5 text-sm bg-white focus:border-[#d9006c] focus:ring-1 focus:ring-[#d9006c] outline-none"
                  />
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5">
                    Review Text
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formComment}
                    onChange={(e) => setFormComment(e.target.value)}
                    placeholder="Share your thoughts about this product's quality, texture, and lace fit..."
                    className="w-full border border-gray-300 rounded p-2.5 text-sm bg-white focus:border-[#d9006c] focus:ring-1 focus:ring-[#d9006c] outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview || !formName || !formComment || commerceDisabled}
                  className="w-full bg-[#d9006c] text-white py-3 rounded uppercase tracking-widest text-sm font-semibold hover:bg-[#ec4899] transition-colors shadow-sm disabled:opacity-55 disabled:cursor-not-allowed"
                >
                  {commerceDisabled ? 'Reviews Unavailable' : submittingReview ? 'Submitting...' : 'Post Review'}
                </button>
              </form>
            </div>

            {/* Column 3: Live Reviews list */}
            <div className="lg:col-span-1 space-y-6">
              <h3 className="text-lg font-bold text-[#d9006c] uppercase tracking-wider border-b border-gray-100 pb-2">
                Recent Reviews ({reviews.length})
              </h3>

              {loadingReviews ? (
                <div className="text-center py-6 text-gray-400 text-sm">
                  Loading product experience...
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm italic">
                  Be the first to share your experience with this product!
                </div>
              ) : (
                <div className="space-y-5 max-h-[500px] overflow-y-auto pr-1">
                  {reviews.map((rev) => (
                    <div 
                      key={rev._id || rev.id}
                      className="border-b border-gray-100 pb-5 space-y-2.5 last:border-0"
                    >
                      {/* Name & Stars */}
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-[#d9006c] text-sm flex items-center gap-1.5">
                            {rev.customerName}
                            <span className="text-[10px] bg-green-50 text-green-700 font-bold px-1.5 py-0.5 rounded border border-green-200 flex items-center gap-0.5">
                              <CheckCircle size={10} /> Verified
                            </span>
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium">
                            {new Date(rev.createdAt || Date.now()).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex text-amber-500">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={12}
                              fill={s <= rev.rating ? "currentColor" : "none"}
                              className="stroke-amber-500"
                            />
                          ))}
                        </div>
                      </div>

                      {/* Comment */}
                      <p className="text-xs text-gray-600 leading-relaxed italic">
                        "{rev.comment}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}





