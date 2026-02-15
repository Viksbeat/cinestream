import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { CheckCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function SubscriptionSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(createPageUrl('Home'));
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Payment Successful!</h1>
        <p className="text-white/70 mb-8">
          Your subscription is now active. Enjoy unlimited access to all movies!
        </p>
        <Button
          onClick={() => navigate(createPageUrl('Home'))}
          className="bg-[#D4AF37] hover:bg-[#E5C158] text-black font-semibold px-8"
        >
          Start Watching
        </Button>
      </div>
    </div>
  );
}