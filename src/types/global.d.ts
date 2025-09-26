declare module 'react' {
  export function useState<T>(initialState: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void]
  export function useEffect(effect: EffectCallback, deps?: DependencyList): void
  export function createElement(type: any, props?: any, ...children: any[]): any
  export function Component(props: any): any
  export function Fragment(props: any): any
  
  export type EffectCallback = () => (void | (() => void | undefined))
  export type DependencyList = ReadonlyArray<any>
  export type ReactNode = any
  export type ComponentType<P = {}> = any
  export type FC<P = {}> = any
  
  const React: {
    useState: typeof useState
    useEffect: typeof useEffect
    createElement: typeof createElement
    Component: typeof Component
    Fragment: typeof Fragment
  }
  
  export default React
  
  export interface FormEvent<T = Element> extends SyntheticEvent<T> {
    currentTarget: EventTarget & T;
  }
  
  export interface SyntheticEvent<T = Element, E = Event> {
    bubbles: boolean;
    cancelable: boolean;
    currentTarget: EventTarget & T;
    defaultPrevented: boolean;
    eventPhase: number;
    isTrusted: boolean;
    nativeEvent: E;
    preventDefault(): void;
    isDefaultPrevented(): boolean;
    stopPropagation(): void;
    isPropagationStopped(): boolean;
    persist(): void;
    target: EventTarget | null;
    timeStamp: number;
    type: string;
  }
}

declare module 'react-dom' {
  export function render(element: any, container: any): void;
  export const version: string;
}

declare module 'next' {
  export default function NextApp(): any;
}

declare module 'next/app' {
  export default function App(): any;
}

declare module 'next/document' {
  export default function Document(): any;
}

declare module 'next/head' {
  export default function Head(): any;
}

declare module 'next/link' {
  export default function Link(): any;
}

declare module 'next/router' {
  export const useRouter: () => any;
}

declare module '@supabase/supabase-js' {
  export function createClient(url: string, key: string): any;
  export interface SupabaseClient {
    from(table: string): any;
  }
}

declare module 'lucide-react' {
  export const Pencil: any;
  export const Trash2: any;
  export const Plus: any;
  export const Edit: any;
  export const Save: any;
  export const X: any;
  export const Trophy: any;
  export const Users: any;
  export const Calendar: any;
  export const Target: any;
}

declare namespace JSX {
  interface Element extends React.ReactElement<any, any> { }
  interface ElementClass extends React.Component<any> {
    render(): ReactNode
  }
  interface ElementAttributesProperty { props: {} }
  interface ElementChildrenAttribute { children: {} }

  type LibraryManagedAttributes<C, P> = C extends React.MemoExoticComponent<infer T> | React.LazyExoticComponent<infer T>
    ? T extends React.MemoExoticComponent<infer U> | React.LazyExoticComponent<infer U>
      ? ReactManagedAttributes<U, P>
      : ReactManagedAttributes<T, P>
    : ReactManagedAttributes<C, P>

  interface IntrinsicAttributes extends React.Attributes { }
  interface IntrinsicClassAttributes<T> extends React.ClassAttributes<T> { }

  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_SUPABASE_URL: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    }
  }
}

export {};