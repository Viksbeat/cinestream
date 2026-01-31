import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion } from 'framer-motion';

export default function ReviewForm({ onSubmit, isSubmitting, userReview }) {
  const [rating, setRating] = useState(userReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState(userReview?.review_text || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating > 0) {
      onSubmit({ rating, review_text: reviewText });
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="bg-white/5 rounded-xl p-6 border border-white/10"
    >
      <h3 className="text-xl font-semibold mb-4">
        {userReview ? 'Update Your Review' : 'Write a Review'}
      </h3>

      {/* Star Rating */}
      <div className="mb-4">
        <label className="text-sm text-white/60 mb-2 block">Your Rating</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`w-8 h-8 transition-colors ${
                  star <= (hoveredRating || rating)
                    ? 'text-[#D4AF37] fill-[#D4AF37]'
                    : 'text-white/20'
                }`}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm text-white/60 self-center">
              {rating} {rating === 1 ? 'star' : 'stars'}
            </span>
          )}
        </div>
      </div>

      {/* Review Text */}
      <div className="mb-4">
        <label className="text-sm text-white/60 mb-2 block">Your Review (Optional)</label>
        <Textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Share your thoughts about this movie..."
          rows={4}
          className="bg-white/5 border-white/10 resize-none"
        />
      </div>

      <Button
        type="submit"
        disabled={rating === 0 || isSubmitting}
        className="bg-[#D4AF37] hover:bg-[#E5C158] text-black font-semibold w-full"
      >
        {isSubmitting ? 'Submitting...' : userReview ? 'Update Review' : 'Submit Review'}
      </Button>
    </motion.form>
  );
}