import React from 'react';
import { Star, CheckCircle } from 'lucide-react';
import { isMockDataAllowed } from '../../api/status';

export default function Reviews({ reviews = [] }) {
  const fallbackReviews = [
    {
      customer: 'Sarah Smith',
      comment: 'The quality is amazing and the lace melts perfectly into the skin. Highly recommended!',
      rating: 5,
    },
    {
      customer: 'Mia Johnson',
      comment: 'Shipping was extremely fast, and the wig density is exactly what I wanted. Super thick and full.',
      rating: 5,
    },
    {
      customer: 'Alicia Keys',
      comment: 'Best luxury wig store. The curls stay incredibly soft and beautiful for weeks. Holds styling perfectly!',
      rating: 5,
    },
  ];
  const reviewsList = reviews.length > 0
    ? reviews.filter(review => review.showOnHome).slice(0, 3)
    : isMockDataAllowed ? fallbackReviews : [];

  return (
    <section
      id="reviews"
      className="py-8 px-4 sm:px-6 lg:px-10 bg-[#1a1a1a] text-white relative overflow-hidden"
    >
      {/* Background soft ambient accents */}
      <div className="absolute top-[-20%] left-[-10%] w-[40%] h-[60%] rounded-full bg-[#d9006c]/25 opacity-35 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[60%] rounded-full bg-[#d9006c]/25 opacity-35 blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto text-center relative z-10">
        <p className="uppercase tracking-[0.4em] text-xs font-semibold text-[#ec4899] mb-2">
          Testimonials
        </p>
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-16 uppercase">
          Loved By Our Clients
        </h2>

        {reviewsList.length === 0 ? (
          <div className="bg-[#111111] border border-[#222222] p-8 text-center text-gray-300">
            Customer testimonials are temporarily unavailable.
          </div>
        ) : (
        <div className="grid md:grid-cols-3 gap-8 text-left">
          {reviewsList.map((review, index) => (
            <div
              key={index}
              className="bg-[#111111] p-8 border border-[#222222] rounded shadow-sm hover:shadow-2xl hover:border-[#d9006c] hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Gold Stars */}
                <div className="flex gap-1 text-[#ec4899]">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={16}
                      fill={star <= review.rating ? 'currentColor' : 'none'}
                      className={`${star <= review.rating ? 'text-[#ec4899]' : 'text-[#888888]'} group-hover:scale-110 transition-transform duration-300`}
                    />
                  ))}
                </div>

                {/* Comment */}
                <p className="leading-relaxed text-gray-200 text-sm font-medium italic">
                  "{review.comment}"
                </p>
              </div>

              {/* Customer Info */}
              <div className="mt-8 pt-6 border-t border-[#222222] flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm tracking-wide">
                    {review.customer}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#ec4899] uppercase tracking-widest font-semibold mt-1">
                    <CheckCircle size={12} className="text-[#ec4899]" />
                    Verified Buyer
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    </section>
  );
}

