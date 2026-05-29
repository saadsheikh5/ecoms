import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Star } from 'lucide-react';

export default function AdminReviews({ reviews, setReviews, categories = [] }) {
  const categoryOptions = categories.length > 0
    ? categories
    : [{ id: 'category-wigs', name: 'Wigs' }];
  const defaultCategory = categoryOptions[0].name;
  const getReviewCategory = (category) => (
    categoryOptions.some(option => option.name === category) ? category : defaultCategory
  );

  const [isAddingReview, setIsAddingReview] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [error, setError] = useState('');
  const [newReview, setNewReview] = useState({
    customer: '',
    product: '',
    category: defaultCategory,
    rating: 5,
    comment: '',
    showOnHome: true,
  });

  useEffect(() => {
    setNewReview(review => ({
      ...review,
      category: getReviewCategory(review.category),
    }));
  }, [defaultCategory]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this review?')) {
      setError('');
      try {
        await setReviews(reviews.filter(r => r.id !== id));
      } catch (err) {
        setError(err.message || 'Unable to delete review while the backend is unavailable.');
      }
    }
  };

  const handleToggleHome = async (review) => {
    setError('');
    try {
      await setReviews(reviews.map(r => (
        r.id === review.id ? { ...r, showOnHome: !r.showOnHome } : r
      )));
    } catch (err) {
      setError(err.message || 'Unable to update review display setting.');
    }
  };

  const visibleReviews = categoryFilter === 'All Categories'
    ? reviews
    : reviews.filter(review => getReviewCategory(review.category) === categoryFilter);

  const handleAddReview = async (e) => {
    e.preventDefault();
    setError('');

    const reviewToAdd = {
      ...newReview,
      category: getReviewCategory(newReview.category),
      id: `REV-${Date.now()}`,
      rating: Number(newReview.rating),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };

    try {
      await setReviews([reviewToAdd, ...reviews]);
      setNewReview({ customer: '', product: '', category: defaultCategory, rating: 5, comment: '', showOnHome: true });
      setIsAddingReview(false);
    } catch (err) {
      setError(err.message || 'Unable to add review while the backend is unavailable.');
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex text-yellow-500">
        {[1, 2, 3, 4, 5].map(star => (
          <Star key={star} size={14} fill={star <= rating ? 'currentColor' : 'none'} className={star > rating ? 'text-gray-300' : ''} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="uppercase tracking-[0.3em] text-sm text-[#3a5c4b]">Feedback</p>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2 text-[#d9006c]">Reviews</h2>
        </div>
        <button
          onClick={() => setIsAddingReview(true)}
          className="flex items-center gap-2 bg-[#d9006c] text-white px-6 py-3 rounded uppercase tracking-widest text-sm hover:bg-[#ec4899] transition-colors whitespace-nowrap shadow-sm"
        >
          <Plus size={18} />
          Add Review
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-[#f9c0d9] p-4">
        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
          Filter By Category
        </label>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full sm:w-72 border border-gray-300 rounded p-3 text-sm focus:border-[#d9006c] focus:ring-1 focus:ring-[#d9006c] outline-none bg-white"
        >
          <option value="All Categories">All Categories</option>
          {categoryOptions.map(c => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {visibleReviews.map((review) => (
          <article
            key={review.id}
            className="bg-white rounded-lg shadow-sm border border-[#f9c0d9] p-4 sm:p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-[#d9006c] text-sm sm:text-base truncate">{review.customer}</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">{review.product}</p>
              </div>
              <span className="shrink-0 bg-gray-100 px-2 py-1 rounded text-[11px] font-semibold text-gray-600">
                {getReviewCategory(review.category)}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
              <span>{review.date}</span>
              {renderStars(review.rating)}
            </div>

            <p className="mt-3 text-sm text-gray-600 italic leading-relaxed line-clamp-3">
              "{review.comment}"
            </p>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-[#f9c0d9] pt-4">
              <button
                onClick={() => handleToggleHome(review)}
                className={`w-full sm:w-auto px-3 py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors ${
                  review.showOnHome
                    ? 'bg-[#d9006c] text-white hover:bg-[#ec4899]'
                    : 'bg-[#D5E8D4] text-[#d9006c] hover:bg-[#f9c0d9]'
                }`}
              >
                {review.showOnHome ? 'Shown on Home' : 'Not Shown on Home'}
              </button>
              <button
                onClick={() => handleDelete(review.id)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded border border-red-100 px-3 py-2 text-xs font-bold uppercase tracking-widest text-red-600 transition-colors hover:bg-red-50"
                title="Delete Review"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </article>
        ))}

        {visibleReviews.length === 0 && (
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-[#f9c0d9] p-10 text-center text-gray-500">
            No reviews found for this category.
          </div>
        )}
      </div>

      {isAddingReview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[100] overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[calc(100vh-2rem)] shadow-2xl overflow-hidden flex flex-col">
            <h3 className="px-5 pt-5 pb-4 sm:px-6 text-xl sm:text-2xl font-bold text-[#d9006c] uppercase tracking-wide border-b border-gray-100">
              Add Review
            </h3>

            <form onSubmit={handleAddReview} className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Customer</label>
                  <input
                    type="text"
                    required
                    value={newReview.customer}
                    onChange={(e) => setNewReview({ ...newReview, customer: e.target.value })}
                    className="w-full border border-gray-300 rounded p-3 text-sm focus:border-[#d9006c] focus:ring-1 focus:ring-[#d9006c] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Product</label>
                  <input
                    type="text"
                    required
                    value={newReview.product}
                    onChange={(e) => setNewReview({ ...newReview, product: e.target.value })}
                    className="w-full border border-gray-300 rounded p-3 text-sm focus:border-[#d9006c] focus:ring-1 focus:ring-[#d9006c] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Category</label>
                <select
                  value={newReview.category}
                  onChange={(e) => setNewReview({ ...newReview, category: e.target.value })}
                  className="w-full border border-gray-300 rounded p-3 text-sm focus:border-[#d9006c] focus:ring-1 focus:ring-[#d9006c] outline-none bg-white"
                >
                  {categoryOptions.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Rating</label>
                <select
                  value={newReview.rating}
                  onChange={(e) => setNewReview({ ...newReview, rating: e.target.value })}
                  className="w-full border border-gray-300 rounded p-3 text-sm focus:border-[#d9006c] focus:ring-1 focus:ring-[#d9006c] outline-none bg-white"
                >
                  {[5, 4, 3, 2, 1].map(rating => (
                    <option key={rating} value={rating}>{rating} Stars</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Comment</label>
                <textarea
                  rows={3}
                  required
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  className="w-full border border-gray-300 rounded p-3 text-sm focus:border-[#d9006c] focus:ring-1 focus:ring-[#d9006c] outline-none resize-none"
                />
              </div>

              <label className="flex items-center gap-3 rounded border border-[#f9c0d9] bg-[#fcfbf9] p-3 text-sm font-semibold text-[#d9006c]">
                <input
                  type="checkbox"
                  checked={newReview.showOnHome}
                  onChange={(e) => setNewReview({ ...newReview, showOnHome: e.target.checked })}
                  className="h-4 w-4 accent-[#d9006c]"
                />
                Show this review on the home page
              </label>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddingReview(false)}
                  className="px-5 py-2.5 rounded text-gray-600 font-semibold text-sm hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded bg-[#d9006c] text-white font-semibold text-sm hover:bg-[#ec4899] transition-colors shadow-sm"
                >
                  Save Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}



