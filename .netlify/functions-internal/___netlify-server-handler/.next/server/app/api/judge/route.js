"use strict";(()=>{var e={};e.id=176,e.ids=[176],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},2048:e=>{e.exports=require("fs")},2615:e=>{e.exports=require("http")},5240:e=>{e.exports=require("https")},5315:e=>{e.exports=require("path")},8621:e=>{e.exports=require("punycode")},6162:e=>{e.exports=require("stream")},7360:e=>{e.exports=require("url")},1764:e=>{e.exports=require("util")},2623:e=>{e.exports=require("worker_threads")},1568:e=>{e.exports=require("zlib")},7561:e=>{e.exports=require("node:fs")},4492:e=>{e.exports=require("node:stream")},2477:e=>{e.exports=require("node:stream/web")},8887:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>w,patchFetch:()=>S,requestAsyncStorage:()=>y,routeModule:()=>f,serverHooks:()=>v,staticGenerationAsyncStorage:()=>b});var o={};r.r(o),r.d(o,{POST:()=>g,dynamic:()=>h,runtime:()=>m});var s=r(3278),i=r(5002),n=r(4877),a=r(1309),l=r(4919);function u(e,t,r){return Math.max(t,Math.min(r,e))}var c=r(9571);let p=`You are a strict, world-class Senior Frontend QA Engineer with 20+ years of experience. You have reviewed thousands of production websites. You are honest, specific, and you DO NOT inflate scores. You have a reputation for brutal but fair feedback.

YOUR TASK
Review a generated web project against the user's original prompt and return a strict JSON evaluation. You will be scored by humans on whether your critique is specific and accurate.

YOU WILL SCORE THREE AXES, each an integer from 1 to 10.

1. "design" — visual design and UX
   - 9-10: Magazine-grade. Distinctive typography, intentional color palette, clear hierarchy, generous spacing, no obvious flaws.
   - 7-8: Solid. Looks professional, coherent, minor polish issues.
   - 5-6: Functional. Layout works but feels generic, unbalanced, or dated.
   - 3-4: Weak. Confusing layout, harsh typography, poor spacing, no hierarchy.
   - 1-2: Broken or off-topic. No visual identity, broken layout, or missing UI.
   Look at: typography choices, color usage, spacing rhythm, hierarchy, responsiveness, consistency.

2. "codeQuality" — engineering quality of the source
   - 9-10: Production-ready. Clean structure, modern patterns, accessible, no smells.
   - 7-8: Solid. Good structure, few minor issues, mostly modern.
   - 5-6: Workable. Works but has notable smells, outdated patterns, or missing accessibility.
   - 3-4: Sloppy. Repetition, dead code, broken patterns, no separation of concerns.
   - 1-2: Broken or empty. Syntax errors, missing files, no structure.
   Look at: HTML semantics, CSS architecture, JS/TS patterns, accessibility (alt, aria, labels), error handling, no inline styles, responsive design.

3. "featureCompleteness" — how thoroughly it follows the original prompt
   - 9-10: Every requested feature is implemented and working.
   - 7-8: Most features are present, minor gaps.
   - 5-6: Core idea is there, several features missing or stubbed.
   - 3-4: Only a fragment of the prompt is implemented.
   - 1-2: Off-topic, broken, or empty.
   Read the prompt carefully. List every feature it asks for. Verify each one in the code.

CRITICAL RULES
- You are evaluating a small bundle of source files. You CANNOT see it rendered. Infer visual quality from code choices (semantic HTML, design tokens, CSS variables, custom typography, color systems, layout primitives).
- A hello-world with a button is design 4-5, codeQuality 4-6, featureCompleteness 1-2 unless the prompt asked for "a button".
- Do NOT give 9-10 to a generic Bootstrap-looking page. Do NOT give 7+ to broken or stub code.
- If the project only has 1-2 short files, be honest: design ≤5, codeQuality ≤6 unless they are genuinely exceptional.
- Be specific in your critique. Name files, point to lines (approximate), call out real issues.
- "highlights" should be 2-4 specific things the model did RIGHT, not generic praise.
- You MUST return ONLY the JSON object. No prose, no markdown, no commentary before or after.

OUTPUT FORMAT (return ONLY this JSON object):
{
  "design": <integer 1-10>,
  "codeQuality": <integer 1-10>,
  "featureCompleteness": <integer 1-10>,
  "critique": "<2-4 sentence specific critique. Name what works and what is missing/broken.>",
  "highlights": ["<specific thing done well>", "<specific thing done well>", "<specific thing done well>"],
  "verdict": "<one short sentence summary, like 'Solid landing page, missing mobile menu.'>"
}`;async function d(e,t){let r;let o=(0,c.Sb)(t);if(!o)throw Error(`Unknown judge model: ${t}`);let s=[{role:"system",content:p},{role:"user",content:function(e){let t=e.files.map(e=>`- ${e.path} (${e.language??"text"}, ${e.content.length} chars)`).join("\n"),r=e.files.map(e=>{let t=e.content.length>6e3?`${function(e,t=12e3){return e.length<=t?e:`${e.slice(0,t)}

/* ...truncated... */`}(e.content,4e3)}

... [truncated, file is ${e.content.length} chars]`:e.content;return`
----- FILE: ${e.path} -----
${t}`}).join("\n");return`ORIGINAL USER PROMPT (the assignment the model was given):
"""
${e.prompt}
"""

PROJECT FILES (${e.files.length} files, ${r.length.toLocaleString()} chars total):
${t}

${r}

INSTRUCTIONS
1. Read the prompt carefully. Enumerate the features it asks for.
2. For each file, scan the code. Note specific patterns: semantic HTML, design tokens (CSS variables, custom properties), typography, color systems, accessibility (alt text, aria-*, labels, focus states), responsive utilities, error handling.
3. Score strictly using the rubric in your system prompt.
4. Return ONLY the JSON object. No markdown fences, no preamble.`}(e)}];try{r=await (0,l.fS)(o,s,{temperature:.1,maxTokens:1024,jsonMode:!0})}catch{r=await (0,l.fS)(o,s,{temperature:.1,maxTokens:1024})}return function(e,t){let r=function(e,t){try{return JSON.parse(e)}catch{return t}}(function(e){let t=e.trim(),r=t.match(/```(?:json)?\s*([\s\S]*?)```/i);r&&(t=r[1].trim());let o=t.indexOf("{"),s=t.lastIndexOf("}");return -1!==o&&-1!==s&&s>o&&(t=t.slice(o,s+1)),t}(e),{}),o=u(Math.round(Number(r.design)||0),1,10),s=u(Math.round(Number(r.codeQuality)||0),1,10),i=u(Math.round(Number(r.featureCompleteness)||0),1,10),n=o+s+i,a=Number((n/3).toFixed(2));return{scores:{design:o,codeQuality:s,featureCompleteness:i},total:n,average:a,critique:String(r.critique??"").trim()||"No critique provided.",verdict:String(r.verdict??"").trim()||void 0,highlights:Array.isArray(r.highlights)?r.highlights.map(e=>String(e).trim()).filter(Boolean).slice(0,4):[],modelId:t.id,raw:e}}(r.content,o)}let m="nodejs",h="force-dynamic";async function g(e){let t;try{t=await e.json()}catch{return a.NextResponse.json({error:"Invalid JSON body"},{status:400})}let{project:r,judgeModelId:o}=t;if(!r||!Array.isArray(r.files)||!r.prompt)return a.NextResponse.json({error:"project.prompt and project.files are required"},{status:400});let s=o??process.env.DEFAULT_MODEL??void 0,i=s?(0,c.Sb)(s):void 0;if(!i)return a.NextResponse.json({error:"No judge model configured. Set DEFAULT_MODEL in .env or pass judgeModelId."},{status:400});if(!process.env.GROQ_API_KEY)return a.NextResponse.json({error:"GROQ_API_KEY is not configured on the server."},{status:500});try{let e=await d(r,i.id);return a.NextResponse.json(e)}catch(t){let e=t instanceof Error?t.message:"Unknown error";return console.error("[api/judge] failed:",e),a.NextResponse.json({error:e},{status:500})}}let f=new s.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/judge/route",pathname:"/api/judge",filename:"route",bundlePath:"app/api/judge/route"},resolvedPagePath:"/Users/beurre/Desktop/website project/app/api/judge/route.ts",nextConfigOutput:"standalone",userland:o}),{requestAsyncStorage:y,staticGenerationAsyncStorage:b,serverHooks:v}=f,w="/api/judge/route";function S(){return(0,n.patchFetch)({serverHooks:v,staticGenerationAsyncStorage:b})}},4919:(e,t,r)=>{r.d(t,{fS:()=>s});var o=r(4130);async function s(e,t,r={}){let s=function(e){let t=function(){let e=process.env.GROQ_API_KEY;if(!e||0===e.trim().length)throw Error("Missing GROQ_API_KEY in the server environment. Set it via your hosting provider (e.g. Netlify env vars).");return e}(),r=e.baseUrl??"https://api.groq.com/openai/v1";return new o.ZP({apiKey:t,baseURL:r})}(e),i=await s.chat.completions.create({model:e.id,messages:t,temperature:r.temperature??.2,max_tokens:r.maxTokens??2048,...r.jsonMode?{response_format:{type:"json_object"}}:{}}),n=i.choices[0];return{content:n?.message?.content??"",model:i.model,usage:i.usage?{promptTokens:i.usage.prompt_tokens,completionTokens:i.usage.completion_tokens,totalTokens:i.usage.total_tokens}:void 0}}},9571:(e,t,r)=>{r.d(t,{Sb:()=>s});let o=[{id:"qwen-2.5-coder-32b-instruct",label:"Qwen 2.5 Coder 32B (Groq) — best for code review",provider:"groq",baseUrl:"https://api.groq.com/openai/v1"},{id:"llama-3.3-70b-versatile",label:"Llama 3.3 70B (Groq)",provider:"groq",baseUrl:"https://api.groq.com/openai/v1"},{id:"llama-3.1-8b-instant",label:"Llama 3.1 8B Instant (Groq)",provider:"groq",baseUrl:"https://api.groq.com/openai/v1"},{id:"qwen-2.5-32b-instruct",label:"Qwen 2.5 32B (Groq)",provider:"groq",baseUrl:"https://api.groq.com/openai/v1"},{id:"custom",label:"Custom (specify below)",provider:"groq"}];function s(e){return o.find(t=>t.id===e)}}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),o=t.X(0,[787,833,130],()=>r(8887));module.exports=o})();