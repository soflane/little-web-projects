import React, { useState, useEffect } from 'react';
import { getPriorities } from '../api/zammad';

interface PrioritySelectProps {
  onSelect: (priority: number) => void;
  value?: number;
}

interface TicketPriority {
  id: number;
  name: string;
  default_create: boolean;
  active: boolean;
}

export default function PrioritySelect({ onSelect, value }: PrioritySelectProps) {
  const [priorities, setPriorities] = useState<TicketPriority[]>([]);
  const [selectedPriority, setSelectedPriority] = useState<number>(2);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPriorities() {
      try {
        const loadedPriorities = await getPriorities();
        setPriorities(loadedPriorities);
        
        // Set default to first active priority or fallback to 2
        const defaultPriority = loadedPriorities.find(p => p.default_create)?.id || 
                               loadedPriorities.find(p => p.active)?.id || 2;
        setSelectedPriority(defaultPriority);
        onSelect(defaultPriority);
      } catch (error) {
        console.error('Failed to load priorities:', error);
        // Fallback to hardcoded values
        setPriorities([
          { id: 1, name: 'Low', default_create: false, active: true },
          { id: 2, name: 'Medium', default_create: true, active: true },
          { id: 3, name: 'High', default_create: false, active: true }
        ]);
        setSelectedPriority(2);
        onSelect(2);
      } finally {
        setLoading(false);
      }
    }

    loadPriorities();
  }, [onSelect]);

  useEffect(() => {
    if (value && priorities.length > 0) {
      setSelectedPriority(value);
    }
  }, [value, priorities]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const priorityId = parseInt(e.target.value);
    setSelectedPriority(priorityId);
    onSelect(priorityId);
  };

  if (loading) {
    return (
      <div className="w-full">
        <select
          id="priority"
          disabled
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
        >
          <option>Loading...</option>
        </select>
      </div>
    );
  }

  return (
    <div className="w-full">
      <select
        id="priority"
        value={selectedPriority}
        onChange={handleChange}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors duration-200"
      >
        {priorities.map((priority) => (
          <option key={priority.id} value={priority.id}>
            {priority.name}
          </option>
        ))}
      </select>
    </div>
  );
}
