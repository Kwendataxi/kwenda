import { useNavigate } from 'react-router-dom';
import { FoodOrderInterface } from '@/components/food/FoodOrderInterface';
import { FoodServiceTransition } from '@/components/food/FoodServiceTransition';
import { FoodFooterNav } from '@/components/food/FoodFooterNav';

export default function Food() {
  const navigate = useNavigate();

  const handleBack = () => {
    // Si l'utilisateur peut revenir en arrière dans l'historique
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // Sinon, retour à la page d'accueil CLIENT
      navigate('/app/client');
    }
  };

  return (
    <>
      <FoodServiceTransition>
        <FoodOrderInterface 
          onBack={handleBack}
          onOrderComplete={(orderId) => {
            // Optionnel: naviguer vers le suivi de commande
            console.log('Order completed:', orderId);
          }}
        />
      </FoodServiceTransition>
      <FoodFooterNav />
    </>
  );
}
