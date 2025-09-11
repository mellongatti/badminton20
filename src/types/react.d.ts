/// <reference types="react" />
/// <reference types="react-dom" />

declare module 'react' {
  export * from '@types/react';
  export { default } from '@types/react';
}

declare module 'react-dom' {
  export * from '@types/react-dom';
  export { default } from '@types/react-dom';
}

declare module 'react-dom/client' {
  export * from '@types/react-dom/client';
}