import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { CheckCircle, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import confetti from 'canvas-confetti';

export default function SubscriptionSuccess() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          navigate(createPageUrl('Home'));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a]">
      <div className="text-center max-w-2xl">
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <CheckCircle className="w-14 h-14 text-white" />
          </div>
          <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-[#D4AF37] animate-bounce" />
        </div>

        <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#D4AF37] bg-clip-text text-transparent">
          Thank You!
        </h1>
        
        <p className="text-2xl md:text-3xl font-semibold text-white mb-6">
          Payment Successful 🎉
        </p>

        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8 mb-8">
          <p className="text-lg text-white/90 mb-4">
            Your subscription is now active! Welcome to the MYVIBEFLIX family.
          </p>
          <p className="text-white/70">
            Enjoy unlimited access to thousands of movies in stunning HD quality.
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => navigate(createPageUrl('Home'))}
            className="w-full md:w-auto bg-[#D4AF37] hover:bg-[#E5C158] text-black font-bold text-lg px-12 py-6 rounded-xl"
          >
            Start Watching Now
          </Button>
          
          <p className="text-sm text-white/50">
            Redirecting to your dashboard in {countdown} seconds...
          </p>
        </div>
      </div>
    </div>
  );
}