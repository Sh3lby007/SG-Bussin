if(!self.define){let e,s={};const i=(i,n)=>(i=new URL(i+".js",n).href,s[i]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=i,e.onload=s,document.head.appendChild(e)}else e=i,importScripts(i),s()})).then((()=>{let e=s[i];if(!e)throw new Error(`Module ${i} didn’t register its module`);return e})));self.define=(n,r)=>{const t=e||("document"in self?document.currentScript.src:"")||location.href;if(s[t])return;let o={};const c=e=>i(e,t),f={module:{uri:t},exports:o,require:c};s[t]=Promise.all(n.map((e=>f[e]||c(e)))).then((e=>(r(...e),o)))}}define(["./workbox-3625d7b0"],(function(e){"use strict";self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"assets/index.149fc9a7.js",revision:null},{url:"assets/index.8458fe29.css",revision:null},{url:"index.html",revision:"496f72a2f0fd2dca3bb66cb69882b82c"},{url:"registerSW.js",revision:"a414e8ff97f5307b828f91fb83c829ca"},{url:"manifest.webmanifest",revision:"15ca06b9e3e58b3a86cc753d84aefab0"}],{}),e.cleanupOutdatedCaches(),e.registerRoute(new e.NavigationRoute(e.createHandlerBoundToURL("index.html")))}));
