/**
 * Memoization utilities to optimize rendering performance
 * This module provides helper functions for React memoization
 */
import { 
  memo, 
  useMemo, 
  useCallback, 
  type ComponentType, 
  type DependencyList, 
  type ReactNode 
} from 'react';

/**
 * Custom comparator for memoizing components with deep equality check
 * Useful for preventing unnecessary re-renders
 */
export function deepCompareEquality<P extends object>(prevProps: P, nextProps: P): boolean {
  // Quick reference check for identical objects
  if (prevProps === nextProps) {
    return true;
  }
  
  // If either is null or not an object, use regular comparison
  if (
    typeof prevProps !== 'object' || 
    prevProps === null ||
    typeof nextProps !== 'object' || 
    nextProps === null
  ) {
    return prevProps === nextProps;
  }
  
  // Compare object keys length
  const keysA = Object.keys(prevProps);
  const keysB = Object.keys(nextProps);
  
  if (keysA.length !== keysB.length) {
    return false;
  }
  
  // Compare each property
  for (const key of keysA) {
    const valA = prevProps[key as keyof P];
    const valB = nextProps[key as keyof P];
    
    if (valA === valB) {
      continue;
    }
    
    // Check for nested objects
    if (
      typeof valA === 'object' && 
      valA !== null && 
      typeof valB === 'object' && 
      valB !== null
    ) {
      // Recursively compare objects
      if (!deepCompareEquality(valA as object, valB as object)) {
        return false;
      }
    } else {
      // Different values
      return false;
    }
  }
  
  return true;
}

/**
 * Enhanced version of React.memo that uses deep comparison
 * Prevents unnecessary re-renders when props are deeply equal
 */
export function memoDeep<T extends ComponentType<any>>(
  Component: T,
  options?: {
    displayName?: string;
  }
): ComponentType<React.ComponentProps<T>> {
  const MemoizedComponent = memo(Component, deepCompareEquality);
  
  if (options?.displayName) {
    MemoizedComponent.displayName = options.displayName;
  } else if (Component.displayName || Component.name) {
    MemoizedComponent.displayName = `MemoDeep(${Component.displayName || Component.name})`;
  }
  
  return MemoizedComponent as ComponentType<React.ComponentProps<T>>;
}

/**
 * Create a stable callback reference that only changes when dependencies change
 * @param callback Function to memoize
 * @param deps Dependency array
 */
export function stableCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: DependencyList
): T {
  return useCallback(callback, deps);
}

/**
 * Memoize a value with deep dependency comparison
 * @param factory Factory function to compute memoized value
 * @param deps Dependency array
 */
export function deepMemo<T>(factory: () => T, deps: DependencyList): T {
  // Convert deps to a JSON string to ensure deep comparison
  const depsString = useMemo(() => JSON.stringify(deps), deps);
  return useMemo(factory, [depsString]);
}

/**
 * Memoize a component's children to prevent unnecessary re-renders
 * @param children Component children
 * @param deps Additional dependencies that should trigger re-render
 */
export function memoChildren(children: ReactNode, deps: DependencyList = []): ReactNode {
  return useMemo(() => children, deps);
}

/**
 * Create a stable object reference that only changes when its properties change
 * @param obj Object to stabilize
 */
export function stableObject<T extends object>(obj: T): T {
  return useMemo(() => obj, Object.values(obj));
}
