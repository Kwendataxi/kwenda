import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export const useServiceTransition = () => {
  const navigate = useNavigate();

  const transitionToService = useCallback((service: string) => {
    // Animation de sortie de la page actuelle
    const mainElement = document.querySelector('[data-page="home"]');
    if (mainElement) {
      mainElement.classList.add('animate-slide-out-left');
    }

    // Feedback haptique léger
    if ('vibrate' in navigator) {
      navigator.vibrate(8);
    }

    // Navigation avec délai pour l'animation
    setTimeout(() => {
      switch (service) {
        case 'transport':
          navigate('/transport');
          break;
        case 'delivery':
          navigate('/delivery');
          break;
        case 'marketplace':
          navigate('/marketplace');
          break;
        case 'food':
          navigate('/food');
          break;
        case 'rental':
          navigate('/rental');
          break;
        default:
          console.log(`Service ${service} non implémenté`);
      }
    }, 200); // Délai pour l'animation de sortie
  }, [navigate]);

  return { transitionToService };
};
