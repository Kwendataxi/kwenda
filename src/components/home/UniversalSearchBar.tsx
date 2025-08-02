import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface UniversalSearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export const UniversalSearchBar = ({ 
  onSearch, 
  placeholder = "Que cherchez-vous ?" 
}: UniversalSearchBarProps) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <div className="px-4 mb-6">
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 h-12 bg-white border border-gray-200 rounded-xl shadow-sm focus:shadow-md transition-shadow"
        />
      </form>
    </div>
  );
};