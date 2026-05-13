import { useState, useMemo, useCallback } from 'react';

/**
 * Hook for client-side table operations: search, sort, filter, paginate.
 * Designed to be easily replaced with server-side operations later.
 */
export function useTableState(data, options = {}) {
  const {
    initialSort = { key: null, direction: 'asc' },
    pageSize = 10,
    searchKeys = ['name', 'email'],
  } = options;

  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState(initialSort);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({});

  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
    setCurrentPage(1);
  }, []);

  const handleSearch = useCallback((value) => {
    setSearch(value);
    setCurrentPage(1);
  }, []);

  const handleFilter = useCallback((key, value) => {
    setFilters(prev => {
      const next = { ...prev };
      if (value === '' || value === null || value === undefined) {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
    setCurrentPage(1);
  }, []);

  const processedData = useMemo(() => {
    let result = [...data];

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(item =>
        searchKeys.some(key => {
          const value = item[key];
          return value && String(value).toLowerCase().includes(q);
        })
      );
    }

    // Filters
    Object.entries(filters).forEach(([key, value]) => {
      result = result.filter(item => item[key] === value);
    });

    // Sort
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, search, sortConfig, filters, searchKeys]);

  const totalPages = Math.ceil(processedData.length / pageSize);
  const paginatedData = processedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return {
    data: paginatedData,
    totalItems: processedData.length,
    totalPages,
    currentPage,
    setCurrentPage,
    search,
    handleSearch,
    sortConfig,
    handleSort,
    filters,
    handleFilter,
    pageSize,
  };
}
