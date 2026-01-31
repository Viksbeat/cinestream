import React from 'react';
import { Star } from 'lucide-react';

export default function AverageRating({ reviews }) {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} className="w-5 h-5 text-white/20" />
          ))}
        </div>
        <span className="text-white/60 text-sm">No ratings yet</span>
      </div>
    );
  }

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const fullStars = Math.floor(avgRating);
  const hasHalfStar = avgRating % 1 >= 0.5;

  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`w-5 h-5 ${
              i <= fullStars
                ? 'text-[#D4AF37] fill-[#D4AF37]'
                : i === fullStars + 1 && hasHalfStar
                ? 'text-[#D4AF37] fill-[#D4AF37] opacity-50'
                : 'text-white/20'
            }`}
          />
        ))}
      </div>
      <div className="text-sm">
        <span className="font-semibold text-white">{avgRating.toFixed(1)}</span>
        <span className="text-white/60"> ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span>
      </div>
    </div>
  );
}