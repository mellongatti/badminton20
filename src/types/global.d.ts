declare module 'react' {
  import React from 'react';
  export = React;
  export as namespace React;
  
  export interface Component<P = {}, S = {}, SS = any> extends ComponentLifecycle<P, S, SS> {}
  export interface ComponentLifecycle<P, S, SS = any> {
    componentDidMount?(): void;
    shouldComponentUpdate?(nextProps: Readonly<P>, nextState: Readonly<S>, nextContext: any): boolean;
    componentWillUnmount?(): void;
    componentDidCatch?(error: Error, errorInfo: ErrorInfo): void;
    getSnapshotBeforeUpdate?(prevProps: Readonly<P>, prevState: Readonly<S>): SS | null;
    componentDidUpdate?(prevProps: Readonly<P>, prevState: Readonly<S>, snapshot?: SS): void;
    componentWillMount?(): void;
    UNSAFE_componentWillMount?(): void;
    componentWillReceiveProps?(nextProps: Readonly<P>, nextContext: any): void;
    UNSAFE_componentWillReceiveProps?(nextProps: Readonly<P>, nextContext: any): void;
    componentWillUpdate?(nextProps: Readonly<P>, nextState: Readonly<S>, nextContext: any): void;
    UNSAFE_componentWillUpdate?(nextProps: Readonly<P>, nextState: Readonly<S>, nextContext: any): void;
  }
  
  export interface ErrorInfo {
    componentStack: string;
  }
  
  export interface ReactElement<P = any, T extends string | JSXElementConstructor<any> = string | JSXElementConstructor<any>> {
    type: T;
    props: P;
    key: Key | null;
  }
  
  export type JSXElementConstructor<P> = ((props: P) => ReactElement<any, any> | null) | (new (props: P) => Component<any, any>);
  export type Key = string | number;
  export type ReactNode = ReactElement | string | number | ReactFragment | ReactPortal | boolean | null | undefined;
  export type ReactFragment = {} | Iterable<ReactNode>;
  export type ReactPortal = any;
  
  export interface Attributes {
    key?: Key | null | undefined;
  }
  
  export interface ClassAttributes<T> extends Attributes {
    ref?: LegacyRef<T> | undefined;
  }
  
  export type LegacyRef<T> = string | Ref<T>;
  export type Ref<T> = RefCallback<T> | RefObject<T> | null;
  export type RefCallback<T> = (instance: T | null) => void;
  export interface RefObject<T> {
    readonly current: T | null;
  }
  
  export function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
  export function useState<S = undefined>(): [S | undefined, Dispatch<SetStateAction<S | undefined>>];
  
  export type Dispatch<A> = (value: A) => void;
  export type SetStateAction<S> = S | ((prevState: S) => S);
  
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
    render(): React.ReactNode
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