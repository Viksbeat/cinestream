import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function DownloadLogo() {
  const [logoUrl, setLogoUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateLogo = async () => {
    setIsGenerating(true);
    try {
      const result = await base44.integrations.Core.GenerateImage({
        prompt: "Modern streaming service logo design: 'VIBEFLIX' text logo on transparent or dark background, 'VIBE' in white and 'FLIX' in luxurious gold color (#D4AF37), bold sans-serif font, clean minimalist design, professional quality, high resolution, suitable for entertainment/movie streaming platform, Netflix-style branding"
      });
      setLogoUrl(result.url);
    } catch (error) {
      console.error('Failed to generate logo:', error);
    }
    setIsGenerating(false);
  };

  React.useEffect(() => {
    generateLogo();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <Link to={createPageUrl('Home')}>
          <Button variant="ghost" className="mb-6">
            ← Back to Home
          </Button>
        </Link>

        <div className="bg-white/5 rounded-xl border border-white/10 p-8 text-center">
          <h1 className="text-3xl font-bold mb-6">VIBEFLIX Logo</h1>

          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-[#D4AF37] mb-4" />
              <p className="text-white/60">Generating your logo...</p>
            </div>
          )}

          {logoUrl && !isGenerating && (
            <div className="space-y-6">
              <div className="bg-black/50 rounded-lg p-8 border border-white/10">
                <img
                  src={logoUrl}
                  alt="VIBEFLIX Logo"
                  className="max-w-full h-auto mx-auto"
                  style={{ maxHeight: '400px' }}
                />
              </div>

              <div className="flex gap-3 justify-center">
                <a href={logoUrl} download="vibeflix-logo.png">
                  <Button className="bg-[#D4AF37] hover:bg-[#E5C158] text-black font-semibold gap-2">
                    <Download className="w-5 h-5" />
                    Download PNG
                  </Button>
                </a>
                <Button
                  variant="outline"
                  onClick={generateLogo}
                  className="border-white/20 hover:bg-white/10"
                >
                  Generate New Version
                </Button>
              </div>

              <p className="text-sm text-white/60">
                Right-click and "Save image as..." to download
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}