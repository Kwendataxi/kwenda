import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface UniversalSearchBarProps {
  onSearch: (query: string) => void;
  onTransportSelect: () => void;
  placeholder?: string;
}

export const UniversalSearchBar = ({ 
  onSearch, 
  onTransportSelect,
  placeholder = "Où allez-vous ?" 
}: UniversalSearchBarProps) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onTransportSelect(); // Open transport service
      onSearch(query);
    }
  };

  const handleFocus = () => {
    onTransportSelect(); // Open transport when user focuses on search
  };

  return (
    <div className="px-4 mb-8">
      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
          <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
        </div>
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          className="pl-12 pr-4 h-14 bg-white border-0 rounded-2xl text-base placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/20 transition-all duration-200"
          style={{ 
            boxShadow: 'var(--shadow-md)',
            background: 'var(--gradient-card)'
          }}
        />
        {/* Effet de brillance */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      </form>
    </div>
  );
};