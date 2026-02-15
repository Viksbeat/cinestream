import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Subscribe() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        base44.auth.redirectToLogin();
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleSubscribe = async () => {
    setProcessing(true);
    try {
      const { data } = await base44.functions.invoke('initializeKorapayPayment');
      
      if (data.success) {
        window.location.href = data.checkout_url;
      } else {
        toast.error('Payment initialization failed');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Loader2 className="w-10 h-10 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  const isActive = user?.subscription_status === 'active';

  return (
    <div className="min-h-screen pt-24 md:pt-28 pb-12">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Subscribe to MYVIBEFLIX
          </h1>
          <p className="text-lg text-white/70">
            Unlimited access to thousands of movies
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 p-8 md:p-12 max-w-xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-baseline gap-2 mb-4">
              <span className="text-5xl font-bold text-[#D4AF37]">₦2,000</span>
              <span className="text-white/60">/month</span>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                <Check className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <span className="text-white/90">Unlimited movie streaming</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                <Check className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <span className="text-white/90">HD quality playback</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                <Check className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <span className="text-white/90">Watch on any device</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                <Check className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <span className="text-white/90">Access to exclusive content</span>
            </div>
          </div>

          {isActive ? (
            <div className="text-center">
              <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4 mb-4">
                <p className="text-green-400 font-semibold">✓ You have an active subscription</p>
                {user.subscription_expires_at && (
                  <p className="text-white/60 text-sm mt-1">
                    Expires: {new Date(user.subscription_expires_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <Button
              onClick={handleSubscribe}
              disabled={processing}
              className="w-full h-14 bg-[#D4AF37] hover:bg-[#E5C158] text-black font-bold text-lg rounded-xl"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Subscribe Now'
              )}
            </Button>
          )}

          <p className="text-center text-sm text-white/50 mt-6">
            Secure payment powered by Korapay
          </p>
        </div>
      </div>
    </div>
  );
}