"use strict";(()=>{var e={};e.id=176,e.ids=[176],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},2048:e=>{e.exports=require("fs")},2615:e=>{e.exports=require("http")},5240:e=>{e.exports=require("https")},5315:e=>{e.exports=require("path")},8621:e=>{e.exports=require("punycode")},6162:e=>{e.exports=require("stream")},7360:e=>{e.exports=require("url")},1764:e=>{e.exports=require("util")},2623:e=>{e.exports=require("worker_threads")},1568:e=>{e.exports=require("zlib")},7561:e=>{e.exports=require("node:fs")},4492:e=>{e.exports=require("node:stream")},2477:e=>{e.exports=require("node:stream/web")},8887:(e,r,t)=>{t.r(r),t.d(r,{originalPathname:()=>y,patchFetch:()=>q,requestAsyncStorage:()=>b,routeModule:()=>f,serverHooks:()=>x,staticGenerationAsyncStorage:()=>v});var o={};t.r(o),t.d(o,{POST:()=>h,dynamic:()=>g,runtime:()=>m});var n=t(3278),i=t(5002),s=t(4877),a=t(1309),u=t(4919);function l(e,r,t){return Math.max(r,Math.min(t,e))}var p=t(9571);let c=`You are a Senior Frontend QA Engineer with 15+ years of experience evaluating production web interfaces. You are precise, fair, and NEVER inflate scores.

Your job: review a generated web project (the source code is provided) against the original user prompt and return a strict, structured JSON evaluation.

SCORING RUBRIC (each 1-10, integers only):
- "design": Aesthetic appeal, layout balance, typography, color usage, visual hierarchy, spacing, and overall polish.
- "codeQuality": Efficiency, modern practices, clean structure, naming, accessibility considerations, and absence of obvious smells.
- "featureCompleteness": How thoroughly the implementation follows the original user prompt and delivers the requested features.

GUIDELINES:
- Score 9-10 only for genuinely excellent work with no obvious flaws.
- Score 7-8 for solid work with minor issues.
- Score 5-6 for average work that works but has notable gaps.
- Score 3-4 for incomplete or buggy work.
- Score 1-2 for broken, missing, or off-topic submissions.
- If the project is just a fragment or stub, score featureCompleteness harshly (1-3).

OUTPUT FORMAT (return ONLY this JSON object, no markdown, no commentary):
{
  "design": <integer 1-10>,
  "codeQuality": <integer 1-10>,
  "featureCompleteness": <integer 1-10>,
  "critique": "<2-4 sentence summary of what the model did well and what it missed>",
  "highlights": ["<short bullet>", "<short bullet>", "<short bullet>"]
}`;async function d(e,r,t){let o;let n=(0,p.Sb)(r);if(!n)throw Error(`Unknown judge model: ${r}`);let i=[{role:"system",content:c},{role:"user",content:function(e){let r=e.files.map(e=>`- ${e.path} (${e.language??"text"}, ${e.content.length} chars)`).join("\n"),t=e.files.map(e=>`
----- FILE: ${e.path} -----
${function(e,r=12e3){return e.length<=r?e:`${e.slice(0,r)}

/* ...truncated... */`}(e.content,4e3)}`).join("\n");return`ORIGINAL USER PROMPT (the "assignment"):
"""
${e.prompt}
"""

PROJECT FILES:
${r}

GENERATED MODEL: ${e.model.label} (${e.model.provider}:${e.model.id})

SOURCE CODE (bundled):
${t}

Now evaluate strictly. Return ONLY the JSON object described in your instructions.`}(e)}];try{o=await (0,u.fS)(n,i,{temperature:.1,maxTokens:1024,jsonMode:!0},t)}catch(e){o=await (0,u.fS)(n,i,{temperature:.1,maxTokens:1024},t)}return function(e,r){let t=function(e,r){try{return JSON.parse(e)}catch{return r}}(function(e){let r=e.trim(),t=r.match(/```(?:json)?\s*([\s\S]*?)```/i);t&&(r=t[1].trim());let o=r.indexOf("{"),n=r.lastIndexOf("}");return -1!==o&&-1!==n&&n>o&&(r=r.slice(o,n+1)),r}(e),{}),o=l(Math.round(Number(t.design)||0),1,10),n=l(Math.round(Number(t.codeQuality)||0),1,10),i=l(Math.round(Number(t.featureCompleteness)||0),1,10),s=o+n+i,a=Number((s/3).toFixed(2));return{scores:{design:o,codeQuality:n,featureCompleteness:i},total:s,average:a,critique:String(t.critique??"").trim()||"No critique provided.",highlights:Array.isArray(t.highlights)?t.highlights.map(e=>String(e).trim()).filter(Boolean).slice(0,5):[],modelId:r.id,raw:e}}(o.content,n)}let m="nodejs",g="force-dynamic";async function h(e){let r;try{r=await e.json()}catch{return a.NextResponse.json({error:"Invalid JSON body"},{status:400})}let{project:t,judgeModelId:o,apiKeyOverride:n}=r;if(!t||!Array.isArray(t.files)||!t.prompt)return a.NextResponse.json({error:"project.prompt and project.files are required"},{status:400});let i=o??process.env.DEFAULT_MODEL??void 0,s=i?(0,p.Sb)(i):void 0;if(!s)return a.NextResponse.json({error:"No judge model configured. Set DEFAULT_MODEL in .env or pass judgeModelId."},{status:400});let u=n?.[s.provider];try{let e=await d(t,s.id,u);return a.NextResponse.json(e)}catch(r){let e=r instanceof Error?r.message:"Unknown error";return console.error("[api/judge] failed:",e),a.NextResponse.json({error:e},{status:500})}}let f=new n.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/judge/route",pathname:"/api/judge",filename:"route",bundlePath:"app/api/judge/route"},resolvedPagePath:"/Users/beurre/Desktop/website project/app/api/judge/route.ts",nextConfigOutput:"standalone",userland:o}),{requestAsyncStorage:b,staticGenerationAsyncStorage:v,serverHooks:x}=f,y="/api/judge/route";function q(){return(0,s.patchFetch)({serverHooks:x,staticGenerationAsyncStorage:v})}},4919:(e,r,t)=>{t.d(r,{fS:()=>n});var o=t(4130);async function n(e,r,t={},n){let i=function(e,r,t){let n=t??function(e){let r="groq"===e?process.env.GROQ_API_KEY:process.env.GROK_API_KEY;if(!r||0===r.trim().length)throw Error(`Missing API key for ${e}. Set ${"groq"===e?"GROQ_API_KEY":"GROK_API_KEY"} in your server environment.`);return r}(e),i=r??("groq"===e?"https://api.groq.com/openai/v1":"https://api.x.ai/v1");return new o.ZP({apiKey:n,baseURL:i})}(e.provider,e.baseUrl,n),s=await i.chat.completions.create({model:e.id,messages:r,temperature:t.temperature??.2,max_tokens:t.maxTokens??2048,...t.jsonMode?{response_format:{type:"json_object"}}:{}}),a=s.choices[0];return{content:a?.message?.content??"",model:s.model,usage:s.usage?{promptTokens:s.usage.prompt_tokens,completionTokens:s.usage.completion_tokens,totalTokens:s.usage.total_tokens}:void 0}}},9571:(e,r,t)=>{t.d(r,{Sb:()=>n});let o=[{id:"llama-3.3-70b-versatile",label:"Llama 3.3 70B (Groq)",provider:"groq",baseUrl:"https://api.groq.com/openai/v1"},{id:"llama-3.1-8b-instant",label:"Llama 3.1 8B Instant (Groq)",provider:"groq",baseUrl:"https://api.groq.com/openai/v1"},{id:"qwen-2.5-32b-instruct",label:"Qwen 2.5 32B (Groq)",provider:"groq",baseUrl:"https://api.groq.com/openai/v1"},{id:"grok-3-mini",label:"Grok 3 Mini (xAI)",provider:"grok",baseUrl:"https://api.x.ai/v1"},{id:"grok-2-1212",label:"Grok 2 (xAI)",provider:"grok",baseUrl:"https://api.x.ai/v1"},{id:"custom",label:"Custom (specify below)",provider:"custom"}];function n(e){return o.find(r=>r.id===e)}}};var r=require("../../../webpack-runtime.js");r.C(e);var t=e=>r(r.s=e),o=r.X(0,[787,833,130],()=>t(8887));module.exports=o})();