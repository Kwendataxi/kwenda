import { EnhancedTaxiSearchBar } from '@/components/transport/EnhancedTaxiSearchBar';
import { useLanguage } from '@/contexts/LanguageContext';

interface UniversalSearchBarProps {
  onSearch: (query: string, coordinates?: { lat: number; lng: number }) => void;
  onTransportSelect: () => void;
  placeholder?: string;
}

export const UniversalSearchBar = ({ 
  onSearch, 
  onTransportSelect, 
  placeholder = "Où allez-vous ?" 
}: UniversalSearchBarProps) => {
  const { t } = useLanguage();

  const handleSearch = (query: string, coordinates?: { lat: number; lng: number }) => {
    onSearch(query, coordinates);
  };

  return (
    <div className="px-4 mb-6">
      <EnhancedTaxiSearchBar
        onSearch={handleSearch}
        onTransportSelect={onTransportSelect}
        placeholder={t('home.search.placeholder')}
      />
    </div>
  );
};