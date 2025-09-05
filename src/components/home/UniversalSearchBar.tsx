import { UniversalSearchInterface } from '@/components/search/UniversalSearchInterface';
import { useUniversalSearch } from '@/hooks/useUniversalSearch';
import { locationSearchProvider, getPopularSuggestions } from '@/services/searchProviders';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePlaces } from '@/hooks/usePlaces';
import type { SearchResult } from '@/components/search/UniversalSearchInterface';

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
  const { addLocationFromSearch } = usePlaces();

  const searchConfig = {
    type: 'location' as const,
    placeholder: t('home.search.placeholder') || placeholder,
    minCharacters: 1,
    maxResults: 8,
    debounceMs: 100,
    enableVoiceSearch: true,
    showPopularSuggestions: true,
    showRecentSearches: true
  };

  const {
    searchHistory,
    popularSuggestions,
    saveToHistory
  } = useUniversalSearch({
    config: searchConfig,
    customSearchProvider: locationSearchProvider
  });

  const handleSearchResult = (result: SearchResult) => {
    saveToHistory(result);
    // Sauvegarder automatiquement dans les lieux récents
    if (result.coordinates) {
      addLocationFromSearch(result.title, result.coordinates, result.title);
    }
    onSearch(result.title, result.coordinates);
    onTransportSelect();
  };

  const handleSearch = (query: string) => {
    onSearch(query);
    onTransportSelect();
  };

  return (
    <div className="px-4 mb-6">
      <UniversalSearchInterface
        config={searchConfig}
        onSearchResult={handleSearchResult}
        onSearch={handleSearch}
        popularSuggestions={popularSuggestions.length > 0 ? popularSuggestions : getPopularSuggestions('location')}
        recentSearches={searchHistory}
        customSearchProvider={locationSearchProvider}
        className="w-full"
      />
    </div>
  );
};