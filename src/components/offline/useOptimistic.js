/**
 * useOptimistic - Optimistic update pattern for instant UI feedback
 */
import { useState, useCallback, useRef } from 'react';
import useOffline from './useOffline';

/**
 * useOptimistic - Hook for optimistic updates
 * 
 * @param {any} initialValue - Initial state value
 * @param {object} options - Configuration options
 * @returns {object} - Optimistic state management utilities
 */
const useOptimistic = (initialValue, options = {}) => {
  const {
    onError,
    retryOnReconnect = true,
    maxRetries = 3,
  } = options;

  const [value, setValue] = useState(initialValue);
  const [pendingValue, setPendingValue] = useState(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(null);
  const previousValue = useRef(initialValue);
  const retryCount = useRef(0);
  const { isOnline, queueAction } = useOffline();

  /**
   * Apply an optimistic update
   * @param {any} newValue - The optimistic value to display
   * @param {function} asyncAction - The async operation to perform
   * @returns {Promise<any>} - Result of the async action
   */
  const optimisticUpdate = useCallback(async (newValue, asyncAction) => {
    // Store previous value for rollback
    previousValue.current = value;
    
    // Apply optimistic update immediately
    setValue(newValue);
    setPendingValue(newValue);
    setIsPending(true);
    setError(null);

    try {
      // If offline, queue the action
      if (!isOnline) {
        queueAction({
          type: 'optimistic_update',
          data: newValue,
          action: asyncAction.toString(), // Store for retry
        });
        setIsPending(false);
        return newValue;
      }

      // Perform the actual async operation
      const result = await asyncAction(newValue);
      
      // Update with server response if different
      if (result !== undefined) {
        setValue(result);
      }
      
      setPendingValue(null);
      setIsPending(false);
      retryCount.current = 0;
      
      return result;
    } catch (err) {
      setError(err);
      
      // Retry logic
      if (retryCount.current < maxRetries) {
        retryCount.current += 1;
        // Exponential backoff
        const delay = Math.pow(2, retryCount.current) * 1000;
        await new Promise(r => setTimeout(r, delay));
        return optimisticUpdate(newValue, asyncAction);
      }

      // Rollback on final failure
      setValue(previousValue.current);
      setPendingValue(null);
      setIsPending(false);
      onError?.(err);
      
      throw err;
    }
  }, [value, isOnline, queueAction, onError, maxRetries]);

  /**
   * Rollback to previous value
   */
  const rollback = useCallback(() => {
    setValue(previousValue.current);
    setPendingValue(null);
    setIsPending(false);
    setError(null);
  }, []);

  /**
   * Force set value (bypassing optimistic update)
   */
  const forceSet = useCallback((newValue) => {
    previousValue.current = newValue;
    setValue(newValue);
    setPendingValue(null);
    setIsPending(false);
    setError(null);
  }, []);

  return {
    value,
    pendingValue,
    isPending,
    error,
    optimisticUpdate,
    rollback,
    forceSet,
    setValue: forceSet,
  };
};

/**
 * useOptimisticList - Optimistic updates for list operations
 */
export const useOptimisticList = (initialList = [], options = {}) => {
  const [list, setList] = useState(initialList);
  const [pendingIds, setPendingIds] = useState(new Set());
  const previousList = useRef(initialList);
  const { isOnline, queueAction } = useOffline();

  const addItem = useCallback(async (item, asyncAction) => {
    const tempId = `temp_${Date.now()}`;
    const tempItem = { ...item, id: tempId, _isPending: true };
    
    previousList.current = list;
    setList(prev => [...prev, tempItem]);
    setPendingIds(prev => new Set([...prev, tempId]));

    try {
      if (!isOnline) {
        queueAction({ type: 'add_item', data: item });
        return tempItem;
      }

      const result = await asyncAction(item);
      
      setList(prev => prev.map(i => 
        i.id === tempId ? { ...result, _isPending: false } : i
      ));
      setPendingIds(prev => {
        const next = new Set(prev);
        next.delete(tempId);
        return next;
      });
      
      return result;
    } catch (err) {
      setList(prev => prev.filter(i => i.id !== tempId));
      setPendingIds(prev => {
        const next = new Set(prev);
        next.delete(tempId);
        return next;
      });
      throw err;
    }
  }, [list, isOnline, queueAction]);

  const removeItem = useCallback(async (itemId, asyncAction) => {
    const item = list.find(i => i.id === itemId);
    if (!item) return;

    previousList.current = list;
    setList(prev => prev.filter(i => i.id !== itemId));
    setPendingIds(prev => new Set([...prev, itemId]));

    try {
      if (!isOnline) {
        queueAction({ type: 'remove_item', data: { id: itemId } });
        return;
      }

      await asyncAction(itemId);
      setPendingIds(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    } catch (err) {
      setList(previousList.current);
      setPendingIds(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
      throw err;
    }
  }, [list, isOnline, queueAction]);

  const updateItem = useCallback(async (itemId, updates, asyncAction) => {
    previousList.current = list;
    
    setList(prev => prev.map(i => 
      i.id === itemId ? { ...i, ...updates, _isPending: true } : i
    ));
    setPendingIds(prev => new Set([...prev, itemId]));

    try {
      if (!isOnline) {
        queueAction({ type: 'update_item', data: { id: itemId, updates } });
        return;
      }

      const result = await asyncAction(itemId, updates);
      
      setList(prev => prev.map(i => 
        i.id === itemId ? { ...result, _isPending: false } : i
      ));
      setPendingIds(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
      
      return result;
    } catch (err) {
      setList(previousList.current);
      setPendingIds(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
      throw err;
    }
  }, [list, isOnline, queueAction]);

  return {
    list,
    pendingIds: Array.from(pendingIds),
    hasPending: pendingIds.size > 0,
    isPending: (id) => pendingIds.has(id),
    addItem,
    removeItem,
    updateItem,
    setList,
  };
};

export default useOptimistic;
