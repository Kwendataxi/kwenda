import React from 'react';
import { UniversalSearchInterface } from '@/components/search/UniversalSearchInterface';
import { useUniversalSearch } from '@/hooks/useUniversalSearch';
import { marketplaceSearchProvider, getPopularSuggestions } from '@/services/searchProviders';
import type { SearchResult } from '@/components/search/UniversalSearchInterface';

interface ModernSearchBarProps {
  onProductSelect: (product: any) => void;
  onSearch: (query: string) => void;
  className?: string;
}

export const ModernSearchBar = ({
  onProductSelect,
  onSearch,
  className
}: ModernSearchBarProps) => {
  const searchConfig = {
    type: 'product' as const,
    placeholder: "Rechercher des produits...",
    minCharacters: 1,
    maxResults: 10,
    debounceMs: 150,
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
    customSearchProvider: marketplaceSearchProvider
  });

  const handleSearchResult = (result: SearchResult) => {
    saveToHistory(result);
    if (result.metadata) {
      onProductSelect(result.metadata);
    } else {
      onSearch(result.title);
    }
  };

  const handleSearch = (query: string) => {
    onSearch(query);
  };

  return (
    <div className={className}>
      <UniversalSearchInterface
        config={searchConfig}
        onSearchResult={handleSearchResult}
        onSearch={handleSearch}
        popularSuggestions={popularSuggestions.length > 0 ? popularSuggestions : getPopularSuggestions('product')}
        recentSearches={searchHistory}
        customSearchProvider={marketplaceSearchProvider}
        className="w-full"
      />
    </div>
  );
};