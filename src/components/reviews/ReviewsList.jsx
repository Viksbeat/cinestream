import React from 'react';
import { Star, User, Flag } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from 'framer-motion';

export default function ReviewsList({ reviews, currentUserEmail, onFlag }) {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-8 text-white/60">
        <p>No reviews yet. Be the first to review this movie!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {reviews.map((review, index) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white/5 rounded-xl p-5 border border-white/10"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div>
                  <p className="font-medium">
                    {review.user_name || review.user_email?.split('@')[0]}
                    {review.user_email === currentUserEmail && (
                      <span className="ml-2 text-xs text-[#D4AF37]">(You)</span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= review.rating
                              ? 'text-[#D4AF37] fill-[#D4AF37]'
                              : 'text-white/20'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-white/40">
                      {format(new Date(review.created_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              </div>

              {review.user_email !== currentUserEmail && onFlag && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onFlag(review)}
                  className="text-white/40 hover:text-red-400 hover:bg-red-400/10"
                  title="Report review"
                >
                  <Flag className="w-4 h-4" />
                </Button>
              )}
            </div>

            {review.review_text && (
              <p className="text-white/80 leading-relaxed">{review.review_text}</p>
            )}

            {review.is_flagged && (
              <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-500">
                This review has been flagged for moderation
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}