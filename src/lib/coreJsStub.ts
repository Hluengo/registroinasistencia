// Empty stub for `core-js` side-effect imports.
//
// canvg (transitive dep via jspdf) unconditionally imports core-js
// polyfill modules. Those polyfills are dead weight here: this app targets
// modern browsers (React 19 + Vite modern build) that already implement
// everything natively (Promise, String/Array methods, ...), and our own
// code ships zero polyfills.
//
// Aliasing core-js to this stub (see vite.config.ts) also removes
// core-js'internals/global.js from the bundle, whose `Function("return
// this")()` global-detection fallback trips strict Content-Security-Policy
// settings (script-src without 'unsafe-eval') and gets flagged as eval
// usage in vendor chunks.
export {}
