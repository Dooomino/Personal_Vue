/// <reference types="vite/client" />

declare module 'pretext' {
  interface PretextFn {
    (text: string): string;
    trim: (text: string) => string;
    untabify: (text: string) => string;
    split: (text: string) => string[];
    type: (element: string) => string;
    handle: (element: string) => string;
    escape: (text: string) => string;
    escapeCode: (text: string) => string;
    textWithHtml: (text: string) => string;
    text: (text: string) => string;
    codify: (text: string) => string;
    italicize: (text: string) => string;
    boldify: (text: string) => string;
    linkify: (text: string) => string;
    dashify: (text: string) => string;
  }
  const pretext: PretextFn;
  export default pretext;
}
