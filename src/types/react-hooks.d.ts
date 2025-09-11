// Declarações de tipos para React hooks e eventos
declare module 'react' {
  export function useState<S>(initialState: S | (() => S)): [S, (value: S | ((prevState: S) => S)) => void];
  export function useState<S = undefined>(): [S | undefined, (value: S | ((prevState: S | undefined) => S)) => void];
  
  export interface FormEvent<T = Element> {
    preventDefault(): void;
    target: T;
    currentTarget: T;
  }
  
  export interface ChangeEvent<T = Element> {
    target: T & { value: string };
    currentTarget: T;
  }
}

// Namespace React para compatibilidade
declare namespace React {
  export interface FormEvent<T = Element> {
    preventDefault(): void;
    target: T;
    currentTarget: T;
  }
  
  export interface ChangeEvent<T = Element> {
    target: T & { value: string };
    currentTarget: T;
  }
}