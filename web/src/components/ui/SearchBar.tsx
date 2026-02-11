import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Input from './Input';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchBarProps {
  query: string;
  onChange: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  query,
  onChange,
  placeholder = 'Search...',
  debounceMs = 300,
  className,
}) => {
  const [localQuery, setLocalQuery] = React.useState(query);
  const debouncedQuery = useDebounce(localQuery, debounceMs);

  React.useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  React.useEffect(() => {
    onChange(debouncedQuery);
  }, [debouncedQuery, onChange]);

  return (
    <Input
      type="text"
      placeholder={placeholder}
      value={localQuery}
      onChange={(e) => setLocalQuery(e.target.value)}
      icon={<MagnifyingGlassIcon />}
      className={className}
    />
  );
};

export default SearchBar;