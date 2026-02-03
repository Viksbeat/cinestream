import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useTVNavigation() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      const focusedElement = document.activeElement;
      
      // Back button handling
      if (e.key === 'Backspace' || e.key === 'Back') {
        e.preventDefault();
        navigate(-1);
        return;
      }

      // Arrow key navigation
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const focusableElements = Array.from(
          document.querySelectorAll(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter(el => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        });

        const currentIndex = focusableElements.indexOf(focusedElement);
        if (currentIndex === -1) {
          focusableElements[0]?.focus();
          return;
        }

        const currentRect = focusedElement.getBoundingClientRect();
        let bestMatch = null;
        let bestDistance = Infinity;

        focusableElements.forEach((el, idx) => {
          if (idx === currentIndex) return;
          
          const rect = el.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const currentCenterX = currentRect.left + currentRect.width / 2;
          const currentCenterY = currentRect.top + currentRect.height / 2;

          let isInDirection = false;
          let distance = 0;

          if (e.key === 'ArrowRight' && centerX > currentCenterX) {
            isInDirection = true;
            distance = Math.abs(centerX - currentCenterX) + Math.abs(centerY - currentCenterY) * 0.5;
          } else if (e.key === 'ArrowLeft' && centerX < currentCenterX) {
            isInDirection = true;
            distance = Math.abs(centerX - currentCenterX) + Math.abs(centerY - currentCenterY) * 0.5;
          } else if (e.key === 'ArrowDown' && centerY > currentCenterY) {
            isInDirection = true;
            distance = Math.abs(centerY - currentCenterY) + Math.abs(centerX - currentCenterX) * 0.5;
          } else if (e.key === 'ArrowUp' && centerY < currentCenterY) {
            isInDirection = true;
            distance = Math.abs(centerY - currentCenterY) + Math.abs(centerX - currentCenterX) * 0.5;
          }

          if (isInDirection && distance < bestDistance) {
            bestDistance = distance;
            bestMatch = el;
          }
        });

        if (bestMatch) {
          e.preventDefault();
          bestMatch.focus();
          bestMatch.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);
}

export function TVFocusable({ children, className = '', ...props }) {
  return (
    <div
      tabIndex={0}
      className={`tv-focusable focus:outline-none focus:ring-4 focus:ring-[#D4AF37] focus:ring-offset-2 focus:ring-offset-black focus:scale-105 transition-all duration-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}