(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))n(s);new MutationObserver(s=>{for(const i of s)if(i.type==="childList")for(const o of i.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&n(o)}).observe(document,{childList:!0,subtree:!0});function r(s){const i={};return s.integrity&&(i.integrity=s.integrity),s.referrerPolicy&&(i.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?i.credentials="include":s.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function n(s){if(s.ep)return;s.ep=!0;const i=r(s);fetch(s.href,i)}})();const Mu="modulepreload",Fu=function(t){return"/"+t},na={},Wu=function(e,r,n){let s=Promise.resolve();if(r&&r.length>0){let c=function(u){return Promise.all(u.map(d=>Promise.resolve(d).then(f=>({status:"fulfilled",value:f}),f=>({status:"rejected",reason:f}))))};var o=c;document.getElementsByTagName("link");const a=document.querySelector("meta[property=csp-nonce]"),l=a?.nonce||a?.getAttribute("nonce");s=c(r.map(u=>{if(u=Fu(u),u in na)return;na[u]=!0;const d=u.endsWith(".css"),f=d?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${u}"]${f}`))return;const h=document.createElement("link");if(h.rel=d?"stylesheet":Mu,d||(h.as="script"),h.crossOrigin="",h.href=u,l&&h.setAttribute("nonce",l),document.head.appendChild(h),d)return new Promise((y,v)=>{h.addEventListener("load",y),h.addEventListener("error",()=>v(new Error(`Unable to preload CSS for ${u}`)))})}))}function i(a){const l=new Event("vite:preloadError",{cancelable:!0});if(l.payload=a,window.dispatchEvent(l),!l.defaultPrevented)throw a}return s.then(a=>{for(const l of a||[])l.status==="rejected"&&i(l.reason);return e().catch(i)})},Hu=Symbol.for("@supabase/supabase-js.traceContextExtractor");function Gu(){return globalThis[Hu]}function Zs(t,e){var r={};for(var n in t)Object.prototype.hasOwnProperty.call(t,n)&&e.indexOf(n)<0&&(r[n]=t[n]);if(t!=null&&typeof Object.getOwnPropertySymbols=="function")for(var s=0,n=Object.getOwnPropertySymbols(t);s<n.length;s++)e.indexOf(n[s])<0&&Object.prototype.propertyIsEnumerable.call(t,n[s])&&(r[n[s]]=t[n[s]]);return r}function Vu(t,e,r,n){function s(i){return i instanceof r?i:new r(function(o){o(i)})}return new(r||(r=Promise))(function(i,o){function a(u){try{c(n.next(u))}catch(d){o(d)}}function l(u){try{c(n.throw(u))}catch(d){o(d)}}function c(u){u.done?i(u.value):s(u.value).then(a,l)}c((n=n.apply(t,e||[])).next())})}const zu=t=>t?(...e)=>t(...e):(...e)=>fetch(...e);class _o extends Error{constructor(e,r="FunctionsError",n){super(e),this.name=r,this.context=n}toJSON(){return{name:this.name,message:this.message,context:this.context}}}class Ku extends _o{constructor(e){super("Failed to send a request to the Edge Function","FunctionsFetchError",e)}}class sa extends _o{constructor(e){super("Relay Error invoking the Edge Function","FunctionsRelayError",e)}}class ia extends _o{constructor(e){super("Edge Function returned a non-2xx status code","FunctionsHttpError",e)}}var qi;(function(t){t.Any="any",t.ApNortheast1="ap-northeast-1",t.ApNortheast2="ap-northeast-2",t.ApSouth1="ap-south-1",t.ApSoutheast1="ap-southeast-1",t.ApSoutheast2="ap-southeast-2",t.CaCentral1="ca-central-1",t.EuCentral1="eu-central-1",t.EuWest1="eu-west-1",t.EuWest2="eu-west-2",t.EuWest3="eu-west-3",t.SaEast1="sa-east-1",t.UsEast1="us-east-1",t.UsWest1="us-west-1",t.UsWest2="us-west-2"})(qi||(qi={}));class Ju{constructor(e,{headers:r={},customFetch:n,region:s=qi.Any}={}){this.url=e,this.headers=r,this.region=s,this.fetch=zu(n)}setAuth(e){this.headers.Authorization=`Bearer ${e}`}invoke(e){return Vu(this,arguments,void 0,function*(r,n={}){var s,i;let o,a,l;try{const{headers:c,method:u,body:d,signal:f,timeout:h}=n;let y={},{region:v}=n;v||(v=this.region);const _=new URL(`${this.url}/${r}`);v&&v!=="any"&&(y["x-region"]=v,_.searchParams.set("forceFunctionRegion",v));let R;const g=!!c&&Object.keys(c).some(W=>W.toLowerCase()==="content-type");d&&!g?typeof Blob<"u"&&d instanceof Blob||d instanceof ArrayBuffer?(y["Content-Type"]="application/octet-stream",R=d):typeof d=="string"?(y["Content-Type"]="text/plain",R=d):typeof FormData<"u"&&d instanceof FormData?R=d:(y["Content-Type"]="application/json",R=JSON.stringify(d)):d&&typeof d!="string"&&!(typeof Blob<"u"&&d instanceof Blob)&&!(d instanceof ArrayBuffer)&&!(typeof FormData<"u"&&d instanceof FormData)?R=JSON.stringify(d):R=d;let m=f;h&&(a=new AbortController,o=setTimeout(()=>a.abort(),h),f?(m=a.signal,l=()=>a.abort(),f.addEventListener("abort",l)):m=a.signal);const k=yield this.fetch(_.toString(),{method:u||"POST",headers:Object.assign(Object.assign(Object.assign({},y),this.headers),c),body:R,signal:m}).catch(W=>{throw new Ku(W)}),A=k.headers.get("x-relay-error");if(A&&A==="true")throw new sa(k);if(!k.ok)throw new ia(k);let C=((s=k.headers.get("Content-Type"))!==null&&s!==void 0?s:"text/plain").split(";")[0].trim().toLowerCase(),x;return C==="application/json"?x=yield k.json():C==="application/octet-stream"||C==="application/pdf"?x=yield k.blob():C==="text/event-stream"?x=k:C==="multipart/form-data"?x=yield k.formData():x=yield k.text(),{data:x,error:null,response:k}}catch(c){return{data:null,error:c,response:c instanceof ia||c instanceof sa?c.context:void 0}}finally{o&&clearTimeout(o),l&&((i=n.signal)===null||i===void 0||i.removeEventListener("abort",l))}})}}var Pr=class extends Error{constructor(t){super(t.message),this.name="PostgrestError",this.details=t.details,this.hint=t.hint,this.code=t.code}toJSON(){return{name:this.name,message:this.message,details:this.details,hint:this.hint,code:this.code}}};const Ll=3,oa=t=>Math.min(1e3*2**t,3e4),Yu=[520,503],Dl=["GET","HEAD","OPTIONS"];function pn(t){"@babel/helpers - typeof";return pn=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},pn(t)}function Xu(t,e){if(pn(t)!="object"||!t)return t;var r=t[Symbol.toPrimitive];if(r!==void 0){var n=r.call(t,e);if(pn(n)!="object")return n;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(t)}function Qu(t){var e=Xu(t,"string");return pn(e)=="symbol"?e:e+""}function Zu(t,e,r){return(e=Qu(e))in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}function aa(t,e){var r=Object.keys(t);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(t);e&&(n=n.filter(function(s){return Object.getOwnPropertyDescriptor(t,s).enumerable})),r.push.apply(r,n)}return r}function tr(t){for(var e=1;e<arguments.length;e++){var r=arguments[e]!=null?arguments[e]:{};e%2?aa(Object(r),!0).forEach(function(n){Zu(t,n,r[n])}):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(r)):aa(Object(r)).forEach(function(n){Object.defineProperty(t,n,Object.getOwnPropertyDescriptor(r,n))})}return t}function la(t,e){return new Promise(r=>{if(e?.aborted){r();return}const n=setTimeout(()=>{e?.removeEventListener("abort",s),r()},t);function s(){clearTimeout(n),r()}e?.addEventListener("abort",s)})}function ed(t,e,r,n){return!(!n||r>=Ll||!Dl.includes(t)||!Yu.includes(e))}async function Ul(t,e,r,n){let s=0;for(;;){const a=tr({},r.headers);s>0&&(a["X-Retry-Count"]=String(s));let l;try{l=await t(e,{method:r.method,headers:a,body:r.body,signal:r.signal})}catch(c){if(c?.name==="AbortError"||c?.code==="ABORT_ERR"||!Dl.includes(r.method))throw c;if(n&&s<Ll){const u=oa(s);s++,await la(u,r.signal);continue}throw c}if(ed(r.method,l.status,s,n)){var i,o;const c=(i=(o=l.headers)===null||o===void 0?void 0:o.get("Retry-After"))!==null&&i!==void 0?i:null,u=c!==null?Math.max(0,parseInt(c,10)||0)*1e3:oa(s);await l.text(),s++,await la(u,r.signal);continue}return l}}var td=class{constructor(t){var e,r,n,s,i;this.shouldThrowOnError=!1,this.retryEnabled=!0,this.method=t.method,this.url=t.url,this.headers=new Headers(t.headers),this.schema=t.schema,this.body=t.body,this.shouldThrowOnError=(e=t.shouldThrowOnError)!==null&&e!==void 0?e:!1,this.signal=t.signal,this.isMaybeSingle=(r=t.isMaybeSingle)!==null&&r!==void 0?r:!1,this.shouldStripNulls=(n=t.shouldStripNulls)!==null&&n!==void 0?n:!1,this.urlLengthLimit=(s=t.urlLengthLimit)!==null&&s!==void 0?s:8e3,this.retryEnabled=(i=t.retry)!==null&&i!==void 0?i:!0,t.fetch?this.fetch=t.fetch:this.fetch=fetch}throwOnError(){return this.shouldThrowOnError=!0,this}stripNulls(){if(this.headers.get("Accept")==="text/csv")throw new Error("stripNulls() cannot be used with csv()");return this.shouldStripNulls=!0,this}setHeader(t,e){return this.headers=new Headers(this.headers),this.headers.set(t,e),this}retry(t){return this.retryEnabled=t,this}then(t,e){var r=this;if(this.schema===void 0||(["GET","HEAD"].includes(this.method)?this.headers.set("Accept-Profile",this.schema):this.headers.set("Content-Profile",this.schema)),this.method!=="GET"&&this.method!=="HEAD"&&this.headers.set("Content-Type","application/json"),this.shouldStripNulls){const o=this.headers.get("Accept");o==="application/vnd.pgrst.object+json"?this.headers.set("Accept","application/vnd.pgrst.object+json;nulls=stripped"):(!o||o==="application/json")&&this.headers.set("Accept","application/vnd.pgrst.array+json;nulls=stripped")}const n=this.fetch;let i=(async()=>{const o={};r.headers.forEach((l,c)=>{o[c]=l});const a=await Ul(n,r.url.toString(),{method:r.method,headers:o,body:JSON.stringify(r.body,(l,c)=>typeof c=="bigint"?c.toString():c),signal:r.signal},r.retryEnabled);return await r.processResponse(a)})();return this.shouldThrowOnError||(i=i.catch(o=>{var a;let l="",c="",u="";const d=o?.cause;if(d){var f,h,y,v;const g=(f=d?.message)!==null&&f!==void 0?f:"",m=(h=d?.code)!==null&&h!==void 0?h:"";l=`${(y=o?.name)!==null&&y!==void 0?y:"FetchError"}: ${o?.message}`,l+=`

Caused by: ${(v=d?.name)!==null&&v!==void 0?v:"Error"}: ${g}`,m&&(l+=` (${m})`),d?.stack&&(l+=`
${d.stack}`)}else{var _;l=(_=o?.stack)!==null&&_!==void 0?_:""}const R=this.url.toString().length;return o?.name==="AbortError"||o?.code==="ABORT_ERR"?(u="",c="Request was aborted (timeout or manual cancellation)",R>this.urlLengthLimit&&(c+=`. Note: Your request URL is ${R} characters, which may exceed server limits. If selecting many fields, consider using views. If filtering with large arrays (e.g., .in('id', [many IDs])), consider using an RPC function to pass values server-side.`)):(d?.name==="HeadersOverflowError"||d?.code==="UND_ERR_HEADERS_OVERFLOW")&&(u="",c="HTTP headers exceeded server limits (typically 16KB)",R>this.urlLengthLimit&&(c+=`. Your request URL is ${R} characters. If selecting many fields, consider using views. If filtering with large arrays (e.g., .in('id', [200+ IDs])), consider using an RPC function instead.`)),{success:!1,error:{message:`${(a=o?.name)!==null&&a!==void 0?a:"FetchError"}: ${o?.message}`,details:l,hint:c,code:u},data:null,count:null,status:0,statusText:""}})),i.then(t,e)}async processResponse(t){var e=this;let r=null,n=null,s=null,i=t.status,o=t.statusText;if(t.ok){var a,l;if(e.method!=="HEAD"){var c;const h=await t.text();if(h!=="")if(e.headers.get("Accept")==="text/csv")n=h;else if(e.headers.get("Accept")&&(!((c=e.headers.get("Accept"))===null||c===void 0)&&c.includes("application/vnd.pgrst.plan+text")))n=h;else try{n=JSON.parse(h)}catch{if(r={message:h},n=null,e.shouldThrowOnError)throw new Pr({message:h,details:"",hint:"",code:""})}}const d=(a=e.headers.get("Prefer"))===null||a===void 0?void 0:a.match(/count=(exact|planned|estimated)/),f=(l=t.headers.get("content-range"))===null||l===void 0?void 0:l.split("/");if(d&&f&&f.length>1&&(s=parseInt(f[1])),e.isMaybeSingle&&Array.isArray(n))if(n.length>1){if(r={code:"PGRST116",details:`Results contain ${n.length} rows, application/vnd.pgrst.object+json requires 1 row`,hint:null,message:"JSON object requested, multiple (or no) rows returned"},n=null,s=null,i=406,o="Not Acceptable",e.shouldThrowOnError){var u;throw new Pr(tr(tr({},r),{},{hint:(u=r.hint)!==null&&u!==void 0?u:""}))}}else n.length===1?n=n[0]:n=null}else{const d=await t.text();try{r=JSON.parse(d),Array.isArray(r)&&t.status===404&&(n=[],r=null,i=200,o="OK")}catch{t.status===404&&d===""?(i=204,o="No Content"):r={message:d}}if(r&&e.shouldThrowOnError)throw new Pr(r)}return{success:r===null,error:r,data:n,count:s,status:i,statusText:o}}returns(){return this}overrideTypes(){return this}},rd=class extends td{throwOnError(){return super.throwOnError()}select(t){let e=!1;const r=(t??"*").split("").map(n=>/\s/.test(n)&&!e?"":(n==='"'&&(e=!e),n)).join("");return this.url.searchParams.set("select",r),this.headers.append("Prefer","return=representation"),this}order(t,{ascending:e=!0,nullsFirst:r,foreignTable:n,referencedTable:s=n}={}){const i=s?`${s}.order`:"order",o=this.url.searchParams.get(i);return this.url.searchParams.set(i,`${o?`${o},`:""}${t}.${e?"asc":"desc"}${r===void 0?"":r?".nullsfirst":".nullslast"}`),this}limit(t,{foreignTable:e,referencedTable:r=e}={}){const n=typeof r>"u"?"limit":`${r}.limit`;return this.url.searchParams.set(n,`${t}`),this}range(t,e,{foreignTable:r,referencedTable:n=r}={}){const s=typeof n>"u"?"offset":`${n}.offset`,i=typeof n>"u"?"limit":`${n}.limit`;return this.url.searchParams.set(s,`${t}`),this.url.searchParams.set(i,`${e-t+1}`),this}abortSignal(t){return this.signal=t,this}single(){return this.headers.set("Accept","application/vnd.pgrst.object+json"),this}maybeSingle(){return this.isMaybeSingle=!0,this}csv(){return this.headers.set("Accept","text/csv"),this}geojson(){return this.headers.set("Accept","application/geo+json"),this}explain({analyze:t=!1,verbose:e=!1,settings:r=!1,buffers:n=!1,wal:s=!1,format:i="text"}={}){var o;const a=[t?"analyze":null,e?"verbose":null,r?"settings":null,n?"buffers":null,s?"wal":null].filter(Boolean).join("|"),l=(o=this.headers.get("Accept"))!==null&&o!==void 0?o:"application/json";return this.headers.set("Accept",`application/vnd.pgrst.plan+${i}; for="${l}"; options=${a};`),i==="json"?this:this}rollback(){return this.headers.append("Prefer","tx=rollback"),this}returns(){return this}maxAffected(t){return this.headers.append("Prefer","handling=strict"),this.headers.append("Prefer",`max-affected=${t}`),this}};const ca=new RegExp("[,()]");var Or=class extends rd{throwOnError(){return super.throwOnError()}eq(t,e){return this.url.searchParams.append(t,`eq.${e}`),this}neq(t,e){return this.url.searchParams.append(t,`neq.${e}`),this}gt(t,e){return this.url.searchParams.append(t,`gt.${e}`),this}gte(t,e){return this.url.searchParams.append(t,`gte.${e}`),this}lt(t,e){return this.url.searchParams.append(t,`lt.${e}`),this}lte(t,e){return this.url.searchParams.append(t,`lte.${e}`),this}like(t,e){return this.url.searchParams.append(t,`like.${e}`),this}likeAllOf(t,e){return this.url.searchParams.append(t,`like(all).{${e.join(",")}}`),this}likeAnyOf(t,e){return this.url.searchParams.append(t,`like(any).{${e.join(",")}}`),this}ilike(t,e){return this.url.searchParams.append(t,`ilike.${e}`),this}ilikeAllOf(t,e){return this.url.searchParams.append(t,`ilike(all).{${e.join(",")}}`),this}ilikeAnyOf(t,e){return this.url.searchParams.append(t,`ilike(any).{${e.join(",")}}`),this}regexMatch(t,e){return this.url.searchParams.append(t,`match.${e}`),this}regexIMatch(t,e){return this.url.searchParams.append(t,`imatch.${e}`),this}is(t,e){return this.url.searchParams.append(t,`is.${e}`),this}isDistinct(t,e){return this.url.searchParams.append(t,`isdistinct.${e}`),this}in(t,e){const r=Array.from(new Set(e)).map(n=>typeof n=="string"&&ca.test(n)?`"${n}"`:`${n}`).join(",");return this.url.searchParams.append(t,`in.(${r})`),this}notIn(t,e){const r=Array.from(new Set(e)).map(n=>typeof n=="string"&&ca.test(n)?`"${n}"`:`${n}`).join(",");return this.url.searchParams.append(t,`not.in.(${r})`),this}contains(t,e){return typeof e=="string"?this.url.searchParams.append(t,`cs.${e}`):Array.isArray(e)?this.url.searchParams.append(t,`cs.{${e.join(",")}}`):this.url.searchParams.append(t,`cs.${JSON.stringify(e)}`),this}containedBy(t,e){return typeof e=="string"?this.url.searchParams.append(t,`cd.${e}`):Array.isArray(e)?this.url.searchParams.append(t,`cd.{${e.join(",")}}`):this.url.searchParams.append(t,`cd.${JSON.stringify(e)}`),this}rangeGt(t,e){return this.url.searchParams.append(t,`sr.${e}`),this}rangeGte(t,e){return this.url.searchParams.append(t,`nxl.${e}`),this}rangeLt(t,e){return this.url.searchParams.append(t,`sl.${e}`),this}rangeLte(t,e){return this.url.searchParams.append(t,`nxr.${e}`),this}rangeAdjacent(t,e){return this.url.searchParams.append(t,`adj.${e}`),this}overlaps(t,e){return typeof e=="string"?this.url.searchParams.append(t,`ov.${e}`):this.url.searchParams.append(t,`ov.{${e.join(",")}}`),this}textSearch(t,e,{config:r,type:n}={}){let s="";n==="plain"?s="pl":n==="phrase"?s="ph":n==="websearch"&&(s="w");const i=r===void 0?"":`(${r})`;return this.url.searchParams.append(t,`${s}fts${i}.${e}`),this}match(t){return Object.entries(t).filter(([e,r])=>r!==void 0).forEach(([e,r])=>{this.url.searchParams.append(e,`eq.${r}`)}),this}not(t,e,r){return this.url.searchParams.append(t,`not.${e}.${r}`),this}or(t,{foreignTable:e,referencedTable:r=e}={}){const n=r?`${r}.or`:"or";return this.url.searchParams.append(n,`(${t})`),this}filter(t,e,r){return this.url.searchParams.append(t,`${e}.${r}`),this}},nd=class{constructor(t,{headers:e={},schema:r,fetch:n,urlLengthLimit:s=8e3,retry:i}){this.url=t,this.headers=new Headers(e),this.schema=r,this.fetch=n,this.urlLengthLimit=s,this.retry=i}cloneRequestState(){return{url:new URL(this.url.toString()),headers:new Headers(this.headers)}}select(t,e){const{head:r=!1,count:n}=e??{},s=r?"HEAD":"GET";let i=!1;const o=(t??"*").split("").map(c=>/\s/.test(c)&&!i?"":(c==='"'&&(i=!i),c)).join(""),{url:a,headers:l}=this.cloneRequestState();return a.searchParams.set("select",o),n&&l.append("Prefer",`count=${n}`),new Or({method:s,url:a,headers:l,schema:this.schema,fetch:this.fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}insert(t,{count:e,defaultToNull:r=!0}={}){var n;const s="POST",{url:i,headers:o}=this.cloneRequestState();if(e&&o.append("Prefer",`count=${e}`),r||o.append("Prefer","missing=default"),Array.isArray(t)){const a=t.reduce((l,c)=>l.concat(Object.keys(c)),[]);if(a.length>0){const l=[...new Set(a)].map(c=>`"${c}"`);i.searchParams.set("columns",l.join(","))}}return new Or({method:s,url:i,headers:o,schema:this.schema,body:t,fetch:(n=this.fetch)!==null&&n!==void 0?n:fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}upsert(t,{onConflict:e,ignoreDuplicates:r=!1,count:n,defaultToNull:s=!0}={}){var i;const o="POST",{url:a,headers:l}=this.cloneRequestState();if(l.append("Prefer",`resolution=${r?"ignore":"merge"}-duplicates`),e!==void 0&&a.searchParams.set("on_conflict",e),n&&l.append("Prefer",`count=${n}`),s||l.append("Prefer","missing=default"),Array.isArray(t)){const c=t.reduce((u,d)=>u.concat(Object.keys(d)),[]);if(c.length>0){const u=[...new Set(c)].map(d=>`"${d}"`);a.searchParams.set("columns",u.join(","))}}return new Or({method:o,url:a,headers:l,schema:this.schema,body:t,fetch:(i=this.fetch)!==null&&i!==void 0?i:fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}update(t,{count:e}={}){var r;const n="PATCH",{url:s,headers:i}=this.cloneRequestState();return e&&i.append("Prefer",`count=${e}`),new Or({method:n,url:s,headers:i,schema:this.schema,body:t,fetch:(r=this.fetch)!==null&&r!==void 0?r:fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}delete({count:t}={}){var e;const r="DELETE",{url:n,headers:s}=this.cloneRequestState();return t&&s.append("Prefer",`count=${t}`),new Or({method:r,url:n,headers:s,schema:this.schema,fetch:(e=this.fetch)!==null&&e!==void 0?e:fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}};function sd(t,e){try{const o=JSON.parse(t);if(o&&typeof o=="object"&&!Array.isArray(o)){var r,n,s,i;return new Pr({message:String((r=o.message)!==null&&r!==void 0?r:t),details:(n=o.details)!==null&&n!==void 0?n:"",hint:(s=o.hint)!==null&&s!==void 0?s:"",code:(i=o.code)!==null&&i!==void 0?i:""})}}catch{}return new Pr({message:t||e,details:"",hint:"",code:""})}function ua(t,e,r){var n;const s=t;return{success:!1,error:new Pr({message:`${(n=s?.name)!==null&&n!==void 0?n:"FetchError"}: ${s?.message}`,details:"",hint:"",code:""}),data:null,count:null,status:e,statusText:r}}var id=class jl{constructor(e,{headers:r={},schema:n,fetch:s,timeout:i,urlLengthLimit:o=8e3,retry:a}={}){this.url=e,this.headers=new Headers(r),this.schemaName=n,this.urlLengthLimit=o;const l=s??globalThis.fetch;i!==void 0&&i>0?this.fetch=(c,u)=>{const d=new AbortController,f=setTimeout(()=>d.abort(),i),h=u?.signal;if(h){if(h.aborted)return clearTimeout(f),l(c,u);const y=()=>{clearTimeout(f),d.abort()};return h.addEventListener("abort",y,{once:!0}),l(c,tr(tr({},u),{},{signal:d.signal})).finally(()=>{clearTimeout(f),h.removeEventListener("abort",y)})}return l(c,tr(tr({},u),{},{signal:d.signal})).finally(()=>clearTimeout(f))}:this.fetch=l,this.retry=a}from(e){if(!e||typeof e!="string"||e.trim()==="")throw new Error("Invalid relation name: relation must be a non-empty string.");return new nd(new URL(`${this.url}/${e}`),{headers:new Headers(this.headers),schema:this.schemaName,fetch:this.fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}schema(e){return new jl(this.url,{headers:this.headers,schema:e,fetch:this.fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}async getOpenApiSpec(){var e=this,r;const n=new Headers(e.headers);n.set("Accept","application/openapi+json"),e.schemaName&&n.set("Accept-Profile",e.schemaName);const s={};n.forEach((c,u)=>{s[u]=c});const i=(r=e.fetch)!==null&&r!==void 0?r:globalThis.fetch;let o;try{var a;o=await Ul(i,`${e.url}/`,{method:"GET",headers:s},(a=e.retry)!==null&&a!==void 0?a:!0)}catch(c){return ua(c,0,"")}let l;try{l=await o.text()}catch(c){return ua(c,o.status,o.statusText)}if(o.ok)try{return{success:!0,error:null,data:JSON.parse(l),count:null,status:o.status,statusText:o.statusText}}catch{}return{success:!1,error:sd(l,o.statusText),data:null,count:null,status:o.status,statusText:o.statusText}}rpc(e,r={},{head:n=!1,get:s=!1,count:i}={}){var o;let a;const l=new URL(`${this.url}/rpc/${e}`);let c;const u=h=>h!==null&&typeof h=="object"&&(!Array.isArray(h)||h.some(u)),d=n&&Object.values(r).some(u);d?(a="POST",c=r):n||s?(a=n?"HEAD":"GET",Object.entries(r).filter(([h,y])=>y!==void 0).map(([h,y])=>[h,Array.isArray(y)?`{${y.join(",")}}`:`${y}`]).forEach(([h,y])=>{l.searchParams.append(h,y)})):(a="POST",c=r);const f=new Headers(this.headers);return d?f.set("Prefer",i?`count=${i},return=minimal`:"return=minimal"):i&&f.set("Prefer",`count=${i}`),new Or({method:a,url:l,headers:f,schema:this.schemaName,body:c,fetch:(o=this.fetch)!==null&&o!==void 0?o:fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}};class od{constructor(){}static detectEnvironment(){var e;if(typeof WebSocket<"u")return{type:"native",wsConstructor:WebSocket};const r=globalThis;if(typeof globalThis<"u"&&typeof r.WebSocket<"u")return{type:"native",wsConstructor:r.WebSocket};const n=typeof global<"u"?global:void 0;if(n&&typeof n.WebSocket<"u")return{type:"native",wsConstructor:n.WebSocket};if(typeof globalThis<"u"&&typeof r.WebSocketPair<"u"&&typeof globalThis.WebSocket>"u")return{type:"cloudflare",error:"Cloudflare Workers detected. WebSocket clients are not supported in Cloudflare Workers.",workaround:"Use Cloudflare Workers WebSocket API for server-side WebSocket handling, or deploy to a different runtime."};if(typeof globalThis<"u"&&r.EdgeRuntime||typeof navigator<"u"&&(!((e=navigator.userAgent)===null||e===void 0)&&e.includes("Vercel-Edge")))return{type:"unsupported",error:"Edge runtime detected (Vercel Edge/Netlify Edge). WebSockets are not supported in edge functions.",workaround:"Use serverless functions or a different deployment target for WebSocket functionality."};const s=globalThis.process;if(s){const i=s.versions;if(i&&i.node)return{type:"unsupported",error:"Node.js detected but native WebSocket not found.",workaround:"Ensure you are running Node.js 22+ or provide a WebSocket implementation via the transport option."}}return{type:"unsupported",error:"Unknown JavaScript runtime without WebSocket support.",workaround:"Ensure you're running in a supported environment (browser, Node.js, Deno) or provide a custom WebSocket implementation."}}static getWebSocketConstructor(){const e=this.detectEnvironment();if(e.wsConstructor)return e.wsConstructor;let r=e.error||"WebSocket not supported in this environment.";throw e.workaround&&(r+=`

Suggested solution: ${e.workaround}`),new Error(r)}static isWebSocketSupported(){try{return this.detectEnvironment().type==="native"}catch{return!1}}}const ad="2.117.2",ld=`realtime-js/${ad}`,cd="1.0.0",Nl="2.0.0",ud=Nl,dd=1e4,hd=15e3,fd=1e4,pd=100,Ut={closed:"closed",errored:"errored",joined:"joined",joining:"joining",leaving:"leaving"},ql={close:"phx_close",error:"phx_error",join:"phx_join",leave:"phx_leave",access_token:"access_token"},Bi={connecting:"connecting",closing:"closing",closed:"closed"};class md{constructor(e){this.HEADER_LENGTH=1,this.USER_BROADCAST_PUSH_META_LENGTH=6,this.KINDS={userBroadcastPush:3,userBroadcast:4},this.BINARY_ENCODING=0,this.JSON_ENCODING=1,this.BROADCAST_EVENT="broadcast",this.allowedMetadataKeys=[],this.allowedMetadataKeys=e??[]}encode(e,r){if(e.event===this.BROADCAST_EVENT&&!(e.payload instanceof ArrayBuffer)&&typeof e.payload.event=="string")return r(this._binaryEncodeUserBroadcastPush(e));let n=[e.join_ref,e.ref,e.topic,e.event,e.payload];return r(JSON.stringify(n))}_binaryEncodeUserBroadcastPush(e){var r;return this._isArrayBuffer((r=e.payload)===null||r===void 0?void 0:r.payload)?this._encodeBinaryUserBroadcastPush(e):this._encodeJsonUserBroadcastPush(e)}_encodeBinaryUserBroadcastPush(e){var r,n;const s=(n=(r=e.payload)===null||r===void 0?void 0:r.payload)!==null&&n!==void 0?n:new ArrayBuffer(0);return this._encodeUserBroadcastPush(e,this.BINARY_ENCODING,s)}_encodeJsonUserBroadcastPush(e){var r,n;const s=(n=(r=e.payload)===null||r===void 0?void 0:r.payload)!==null&&n!==void 0?n:{},o=new TextEncoder().encode(JSON.stringify(s)).buffer;return this._encodeUserBroadcastPush(e,this.JSON_ENCODING,o)}_encodeUserBroadcastPush(e,r,n){var s,i;const o=new TextEncoder,a=o.encode(e.topic),l=o.encode((s=e.ref)!==null&&s!==void 0?s:""),c=o.encode((i=e.join_ref)!==null&&i!==void 0?i:""),u=o.encode(e.payload.event),d=this.allowedMetadataKeys?this._pick(e.payload,this.allowedMetadataKeys):{},f=o.encode(Object.keys(d).length===0?"":JSON.stringify(d));if(c.length>255)throw new Error(`joinRef length ${c.length} exceeds maximum of 255`);if(l.length>255)throw new Error(`ref length ${l.length} exceeds maximum of 255`);if(a.length>255)throw new Error(`topic length ${a.length} exceeds maximum of 255`);if(u.length>255)throw new Error(`userEvent length ${u.length} exceeds maximum of 255`);if(f.length>255)throw new Error(`metadata length ${f.length} exceeds maximum of 255`);const h=this.USER_BROADCAST_PUSH_META_LENGTH+c.length+l.length+a.length+u.length+f.length,y=new ArrayBuffer(this.HEADER_LENGTH+h),v=new DataView(y),_=new Uint8Array(y);let R=0;v.setUint8(R++,this.KINDS.userBroadcastPush),v.setUint8(R++,c.length),v.setUint8(R++,l.length),v.setUint8(R++,a.length),v.setUint8(R++,u.length),v.setUint8(R++,f.length),v.setUint8(R++,r),_.set(c,R),R+=c.length,_.set(l,R),R+=l.length,_.set(a,R),R+=a.length,_.set(u,R),R+=u.length,_.set(f,R),R+=f.length;var g=new Uint8Array(y.byteLength+n.byteLength);return g.set(new Uint8Array(y),0),g.set(new Uint8Array(n),y.byteLength),g.buffer}decode(e,r){if(this._isArrayBuffer(e)){let n=this._binaryDecode(e);return r(n)}if(typeof e=="string"){const n=JSON.parse(e),[s,i,o,a,l]=n;return r({join_ref:s,ref:i,topic:o,event:a,payload:l})}return r({})}_binaryDecode(e){const r=new DataView(e),n=r.getUint8(0),s=new TextDecoder;if(n===this.KINDS.userBroadcast)return this._decodeUserBroadcast(e,r,s)}_decodeUserBroadcast(e,r,n){const s=r.getUint8(1),i=r.getUint8(2),o=r.getUint8(3),a=r.getUint8(4);let l=this.HEADER_LENGTH+4;const c=n.decode(e.slice(l,l+s));l=l+s;const u=n.decode(e.slice(l,l+i));l=l+i;const d=n.decode(e.slice(l,l+o));l=l+o;const f=e.slice(l,e.byteLength),h=a===this.JSON_ENCODING?JSON.parse(n.decode(f)):f,y={type:this.BROADCAST_EVENT,event:u,payload:h};return o>0&&(y.meta=JSON.parse(d)),{join_ref:null,ref:null,topic:c,event:this.BROADCAST_EVENT,payload:y}}_isArrayBuffer(e){var r;return e instanceof ArrayBuffer||((r=e?.constructor)===null||r===void 0?void 0:r.name)==="ArrayBuffer"}_pick(e,r){return!e||typeof e!="object"?{}:Object.fromEntries(Object.entries(e).filter(([n])=>r.includes(n)))}}var Q;(function(t){t.abstime="abstime",t.bool="bool",t.date="date",t.daterange="daterange",t.float4="float4",t.float8="float8",t.int2="int2",t.int4="int4",t.int4range="int4range",t.int8="int8",t.int8range="int8range",t.json="json",t.jsonb="jsonb",t.money="money",t.numeric="numeric",t.oid="oid",t.reltime="reltime",t.text="text",t.time="time",t.timestamp="timestamp",t.timestamptz="timestamptz",t.timetz="timetz",t.tsrange="tsrange",t.tstzrange="tstzrange"})(Q||(Q={}));const da=(t,e,r={})=>{var n;const s=(n=r.skipTypes)!==null&&n!==void 0?n:[];return e?Object.keys(e).reduce((i,o)=>(i[o]=gd(o,t,e,s),i),{}):{}},gd=(t,e,r,n)=>{const s=e.find(a=>a.name===t),i=s?.type,o=r[t];return i&&!n.includes(i)?Bl(i,o):Mi(o)},Bl=(t,e)=>{if(t.charAt(0)==="_"){const r=t.slice(1,t.length);return _d(e,r)}switch(t){case Q.bool:return yd(e);case Q.float4:case Q.float8:case Q.int2:case Q.int4:case Q.int8:case Q.numeric:case Q.oid:return vd(e);case Q.json:case Q.jsonb:return wd(e);case Q.timestamp:return bd(e);case Q.abstime:case Q.date:case Q.daterange:case Q.int4range:case Q.int8range:case Q.money:case Q.reltime:case Q.text:case Q.time:case Q.timestamptz:case Q.timetz:case Q.tsrange:case Q.tstzrange:return Mi(e);default:return Mi(e)}},Mi=t=>t,yd=t=>{switch(t){case"t":return!0;case"f":return!1;default:return t}},vd=t=>{if(typeof t=="string"){const e=parseFloat(t);if(!Number.isNaN(e))return e}return t},wd=t=>{if(typeof t=="string")try{return JSON.parse(t)}catch{return t}return t},_d=(t,e)=>{if(typeof t!="string")return t;const r=t.length-1,n=t[r];if(t[0]==="{"&&n==="}"){let i;const o=t.slice(1,r);try{i=JSON.parse("["+o+"]")}catch{i=o?o.split(","):[]}return i.map(a=>Bl(e,a))}return t},bd=t=>typeof t=="string"?t.replace(" ","T"):t,Ml=t=>{const e=new URL(t);return e.protocol=e.protocol.replace(/^ws/i,"http"),e.pathname=e.pathname.replace(/\/+$/,"").replace(/\/socket\/websocket$/i,"").replace(/\/socket$/i,"").replace(/\/websocket$/i,""),e.pathname===""||e.pathname==="/"?e.pathname="/api/broadcast":e.pathname=e.pathname+"/api/broadcast",e.href};var Cr=t=>typeof t=="function"?t:function(){return t},Sd=typeof self<"u"?self:null,Rr=typeof window<"u"?window:null,dt=Sd||Rr||globalThis,kd="2.0.0",Ed=1e4,Td=1e3,Ad=100,ht={connecting:0,open:1,closing:2,closed:3},xe={closed:"closed",errored:"errored",joined:"joined",joining:"joining",leaving:"leaving"},St={close:"phx_close",error:"phx_error",join:"phx_join",reply:"phx_reply",leave:"phx_leave"},Fi={longpoll:"longpoll",websocket:"websocket"},Od={complete:4},Wi="base64url.bearer.phx.",Qn=class{constructor(t,e,r,n){this.channel=t,this.event=e,this.payload=r||function(){return{}},this.receivedResp=null,this.timeout=n,this.timeoutTimer=null,this.recHooks=[],this.sent=!1,this.ref=void 0}resend(t){this.timeout=t,this.reset(),this.send()}send(){this.hasReceived("timeout")||(this.startTimeout(),this.sent=!0,this.channel.socket.push({topic:this.channel.topic,event:this.event,payload:this.payload(),ref:this.ref,join_ref:this.channel.joinRef()}))}receive(t,e){return this.hasReceived(t)&&e(this.receivedResp.response),this.recHooks.push({status:t,callback:e}),this}reset(){this.cancelRefEvent(),this.ref=null,this.refEvent=null,this.receivedResp=null,this.sent=!1}destroy(){this.cancelRefEvent(),this.cancelTimeout()}matchReceive({status:t,response:e,_ref:r}){this.recHooks.filter(n=>n.status===t).forEach(n=>n.callback(e))}cancelRefEvent(){this.refEvent&&this.channel.off(this.refEvent)}cancelTimeout(){clearTimeout(this.timeoutTimer),this.timeoutTimer=null}startTimeout(){this.timeoutTimer&&this.cancelTimeout(),this.ref=this.channel.socket.makeRef(),this.refEvent=this.channel.replyEventName(this.ref),this.channel.on(this.refEvent,t=>{this.cancelRefEvent(),this.cancelTimeout(),this.receivedResp=t,this.matchReceive(t)}),this.timeoutTimer=setTimeout(()=>{this.trigger("timeout",{})},this.timeout)}hasReceived(t){return this.receivedResp&&this.receivedResp.status===t}trigger(t,e){this.channel.trigger(this.refEvent,{status:t,response:e})}},Fl=class{constructor(t,e){this.callback=t,this.timerCalc=e,this.timer=void 0,this.tries=0}reset(){this.tries=0,clearTimeout(this.timer)}scheduleTimeout(){clearTimeout(this.timer),this.timer=setTimeout(()=>{this.tries=this.tries+1,this.callback()},this.timerCalc(this.tries+1))}},Rd=class{constructor(t,e,r){this.state=xe.closed,this.topic=t,this.params=Cr(e||{}),this.socket=r,this.bindings=[],this.bindingRef=0,this.timeout=this.socket.timeout,this.joinedOnce=!1,this.joinPush=new Qn(this,St.join,this.params,this.timeout),this.pushBuffer=[],this.stateChangeRefs=[],this.rejoinTimer=new Fl(()=>{this.socket.isConnected()&&this.rejoin()},this.socket.rejoinAfterMs),this.stateChangeRefs.push(this.socket.onError(()=>this.rejoinTimer.reset())),this.stateChangeRefs.push(this.socket.onOpen(()=>{this.rejoinTimer.reset(),this.isErrored()&&this.rejoin()})),this.joinPush.receive("ok",()=>{this.state=xe.joined,this.rejoinTimer.reset(),this.pushBuffer.forEach(n=>n.send()),this.pushBuffer=[]}),this.joinPush.receive("error",n=>{this.state=xe.errored,this.socket.hasLogger()&&this.socket.log("channel",`error ${this.topic}`,n),this.socket.isConnected()&&this.rejoinTimer.scheduleTimeout()}),this.onClose(()=>{this.rejoinTimer.reset(),this.socket.hasLogger()&&this.socket.log("channel",`close ${this.topic}`),this.state=xe.closed,this.socket.remove(this)}),this.onError(n=>{this.socket.hasLogger()&&this.socket.log("channel",`error ${this.topic}`,n),this.isJoining()&&this.joinPush.reset(),this.state=xe.errored,this.socket.isConnected()&&this.rejoinTimer.scheduleTimeout()}),this.joinPush.receive("timeout",()=>{this.socket.hasLogger()&&this.socket.log("channel",`timeout ${this.topic}`,this.joinPush.timeout),new Qn(this,St.leave,Cr({}),this.timeout).send(),this.state=xe.errored,this.joinPush.reset(),this.socket.isConnected()&&this.rejoinTimer.scheduleTimeout()}),this.on(St.reply,(n,s)=>{this.trigger(this.replyEventName(s),n)})}join(t=this.timeout){if(this.joinedOnce)throw new Error("tried to join multiple times. 'join' can only be called a single time per channel instance");return this.timeout=t,this.joinedOnce=!0,this.rejoin(),this.joinPush}teardown(){this.pushBuffer.forEach(t=>t.destroy()),this.pushBuffer=[],this.rejoinTimer.reset(),this.joinPush.destroy(),this.state=xe.closed,this.bindings=[]}onClose(t){this.on(St.close,t)}onError(t){return this.on(St.error,e=>t(e))}on(t,e){let r=this.bindingRef++;return this.bindings.push({event:t,ref:r,callback:e}),r}off(t,e){this.bindings=this.bindings.filter(r=>!(r.event===t&&(typeof e>"u"||e===r.ref)))}canPush(){return this.socket.isConnected()&&this.isJoined()}push(t,e,r=this.timeout){if(e=e||{},!this.joinedOnce)throw new Error(`tried to push '${t}' to '${this.topic}' before joining. Use channel.join() before pushing events`);let n=new Qn(this,t,function(){return e},r);return this.canPush()?n.send():(n.startTimeout(),this.pushBuffer.push(n)),n}leave(t=this.timeout){this.rejoinTimer.reset(),this.joinPush.cancelTimeout(),this.state=xe.leaving;let e=()=>{this.socket.hasLogger()&&this.socket.log("channel",`leave ${this.topic}`),this.trigger(St.close,"leave")},r=new Qn(this,St.leave,Cr({}),t);return r.receive("ok",()=>e()).receive("timeout",()=>e()),r.send(),this.canPush()||r.trigger("ok",{}),r}onMessage(t,e,r){return e}filterBindings(t,e,r){return!0}isMember(t,e,r,n){return this.topic!==t?!1:n&&n!==this.joinRef()?(this.socket.hasLogger()&&this.socket.log("channel","dropping outdated message",{topic:t,event:e,payload:r,joinRef:n}),!1):!0}joinRef(){return this.joinPush.ref}rejoin(t=this.timeout){this.isLeaving()||(this.socket.leaveOpenTopic(this.topic),this.state=xe.joining,this.joinPush.resend(t))}trigger(t,e,r,n){let s=this.onMessage(t,e,r,n);if(e&&!s)throw new Error("channel onMessage callbacks must return the payload, modified or unmodified");let i=this.bindings.filter(o=>o.event===t&&this.filterBindings(o,e,r));for(let o=0;o<i.length;o++)i[o].callback(s,r,n||this.joinRef())}replyEventName(t){return`chan_reply_${t}`}isClosed(){return this.state===xe.closed}isErrored(){return this.state===xe.errored}isJoined(){return this.state===xe.joined}isJoining(){return this.state===xe.joining}isLeaving(){return this.state===xe.leaving}},Es=class{static request(t,e,r,n,s,i,o){if(dt.XDomainRequest){let a=new dt.XDomainRequest;return this.xdomainRequest(a,t,e,n,s,i,o)}else if(dt.XMLHttpRequest){let a=new dt.XMLHttpRequest;return this.xhrRequest(a,t,e,r,n,s,i,o)}else{if(dt.fetch&&dt.AbortController)return this.fetchRequest(t,e,r,n,s,i,o);throw new Error("No suitable XMLHttpRequest implementation found")}}static fetchRequest(t,e,r,n,s,i,o){let a={method:t,headers:r,body:n},l=null;return s&&(l=new AbortController,setTimeout(()=>l.abort(),s),a.signal=l.signal),dt.fetch(e,a).then(c=>c.text()).then(c=>this.parseJSON(c)).then(c=>o&&o(c)).catch(c=>{c.name==="AbortError"&&i?i():o&&o(null)}),l}static xdomainRequest(t,e,r,n,s,i,o){return t.timeout=s,t.open(e,r),t.onload=()=>{let a=this.parseJSON(t.responseText);o&&o(a)},i&&(t.ontimeout=i),t.onprogress=()=>{},t.send(n),t}static xhrRequest(t,e,r,n,s,i,o,a){t.open(e,r,!0),t.timeout=i;for(let[l,c]of Object.entries(n))t.setRequestHeader(l,c);return t.onerror=()=>a&&a(null),t.onreadystatechange=()=>{if(t.readyState===Od.complete&&a){let l=this.parseJSON(t.responseText);a(l)}},o&&(t.ontimeout=o),t.send(s),t}static parseJSON(t){if(!t||t==="")return null;try{return JSON.parse(t)}catch{return console&&console.log("failed to parse JSON response",t),null}}static serialize(t,e){let r=[];for(var n in t){if(!Object.prototype.hasOwnProperty.call(t,n))continue;let s=e?`${e}[${n}]`:n,i=t[n];typeof i=="object"?r.push(this.serialize(i,s)):r.push(encodeURIComponent(s)+"="+encodeURIComponent(i))}return r.join("&")}static appendParams(t,e){if(Object.keys(e).length===0)return t;let r=t.match(/\?/)?"&":"?";return`${t}${r}${this.serialize(e)}`}},$d=t=>{let e="",r=new Uint8Array(t),n=r.byteLength;for(let s=0;s<n;s++)e+=String.fromCharCode(r[s]);return btoa(e)},Sr=class{constructor(t,e){e&&e.length===2&&e[1].startsWith(Wi)&&(this.authToken=atob(e[1].slice(Wi.length))),this.endPoint=null,this.token=null,this.skipHeartbeat=!0,this.reqs=new Set,this.awaitingBatchAck=!1,this.currentBatch=null,this.currentBatchTimer=null,this.batchBuffer=[],this.onopen=function(){},this.onerror=function(){},this.onmessage=function(){},this.onclose=function(){},this.pollEndpoint=this.normalizeEndpoint(t),this.readyState=ht.connecting,setTimeout(()=>this.poll(),0)}normalizeEndpoint(t){return t.replace("ws://","http://").replace("wss://","https://").replace(new RegExp("(.*)/"+Fi.websocket),"$1/"+Fi.longpoll)}endpointURL(){return Es.appendParams(this.pollEndpoint,{token:this.token})}closeAndRetry(t,e,r){this.close(t,e,r),this.readyState=ht.connecting}ontimeout(){this.onerror("timeout"),this.closeAndRetry(1005,"timeout",!1)}isActive(){return this.readyState===ht.open||this.readyState===ht.connecting}poll(){const t={Accept:"application/json"};this.authToken&&(t["X-Phoenix-AuthToken"]=this.authToken),this.ajax("GET",t,null,()=>this.ontimeout(),e=>{if(e){var{status:r,token:n,messages:s}=e;if(r===410&&this.token!==null){this.onerror(410),this.closeAndRetry(3410,"session_gone",!1);return}this.token=n}else r=0;switch(r){case 200:s.forEach(i=>{setTimeout(()=>this.onmessage({data:i}),0)}),this.poll();break;case 204:this.poll();break;case 410:this.readyState=ht.open,this.onopen({}),this.poll();break;case 403:this.onerror(403),this.close(1008,"forbidden",!1);break;case 0:case 500:this.onerror(500),this.closeAndRetry(1011,"internal server error",500);break;default:throw new Error(`unhandled poll status ${r}`)}})}send(t){typeof t!="string"&&(t=$d(t)),this.currentBatch?this.currentBatch.push(t):this.awaitingBatchAck?this.batchBuffer.push(t):(this.currentBatch=[t],this.currentBatchTimer=setTimeout(()=>{this.batchSend(this.currentBatch),this.currentBatch=null},0))}batchSend(t,e=0){this.awaitingBatchAck=!0;const r=e+Ad,n=t.slice(e,r);this.ajax("POST",{"Content-Type":"application/x-ndjson"},n.join(`
`),()=>this.onerror("timeout"),s=>{!s||s.status!==200?(this.awaitingBatchAck=!1,this.onerror(s&&s.status),this.closeAndRetry(1011,"internal server error",!1)):r<t.length?this.batchSend(t,r):this.batchBuffer.length>0?(this.batchSend(this.batchBuffer),this.batchBuffer=[]):this.awaitingBatchAck=!1})}close(t,e,r){for(let s of this.reqs)s.abort();this.readyState=ht.closed;let n=Object.assign({code:1e3,reason:void 0,wasClean:!0},{code:t,reason:e,wasClean:r});this.batchBuffer=[],clearTimeout(this.currentBatchTimer),this.currentBatchTimer=null,typeof CloseEvent<"u"?this.onclose(new CloseEvent("close",n)):this.onclose(n)}ajax(t,e,r,n,s){let i,o=()=>{this.reqs.delete(i),n()};i=Es.request(t,this.endpointURL(),e,r,this.timeout,o,a=>{this.reqs.delete(i),this.isActive()&&s(a)}),this.reqs.add(i)}},xd=class sn{constructor(e,r={}){let n=r.events||{state:"presence_state",diff:"presence_diff"};this.state=Object.create(null),this.pendingDiffs=[],this.channel=e,this.joinRef=null,this.caller={onJoin:function(){},onLeave:function(){},onSync:function(){}},this.channel.on(n.state,s=>{let{onJoin:i,onLeave:o,onSync:a}=this.caller;this.joinRef=this.channel.joinRef(),this.state=sn.syncState(this.state,s,i,o),this.pendingDiffs.forEach(l=>{this.state=sn.syncDiff(this.state,l,i,o)}),this.pendingDiffs=[],a()}),this.channel.on(n.diff,s=>{let{onJoin:i,onLeave:o,onSync:a}=this.caller;this.inPendingSyncState()?this.pendingDiffs.push(s):(this.state=sn.syncDiff(this.state,s,i,o),a())})}onJoin(e){this.caller.onJoin=e}onLeave(e){this.caller.onLeave=e}onSync(e){this.caller.onSync=e}list(e){return sn.list(this.state,e)}inPendingSyncState(){return!this.joinRef||this.joinRef!==this.channel.joinRef()}static syncState(e,r,n,s){let i=this.toNullProtoObj(this.clone(e));r=this.toNullProtoObj(r);let o=Object.create(null),a=Object.create(null);return this.map(i,(l,c)=>{r[l]||(a[l]=c)}),this.map(r,(l,c)=>{let u=i[l];if(u){let d=c.metas.map(v=>v.phx_ref),f=u.metas.map(v=>v.phx_ref),h=c.metas.filter(v=>f.indexOf(v.phx_ref)<0),y=u.metas.filter(v=>d.indexOf(v.phx_ref)<0);h.length>0&&(o[l]=c,o[l].metas=h),y.length>0&&(a[l]=this.clone(u),a[l].metas=y)}else o[l]=c}),this.syncDiff(i,{joins:o,leaves:a},n,s)}static syncDiff(e,r,n,s){e=this.toNullProtoObj(e);let{joins:i,leaves:o}=this.clone(r);return n||(n=function(){}),s||(s=function(){}),this.map(i,(a,l)=>{let c=e[a];if(e[a]=this.clone(l),c){let u=e[a].metas.map(f=>f.phx_ref),d=c.metas.filter(f=>u.indexOf(f.phx_ref)<0);e[a].metas.unshift(...d)}n(a,c,l)}),this.map(o,(a,l)=>{let c=e[a];if(!c)return;let u=l.metas.map(d=>d.phx_ref);c.metas=c.metas.filter(d=>u.indexOf(d.phx_ref)<0),s(a,c,l),c.metas.length===0&&delete e[a]}),e}static list(e,r){return r||(r=function(n,s){return s}),this.map(e,(n,s)=>r(n,s))}static map(e,r){return Object.getOwnPropertyNames(e).map(n=>r(n,e[n]))}static toNullProtoObj(e){if(Object.getPrototypeOf(e)===null)return e;let r=Object.create(null);return Object.getOwnPropertyNames(e).forEach(n=>{r[n]=e[n]}),r}static clone(e){return JSON.parse(JSON.stringify(e))}},Zn={HEADER_LENGTH:1,META_LENGTH:4,KINDS:{push:0,reply:1,broadcast:2},encode(t,e){if(t.payload.constructor===ArrayBuffer)return e(this.binaryEncode(t));{let r=[t.join_ref,t.ref,t.topic,t.event,t.payload];return e(JSON.stringify(r))}},decode(t,e){if(t.constructor===ArrayBuffer)return e(this.binaryDecode(t));{let[r,n,s,i,o]=JSON.parse(t);return e({join_ref:r,ref:n,topic:s,event:i,payload:o})}},binaryEncode(t){let{join_ref:e,ref:r,event:n,topic:s,payload:i}=t,o=new TextEncoder,a=o.encode(e),l=o.encode(r),c=o.encode(s),u=o.encode(n);this.assertFieldSize(a.byteLength,"join_ref"),this.assertFieldSize(l.byteLength,"ref"),this.assertFieldSize(c.byteLength,"topic"),this.assertFieldSize(u.byteLength,"event");let d=this.META_LENGTH+a.byteLength+l.byteLength+c.byteLength+u.byteLength,f=new ArrayBuffer(this.HEADER_LENGTH+d),h=new Uint8Array(f),y=new DataView(f),v=0;y.setUint8(v++,this.KINDS.push),y.setUint8(v++,a.byteLength),y.setUint8(v++,l.byteLength),y.setUint8(v++,c.byteLength),y.setUint8(v++,u.byteLength),h.set(a,v),v+=a.byteLength,h.set(l,v),v+=l.byteLength,h.set(c,v),v+=c.byteLength,h.set(u,v),v+=u.byteLength;var _=new Uint8Array(f.byteLength+i.byteLength);return _.set(h,0),_.set(new Uint8Array(i),f.byteLength),_.buffer},assertFieldSize(t,e){if(t>255)throw new Error(`unable to convert ${e} to binary: must be less than or equal to 255 bytes, but is ${t} bytes`)},binaryDecode(t){let e=new DataView(t),r=e.getUint8(0),n=new TextDecoder;switch(r){case this.KINDS.push:return this.decodePush(t,e,n);case this.KINDS.reply:return this.decodeReply(t,e,n);case this.KINDS.broadcast:return this.decodeBroadcast(t,e,n)}},decodePush(t,e,r){let n=e.getUint8(1),s=e.getUint8(2),i=e.getUint8(3),o=this.HEADER_LENGTH+this.META_LENGTH-1,a=r.decode(t.slice(o,o+n));o=o+n;let l=r.decode(t.slice(o,o+s));o=o+s;let c=r.decode(t.slice(o,o+i));o=o+i;let u=t.slice(o,t.byteLength);return{join_ref:a,ref:null,topic:l,event:c,payload:u}},decodeReply(t,e,r){let n=e.getUint8(1),s=e.getUint8(2),i=e.getUint8(3),o=e.getUint8(4),a=this.HEADER_LENGTH+this.META_LENGTH,l=r.decode(t.slice(a,a+n));a=a+n;let c=r.decode(t.slice(a,a+s));a=a+s;let u=r.decode(t.slice(a,a+i));a=a+i;let d=r.decode(t.slice(a,a+o));a=a+o;let f=t.slice(a,t.byteLength),h={status:d,response:f};return{join_ref:l,ref:c,topic:u,event:St.reply,payload:h}},decodeBroadcast(t,e,r){let n=e.getUint8(1),s=e.getUint8(2),i=this.HEADER_LENGTH+2,o=r.decode(t.slice(i,i+n));i=i+n;let a=r.decode(t.slice(i,i+s));i=i+s;let l=t.slice(i,t.byteLength);return{join_ref:null,ref:null,topic:o,event:a,payload:l}}},Pd=class{constructor(t,e={}){this.stateChangeCallbacks={open:[],close:[],error:[],message:[]},this.channels=[],this.sendBuffer=[],this.ref=0,this.fallbackRef=null,this.timeout=e.timeout||Ed,this.transport=e.transport||dt.WebSocket||Sr,this.conn=void 0,this.primaryPassedHealthCheck=!1,this.longPollFallbackMs=e.longPollFallbackMs,this.fallbackTimer=null;let r=null;try{r=dt&&dt.sessionStorage}catch{}this.sessionStore=e.sessionStorage||r,this.establishedConnections=0,this.defaultEncoder=Zn.encode.bind(Zn),this.defaultDecoder=Zn.decode.bind(Zn),this.closeWasClean=!0,this.disconnecting=!1,this.binaryType=e.binaryType||"arraybuffer",this.connectClock=1,this.pageHidden=!1,this.encode=void 0,this.decode=void 0,this.transport!==Sr?(this.encode=e.encode||this.defaultEncoder,this.decode=e.decode||this.defaultDecoder):(this.encode=this.defaultEncoder,this.decode=this.defaultDecoder);let n=null;Rr&&Rr.addEventListener&&(Rr.addEventListener("pagehide",s=>{this.conn&&(this.disconnect(),n=this.connectClock)}),Rr.addEventListener("pageshow",s=>{n===this.connectClock&&(n=null,this.connect())}),Rr.addEventListener("visibilitychange",()=>{document.visibilityState==="hidden"?this.pageHidden=!0:(this.pageHidden=!1,!this.isConnected()&&!this.closeWasClean&&this.teardown(()=>this.connect()))})),this.heartbeatIntervalMs=e.heartbeatIntervalMs||3e4,this.autoSendHeartbeat=e.autoSendHeartbeat??!0,this.heartbeatCallback=e.heartbeatCallback??(()=>{}),this.rejoinAfterMs=s=>e.rejoinAfterMs?e.rejoinAfterMs(s):[1e3,2e3,5e3][s-1]||1e4,this.reconnectAfterMs=s=>e.reconnectAfterMs?e.reconnectAfterMs(s):[10,50,100,150,200,250,500,1e3,2e3][s-1]||5e3,this.logger=e.logger||null,!this.logger&&e.debug&&(this.logger=(s,i,o)=>{console.log(`${s}: ${i}`,o)}),this.longpollerTimeout=e.longpollerTimeout||2e4,this.params=Cr(e.params||{}),this.endPoint=`${t}/${Fi.websocket}`,this.vsn=e.vsn||kd,this.heartbeatTimeoutTimer=null,this.heartbeatTimer=null,this.heartbeatSentAt=null,this.pendingHeartbeatRef=null,this.reconnectTimer=new Fl(()=>{if(this.pageHidden){this.log("Not reconnecting as page is hidden!"),this.teardown();return}this.teardown(async()=>{e.beforeReconnect&&await e.beforeReconnect(),this.connect()})},this.reconnectAfterMs),this.authToken=e.authToken&&Cr(e.authToken)}getLongPollTransport(){return Sr}replaceTransport(t){this.connectClock++,this.closeWasClean=!0,clearTimeout(this.fallbackTimer),this.reconnectTimer.reset(),this.conn&&(this.conn.close(),this.conn=null),this.transport=t}protocol(){return location.protocol.match(/^https/)?"wss":"ws"}endPointURL(){let t=Es.appendParams(Es.appendParams(this.endPoint,this.params()),{vsn:this.vsn});return t.charAt(0)!=="/"?t:t.charAt(1)==="/"?`${this.protocol()}:${t}`:`${this.protocol()}://${location.host}${t}`}disconnect(t,e,r){this.connectClock++,this.disconnecting=!0,this.closeWasClean=!0,clearTimeout(this.fallbackTimer),this.reconnectTimer.reset(),this.teardown(()=>{this.disconnecting=!1,t&&t()},e,r)}connect(t){t&&(console&&console.log("passing params to connect is deprecated. Instead pass :params to the Socket constructor"),this.params=Cr(t)),!(this.conn&&!this.disconnecting)&&(this.longPollFallbackMs&&this.transport!==Sr?this.connectWithFallback(Sr,this.longPollFallbackMs):this.transportConnect())}log(t,e,r){this.logger&&this.logger(t,e,r)}hasLogger(){return this.logger!==null}onOpen(t){let e=this.makeRef();return this.stateChangeCallbacks.open.push([e,t]),e}onClose(t){let e=this.makeRef();return this.stateChangeCallbacks.close.push([e,t]),e}onError(t){let e=this.makeRef();return this.stateChangeCallbacks.error.push([e,t]),e}onMessage(t){let e=this.makeRef();return this.stateChangeCallbacks.message.push([e,t]),e}onHeartbeat(t){this.heartbeatCallback=t}ping(t){if(!this.isConnected())return!1;let e=this.makeRef(),r=Date.now();this.push({topic:"phoenix",event:"heartbeat",payload:{},ref:e});let n=this.onMessage(s=>{s.ref===e&&(this.off([n]),t(Date.now()-r))});return!0}transportName(t){return t===Sr?"LongPoll":t.name}transportConnect(){this.connectClock++,this.closeWasClean=!1;let t;this.authToken&&(t=["phoenix",`${Wi}${btoa(this.authToken()).replace(/=/g,"")}`]),this.conn=new this.transport(this.endPointURL(),t),this.conn.binaryType=this.binaryType,this.conn.timeout=this.longpollerTimeout,this.conn.onopen=()=>this.onConnOpen(),this.conn.onerror=e=>this.onConnError(e),this.conn.onmessage=e=>this.onConnMessage(e),this.conn.onclose=e=>this.onConnClose(e)}getSession(t){return this.sessionStore&&this.sessionStore.getItem(t)}storeSession(t,e){this.sessionStore&&this.sessionStore.setItem(t,e)}connectWithFallback(t,e=2500){clearTimeout(this.fallbackTimer);let r=!1,n=!0,s,i,o=this.transportName(t),a=l=>{this.log("transport",`falling back to ${o}...`,l),this.off([s,i]),n=!1,this.replaceTransport(t),this.transportConnect()};if(this.getSession(`phx:fallback:${o}`))return a("memorized");this.fallbackTimer=setTimeout(a,e),i=this.onError(l=>{this.log("transport","error",l),n&&!r&&(clearTimeout(this.fallbackTimer),a(l))}),this.fallbackRef&&this.off([this.fallbackRef]),this.fallbackRef=this.onOpen(()=>{if(r=!0,!n){let l=this.transportName(t);return this.primaryPassedHealthCheck||this.storeSession(`phx:fallback:${l}`,"true"),this.log("transport",`established ${l} fallback`)}clearTimeout(this.fallbackTimer),this.fallbackTimer=setTimeout(a,e),this.ping(l=>{this.log("transport","connected to primary after",l),this.primaryPassedHealthCheck=!0,clearTimeout(this.fallbackTimer)})}),this.transportConnect()}clearHeartbeats(){clearTimeout(this.heartbeatTimer),clearTimeout(this.heartbeatTimeoutTimer)}onConnOpen(){this.hasLogger()&&this.log("transport",`connected to ${this.endPointURL()}`),this.closeWasClean=!1,this.disconnecting=!1,this.establishedConnections++,this.flushSendBuffer(),this.reconnectTimer.reset(),this.autoSendHeartbeat&&this.resetHeartbeat(),this.triggerStateCallbacks("open")}heartbeatTimeout(){if(this.pendingHeartbeatRef){this.pendingHeartbeatRef=null,this.heartbeatSentAt=null,this.hasLogger()&&this.log("transport","heartbeat timeout. Attempting to re-establish connection");try{this.heartbeatCallback("timeout")}catch(t){this.log("error","error in heartbeat callback",t)}this.triggerChanError(new Error("heartbeat timeout")),this.closeWasClean=!1,this.teardown(()=>this.reconnectTimer.scheduleTimeout(),Td,"heartbeat timeout")}}resetHeartbeat(){this.conn&&this.conn.skipHeartbeat||(this.pendingHeartbeatRef=null,this.clearHeartbeats(),this.heartbeatTimer=setTimeout(()=>this.sendHeartbeat(),this.heartbeatIntervalMs))}teardown(t,e,r){if(!this.conn)return t&&t();const n=this.conn;this.waitForBufferDone(n,()=>{e?n.close(e,r||""):n.close(),this.waitForSocketClosed(n,()=>{this.conn===n&&(this.conn.onopen=function(){},this.conn.onerror=function(){},this.conn.onmessage=function(){},this.conn.onclose=function(){},this.conn=null),t&&t()})})}waitForBufferDone(t,e,r=1){if(r===5||!t.bufferedAmount){e();return}setTimeout(()=>{this.waitForBufferDone(t,e,r+1)},150*r)}waitForSocketClosed(t,e,r=1){if(r===5||t.readyState===ht.closed){e();return}setTimeout(()=>{this.waitForSocketClosed(t,e,r+1)},150*r)}onConnClose(t){this.conn&&(this.conn.onclose=()=>{}),this.hasLogger()&&this.log("transport","close",t),this.triggerChanError(t),this.clearHeartbeats(),this.closeWasClean||this.reconnectTimer.scheduleTimeout(),this.triggerStateCallbacks("close",t)}onConnError(t){this.hasLogger()&&this.log("transport","error",t);let e=this.transport,r=this.establishedConnections;this.triggerStateCallbacks("error",t,e,r),(e===this.transport||r>0)&&this.triggerChanError(t)}triggerChanError(t){this.channels.forEach(e=>{e.isErrored()||e.isLeaving()||e.isClosed()||e.trigger(St.error,t)})}connectionState(){switch(this.conn&&this.conn.readyState){case ht.connecting:return"connecting";case ht.open:return"open";case ht.closing:return"closing";default:return"closed"}}isConnected(){return this.connectionState()==="open"}remove(t){this.off(t.stateChangeRefs),this.channels=this.channels.filter(e=>e!==t)}off(t){for(let e in this.stateChangeCallbacks)this.stateChangeCallbacks[e]=this.stateChangeCallbacks[e].filter(([r])=>t.indexOf(r)===-1)}channel(t,e={}){let r=new Rd(t,e,this);return this.channels.push(r),r}push(t){if(this.hasLogger()){let{topic:e,event:r,payload:n,ref:s,join_ref:i}=t;this.log("push",`${e} ${r} (${i}, ${s})`,n)}this.isConnected()?this.encode(t,e=>this.conn.send(e)):this.sendBuffer.push(()=>this.encode(t,e=>this.conn.send(e)))}makeRef(){let t=this.ref+1;return t===this.ref?this.ref=0:this.ref=t,this.ref.toString()}sendHeartbeat(){if(!this.isConnected()){try{this.heartbeatCallback("disconnected")}catch(t){this.log("error","error in heartbeat callback",t)}return}if(this.pendingHeartbeatRef){this.heartbeatTimeout();return}this.pendingHeartbeatRef=this.makeRef(),this.heartbeatSentAt=Date.now(),this.push({topic:"phoenix",event:"heartbeat",payload:{},ref:this.pendingHeartbeatRef});try{this.heartbeatCallback("sent")}catch(t){this.log("error","error in heartbeat callback",t)}this.heartbeatTimeoutTimer=setTimeout(()=>this.heartbeatTimeout(),this.heartbeatIntervalMs)}flushSendBuffer(){this.isConnected()&&this.sendBuffer.length>0&&(this.sendBuffer.forEach(t=>t()),this.sendBuffer=[])}onConnMessage(t){this.decode(t.data,e=>{let{topic:r,event:n,payload:s,ref:i,join_ref:o}=e;if(i&&i===this.pendingHeartbeatRef){const a=this.heartbeatSentAt?Date.now()-this.heartbeatSentAt:void 0;this.clearHeartbeats();try{this.heartbeatCallback(s.status==="ok"?"ok":"error",a)}catch(l){this.log("error","error in heartbeat callback",l)}this.pendingHeartbeatRef=null,this.heartbeatSentAt=null,this.autoSendHeartbeat&&(this.heartbeatTimer=setTimeout(()=>this.sendHeartbeat(),this.heartbeatIntervalMs))}this.hasLogger()&&this.log("receive",`${s.status||""} ${r} ${n} ${i&&"("+i+")"||""}`.trim(),s);for(let a=0;a<this.channels.length;a++){const l=this.channels[a];l.isMember(r,n,s,o)&&l.trigger(n,s,i,o)}this.triggerStateCallbacks("message",e)})}triggerStateCallbacks(t,...e){try{this.stateChangeCallbacks[t].forEach(([r,n])=>{try{n(...e)}catch(s){this.log("error",`error in ${t} callback`,s)}})}catch(r){this.log("error",`error triggering ${t} callbacks`,r)}}leaveOpenTopic(t){let e=this.channels.find(r=>r.topic===t&&(r.isJoined()||r.isJoining()));e&&(this.hasLogger()&&this.log("transport",`leaving duplicate topic "${t}"`),e.leave())}};class dn{constructor(e,r){const n=Id(r);this.presence=new xd(e.getChannel(),n),this.presence.onJoin((s,i,o)=>{const a=dn.onJoinPayload(s,i,o);e.getChannel().trigger("presence",a)}),this.presence.onLeave((s,i,o)=>{const a=dn.onLeavePayload(s,i,o);e.getChannel().trigger("presence",a)}),this.presence.onSync(()=>{e.getChannel().trigger("presence",{event:"sync"})})}get state(){return dn.transformState(this.presence.state)}static transformState(e){return e=Cd(e),Object.getOwnPropertyNames(e).reduce((r,n)=>{const s=e[n];return r[n]=ds(s),r},{})}static onJoinPayload(e,r,n){const s=ha(r),i=ds(n);return{event:"join",key:e,currentPresences:s,newPresences:i}}static onLeavePayload(e,r,n){const s=ha(r),i=ds(n);return{event:"leave",key:e,currentPresences:s,leftPresences:i}}}function ds(t){return t.metas.map(e=>{const r=Object.getOwnPropertyDescriptors(e),n=Object.defineProperties({},r);return n.presence_ref=n.phx_ref,delete n.phx_ref,delete n.phx_ref_prev,n})}function Cd(t){return JSON.parse(JSON.stringify(t))}function Id(t){return t?.events&&{events:t.events}}function ha(t){return t?.metas?ds(t):[]}var fa;(function(t){t.SYNC="sync",t.JOIN="join",t.LEAVE="leave"})(fa||(fa={}));class Ld{get state(){return this.presenceAdapter.state}constructor(e,r){this.channel=e,this.presenceAdapter=new dn(this.channel.channelAdapter,r)}}function Dd(t){if(t instanceof Error)return t;if(typeof t=="string")return new Error(t);if(t&&typeof t=="object"){const e=t;if(typeof e.code=="number"){const r=typeof e.reason=="string"&&e.reason?` (${e.reason})`:"";return new Error(`socket closed: ${e.code}${r}`,{cause:t})}return new Error("channel error: transport failure",{cause:t})}return new Error("channel error: connection lost")}class Ud{constructor(e,r,n){const s=jd(n);this.channel=e.getSocket().channel(r,s),this.socket=e}get state(){return this.channel.state}set state(e){this.channel.state=e}get joinedOnce(){return this.channel.joinedOnce}get joinPush(){return this.channel.joinPush}get rejoinTimer(){return this.channel.rejoinTimer}on(e,r){return this.channel.on(e,r)}off(e,r){this.channel.off(e,r)}subscribe(e){return this.channel.join(e)}unsubscribe(e){return this.channel.leave(e)}teardown(){this.channel.teardown()}onClose(e){this.channel.onClose(e)}onError(e){return this.channel.onError(e)}push(e,r,n){let s;try{s=this.channel.push(e,r,n)}catch{throw new Error(`tried to push '${e}' to '${this.channel.topic}' before joining. Use channel.subscribe() before pushing events`)}if(this.channel.pushBuffer.length>pd){const i=this.channel.pushBuffer.shift();i.cancelTimeout(),this.socket.log("channel",`discarded push due to buffer overflow: ${i.event}`,i.payload())}return s}updateJoinPayload(e){const r=this.channel.joinPush.payload();this.channel.joinPush.payload=()=>Object.assign(Object.assign({},r),e)}canPush(){return this.socket.isConnected()&&this.state===Ut.joined}isJoined(){return this.state===Ut.joined}isJoining(){return this.state===Ut.joining}isClosed(){return this.state===Ut.closed}isLeaving(){return this.state===Ut.leaving}updateFilterBindings(e){this.channel.filterBindings=e}updatePayloadTransform(e){this.channel.onMessage=e}getChannel(){return this.channel}}function jd(t){return{config:Object.assign({broadcast:{ack:!1,self:!1},presence:{key:"",enabled:!1},private:!1},t.config)}}const Nd=/[,()"\\]/,qd=t=>Nd.test(t)||t!==t.trim(),Bd=t=>`"${t.replace(/\\/g,"\\\\").replace(/"/g,'\\"')}"`,pa=t=>{const e=t===null?"null":String(t);return qd(e)?Bd(e):e},Md=t=>t===null?"null":String(t),Fd=(t,e)=>{if(t==="in"){const r=Array.isArray(e)?e:[e];if(r.length===0)throw new Error("Realtime `in` filter requires at least one value.");return`in.(${Array.from(new Set(r)).map(s=>pa(s)).join(",")})`}return t==="is"?`is.${Md(e)}`:`${t}.${pa(e)}`};class Wd{constructor(){this.filters=[]}add(e,r,n,s=!1){const i=s?"not.":"";return this.filters.push(`${e}=${i}${Fd(r,n)}`),this}eq(e,r){return this.add(e,"eq",r)}neq(e,r){return this.add(e,"neq",r)}gt(e,r){return this.add(e,"gt",r)}gte(e,r){return this.add(e,"gte",r)}lt(e,r){return this.add(e,"lt",r)}lte(e,r){return this.add(e,"lte",r)}in(e,r){return this.add(e,"in",r)}like(e,r){return this.add(e,"like",r)}ilike(e,r){return this.add(e,"ilike",r)}match(e,r){return this.add(e,"match",r)}imatch(e,r){return this.add(e,"imatch",r)}is(e,r){return this.add(e,"is",r)}isDistinct(e,r){return this.add(e,"isdistinct",r)}not(e,r,n){return this.add(e,r,n,!0)}build(){return this.filters.join(",")}toString(){return this.build()}}var ma;(function(t){t.ALL="*",t.INSERT="INSERT",t.UPDATE="UPDATE",t.DELETE="DELETE"})(ma||(ma={}));var Zt;(function(t){t.BROADCAST="broadcast",t.PRESENCE="presence",t.POSTGRES_CHANGES="postgres_changes",t.SYSTEM="system"})(Zt||(Zt={}));var kt;(function(t){t.SUBSCRIBED="SUBSCRIBED",t.TIMED_OUT="TIMED_OUT",t.CLOSED="CLOSED",t.CHANNEL_ERROR="CHANNEL_ERROR"})(kt||(kt={}));class Et{get state(){return this.channelAdapter.state}set state(e){this.channelAdapter.state=e}get joinedOnce(){return this.channelAdapter.joinedOnce}get timeout(){return this.socket.timeout}get joinPush(){return this.channelAdapter.joinPush}get rejoinTimer(){return this.channelAdapter.rejoinTimer}constructor(e,r={config:{}},n){var s,i;if(this.topic=e,this.params=r,this.socket=n,this.bindings={},this.subTopic=e.replace(/^realtime:/i,""),this.params.config=Object.assign({broadcast:{ack:!1,self:!1},presence:{key:"",enabled:!1},private:!1},r.config),this.channelAdapter=new Ud(this.socket.socketAdapter,e,this.params),this.presence=new Ld(this),this._onClose(()=>{this.socket._remove(this)}),this._updateFilterTransform(),this.broadcastEndpointURL=Ml(this.socket.socketAdapter.endPointURL()),this.private=this.params.config.private||!1,!this.private&&(!((i=(s=this.params.config)===null||s===void 0?void 0:s.broadcast)===null||i===void 0)&&i.replay))throw new Error(`tried to use replay on public channel '${this.topic}'. It must be a private channel.`)}subscribe(e,r=this.timeout){var n,s,i,o;if(this.socket.isConnected()||this.socket.connect(),this.channelAdapter.isClosed()){const{config:{broadcast:a,presence:l,private:c,postgres_changes_options:u}}=this.params,d=(s=(n=this.bindings.postgres_changes)===null||n===void 0?void 0:n.map(_=>_.filter))!==null&&s!==void 0?s:[],f=!!this.bindings[Zt.PRESENCE]&&this.bindings[Zt.PRESENCE].length>0||((i=this.params.config.presence)===null||i===void 0?void 0:i.enabled)===!0,h={},y=Object.assign({broadcast:a,presence:Object.assign(Object.assign({},l),{enabled:f}),postgres_changes:d,private:c},u?{postgres_changes_options:u}:{});this.socket.accessTokenValue&&(h.access_token=this.socket.accessTokenValue),this._onError(_=>{e?.(kt.CHANNEL_ERROR,Dd(_))}),this._onClose(()=>e?.(kt.CLOSED)),this.updateJoinPayload(Object.assign({config:y},h)),this._updateFilterMessage();const v=u?.wait&&d.length>0?Math.max(r,((o=u.timeout)!==null&&o!==void 0?o:hd)+fd):r;this.channelAdapter.subscribe(v).receive("ok",async({postgres_changes:_})=>{if(this.socket._isManualToken()||this.socket.setAuth(),_===void 0){e?.(kt.SUBSCRIBED);return}this._updatePostgresBindings(_,e)}).receive("error",_=>{this.state=Ut.errored;const R=Object.values(_).join(", ")||"error";e?.(kt.CHANNEL_ERROR,new Error(R,{cause:_}))}).receive("timeout",()=>{e?.(kt.TIMED_OUT)})}return this}_updatePostgresBindings(e,r){var n;const s=this.bindings.postgres_changes,i=(n=s?.length)!==null&&n!==void 0?n:0,o=[];for(let a=0;a<i;a++){const l=s[a],{filter:{event:c,schema:u,table:d,filter:f}}=l,h=e&&e[a];if(h&&h.event===c&&Et.isFilterValueEqual(h.schema,u)&&Et.isFilterValueEqual(h.table,d)&&Et.isFilterValueEqual(h.filter,f))o.push(Object.assign(Object.assign({},l),{id:h.id}));else{this.unsubscribe(),this.state=Ut.errored,r?.(kt.CHANNEL_ERROR,new Error("mismatch between server and client bindings for postgres changes"));return}}this.bindings.postgres_changes=o,this.state!=Ut.errored&&r&&r(kt.SUBSCRIBED)}presenceState(){return this.presence.state}async track(e,r={}){return await this.send({type:"presence",event:"track",payload:e},r)}async untrack(e={}){return await this.send({type:"presence",event:"untrack"},e)}on(e,r,n){const s=this.channelAdapter.isJoined()||this.channelAdapter.isJoining(),i=e===Zt.PRESENCE||e===Zt.POSTGRES_CHANGES;if(s&&i)throw this.socket.log("channel",`cannot add \`${e}\` callbacks for ${this.topic} after \`subscribe()\`.`),new Error(`cannot add \`${e}\` callbacks for ${this.topic} after \`subscribe()\`.`);return this._on(e,r,n)}async httpSend(e,r,n={}){var s;if(r==null)return Promise.reject(new Error("Payload is required for httpSend()"));const i=r instanceof ArrayBuffer||ArrayBuffer.isView(r),o={apikey:this.socket.apiKey?this.socket.apiKey:"","Content-Type":i?"application/octet-stream":"application/json"};this.socket.accessTokenValue&&(o.Authorization=`Bearer ${this.socket.accessTokenValue}`);const a=new URL(this.broadcastEndpointURL);a.pathname+=`/${encodeURIComponent(this.subTopic)}/events/${encodeURIComponent(e)}`,this.private&&a.searchParams.set("private","true");const l={method:"POST",headers:o,body:i?r:JSON.stringify(r)},c=await this._fetchWithTimeout(a.toString(),l,(s=n.timeout)!==null&&s!==void 0?s:this.timeout);if(c.status===202)return{success:!0};if(c.status===404)return Promise.reject(new Error("httpSend() requires Realtime server v2.97.0 or newer; the endpoint returned 404. Update your Supabase CLI to a recent version, or upgrade the Realtime server in your self-hosted setup. See https://github.com/supabase/supabase-js/blob/master/packages/core/realtime-js/migrations/httpsend-server-version.md"));let u=c.statusText;try{const d=await c.json();u=d.error||d.message||u}catch{}return Promise.reject(new Error(u))}async send(e,r={}){var n,s;if(!this.channelAdapter.canPush()&&e.type==="broadcast"){const i="Realtime send() is automatically falling back to REST API. This behavior will be deprecated in the future. Please use httpSend() explicitly for REST delivery.";this.socket.hasLogger()?this.socket.log("channel",i):console.warn(i);const{event:o,payload:a}=e,l={apikey:this.socket.apiKey?this.socket.apiKey:"","Content-Type":"application/json"};this.socket.accessTokenValue&&(l.Authorization=`Bearer ${this.socket.accessTokenValue}`);const c={method:"POST",headers:l,body:JSON.stringify({messages:[{topic:this.subTopic,event:o,payload:a,private:this.private}]})};try{const u=await this._fetchWithTimeout(this.broadcastEndpointURL,c,(n=r.timeout)!==null&&n!==void 0?n:this.timeout);return await((s=u.body)===null||s===void 0?void 0:s.cancel()),u.ok?"ok":"error"}catch(u){return u instanceof Error&&u.name==="AbortError"?"timed out":"error"}}else return new Promise(i=>{var o,a,l;const c=this.channelAdapter.push(e.type,e,r.timeout||this.timeout);e.type==="broadcast"&&!(!((l=(a=(o=this.params)===null||o===void 0?void 0:o.config)===null||a===void 0?void 0:a.broadcast)===null||l===void 0)&&l.ack)&&i("ok"),c.receive("ok",()=>i("ok")),c.receive("error",()=>i("error")),c.receive("timeout",()=>i("timed out"))})}updateJoinPayload(e){this.channelAdapter.updateJoinPayload(e)}async unsubscribe(e=this.timeout){return new Promise(r=>{this.channelAdapter.unsubscribe(e).receive("ok",()=>r("ok")).receive("timeout",()=>r("timed out")).receive("error",()=>r("error"))})}teardown(){this.channelAdapter.teardown()}async _fetchWithTimeout(e,r,n){const s=new AbortController,i=setTimeout(()=>s.abort(),n),o=await this.socket.fetch(e,Object.assign(Object.assign({},r),{signal:s.signal}));return clearTimeout(i),o}_on(e,r,n){var s;const i=e.toLocaleLowerCase(),o=r?.filter;if((o instanceof Wd||typeof o=="object"&&o!==null&&typeof o.build=="function")&&(r=Object.assign(Object.assign({},r),{filter:o.build()})),i===Zt.POSTGRES_CHANGES&&((s=this.bindings[i])===null||s===void 0?void 0:s.find(u=>Et.isSamePostgresFilter(u.filter,r))))return this.socket.log("error",`duplicate \`postgres_changes\` binding for ${this.topic} ignored`,r),this;const a=this.channelAdapter.on(e,n),l={type:i,filter:r,callback:n,ref:a};return this.bindings[i]?this.bindings[i].push(l):this.bindings[i]=[l],this._updateFilterMessage(),this}_onClose(e){this.channelAdapter.onClose(e)}_onError(e){this.channelAdapter.onError(e)}_updateFilterMessage(){this.channelAdapter.updateFilterBindings((e,r,n)=>{var s,i,o,a,l,c,u;const d=e.event.toLocaleLowerCase();if(this._notThisChannelEvent(d,n))return!1;const f=(s=this.bindings[d])===null||s===void 0?void 0:s.find(h=>h.ref===e.ref);if(!f)return!0;if(["broadcast","presence","postgres_changes"].includes(d))if("id"in f){const h=f.id,y=(i=f.filter)===null||i===void 0?void 0:i.event;return h&&((o=r.ids)===null||o===void 0?void 0:o.includes(h))&&(y==="*"||y?.toLocaleLowerCase()===((a=r.data)===null||a===void 0?void 0:a.type.toLocaleLowerCase()))}else{const h=(c=(l=f?.filter)===null||l===void 0?void 0:l.event)===null||c===void 0?void 0:c.toLocaleLowerCase();return h==="*"||h===((u=r?.event)===null||u===void 0?void 0:u.toLocaleLowerCase())}else return f.type.toLocaleLowerCase()===d})}_notThisChannelEvent(e,r){const{close:n,error:s,leave:i,join:o}=ql;return r&&[n,s,i,o].includes(e)&&r!==this.joinPush.ref}_updateFilterTransform(){this.channelAdapter.updatePayloadTransform((e,r,n)=>{if(typeof r=="object"&&"ids"in r){const s=r.data,{schema:i,table:o,commit_timestamp:a,type:l,errors:c}=s;return Object.assign(Object.assign({},{schema:i,table:o,commit_timestamp:a,eventType:l,new:{},old:{},errors:c}),this._getPayloadRecords(s))}return r})}copyBindings(e){if(this.joinedOnce)throw new Error("cannot copy bindings into joined channel");for(const r in e.bindings)for(const n of e.bindings[r])this._on(n.type,n.filter,n.callback)}static isFilterValueEqual(e,r){return(e??void 0)===(r??void 0)}static isSamePostgresFilter(e,r){var n,s,i,o;const a=(s=(n=e?.select)===null||n===void 0?void 0:n.join())!==null&&s!==void 0?s:void 0,l=(o=(i=r?.select)===null||i===void 0?void 0:i.join())!==null&&o!==void 0?o:void 0;return e?.event===r?.event&&Et.isFilterValueEqual(e?.schema,r?.schema)&&Et.isFilterValueEqual(e?.table,r?.table)&&Et.isFilterValueEqual(e?.filter,r?.filter)&&a===l}_getPayloadRecords(e){const r={new:{},old:{}};return(e.type==="INSERT"||e.type==="UPDATE")&&(r.new=da(e.columns,e.record)),(e.type==="UPDATE"||e.type==="DELETE")&&(r.old=da(e.columns,e.old_record)),r}}class Hd{constructor(e,r){this.socket=new Pd(e,r)}get timeout(){return this.socket.timeout}get endPoint(){return this.socket.endPoint}get transport(){return this.socket.transport}get heartbeatIntervalMs(){return this.socket.heartbeatIntervalMs}get heartbeatCallback(){return this.socket.heartbeatCallback}set heartbeatCallback(e){this.socket.heartbeatCallback=e}get heartbeatTimer(){return this.socket.heartbeatTimer}get pendingHeartbeatRef(){return this.socket.pendingHeartbeatRef}get reconnectTimer(){return this.socket.reconnectTimer}get vsn(){return this.socket.vsn}get encode(){return this.socket.encode}get decode(){return this.socket.decode}get reconnectAfterMs(){return this.socket.reconnectAfterMs}get sendBuffer(){return this.socket.sendBuffer}get stateChangeCallbacks(){return this.socket.stateChangeCallbacks}connect(){this.socket.connect()}disconnect(e,r,n,s=1e4){return new Promise(i=>{setTimeout(()=>i("timeout"),s),this.socket.disconnect(()=>{e(),i("ok")},r,n)})}push(e){this.socket.push(e)}log(e,r,n){this.socket.log(e,r,n)}hasLogger(){return this.socket.hasLogger()}makeRef(){return this.socket.makeRef()}onOpen(e){this.socket.onOpen(e)}onClose(e){this.socket.onClose(e)}onError(e){this.socket.onError(e)}onMessage(e){this.socket.onMessage(e)}isConnected(){return this.socket.isConnected()}isConnecting(){return this.socket.connectionState()==Bi.connecting}isDisconnecting(){return this.socket.connectionState()==Bi.closing}connectionState(){return this.socket.connectionState()}endPointURL(){return this.socket.endPointURL()}sendHeartbeat(){this.socket.sendHeartbeat()}getSocket(){return this.socket}}const ga={HEARTBEAT_INTERVAL:25e3},Gd=[1e3,2e3,5e3,1e4],Vd=1e4;function zd(){const t=new Map;return{get length(){return t.size},clear(){t.clear()},getItem(e){return t.has(e)?t.get(e):null},key(e){var r;return(r=Array.from(t.keys())[e])!==null&&r!==void 0?r:null},removeItem(e){t.delete(e)},setItem(e,r){t.set(e,String(r))}}}function Kd(){try{if(typeof globalThis<"u"&&globalThis.sessionStorage)return globalThis.sessionStorage}catch{}return zd()}const Jd=`
  addEventListener("message", (e) => {
    if (e.data.event === "start") {
      setInterval(() => postMessage({ event: "keepAlive" }), e.data.interval);
    }
  });`;class Yd{get endPoint(){return this.socketAdapter.endPoint}get timeout(){return this.socketAdapter.timeout}get transport(){return this.socketAdapter.transport}get heartbeatCallback(){return this.socketAdapter.heartbeatCallback}get heartbeatIntervalMs(){return this.socketAdapter.heartbeatIntervalMs}get heartbeatTimer(){return this.worker?this._workerHeartbeatTimer:this.socketAdapter.heartbeatTimer}get pendingHeartbeatRef(){return this.worker?this._pendingWorkerHeartbeatRef:this.socketAdapter.pendingHeartbeatRef}get reconnectTimer(){return this.socketAdapter.reconnectTimer}get vsn(){return this.socketAdapter.vsn}get encode(){return this.socketAdapter.encode}get decode(){return this.socketAdapter.decode}get reconnectAfterMs(){return this.socketAdapter.reconnectAfterMs}get sendBuffer(){return this.socketAdapter.sendBuffer}get stateChangeCallbacks(){return this.socketAdapter.stateChangeCallbacks}constructor(e,r){var n;if(this.channels=new Array,this.accessTokenValue=null,this.accessToken=null,this.apiKey=null,this.httpEndpoint="",this.headers={},this.params={},this.ref=0,this.serializer=new md,this._manuallySetToken=!1,this._authPromise=null,this._authGeneration=0,this._workerHeartbeatTimer=void 0,this._pendingWorkerHeartbeatRef=null,this._pendingDisconnectTimer=null,this._disconnectOnEmptyChannelsAfterMs=0,this._resolveFetch=i=>i?(...o)=>i(...o):(...o)=>fetch(...o),!(!((n=r?.params)===null||n===void 0)&&n.apikey))throw new Error("API key is required to connect to Realtime");this.apiKey=r.params.apikey;const s=this._initializeOptions(r);this.socketAdapter=new Hd(e,s),this.httpEndpoint=Ml(e),this.fetch=this._resolveFetch(r?.fetch)}connect(){if(!(this.isConnecting()||this.isDisconnecting()||this.isConnected())){this.accessToken&&!this._authPromise&&this._setAuthSafely("connect"),this._setupConnectionHandlers();try{this.socketAdapter.connect()}catch(e){const r=e.message;throw new Error(`WebSocket not available: ${r}`)}this._handleNodeJsRaceCondition()}}endpointURL(){return this.socketAdapter.endPointURL()}async disconnect(e,r){return this._cancelPendingDisconnect(),this.isDisconnecting()?"ok":await this.socketAdapter.disconnect(()=>{clearInterval(this._workerHeartbeatTimer),this._terminateWorker()},e,r)}getChannels(){return this.channels}async removeChannel(e){const r=await e.unsubscribe();return r==="ok"&&e.teardown(),r}async removeAllChannels(){const e=this.channels.map(async n=>{const s=await n.unsubscribe();return n.teardown(),s}),r=await Promise.all(e);return await this.disconnect(),r}log(e,r,n){this.socketAdapter.log(e,r,n)}hasLogger(){return this.socketAdapter.hasLogger()}connectionState(){return this.socketAdapter.connectionState()||Bi.closed}isConnected(){return this.socketAdapter.isConnected()}isConnecting(){return this.socketAdapter.isConnecting()}isDisconnecting(){return this.socketAdapter.isDisconnecting()}channel(e,r={config:{}}){const n=`realtime:${e}`,s=this.getChannels().find(i=>i.topic===n);if(s)return s;{const i=new Et(`realtime:${e}`,r,this);return this._cancelPendingDisconnect(),this.channels.push(i),i}}push(e){this.socketAdapter.push(e)}async setAuth(e=null){const r=++this._authGeneration,n=this._performAuth(e,r);r===this._authGeneration&&(this._authPromise=n);try{await n}finally{this._authPromise===n&&(this._authPromise=null)}}_isManualToken(){return this._manuallySetToken}async sendHeartbeat(){this.socketAdapter.sendHeartbeat()}onHeartbeat(e){this.socketAdapter.heartbeatCallback=this._wrapHeartbeatCallback(e)}_makeRef(){return this.socketAdapter.makeRef()}_remove(e){this.channels=this.channels.filter(r=>r.topic!==e.topic),this.channels.length===0&&(this.log("transport","no channels remaining, scheduling disconnect"),this._schedulePendingDisconnect())}_schedulePendingDisconnect(){if(this._cancelPendingDisconnect(),this._disconnectOnEmptyChannelsAfterMs===0){this.log("transport","disconnecting immediately - no channels"),this.disconnect();return}this._pendingDisconnectTimer=setTimeout(()=>{this._pendingDisconnectTimer=null,this.channels.length===0&&(this.log("transport","deferred disconnect fired - no channels, disconnecting"),this.disconnect())},this._disconnectOnEmptyChannelsAfterMs),this.log("transport",`deferred disconnect scheduled in ${this._disconnectOnEmptyChannelsAfterMs}ms`)}_cancelPendingDisconnect(){this._pendingDisconnectTimer!==null&&(this.log("transport","pending disconnect cancelled - channel activity detected"),clearTimeout(this._pendingDisconnectTimer),this._pendingDisconnectTimer=null)}async _performAuth(e,r){let n,s=!1;if(e)n=e,s=!0;else if(this.accessToken)try{n=await this.accessToken()}catch(i){this.log("error","Error fetching access token from callback",i),n=this.accessTokenValue}else n=this.accessTokenValue;r===this._authGeneration&&(this.accessToken?this._manuallySetToken=!1:s&&(this._manuallySetToken=!0),this.accessTokenValue!=n&&(this.accessTokenValue=n,this.channels.forEach(i=>{const o={access_token:n,version:ld};i.updateJoinPayload(o),i.joinedOnce&&i.channelAdapter.isJoined()&&i.channelAdapter.push(ql.access_token,{access_token:n})})))}async _waitForAuthIfNeeded(){this._authPromise&&await this._authPromise}_setAuthSafely(e="general"){this._isManualToken()||this.setAuth().catch(r=>{this.log("error",`Error setting auth in ${e}`,r)})}_setupConnectionHandlers(){this.socketAdapter.onOpen(()=>{(this._authPromise||(this.accessToken&&!this.accessTokenValue?this.setAuth():Promise.resolve())).catch(r=>{this.log("error","error waiting for auth on connect",r)}),this.worker&&!this.workerRef&&this._startWorkerHeartbeat()}),this.socketAdapter.onClose(()=>{this.worker&&this.workerRef&&this._terminateWorker()}),this.socketAdapter.onMessage(e=>{e.ref&&e.ref===this._pendingWorkerHeartbeatRef&&(this._pendingWorkerHeartbeatRef=null)})}_handleNodeJsRaceCondition(){this.socketAdapter.isConnected()&&this.socketAdapter.getSocket().onConnOpen()}_wrapHeartbeatCallback(e){return(r,n)=>{r!=="disconnected"&&(r=="sent"&&this._setAuthSafely(),e&&e(r,n))}}_startWorkerHeartbeat(){this.workerUrl?this.log("worker",`starting worker for from ${this.workerUrl}`):this.log("worker","starting default worker");const e=this._workerObjectUrl(this.workerUrl);this.workerRef=new Worker(e),this.workerRef.onerror=r=>{this.log("worker","worker error",r.message),this._terminateWorker(),this.disconnect()},this.workerRef.onmessage=r=>{r.data.event==="keepAlive"&&this.sendHeartbeat()},this.workerRef.postMessage({event:"start",interval:this.heartbeatIntervalMs})}_terminateWorker(){this.workerRef&&(this.log("worker","terminating worker"),this.workerRef.terminate(),this.workerRef=void 0)}_workerObjectUrl(e){let r;if(e)r=e;else{const n=new Blob([Jd],{type:"application/javascript"});r=URL.createObjectURL(n)}return r}_initializeOptions(e){var r,n,s,i,o,a,l,c,u,d,f,h;this.worker=(r=e?.worker)!==null&&r!==void 0?r:!1,this.accessToken=(n=e?.accessToken)!==null&&n!==void 0?n:null;const y={};y.timeout=(s=e?.timeout)!==null&&s!==void 0?s:dd,y.heartbeatIntervalMs=(i=e?.heartbeatIntervalMs)!==null&&i!==void 0?i:ga.HEARTBEAT_INTERVAL,this._disconnectOnEmptyChannelsAfterMs=(o=e?.disconnectOnEmptyChannelsAfterMs)!==null&&o!==void 0?o:2*((a=e?.heartbeatIntervalMs)!==null&&a!==void 0?a:ga.HEARTBEAT_INTERVAL),y.transport=(l=e?.transport)!==null&&l!==void 0?l:od.getWebSocketConstructor(),y.params=e?.params,y.logger=e?.logger,y.heartbeatCallback=this._wrapHeartbeatCallback(e?.heartbeatCallback),y.sessionStorage=(c=e?.sessionStorage)!==null&&c!==void 0?c:Kd(),y.reconnectAfterMs=(u=e?.reconnectAfterMs)!==null&&u!==void 0?u:(g=>Gd[g-1]||Vd);let v,_;const R=(d=e?.vsn)!==null&&d!==void 0?d:ud;switch(R){case cd:v=(g,m)=>m(JSON.stringify(g)),_=(g,m)=>m(JSON.parse(g));break;case Nl:v=this.serializer.encode.bind(this.serializer),_=this.serializer.decode.bind(this.serializer);break;default:throw new Error(`Unsupported serializer version: ${y.vsn}`)}if(y.vsn=R,y.encode=(f=e?.encode)!==null&&f!==void 0?f:v,y.decode=(h=e?.decode)!==null&&h!==void 0?h:_,y.beforeReconnect=this._reconnectAuth.bind(this),(e?.logLevel||e?.log_level)&&(this.logLevel=e.logLevel||e.log_level,y.params=Object.assign(Object.assign({},y.params),{log_level:this.logLevel})),this.worker){if(typeof window<"u"&&!window.Worker)throw new Error("Web Worker is not supported");this.workerUrl=e?.workerUrl,y.autoSendHeartbeat=!this.worker}return y}async _reconnectAuth(){await this._waitForAuthIfNeeded(),this.isConnected()||this.connect()}}var mn=class extends Error{constructor(t,e){super(t),this.name="IcebergError",this.status=e.status,this.icebergType=e.icebergType,this.icebergCode=e.icebergCode,this.details=e.details,this.isCommitStateUnknown=e.icebergType==="CommitStateUnknownException"||[500,502,504].includes(e.status)&&e.icebergType?.includes("CommitState")===!0}isNotFound(){return this.status===404}isConflict(){return this.status===409}isAuthenticationTimeout(){return this.status===419}};function Xd(t,e,r){const n=new URL(e,t);if(r)for(const[s,i]of Object.entries(r))i!==void 0&&n.searchParams.set(s,i);return n.toString()}async function Qd(t){return!t||t.type==="none"?{}:t.type==="bearer"?{Authorization:`Bearer ${t.token}`}:t.type==="header"?{[t.name]:t.value}:t.type==="custom"?await t.getHeaders():{}}function Zd(t){const e=t.fetchImpl??globalThis.fetch;return{async request({method:r,path:n,query:s,body:i,headers:o}){const a=Xd(t.baseUrl,n,s),l=await Qd(t.auth),c=await e(a,{method:r,headers:{...i?{"Content-Type":"application/json"}:{},...l,...o},body:i?JSON.stringify(i):void 0}),u=await c.text(),d=(c.headers.get("content-type")||"").includes("application/json"),f=d&&u?JSON.parse(u):u;if(!c.ok){const h=d?f:void 0,y=h?.error;throw new mn(y?.message??`Request failed with status ${c.status}`,{status:c.status,icebergType:y?.type,icebergCode:y?.code,details:h})}return{status:c.status,headers:c.headers,data:f}}}}function es(t){return t.join("")}var eh=class{constructor(t,e=""){this.client=t,this.prefix=e}async listNamespaces(t){const e=t?{parent:es(t.namespace)}:void 0;return(await this.client.request({method:"GET",path:`${this.prefix}/namespaces`,query:e})).data.namespaces.map(n=>({namespace:n}))}async createNamespace(t,e){const r={namespace:t.namespace,properties:e?.properties};return(await this.client.request({method:"POST",path:`${this.prefix}/namespaces`,body:r})).data}async dropNamespace(t){await this.client.request({method:"DELETE",path:`${this.prefix}/namespaces/${es(t.namespace)}`})}async loadNamespaceMetadata(t){return{properties:(await this.client.request({method:"GET",path:`${this.prefix}/namespaces/${es(t.namespace)}`})).data.properties}}async namespaceExists(t){try{return await this.client.request({method:"HEAD",path:`${this.prefix}/namespaces/${es(t.namespace)}`}),!0}catch(e){if(e instanceof mn&&e.status===404)return!1;throw e}}async createNamespaceIfNotExists(t,e){try{return await this.createNamespace(t,e)}catch(r){if(r instanceof mn&&r.status===409)return;throw r}}};function kr(t){return t.join("")}var th=class{constructor(t,e="",r){this.client=t,this.prefix=e,this.accessDelegation=r}async listTables(t){return(await this.client.request({method:"GET",path:`${this.prefix}/namespaces/${kr(t.namespace)}/tables`})).data.identifiers}async createTable(t,e){const r={};return this.accessDelegation&&(r["X-Iceberg-Access-Delegation"]=this.accessDelegation),(await this.client.request({method:"POST",path:`${this.prefix}/namespaces/${kr(t.namespace)}/tables`,body:e,headers:r})).data.metadata}async updateTable(t,e){const r=await this.client.request({method:"POST",path:`${this.prefix}/namespaces/${kr(t.namespace)}/tables/${t.name}`,body:e});return{"metadata-location":r.data["metadata-location"],metadata:r.data.metadata}}async dropTable(t,e){await this.client.request({method:"DELETE",path:`${this.prefix}/namespaces/${kr(t.namespace)}/tables/${t.name}`,query:{purgeRequested:String(e?.purge??!1)}})}async loadTable(t){const e={};return this.accessDelegation&&(e["X-Iceberg-Access-Delegation"]=this.accessDelegation),(await this.client.request({method:"GET",path:`${this.prefix}/namespaces/${kr(t.namespace)}/tables/${t.name}`,headers:e})).data.metadata}async tableExists(t){const e={};this.accessDelegation&&(e["X-Iceberg-Access-Delegation"]=this.accessDelegation);try{return await this.client.request({method:"HEAD",path:`${this.prefix}/namespaces/${kr(t.namespace)}/tables/${t.name}`,headers:e}),!0}catch(r){if(r instanceof mn&&r.status===404)return!1;throw r}}async createTableIfNotExists(t,e){try{return await this.createTable(t,e)}catch(r){if(r instanceof mn&&r.status===409)return await this.loadTable({namespace:t.namespace,name:e.name});throw r}}},rh=class{constructor(t){let e="v1";t.catalogName&&(e+=`/${t.catalogName}`);const r=t.baseUrl.endsWith("/")?t.baseUrl:`${t.baseUrl}/`;this.client=Zd({baseUrl:r,auth:t.auth,fetchImpl:t.fetch}),this.accessDelegation=t.accessDelegation?.join(","),this.namespaceOps=new eh(this.client,e),this.tableOps=new th(this.client,e,this.accessDelegation)}async listNamespaces(t){return this.namespaceOps.listNamespaces(t)}async createNamespace(t,e){return this.namespaceOps.createNamespace(t,e)}async dropNamespace(t){await this.namespaceOps.dropNamespace(t)}async loadNamespaceMetadata(t){return this.namespaceOps.loadNamespaceMetadata(t)}async listTables(t){return this.tableOps.listTables(t)}async createTable(t,e){return this.tableOps.createTable(t,e)}async updateTable(t,e){return this.tableOps.updateTable(t,e)}async dropTable(t,e){await this.tableOps.dropTable(t,e)}async loadTable(t){return this.tableOps.loadTable(t)}async namespaceExists(t){return this.namespaceOps.namespaceExists(t)}async tableExists(t){return this.tableOps.tableExists(t)}async createNamespaceIfNotExists(t,e){return this.namespaceOps.createNamespaceIfNotExists(t,e)}async createTableIfNotExists(t,e){return this.tableOps.createTableIfNotExists(t,e)}};function gn(t){"@babel/helpers - typeof";return gn=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},gn(t)}function nh(t,e){if(gn(t)!="object"||!t)return t;var r=t[Symbol.toPrimitive];if(r!==void 0){var n=r.call(t,e);if(gn(n)!="object")return n;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(t)}function sh(t){var e=nh(t,"string");return gn(e)=="symbol"?e:e+""}function ih(t,e,r){return(e=sh(e))in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}function ya(t,e){var r=Object.keys(t);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(t);e&&(n=n.filter(function(s){return Object.getOwnPropertyDescriptor(t,s).enumerable})),r.push.apply(r,n)}return r}function N(t){for(var e=1;e<arguments.length;e++){var r=arguments[e]!=null?arguments[e]:{};e%2?ya(Object(r),!0).forEach(function(n){ih(t,n,r[n])}):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(r)):ya(Object(r)).forEach(function(n){Object.defineProperty(t,n,Object.getOwnPropertyDescriptor(r,n))})}return t}var ei=class extends Error{constructor(t,e="storage",r,n){super(t),this.__isStorageError=!0,this.namespace=e,this.name=e==="vectors"?"StorageVectorsError":"StorageError",this.status=r,this.statusCode=n}toJSON(){return{name:this.name,message:this.message,status:this.status,statusCode:this.statusCode}}};function ti(t){return typeof t=="object"&&t!==null&&"__isStorageError"in t}var Hi=class extends ei{constructor(t,e,r,n="storage",s){super(t,n,e,r),this.name=n==="vectors"?"StorageVectorsApiError":"StorageApiError",this.status=e,this.statusCode=r,this.code=s}toJSON(){return N(N({},super.toJSON()),{},{code:this.code})}},Wl=class extends ei{constructor(t,e,r="storage"){super(t,r),this.name=r==="vectors"?"StorageVectorsUnknownError":"StorageUnknownError",this.originalError=e}};function Ts(t,e,r){const n=N({},t),s=e.toLowerCase();for(const i of Object.keys(n))i.toLowerCase()===s&&delete n[i];return n[s]=r,n}function oh(t){const e={};for(const[r,n]of Object.entries(t))e[r.toLowerCase()]=n;return e}const ah=t=>t?(...e)=>t(...e):(...e)=>fetch(...e),lh=t=>{if(typeof t!="object"||t===null)return!1;const e=Object.getPrototypeOf(t);return(e===null||e===Object.prototype||Object.getPrototypeOf(e)===null)&&!(Symbol.toStringTag in t)&&!(Symbol.iterator in t)},Gi=t=>{if(Array.isArray(t))return t.map(r=>Gi(r));if(typeof t=="function"||t!==Object(t))return t;const e={};return Object.entries(t).forEach(([r,n])=>{const s=r.replace(/([-_][a-z])/gi,i=>i.toUpperCase().replace(/[-_]/g,""));e[s]=Gi(n)}),e},ch=t=>!t||typeof t!="string"||t.length===0||t.length>100||t.trim()!==t||t.includes("/")||t.includes("\\")?!1:/^[\w!.\*'() &$@=;:+,?-]+$/.test(t),Vi=t=>t.split("/").map(encodeURIComponent).join("/"),va=t=>{if(typeof t=="object"&&t!==null){const e=t;if(typeof e.msg=="string")return e.msg;if(typeof e.message=="string")return e.message;if(typeof e.error_description=="string")return e.error_description;if(typeof e.error=="string")return e.error;if(typeof e.error=="object"&&e.error!==null){const r=e.error;if(typeof r.message=="string")return r.message}}return JSON.stringify(t)},uh=async(t,e,r,n)=>{if(t!==null&&typeof t=="object"&&"json"in t&&typeof t.json=="function"){const s=t;let i=parseInt(String(s.status),10);Number.isFinite(i)||(i=500),s.json().then(o=>{const a=o?.statusCode||o?.code||i+"";e(new Hi(va(o),i,a,n,o?.code))}).catch(()=>{const o=i+"";e(new Hi(s.statusText||`HTTP ${i} error`,i,o,n))})}else e(new Wl(va(t),t,n))},dh=(t,e,r,n)=>{const s={method:t,headers:e?.headers||{}};if(t==="GET"||t==="HEAD"||!n)return N(N({},s),r);if(lh(n)){var i;const o=e?.headers||{};let a;for(const[l,c]of Object.entries(o))l.toLowerCase()==="content-type"&&(a=c);s.headers=Ts(o,"Content-Type",(i=a)!==null&&i!==void 0?i:"application/json"),s.body=JSON.stringify(n)}else s.body=n;return e?.duplex&&(s.duplex=e.duplex),N(N({},s),r)};async function rn(t,e,r,n,s,i,o){return new Promise((a,l)=>{t(r,dh(e,n,s,i)).then(c=>{if(!c.ok)throw c;if(n?.noResolveJson)return c;if(o==="vectors"){const u=c.headers.get("content-type");if(c.headers.get("content-length")==="0"||c.status===204)return{};if(!u||!u.includes("application/json"))return{}}return c.json()}).then(c=>a(c)).catch(c=>uh(c,l,n,o))})}function Hl(t="storage"){return{get:async(e,r,n,s)=>rn(e,"GET",r,n,s,void 0,t),post:async(e,r,n,s,i)=>rn(e,"POST",r,s,i,n,t),put:async(e,r,n,s,i)=>rn(e,"PUT",r,s,i,n,t),head:async(e,r,n,s)=>rn(e,"HEAD",r,N(N({},n),{},{noResolveJson:!0}),s,void 0,t),remove:async(e,r,n,s,i)=>rn(e,"DELETE",r,s,i,n,t)}}const hh=Hl("storage"),{get:Ir,post:rt,put:As,head:fh,remove:Lr}=hh,qe=Hl("vectors");var Jr=class{constructor(t,e={},r,n="storage"){this.shouldThrowOnError=!1,this.url=t,this.headers=oh(e),this.fetch=ah(r),this.namespace=n}throwOnError(){return this.shouldThrowOnError=!0,this}setHeader(t,e){return this.headers=Ts(this.headers,t,e),this}async handleOperation(t){var e=this;try{return{data:await t(),error:null}}catch(r){if(e.shouldThrowOnError)throw r;if(ti(r))return{data:null,error:r};throw r}}};let Gl;Gl=Symbol.toStringTag;var ph=class{constructor(t,e){this.downloadFn=t,this.shouldThrowOnError=e,this[Gl]="StreamDownloadBuilder",this.promise=null}then(t,e){return this.getPromise().then(t,e)}catch(t){return this.getPromise().catch(t)}finally(t){return this.getPromise().finally(t)}getPromise(){return this.promise||(this.promise=this.execute()),this.promise}async execute(){var t=this;try{return{data:(await t.downloadFn()).body,error:null}}catch(e){if(t.shouldThrowOnError)throw e;if(ti(e))return{data:null,error:e};throw e}}};let Vl;Vl=Symbol.toStringTag;var mh=class{constructor(t,e){this.downloadFn=t,this.shouldThrowOnError=e,this[Vl]="BlobDownloadBuilder",this.promise=null}asStream(){return new ph(this.downloadFn,this.shouldThrowOnError)}then(t,e){return this.getPromise().then(t,e)}catch(t){return this.getPromise().catch(t)}finally(t){return this.getPromise().finally(t)}getPromise(){return this.promise||(this.promise=this.execute()),this.promise}async execute(){var t=this;try{return{data:await(await t.downloadFn()).blob(),error:null}}catch(e){if(t.shouldThrowOnError)throw e;if(ti(e))return{data:null,error:e};throw e}}};const ki={limit:100,offset:0,sortBy:{column:"name",order:"asc"}},wa={cacheControl:"3600",contentType:"text/plain;charset=UTF-8",upsert:!1};var gh=class extends Jr{constructor(t,e={},r,n){super(t,e,n,"storage"),this.bucketId=r}async uploadOrUpdate(t,e,r,n){var s=this;return s.handleOperation(async()=>{let i;const o=N(N({},wa),n);let a=N(N({},s.headers),t==="POST"&&{"x-upsert":String(o.upsert)});const l=o.metadata;if(typeof Blob<"u"&&r instanceof Blob?(i=new FormData,i.append("cacheControl",o.cacheControl),l&&i.append("metadata",s.encodeMetadata(l)),i.append("",r)):typeof FormData<"u"&&r instanceof FormData?(i=r,i.has("cacheControl")||i.append("cacheControl",o.cacheControl),l&&!i.has("metadata")&&i.append("metadata",s.encodeMetadata(l))):(i=r,a["cache-control"]=`max-age=${o.cacheControl}`,a["content-type"]=o.contentType,l&&(a["x-metadata"]=s.toBase64(s.encodeMetadata(l))),(typeof ReadableStream<"u"&&i instanceof ReadableStream||i&&typeof i=="object"&&"pipe"in i&&typeof i.pipe=="function")&&!o.duplex&&(o.duplex="half")),n?.headers)for(const[f,h]of Object.entries(n.headers))a=Ts(a,f,h);const c=s._removeEmptyFolders(e),u=s._getFinalPath(c),d=await(t=="PUT"?As:rt)(s.fetch,`${s.url}/object/${u}`,i,N({headers:a},o?.duplex?{duplex:o.duplex}:{}));return{path:c,id:d.Id,fullPath:d.Key}})}async upload(t,e,r){return this.uploadOrUpdate("POST",t,e,r)}async uploadToSignedUrl(t,e,r,n){var s=this;const i=s._removeEmptyFolders(t),o=s._getFinalPath(i),a=new URL(s.url+`/object/upload/sign/${o}`);return a.searchParams.set("token",e),s.handleOperation(async()=>{let l;const c=N(N({},wa),n);let u=N(N({},s.headers),{"x-upsert":String(c.upsert)});const d=c.metadata;if(typeof Blob<"u"&&r instanceof Blob?(l=new FormData,l.append("cacheControl",c.cacheControl),d&&l.append("metadata",s.encodeMetadata(d)),l.append("",r)):typeof FormData<"u"&&r instanceof FormData?(l=r,l.has("cacheControl")||l.append("cacheControl",c.cacheControl),d&&!l.has("metadata")&&l.append("metadata",s.encodeMetadata(d))):(l=r,u["cache-control"]=`max-age=${c.cacheControl}`,u["content-type"]=c.contentType,d&&(u["x-metadata"]=s.toBase64(s.encodeMetadata(d))),(typeof ReadableStream<"u"&&l instanceof ReadableStream||l&&typeof l=="object"&&"pipe"in l&&typeof l.pipe=="function")&&!c.duplex&&(c.duplex="half")),n?.headers)for(const[f,h]of Object.entries(n.headers))u=Ts(u,f,h);return{path:i,fullPath:(await As(s.fetch,a.toString(),l,N({headers:u},c?.duplex?{duplex:c.duplex}:{}))).Key}})}async createSignedUploadUrl(t,e){var r=this;return r.handleOperation(async()=>{let n=r._getFinalPath(t);const s=N({},r.headers);e?.upsert&&(s["x-upsert"]="true");const i=await rt(r.fetch,`${r.url}/object/upload/sign/${n}`,{},{headers:s}),o=new URL(r.url+i.url),a=o.searchParams.get("token");if(!a)throw new ei("No token returned by API");return{signedUrl:o.toString(),path:t,token:a}})}async update(t,e,r){return this.uploadOrUpdate("PUT",t,e,r)}async move(t,e,r){var n=this;return n.handleOperation(async()=>await rt(n.fetch,`${n.url}/object/move`,{bucketId:n.bucketId,sourceKey:t,destinationKey:e,destinationBucket:r?.destinationBucket,sourceVersionId:r?.sourceVersionId},{headers:n.headers}))}async copy(t,e,r){var n=this;return n.handleOperation(async()=>({path:(await rt(n.fetch,`${n.url}/object/copy`,{bucketId:n.bucketId,sourceKey:t,destinationKey:e,destinationBucket:r?.destinationBucket,sourceVersionId:r?.sourceVersionId},{headers:n.headers})).Key}))}async createSignedUrl(t,e,r){var n=this;return n.handleOperation(async()=>{let s=n._getFinalPath(t);const i=typeof r?.transform=="object"&&r.transform!==null&&Object.keys(r.transform).length>0;let o=await rt(n.fetch,`${n.url}/object/sign/${s}`,N(N({expiresIn:e},i?{transform:r.transform}:{}),r?.versionId!=null?{versionId:r.versionId}:{}),{headers:n.headers});const a=new URLSearchParams;r?.download&&a.set("download",r.download===!0?"":r.download),r?.cacheNonce!=null&&a.set("cacheNonce",String(r.cacheNonce));const l=a.toString();return{signedUrl:encodeURI(`${n.url}${o.signedURL}${l?`&${l}`:""}`)}})}async createSignedUrls(t,e,r){var n=this;return n.handleOperation(async()=>{const s=await rt(n.fetch,`${n.url}/object/sign/${n.bucketId}`,{expiresIn:e,paths:t},{headers:n.headers}),i=new URLSearchParams;r?.download&&i.set("download",r.download===!0?"":r.download),r?.cacheNonce!=null&&i.set("cacheNonce",String(r.cacheNonce));const o=i.toString();return s.map(a=>N(N({},a),{},{signedUrl:a.signedURL?encodeURI(`${n.url}${a.signedURL}${o?`&${o}`:""}`):null}))})}download(t,e,r){const n=typeof e?.transform=="object"&&e.transform!==null&&Object.keys(e.transform).length>0?"render/image/authenticated":"object",s=new URLSearchParams;e?.transform&&this.applyTransformOptsToQuery(s,e.transform),e?.cacheNonce!=null&&s.set("cacheNonce",String(e.cacheNonce)),e?.versionId!=null&&s.set("versionId",String(e.versionId));const i=s.toString(),o=this._getFinalPath(t),a=()=>Ir(this.fetch,`${this.url}/${n}/${o}${i?`?${i}`:""}`,{headers:this.headers,noResolveJson:!0},r);return new mh(a,this.shouldThrowOnError)}async info(t,e){var r=this;const n=r._getFinalPath(t),s=new URLSearchParams;e?.versionId!=null&&s.set("versionId",String(e.versionId));const i=s.toString();return r.handleOperation(async()=>Gi(await Ir(r.fetch,`${r.url}/object/info/${n}${i?`?${i}`:""}`,{headers:r.headers})))}async exists(t){var e=this;const r=e._getFinalPath(t);try{return await fh(e.fetch,`${e.url}/object/${r}`,{headers:e.headers}),{data:!0,error:null}}catch(s){if(e.shouldThrowOnError)throw s;if(ti(s)){var n;const i=s instanceof Hi?s.status:s instanceof Wl?(n=s.originalError)===null||n===void 0?void 0:n.status:void 0;if(i!==void 0&&[400,404].includes(i))return{data:!1,error:s}}throw s}}getPublicUrl(t,e){const r=this._getFinalPath(t),n=new URLSearchParams;e?.download&&n.set("download",e.download===!0?"":e.download),e?.transform&&this.applyTransformOptsToQuery(n,e.transform),e?.cacheNonce!=null&&n.set("cacheNonce",String(e.cacheNonce)),e?.versionId!=null&&n.set("versionId",String(e.versionId));const s=n.toString(),i=typeof e?.transform=="object"&&e.transform!==null&&Object.keys(e.transform).length>0?"render/image":"object";return{data:{publicUrl:encodeURI(`${this.url}/${i}/public/${r}`)+(s?`?${s}`:"")}}}async remove(t){var e=this;return e.handleOperation(async()=>await Lr(e.fetch,`${e.url}/object/${e.bucketId}`,{prefixes:t},{headers:e.headers}))}async purgeCache(t,e,r){var n=this;return n.handleOperation(async()=>{const s=Vi(n._getFinalPath(t)),i=new URLSearchParams;e?.transformations&&i.set("transformations","true");const o=i.toString();return await Lr(n.fetch,`${n.url}/cdn/${s}${o?`?${o}`:""}`,{},{headers:n.headers},r)})}async list(t,e,r){var n=this;return n.handleOperation(async()=>{const s=e?.sortBy?N(N({},ki.sortBy),e.sortBy):ki.sortBy,i=N(N(N({},ki),e),{},{sortBy:s,prefix:t||""});return await rt(n.fetch,`${n.url}/object/list/${n.bucketId}`,i,{headers:n.headers},r)})}async listV2(t,e){var r=this;return r.handleOperation(async()=>{const n=N({},t);return await rt(r.fetch,`${r.url}/object/list-v2/${r.bucketId}`,n,{headers:r.headers},e)})}encodeMetadata(t){return JSON.stringify(t)}toBase64(t){return typeof Buffer<"u"?Buffer.from(t).toString("base64"):btoa(t)}_getFinalPath(t){return`${this.bucketId}/${t.replace(/^\/+/,"")}`}_removeEmptyFolders(t){return t.replace(/^\/|\/$/g,"").replace(/\/+/g,"/")}applyTransformOptsToQuery(t,e){return e.width&&t.set("width",e.width.toString()),e.height&&t.set("height",e.height.toString()),e.resize&&t.set("resize",e.resize),e.format&&t.set("format",e.format),e.quality&&t.set("quality",e.quality.toString()),t}};const yh="2.117.2",Nn={"X-Client-Info":`storage-js/${yh}`};var vh=class extends Jr{constructor(t,e={},r,n){const s=new URL(t);n?.useNewHostname&&/supabase\.(co|in|red)$/.test(s.hostname)&&!s.hostname.includes("storage.supabase.")&&(s.hostname=s.hostname.replace("supabase.","storage.supabase."));const i=s.href.replace(/\/$/,""),o=N(N({},Nn),e);super(i,o,r,"storage")}async listBuckets(t){var e=this;return e.handleOperation(async()=>{const r=e.listBucketOptionsToQueryString(t);return await Ir(e.fetch,`${e.url}/bucket${r}`,{headers:e.headers})})}async getBucket(t){var e=this;return e.handleOperation(async()=>await Ir(e.fetch,`${e.url}/bucket/${t}`,{headers:e.headers}))}async createBucket(t,e={public:!1}){var r=this;return r.handleOperation(async()=>await rt(r.fetch,`${r.url}/bucket`,{id:t,name:t,type:e.type,public:e.public,file_size_limit:e.fileSizeLimit,allowed_mime_types:e.allowedMimeTypes,versioning_status:e.versioningStatus},{headers:r.headers}))}async updateBucket(t,e){var r=this;return r.handleOperation(async()=>await As(r.fetch,`${r.url}/bucket/${t}`,{id:t,name:t,public:e.public,file_size_limit:e.fileSizeLimit,allowed_mime_types:e.allowedMimeTypes,versioning_status:e.versioningStatus},{headers:r.headers}))}async emptyBucket(t){var e=this;return e.handleOperation(async()=>await rt(e.fetch,`${e.url}/bucket/${t}/empty`,{},{headers:e.headers}))}async deleteBucket(t){var e=this;return e.handleOperation(async()=>await Lr(e.fetch,`${e.url}/bucket/${t}`,{},{headers:e.headers}))}async getBucketLifecycle(t){var e=this;return e.handleOperation(async()=>await Ir(e.fetch,e.bucketLifecycleUrl(t),{headers:e.headers}))}async updateBucketLifecycle(t,e){var r=this;return r.handleOperation(async()=>await As(r.fetch,r.bucketLifecycleUrl(t),e,{headers:r.headers}))}async deleteBucketLifecycle(t){var e=this;return e.handleOperation(async()=>await Lr(e.fetch,e.bucketLifecycleUrl(t),{},{headers:e.headers}))}async purgeBucketCache(t,e,r){var n=this;return n.handleOperation(async()=>{const s=new URLSearchParams;e?.transformations&&s.set("transformations","true");const i=s.toString();return await Lr(n.fetch,`${n.url}/cdn/${Vi(t)}${i?`?${i}`:""}`,{},{headers:n.headers},r)})}bucketLifecycleUrl(t){return`${this.url}/bucket/${Vi(t)}/lifecycle`}listBucketOptionsToQueryString(t){const e={};return t&&("limit"in t&&(e.limit=String(t.limit)),"offset"in t&&(e.offset=String(t.offset)),t.search&&(e.search=t.search),t.sortColumn&&(e.sortColumn=t.sortColumn),t.sortOrder&&(e.sortOrder=t.sortOrder)),Object.keys(e).length>0?"?"+new URLSearchParams(e).toString():""}},wh=class extends Jr{constructor(t,e={},r){const n=t.replace(/\/$/,""),s=N(N({},Nn),e);super(n,s,r,"storage")}async createBucket(t){var e=this;return e.handleOperation(async()=>await rt(e.fetch,`${e.url}/bucket`,{name:t},{headers:e.headers}))}async listBuckets(t){var e=this;return e.handleOperation(async()=>{const r=new URLSearchParams;t?.limit!==void 0&&r.set("limit",t.limit.toString()),t?.offset!==void 0&&r.set("offset",t.offset.toString()),t?.sortColumn&&r.set("sortColumn",t.sortColumn),t?.sortOrder&&r.set("sortOrder",t.sortOrder),t?.search&&r.set("search",t.search);const n=r.toString(),s=n?`${e.url}/bucket?${n}`:`${e.url}/bucket`;return await Ir(e.fetch,s,{headers:e.headers})})}async deleteBucket(t){var e=this;return e.handleOperation(async()=>await Lr(e.fetch,`${e.url}/bucket/${t}`,{},{headers:e.headers}))}from(t){var e=this;if(!ch(t))throw new ei("Invalid bucket name: File, folder, and bucket names must follow AWS object key naming guidelines and should avoid the use of any other characters.");const r=new rh({baseUrl:this.url,catalogName:t,auth:{type:"custom",getHeaders:async()=>e.headers},fetch:this.fetch}),n=this.shouldThrowOnError;return new Proxy(r,{get(s,i){const o=s[i];return typeof o!="function"?o:async(...a)=>{try{return{data:await o.apply(s,a),error:null}}catch(l){if(n)throw l;return{data:null,error:l}}}}})}},_h=class extends Jr{constructor(t,e={},r){const n=t.replace(/\/$/,""),s=N(N({},Nn),{},{"Content-Type":"application/json"},e);super(n,s,r,"vectors")}async createIndex(t){var e=this;return e.handleOperation(async()=>await qe.post(e.fetch,`${e.url}/CreateIndex`,t,{headers:e.headers})||{})}async getIndex(t,e){var r=this;return r.handleOperation(async()=>await qe.post(r.fetch,`${r.url}/GetIndex`,{vectorBucketName:t,indexName:e},{headers:r.headers}))}async listIndexes(t){var e=this;return e.handleOperation(async()=>await qe.post(e.fetch,`${e.url}/ListIndexes`,t,{headers:e.headers}))}async deleteIndex(t,e){var r=this;return r.handleOperation(async()=>await qe.post(r.fetch,`${r.url}/DeleteIndex`,{vectorBucketName:t,indexName:e},{headers:r.headers})||{})}},bh=class extends Jr{constructor(t,e={},r){const n=t.replace(/\/$/,""),s=N(N({},Nn),{},{"Content-Type":"application/json"},e);super(n,s,r,"vectors")}async putVectors(t){var e=this;if(t.vectors.length<1||t.vectors.length>500)throw new Error("Vector batch size must be between 1 and 500 items");return e.handleOperation(async()=>await qe.post(e.fetch,`${e.url}/PutVectors`,t,{headers:e.headers})||{})}async getVectors(t){var e=this;return e.handleOperation(async()=>await qe.post(e.fetch,`${e.url}/GetVectors`,t,{headers:e.headers}))}async listVectors(t){var e=this;if(t.segmentCount!==void 0){if(t.segmentCount<1||t.segmentCount>16)throw new Error("segmentCount must be between 1 and 16");if(t.segmentIndex!==void 0&&(t.segmentIndex<0||t.segmentIndex>=t.segmentCount))throw new Error(`segmentIndex must be between 0 and ${t.segmentCount-1}`)}return e.handleOperation(async()=>await qe.post(e.fetch,`${e.url}/ListVectors`,t,{headers:e.headers}))}async queryVectors(t){var e=this;return e.handleOperation(async()=>await qe.post(e.fetch,`${e.url}/QueryVectors`,t,{headers:e.headers}))}async deleteVectors(t){var e=this;if(t.keys.length<1||t.keys.length>500)throw new Error("Keys batch size must be between 1 and 500 items");return e.handleOperation(async()=>await qe.post(e.fetch,`${e.url}/DeleteVectors`,t,{headers:e.headers})||{})}},Sh=class extends Jr{constructor(t,e={},r){const n=t.replace(/\/$/,""),s=N(N({},Nn),{},{"Content-Type":"application/json"},e);super(n,s,r,"vectors")}async createBucket(t){var e=this;return e.handleOperation(async()=>await qe.post(e.fetch,`${e.url}/CreateVectorBucket`,{vectorBucketName:t},{headers:e.headers})||{})}async getBucket(t){var e=this;return e.handleOperation(async()=>await qe.post(e.fetch,`${e.url}/GetVectorBucket`,{vectorBucketName:t},{headers:e.headers}))}async listBuckets(t={}){var e=this;return e.handleOperation(async()=>await qe.post(e.fetch,`${e.url}/ListVectorBuckets`,t,{headers:e.headers}))}async deleteBucket(t){var e=this;return e.handleOperation(async()=>await qe.post(e.fetch,`${e.url}/DeleteVectorBucket`,{vectorBucketName:t},{headers:e.headers})||{})}},kh=class extends Sh{constructor(t,e={}){super(t,e.headers||{},e.fetch)}from(t){return new Eh(this.url,this.headers,t,this.fetch)}async createBucket(t){var e=()=>super.createBucket,r=this;return e().call(r,t)}async getBucket(t){var e=()=>super.getBucket,r=this;return e().call(r,t)}async listBuckets(t={}){var e=()=>super.listBuckets,r=this;return e().call(r,t)}async deleteBucket(t){var e=()=>super.deleteBucket,r=this;return e().call(r,t)}},Eh=class extends _h{constructor(t,e,r,n){super(t,e,n),this.vectorBucketName=r}async createIndex(t){var e=()=>super.createIndex,r=this;return e().call(r,N(N({},t),{},{vectorBucketName:r.vectorBucketName}))}async listIndexes(t={}){var e=()=>super.listIndexes,r=this;return e().call(r,N(N({},t),{},{vectorBucketName:r.vectorBucketName}))}async getIndex(t){var e=()=>super.getIndex,r=this;return e().call(r,r.vectorBucketName,t)}async deleteIndex(t){var e=()=>super.deleteIndex,r=this;return e().call(r,r.vectorBucketName,t)}index(t){return new Th(this.url,this.headers,this.vectorBucketName,t,this.fetch)}},Th=class extends bh{constructor(t,e,r,n,s){super(t,e,s),this.vectorBucketName=r,this.indexName=n}async putVectors(t){var e=()=>super.putVectors,r=this;return e().call(r,N(N({},t),{},{vectorBucketName:r.vectorBucketName,indexName:r.indexName}))}async getVectors(t){var e=()=>super.getVectors,r=this;return e().call(r,N(N({},t),{},{vectorBucketName:r.vectorBucketName,indexName:r.indexName}))}async listVectors(t={}){var e=()=>super.listVectors,r=this;return e().call(r,N(N({},t),{},{vectorBucketName:r.vectorBucketName,indexName:r.indexName}))}async queryVectors(t){var e=()=>super.queryVectors,r=this;return e().call(r,N(N({},t),{},{vectorBucketName:r.vectorBucketName,indexName:r.indexName}))}async deleteVectors(t){var e=()=>super.deleteVectors,r=this;return e().call(r,N(N({},t),{},{vectorBucketName:r.vectorBucketName,indexName:r.indexName}))}},Ah=class extends vh{constructor(t,e={},r,n){super(t,e,r,n)}from(t){return new gh(this.url,this.headers,t,this.fetch)}get vectors(){return new kh(this.url+"/vector",{headers:this.headers,fetch:this.fetch})}get analytics(){return new wh(this.url+"/iceberg",this.headers,this.fetch)}};const zl="2.117.2",Tt=30*1e3,on=3,Ei=on*Tt,Oh=2*Tt,Rh="http://localhost:9999",$h="supabase.auth.token",xh={"X-Client-Info":`gotrue-js/${zl}`},zi="X-Supabase-Api-Version",Kl={"2024-01-01":{timestamp:Date.parse("2024-01-01T00:00:00.0Z"),name:"2024-01-01"}},Ph=/^([a-z0-9_-]{4})*($|[a-z0-9_-]{3}$|[a-z0-9_-]{2}$)$/i,rr="sb_flow_id",Ch=5,Ih=600*1e3;class yn extends Error{constructor(e,r,n){super(e),this.__isAuthError=!0,this.name="AuthError",this.status=r,this.code=n}toJSON(){return{name:this.name,message:this.message,status:this.status,code:this.code}}}function P(t){return typeof t=="object"&&t!==null&&"__isAuthError"in t}class Lh extends yn{constructor(e,r,n){super(e,r,n),this.name="AuthApiError",this.status=r,this.code=n}}function _a(t){return P(t)&&t.name==="AuthApiError"}class st extends yn{constructor(e,r){super(e),this.name="AuthUnknownError",this.originalError=r}}class vt extends yn{constructor(e,r,n,s){super(e,n,s),this.name=r,this.status=n}}class me extends vt{constructor(){super("Auth session missing!","AuthSessionMissingError",400,void 0)}}function ts(t){return P(t)&&t.name==="AuthSessionMissingError"}class Er extends vt{constructor(){super("Auth session or user missing","AuthInvalidTokenResponseError",500,void 0)}}class rs extends vt{constructor(e){super(e,"AuthInvalidCredentialsError",400,void 0)}}class ns extends vt{constructor(e,r=null){super(e,"AuthImplicitGrantRedirectError",500,void 0),this.details=null,this.details=r}toJSON(){return Object.assign(Object.assign({},super.toJSON()),{details:this.details})}}function Dh(t){return P(t)&&t.name==="AuthImplicitGrantRedirectError"}class ba extends vt{constructor(e,r=null){super(e,"AuthPKCEGrantCodeExchangeError",500,void 0),this.details=null,this.details=r}toJSON(){return Object.assign(Object.assign({},super.toJSON()),{details:this.details})}}class Uh extends vt{constructor(){super("PKCE code verifier not found in storage. This can happen if the auth flow was initiated in a different browser or device, or if the storage was cleared. For SSR frameworks (Next.js, SvelteKit, etc.), use @supabase/ssr on both the server and client to store the code verifier in cookies.","AuthPKCECodeVerifierMissingError",400,"pkce_code_verifier_not_found")}}class hs extends vt{constructor(e,r){super(e,"AuthRetryableFetchError",r,void 0)}}function ss(t){return P(t)&&t.name==="AuthRetryableFetchError"}class Sa extends vt{constructor(e="Refresh result discarded: session state changed mid-flight (e.g., concurrent signOut)"){super(e,"AuthRefreshDiscardedError",409,void 0)}}function ka(t){return P(t)&&t.name==="AuthRefreshDiscardedError"}class Ea extends vt{constructor(e,r,n){super(e,"AuthWeakPasswordError",r,"weak_password"),this.reasons=n}toJSON(){return Object.assign(Object.assign({},super.toJSON()),{reasons:this.reasons})}}class Os extends vt{constructor(e){super(e,"AuthInvalidJwtError",400,"invalid_jwt")}}const Rs="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_".split(""),Ta=` 	
\r=`.split(""),jh=(()=>{const t=new Array(128);for(let e=0;e<t.length;e+=1)t[e]=-1;for(let e=0;e<Ta.length;e+=1)t[Ta[e].charCodeAt(0)]=-2;for(let e=0;e<Rs.length;e+=1)t[Rs[e].charCodeAt(0)]=e;return t})();function Aa(t,e,r){if(t!==null)for(e.queue=e.queue<<8|t,e.queuedBits+=8;e.queuedBits>=6;){const n=e.queue>>e.queuedBits-6&63;r(Rs[n]),e.queuedBits-=6}else if(e.queuedBits>0)for(e.queue=e.queue<<6-e.queuedBits,e.queuedBits=6;e.queuedBits>=6;){const n=e.queue>>e.queuedBits-6&63;r(Rs[n]),e.queuedBits-=6}}function Jl(t,e,r){const n=jh[t];if(n>-1)for(e.queue=e.queue<<6|n,e.queuedBits+=6;e.queuedBits>=8;)r(e.queue>>e.queuedBits-8&255),e.queuedBits-=8;else{if(n===-2)return;throw new Error(`Invalid Base64-URL character "${String.fromCharCode(t)}"`)}}function Oa(t){const e=[],r=o=>{e.push(String.fromCodePoint(o))},n={utf8seq:0,codepoint:0},s={queue:0,queuedBits:0},i=o=>{Bh(o,n,r)};for(let o=0;o<t.length;o+=1)Jl(t.charCodeAt(o),s,i);return e.join("")}function Nh(t,e){if(t<=127){e(t);return}else if(t<=2047){e(192|t>>6),e(128|t&63);return}else if(t<=65535){e(224|t>>12),e(128|t>>6&63),e(128|t&63);return}else if(t<=1114111){e(240|t>>18),e(128|t>>12&63),e(128|t>>6&63),e(128|t&63);return}throw new Error(`Unrecognized Unicode codepoint: ${t.toString(16)}`)}function qh(t,e){for(let r=0;r<t.length;r+=1){let n=t.charCodeAt(r);if(n>55295&&n<=56319){const s=(n-55296)*1024&65535;n=(t.charCodeAt(r+1)-56320&65535|s)+65536,r+=1}Nh(n,e)}}function Bh(t,e,r){if(e.utf8seq===0){if(t<=127){r(t);return}for(let n=1;n<6;n+=1)if((t>>7-n&1)===0){e.utf8seq=n;break}if(e.utf8seq===2)e.codepoint=t&31;else if(e.utf8seq===3)e.codepoint=t&15;else if(e.utf8seq===4)e.codepoint=t&7;else throw new Error("Invalid UTF-8 sequence");e.utf8seq-=1}else if(e.utf8seq>0){if(t<=127)throw new Error("Invalid UTF-8 sequence");e.codepoint=e.codepoint<<6|t&63,e.utf8seq-=1,e.utf8seq===0&&r(e.codepoint)}}function Dr(t){const e=[],r={queue:0,queuedBits:0},n=s=>{e.push(s)};for(let s=0;s<t.length;s+=1)Jl(t.charCodeAt(s),r,n);return new Uint8Array(e)}function Mh(t){const e=[];return qh(t,r=>e.push(r)),new Uint8Array(e)}function nr(t){const e=[],r={queue:0,queuedBits:0},n=s=>{e.push(s)};return t.forEach(s=>Aa(s,r,n)),Aa(null,r,n),e.join("")}function Yl(t){return Math.round(Date.now()/1e3)+t}function Fh(){return Symbol("auth-callback")}const ye=()=>typeof window<"u"&&typeof document<"u",Xt={tested:!1,writable:!1},Xl=()=>{if(!ye())return!1;try{if(typeof globalThis.localStorage!="object")return!1}catch{return!1}if(Xt.tested)return Xt.writable;const t=`lswt-${Math.random()}${Math.random()}`;try{globalThis.localStorage.setItem(t,t),globalThis.localStorage.removeItem(t),Xt.tested=!0,Xt.writable=!0}catch{Xt.tested=!0,Xt.writable=!1}return Xt.writable};function Ra(t){const e={},r=new URL(t);if(r.hash&&r.hash[0]==="#")try{new URLSearchParams(r.hash.substring(1)).forEach((s,i)=>{e[i]=s})}catch{}return r.searchParams.forEach((n,s)=>{e[s]=n}),e}const Ql=t=>t?(...e)=>t(...e):(...e)=>fetch(...e),Wh=t=>typeof t=="object"&&t!==null&&"status"in t&&"ok"in t&&"json"in t&&typeof t.json=="function",At=async(t,e,r)=>{await t.setItem(e,JSON.stringify(r))},be=async(t,e)=>{const r=await t.getItem(e);if(!r)return null;try{return JSON.parse(r)}catch{return null}},Pe=async(t,e)=>{await t.removeItem(e)};class ri{constructor(){this.promise=new ri.promiseConstructor((e,r)=>{this.resolve=e,this.reject=r})}}ri.promiseConstructor=Promise;function is(t){const e=t.split(".");if(e.length!==3)throw new Os("Invalid JWT structure");for(let n=0;n<e.length;n++)if(!Ph.test(e[n]))throw new Os("JWT not in base64url format");return{header:JSON.parse(Oa(e[0])),payload:JSON.parse(Oa(e[1])),signature:Dr(e[2]),raw:{header:e[0],payload:e[1]}}}async function Hh(t){return await new Promise(e=>{setTimeout(()=>e(null),t)})}function Gh(t,e){return new Promise((n,s)=>{(async()=>{for(let i=0;i<1/0;i++)try{const o=await t(i);if(!e(i,null,o)){n(o);return}}catch(o){if(!e(i,o)){s(o);return}}})()})}function Zl(t){return("0"+t.toString(16)).substr(-2)}function Vh(){const e=new Uint32Array(56);if(typeof crypto>"u"){const r="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~",n=r.length;let s="";for(let i=0;i<56;i++)s+=r.charAt(Math.floor(Math.random()*n));return s}return crypto.getRandomValues(e),Array.from(e,Zl).join("")}async function zh(t){const r=new TextEncoder().encode(t),n=await crypto.subtle.digest("SHA-256",r),s=new Uint8Array(n);return Array.from(s).map(i=>String.fromCharCode(i)).join("")}async function Kh(t){if(!(typeof crypto<"u"&&typeof crypto.subtle<"u"&&typeof TextEncoder<"u"))return console.warn("WebCrypto API is not supported. Code challenge method will default to use plain instead of sha256."),t;const r=await zh(t);return btoa(r).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}const Jh=/^[a-zA-Z0-9_-]{8,64}$/;function fs(t){return typeof t=="string"&&Jh.test(t)?t:null}function Yh(){if(typeof crypto<"u"&&typeof crypto.getRandomValues=="function"){const e=new Uint8Array(16);return crypto.getRandomValues(e),Array.from(e,Zl).join("")}let t="";for(let e=0;e<32;e++)t+=Math.floor(Math.random()*16).toString(16);return t}const Nr=(t,e)=>`${t}-flow-${e}-code-verifier`,vn=t=>`${t}-flows-code-verifier`;async function bo(t,e){const r=await be(t,vn(e));return Array.isArray(r)?r.filter(n=>fs(n)!==null):[]}async function Xh(t,e,r,n,s){await At(t,Nr(e,r),n);const i=(await bo(t,e)).filter(o=>o!==r);for(i.push(r);i.length>Ch;){const o=i.shift();await Pe(t,Nr(e,o)),s?.(o)}await At(t,vn(e),i),await At(t,`${e}-code-verifier`,n)}async function Qh(t,e,r){if(r){const s=await be(t,Nr(e,r));return{verifier:typeof s=="string"?s:null,flowId:r}}const n=await be(t,`${e}-code-verifier`);return{verifier:typeof n=="string"?n:null,flowId:null}}async function tt(t,e,r){const n=`${e}-code-verifier`;if(!r){await Pe(t,n);return}const s=Nr(e,r),i=await be(t,s);await Pe(t,s);const o=await bo(t,e),a=o.filter(l=>l!==r);a.length!==o.length&&(a.length>0?await At(t,vn(e),a):await Pe(t,vn(e))),i!=null&&i===await be(t,n)&&await Pe(t,n)}async function Zh(t,e){const r=await bo(t,e);for(const n of r)await Pe(t,Nr(e,n));await Pe(t,vn(e)),await Pe(t,`${e}-code-verifier`)}function ef(t,e){const r=t.indexOf("#");let n=r===-1?t:t.slice(0,r);const s=r===-1?"":t.slice(r),i=n.indexOf("?");if(i!==-1){const a=n.slice(0,i),l=n.slice(i+1).split("&").filter(c=>c!==""&&c!==rr&&!c.startsWith(`${rr}=`));n=l.length>0?`${a}?${l.join("&")}`:a}const o=n.includes("?")?"&":"?";return`${n}${o}${rr}=${encodeURIComponent(e)}${s}`}async function tf(t,e,r=!1,n){const s=Vh();let i=s;r&&(i+="/recovery");const o=Yh();await Xh(t,e,o,i,n);const a=await Kh(s);return[a,s===a?"plain":"s256",o]}const rf=/^2[0-9]{3}-(0[1-9]|1[0-2])-(0[1-9]|1[0-9]|2[0-9]|3[0-1])$/i;function nf(t){const e=t.headers.get(zi);if(!e||!e.match(rf))return null;try{return new Date(`${e}T00:00:00.0Z`)}catch{return null}}function sf(t){if(!t)throw new Error("Missing exp claim");const e=Math.floor(Date.now()/1e3);if(t<=e)throw new Error("JWT has expired")}function of(t){switch(t){case"RS256":return{name:"RSASSA-PKCS1-v1_5",hash:{name:"SHA-256"}};case"ES256":return{name:"ECDSA",namedCurve:"P-256",hash:{name:"SHA-256"}};default:throw new Error("Invalid alg claim")}}const af=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;function bt(t){if(!af.test(t))throw new Error("@supabase/auth-js: Expected parameter to be UUID but is not")}function nn(t){if(!t.recoveryCodes)throw new Error("@supabase/auth-js: the MFA recovery codes API is experimental and disabled by default. Enable it by passing `auth: { experimental: { recoveryCodes: true } }` to createClient (or to the GoTrueClient constructor).")}function Ti(){const t={};return new Proxy(t,{get:(e,r)=>{if(r==="__isUserNotAvailableProxy")return!0;if(typeof r=="symbol"){const n=r.toString();if(n==="Symbol(Symbol.toPrimitive)"||n==="Symbol(Symbol.toStringTag)"||n==="Symbol(util.inspect.custom)")return}throw new Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Accessing the "${r}" property of the session object is not supported. Please use getUser() instead.`)},set:(e,r)=>{throw new Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Setting the "${r}" property of the session object is not supported. Please use getUser() to fetch a user object you can manipulate.`)},deleteProperty:(e,r)=>{throw new Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Deleting the "${r}" property of the session object is not supported. Please use getUser() to fetch a user object you can manipulate.`)}})}function lf(t,e){return new Proxy(t,{get:(r,n,s)=>{if(n==="__isInsecureUserWarningProxy")return!0;if(typeof n=="symbol"){const i=n.toString();if(i==="Symbol(Symbol.toPrimitive)"||i==="Symbol(Symbol.toStringTag)"||i==="Symbol(util.inspect.custom)"||i==="Symbol(nodejs.util.inspect.custom)")return Reflect.get(r,n,s)}return!e.value&&typeof n=="string"&&(console.warn("Using the user object as returned from supabase.auth.getSession() or from some supabase.auth.onAuthStateChange() events could be insecure! This value comes directly from the storage medium (usually cookies on the server) and may not be authentic. Use supabase.auth.getUser() instead which authenticates the data by contacting the Supabase Auth server."),e.value=!0),Reflect.get(r,n,s)}})}function $a(t){return JSON.parse(JSON.stringify(t))}const Qt=t=>{if(typeof t=="object"&&t!==null){const e=t;if(typeof e.msg=="string")return e.msg;if(typeof e.message=="string")return e.message;if(typeof e.error_description=="string")return e.error_description;if(typeof e.error=="string")return e.error}return JSON.stringify(t)},xa=[500,501,502,503,504,520,521,522,523,524,525,526,527,528,529,530];async function Pa(t){var e;if(!Wh(t))throw new hs(Qt(t),0);let r;try{r=await t.json()}catch(i){throw xa.includes(t.status)?new hs(t.statusText||`HTTP ${t.status}`,t.status):new st(Qt(i),i)}if(xa.includes(t.status))throw new hs(Qt(r),t.status);let n;const s=nf(t);if(s&&s.getTime()>=Kl["2024-01-01"].timestamp&&typeof r=="object"&&r&&typeof r.code=="string"?n=r.code:typeof r=="object"&&r&&typeof r.error_code=="string"&&(n=r.error_code),n){if(n==="weak_password")throw new Ea(Qt(r),t.status,((e=r.weak_password)===null||e===void 0?void 0:e.reasons)||[]);if(n==="session_not_found")throw new me}else if(typeof r=="object"&&r&&typeof r.weak_password=="object"&&r.weak_password&&Array.isArray(r.weak_password.reasons)&&r.weak_password.reasons.length&&r.weak_password.reasons.reduce((i,o)=>i&&typeof o=="string",!0))throw new Ea(Qt(r),t.status,r.weak_password.reasons);throw new Lh(Qt(r),t.status||500,n)}const cf=(t,e,r,n)=>{const s={method:t,headers:e?.headers||{}};return t==="GET"?s:(s.headers=Object.assign({"Content-Type":"application/json;charset=UTF-8"},e?.headers),s.body=JSON.stringify(n),Object.assign(Object.assign({},s),r))};async function L(t,e,r,n){var s;const i=Object.assign({},n?.headers);i[zi]||(i[zi]=Kl["2024-01-01"].name),n?.jwt&&(i.Authorization=`Bearer ${n.jwt}`);const o=(s=n?.query)!==null&&s!==void 0?s:{};n?.redirectTo&&(o.redirect_to=n.redirectTo);const a=Object.keys(o).length?"?"+new URLSearchParams(o).toString():"",l=await uf(t,e,r+a,{headers:i,noResolveJson:n?.noResolveJson},{},n?.body);return n?.xform?n?.xform(l):{data:Object.assign({},l),error:null}}async function uf(t,e,r,n,s,i){const o=cf(e,n,s,i);let a;try{a=await t(r,Object.assign({},o))}catch(l){throw new hs(Qt(l),0)}if(a.ok||await Pa(a),n?.noResolveJson)return a;try{return await a.json()}catch(l){await Pa(l)}}function Ke(t){var e;let r=null;ff(t)&&(r=Object.assign({},t),t.expires_at||(r.expires_at=Yl(t.expires_in)));const n=(e=t.user)!==null&&e!==void 0?e:typeof t?.id=="string"?t:null;return{data:{session:r,user:n},error:null}}function Ca(t){const e=Ke(t);return!e.error&&t.weak_password&&typeof t.weak_password=="object"&&Array.isArray(t.weak_password.reasons)&&t.weak_password.reasons.length&&t.weak_password.message&&typeof t.weak_password.message=="string"&&t.weak_password.reasons.reduce((r,n)=>r&&typeof n=="string",!0)&&(e.data.weak_password=t.weak_password),e}function jt(t){var e;return{data:{user:(e=t.user)!==null&&e!==void 0?e:t},error:null}}function df(t){return{data:t,error:null}}function hf(t){const{action_link:e,email_otp:r,hashed_token:n,redirect_to:s,verification_type:i}=t,o=Zs(t,["action_link","email_otp","hashed_token","redirect_to","verification_type"]),a={action_link:e,email_otp:r,hashed_token:n,redirect_to:s,verification_type:i},l=Object.assign({},o);return{data:{properties:a,user:l},error:null}}function Ia(t){return t}function ff(t){return!!t.access_token&&!!t.refresh_token&&!!t.expires_in}const Ai=["global","local","others"];class pf{constructor({url:e="",headers:r={},fetch:n,experimental:s}){this.url=e,this.headers=r,this.fetch=Ql(n),this.experimental=s??{},this.mfa={listFactors:this._listFactors.bind(this),deleteFactor:this._deleteFactor.bind(this)},this.oauth={listClients:this._listOAuthClients.bind(this),createClient:this._createOAuthClient.bind(this),getClient:this._getOAuthClient.bind(this),updateClient:this._updateOAuthClient.bind(this),deleteClient:this._deleteOAuthClient.bind(this),regenerateClientSecret:this._regenerateOAuthClientSecret.bind(this)},this.customProviders={listProviders:this._listCustomProviders.bind(this),createProvider:this._createCustomProvider.bind(this),getProvider:this._getCustomProvider.bind(this),updateProvider:this._updateCustomProvider.bind(this),deleteProvider:this._deleteCustomProvider.bind(this)},this.passkey={listPasskeys:this._adminListPasskeys.bind(this),deletePasskey:this._adminDeletePasskey.bind(this)}}async signOut(e,r=Ai[0]){if(Ai.indexOf(r)<0)throw new Error(`@supabase/auth-js: Parameter scope must be one of ${Ai.join(", ")}`);try{return await L(this.fetch,"POST",`${this.url}/logout?scope=${r}`,{headers:this.headers,jwt:e,noResolveJson:!0}),{data:null,error:null}}catch(n){if(P(n))return{data:null,error:n};throw n}}async inviteUserByEmail(e,r={}){try{return await L(this.fetch,"POST",`${this.url}/invite`,{body:{email:e,data:r.data},headers:this.headers,redirectTo:r.redirectTo,xform:jt})}catch(n){if(P(n))return{data:{user:null},error:n};throw n}}async generateLink(e){try{const{options:r}=e,n=Zs(e,["options"]),s=Object.assign(Object.assign({},n),r);return"newEmail"in n&&(s.new_email=n?.newEmail,delete s.newEmail),await L(this.fetch,"POST",`${this.url}/admin/generate_link`,{body:s,headers:this.headers,xform:hf,redirectTo:r?.redirectTo})}catch(r){if(P(r))return{data:{properties:null,user:null},error:r};throw r}}async createUser(e){try{return await L(this.fetch,"POST",`${this.url}/admin/users`,{body:e,headers:this.headers,xform:jt})}catch(r){if(P(r))return{data:{user:null},error:r};throw r}}async listUsers(e){var r,n,s,i,o,a,l;try{const c={nextPage:null,lastPage:0,total:0},u=await L(this.fetch,"GET",`${this.url}/admin/users`,{headers:this.headers,noResolveJson:!0,query:{page:(n=(r=e?.page)===null||r===void 0?void 0:r.toString())!==null&&n!==void 0?n:"",per_page:(i=(s=e?.perPage)===null||s===void 0?void 0:s.toString())!==null&&i!==void 0?i:""},xform:Ia});if(u.error)throw u.error;const d=await u.json(),f=(o=u.headers.get("x-total-count"))!==null&&o!==void 0?o:0,h=(l=(a=u.headers.get("link"))===null||a===void 0?void 0:a.split(","))!==null&&l!==void 0?l:[];return h.length>0&&(h.forEach(y=>{const v=parseInt(y.split(";")[0].split("=")[1].substring(0,1)),_=JSON.parse(y.split(";")[1].split("=")[1]);c[`${_}Page`]=v}),c.total=parseInt(f)),{data:Object.assign(Object.assign({},d),c),error:null}}catch(c){if(P(c))return{data:{users:[]},error:c};throw c}}async getUserById(e){bt(e);try{return await L(this.fetch,"GET",`${this.url}/admin/users/${e}`,{headers:this.headers,xform:jt})}catch(r){if(P(r))return{data:{user:null},error:r};throw r}}async updateUserById(e,r){bt(e);try{return await L(this.fetch,"PUT",`${this.url}/admin/users/${e}`,{body:r,headers:this.headers,xform:jt})}catch(n){if(P(n))return{data:{user:null},error:n};throw n}}async deleteUser(e,r=!1){bt(e);try{return await L(this.fetch,"DELETE",`${this.url}/admin/users/${e}`,{headers:this.headers,body:{should_soft_delete:r},xform:jt})}catch(n){if(P(n))return{data:{user:null},error:n};throw n}}async _listFactors(e){bt(e.userId);try{const{data:r,error:n}=await L(this.fetch,"GET",`${this.url}/admin/users/${e.userId}/factors`,{headers:this.headers,xform:s=>({data:{factors:s},error:null})});return{data:r,error:n}}catch(r){if(P(r))return{data:null,error:r};throw r}}async _deleteFactor(e){bt(e.userId),bt(e.id);try{return{data:await L(this.fetch,"DELETE",`${this.url}/admin/users/${e.userId}/factors/${e.id}`,{headers:this.headers}),error:null}}catch(r){if(P(r))return{data:null,error:r};throw r}}async _listOAuthClients(e){var r,n,s,i,o,a,l;try{const c={nextPage:null,lastPage:0,total:0},u=await L(this.fetch,"GET",`${this.url}/admin/oauth/clients`,{headers:this.headers,noResolveJson:!0,query:{page:(n=(r=e?.page)===null||r===void 0?void 0:r.toString())!==null&&n!==void 0?n:"",per_page:(i=(s=e?.perPage)===null||s===void 0?void 0:s.toString())!==null&&i!==void 0?i:""},xform:Ia});if(u.error)throw u.error;const d=await u.json(),f=(o=u.headers.get("x-total-count"))!==null&&o!==void 0?o:0,h=(l=(a=u.headers.get("link"))===null||a===void 0?void 0:a.split(","))!==null&&l!==void 0?l:[];return h.length>0&&(h.forEach(y=>{const v=parseInt(y.split(";")[0].split("=")[1].substring(0,1)),_=JSON.parse(y.split(";")[1].split("=")[1]);c[`${_}Page`]=v}),c.total=parseInt(f)),{data:Object.assign(Object.assign({},d),c),error:null}}catch(c){if(P(c))return{data:{clients:[]},error:c};throw c}}async _createOAuthClient(e){try{return await L(this.fetch,"POST",`${this.url}/admin/oauth/clients`,{body:e,headers:this.headers,xform:r=>({data:r,error:null})})}catch(r){if(P(r))return{data:null,error:r};throw r}}async _getOAuthClient(e){try{return await L(this.fetch,"GET",`${this.url}/admin/oauth/clients/${e}`,{headers:this.headers,xform:r=>({data:r,error:null})})}catch(r){if(P(r))return{data:null,error:r};throw r}}async _updateOAuthClient(e,r){try{return await L(this.fetch,"PUT",`${this.url}/admin/oauth/clients/${e}`,{body:r,headers:this.headers,xform:n=>({data:n,error:null})})}catch(n){if(P(n))return{data:null,error:n};throw n}}async _deleteOAuthClient(e){try{return await L(this.fetch,"DELETE",`${this.url}/admin/oauth/clients/${e}`,{headers:this.headers,noResolveJson:!0}),{data:null,error:null}}catch(r){if(P(r))return{data:null,error:r};throw r}}async _regenerateOAuthClientSecret(e){try{return await L(this.fetch,"POST",`${this.url}/admin/oauth/clients/${e}/regenerate_secret`,{headers:this.headers,xform:r=>({data:r,error:null})})}catch(r){if(P(r))return{data:null,error:r};throw r}}async _listCustomProviders(e){try{const r={};return e?.type&&(r.type=e.type),await L(this.fetch,"GET",`${this.url}/admin/custom-providers`,{headers:this.headers,query:r,xform:n=>{var s;return{data:{providers:(s=n?.providers)!==null&&s!==void 0?s:[]},error:null}}})}catch(r){if(P(r))return{data:{providers:[]},error:r};throw r}}async _createCustomProvider(e){try{return await L(this.fetch,"POST",`${this.url}/admin/custom-providers`,{body:e,headers:this.headers,xform:r=>({data:r,error:null})})}catch(r){if(P(r))return{data:null,error:r};throw r}}async _getCustomProvider(e){try{return await L(this.fetch,"GET",`${this.url}/admin/custom-providers/${e}`,{headers:this.headers,xform:r=>({data:r,error:null})})}catch(r){if(P(r))return{data:null,error:r};throw r}}async _updateCustomProvider(e,r){try{return await L(this.fetch,"PUT",`${this.url}/admin/custom-providers/${e}`,{body:r,headers:this.headers,xform:n=>({data:n,error:null})})}catch(n){if(P(n))return{data:null,error:n};throw n}}async _deleteCustomProvider(e){try{return await L(this.fetch,"DELETE",`${this.url}/admin/custom-providers/${e}`,{headers:this.headers,noResolveJson:!0}),{data:null,error:null}}catch(r){if(P(r))return{data:null,error:r};throw r}}async _adminListPasskeys(e){bt(e.userId);try{return await L(this.fetch,"GET",`${this.url}/admin/users/${e.userId}/passkeys`,{headers:this.headers,xform:r=>({data:r,error:null})})}catch(r){if(P(r))return{data:null,error:r};throw r}}async _adminDeletePasskey(e){bt(e.userId),bt(e.passkeyId);try{return await L(this.fetch,"DELETE",`${this.url}/admin/users/${e.userId}/passkeys/${e.passkeyId}`,{headers:this.headers,noResolveJson:!0}),{data:null,error:null}}catch(r){if(P(r))return{data:null,error:r};throw r}}}function La(t={}){return{getItem:e=>t[e]||null,setItem:(e,r)=>{t[e]=r},removeItem:e=>{delete t[e]}}}globalThis&&Xl()&&globalThis.localStorage&&globalThis.localStorage.getItem("supabase.gotrue-js.locks.debug");class mf extends Error{constructor(e){super(e),this.isAcquireTimeout=!0}}function gf(){if(typeof globalThis!="object")try{Object.defineProperty(Object.prototype,"__magic__",{get:function(){return this},configurable:!0}),__magic__.globalThis=__magic__,delete Object.prototype.__magic__}catch{typeof self<"u"&&(self.globalThis=self)}}function ec(t){if(!/^0x[a-fA-F0-9]{40}$/.test(t))throw new Error(`@supabase/auth-js: Address "${t}" is invalid.`);return t.toLowerCase()}function yf(t){return parseInt(t,16)}function vf(t){const e=new TextEncoder().encode(t);return"0x"+Array.from(e,n=>n.toString(16).padStart(2,"0")).join("")}function wf(t){var e;const{chainId:r,domain:n,expirationTime:s,issuedAt:i=new Date,nonce:o,notBefore:a,requestId:l,resources:c,scheme:u,uri:d,version:f}=t;{if(!Number.isInteger(r))throw new Error(`@supabase/auth-js: Invalid SIWE message field "chainId". Chain ID must be a EIP-155 chain ID. Provided value: ${r}`);if(!n)throw new Error('@supabase/auth-js: Invalid SIWE message field "domain". Domain must be provided.');if(o&&o.length<8)throw new Error(`@supabase/auth-js: Invalid SIWE message field "nonce". Nonce must be at least 8 characters. Provided value: ${o}`);if(!d)throw new Error('@supabase/auth-js: Invalid SIWE message field "uri". URI must be provided.');if(f!=="1")throw new Error(`@supabase/auth-js: Invalid SIWE message field "version". Version must be '1'. Provided value: ${f}`);if(!((e=t.statement)===null||e===void 0)&&e.includes(`
`))throw new Error(`@supabase/auth-js: Invalid SIWE message field "statement". Statement must not include '\\n'. Provided value: ${t.statement}`)}const h=ec(t.address),y=u?`${u}://${n}`:n,v=t.statement?`${t.statement}
`:"",_=`${y} wants you to sign in with your Ethereum account:
${h}

${v}`;let R=`URI: ${d}
Version: ${f}
Chain ID: ${r}${o?`
Nonce: ${o}`:""}
Issued At: ${i.toISOString()}`;if(s&&(R+=`
Expiration Time: ${s.toISOString()}`),a&&(R+=`
Not Before: ${a.toISOString()}`),l&&(R+=`
Request ID: ${l}`),c){let g=`
Resources:`;for(const m of c){if(!m||typeof m!="string")throw new Error(`@supabase/auth-js: Invalid SIWE message field "resources". Every resource must be a valid string. Provided value: ${m}`);g+=`
- ${m}`}R+=g}return`${_}
${R}`}class he extends Error{constructor({message:e,code:r,cause:n,name:s}){var i;super(e,{cause:n}),this.__isWebAuthnError=!0,this.name=(i=s??(n instanceof Error?n.name:void 0))!==null&&i!==void 0?i:"Unknown Error",this.code=r}toJSON(){return{name:this.name,message:this.message,code:this.code}}}class $s extends he{constructor(e,r){super({code:"ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",cause:r,message:e}),this.name="WebAuthnUnknownError",this.originalError=r}}function _f({error:t,options:e}){var r,n,s;const{publicKey:i}=e;if(!i)throw Error("options was missing required publicKey property");if(t.name==="AbortError"){if(e.signal instanceof AbortSignal)return new he({message:"Registration ceremony was sent an abort signal",code:"ERROR_CEREMONY_ABORTED",cause:t})}else if(t.name==="ConstraintError"){if(((r=i.authenticatorSelection)===null||r===void 0?void 0:r.requireResidentKey)===!0)return new he({message:"Discoverable credentials were required but no available authenticator supported it",code:"ERROR_AUTHENTICATOR_MISSING_DISCOVERABLE_CREDENTIAL_SUPPORT",cause:t});if(e.mediation==="conditional"&&((n=i.authenticatorSelection)===null||n===void 0?void 0:n.userVerification)==="required")return new he({message:"User verification was required during automatic registration but it could not be performed",code:"ERROR_AUTO_REGISTER_USER_VERIFICATION_FAILURE",cause:t});if(((s=i.authenticatorSelection)===null||s===void 0?void 0:s.userVerification)==="required")return new he({message:"User verification was required but no available authenticator supported it",code:"ERROR_AUTHENTICATOR_MISSING_USER_VERIFICATION_SUPPORT",cause:t})}else{if(t.name==="InvalidStateError")return new he({message:"The authenticator was previously registered",code:"ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED",cause:t});if(t.name==="NotAllowedError")return new he({message:t.message,code:"ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",cause:t});if(t.name==="NotSupportedError")return i.pubKeyCredParams.filter(a=>a.type==="public-key").length===0?new he({message:'No entry in pubKeyCredParams was of type "public-key"',code:"ERROR_MALFORMED_PUBKEYCREDPARAMS",cause:t}):new he({message:"No available authenticator supported any of the specified pubKeyCredParams algorithms",code:"ERROR_AUTHENTICATOR_NO_SUPPORTED_PUBKEYCREDPARAMS_ALG",cause:t});if(t.name==="SecurityError"){const o=window.location.hostname;if(tc(o)){if(i.rp.id!==o)return new he({message:`The RP ID "${i.rp.id}" is invalid for this domain`,code:"ERROR_INVALID_RP_ID",cause:t})}else return new he({message:`${window.location.hostname} is an invalid domain`,code:"ERROR_INVALID_DOMAIN",cause:t})}else if(t.name==="TypeError"){if(i.user.id.byteLength<1||i.user.id.byteLength>64)return new he({message:"User ID was not between 1 and 64 characters",code:"ERROR_INVALID_USER_ID_LENGTH",cause:t})}else if(t.name==="UnknownError")return new he({message:"The authenticator was unable to process the specified options, or could not create a new credential",code:"ERROR_AUTHENTICATOR_GENERAL_ERROR",cause:t})}return new he({message:"a Non-Webauthn related error has occurred",code:"ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",cause:t})}function bf({error:t,options:e}){const{publicKey:r}=e;if(!r)throw Error("options was missing required publicKey property");if(t.name==="AbortError"){if(e.signal instanceof AbortSignal)return new he({message:"Authentication ceremony was sent an abort signal",code:"ERROR_CEREMONY_ABORTED",cause:t})}else{if(t.name==="NotAllowedError")return new he({message:t.message,code:"ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",cause:t});if(t.name==="SecurityError"){const n=window.location.hostname;if(tc(n)){if(r.rpId!==n)return new he({message:`The RP ID "${r.rpId}" is invalid for this domain`,code:"ERROR_INVALID_RP_ID",cause:t})}else return new he({message:`${window.location.hostname} is an invalid domain`,code:"ERROR_INVALID_DOMAIN",cause:t})}else if(t.name==="UnknownError")return new he({message:"The authenticator was unable to process the specified options, or could not create a new assertion signature",code:"ERROR_AUTHENTICATOR_GENERAL_ERROR",cause:t})}return new he({message:"a Non-Webauthn related error has occurred",code:"ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",cause:t})}class Sf{createNewAbortSignal(){if(this.controller){const r=new Error("Cancelling existing WebAuthn API call for new one");r.name="AbortError",this.controller.abort(r)}const e=new AbortController;return this.controller=e,e.signal}cancelCeremony(){if(this.controller){const e=new Error("Manually cancelling existing WebAuthn API call");e.name="AbortError",this.controller.abort(e),this.controller=void 0}}}const Ki=new Sf;function Da(t){if(!t)throw new Error("Credential creation options are required");if(typeof PublicKeyCredential<"u"&&"parseCreationOptionsFromJSON"in PublicKeyCredential&&typeof PublicKeyCredential.parseCreationOptionsFromJSON=="function")return PublicKeyCredential.parseCreationOptionsFromJSON(t);const{challenge:e,user:r,excludeCredentials:n}=t,s=Zs(t,["challenge","user","excludeCredentials"]),i=Dr(e).buffer,o=Object.assign(Object.assign({},r),{id:Dr(r.id).buffer}),a=Object.assign(Object.assign({},s),{challenge:i,user:o});if(n&&n.length>0){a.excludeCredentials=new Array(n.length);for(let l=0;l<n.length;l++){const c=n[l];a.excludeCredentials[l]=Object.assign(Object.assign({},c),{id:Dr(c.id).buffer,type:c.type||"public-key",transports:c.transports})}}return a}function Ua(t){if(!t)throw new Error("Credential request options are required");if(typeof PublicKeyCredential<"u"&&"parseRequestOptionsFromJSON"in PublicKeyCredential&&typeof PublicKeyCredential.parseRequestOptionsFromJSON=="function")return PublicKeyCredential.parseRequestOptionsFromJSON(t);const{challenge:e,allowCredentials:r}=t,n=Zs(t,["challenge","allowCredentials"]),s=Dr(e).buffer,i=Object.assign(Object.assign({},n),{challenge:s});if(r&&r.length>0){i.allowCredentials=new Array(r.length);for(let o=0;o<r.length;o++){const a=r[o];i.allowCredentials[o]=Object.assign(Object.assign({},a),{id:Dr(a.id).buffer,type:a.type||"public-key",transports:a.transports})}}return i}function ja(t){var e;if("toJSON"in t&&typeof t.toJSON=="function")return t.toJSON();const r=t;return{id:t.id,rawId:t.id,response:{attestationObject:nr(new Uint8Array(t.response.attestationObject)),clientDataJSON:nr(new Uint8Array(t.response.clientDataJSON))},type:"public-key",clientExtensionResults:t.getClientExtensionResults(),authenticatorAttachment:(e=r.authenticatorAttachment)!==null&&e!==void 0?e:void 0}}function Na(t){var e;if("toJSON"in t&&typeof t.toJSON=="function")return t.toJSON();const r=t,n=t.getClientExtensionResults(),s=t.response;return{id:t.id,rawId:t.id,response:{authenticatorData:nr(new Uint8Array(s.authenticatorData)),clientDataJSON:nr(new Uint8Array(s.clientDataJSON)),signature:nr(new Uint8Array(s.signature)),userHandle:s.userHandle?nr(new Uint8Array(s.userHandle)):void 0},type:"public-key",clientExtensionResults:n,authenticatorAttachment:(e=r.authenticatorAttachment)!==null&&e!==void 0?e:void 0}}function tc(t){return t==="localhost"||/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i.test(t)}function xs(){var t,e;return!!(ye()&&"PublicKeyCredential"in window&&window.PublicKeyCredential&&"credentials"in navigator&&typeof((t=navigator?.credentials)===null||t===void 0?void 0:t.create)=="function"&&typeof((e=navigator?.credentials)===null||e===void 0?void 0:e.get)=="function")}async function rc(t){try{const e=await navigator.credentials.create(t);return e?e instanceof PublicKeyCredential?{data:e,error:null}:{data:null,error:new $s("Browser returned unexpected credential type",e)}:{data:null,error:new $s("Empty credential response",e)}}catch(e){return{data:null,error:_f({error:e,options:t})}}}async function nc(t){try{const e=await navigator.credentials.get(t);return e?e instanceof PublicKeyCredential?{data:e,error:null}:{data:null,error:new $s("Browser returned unexpected credential type",e)}:{data:null,error:new $s("Empty credential response",e)}}catch(e){return{data:null,error:bf({error:e,options:t})}}}const kf={hints:["security-key"],authenticatorSelection:{authenticatorAttachment:"cross-platform",requireResidentKey:!1,userVerification:"preferred",residentKey:"discouraged"},attestation:"direct"},Ef={userVerification:"preferred",hints:["security-key"],attestation:"direct"};function Ps(...t){const e=s=>s!==null&&typeof s=="object"&&!Array.isArray(s),r=s=>s instanceof ArrayBuffer||ArrayBuffer.isView(s),n={};for(const s of t)if(s)for(const i in s){const o=s[i];if(o!==void 0)if(Array.isArray(o))n[i]=o;else if(r(o))n[i]=o;else if(e(o)){const a=n[i];e(a)?n[i]=Ps(a,o):n[i]=Ps(o)}else n[i]=o}return n}function Tf(t,e){return Ps(kf,t,e||{})}function Af(t,e){return Ps(Ef,t,e||{})}class Of{constructor(e){this.client=e,this.enroll=this._enroll.bind(this),this.challenge=this._challenge.bind(this),this.verify=this._verify.bind(this),this.authenticate=this._authenticate.bind(this),this.register=this._register.bind(this)}async _enroll(e){return this.client.mfa.enroll(Object.assign(Object.assign({},e),{factorType:"webauthn"}))}async _challenge({factorId:e,webauthn:r,friendlyName:n,signal:s},i){var o;try{const{data:a,error:l}=await this.client.mfa.challenge({factorId:e,webauthn:r});if(!a)return{data:null,error:l};const c=s??Ki.createNewAbortSignal();if(a.webauthn.type==="create"){const{user:u}=a.webauthn.credential_options.publicKey;if(!u.name){const d=n;if(d)u.name=`${u.id}:${d}`;else{const h=(await this.client.getUser()).data.user,y=((o=h?.user_metadata)===null||o===void 0?void 0:o.name)||h?.email||h?.id||"User";u.name=`${u.id}:${y}`}}u.displayName||(u.displayName=u.name)}switch(a.webauthn.type){case"create":{const u=Tf(a.webauthn.credential_options.publicKey,i?.create),{data:d,error:f}=await rc({publicKey:u,signal:c});return d?{data:{factorId:e,challengeId:a.id,webauthn:{type:a.webauthn.type,credential_response:d}},error:null}:{data:null,error:f}}case"request":{const u=Af(a.webauthn.credential_options.publicKey,i?.request),{data:d,error:f}=await nc(Object.assign(Object.assign({},a.webauthn.credential_options),{publicKey:u,signal:c}));return d?{data:{factorId:e,challengeId:a.id,webauthn:{type:a.webauthn.type,credential_response:d}},error:null}:{data:null,error:f}}}}catch(a){return P(a)?{data:null,error:a}:{data:null,error:new st("Unexpected error in challenge",a)}}}async _verify({challengeId:e,factorId:r,webauthn:n}){return this.client.mfa.verify({factorId:r,challengeId:e,webauthn:n})}async _authenticate({factorId:e,webauthn:{rpId:r=typeof window<"u"?window.location.hostname:void 0,rpOrigins:n=typeof window<"u"?[window.location.origin]:void 0,signal:s}={}},i){if(!r)return{data:null,error:new yn("rpId is required for WebAuthn authentication")};try{if(!xs())return{data:null,error:new st("Browser does not support WebAuthn",null)};const{data:o,error:a}=await this.challenge({factorId:e,webauthn:{rpId:r,rpOrigins:n},signal:s},{request:i});if(!o)return{data:null,error:a};const{webauthn:l}=o;return this._verify({factorId:e,challengeId:o.challengeId,webauthn:{type:l.type,rpId:r,rpOrigins:n,credential_response:l.credential_response}})}catch(o){return P(o)?{data:null,error:o}:{data:null,error:new st("Unexpected error in authenticate",o)}}}async _register({friendlyName:e,webauthn:{rpId:r=typeof window<"u"?window.location.hostname:void 0,rpOrigins:n=typeof window<"u"?[window.location.origin]:void 0,signal:s}={}},i){if(!r)return{data:null,error:new yn("rpId is required for WebAuthn registration")};try{if(!xs())return{data:null,error:new st("Browser does not support WebAuthn",null)};const{data:o,error:a}=await this._enroll({friendlyName:e});if(!o)return await this.client.mfa.listFactors().then(u=>{var d;return(d=u.data)===null||d===void 0?void 0:d.all.find(f=>f.factor_type==="webauthn"&&f.friendly_name===e&&f.status==="unverified")}).then(u=>u?this.client.mfa.unenroll({factorId:u?.id}):void 0),{data:null,error:a};const{data:l,error:c}=await this._challenge({factorId:o.id,friendlyName:o.friendly_name,webauthn:{rpId:r,rpOrigins:n},signal:s},{create:i});return l?this._verify({factorId:o.id,challengeId:l.challengeId,webauthn:{rpId:r,rpOrigins:n,type:l.webauthn.type,credential_response:l.webauthn.credential_response}}):{data:null,error:c}}catch(o){return P(o)?{data:null,error:o}:{data:null,error:new st("Unexpected error in register",o)}}}}gf();const Rf={url:Rh,storageKey:$h,autoRefreshToken:!0,persistSession:!0,detectSessionInUrl:!0,headers:xh,flowType:"implicit",debug:!1,hasCustomAuthorizationHeader:!1,throwOnError:!1,lockAcquireTimeout:5e3,skipAutoInitialize:!1,experimental:{}},Tr={};let qa=!1;class wn{get jwks(){var e,r;return(r=(e=Tr[this.storageKey])===null||e===void 0?void 0:e.jwks)!==null&&r!==void 0?r:{keys:[]}}set jwks(e){Tr[this.storageKey]=Object.assign(Object.assign({},Tr[this.storageKey]),{jwks:e})}get jwks_cached_at(){var e,r;return(r=(e=Tr[this.storageKey])===null||e===void 0?void 0:e.cachedAt)!==null&&r!==void 0?r:Number.MIN_SAFE_INTEGER}set jwks_cached_at(e){Tr[this.storageKey]=Object.assign(Object.assign({},Tr[this.storageKey]),{cachedAt:e})}constructor(e){var r,n,s;this.userStorage=null,this.memoryStorage=null,this.stateChangeEmitters=new Map,this.autoRefreshTicker=null,this.autoRefreshTickTimeout=null,this.visibilityChangedCallback=null,this.refreshingDeferred=null,this.lastRefreshFailure=null,this._sessionRemovalEpoch=0,this.initializePromise=null,this._pendingInitNotifications=null,this.detectSessionInUrl=!0,this.hasCustomAuthorizationHeader=!1,this.suppressGetSessionWarning=!1,this.lock=null,this.lockAcquired=!1,this.pendingInLock=[],this.broadcastChannel=null,this.logger=console.log;const i=Object.assign(Object.assign({},Rf),e);if(this.storageKey=i.storageKey,this.instanceID=(r=wn.nextInstanceID[this.storageKey])!==null&&r!==void 0?r:0,wn.nextInstanceID[this.storageKey]=this.instanceID+1,this.logDebugMessages=!!i.debug,typeof i.debug=="function"&&(this.logger=i.debug),this.instanceID>0&&ye()){const o=`${this._logPrefix()} Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key.`;console.warn(o),this.logDebugMessages&&console.trace(o)}if(this.persistSession=i.persistSession,this.autoRefreshToken=i.autoRefreshToken,this.experimental=(n=i.experimental)!==null&&n!==void 0?n:{},this.admin=new pf({url:i.url,headers:i.headers,fetch:i.fetch,experimental:this.experimental}),this.url=i.url,this.headers=i.headers,this.fetch=Ql(i.fetch),this.detectSessionInUrl=i.detectSessionInUrl,this.flowType=i.flowType,this.hasCustomAuthorizationHeader=i.hasCustomAuthorizationHeader,this.throwOnError=i.throwOnError,this.lockAcquireTimeout=i.lockAcquireTimeout,i.lock!=null&&(this.lock=i.lock,qa||(qa=!0,console.warn(`${this._logPrefix()} The "lock" option is deprecated and will be removed in v3. The client now coordinates session refreshes without a lock, so most apps can drop the option. See https://github.com/supabase/supabase-js/blob/master/packages/core/auth-js/migrations/lockless-coordination.md`))),this.jwks||(this.jwks={keys:[]},this.jwks_cached_at=Number.MIN_SAFE_INTEGER),this.mfa={verify:this._verify.bind(this),enroll:this._enroll.bind(this),unenroll:this._unenroll.bind(this),challenge:this._challenge.bind(this),listFactors:this._listFactors.bind(this),challengeAndVerify:this._challengeAndVerify.bind(this),getAuthenticatorAssuranceLevel:this._getAuthenticatorAssuranceLevel.bind(this),webauthn:new Of(this),recoveryCodes:{getStatus:this._getRecoveryCodesStatus.bind(this),generate:this._generateRecoveryCodes.bind(this),verify:this._verifyRecoveryCode.bind(this),regenerate:this._regenerateRecoveryCodes.bind(this),unenroll:this._unenrollRecoveryCodes.bind(this)}},this.oauth={getAuthorizationDetails:this._getAuthorizationDetails.bind(this),approveAuthorization:this._approveAuthorization.bind(this),denyAuthorization:this._denyAuthorization.bind(this),listGrants:this._listOAuthGrants.bind(this),revokeGrant:this._revokeOAuthGrant.bind(this)},this.passkey={startRegistration:this._startPasskeyRegistration.bind(this),verifyRegistration:this._verifyPasskeyRegistration.bind(this),startAuthentication:this._startPasskeyAuthentication.bind(this),verifyAuthentication:this._verifyPasskeyAuthentication.bind(this),list:this._listPasskeys.bind(this),update:this._updatePasskey.bind(this),delete:this._deletePasskey.bind(this)},this.persistSession?(i.storage?this.storage=i.storage:Xl()?this.storage=globalThis.localStorage:(this.memoryStorage={},this.storage=La(this.memoryStorage)),i.userStorage&&(this.userStorage=i.userStorage)):(this.memoryStorage={},this.storage=La(this.memoryStorage)),ye()&&globalThis.BroadcastChannel&&this.persistSession&&this.storageKey){try{this.broadcastChannel=new globalThis.BroadcastChannel(this.storageKey)}catch(o){console.error("Failed to create a new BroadcastChannel, multi-tab state changes will not be available",o)}(s=this.broadcastChannel)===null||s===void 0||s.addEventListener("message",async o=>{this._debug("received broadcast notification from other tab or client",o),(o.data.event==="TOKEN_REFRESHED"||o.data.event==="SIGNED_IN")&&(this.lastRefreshFailure=null);try{await this._notifyAllSubscribers(o.data.event,o.data.session,!1)}catch(a){this._debug("#broadcastChannel","error",a)}})}i.skipAutoInitialize||this.initialize().catch(o=>{this._debug("#initialize()","error",o)})}isThrowOnErrorEnabled(){return this.throwOnError}_returnResult(e){if(this.throwOnError&&e&&e.error)throw e.error;return e}_logPrefix(){return`GoTrueClient@${this.storageKey}:${this.instanceID} (${zl}) ${new Date().toISOString()}`}_debug(...e){return this.logDebugMessages&&this.logger(this._logPrefix(),...e),this}async initialize(){var e;if(this.initializePromise)return await this.initializePromise;this._pendingInitNotifications=[],this.initializePromise=(async()=>this.lock!=null?await this._acquireLock(this.lockAcquireTimeout,async()=>await this._initialize()):await this._initialize())();const r=await this.initializePromise,n=(e=this._pendingInitNotifications)!==null&&e!==void 0?e:[];this._pendingInitNotifications=null;for(const s of n)await this._notifyAllSubscribers(s.event,s.session,s.broadcast);return r}async _initialize(){var e;try{let r={},n="none";if(ye()&&(r=Ra(window.location.href),this._isImplicitGrantCallback(r)?n="implicit":await this._isPKCECallback(r)&&(n="pkce")),ye()&&this.detectSessionInUrl&&n!=="none"){const{data:s,error:i}=await this._getSessionFromURL(r,n);if(i){if(this._debug("#_initialize()","error detecting session from URL",i),Dh(i)){const l=(e=i.details)===null||e===void 0?void 0:e.code;if(l==="identity_already_exists"||l==="identity_not_found"||l==="single_identity_not_deletable")return{error:i}}return{error:i}}const{session:o,redirectType:a}=s;return this._debug("#_initialize()","detected session in URL",o,"redirect type",a),await this._saveSession(o),setTimeout(async()=>{a==="recovery"?await this._notifyAllSubscribers("PASSWORD_RECOVERY",o):await this._notifyAllSubscribers("SIGNED_IN",o)},0),{error:null}}return await this._recoverAndRefresh(),{error:null}}catch(r){return P(r)?this._returnResult({error:r}):this._returnResult({error:new st("Unexpected error during initialization",r)})}finally{await this._handleVisibilityChange(),this._debug("#_initialize()","end")}}async signInAnonymously(e){var r,n,s;try{const i=await L(this.fetch,"POST",`${this.url}/signup`,{headers:this.headers,body:{data:(n=(r=e?.options)===null||r===void 0?void 0:r.data)!==null&&n!==void 0?n:{},gotrue_meta_security:{captcha_token:(s=e?.options)===null||s===void 0?void 0:s.captchaToken}},xform:Ke}),{data:o,error:a}=i;if(a||!o)return this._returnResult({data:{user:null,session:null},error:a});const l=o.session,c=o.user;return o.session&&(await this._saveSession(o.session),await this._notifyAllSubscribers("SIGNED_IN",l)),this._returnResult({data:{user:c,session:l},error:null})}catch(i){if(P(i))return this._returnResult({data:{user:null,session:null},error:i});throw i}}async signUp(e){var r,n,s;let i=null;try{let o;if("email"in e){const{email:d,password:f,options:h}=e;let y=null,v=null;this.flowType==="pkce"&&([y,v,i]=await this._getCodeChallengeAndMethod()),o=await L(this.fetch,"POST",`${this.url}/signup`,{headers:this.headers,redirectTo:this._maybeAppendFlowIdToRedirect(h?.emailRedirectTo,i),body:{email:d,password:f,data:(r=h?.data)!==null&&r!==void 0?r:{},gotrue_meta_security:{captcha_token:h?.captchaToken},code_challenge:y,code_challenge_method:v},xform:Ke})}else if("phone"in e){const{phone:d,password:f,options:h}=e;o=await L(this.fetch,"POST",`${this.url}/signup`,{headers:this.headers,body:{phone:d,password:f,data:(n=h?.data)!==null&&n!==void 0?n:{},channel:(s=h?.channel)!==null&&s!==void 0?s:"sms",gotrue_meta_security:{captcha_token:h?.captchaToken}},xform:Ke})}else throw new rs("You must provide either an email or phone number and a password");const{data:a,error:l}=o;if(l||!a)return await tt(this.storage,this.storageKey,i),this._returnResult({data:{user:null,session:null},error:l});const c=a.session,u=a.user;return a.session&&(await this._saveSession(a.session),await this._notifyAllSubscribers("SIGNED_IN",c)),this._returnResult({data:{user:u,session:c},error:null})}catch(o){if(await tt(this.storage,this.storageKey,i),P(o))return this._returnResult({data:{user:null,session:null},error:o});throw o}}async signInWithPassword(e){try{let r;if("email"in e){const{email:i,password:o,options:a}=e;r=await L(this.fetch,"POST",`${this.url}/token?grant_type=password`,{headers:this.headers,body:{email:i,password:o,gotrue_meta_security:{captcha_token:a?.captchaToken}},xform:Ca})}else if("phone"in e){const{phone:i,password:o,options:a}=e;r=await L(this.fetch,"POST",`${this.url}/token?grant_type=password`,{headers:this.headers,body:{phone:i,password:o,gotrue_meta_security:{captcha_token:a?.captchaToken}},xform:Ca})}else throw new rs("You must provide either an email or phone number and a password");const{data:n,error:s}=r;if(s)return this._returnResult({data:{user:null,session:null},error:s});if(!n||!n.session||!n.user){const i=new Er;return this._returnResult({data:{user:null,session:null},error:i})}return n.session&&(await this._saveSession(n.session),await this._notifyAllSubscribers("SIGNED_IN",n.session)),this._returnResult({data:Object.assign({user:n.user,session:n.session},n.weak_password?{weakPassword:n.weak_password}:null),error:s})}catch(r){if(P(r))return this._returnResult({data:{user:null,session:null},error:r});throw r}}async signInWithOAuth(e){var r,n,s,i;return await this._handleProviderSignIn(e.provider,{redirectTo:(r=e.options)===null||r===void 0?void 0:r.redirectTo,scopes:(n=e.options)===null||n===void 0?void 0:n.scopes,queryParams:(s=e.options)===null||s===void 0?void 0:s.queryParams,skipBrowserRedirect:(i=e.options)===null||i===void 0?void 0:i.skipBrowserRedirect})}async exchangeCodeForSession(e,r){return await this.initializePromise,this.lock!=null?this._acquireLock(this.lockAcquireTimeout,async()=>this._exchangeCodeForSession(e,r)):this._exchangeCodeForSession(e,r)}async signInWithWeb3(e){const{chain:r}=e;switch(r){case"ethereum":return await this.signInWithEthereum(e);case"solana":return await this.signInWithSolana(e);default:throw new Error(`@supabase/auth-js: Unsupported chain "${r}"`)}}async signInWithEthereum(e){var r,n,s,i,o,a,l,c,u,d,f;let h,y;if("message"in e)h=e.message,y=e.signature;else{const{chain:v,wallet:_,statement:R,options:g}=e;let m;if(ye())if(typeof _=="object")m=_;else{const q=window;if("ethereum"in q&&typeof q.ethereum=="object"&&"request"in q.ethereum&&typeof q.ethereum.request=="function")m=q.ethereum;else throw new Error("@supabase/auth-js: No compatible Ethereum wallet interface on the window object (window.ethereum) detected. Make sure the user already has a wallet installed and connected for this app. Prefer passing the wallet interface object directly to signInWithWeb3({ chain: 'ethereum', wallet: resolvedUserWallet }) instead.")}else{if(typeof _!="object"||!g?.url)throw new Error("@supabase/auth-js: Both wallet and url must be specified in non-browser environments.");m=_}const k=new URL((r=g?.url)!==null&&r!==void 0?r:window.location.href),A=await m.request({method:"eth_requestAccounts"}).then(q=>q).catch(()=>{throw new Error("@supabase/auth-js: Wallet method eth_requestAccounts is missing or invalid")});if(!A||A.length===0)throw new Error("@supabase/auth-js: No accounts available. Please ensure the wallet is connected.");const C=ec(A[0]);let x=(n=g?.signInWithEthereum)===null||n===void 0?void 0:n.chainId;if(!x){const q=await m.request({method:"eth_chainId"});x=yf(q)}const W={domain:k.host,address:C,statement:R,uri:k.href,version:"1",chainId:x,nonce:(s=g?.signInWithEthereum)===null||s===void 0?void 0:s.nonce,issuedAt:(o=(i=g?.signInWithEthereum)===null||i===void 0?void 0:i.issuedAt)!==null&&o!==void 0?o:new Date,expirationTime:(a=g?.signInWithEthereum)===null||a===void 0?void 0:a.expirationTime,notBefore:(l=g?.signInWithEthereum)===null||l===void 0?void 0:l.notBefore,requestId:(c=g?.signInWithEthereum)===null||c===void 0?void 0:c.requestId,resources:(u=g?.signInWithEthereum)===null||u===void 0?void 0:u.resources};h=wf(W),y=await m.request({method:"personal_sign",params:[vf(h),C]})}try{const{data:v,error:_}=await L(this.fetch,"POST",`${this.url}/token?grant_type=web3`,{headers:this.headers,body:Object.assign({chain:"ethereum",message:h,signature:y},!((d=e.options)===null||d===void 0)&&d.captchaToken?{gotrue_meta_security:{captcha_token:(f=e.options)===null||f===void 0?void 0:f.captchaToken}}:null),xform:Ke});if(_)throw _;if(!v||!v.session||!v.user){const R=new Er;return this._returnResult({data:{user:null,session:null},error:R})}return v.session&&(await this._saveSession(v.session),await this._notifyAllSubscribers("SIGNED_IN",v.session)),this._returnResult({data:Object.assign({},v),error:_})}catch(v){if(P(v))return this._returnResult({data:{user:null,session:null},error:v});throw v}}async signInWithSolana(e){var r,n,s,i,o,a,l,c,u,d,f,h;let y,v;if("message"in e)y=e.message,v=e.signature;else{const{chain:_,wallet:R,statement:g,options:m}=e;let k;if(ye())if(typeof R=="object")k=R;else{const C=window;if("solana"in C&&typeof C.solana=="object"&&("signIn"in C.solana&&typeof C.solana.signIn=="function"||"signMessage"in C.solana&&typeof C.solana.signMessage=="function"))k=C.solana;else throw new Error("@supabase/auth-js: No compatible Solana wallet interface on the window object (window.solana) detected. Make sure the user already has a wallet installed and connected for this app. Prefer passing the wallet interface object directly to signInWithWeb3({ chain: 'solana', wallet: resolvedUserWallet }) instead.")}else{if(typeof R!="object"||!m?.url)throw new Error("@supabase/auth-js: Both wallet and url must be specified in non-browser environments.");k=R}const A=new URL((r=m?.url)!==null&&r!==void 0?r:window.location.href);if("signIn"in k&&k.signIn){const C=await k.signIn(Object.assign(Object.assign(Object.assign({issuedAt:new Date().toISOString()},m?.signInWithSolana),{version:"1",domain:A.host,uri:A.href}),g?{statement:g}:null));let x;if(Array.isArray(C)&&C[0]&&typeof C[0]=="object")x=C[0];else if(C&&typeof C=="object"&&"signedMessage"in C&&"signature"in C)x=C;else throw new Error("@supabase/auth-js: Wallet method signIn() returned unrecognized value");if("signedMessage"in x&&"signature"in x&&(typeof x.signedMessage=="string"||x.signedMessage instanceof Uint8Array)&&x.signature instanceof Uint8Array)y=typeof x.signedMessage=="string"?x.signedMessage:new TextDecoder().decode(x.signedMessage),v=x.signature;else throw new Error("@supabase/auth-js: Wallet method signIn() API returned object without signedMessage and signature fields")}else{if(!("signMessage"in k)||typeof k.signMessage!="function"||!("publicKey"in k)||typeof k!="object"||!k.publicKey||!("toBase58"in k.publicKey)||typeof k.publicKey.toBase58!="function")throw new Error("@supabase/auth-js: Wallet does not have a compatible signMessage() and publicKey.toBase58() API");y=[`${A.host} wants you to sign in with your Solana account:`,k.publicKey.toBase58(),...g?["",g,""]:[""],"Version: 1",`URI: ${A.href}`,`Issued At: ${(s=(n=m?.signInWithSolana)===null||n===void 0?void 0:n.issuedAt)!==null&&s!==void 0?s:new Date().toISOString()}`,...!((i=m?.signInWithSolana)===null||i===void 0)&&i.notBefore?[`Not Before: ${m.signInWithSolana.notBefore}`]:[],...!((o=m?.signInWithSolana)===null||o===void 0)&&o.expirationTime?[`Expiration Time: ${m.signInWithSolana.expirationTime}`]:[],...!((a=m?.signInWithSolana)===null||a===void 0)&&a.chainId?[`Chain ID: ${m.signInWithSolana.chainId}`]:[],...!((l=m?.signInWithSolana)===null||l===void 0)&&l.nonce?[`Nonce: ${m.signInWithSolana.nonce}`]:[],...!((c=m?.signInWithSolana)===null||c===void 0)&&c.requestId?[`Request ID: ${m.signInWithSolana.requestId}`]:[],...!((d=(u=m?.signInWithSolana)===null||u===void 0?void 0:u.resources)===null||d===void 0)&&d.length?["Resources",...m.signInWithSolana.resources.map(x=>`- ${x}`)]:[]].join(`
`);const C=await k.signMessage(new TextEncoder().encode(y),"utf8");if(!C||!(C instanceof Uint8Array))throw new Error("@supabase/auth-js: Wallet signMessage() API returned an recognized value");v=C}}try{const{data:_,error:R}=await L(this.fetch,"POST",`${this.url}/token?grant_type=web3`,{headers:this.headers,body:Object.assign({chain:"solana",message:y,signature:nr(v)},!((f=e.options)===null||f===void 0)&&f.captchaToken?{gotrue_meta_security:{captcha_token:(h=e.options)===null||h===void 0?void 0:h.captchaToken}}:null),xform:Ke});if(R)throw R;if(!_||!_.session||!_.user){const g=new Er;return this._returnResult({data:{user:null,session:null},error:g})}return _.session&&(await this._saveSession(_.session),await this._notifyAllSubscribers("SIGNED_IN",_.session)),this._returnResult({data:Object.assign({},_),error:R})}catch(_){if(P(_))return this._returnResult({data:{user:null,session:null},error:_});throw _}}async _exchangeCodeForSession(e,r){const n=r?.flowId!=null,s=n?fs(r?.flowId):ye()?fs(Ra(window.location.href)[rr]):null;n&&!s&&this._debug("#_exchangeCodeForSession()","provided flowId is not a valid flow id",r?.flowId);const{verifier:i,flowId:o}=n&&!s?{verifier:null,flowId:null}:await Qh(this.storage,this.storageKey,s),[a,l]=(i??"").split("/");try{if(!a&&this.flowType==="pkce")throw new Uh;const{data:c,error:u}=await L(this.fetch,"POST",`${this.url}/token?grant_type=pkce`,{headers:this.headers,body:{auth_code:e,code_verifier:a},xform:Ke});if(await tt(this.storage,this.storageKey,o),u)throw u;if(!c||!c.session||!c.user){const d=new Er;return this._returnResult({data:{user:null,session:null,redirectType:null},error:d})}return c.session&&(await this._saveSession(c.session),await this._notifyAllSubscribers(l==="recovery"?"PASSWORD_RECOVERY":"SIGNED_IN",c.session)),this._returnResult({data:Object.assign(Object.assign({},c),{redirectType:l??null}),error:u})}catch(c){if(await tt(this.storage,this.storageKey,o),P(c))return this._returnResult({data:{user:null,session:null,redirectType:null},error:c});throw c}}async signInWithIdToken(e){try{const{options:r,provider:n,token:s,access_token:i,nonce:o}=e,a=await L(this.fetch,"POST",`${this.url}/token?grant_type=id_token`,{headers:this.headers,body:{provider:n,id_token:s,access_token:i,nonce:o,gotrue_meta_security:{captcha_token:r?.captchaToken}},xform:Ke}),{data:l,error:c}=a;if(c)return this._returnResult({data:{user:null,session:null},error:c});if(!l||!l.session||!l.user){const u=new Er;return this._returnResult({data:{user:null,session:null},error:u})}return l.session&&(await this._saveSession(l.session),await this._notifyAllSubscribers("SIGNED_IN",l.session)),this._returnResult({data:l,error:c})}catch(r){if(P(r))return this._returnResult({data:{user:null,session:null},error:r});throw r}}async signInWithOtp(e){var r,n,s,i,o;let a=null;try{if("email"in e){const{email:l,options:c}=e;let u=null,d=null;this.flowType==="pkce"&&([u,d,a]=await this._getCodeChallengeAndMethod());const{error:f}=await L(this.fetch,"POST",`${this.url}/otp`,{headers:this.headers,body:{email:l,data:(r=c?.data)!==null&&r!==void 0?r:{},create_user:(n=c?.shouldCreateUser)!==null&&n!==void 0?n:!0,gotrue_meta_security:{captcha_token:c?.captchaToken},code_challenge:u,code_challenge_method:d},redirectTo:this._maybeAppendFlowIdToRedirect(c?.emailRedirectTo,a)});return this._returnResult({data:{user:null,session:null},error:f})}if("phone"in e){const{phone:l,options:c}=e,{data:u,error:d}=await L(this.fetch,"POST",`${this.url}/otp`,{headers:this.headers,body:{phone:l,data:(s=c?.data)!==null&&s!==void 0?s:{},create_user:(i=c?.shouldCreateUser)!==null&&i!==void 0?i:!0,gotrue_meta_security:{captcha_token:c?.captchaToken},channel:(o=c?.channel)!==null&&o!==void 0?o:"sms"}});return this._returnResult({data:{user:null,session:null,messageId:u?.message_id},error:d})}throw new rs("You must provide either an email or phone number.")}catch(l){if(await tt(this.storage,this.storageKey,a),P(l))return this._returnResult({data:{user:null,session:null},error:l});throw l}}async verifyOtp(e){var r,n;try{let s,i;"options"in e&&(s=(r=e.options)===null||r===void 0?void 0:r.redirectTo,i=(n=e.options)===null||n===void 0?void 0:n.captchaToken);const{data:o,error:a}=await L(this.fetch,"POST",`${this.url}/verify`,{headers:this.headers,body:Object.assign(Object.assign({},e),{gotrue_meta_security:{captcha_token:i}}),redirectTo:s,xform:Ke});if(a)throw a;if(!o)throw new Error("An error occurred on token verification.");const l=o.session,c=o.user;return l?.access_token&&(await this._saveSession(l),await this._notifyAllSubscribers(e.type=="recovery"?"PASSWORD_RECOVERY":"SIGNED_IN",l)),this._returnResult({data:{user:c,session:l},error:null})}catch(s){if(P(s))return this._returnResult({data:{user:null,session:null},error:s});throw s}}async signInWithSSO(e){var r,n,s,i;let o=null;try{let a=null,l=null;this.flowType==="pkce"&&([a,l,o]=await this._getCodeChallengeAndMethod());const c=await L(this.fetch,"POST",`${this.url}/sso`,{body:Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({},"providerId"in e?{provider_id:e.providerId}:null),"domain"in e?{domain:e.domain}:null),{redirect_to:this._maybeAppendFlowIdToRedirect((r=e.options)===null||r===void 0?void 0:r.redirectTo,o)}),!((n=e?.options)===null||n===void 0)&&n.captchaToken?{gotrue_meta_security:{captcha_token:e.options.captchaToken}}:null),{skip_http_redirect:!0,code_challenge:a,code_challenge_method:l}),headers:this.headers,xform:df});return!((s=c.data)===null||s===void 0)&&s.url&&ye()&&!(!((i=e.options)===null||i===void 0)&&i.skipBrowserRedirect)&&window.location.assign(c.data.url),this._returnResult(c)}catch(a){if(await tt(this.storage,this.storageKey,o),P(a))return this._returnResult({data:null,error:a});throw a}}async reauthenticate(){return await this.initializePromise,this.lock!=null?await this._acquireLock(this.lockAcquireTimeout,async()=>await this._reauthenticate()):await this._reauthenticate()}async _reauthenticate(){try{return await this._useSession(async e=>{const{data:{session:r},error:n}=e;if(n)throw n;if(!r)throw new me;const{error:s}=await L(this.fetch,"GET",`${this.url}/reauthenticate`,{headers:this.headers,jwt:r.access_token});return this._returnResult({data:{user:null,session:null},error:s})})}catch(e){if(P(e))return this._returnResult({data:{user:null,session:null},error:e});throw e}}async resend(e){let r=null;try{const n=`${this.url}/resend`;if("email"in e){const{email:s,type:i,options:o}=e;let a=null,l=null;this.flowType==="pkce"&&([a,l,r]=await this._getCodeChallengeAndMethod());const{error:c}=await L(this.fetch,"POST",n,{headers:this.headers,body:{email:s,type:i,gotrue_meta_security:{captcha_token:o?.captchaToken},code_challenge:a,code_challenge_method:l},redirectTo:this._maybeAppendFlowIdToRedirect(o?.emailRedirectTo,r)});return c&&await tt(this.storage,this.storageKey,r),this._returnResult({data:{user:null,session:null},error:c})}else if("phone"in e){const{phone:s,type:i,options:o}=e,{data:a,error:l}=await L(this.fetch,"POST",n,{headers:this.headers,body:{phone:s,type:i,gotrue_meta_security:{captcha_token:o?.captchaToken}}});return this._returnResult({data:{user:null,session:null,messageId:a?.message_id},error:l})}throw new rs("You must provide either an email or phone number and a type")}catch(n){if(await tt(this.storage,this.storageKey,r),P(n))return this._returnResult({data:{user:null,session:null},error:n});throw n}}async getSession(){return await this.initializePromise,this.lock!=null?await this._acquireLock(this.lockAcquireTimeout,async()=>this._useSession(async e=>e)):await this._useSession(async e=>e)}async _acquireLock(e,r){this._debug("#_acquireLock","begin",e);try{if(this.lockAcquired){const n=this.pendingInLock.length?this.pendingInLock[this.pendingInLock.length-1]:Promise.resolve(),s=(async()=>(await n,await r()))();return this.pendingInLock.push((async()=>{try{await s}catch{}})()),s}return await this.lock(`lock:${this.storageKey}`,e,async()=>{this._debug("#_acquireLock","lock acquired for storage key",this.storageKey);try{this.lockAcquired=!0;const n=r();for(this.pendingInLock.push((async()=>{try{await n}catch{}})()),await n;this.pendingInLock.length;){const s=[...this.pendingInLock];await Promise.all(s),this.pendingInLock.splice(0,s.length)}return await n}finally{this._debug("#_acquireLock","lock released for storage key",this.storageKey),this.lockAcquired=!1}})}finally{this._debug("#_acquireLock","end")}}async _useSession(e){this._debug("#_useSession","begin");try{const r=await this.__loadSession();return await e(r)}finally{this._debug("#_useSession","end")}}async __loadSession(){this._debug("#__loadSession()","begin"),this.lock!=null&&!this.lockAcquired&&this._debug("#__loadSession()","used outside of an acquired lock!",new Error().stack);try{let e=null;const r=await be(this.storage,this.storageKey);if(this._debug("#getSession()","session from storage",r),r!==null&&(this._isValidSession(r)?e=r:(this._debug("#getSession()","session from storage is not valid"),await this._removeSession())),!e)return{data:{session:null},error:null};const n=e.expires_at?e.expires_at*1e3-Date.now()<Ei:!1;if(this._debug("#__loadSession()",`session has${n?"":" not"} expired`,"expires_at",e.expires_at),!n)return{data:{session:await this._hydrateSessionUser(e)},error:null};const{data:s,error:i}=await this._callRefreshToken(e.refresh_token);if(i){const o=await be(this.storage,this.storageKey);return o&&this._isValidSession(o)&&o.expires_at&&o.expires_at*1e3>Date.now()?this._returnResult({data:{session:await this._hydrateSessionUser(o)},error:null}):this._returnResult({data:{session:null},error:i})}return this._returnResult({data:{session:s},error:null})}finally{this._debug("#__loadSession()","end")}}async _hydrateSessionUser(e){if(this.userStorage){const r=await be(this.userStorage,this.storageKey+"-user");e.user=r?.user?r.user:Ti()}if(this.storage.isServer&&e.user&&!e.user.__isUserNotAvailableProxy){const r={value:this.suppressGetSessionWarning};e.user=lf(e.user,r),r.value&&(this.suppressGetSessionWarning=!0)}return e}async getUser(e){if(e)return await this._getUser(e);await this.initializePromise;let r;return this.lock!=null?r=await this._acquireLock(this.lockAcquireTimeout,async()=>await this._getUser()):r=await this._getUser(),r.data.user&&(this.suppressGetSessionWarning=!0),r}async _getUser(e){try{return e?await L(this.fetch,"GET",`${this.url}/user`,{headers:this.headers,jwt:e,xform:jt}):await this._useSession(async r=>{var n,s,i;const{data:o,error:a}=r;if(a)throw a;return!(!((n=o.session)===null||n===void 0)&&n.access_token)&&!this.hasCustomAuthorizationHeader?{data:{user:null},error:new me}:await L(this.fetch,"GET",`${this.url}/user`,{headers:this.headers,jwt:(i=(s=o.session)===null||s===void 0?void 0:s.access_token)!==null&&i!==void 0?i:void 0,xform:jt})})}catch(r){if(P(r))return ts(r)&&await this._removeSession(),this._returnResult({data:{user:null},error:r});throw r}}async updateUser(e,r={}){return await this.initializePromise,this.lock!=null?await this._acquireLock(this.lockAcquireTimeout,async()=>await this._updateUser(e,r)):await this._updateUser(e,r)}async _updateUser(e,r={}){let n=null;try{return await this._useSession(async s=>{const{data:i,error:o}=s;if(o)throw o;if(!i.session)throw new me;const a=i.session;let l=null,c=null;this.flowType==="pkce"&&e.email!=null&&([l,c,n]=await this._getCodeChallengeAndMethod());const{data:u,error:d}=await L(this.fetch,"PUT",`${this.url}/user`,{headers:this.headers,redirectTo:this._maybeAppendFlowIdToRedirect(r?.emailRedirectTo,n),body:Object.assign(Object.assign({},e),{code_challenge:l,code_challenge_method:c}),jwt:a.access_token,xform:jt});if(d)throw d;return a.user=u.user,await this._saveSession(a),await this._notifyAllSubscribers("USER_UPDATED",a),this._returnResult({data:{user:a.user},error:null})})}catch(s){if(await tt(this.storage,this.storageKey,n),P(s))return this._returnResult({data:{user:null},error:s});throw s}}async setSession(e){return await this.initializePromise,this.lock!=null?await this._acquireLock(this.lockAcquireTimeout,async()=>await this._setSession(e)):await this._setSession(e)}async _setSession(e){try{if(!e.access_token||!e.refresh_token)throw new me;const r=Date.now()/1e3;let n=r,s=!0,i=null;const{payload:o}=is(e.access_token);if(o.exp&&(n=o.exp,s=n<=r),s){const{data:a,error:l}=await this._callRefreshToken(e.refresh_token);if(l)return this._returnResult({data:{user:null,session:null},error:l});if(!a)return{data:{user:null,session:null},error:null};i=a}else{const{data:a,error:l}=await this._getUser(e.access_token);if(l)return this._returnResult({data:{user:null,session:null},error:l});i={access_token:e.access_token,refresh_token:e.refresh_token,user:a.user,token_type:"bearer",expires_in:n-r,expires_at:n},await this._saveSession(i),await this._notifyAllSubscribers("SIGNED_IN",i)}return this._returnResult({data:{user:i.user,session:i},error:null})}catch(r){if(P(r))return this._returnResult({data:{session:null,user:null},error:r});throw r}}async refreshSession(e){return await this.initializePromise,this.lock!=null?await this._acquireLock(this.lockAcquireTimeout,async()=>await this._refreshSession(e)):await this._refreshSession(e)}async _refreshSession(e){try{return await this._useSession(async r=>{var n;if(!e){const{data:o,error:a}=r;if(a)throw a;e=(n=o.session)!==null&&n!==void 0?n:void 0}if(!e?.refresh_token)throw new me;const{data:s,error:i}=await this._callRefreshToken(e.refresh_token);return i?this._returnResult({data:{user:null,session:null},error:i}):s?this._returnResult({data:{user:s.user,session:s},error:null}):this._returnResult({data:{user:null,session:null},error:null})})}catch(r){if(P(r))return this._returnResult({data:{user:null,session:null},error:r});throw r}}async _getSessionFromURL(e,r){var n;try{if(!ye())throw new ns("No browser detected.");if(e.error||e.error_description||e.error_code)throw new ns(e.error_description||"Error in URL with unspecified error_description",{error:e.error||"unspecified_error",code:e.error_code||"unspecified_code"});switch(r){case"implicit":if(this.flowType==="pkce")throw new ba("Not a valid PKCE flow url.");break;case"pkce":if(this.flowType==="implicit")throw new ns("Not a valid implicit grant flow url.");break;default:}if(r==="pkce"){if(this._debug("#_initialize()","begin","is PKCE flow",!0),!e.code)throw new ba("No code detected.");const{data:m,error:k}=await this._exchangeCodeForSession(e.code,{flowId:e[rr]});if(k)throw k;const A=new URL(window.location.href);return A.searchParams.delete("code"),A.searchParams.delete(rr),window.history.replaceState(window.history.state,"",A.toString()),{data:{session:m.session,redirectType:(n=m.redirectType)!==null&&n!==void 0?n:null},error:null}}const{provider_token:s,provider_refresh_token:i,access_token:o,refresh_token:a,expires_in:l,expires_at:c,token_type:u}=e;if(!o||!l||!a||!u)throw new ns("No session defined in URL");const d=Math.round(Date.now()/1e3),f=parseInt(l);let h=d+f;c&&(h=parseInt(c));const y=h-d;y*1e3<=Tt&&console.warn(`@supabase/gotrue-js: Session as retrieved from URL expires in ${y}s, should have been closer to ${f}s`);const v=h-f;d-v>=120?console.warn("@supabase/gotrue-js: Session as retrieved from URL was issued over 120s ago, URL could be stale",v,h,d):d-v<0&&console.warn("@supabase/gotrue-js: Session as retrieved from URL was issued in the future? Check the device clock for skew",v,h,d);const{data:_,error:R}=await this._getUser(o);if(R)throw R;const g={provider_token:s,provider_refresh_token:i,access_token:o,expires_in:f,expires_at:h,refresh_token:a,token_type:u,user:_.user};return window.location.hash="",this._debug("#_getSessionFromURL()","clearing window.location.hash"),this._returnResult({data:{session:g,redirectType:e.type},error:null})}catch(s){if(P(s))return this._returnResult({data:{session:null,redirectType:null},error:s});throw s}}_isImplicitGrantCallback(e){return typeof this.detectSessionInUrl=="function"?this.detectSessionInUrl(new URL(window.location.href),e):!!(e.access_token||e.error||e.error_description||e.error_code)}async _isPKCECallback(e){if(!e.code)return!1;const r=fs(e[rr]);return r&&await be(this.storage,Nr(this.storageKey,r))?!0:!!await be(this.storage,`${this.storageKey}-code-verifier`)}async signOut(e={scope:"global"}){return await this.initializePromise,this.lock!=null?await this._acquireLock(this.lockAcquireTimeout,async()=>await this._signOut(e)):await this._signOut(e)}async _signOut({scope:e}={scope:"global"}){return await this._useSession(async r=>{var n;const s=async()=>{await this._removeSession()},{data:i,error:o}=r;if(o&&!ts(o))return this._returnResult({error:o});const a=(n=i.session)===null||n===void 0?void 0:n.access_token;if(a){const{error:l}=await this.admin.signOut(a,e);if(l&&!(_a(l)&&(l.status===404||l.status===401||l.status===403)||ts(l)))return e!=="others"&&await s(),this._returnResult({error:l})}return e!=="others"&&await s(),this._returnResult({error:null})})}onAuthStateChange(e){const r=Fh(),n={id:r,callback:e,unsubscribe:()=>{this._debug("#unsubscribe()","state change callback with id removed",r),this.stateChangeEmitters.delete(r)}};return this._debug("#onAuthStateChange()","registered callback with id",r),this.stateChangeEmitters.set(r,n),(async()=>(await this.initializePromise,this.lock!=null?await this._acquireLock(this.lockAcquireTimeout,async()=>{this._emitInitialSession(r)}):await this._emitInitialSession(r)))(),{data:{subscription:n}}}async _emitInitialSession(e){return await this._useSession(async r=>{var n,s;try{const{data:{session:i},error:o}=r;if(o)throw o;await((n=this.stateChangeEmitters.get(e))===null||n===void 0?void 0:n.callback("INITIAL_SESSION",i)),this._debug("INITIAL_SESSION","callback id",e,"session",i)}catch(i){if(await((s=this.stateChangeEmitters.get(e))===null||s===void 0?void 0:s.callback("INITIAL_SESSION",null)),this._debug("INITIAL_SESSION","callback id",e,"error",i),ka(i))return;ts(i)||ss(i)||_a(i)&&(i.code==="refresh_token_not_found"||i.code==="refresh_token_already_used"||i.code==="session_expired")?console.warn(i):console.error(i)}})}async resetPasswordForEmail(e,r={}){let n=null,s=null,i=null;this.flowType==="pkce"&&([n,s,i]=await this._getCodeChallengeAndMethod(!0));try{return await L(this.fetch,"POST",`${this.url}/recover`,{body:{email:e,code_challenge:n,code_challenge_method:s,gotrue_meta_security:{captcha_token:r.captchaToken}},headers:this.headers,redirectTo:this._maybeAppendFlowIdToRedirect(r.redirectTo,i)})}catch(o){if(await tt(this.storage,this.storageKey,i),P(o))return this._returnResult({data:null,error:o});throw o}}async getUserIdentities(){var e;try{const{data:r,error:n}=await this.getUser();if(n)throw n;return this._returnResult({data:{identities:(e=r.user.identities)!==null&&e!==void 0?e:[]},error:null})}catch(r){if(P(r))return this._returnResult({data:null,error:r});throw r}}async linkIdentity(e){return"token"in e?this.linkIdentityIdToken(e):this.linkIdentityOAuth(e)}async linkIdentityOAuth(e){var r;let n=null;try{const{data:s,error:i}=await this._useSession(async o=>{var a,l,c,u,d;const{data:f,error:h}=o;if(h)throw h;const{url:y,flowId:v}=await this._getUrlForProvider(`${this.url}/user/identities/authorize`,e.provider,{redirectTo:(a=e.options)===null||a===void 0?void 0:a.redirectTo,scopes:(l=e.options)===null||l===void 0?void 0:l.scopes,queryParams:(c=e.options)===null||c===void 0?void 0:c.queryParams,skipBrowserRedirect:!0});return n=v,await L(this.fetch,"GET",y,{headers:this.headers,jwt:(d=(u=f.session)===null||u===void 0?void 0:u.access_token)!==null&&d!==void 0?d:void 0})});if(i)throw i;return ye()&&!(!((r=e.options)===null||r===void 0)&&r.skipBrowserRedirect)&&window.location.assign(s?.url),this._returnResult({data:{provider:e.provider,url:s?.url,flowId:n},error:null})}catch(s){if(P(s))return this._returnResult({data:{provider:e.provider,url:null,flowId:n},error:s});throw s}}async linkIdentityIdToken(e){return await this._useSession(async r=>{var n;try{const{error:s,data:{session:i}}=r;if(s)throw s;const{options:o,provider:a,token:l,access_token:c,nonce:u}=e,d=await L(this.fetch,"POST",`${this.url}/token?grant_type=id_token`,{headers:this.headers,jwt:(n=i?.access_token)!==null&&n!==void 0?n:void 0,body:{provider:a,id_token:l,access_token:c,nonce:u,link_identity:!0,gotrue_meta_security:{captcha_token:o?.captchaToken}},xform:Ke}),{data:f,error:h}=d;return h?this._returnResult({data:{user:null,session:null},error:h}):!f||!f.session||!f.user?this._returnResult({data:{user:null,session:null},error:new Er}):(f.session&&(await this._saveSession(f.session),await this._notifyAllSubscribers("USER_UPDATED",f.session)),this._returnResult({data:f,error:h}))}catch(s){if(await tt(this.storage,this.storageKey,null),P(s))return this._returnResult({data:{user:null,session:null},error:s});throw s}})}async unlinkIdentity(e){try{return await this._useSession(async r=>{var n,s;const{data:i,error:o}=r;if(o)throw o;return await L(this.fetch,"DELETE",`${this.url}/user/identities/${e.identity_id}`,{headers:this.headers,jwt:(s=(n=i.session)===null||n===void 0?void 0:n.access_token)!==null&&s!==void 0?s:void 0})})}catch(r){if(P(r))return this._returnResult({data:null,error:r});throw r}}async _refreshAccessToken(e){const r="#_refreshAccessToken()";this._debug(r,"begin");try{const n=Date.now();return await Gh(async s=>(s>0&&await Hh(200*Math.pow(2,s-1)),this._debug(r,"refreshing attempt",s),await L(this.fetch,"POST",`${this.url}/token?grant_type=refresh_token`,{body:{refresh_token:e},headers:this.headers,xform:Ke})),(s,i)=>{const o=200*Math.pow(2,s);return i&&ss(i)&&Date.now()+o-n<Tt})}catch(n){if(this._debug(r,"error",n),P(n))return this._returnResult({data:{session:null,user:null},error:n});throw n}finally{this._debug(r,"end")}}_isValidSession(e){return typeof e=="object"&&e!==null&&"access_token"in e&&"refresh_token"in e&&"expires_at"in e}async _handleProviderSignIn(e,r){const{url:n,flowId:s}=await this._getUrlForProvider(`${this.url}/authorize`,e,{redirectTo:r.redirectTo,scopes:r.scopes,queryParams:r.queryParams});return this._debug("#_handleProviderSignIn()","provider",e,"options",r,"url",n),ye()&&!r.skipBrowserRedirect&&window.location.assign(n),{data:{provider:e,url:n,flowId:s},error:null}}async _recoverAndRefresh(){var e,r;const n="#_recoverAndRefresh()";this._debug(n,"begin");try{const s=await be(this.storage,this.storageKey);if(s&&this.userStorage){let o=await be(this.userStorage,this.storageKey+"-user");!this.storage.isServer&&Object.is(this.storage,this.userStorage)&&!o&&(o={user:s.user},await At(this.userStorage,this.storageKey+"-user",o)),s.user=(e=o?.user)!==null&&e!==void 0?e:Ti()}else if(s&&!s.user&&!s.user){const o=await be(this.storage,this.storageKey+"-user");o&&o?.user?(s.user=o.user,await Pe(this.storage,this.storageKey+"-user"),await At(this.storage,this.storageKey,s)):s.user=Ti()}if(this._debug(n,"session from storage",s),!this._isValidSession(s)){this._debug(n,"session is not valid"),s!==null&&await this._removeSession();return}const i=((r=s.expires_at)!==null&&r!==void 0?r:1/0)*1e3-Date.now()<Ei;if(this._debug(n,`session has${i?"":" not"} expired with margin of ${Ei}s`),i){if(this.autoRefreshToken&&s.refresh_token){const{error:o}=await this._callRefreshToken(s.refresh_token);o&&(ka(o)?this._debug(n,"refresh discarded by commit guard",o):this._debug(n,"refresh failed",o))}}else if(s.user&&s.user.__isUserNotAvailableProxy===!0)try{const{data:o,error:a}=await this._getUser(s.access_token);!a&&o?.user?(s.user=o.user,await this._saveSession(s),await this._notifyAllSubscribers("SIGNED_IN",s)):this._debug(n,"could not get user data, skipping SIGNED_IN notification")}catch(o){console.error("Error getting user data:",o),this._debug(n,"error getting user data, skipping SIGNED_IN notification",o)}else await this._notifyAllSubscribers("SIGNED_IN",s)}catch(s){this._debug(n,"error",s),ss(s)?console.warn(s):console.error(s);return}finally{this._debug(n,"end")}}async _callRefreshToken(e){var r,n;if(!e)throw new me;if(this.refreshingDeferred)return this.refreshingDeferred.promise;if(this.lastRefreshFailure&&this.lastRefreshFailure.refreshToken===e&&Date.now()<this.lastRefreshFailure.expiresAt)return this._debug("#_callRefreshToken()","returning cached failure (cooldown active)"),this.lastRefreshFailure.result;const s="#_callRefreshToken()";this._debug(s,"begin");try{this.refreshingDeferred=new ri,this.refreshingDeferred.promise.then(void 0,()=>{});const i=await be(this.storage,this.storageKey),{data:o,error:a}=await this._refreshAccessToken(e);if(a)throw a;if(!o.session)throw new me;const l=await be(this.storage,this.storageKey);if(i!==null&&(l===null||l.refresh_token!==i.refresh_token)){this._debug(s,"commit guard: storage changed since refresh started, discarding rotated tokens",{startedWith:"present",nowHolds:l?"replaced":"cleared"});const f={data:null,error:new Sa};return this.refreshingDeferred.resolve(f),f}const u=this._sessionRemovalEpoch;if(await this._saveSession(o.session),this._sessionRemovalEpoch!==u){this._debug(s,"commit guard (post-save): _removeSession ran during _saveSession, undoing write"),await Pe(this.storage,this.storageKey),this.userStorage&&await Pe(this.userStorage,this.storageKey+"-user");const f={data:null,error:new Sa};return this.refreshingDeferred.resolve(f),f}await this._notifyAllSubscribers("TOKEN_REFRESHED",o.session);const d={data:o.session,error:null};return this.lastRefreshFailure=null,this.refreshingDeferred.resolve(d),d}catch(i){if(this._debug(s,"error",i),P(i)){const o={data:null,error:i};if(!ss(i)){const a=await be(this.storage,this.storageKey);!!(a?.expires_at&&a.expires_at*1e3>Date.now())?this._debug(s,"proactive refresh failed, access token still valid — preserving session"):await this._removeSession()}return this.lastRefreshFailure={refreshToken:e,result:o,expiresAt:Date.now()+Oh},(r=this.refreshingDeferred)===null||r===void 0||r.resolve(o),o}throw(n=this.refreshingDeferred)===null||n===void 0||n.reject(i),i}finally{this.refreshingDeferred=null,this._debug(s,"end")}}async _notifyAllSubscribers(e,r,n=!0){if(this._pendingInitNotifications!==null&&n){this._pendingInitNotifications.push({event:e,session:r,broadcast:n});return}const s=`#_notifyAllSubscribers(${e})`;this._debug(s,"begin",r,`broadcast = ${n}`);try{this.broadcastChannel&&n&&this.broadcastChannel.postMessage({event:e,session:r});const i=[],o=Array.from(this.stateChangeEmitters.values()).map(async a=>{try{await a.callback(e,r)}catch(l){i.push(l)}});if(await Promise.all(o),i.length>0){for(let a=0;a<i.length;a+=1)console.error(i[a]);throw i[0]}}finally{this._debug(s,"end")}}async _saveSession(e){this._debug("#_saveSession()",e),this.suppressGetSessionWarning=!0;const r=Object.assign({},e),n=r.user&&r.user.__isUserNotAvailableProxy===!0;if(this.userStorage){!n&&r.user&&await At(this.userStorage,this.storageKey+"-user",{user:r.user});const s=Object.assign({},r);delete s.user;const i=$a(s);await At(this.storage,this.storageKey,i)}else{const s=$a(r);await At(this.storage,this.storageKey,s)}}async _removeSession(){this._sessionRemovalEpoch+=1,this._debug("#_removeSession()"),this.lastRefreshFailure=null,this.suppressGetSessionWarning=!1,await Pe(this.storage,this.storageKey),await Zh(this.storage,this.storageKey),await Pe(this.storage,this.storageKey+"-user"),this.userStorage&&await Pe(this.userStorage,this.storageKey+"-user"),await this._notifyAllSubscribers("SIGNED_OUT",null)}_removeVisibilityChangedCallback(){this._debug("#_removeVisibilityChangedCallback()");const e=this.visibilityChangedCallback;this.visibilityChangedCallback=null;try{e&&ye()&&window?.removeEventListener&&window.removeEventListener("visibilitychange",e)}catch(r){console.error("removing visibilitychange callback failed",r)}}async _startAutoRefresh(){await this._stopAutoRefresh(),this._debug("#_startAutoRefresh()");const e=setInterval(()=>this._autoRefreshTokenTick(),Tt);this.autoRefreshTicker=e,e&&typeof e=="object"&&typeof e.unref=="function"?e.unref():typeof Deno<"u"&&typeof Deno.unrefTimer=="function"&&Deno.unrefTimer(e);const r=setTimeout(async()=>{await this.initializePromise,await this._autoRefreshTokenTick()},0);this.autoRefreshTickTimeout=r,r&&typeof r=="object"&&typeof r.unref=="function"?r.unref():typeof Deno<"u"&&typeof Deno.unrefTimer=="function"&&Deno.unrefTimer(r)}async _stopAutoRefresh(){this._debug("#_stopAutoRefresh()");const e=this.autoRefreshTicker;this.autoRefreshTicker=null,e&&clearInterval(e);const r=this.autoRefreshTickTimeout;this.autoRefreshTickTimeout=null,r&&clearTimeout(r)}async startAutoRefresh(){this._removeVisibilityChangedCallback(),await this._startAutoRefresh()}async stopAutoRefresh(){this._removeVisibilityChangedCallback(),await this._stopAutoRefresh()}async dispose(){var e;this._removeVisibilityChangedCallback(),await this._stopAutoRefresh(),(e=this.broadcastChannel)===null||e===void 0||e.close(),this.broadcastChannel=null,this.stateChangeEmitters.clear()}async _autoRefreshTokenTick(){if(this._debug("#_autoRefreshTokenTick()","begin"),this.lock!=null){try{await this._acquireLock(0,async()=>{try{const e=Date.now();try{return await this._useSession(async r=>{const{data:{session:n}}=r;if(!n||!n.refresh_token||!n.expires_at){this._debug("#_autoRefreshTokenTick()","no session");return}const s=Math.floor((n.expires_at*1e3-e)/Tt);this._debug("#_autoRefreshTokenTick()",`access token expires in ${s} ticks, a tick lasts ${Tt}ms, refresh threshold is ${on} ticks`),s<=on&&await this._callRefreshToken(n.refresh_token)})}catch(r){console.error("Auto refresh tick failed with error. This is likely a transient error.",r)}}finally{this._debug("#_autoRefreshTokenTick()","end")}})}catch(e){if(e instanceof mf)this._debug("auto refresh token tick lock not available");else throw e}return}if(this.refreshingDeferred!==null){this._debug("#_autoRefreshTokenTick()","refresh already in flight, skipping");return}try{const e=Date.now();try{await this._useSession(async r=>{const{data:{session:n}}=r;if(!n||!n.refresh_token||!n.expires_at){this._debug("#_autoRefreshTokenTick()","no session");return}const s=Math.floor((n.expires_at*1e3-e)/Tt);this._debug("#_autoRefreshTokenTick()",`access token expires in ${s} ticks, a tick lasts ${Tt}ms, refresh threshold is ${on} ticks`),s<=on&&await this._callRefreshToken(n.refresh_token)})}catch(r){console.error("Auto refresh tick failed with error. This is likely a transient error.",r)}}finally{this._debug("#_autoRefreshTokenTick()","end")}}async _handleVisibilityChange(){if(this._debug("#_handleVisibilityChange()"),!ye()||!window?.addEventListener)return this.autoRefreshToken&&this.startAutoRefresh(),!1;try{this.visibilityChangedCallback=async()=>{try{await this._onVisibilityChanged(!1)}catch(e){this._debug("#visibilityChangedCallback","error",e)}},window?.addEventListener("visibilitychange",this.visibilityChangedCallback),await this._onVisibilityChanged(!0)}catch(e){console.error("_handleVisibilityChange",e)}}async _onVisibilityChanged(e){const r=`#_onVisibilityChanged(${e})`;if(this._debug(r,"visibilityState",document.visibilityState),document.visibilityState==="visible"){if(this.autoRefreshToken&&this._startAutoRefresh(),!e)if(await this.initializePromise,this.lock!=null)await this._acquireLock(this.lockAcquireTimeout,async()=>{if(document.visibilityState!=="visible"){this._debug(r,"acquired the lock to recover the session, but the browser visibilityState is no longer visible, aborting");return}await this._recoverAndRefresh()});else{if(document.visibilityState!=="visible"){this._debug(r,"visibilityState is no longer visible, skipping recovery");return}await this._recoverAndRefresh()}}else document.visibilityState==="hidden"&&this.autoRefreshToken&&this._stopAutoRefresh()}async _getUrlForProvider(e,r,n){let s=n?.redirectTo,i=null,o=null,a=null;this.flowType==="pkce"&&([i,o,a]=await this._getCodeChallengeAndMethod(),s=this._maybeAppendFlowIdToRedirect(s,a));const l=[`provider=${encodeURIComponent(r)}`];if(s&&l.push(`redirect_to=${encodeURIComponent(s)}`),n?.scopes&&l.push(`scopes=${encodeURIComponent(n.scopes)}`),i!=null&&o!=null){const c=new URLSearchParams({code_challenge:`${encodeURIComponent(i)}`,code_challenge_method:`${encodeURIComponent(o)}`});l.push(c.toString())}if(n?.queryParams){const c=new URLSearchParams(n.queryParams);l.push(c.toString())}return n?.skipBrowserRedirect&&l.push(`skip_http_redirect=${n.skipBrowserRedirect}`),{url:`${e}?${l.join("&")}`,flowId:a}}_maybeAppendFlowIdToRedirect(e,r){return!e||!r||!this.experimental.appendPkceFlowIdToRedirects?e??void 0:ef(e,r)}async _getCodeChallengeAndMethod(e=!1){return tf(this.storage,this.storageKey,e,r=>this._debug("#_getCodeChallengeAndMethod()","evicted oldest pending PKCE verifier slot",r))}async _unenroll(e){try{return await this._useSession(async r=>{var n;const{data:s,error:i}=r;return i?this._returnResult({data:null,error:i}):await L(this.fetch,"DELETE",`${this.url}/factors/${e.factorId}`,{headers:this.headers,jwt:(n=s?.session)===null||n===void 0?void 0:n.access_token})})}catch(r){if(P(r))return this._returnResult({data:null,error:r});throw r}}async _enroll(e){try{return await this._useSession(async r=>{var n,s;const{data:i,error:o}=r;if(o)return this._returnResult({data:null,error:o});const a=Object.assign({friendly_name:e.friendlyName,factor_type:e.factorType},e.factorType==="phone"?{phone:e.phone}:e.factorType==="totp"?{issuer:e.issuer}:{}),{data:l,error:c}=await L(this.fetch,"POST",`${this.url}/factors`,{body:a,headers:this.headers,jwt:(n=i?.session)===null||n===void 0?void 0:n.access_token});return c?this._returnResult({data:null,error:c}):(e.factorType==="totp"&&l.type==="totp"&&(!((s=l?.totp)===null||s===void 0)&&s.qr_code)&&(l.totp.qr_code=`data:image/svg+xml;utf-8,${l.totp.qr_code}`),this._returnResult({data:l,error:null}))})}catch(r){if(P(r))return this._returnResult({data:null,error:r});throw r}}async _verify(e){const r=async()=>{try{return await this._useSession(async n=>{var s;const{data:i,error:o}=n;if(o)return this._returnResult({data:null,error:o});const a=Object.assign({challenge_id:e.challengeId},"webauthn"in e?{webauthn:Object.assign(Object.assign({},e.webauthn),{credential_response:e.webauthn.type==="create"?ja(e.webauthn.credential_response):Na(e.webauthn.credential_response)})}:{code:e.code}),{data:l,error:c}=await L(this.fetch,"POST",`${this.url}/factors/${e.factorId}/verify`,{body:a,headers:this.headers,jwt:(s=i?.session)===null||s===void 0?void 0:s.access_token});return c?this._returnResult({data:null,error:c}):(await this._saveSession(Object.assign({expires_at:Math.round(Date.now()/1e3)+l.expires_in},l)),await this._notifyAllSubscribers("MFA_CHALLENGE_VERIFIED",l),this._returnResult({data:l,error:c}))})}catch(n){if(P(n))return this._returnResult({data:null,error:n});throw n}};return this.lock!=null?this._acquireLock(this.lockAcquireTimeout,r):r()}async _challenge(e){const r=async()=>{try{return await this._useSession(async n=>{var s;const{data:i,error:o}=n;if(o)return this._returnResult({data:null,error:o});const a=await L(this.fetch,"POST",`${this.url}/factors/${e.factorId}/challenge`,{body:e,headers:this.headers,jwt:(s=i?.session)===null||s===void 0?void 0:s.access_token});if(a.error)return a;const{data:l}=a;if(l.type!=="webauthn")return{data:l,error:null};switch(l.webauthn.type){case"create":return{data:Object.assign(Object.assign({},l),{webauthn:Object.assign(Object.assign({},l.webauthn),{credential_options:Object.assign(Object.assign({},l.webauthn.credential_options),{publicKey:Da(l.webauthn.credential_options.publicKey)})})}),error:null};case"request":return{data:Object.assign(Object.assign({},l),{webauthn:Object.assign(Object.assign({},l.webauthn),{credential_options:Object.assign(Object.assign({},l.webauthn.credential_options),{publicKey:Ua(l.webauthn.credential_options.publicKey)})})}),error:null}}})}catch(n){if(P(n))return this._returnResult({data:null,error:n});throw n}};return this.lock!=null?this._acquireLock(this.lockAcquireTimeout,r):r()}async _challengeAndVerify(e){const{data:r,error:n}=await this._challenge({factorId:e.factorId});return n?this._returnResult({data:null,error:n}):await this._verify({factorId:e.factorId,challengeId:r.id,code:e.code})}async _listFactors(){var e;const{data:{user:r},error:n}=await this.getUser();if(n)return{data:null,error:n};const s={all:[],phone:[],totp:[],webauthn:[],recovery_code:[]};for(const i of(e=r?.factors)!==null&&e!==void 0?e:[])s.all.push(i),i.status==="verified"&&i.factor_type in s&&Array.isArray(s[i.factor_type])&&s[i.factor_type].push(i);return{data:s,error:null}}async _getAuthenticatorAssuranceLevel(e){var r,n,s,i;if(e)try{const{payload:h}=is(e);let y=null;h.aal&&(y=h.aal);let v=y;const{data:{user:_},error:R}=await this.getUser(e);if(R)return this._returnResult({data:null,error:R});((n=(r=_?.factors)===null||r===void 0?void 0:r.filter(k=>k.status==="verified"))!==null&&n!==void 0?n:[]).length>0&&(v="aal2");const m=h.amr||[];return{data:{currentLevel:y,nextLevel:v,currentAuthenticationMethods:m},error:null}}catch(h){if(P(h))return this._returnResult({data:null,error:h});throw h}const{data:{session:o},error:a}=await this.getSession();if(a)return this._returnResult({data:null,error:a});if(!o)return{data:{currentLevel:null,nextLevel:null,currentAuthenticationMethods:[]},error:null};const{payload:l}=is(o.access_token);let c=null;l.aal&&(c=l.aal);let u=c;((i=(s=o.user.factors)===null||s===void 0?void 0:s.filter(h=>h.status==="verified"))!==null&&i!==void 0?i:[]).length>0&&(u="aal2");const f=l.amr||[];return{data:{currentLevel:c,nextLevel:u,currentAuthenticationMethods:f},error:null}}async _getRecoveryCodesStatus(){nn(this.experimental);try{return await this._useSession(async e=>{var r;const{data:n,error:s}=e;if(s)return this._returnResult({data:null,error:s});const{data:i,error:o}=await L(this.fetch,"GET",`${this.url}/factors/recovery-codes`,{headers:this.headers,jwt:(r=n?.session)===null||r===void 0?void 0:r.access_token});return o?this._returnResult({data:null,error:o}):this._returnResult({data:i,error:null})})}catch(e){if(P(e))return this._returnResult({data:null,error:e});throw e}}async _generateRecoveryCodes(e){nn(this.experimental);try{return await this._useSession(async r=>{var n;const{data:s,error:i}=r;if(i)return this._returnResult({data:null,error:i});const{data:o,error:a}=await L(this.fetch,"POST",`${this.url}/factors/recovery-codes`,{body:e?.friendlyName?{friendly_name:e.friendlyName}:void 0,headers:this.headers,jwt:(n=s?.session)===null||n===void 0?void 0:n.access_token});return a?this._returnResult({data:null,error:a}):this._returnResult({data:o,error:null})})}catch(r){if(P(r))return this._returnResult({data:null,error:r});throw r}}async _verifyRecoveryCode(e){nn(this.experimental);const r=async()=>{try{return await this._useSession(async n=>{var s;const{data:i,error:o}=n;if(o)return this._returnResult({data:null,error:o});const{data:a,error:l}=await L(this.fetch,"POST",`${this.url}/factors/recovery-codes/verify`,{body:{code:e.code},headers:this.headers,jwt:(s=i?.session)===null||s===void 0?void 0:s.access_token});if(l)return this._returnResult({data:null,error:l});const c=Object.assign({expires_at:Yl(a.expires_in)},a);return await this._saveSession(c),await this._notifyAllSubscribers("MFA_CHALLENGE_VERIFIED",c),this._returnResult({data:a,error:null})})}catch(n){if(P(n))return this._returnResult({data:null,error:n});throw n}};return this.lock!=null?this._acquireLock(this.lockAcquireTimeout,r):r()}async _regenerateRecoveryCodes(){nn(this.experimental);try{return await this._useSession(async e=>{var r;const{data:n,error:s}=e;if(s)return this._returnResult({data:null,error:s});const{data:i,error:o}=await L(this.fetch,"POST",`${this.url}/factors/recovery-codes/regenerate`,{headers:this.headers,jwt:(r=n?.session)===null||r===void 0?void 0:r.access_token});return o?this._returnResult({data:null,error:o}):this._returnResult({data:i,error:null})})}catch(e){if(P(e))return this._returnResult({data:null,error:e});throw e}}async _unenrollRecoveryCodes(){nn(this.experimental);try{return await this._useSession(async e=>{var r;const{data:n,error:s}=e;if(s)return this._returnResult({data:null,error:s});const{data:i,error:o}=await L(this.fetch,"DELETE",`${this.url}/factors/recovery-codes`,{headers:this.headers,jwt:(r=n?.session)===null||r===void 0?void 0:r.access_token});return o?this._returnResult({data:null,error:o}):this._returnResult({data:i,error:null})})}catch(e){if(P(e))return this._returnResult({data:null,error:e});throw e}}async _getAuthorizationDetails(e){try{return await this._useSession(async r=>{const{data:{session:n},error:s}=r;return s?this._returnResult({data:null,error:s}):n?await L(this.fetch,"GET",`${this.url}/oauth/authorizations/${e}`,{headers:this.headers,jwt:n.access_token,xform:i=>({data:i,error:null})}):this._returnResult({data:null,error:new me})})}catch(r){if(P(r))return this._returnResult({data:null,error:r});throw r}}async _approveAuthorization(e,r){try{return await this._useSession(async n=>{const{data:{session:s},error:i}=n;if(i)return this._returnResult({data:null,error:i});if(!s)return this._returnResult({data:null,error:new me});const o=await L(this.fetch,"POST",`${this.url}/oauth/authorizations/${e}/consent`,{headers:this.headers,jwt:s.access_token,body:{action:"approve"},xform:a=>({data:a,error:null})});return o.data&&o.data.redirect_url&&ye()&&!r?.skipBrowserRedirect&&window.location.assign(o.data.redirect_url),o})}catch(n){if(P(n))return this._returnResult({data:null,error:n});throw n}}async _denyAuthorization(e,r){try{return await this._useSession(async n=>{const{data:{session:s},error:i}=n;if(i)return this._returnResult({data:null,error:i});if(!s)return this._returnResult({data:null,error:new me});const o=await L(this.fetch,"POST",`${this.url}/oauth/authorizations/${e}/consent`,{headers:this.headers,jwt:s.access_token,body:{action:"deny"},xform:a=>({data:a,error:null})});return o.data&&o.data.redirect_url&&ye()&&!r?.skipBrowserRedirect&&window.location.assign(o.data.redirect_url),o})}catch(n){if(P(n))return this._returnResult({data:null,error:n});throw n}}async _listOAuthGrants(){try{return await this._useSession(async e=>{const{data:{session:r},error:n}=e;return n?this._returnResult({data:null,error:n}):r?await L(this.fetch,"GET",`${this.url}/user/oauth/grants`,{headers:this.headers,jwt:r.access_token,xform:s=>({data:s,error:null})}):this._returnResult({data:null,error:new me})})}catch(e){if(P(e))return this._returnResult({data:null,error:e});throw e}}async _revokeOAuthGrant(e){try{return await this._useSession(async r=>{const{data:{session:n},error:s}=r;return s?this._returnResult({data:null,error:s}):n?(await L(this.fetch,"DELETE",`${this.url}/user/oauth/grants`,{headers:this.headers,jwt:n.access_token,query:{client_id:e.clientId},noResolveJson:!0}),{data:{},error:null}):this._returnResult({data:null,error:new me})})}catch(r){if(P(r))return this._returnResult({data:null,error:r});throw r}}async fetchJwk(e,r={keys:[]}){let n=r.keys.find(a=>a.kid===e);if(n)return n;const s=Date.now();if(n=this.jwks.keys.find(a=>a.kid===e),n&&this.jwks_cached_at+Ih>s)return n;const{data:i,error:o}=await L(this.fetch,"GET",`${this.url}/.well-known/jwks.json`,{headers:this.headers});if(o)throw o;return!i.keys||i.keys.length===0||(this.jwks=i,this.jwks_cached_at=s,n=i.keys.find(a=>a.kid===e),!n)?null:n}async getClaims(e,r={}){try{let n=e;if(!n){const{data:h,error:y}=await this.getSession();if(y||!h.session)return this._returnResult({data:null,error:y});n=h.session.access_token}const{header:s,payload:i,signature:o,raw:{header:a,payload:l}}=is(n);if(!r?.allowExpired)try{sf(i.exp)}catch(h){throw new Os(h instanceof Error?h.message:"JWT validation failed")}const c=!s.alg||s.alg.startsWith("HS")||!s.kid||!("crypto"in globalThis&&"subtle"in globalThis.crypto)?null:await this.fetchJwk(s.kid,r?.keys?{keys:r.keys}:r?.jwks);if(!c){const{error:h}=await this.getUser(n);if(h)throw h;return{data:{claims:i,header:s,signature:o},error:null}}const u=of(s.alg),d=await crypto.subtle.importKey("jwk",c,u,!0,["verify"]);if(!await crypto.subtle.verify(u,d,o,Mh(`${a}.${l}`)))throw new Os("Invalid JWT signature");return{data:{claims:i,header:s,signature:o},error:null}}catch(n){if(P(n))return this._returnResult({data:null,error:n});throw n}}async signInWithPasskey(e){var r,n,s,i;try{if(!xs())return this._returnResult({data:null,error:new st("Browser does not support WebAuthn",null)});const{data:o,error:a}=await this._startPasskeyAuthentication({options:{captchaToken:(r=e?.options)===null||r===void 0?void 0:r.captchaToken}});if(a||!o)return this._returnResult({data:null,error:a});const l=Ua(o.options),c=(s=(n=e?.options)===null||n===void 0?void 0:n.signal)!==null&&s!==void 0?s:Ki.createNewAbortSignal(),{data:u,error:d}=await nc({publicKey:l,signal:c,mediation:(i=e?.options)===null||i===void 0?void 0:i.mediation});if(d||!u)return this._returnResult({data:null,error:d??new st("WebAuthn ceremony failed",null)});const f=Na(u);return this._verifyPasskeyAuthentication({challengeId:o.challenge_id,credential:f})}catch(o){if(P(o))return this._returnResult({data:null,error:o});throw o}}async registerPasskey(e){var r,n;try{if(!xs())return this._returnResult({data:null,error:new st("Browser does not support WebAuthn",null)});const{data:s,error:i}=await this._startPasskeyRegistration();if(i||!s)return this._returnResult({data:null,error:i});const o=Da(s.options),a=(n=(r=e?.options)===null||r===void 0?void 0:r.signal)!==null&&n!==void 0?n:Ki.createNewAbortSignal(),{data:l,error:c}=await rc({publicKey:o,signal:a});if(c||!l)return this._returnResult({data:null,error:c??new st("WebAuthn ceremony failed",null)});const u=ja(l);return this._verifyPasskeyRegistration({challengeId:s.challenge_id,credential:u})}catch(s){if(P(s))return this._returnResult({data:null,error:s});throw s}}async _startPasskeyRegistration(){try{return await this._useSession(async e=>{const{data:{session:r},error:n}=e;if(n)return this._returnResult({data:null,error:n});if(!r)return this._returnResult({data:null,error:new me});const{data:s,error:i}=await L(this.fetch,"POST",`${this.url}/passkeys/registration/options`,{headers:this.headers,jwt:r.access_token,body:{}});return i?this._returnResult({data:null,error:i}):this._returnResult({data:s,error:null})})}catch(e){if(P(e))return this._returnResult({data:null,error:e});throw e}}async _verifyPasskeyRegistration(e){try{return await this._useSession(async r=>{const{data:{session:n},error:s}=r;if(s)return this._returnResult({data:null,error:s});if(!n)return this._returnResult({data:null,error:new me});const{data:i,error:o}=await L(this.fetch,"POST",`${this.url}/passkeys/registration/verify`,{headers:this.headers,jwt:n.access_token,body:{challenge_id:e.challengeId,credential:e.credential}});return o?this._returnResult({data:null,error:o}):this._returnResult({data:i,error:null})})}catch(r){if(P(r))return this._returnResult({data:null,error:r});throw r}}async _startPasskeyAuthentication(e){var r;try{const{data:n,error:s}=await L(this.fetch,"POST",`${this.url}/passkeys/authentication/options`,{headers:this.headers,body:{gotrue_meta_security:{captcha_token:(r=e?.options)===null||r===void 0?void 0:r.captchaToken}}});return s?this._returnResult({data:null,error:s}):this._returnResult({data:n,error:null})}catch(n){if(P(n))return this._returnResult({data:null,error:n});throw n}}async _verifyPasskeyAuthentication(e){try{const{data:r,error:n}=await L(this.fetch,"POST",`${this.url}/passkeys/authentication/verify`,{headers:this.headers,body:{challenge_id:e.challengeId,credential:e.credential},xform:Ke});return n?this._returnResult({data:null,error:n}):(r.session&&(await this._saveSession(r.session),await this._notifyAllSubscribers("SIGNED_IN",r.session)),this._returnResult({data:r,error:null}))}catch(r){if(P(r))return this._returnResult({data:null,error:r});throw r}}async _listPasskeys(){try{return await this._useSession(async e=>{const{data:{session:r},error:n}=e;if(n)return this._returnResult({data:null,error:n});if(!r)return this._returnResult({data:null,error:new me});const{data:s,error:i}=await L(this.fetch,"GET",`${this.url}/passkeys`,{headers:this.headers,jwt:r.access_token,xform:o=>({data:o,error:null})});return i?this._returnResult({data:null,error:i}):this._returnResult({data:s,error:null})})}catch(e){if(P(e))return this._returnResult({data:null,error:e});throw e}}async _updatePasskey(e){try{return await this._useSession(async r=>{const{data:{session:n},error:s}=r;if(s)return this._returnResult({data:null,error:s});if(!n)return this._returnResult({data:null,error:new me});const{data:i,error:o}=await L(this.fetch,"PATCH",`${this.url}/passkeys/${e.passkeyId}`,{headers:this.headers,jwt:n.access_token,body:{friendly_name:e.friendlyName}});return o?this._returnResult({data:null,error:o}):this._returnResult({data:i,error:null})})}catch(r){if(P(r))return this._returnResult({data:null,error:r});throw r}}async _deletePasskey(e){try{return await this._useSession(async r=>{const{data:{session:n},error:s}=r;if(s)return this._returnResult({data:null,error:s});if(!n)return this._returnResult({data:null,error:new me});const{error:i}=await L(this.fetch,"DELETE",`${this.url}/passkeys/${e.passkeyId}`,{headers:this.headers,jwt:n.access_token,noResolveJson:!0});return i?this._returnResult({data:null,error:i}):this._returnResult({data:null,error:null})})}catch(r){if(P(r))return this._returnResult({data:null,error:r});throw r}}}wn.nextInstanceID={};const $f=wn,xf="2.117.2";let an="",Cs;if(typeof Deno<"u"){var Oi;an="deno",Cs=(Oi=Deno.version)===null||Oi===void 0?void 0:Oi.deno}else if(typeof document<"u")an="web";else if(typeof navigator<"u"&&navigator.product==="ReactNative")an="react-native";else{var Ri;an="node";const t=globalThis.process;Cs=t==null||(Ri=t.version)===null||Ri===void 0?void 0:Ri.replace(/^v/,"")}const sc=[`runtime=${an}`];Cs&&sc.push(`runtime-version=${Cs}`);const Pf={"X-Client-Info":`supabase-js/${xf}; ${sc.join("; ")}`},Cf={headers:Pf},If={schema:"public"},Lf={autoRefreshToken:!0,persistSession:!0,detectSessionInUrl:!0,flowType:"implicit"},Df={},Uf={enabled:!1,respectSamplingDecision:!0};function jf(t){if(!t||typeof t!="string")return null;const e=t.split("-");if(e.length!==4)return null;const[r,n,s,i]=e;if(r.length!==2||n.length!==32||s.length!==16||i.length!==2)return null;const o=/^[0-9a-f]+$/i;return!o.test(r)||!o.test(n)||!o.test(s)||!o.test(i)||n==="00000000000000000000000000000000"||s==="0000000000000000"?null:{version:r,traceId:n,parentId:s,traceFlags:i,isSampled:(parseInt(i,16)&1)===1}}function Nf(t,e){if(!t||!e||e.length===0)return!1;let r;if(t instanceof URL)r=t;else try{r=new URL(t)}catch{return!1}for(const n of e)try{if(typeof n=="string"){if(qf(r.hostname,n))return!0}else if(n instanceof RegExp){if(n.test(r.hostname))return!0}else if(typeof n=="function"&&n(r))return!0}catch{continue}return!1}function qf(t,e){if(e===t)return!0;if(e.startsWith("*.")){const r=e.slice(2);if(t.endsWith(r)&&(t===r||t.endsWith("."+r)))return!0}return!1}function Bf(t){const e=[];try{const r=new URL(t);e.push(r.hostname)}catch{}return e.push("*.supabase.co","*.supabase.in"),e.push("localhost","127.0.0.1","[::1]"),e}function _n(t){"@babel/helpers - typeof";return _n=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},_n(t)}function Mf(t,e){if(_n(t)!="object"||!t)return t;var r=t[Symbol.toPrimitive];if(r!==void 0){var n=r.call(t,e);if(_n(n)!="object")return n;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(t)}function Ff(t){var e=Mf(t,"string");return _n(e)=="symbol"?e:e+""}function Wf(t,e,r){return(e=Ff(e))in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}function Ba(t,e){var r=Object.keys(t);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(t);e&&(n=n.filter(function(s){return Object.getOwnPropertyDescriptor(t,s).enumerable})),r.push.apply(r,n)}return r}function ne(t){for(var e=1;e<arguments.length;e++){var r=arguments[e]!=null?arguments[e]:{};e%2?Ba(Object(r),!0).forEach(function(n){Wf(t,n,r[n])}):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(r)):Ba(Object(r)).forEach(function(n){Object.defineProperty(t,n,Object.getOwnPropertyDescriptor(r,n))})}return t}const Hf=t=>t?(...e)=>t(...e):(...e)=>fetch(...e),Gf=()=>Headers,ic=t=>t.startsWith("sb_publishable_")||t.startsWith("sb_secret_"),Vf="sb_temp_",Ma=new Set,zf=t=>{var e,r;if(!t.startsWith("sb_")||ic(t)||t.startsWith(Vf))return;const n=(e=(r=t.match(/^sb_[a-zA-Z0-9]+_/))===null||r===void 0?void 0:r[0])!==null&&e!==void 0?e:"unknown";Ma.has(n)||(Ma.add(n),console.warn("@supabase/supabase-js: Unrecognized Supabase API key format. The client will proceed and send this key as-is; if you see authentication errors you may need to upgrade @supabase/supabase-js to a version that recognizes this key type."))},Fa=(t,e,r,n,s,i)=>{const o=Hf(n),a=Gf(),l=s?.enabled===!0,c=s?.respectSamplingDecision!==!1,u=l?Bf(e):null,d=!(i?.omitApiKeyAsBearer&&ic(t));return async(f,h)=>{const y=await r();let v=new a(h?.headers);if(v.has("apikey")||v.set("apikey",t),!v.has("Authorization")){const _=y??(d?t:null);_&&v.set("Authorization",`Bearer ${_}`)}if(u){const _=Kf(f,u,c);_&&(_.traceparent&&!v.has("traceparent")&&v.set("traceparent",_.traceparent),_.tracestate&&!v.has("tracestate")&&v.set("tracestate",_.tracestate),_.baggage&&!v.has("baggage")&&v.set("baggage",_.baggage))}return o(f,ne(ne({},h),{},{headers:v}))}};let Wa=!1,Ha=!1;function Kf(t,e,r){const n=Gu();if(!n)return Wa||(Wa=!0,console.warn("@supabase/supabase-js: tracePropagation is enabled but the tracing runtime is not loaded, so trace headers will not be attached. Add `import '@supabase/supabase-js/tracing'` at your application entry point (requires the OpenTelemetry API package to be installed). The CDN/UMD build does not support trace propagation.")),null;if(!Nf(typeof t=="string"||t instanceof URL?t:t.url,e))return null;const s=n();if(!s||!s.traceparent){var i;if(!(s==null||(i=s.carrierKeys)===null||i===void 0)&&i.length&&!Ha){Ha=!0;const o=s.carrierKeys.includes("sentry-trace")?" Sentry detected: set `propagateTraceparent: true` in Sentry.init() to emit it.":" Configure your tracing SDK to emit W3C trace context on outgoing requests.";console.warn(`@supabase/supabase-js: tracePropagation is enabled and a tracing SDK is active, but its propagator wrote [${s.carrierKeys.join(", ")}] and no W3C traceparent header, so trace headers will not be attached.`+o)}return null}if(r){const o=jf(s.traceparent);if(o&&!o.isSampled)return{traceparent:s.traceparent}}return s}function Ga(t){return typeof t=="boolean"?{enabled:t}:t}function Jf(t){return t.endsWith("/")?t:t+"/"}let Va=!1;function Yf(t){Va||typeof t!="object"||t===null||!("schema"in t)||t.schema===void 0||(Va=!0,console.warn(`@supabase/supabase-js: The "schema" option must be nested under "db", e.g. createClient(url, key, { db: { schema: 'myschema' } }). A top-level "schema" is ignored and queries go to the default schema.`))}function Xf(t,e){var r,n,s,i,o,a;const{db:l,auth:c,realtime:u,global:d}=t,{db:f,auth:h,realtime:y,global:v}=e,_=Ga(t.tracePropagation),R=Ga(e.tracePropagation),g={db:ne(ne({},f),l),auth:ne(ne({},h),c),realtime:ne(ne({},y),u),storage:{},global:ne(ne(ne({},v),d),{},{headers:ne(ne({},(r=v?.headers)!==null&&r!==void 0?r:{}),(n=d?.headers)!==null&&n!==void 0?n:{})}),tracePropagation:{enabled:(s=(i=_?.enabled)!==null&&i!==void 0?i:R?.enabled)!==null&&s!==void 0?s:!1,respectSamplingDecision:(o=(a=_?.respectSamplingDecision)!==null&&a!==void 0?a:R?.respectSamplingDecision)!==null&&o!==void 0?o:!0},accessToken:async()=>""};return t.accessToken?g.accessToken=t.accessToken:delete g.accessToken,g}function Qf(t){const e=t?.trim();if(!e)throw new Error("supabaseUrl is required.");if(!e.match(/^https?:\/\//i))throw new Error("Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL.");try{return new URL(Jf(e))}catch{throw Error("Invalid supabaseUrl: Provided URL is malformed.")}}var Zf=class extends $f{constructor(t){super(t)}},ep=class{constructor(t,e,r){var n,s;this.supabaseUrl=t,this.supabaseKey=e;const i=Qf(t);if(!e)throw new Error("supabaseKey is required.");zf(e),Yf(r),this.realtimeUrl=new URL("realtime/v1",i),this.realtimeUrl.protocol=this.realtimeUrl.protocol.replace("http","ws"),this.authUrl=new URL("auth/v1",i),this.storageUrl=new URL("storage/v1",i),this.functionsUrl=new URL("functions/v1",i);const o=`sb-${i.hostname.split(".")[0]}-auth-token`,a={db:If,realtime:Df,auth:ne(ne({},Lf),{},{storageKey:o}),global:Cf,tracePropagation:Uf},l=Xf(r??{},a);if(this.settings=l,this.storageKey=(n=l.auth.storageKey)!==null&&n!==void 0?n:"",this.headers=(s=l.global.headers)!==null&&s!==void 0?s:{},l.accessToken)this.accessToken=l.accessToken,this.auth=new Proxy({},{get:(u,d)=>{throw new Error(`@supabase/supabase-js: Supabase Client is configured with the accessToken option, accessing supabase.auth.${String(d)} is not possible`)}});else{var c;this.auth=this._initSupabaseAuthClient((c=l.auth)!==null&&c!==void 0?c:{},this.headers,l.global.fetch)}this.fetch=Fa(e,t,this._getSessionToken.bind(this),l.global.fetch,l.tracePropagation),this.functionsFetch=Fa(e,t,this._getSessionToken.bind(this),l.global.fetch,l.tracePropagation,{omitApiKeyAsBearer:!0}),this.realtime=this._initRealtimeClient(ne({headers:this.headers,accessToken:this._getAccessToken.bind(this),fetch:this.fetch},l.realtime)),this.accessToken&&Promise.resolve(this.accessToken()).then(u=>this.realtime.setAuth(u)).catch(u=>console.warn("Failed to set initial Realtime auth token:",u)),this.rest=new id(new URL("rest/v1",i).href,{headers:this.headers,schema:l.db.schema,fetch:this.fetch,timeout:l.db.timeout,urlLengthLimit:l.db.urlLengthLimit,retry:l.db.retry}),this.storage=new Ah(this.storageUrl.href,this.headers,this.fetch,r?.storage),l.accessToken||this._listenForAuthEvents()}get functions(){return new Ju(this.functionsUrl.href,{headers:this.headers,customFetch:this.functionsFetch})}from(t){return this.rest.from(t)}schema(t){return this.rest.schema(t)}getOpenApiSpec(){return this.rest.getOpenApiSpec()}rpc(t,e={},r={head:!1,get:!1,count:void 0}){return this.rest.rpc(t,e,r)}channel(t,e={config:{}}){return this.realtime.channel(t,e)}getChannels(){return this.realtime.getChannels()}removeChannel(t){return this.realtime.removeChannel(t)}removeAllChannels(){return this.realtime.removeAllChannels()}async _getSessionToken(){var t=this,e,r;if(t.accessToken)return await t.accessToken();const{data:n}=await t.auth.getSession();return(e=(r=n.session)===null||r===void 0?void 0:r.access_token)!==null&&e!==void 0?e:null}async _getAccessToken(){var t=this,e;return(e=await t._getSessionToken())!==null&&e!==void 0?e:t.supabaseKey}_initSupabaseAuthClient({autoRefreshToken:t,persistSession:e,detectSessionInUrl:r,storage:n,userStorage:s,storageKey:i,flowType:o,lock:a,debug:l,throwOnError:c,experimental:u,lockAcquireTimeout:d,skipAutoInitialize:f},h,y){const v={Authorization:`Bearer ${this.supabaseKey}`,apikey:`${this.supabaseKey}`};return new Zf({url:this.authUrl.href,headers:ne(ne({},v),h),storageKey:i,autoRefreshToken:t,persistSession:e,detectSessionInUrl:r,storage:n,userStorage:s,flowType:o,lock:a,debug:l,throwOnError:c,experimental:u,fetch:y,lockAcquireTimeout:d,skipAutoInitialize:f,hasCustomAuthorizationHeader:Object.keys(this.headers).some(_=>_.toLowerCase()==="authorization")})}_initRealtimeClient(t){return new Yd(this.realtimeUrl.href,ne(ne({},t),{},{params:ne(ne({},{apikey:this.supabaseKey}),t?.params)}))}_listenForAuthEvents(){return this.auth.onAuthStateChange((t,e)=>{this._handleTokenChanged(t,"CLIENT",e?.access_token)})}_handleTokenChanged(t,e,r){(t==="TOKEN_REFRESHED"||t==="SIGNED_IN"||t==="INITIAL_SESSION")&&this.changedAccessToken!==r?(this.changedAccessToken=r,this.realtime.setAuth(r)):t==="SIGNED_OUT"&&(this.realtime.setAuth(),e=="STORAGE"&&this.auth.signOut(),this.changedAccessToken=void 0)}};const tp=(t,e,r)=>new ep(t,e,r);function rp(){if(typeof window<"u"||globalThis.Deno!==void 0)return!1;const t=globalThis.process;if(!t)return!1;const e=t.version;if(e==null)return!1;const r=e.match(/^v(\d+)\./);return r?parseInt(r[1],10)<=20:!1}rp()&&console.warn("⚠️  Node.js 20 and below are deprecated and will no longer be supported in future versions of @supabase/supabase-js. Please upgrade to Node.js 22 or later. For more information, visit: https://github.com/orgs/supabase/discussions/45715");function Ji(t){"@babel/helpers - typeof";return Ji=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},Ji(t)}function np(t,e,r){return Object.defineProperty(t,"prototype",{writable:!1}),t}function sp(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function ip(t,e,r){return e=Sn(e),op(t,So()?Reflect.construct(e,r||[],Sn(t).constructor):e.apply(t,r))}function op(t,e){if(e&&(Ji(e)==="object"||typeof e=="function"))return e;if(e!==void 0)throw new TypeError("Derived constructors may only return object or undefined");return ap(t)}function ap(t){if(t===void 0)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return t}function lp(t,e){if(typeof e!="function"&&e!==null)throw new TypeError("Super expression must either be null or a function");t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,writable:!0,configurable:!0}}),Object.defineProperty(t,"prototype",{writable:!1}),e&&bn(t,e)}function Yi(t){var e=typeof Map=="function"?new Map:void 0;return Yi=function(n){if(n===null||!up(n))return n;if(typeof n!="function")throw new TypeError("Super expression must either be null or a function");if(typeof e<"u"){if(e.has(n))return e.get(n);e.set(n,s)}function s(){return cp(n,arguments,Sn(this).constructor)}return s.prototype=Object.create(n.prototype,{constructor:{value:s,enumerable:!1,writable:!0,configurable:!0}}),bn(s,n)},Yi(t)}function cp(t,e,r){if(So())return Reflect.construct.apply(null,arguments);var n=[null];n.push.apply(n,e);var s=new(t.bind.apply(t,n));return r&&bn(s,r.prototype),s}function So(){try{var t=!Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],function(){}))}catch{}return(So=function(){return!!t})()}function up(t){try{return Function.toString.call(t).indexOf("[native code]")!==-1}catch{return typeof t=="function"}}function bn(t,e){return bn=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(n,s){return n.__proto__=s,n},bn(t,e)}function Sn(t){return Sn=Object.setPrototypeOf?Object.getPrototypeOf.bind():function(r){return r.__proto__||Object.getPrototypeOf(r)},Sn(t)}var os=(function(t){function e(r){var n,s=arguments.length>1&&arguments[1]!==void 0?arguments[1]:null,i=arguments.length>2&&arguments[2]!==void 0?arguments[2]:null,o=arguments.length>3&&arguments[3]!==void 0?arguments[3]:null;if(sp(this,e),n=ip(this,e,[r]),n.originalRequest=i,n.originalResponse=o,n.causingError=s,s!=null&&(r+=", caused by ".concat(s.toString())),i!=null){var a=i.getHeader("X-Request-ID")||"n/a",l=i.getMethod(),c=i.getURL(),u=o?o.getStatus():"n/a",d=o?o.getBody()||"":"n/a";r+=", originated from request (method: ".concat(l,", url: ").concat(c,", response code: ").concat(u,", response text: ").concat(d,", request id: ").concat(a,")")}return n.message=r,n}return lp(e,t),np(e)})(Yi(Error));function kn(t){"@babel/helpers - typeof";return kn=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},kn(t)}function dp(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function hp(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,pp(n.key),n)}}function fp(t,e,r){return e&&hp(t.prototype,e),Object.defineProperty(t,"prototype",{writable:!1}),t}function pp(t){var e=mp(t,"string");return kn(e)=="symbol"?e:e+""}function mp(t,e){if(kn(t)!="object"||!t)return t;var r=t[Symbol.toPrimitive];if(r!==void 0){var n=r.call(t,e);if(kn(n)!="object")return n;throw new TypeError("@@toPrimitive must return a primitive value.")}return String(t)}var gp=(function(){function t(){dp(this,t)}return fp(t,[{key:"listAllUploads",value:function(){return Promise.resolve([])}},{key:"findUploadsByFingerprint",value:function(r){return Promise.resolve([])}},{key:"removeUpload",value:function(r){return Promise.resolve()}},{key:"addUpload",value:function(r,n){return Promise.resolve(null)}}])})();const oc="3.9.4",yp=oc,za=typeof TextDecoder=="function"?new TextDecoder("utf-8",{ignoreBOM:!0}):void 0,Ka=typeof TextEncoder=="function"?new TextEncoder:void 0,vp="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",ln=Array.prototype.slice.call(vp),as=(t=>{let e={};return t.forEach((r,n)=>e[r]=n),e})(ln),wp=/^(?:[A-Za-z\d+\/]{4})*?(?:[A-Za-z\d+\/]{2}(?:==)?|[A-Za-z\d+\/]{3}=?)?$/,ve=String.fromCharCode.bind(String),_p=typeof Uint8Array.from=="function"?Uint8Array.from.bind(Uint8Array):t=>new Uint8Array(Array.prototype.slice.call(t,0)),ac=t=>t.replace(/=/g,"").replace(/[+\/]/g,e=>e=="+"?"-":"_"),lc=t=>t.replace(/[^A-Za-z0-9\+\/]/g,""),cc=t=>{let e,r,n,s,i="";const o=t.length%3;for(let a=0;a<t.length;){if((r=t.charCodeAt(a++))>255||(n=t.charCodeAt(a++))>255||(s=t.charCodeAt(a++))>255)throw new TypeError("invalid character found");e=r<<16|n<<8|s,i+=ln[e>>18&63]+ln[e>>12&63]+ln[e>>6&63]+ln[e&63]}return o?i.slice(0,o-3)+"===".substring(o):i},ko=typeof btoa=="function"?t=>btoa(t):cc,Xi=typeof Uint8Array.prototype.toBase64=="function"?t=>t.toBase64():t=>{let r=[];for(let n=0,s=t.length;n<s;n+=4096)r.push(ve.apply(null,t.subarray(n,n+4096)));return ko(r.join(""))},ps=(t,e=!1)=>e?ac(Xi(t)):Xi(t),bp=t=>{if(t.length<2){var e=t.charCodeAt(0);return e<128?t:e<2048?ve(192|e>>>6)+ve(128|e&63):ve(224|e>>>12&15)+ve(128|e>>>6&63)+ve(128|e&63)}else{var e=65536+(t.charCodeAt(0)-55296)*1024+(t.charCodeAt(1)-56320);return ve(240|e>>>18&7)+ve(128|e>>>12&63)+ve(128|e>>>6&63)+ve(128|e&63)}},Sp=/[\uD800-\uDBFF][\uDC00-\uDFFF]|[^\x00-\x7F]/g,uc=t=>t.replace(Sp,bp),Ja=Ka?t=>Xi(Ka.encode(t)):t=>ko(uc(t)),Ur=(t,e=!1)=>e?ac(Ja(t)):Ja(t),Ya=t=>Ur(t,!0),kp=/[\xC0-\xDF][\x80-\xBF]|[\xE0-\xEF][\x80-\xBF]{2}|[\xF0-\xF7][\x80-\xBF]{3}/g,Ep=t=>{switch(t.length){case 4:var e=(7&t.charCodeAt(0))<<18|(63&t.charCodeAt(1))<<12|(63&t.charCodeAt(2))<<6|63&t.charCodeAt(3),r=e-65536;return ve((r>>>10)+55296)+ve((r&1023)+56320);case 3:return ve((15&t.charCodeAt(0))<<12|(63&t.charCodeAt(1))<<6|63&t.charCodeAt(2));default:return ve((31&t.charCodeAt(0))<<6|63&t.charCodeAt(1))}},dc=t=>t.replace(kp,Ep),hc=t=>{if(t=t.replace(/\s+/g,""),!wp.test(t))throw new TypeError("malformed base64.");t+="==".slice(2-(t.length&3));let e,r,n,s=[];for(let i=0;i<t.length;)e=as[t.charAt(i++)]<<18|as[t.charAt(i++)]<<12|(r=as[t.charAt(i++)])<<6|(n=as[t.charAt(i++)]),r===64?s.push(ve(e>>16&255)):n===64?s.push(ve(e>>16&255,e>>8&255)):s.push(ve(e>>16&255,e>>8&255,e&255));return s.join("")},Eo=typeof atob=="function"?t=>atob(lc(t)):hc,fc=typeof Uint8Array.fromBase64=="function"?t=>Uint8Array.fromBase64(t):t=>_p(Eo(t).split("").map(e=>e.charCodeAt(0))),pc=t=>fc(mc(t)),Tp=za?t=>za.decode(fc(t)):t=>dc(Eo(t)),mc=t=>lc(t.replace(/[-_]/g,e=>e=="-"?"+":"/")),Qi=t=>Tp(mc(t)),Ap=t=>{if(typeof t!="string")return!1;const e=t.replace(/\s+/g,"").replace(/={0,2}$/,"");return!/[^\s0-9a-zA-Z\+/]/.test(e)||!/[^\s0-9a-zA-Z\-_]/.test(e)},gc=t=>({value:t,enumerable:!1,writable:!0,configurable:!0}),yc=function(){const t=(e,r)=>Object.defineProperty(String.prototype,e,gc(r));t("fromBase64",function(){return Qi(this)}),t("toBase64",function(e){return Ur(this,e)}),t("toBase64URI",function(){return Ur(this,!0)}),t("toBase64URL",function(){return Ur(this,!0)}),t("toUint8Array",function(){return pc(this)})},vc=function(){const t=(e,r)=>Object.defineProperty(Uint8Array.prototype,e,gc(r));t("toBase64",function(e){return ps(this,e)}),t("toBase64URI",function(){return ps(this,!0)}),t("toBase64URL",function(){return ps(this,!0)})},Op=()=>{yc(),vc()},Rp={version:oc,VERSION:yp,atob:Eo,atobPolyfill:hc,btoa:ko,btoaPolyfill:cc,fromBase64:Qi,toBase64:Ur,encode:Ur,encodeURI:Ya,encodeURL:Ya,utob:uc,btou:dc,decode:Qi,isValid:Ap,fromUint8Array:ps,toUint8Array:pc,extendString:yc,extendUint8Array:vc,extendBuiltins:Op};var Xa=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};function $p(t){return t&&t.__esModule&&Object.prototype.hasOwnProperty.call(t,"default")?t.default:t}var $i,Qa;function xp(){return Qa||(Qa=1,$i=function(e,r){if(r=r.split(":")[0],e=+e,!e)return!1;switch(r){case"http":case"ws":return e!==80;case"https":case"wss":return e!==443;case"ftp":return e!==21;case"gopher":return e!==70;case"file":return!1}return e!==0}),$i}var ls={},Za;function Pp(){if(Za)return ls;Za=1;var t=Object.prototype.hasOwnProperty,e;function r(o){try{return decodeURIComponent(o.replace(/\+/g," "))}catch{return null}}function n(o){try{return encodeURIComponent(o)}catch{return null}}function s(o){for(var a=/([^=?#&]+)=?([^&]*)/g,l={},c;c=a.exec(o);){var u=r(c[1]),d=r(c[2]);u===null||d===null||u in l||(l[u]=d)}return l}function i(o,a){a=a||"";var l=[],c,u;typeof a!="string"&&(a="?");for(u in o)if(t.call(o,u)){if(c=o[u],!c&&(c===null||c===e||isNaN(c))&&(c=""),u=n(u),c=n(c),u===null||c===null)continue;l.push(u+"="+c)}return l.length?a+l.join("&"):""}return ls.stringify=i,ls.parse=s,ls}var xi,el;function Cp(){if(el)return xi;el=1;var t=xp(),e=Pp(),r=/^[\x00-\x20\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+/,n=/[\n\r\t]/g,s=/^[A-Za-z][A-Za-z0-9+-.]*:\/\//,i=/:\d+$/,o=/^([a-z][a-z0-9.+-]*:)?(\/\/)?([\\/]+)?([\S\s]*)/i,a=/^[a-zA-Z]:/;function l(g){return(g||"").toString().replace(r,"")}var c=[["#","hash"],["?","query"],function(m,k){return f(k.protocol)?m.replace(/\\/g,"/"):m},["/","pathname"],["@","auth",1],[NaN,"host",void 0,1,1],[/:(\d*)$/,"port",void 0,1],[NaN,"hostname",void 0,1,1]],u={hash:1,query:1};function d(g){var m;typeof window<"u"?m=window:typeof Xa<"u"?m=Xa:typeof self<"u"?m=self:m={};var k=m.location||{};g=g||k;var A={},C=typeof g,x;if(g.protocol==="blob:")A=new v(unescape(g.pathname),{});else if(C==="string"){A=new v(g,{});for(x in u)delete A[x]}else if(C==="object"){for(x in g)x in u||(A[x]=g[x]);A.slashes===void 0&&(A.slashes=s.test(g.href))}return A}function f(g){return g==="file:"||g==="ftp:"||g==="http:"||g==="https:"||g==="ws:"||g==="wss:"}function h(g,m){g=l(g),g=g.replace(n,""),m=m||{};var k=o.exec(g),A=k[1]?k[1].toLowerCase():"",C=!!k[2],x=!!k[3],W=0,q;return C?x?(q=k[2]+k[3]+k[4],W=k[2].length+k[3].length):(q=k[2]+k[4],W=k[2].length):x?(q=k[3]+k[4],W=k[3].length):q=k[4],A==="file:"?W>=2&&(q=q.slice(2)):f(A)?q=k[4]:A?C&&(q=q.slice(2)):W>=2&&f(m.protocol)&&(q=k[4]),{protocol:A,slashes:C||f(A),slashesCount:W,rest:q}}function y(g,m){if(g==="")return m;for(var k=(m||"/").split("/").slice(0,-1).concat(g.split("/")),A=k.length,C=k[A-1],x=!1,W=0;A--;)k[A]==="."?k.splice(A,1):k[A]===".."?(k.splice(A,1),W++):W&&(A===0&&(x=!0),k.splice(A,1),W--);return x&&k.unshift(""),(C==="."||C==="..")&&k.push(""),k.join("/")}function v(g,m,k){if(g=l(g),g=g.replace(n,""),!(this instanceof v))return new v(g,m,k);var A,C,x,W,q,pe,je=c.slice(),_t=typeof m,D=this,Ne=0;for(_t!=="object"&&_t!=="string"&&(k=m,m=null),k&&typeof k!="function"&&(k=e.parse),m=d(m),C=h(g||"",m),A=!C.protocol&&!C.slashes,D.slashes=C.slashes||A&&m.slashes,D.protocol=C.protocol||m.protocol||"",g=C.rest,(C.protocol==="file:"&&(C.slashesCount!==2||a.test(g))||!C.slashes&&(C.protocol||C.slashesCount<2||!f(D.protocol)))&&(je[3]=[/(.*)/,"pathname"]);Ne<je.length;Ne++){if(W=je[Ne],typeof W=="function"){g=W(g,D);continue}x=W[0],pe=W[1],x!==x?D[pe]=g:typeof x=="string"?(q=x==="@"?g.lastIndexOf(x):g.indexOf(x),~q&&(typeof W[2]=="number"?(D[pe]=g.slice(0,q),g=g.slice(q+W[2])):(D[pe]=g.slice(q),g=g.slice(0,q)))):(q=x.exec(g))&&(D[pe]=q[1],g=g.slice(0,q.index)),D[pe]=D[pe]||A&&W[3]&&m[pe]||"",W[4]&&(D[pe]=D[pe].toLowerCase())}k&&(D.query=k(D.query)),A&&m.slashes&&D.pathname.charAt(0)!=="/"&&(D.pathname!==""||m.pathname!=="")&&(D.pathname=y(D.pathname,m.pathname)),D.pathname.charAt(0)!=="/"&&f(D.protocol)&&(D.pathname="/"+D.pathname),t(D.port,D.protocol)||(D.host=D.hostname,D.port=""),D.username=D.password="",D.auth&&(q=D.auth.indexOf(":"),~q?(D.username=D.auth.slice(0,q),D.username=encodeURIComponent(decodeURIComponent(D.username)),D.password=D.auth.slice(q+1),D.password=encodeURIComponent(decodeURIComponent(D.password))):D.username=encodeURIComponent(decodeURIComponent(D.auth)),D.auth=D.password?D.username+":"+D.password:D.username),D.origin=D.protocol!=="file:"&&f(D.protocol)&&D.host?D.protocol+"//"+D.host:"null",D.href=D.toString()}function _(g,m,k){var A=this;switch(g){case"query":typeof m=="string"&&m.length&&(m=(k||e.parse)(m)),A[g]=m;break;case"port":A[g]=m,t(m,A.protocol)?m&&(A.host=A.hostname+":"+m):(A.host=A.hostname,A[g]="");break;case"hostname":A[g]=m,A.port&&(m+=":"+A.port),A.host=m;break;case"host":A[g]=m,i.test(m)?(m=m.split(":"),A.port=m.pop(),A.hostname=m.join(":")):(A.hostname=m,A.port="");break;case"protocol":A.protocol=m.toLowerCase(),A.slashes=!k;break;case"pathname":case"hash":if(m){var C=g==="pathname"?"/":"#";A[g]=m.charAt(0)!==C?C+m:m}else A[g]=m;break;case"username":case"password":A[g]=encodeURIComponent(m);break;case"auth":var x=m.indexOf(":");~x?(A.username=m.slice(0,x),A.username=encodeURIComponent(decodeURIComponent(A.username)),A.password=m.slice(x+1),A.password=encodeURIComponent(decodeURIComponent(A.password))):A.username=encodeURIComponent(decodeURIComponent(m))}for(var W=0;W<c.length;W++){var q=c[W];q[4]&&(A[q[1]]=A[q[1]].toLowerCase())}return A.auth=A.password?A.username+":"+A.password:A.username,A.origin=A.protocol!=="file:"&&f(A.protocol)&&A.host?A.protocol+"//"+A.host:"null",A.href=A.toString(),A}function R(g){(!g||typeof g!="function")&&(g=e.stringify);var m,k=this,A=k.host,C=k.protocol;C&&C.charAt(C.length-1)!==":"&&(C+=":");var x=C+(k.protocol&&k.slashes||f(k.protocol)?"//":"");return k.username?(x+=k.username,k.password&&(x+=":"+k.password),x+="@"):k.password?(x+=":"+k.password,x+="@"):k.protocol!=="file:"&&f(k.protocol)&&!A&&k.pathname!=="/"&&(x+="@"),(A[A.length-1]===":"||i.test(k.hostname)&&!k.port)&&(A+=":"),x+=A+k.pathname,m=typeof k.query=="object"?g(k.query):k.query,m&&(x+=m.charAt(0)!=="?"?"?"+m:m),k.hash&&(x+=k.hash),x}return v.prototype={set:_,toString:R},v.extractProtocol=h,v.location=d,v.trimLeft=l,v.qs=e,xi=v,xi}var Ip=Cp();const Lp=$p(Ip);function Dp(){return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(t){var e=Math.random()*16|0,r=t==="x"?e:e&3|8;return r.toString(16)})}function Zi(){Zi=function(){return e};var t,e={},r=Object.prototype,n=r.hasOwnProperty,s=Object.defineProperty||function(b,p,w){b[p]=w.value},i=typeof Symbol=="function"?Symbol:{},o=i.iterator||"@@iterator",a=i.asyncIterator||"@@asyncIterator",l=i.toStringTag||"@@toStringTag";function c(b,p,w){return Object.defineProperty(b,p,{value:w,enumerable:!0,configurable:!0,writable:!0}),b[p]}try{c({},"")}catch{c=function(w,$,S){return w[$]=S}}function u(b,p,w,$){var S=p&&p.prototype instanceof R?p:R,E=Object.create(S.prototype),M=new Ne($||[]);return s(E,"_invoke",{value:pe(b,w,M)}),E}function d(b,p,w){try{return{type:"normal",arg:b.call(p,w)}}catch($){return{type:"throw",arg:$}}}e.wrap=u;var f="suspendedStart",h="suspendedYield",y="executing",v="completed",_={};function R(){}function g(){}function m(){}var k={};c(k,o,function(){return this});var A=Object.getPrototypeOf,C=A&&A(A(et([])));C&&C!==r&&n.call(C,o)&&(k=C);var x=m.prototype=R.prototype=Object.create(k);function W(b){["next","throw","return"].forEach(function(p){c(b,p,function(w){return this._invoke(p,w)})})}function q(b,p){function w(S,E,M,H){var V=d(b[S],b,E);if(V.type!=="throw"){var Te=V.arg,ge=Te.value;return ge&&cr(ge)=="object"&&n.call(ge,"__await")?p.resolve(ge.__await).then(function(Ae){w("next",Ae,M,H)},function(Ae){w("throw",Ae,M,H)}):p.resolve(ge).then(function(Ae){Te.value=Ae,M(Te)},function(Ae){return w("throw",Ae,M,H)})}H(V.arg)}var $;s(this,"_invoke",{value:function(E,M){function H(){return new p(function(V,Te){w(E,M,V,Te)})}return $=$?$.then(H,H):H()}})}function pe(b,p,w){var $=f;return function(S,E){if($===y)throw Error("Generator is already running");if($===v){if(S==="throw")throw E;return{value:t,done:!0}}for(w.method=S,w.arg=E;;){var M=w.delegate;if(M){var H=je(M,w);if(H){if(H===_)continue;return H}}if(w.method==="next")w.sent=w._sent=w.arg;else if(w.method==="throw"){if($===f)throw $=v,w.arg;w.dispatchException(w.arg)}else w.method==="return"&&w.abrupt("return",w.arg);$=y;var V=d(b,p,w);if(V.type==="normal"){if($=w.done?v:h,V.arg===_)continue;return{value:V.arg,done:w.done}}V.type==="throw"&&($=v,w.method="throw",w.arg=V.arg)}}}function je(b,p){var w=p.method,$=b.iterator[w];if($===t)return p.delegate=null,w==="throw"&&b.iterator.return&&(p.method="return",p.arg=t,je(b,p),p.method==="throw")||w!=="return"&&(p.method="throw",p.arg=new TypeError("The iterator does not provide a '"+w+"' method")),_;var S=d($,b.iterator,p.arg);if(S.type==="throw")return p.method="throw",p.arg=S.arg,p.delegate=null,_;var E=S.arg;return E?E.done?(p[b.resultName]=E.value,p.next=b.nextLoc,p.method!=="return"&&(p.method="next",p.arg=t),p.delegate=null,_):E:(p.method="throw",p.arg=new TypeError("iterator result is not an object"),p.delegate=null,_)}function _t(b){var p={tryLoc:b[0]};1 in b&&(p.catchLoc=b[1]),2 in b&&(p.finallyLoc=b[2],p.afterLoc=b[3]),this.tryEntries.push(p)}function D(b){var p=b.completion||{};p.type="normal",delete p.arg,b.completion=p}function Ne(b){this.tryEntries=[{tryLoc:"root"}],b.forEach(_t,this),this.reset(!0)}function et(b){if(b||b===""){var p=b[o];if(p)return p.call(b);if(typeof b.next=="function")return b;if(!isNaN(b.length)){var w=-1,$=function S(){for(;++w<b.length;)if(n.call(b,w))return S.value=b[w],S.done=!1,S;return S.value=t,S.done=!0,S};return $.next=$}}throw new TypeError(cr(b)+" is not iterable")}return g.prototype=m,s(x,"constructor",{value:m,configurable:!0}),s(m,"constructor",{value:g,configurable:!0}),g.displayName=c(m,l,"GeneratorFunction"),e.isGeneratorFunction=function(b){var p=typeof b=="function"&&b.constructor;return!!p&&(p===g||(p.displayName||p.name)==="GeneratorFunction")},e.mark=function(b){return Object.setPrototypeOf?Object.setPrototypeOf(b,m):(b.__proto__=m,c(b,l,"GeneratorFunction")),b.prototype=Object.create(x),b},e.awrap=function(b){return{__await:b}},W(q.prototype),c(q.prototype,a,function(){return this}),e.AsyncIterator=q,e.async=function(b,p,w,$,S){S===void 0&&(S=Promise);var E=new q(u(b,p,w,$),S);return e.isGeneratorFunction(p)?E:E.next().then(function(M){return M.done?M.value:E.next()})},W(x),c(x,l,"Generator"),c(x,o,function(){return this}),c(x,"toString",function(){return"[object Generator]"}),e.keys=function(b){var p=Object(b),w=[];for(var $ in p)w.push($);return w.reverse(),function S(){for(;w.length;){var E=w.pop();if(E in p)return S.value=E,S.done=!1,S}return S.done=!0,S}},e.values=et,Ne.prototype={constructor:Ne,reset:function(p){if(this.prev=0,this.next=0,this.sent=this._sent=t,this.done=!1,this.delegate=null,this.method="next",this.arg=t,this.tryEntries.forEach(D),!p)for(var w in this)w.charAt(0)==="t"&&n.call(this,w)&&!isNaN(+w.slice(1))&&(this[w]=t)},stop:function(){this.done=!0;var p=this.tryEntries[0].completion;if(p.type==="throw")throw p.arg;return this.rval},dispatchException:function(p){if(this.done)throw p;var w=this;function $(Te,ge){return M.type="throw",M.arg=p,w.next=Te,ge&&(w.method="next",w.arg=t),!!ge}for(var S=this.tryEntries.length-1;S>=0;--S){var E=this.tryEntries[S],M=E.completion;if(E.tryLoc==="root")return $("end");if(E.tryLoc<=this.prev){var H=n.call(E,"catchLoc"),V=n.call(E,"finallyLoc");if(H&&V){if(this.prev<E.catchLoc)return $(E.catchLoc,!0);if(this.prev<E.finallyLoc)return $(E.finallyLoc)}else if(H){if(this.prev<E.catchLoc)return $(E.catchLoc,!0)}else{if(!V)throw Error("try statement without catch or finally");if(this.prev<E.finallyLoc)return $(E.finallyLoc)}}}},abrupt:function(p,w){for(var $=this.tryEntries.length-1;$>=0;--$){var S=this.tryEntries[$];if(S.tryLoc<=this.prev&&n.call(S,"finallyLoc")&&this.prev<S.finallyLoc){var E=S;break}}E&&(p==="break"||p==="continue")&&E.tryLoc<=w&&w<=E.finallyLoc&&(E=null);var M=E?E.completion:{};return M.type=p,M.arg=w,E?(this.method="next",this.next=E.finallyLoc,_):this.complete(M)},complete:function(p,w){if(p.type==="throw")throw p.arg;return p.type==="break"||p.type==="continue"?this.next=p.arg:p.type==="return"?(this.rval=this.arg=p.arg,this.method="return",this.next="end"):p.type==="normal"&&w&&(this.next=w),_},finish:function(p){for(var w=this.tryEntries.length-1;w>=0;--w){var $=this.tryEntries[w];if($.finallyLoc===p)return this.complete($.completion,$.afterLoc),D($),_}},catch:function(p){for(var w=this.tryEntries.length-1;w>=0;--w){var $=this.tryEntries[w];if($.tryLoc===p){var S=$.completion;if(S.type==="throw"){var E=S.arg;D($)}return E}}throw Error("illegal catch attempt")},delegateYield:function(p,w,$){return this.delegate={iterator:et(p),resultName:w,nextLoc:$},this.method==="next"&&(this.arg=t),_}},e}function tl(t,e,r,n,s,i,o){try{var a=t[i](o),l=a.value}catch(c){r(c);return}a.done?e(l):Promise.resolve(l).then(n,s)}function Up(t){return function(){var e=this,r=arguments;return new Promise(function(n,s){var i=t.apply(e,r);function o(l){tl(i,n,s,o,a,"next",l)}function a(l){tl(i,n,s,o,a,"throw",l)}o(void 0)})}}function wc(t,e){return qp(t)||Np(t,e)||_c(t,e)||jp()}function jp(){throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function Np(t,e){var r=t==null?null:typeof Symbol<"u"&&t[Symbol.iterator]||t["@@iterator"];if(r!=null){var n,s,i,o,a=[],l=!0,c=!1;try{if(i=(r=r.call(t)).next,e!==0)for(;!(l=(n=i.call(r)).done)&&(a.push(n.value),a.length!==e);l=!0);}catch(u){c=!0,s=u}finally{try{if(!l&&r.return!=null&&(o=r.return(),Object(o)!==o))return}finally{if(c)throw s}}return a}}function qp(t){if(Array.isArray(t))return t}function cr(t){"@babel/helpers - typeof";return cr=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},cr(t)}function Bp(t,e){var r=typeof Symbol<"u"&&t[Symbol.iterator]||t["@@iterator"];if(!r){if(Array.isArray(t)||(r=_c(t))||e){r&&(t=r);var n=0,s=function(){};return{s,n:function(){return n>=t.length?{done:!0}:{done:!1,value:t[n++]}},e:function(c){throw c},f:s}}throw new TypeError(`Invalid attempt to iterate non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}var i=!0,o=!1,a;return{s:function(){r=r.call(t)},n:function(){var c=r.next();return i=c.done,c},e:function(c){o=!0,a=c},f:function(){try{!i&&r.return!=null&&r.return()}finally{if(o)throw a}}}}function _c(t,e){if(t){if(typeof t=="string")return rl(t,e);var r=Object.prototype.toString.call(t).slice(8,-1);if(r==="Object"&&t.constructor&&(r=t.constructor.name),r==="Map"||r==="Set")return Array.from(t);if(r==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r))return rl(t,e)}}function rl(t,e){(e==null||e>t.length)&&(e=t.length);for(var r=0,n=new Array(e);r<e;r++)n[r]=t[r];return n}function nl(t,e){var r=Object.keys(t);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(t);e&&(n=n.filter(function(s){return Object.getOwnPropertyDescriptor(t,s).enumerable})),r.push.apply(r,n)}return r}function Ar(t){for(var e=1;e<arguments.length;e++){var r=arguments[e]!=null?arguments[e]:{};e%2?nl(Object(r),!0).forEach(function(n){Mp(t,n,r[n])}):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(r)):nl(Object(r)).forEach(function(n){Object.defineProperty(t,n,Object.getOwnPropertyDescriptor(r,n))})}return t}function Mp(t,e,r){return e=bc(e),e in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}function Fp(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function sl(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,bc(n.key),n)}}function Wp(t,e,r){return e&&sl(t.prototype,e),r&&sl(t,r),Object.defineProperty(t,"prototype",{writable:!1}),t}function bc(t){var e=Hp(t,"string");return cr(e)=="symbol"?e:e+""}function Hp(t,e){if(cr(t)!="object"||!t)return t;var r=t[Symbol.toPrimitive];if(r!==void 0){var n=r.call(t,e);if(cr(n)!="object")return n;throw new TypeError("@@toPrimitive must return a primitive value.")}return String(t)}var ms="tus-v1",gs="ietf-draft-03",cn="ietf-draft-05",Gp={endpoint:null,uploadUrl:null,metadata:{},metadataForPartialUploads:{},fingerprint:null,uploadSize:null,onProgress:null,onChunkComplete:null,onSuccess:null,onError:null,onUploadUrlAvailable:null,overridePatchMethod:!1,headers:{},addRequestId:!1,onBeforeRequest:null,onAfterResponse:null,onShouldRetry:Sc,chunkSize:Number.POSITIVE_INFINITY,retryDelays:[0,1e3,3e3,5e3],parallelUploads:1,parallelUploadBoundaries:null,storeFingerprintForResuming:!0,removeFingerprintOnSuccess:!1,uploadLengthDeferred:!1,uploadDataDuringCreation:!1,urlStorage:null,fileReader:null,httpStack:null,protocol:ms},Is=(function(){function t(e,r){Fp(this,t),"resume"in r&&console.log("tus: The `resume` option has been removed in tus-js-client v2. Please use the URL storage API instead."),this.options=r,this.options.chunkSize=Number(this.options.chunkSize),this._urlStorage=this.options.urlStorage,this.file=e,this.url=null,this._req=null,this._fingerprint=null,this._urlStorageKey=null,this._offset=null,this._aborted=!1,this._size=null,this._source=null,this._retryAttempt=0,this._retryTimeout=null,this._offsetBeforeRetry=0,this._parallelUploads=null,this._parallelUploadUrls=null}return Wp(t,[{key:"findPreviousUploads",value:function(){var r=this;return this.options.fingerprint(this.file,this.options).then(function(n){return r._urlStorage.findUploadsByFingerprint(n)})}},{key:"resumeFromPreviousUpload",value:function(r){this.url=r.uploadUrl||null,this._parallelUploadUrls=r.parallelUploadUrls||null,this._urlStorageKey=r.urlStorageKey}},{key:"start",value:function(){var r=this,n=this.file;if(!n){this._emitError(new Error("tus: no file or stream to upload provided"));return}if(![ms,gs,cn].includes(this.options.protocol)){this._emitError(new Error("tus: unsupported protocol ".concat(this.options.protocol)));return}if(!this.options.endpoint&&!this.options.uploadUrl&&!this.url){this._emitError(new Error("tus: neither an endpoint or an upload URL is provided"));return}var s=this.options.retryDelays;if(s!=null&&Object.prototype.toString.call(s)!=="[object Array]"){this._emitError(new Error("tus: the `retryDelays` option must either be an array or null"));return}if(this.options.parallelUploads>1)for(var i=0,o=["uploadUrl","uploadSize","uploadLengthDeferred"];i<o.length;i++){var a=o[i];if(this.options[a]){this._emitError(new Error("tus: cannot use the ".concat(a," option when parallelUploads is enabled")));return}}if(this.options.parallelUploadBoundaries){if(this.options.parallelUploads<=1){this._emitError(new Error("tus: cannot use the `parallelUploadBoundaries` option when `parallelUploads` is disabled"));return}if(this.options.parallelUploads!==this.options.parallelUploadBoundaries.length){this._emitError(new Error("tus: the `parallelUploadBoundaries` must have the same length as the value of `parallelUploads`"));return}}this.options.fingerprint(n,this.options).then(function(l){return r._fingerprint=l,r._source?r._source:r.options.fileReader.openFile(n,r.options.chunkSize)}).then(function(l){if(r._source=l,r.options.uploadLengthDeferred)r._size=null;else if(r.options.uploadSize!=null){if(r._size=Number(r.options.uploadSize),Number.isNaN(r._size)){r._emitError(new Error("tus: cannot convert `uploadSize` option into a number"));return}}else if(r._size=r._source.size,r._size==null){r._emitError(new Error("tus: cannot automatically derive upload's size from input. Specify it manually using the `uploadSize` option or use the `uploadLengthDeferred` option"));return}r.options.parallelUploads>1||r._parallelUploadUrls!=null?r._startParallelUpload():r._startSingleUpload()}).catch(function(l){r._emitError(l)})}},{key:"_startParallelUpload",value:function(){var r,n=this,s=this._size,i=0;this._parallelUploads=[];var o=this._parallelUploadUrls!=null?this._parallelUploadUrls.length:this.options.parallelUploads,a=(r=this.options.parallelUploadBoundaries)!==null&&r!==void 0?r:zp(this._source.size,o);this._parallelUploadUrls&&a.forEach(function(u,d){u.uploadUrl=n._parallelUploadUrls[d]||null}),this._parallelUploadUrls=new Array(a.length);var l=a.map(function(u,d){var f=0;return n._source.slice(u.start,u.end).then(function(h){var y=h.value;return new Promise(function(v,_){var R=Ar(Ar({},n.options),{},{uploadUrl:u.uploadUrl||null,storeFingerprintForResuming:!1,removeFingerprintOnSuccess:!1,parallelUploads:1,parallelUploadBoundaries:null,metadata:n.options.metadataForPartialUploads,headers:Ar(Ar({},n.options.headers),{},{"Upload-Concat":"partial"}),onSuccess:v,onError:_,onProgress:function(k){i=i-f+k,f=k,n._emitProgress(i,s)},onUploadUrlAvailable:function(){n._parallelUploadUrls[d]=g.url,n._parallelUploadUrls.filter(function(k){return!!k}).length===a.length&&n._saveUploadInUrlStorage()}}),g=new t(y,R);g.start(),n._parallelUploads.push(g)})})}),c;Promise.all(l).then(function(){c=n._openRequest("POST",n.options.endpoint),c.setHeader("Upload-Concat","final;".concat(n._parallelUploadUrls.join(" ")));var u=il(n.options.metadata);return u!==""&&c.setHeader("Upload-Metadata",u),n._sendRequest(c,null)}).then(function(u){if(!$r(u.getStatus(),200)){n._emitHttpError(c,u,"tus: unexpected response while creating upload");return}var d=u.getHeader("Location");if(d==null){n._emitHttpError(c,u,"tus: invalid or missing Location header");return}n.url=cl(n.options.endpoint,d),"Created upload at ".concat(n.url),n._emitSuccess(u)}).catch(function(u){n._emitError(u)})}},{key:"_startSingleUpload",value:function(){if(this._aborted=!1,this.url!=null){"Resuming upload from previous URL: ".concat(this.url),this._resumeUpload();return}if(this.options.uploadUrl!=null){"Resuming upload from provided URL: ".concat(this.options.uploadUrl),this.url=this.options.uploadUrl,this._resumeUpload();return}this._createUpload()}},{key:"abort",value:function(r){var n=this;if(this._parallelUploads!=null){var s=Bp(this._parallelUploads),i;try{for(s.s();!(i=s.n()).done;){var o=i.value;o.abort(r)}}catch(a){s.e(a)}finally{s.f()}}return this._req!==null&&this._req.abort(),this._aborted=!0,this._retryTimeout!=null&&(clearTimeout(this._retryTimeout),this._retryTimeout=null),!r||this.url==null?Promise.resolve():t.terminate(this.url,this.options).then(function(){return n._removeFromUrlStorage()})}},{key:"_emitHttpError",value:function(r,n,s,i){this._emitError(new os(s,i,r,n))}},{key:"_emitError",value:function(r){var n=this;if(!this._aborted){if(this.options.retryDelays!=null){var s=this._offset!=null&&this._offset>this._offsetBeforeRetry;if(s&&(this._retryAttempt=0),ll(r,this._retryAttempt,this.options)){var i=this.options.retryDelays[this._retryAttempt++];this._offsetBeforeRetry=this._offset,this._retryTimeout=setTimeout(function(){n.start()},i);return}}if(typeof this.options.onError=="function")this.options.onError(r);else throw r}}},{key:"_emitSuccess",value:function(r){this.options.removeFingerprintOnSuccess&&this._removeFromUrlStorage(),typeof this.options.onSuccess=="function"&&this.options.onSuccess({lastResponse:r})}},{key:"_emitProgress",value:function(r,n){typeof this.options.onProgress=="function"&&this.options.onProgress(r,n)}},{key:"_emitChunkComplete",value:function(r,n,s){typeof this.options.onChunkComplete=="function"&&this.options.onChunkComplete(r,n,s)}},{key:"_createUpload",value:function(){var r=this;if(!this.options.endpoint){this._emitError(new Error("tus: unable to create upload because no endpoint is provided"));return}var n=this._openRequest("POST",this.options.endpoint);this.options.uploadLengthDeferred?n.setHeader("Upload-Defer-Length","1"):n.setHeader("Upload-Length","".concat(this._size));var s=il(this.options.metadata);s!==""&&n.setHeader("Upload-Metadata",s);var i;this.options.uploadDataDuringCreation&&!this.options.uploadLengthDeferred?(this._offset=0,i=this._addChunkToRequest(n)):((this.options.protocol===gs||this.options.protocol===cn)&&n.setHeader("Upload-Complete","?0"),i=this._sendRequest(n,null)),i.then(function(o){if(!$r(o.getStatus(),200)){r._emitHttpError(n,o,"tus: unexpected response while creating upload");return}var a=o.getHeader("Location");if(a==null){r._emitHttpError(n,o,"tus: invalid or missing Location header");return}if(r.url=cl(r.options.endpoint,a),"Created upload at ".concat(r.url),typeof r.options.onUploadUrlAvailable=="function"&&r.options.onUploadUrlAvailable(),r._size===0){r._emitSuccess(o),r._source.close();return}r._saveUploadInUrlStorage().then(function(){r.options.uploadDataDuringCreation?r._handleUploadResponse(n,o):(r._offset=0,r._performUpload())})}).catch(function(o){r._emitHttpError(n,null,"tus: failed to create upload",o)})}},{key:"_resumeUpload",value:function(){var r=this,n=this._openRequest("HEAD",this.url),s=this._sendRequest(n,null);s.then(function(i){var o=i.getStatus();if(!$r(o,200)){if(o===423){r._emitHttpError(n,i,"tus: upload is currently locked; retry later");return}if($r(o,400)&&r._removeFromUrlStorage(),!r.options.endpoint){r._emitHttpError(n,i,"tus: unable to resume upload (new upload cannot be created without an endpoint)");return}r.url=null,r._createUpload();return}var a=Number.parseInt(i.getHeader("Upload-Offset"),10);if(Number.isNaN(a)){r._emitHttpError(n,i,"tus: invalid or missing offset value");return}var l=Number.parseInt(i.getHeader("Upload-Length"),10);if(Number.isNaN(l)&&!r.options.uploadLengthDeferred&&r.options.protocol===ms){r._emitHttpError(n,i,"tus: invalid or missing length value");return}typeof r.options.onUploadUrlAvailable=="function"&&r.options.onUploadUrlAvailable(),r._saveUploadInUrlStorage().then(function(){if(a===l){r._emitProgress(l,l),r._emitSuccess(i);return}r._offset=a,r._performUpload()})}).catch(function(i){r._emitHttpError(n,null,"tus: failed to resume upload",i)})}},{key:"_performUpload",value:function(){var r=this;if(!this._aborted){var n;this.options.overridePatchMethod?(n=this._openRequest("POST",this.url),n.setHeader("X-HTTP-Method-Override","PATCH")):n=this._openRequest("PATCH",this.url),n.setHeader("Upload-Offset","".concat(this._offset));var s=this._addChunkToRequest(n);s.then(function(i){if(!$r(i.getStatus(),200)){r._emitHttpError(n,i,"tus: unexpected response while uploading chunk");return}r._handleUploadResponse(n,i)}).catch(function(i){r._aborted||r._emitHttpError(n,null,"tus: failed to upload chunk at offset ".concat(r._offset),i)})}}},{key:"_addChunkToRequest",value:function(r){var n=this,s=this._offset,i=this._offset+this.options.chunkSize;return r.setProgressHandler(function(o){n._emitProgress(s+o,n._size)}),this.options.protocol===ms?r.setHeader("Content-Type","application/offset+octet-stream"):this.options.protocol===cn&&r.setHeader("Content-Type","application/partial-upload"),(i===Number.POSITIVE_INFINITY||i>this._size)&&!this.options.uploadLengthDeferred&&(i=this._size),this._source.slice(s,i).then(function(o){var a=o.value,l=o.done,c=a!=null&&a.size?a.size:0;n.options.uploadLengthDeferred&&l&&(n._size=n._offset+c,r.setHeader("Upload-Length","".concat(n._size)));var u=n._offset+c;return!n.options.uploadLengthDeferred&&l&&u!==n._size?Promise.reject(new Error("upload was configured with a size of ".concat(n._size," bytes, but the source is done after ").concat(u," bytes"))):a===null?n._sendRequest(r):((n.options.protocol===gs||n.options.protocol===cn)&&r.setHeader("Upload-Complete",l?"?1":"?0"),n._emitProgress(n._offset,n._size),n._sendRequest(r,a))})}},{key:"_handleUploadResponse",value:function(r,n){var s=Number.parseInt(n.getHeader("Upload-Offset"),10);if(Number.isNaN(s)){this._emitHttpError(r,n,"tus: invalid or missing offset value");return}if(this._emitProgress(s,this._size),this._emitChunkComplete(s-this._offset,s,this._size),this._offset=s,s===this._size){this._emitSuccess(n),this._source.close();return}this._performUpload()}},{key:"_openRequest",value:function(r,n){var s=ol(r,n,this.options);return this._req=s,s}},{key:"_removeFromUrlStorage",value:function(){var r=this;this._urlStorageKey&&(this._urlStorage.removeUpload(this._urlStorageKey).catch(function(n){r._emitError(n)}),this._urlStorageKey=null)}},{key:"_saveUploadInUrlStorage",value:function(){var r=this;if(!this.options.storeFingerprintForResuming||!this._fingerprint||this._urlStorageKey!==null)return Promise.resolve();var n={size:this._size,metadata:this.options.metadata,creationTime:new Date().toString()};return this._parallelUploads?n.parallelUploadUrls=this._parallelUploadUrls:n.uploadUrl=this.url,this._urlStorage.addUpload(this._fingerprint,n).then(function(s){r._urlStorageKey=s})}},{key:"_sendRequest",value:function(r){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:null;return al(r,n,this.options)}}],[{key:"terminate",value:function(r){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},s=ol("DELETE",r,n);return al(s,null,n).then(function(i){if(i.getStatus()!==204)throw new os("tus: unexpected response while terminating upload",null,s,i)}).catch(function(i){if(i instanceof os||(i=new os("tus: failed to terminate upload",i,s,null)),!ll(i,0,n))throw i;var o=n.retryDelays[0],a=n.retryDelays.slice(1),l=Ar(Ar({},n),{},{retryDelays:a});return new Promise(function(c){return setTimeout(c,o)}).then(function(){return t.terminate(r,l)})})}}])})();function il(t){return Object.entries(t).map(function(e){var r=wc(e,2),n=r[0],s=r[1];return"".concat(n," ").concat(Rp.encode(String(s)))}).join(",")}function $r(t,e){return t>=e&&t<e+100}function ol(t,e,r){var n=r.httpStack.createRequest(t,e);r.protocol===gs?n.setHeader("Upload-Draft-Interop-Version","5"):r.protocol===cn?n.setHeader("Upload-Draft-Interop-Version","6"):n.setHeader("Tus-Resumable","1.0.0");for(var s=r.headers||{},i=0,o=Object.entries(s);i<o.length;i++){var a=wc(o[i],2),l=a[0],c=a[1];n.setHeader(l,c)}if(r.addRequestId){var u=Dp();n.setHeader("X-Request-ID",u)}return n}function al(t,e,r){return eo.apply(this,arguments)}function eo(){return eo=Up(Zi().mark(function t(e,r,n){var s;return Zi().wrap(function(o){for(;;)switch(o.prev=o.next){case 0:if(typeof n.onBeforeRequest!="function"){o.next=3;break}return o.next=3,n.onBeforeRequest(e);case 3:return o.next=5,e.send(r);case 5:if(s=o.sent,typeof n.onAfterResponse!="function"){o.next=9;break}return o.next=9,n.onAfterResponse(e,s);case 9:return o.abrupt("return",s);case 10:case"end":return o.stop()}},t)})),eo.apply(this,arguments)}function Vp(){var t=!0;return typeof navigator<"u"&&navigator.onLine===!1&&(t=!1),t}function ll(t,e,r){return r.retryDelays==null||e>=r.retryDelays.length||t.originalRequest==null?!1:r&&typeof r.onShouldRetry=="function"?r.onShouldRetry(t,e,r):Sc(t)}function Sc(t){var e=t.originalResponse?t.originalResponse.getStatus():0;return(!$r(e,400)||e===409||e===423)&&Vp()}function cl(t,e){return new Lp(e,t).toString()}function zp(t,e){for(var r=Math.floor(t/e),n=[],s=0;s<e;s++)n.push({start:r*s,end:r*(s+1)});return n[e-1].end=t,n}Is.defaultOptions=Gp;var kc=function(){return typeof navigator<"u"&&typeof navigator.product=="string"&&navigator.product.toLowerCase()==="reactnative"};function Kp(t){return new Promise(function(e,r){var n=new XMLHttpRequest;n.responseType="blob",n.onload=function(){var s=n.response;e(s)},n.onerror=function(s){r(s)},n.open("GET",t),n.send()})}var Jp=function(){return typeof window<"u"&&(typeof window.PhoneGap<"u"||typeof window.Cordova<"u"||typeof window.cordova<"u")};function Yp(t){return new Promise(function(e,r){var n=new FileReader;n.onload=function(){var s=new Uint8Array(n.result);e({value:s})},n.onerror=function(s){r(s)},n.readAsArrayBuffer(t)})}function En(t){"@babel/helpers - typeof";return En=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},En(t)}function Xp(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function Qp(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,em(n.key),n)}}function Zp(t,e,r){return e&&Qp(t.prototype,e),Object.defineProperty(t,"prototype",{writable:!1}),t}function em(t){var e=tm(t,"string");return En(e)=="symbol"?e:e+""}function tm(t,e){if(En(t)!="object"||!t)return t;var r=t[Symbol.toPrimitive];if(r!==void 0){var n=r.call(t,e);if(En(n)!="object")return n;throw new TypeError("@@toPrimitive must return a primitive value.")}return String(t)}var ul=(function(){function t(e){Xp(this,t),this._file=e,this.size=e.size}return Zp(t,[{key:"slice",value:function(r,n){if(Jp())return Yp(this._file.slice(r,n));var s=this._file.slice(r,n),i=n>=this.size;return Promise.resolve({value:s,done:i})}},{key:"close",value:function(){}}])})();function Tn(t){"@babel/helpers - typeof";return Tn=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},Tn(t)}function rm(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function nm(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,im(n.key),n)}}function sm(t,e,r){return e&&nm(t.prototype,e),Object.defineProperty(t,"prototype",{writable:!1}),t}function im(t){var e=om(t,"string");return Tn(e)=="symbol"?e:e+""}function om(t,e){if(Tn(t)!="object"||!t)return t;var r=t[Symbol.toPrimitive];if(r!==void 0){var n=r.call(t,e);if(Tn(n)!="object")return n;throw new TypeError("@@toPrimitive must return a primitive value.")}return String(t)}function dl(t){return t===void 0?0:t.size!==void 0?t.size:t.length}function am(t,e){if(t.concat)return t.concat(e);if(t instanceof Blob)return new Blob([t,e],{type:t.type});if(t.set){var r=new t.constructor(t.length+e.length);return r.set(t),r.set(e,t.length),r}throw new Error("Unknown data type")}var lm=(function(){function t(e){rm(this,t),this._buffer=void 0,this._bufferOffset=0,this._reader=e,this._done=!1}return sm(t,[{key:"slice",value:function(r,n){return r<this._bufferOffset?Promise.reject(new Error("Requested data is before the reader's current offset")):this._readUntilEnoughDataOrDone(r,n)}},{key:"_readUntilEnoughDataOrDone",value:function(r,n){var s=this,i=n<=this._bufferOffset+dl(this._buffer);if(this._done||i){var o=this._getDataFromBuffer(r,n),a=o==null?this._done:!1;return Promise.resolve({value:o,done:a})}return this._reader.read().then(function(l){var c=l.value,u=l.done;return u?s._done=!0:s._buffer===void 0?s._buffer=c:s._buffer=am(s._buffer,c),s._readUntilEnoughDataOrDone(r,n)})}},{key:"_getDataFromBuffer",value:function(r,n){r>this._bufferOffset&&(this._buffer=this._buffer.slice(r-this._bufferOffset),this._bufferOffset=r);var s=dl(this._buffer)===0;return this._done&&s?null:this._buffer.slice(0,n-r)}},{key:"close",value:function(){this._reader.cancel&&this._reader.cancel()}}])})();function ur(t){"@babel/helpers - typeof";return ur=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},ur(t)}function to(){to=function(){return e};var t,e={},r=Object.prototype,n=r.hasOwnProperty,s=Object.defineProperty||function(b,p,w){b[p]=w.value},i=typeof Symbol=="function"?Symbol:{},o=i.iterator||"@@iterator",a=i.asyncIterator||"@@asyncIterator",l=i.toStringTag||"@@toStringTag";function c(b,p,w){return Object.defineProperty(b,p,{value:w,enumerable:!0,configurable:!0,writable:!0}),b[p]}try{c({},"")}catch{c=function(w,$,S){return w[$]=S}}function u(b,p,w,$){var S=p&&p.prototype instanceof R?p:R,E=Object.create(S.prototype),M=new Ne($||[]);return s(E,"_invoke",{value:pe(b,w,M)}),E}function d(b,p,w){try{return{type:"normal",arg:b.call(p,w)}}catch($){return{type:"throw",arg:$}}}e.wrap=u;var f="suspendedStart",h="suspendedYield",y="executing",v="completed",_={};function R(){}function g(){}function m(){}var k={};c(k,o,function(){return this});var A=Object.getPrototypeOf,C=A&&A(A(et([])));C&&C!==r&&n.call(C,o)&&(k=C);var x=m.prototype=R.prototype=Object.create(k);function W(b){["next","throw","return"].forEach(function(p){c(b,p,function(w){return this._invoke(p,w)})})}function q(b,p){function w(S,E,M,H){var V=d(b[S],b,E);if(V.type!=="throw"){var Te=V.arg,ge=Te.value;return ge&&ur(ge)=="object"&&n.call(ge,"__await")?p.resolve(ge.__await).then(function(Ae){w("next",Ae,M,H)},function(Ae){w("throw",Ae,M,H)}):p.resolve(ge).then(function(Ae){Te.value=Ae,M(Te)},function(Ae){return w("throw",Ae,M,H)})}H(V.arg)}var $;s(this,"_invoke",{value:function(E,M){function H(){return new p(function(V,Te){w(E,M,V,Te)})}return $=$?$.then(H,H):H()}})}function pe(b,p,w){var $=f;return function(S,E){if($===y)throw Error("Generator is already running");if($===v){if(S==="throw")throw E;return{value:t,done:!0}}for(w.method=S,w.arg=E;;){var M=w.delegate;if(M){var H=je(M,w);if(H){if(H===_)continue;return H}}if(w.method==="next")w.sent=w._sent=w.arg;else if(w.method==="throw"){if($===f)throw $=v,w.arg;w.dispatchException(w.arg)}else w.method==="return"&&w.abrupt("return",w.arg);$=y;var V=d(b,p,w);if(V.type==="normal"){if($=w.done?v:h,V.arg===_)continue;return{value:V.arg,done:w.done}}V.type==="throw"&&($=v,w.method="throw",w.arg=V.arg)}}}function je(b,p){var w=p.method,$=b.iterator[w];if($===t)return p.delegate=null,w==="throw"&&b.iterator.return&&(p.method="return",p.arg=t,je(b,p),p.method==="throw")||w!=="return"&&(p.method="throw",p.arg=new TypeError("The iterator does not provide a '"+w+"' method")),_;var S=d($,b.iterator,p.arg);if(S.type==="throw")return p.method="throw",p.arg=S.arg,p.delegate=null,_;var E=S.arg;return E?E.done?(p[b.resultName]=E.value,p.next=b.nextLoc,p.method!=="return"&&(p.method="next",p.arg=t),p.delegate=null,_):E:(p.method="throw",p.arg=new TypeError("iterator result is not an object"),p.delegate=null,_)}function _t(b){var p={tryLoc:b[0]};1 in b&&(p.catchLoc=b[1]),2 in b&&(p.finallyLoc=b[2],p.afterLoc=b[3]),this.tryEntries.push(p)}function D(b){var p=b.completion||{};p.type="normal",delete p.arg,b.completion=p}function Ne(b){this.tryEntries=[{tryLoc:"root"}],b.forEach(_t,this),this.reset(!0)}function et(b){if(b||b===""){var p=b[o];if(p)return p.call(b);if(typeof b.next=="function")return b;if(!isNaN(b.length)){var w=-1,$=function S(){for(;++w<b.length;)if(n.call(b,w))return S.value=b[w],S.done=!1,S;return S.value=t,S.done=!0,S};return $.next=$}}throw new TypeError(ur(b)+" is not iterable")}return g.prototype=m,s(x,"constructor",{value:m,configurable:!0}),s(m,"constructor",{value:g,configurable:!0}),g.displayName=c(m,l,"GeneratorFunction"),e.isGeneratorFunction=function(b){var p=typeof b=="function"&&b.constructor;return!!p&&(p===g||(p.displayName||p.name)==="GeneratorFunction")},e.mark=function(b){return Object.setPrototypeOf?Object.setPrototypeOf(b,m):(b.__proto__=m,c(b,l,"GeneratorFunction")),b.prototype=Object.create(x),b},e.awrap=function(b){return{__await:b}},W(q.prototype),c(q.prototype,a,function(){return this}),e.AsyncIterator=q,e.async=function(b,p,w,$,S){S===void 0&&(S=Promise);var E=new q(u(b,p,w,$),S);return e.isGeneratorFunction(p)?E:E.next().then(function(M){return M.done?M.value:E.next()})},W(x),c(x,l,"Generator"),c(x,o,function(){return this}),c(x,"toString",function(){return"[object Generator]"}),e.keys=function(b){var p=Object(b),w=[];for(var $ in p)w.push($);return w.reverse(),function S(){for(;w.length;){var E=w.pop();if(E in p)return S.value=E,S.done=!1,S}return S.done=!0,S}},e.values=et,Ne.prototype={constructor:Ne,reset:function(p){if(this.prev=0,this.next=0,this.sent=this._sent=t,this.done=!1,this.delegate=null,this.method="next",this.arg=t,this.tryEntries.forEach(D),!p)for(var w in this)w.charAt(0)==="t"&&n.call(this,w)&&!isNaN(+w.slice(1))&&(this[w]=t)},stop:function(){this.done=!0;var p=this.tryEntries[0].completion;if(p.type==="throw")throw p.arg;return this.rval},dispatchException:function(p){if(this.done)throw p;var w=this;function $(Te,ge){return M.type="throw",M.arg=p,w.next=Te,ge&&(w.method="next",w.arg=t),!!ge}for(var S=this.tryEntries.length-1;S>=0;--S){var E=this.tryEntries[S],M=E.completion;if(E.tryLoc==="root")return $("end");if(E.tryLoc<=this.prev){var H=n.call(E,"catchLoc"),V=n.call(E,"finallyLoc");if(H&&V){if(this.prev<E.catchLoc)return $(E.catchLoc,!0);if(this.prev<E.finallyLoc)return $(E.finallyLoc)}else if(H){if(this.prev<E.catchLoc)return $(E.catchLoc,!0)}else{if(!V)throw Error("try statement without catch or finally");if(this.prev<E.finallyLoc)return $(E.finallyLoc)}}}},abrupt:function(p,w){for(var $=this.tryEntries.length-1;$>=0;--$){var S=this.tryEntries[$];if(S.tryLoc<=this.prev&&n.call(S,"finallyLoc")&&this.prev<S.finallyLoc){var E=S;break}}E&&(p==="break"||p==="continue")&&E.tryLoc<=w&&w<=E.finallyLoc&&(E=null);var M=E?E.completion:{};return M.type=p,M.arg=w,E?(this.method="next",this.next=E.finallyLoc,_):this.complete(M)},complete:function(p,w){if(p.type==="throw")throw p.arg;return p.type==="break"||p.type==="continue"?this.next=p.arg:p.type==="return"?(this.rval=this.arg=p.arg,this.method="return",this.next="end"):p.type==="normal"&&w&&(this.next=w),_},finish:function(p){for(var w=this.tryEntries.length-1;w>=0;--w){var $=this.tryEntries[w];if($.finallyLoc===p)return this.complete($.completion,$.afterLoc),D($),_}},catch:function(p){for(var w=this.tryEntries.length-1;w>=0;--w){var $=this.tryEntries[w];if($.tryLoc===p){var S=$.completion;if(S.type==="throw"){var E=S.arg;D($)}return E}}throw Error("illegal catch attempt")},delegateYield:function(p,w,$){return this.delegate={iterator:et(p),resultName:w,nextLoc:$},this.method==="next"&&(this.arg=t),_}},e}function hl(t,e,r,n,s,i,o){try{var a=t[i](o),l=a.value}catch(c){r(c);return}a.done?e(l):Promise.resolve(l).then(n,s)}function cm(t){return function(){var e=this,r=arguments;return new Promise(function(n,s){var i=t.apply(e,r);function o(l){hl(i,n,s,o,a,"next",l)}function a(l){hl(i,n,s,o,a,"throw",l)}o(void 0)})}}function um(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function dm(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,fm(n.key),n)}}function hm(t,e,r){return e&&dm(t.prototype,e),Object.defineProperty(t,"prototype",{writable:!1}),t}function fm(t){var e=pm(t,"string");return ur(e)=="symbol"?e:e+""}function pm(t,e){if(ur(t)!="object"||!t)return t;var r=t[Symbol.toPrimitive];if(r!==void 0){var n=r.call(t,e);if(ur(n)!="object")return n;throw new TypeError("@@toPrimitive must return a primitive value.")}return String(t)}var mm=(function(){function t(){um(this,t)}return hm(t,[{key:"openFile",value:(function(){var e=cm(to().mark(function n(s,i){var o;return to().wrap(function(l){for(;;)switch(l.prev=l.next){case 0:if(!(kc()&&s&&typeof s.uri<"u")){l.next=11;break}return l.prev=1,l.next=4,Kp(s.uri);case 4:return o=l.sent,l.abrupt("return",new ul(o));case 8:throw l.prev=8,l.t0=l.catch(1),new Error("tus: cannot fetch `file.uri` as Blob, make sure the uri is correct and accessible. ".concat(l.t0));case 11:if(!(typeof s.slice=="function"&&typeof s.size<"u")){l.next=13;break}return l.abrupt("return",Promise.resolve(new ul(s)));case 13:if(typeof s.read!="function"){l.next=18;break}if(i=Number(i),Number.isFinite(i)){l.next=17;break}return l.abrupt("return",Promise.reject(new Error("cannot create source for stream without a finite value for the `chunkSize` option")));case 17:return l.abrupt("return",Promise.resolve(new lm(s,i)));case 18:return l.abrupt("return",Promise.reject(new Error("source object may only be an instance of File, Blob, or Reader in this environment")));case 19:case"end":return l.stop()}},n,null,[[1,8]])}));function r(n,s){return e.apply(this,arguments)}return r})()}])})();function gm(t,e){return kc()?Promise.resolve(ym(t,e)):Promise.resolve(["tus-br",t.name,t.type,t.size,t.lastModified,e.endpoint].join("-"))}function ym(t,e){var r=t.exif?vm(JSON.stringify(t.exif)):"noexif";return["tus-rn",t.name||"noname",t.size||"nosize",r,e.endpoint].join("/")}function vm(t){var e=0;if(t.length===0)return e;for(var r=0;r<t.length;r++){var n=t.charCodeAt(r);e=(e<<5)-e+n,e&=e}return e}function An(t){"@babel/helpers - typeof";return An=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},An(t)}function To(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function wm(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,_m(n.key),n)}}function Ao(t,e,r){return e&&wm(t.prototype,e),Object.defineProperty(t,"prototype",{writable:!1}),t}function _m(t){var e=bm(t,"string");return An(e)=="symbol"?e:e+""}function bm(t,e){if(An(t)!="object"||!t)return t;var r=t[Symbol.toPrimitive];if(r!==void 0){var n=r.call(t,e);if(An(n)!="object")return n;throw new TypeError("@@toPrimitive must return a primitive value.")}return String(t)}var Sm=(function(){function t(){To(this,t)}return Ao(t,[{key:"createRequest",value:function(r,n){return new km(r,n)}},{key:"getName",value:function(){return"XHRHttpStack"}}])})(),km=(function(){function t(e,r){To(this,t),this._xhr=new XMLHttpRequest,this._xhr.open(e,r,!0),this._method=e,this._url=r,this._headers={}}return Ao(t,[{key:"getMethod",value:function(){return this._method}},{key:"getURL",value:function(){return this._url}},{key:"setHeader",value:function(r,n){this._xhr.setRequestHeader(r,n),this._headers[r]=n}},{key:"getHeader",value:function(r){return this._headers[r]}},{key:"setProgressHandler",value:function(r){"upload"in this._xhr&&(this._xhr.upload.onprogress=function(n){n.lengthComputable&&r(n.loaded)})}},{key:"send",value:function(){var r=this,n=arguments.length>0&&arguments[0]!==void 0?arguments[0]:null;return new Promise(function(s,i){r._xhr.onload=function(){s(new Em(r._xhr))},r._xhr.onerror=function(o){i(o)},r._xhr.send(n)})}},{key:"abort",value:function(){return this._xhr.abort(),Promise.resolve()}},{key:"getUnderlyingObject",value:function(){return this._xhr}}])})(),Em=(function(){function t(e){To(this,t),this._xhr=e}return Ao(t,[{key:"getStatus",value:function(){return this._xhr.status}},{key:"getHeader",value:function(r){return this._xhr.getResponseHeader(r)}},{key:"getBody",value:function(){return this._xhr.responseText}},{key:"getUnderlyingObject",value:function(){return this._xhr}}])})();function On(t){"@babel/helpers - typeof";return On=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},On(t)}function Tm(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function Am(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,Rm(n.key),n)}}function Om(t,e,r){return e&&Am(t.prototype,e),Object.defineProperty(t,"prototype",{writable:!1}),t}function Rm(t){var e=$m(t,"string");return On(e)=="symbol"?e:e+""}function $m(t,e){if(On(t)!="object"||!t)return t;var r=t[Symbol.toPrimitive];if(r!==void 0){var n=r.call(t,e);if(On(n)!="object")return n;throw new TypeError("@@toPrimitive must return a primitive value.")}return String(t)}var ro=!1;try{ro="localStorage"in window;var Pi="tusSupport",fl=localStorage.getItem(Pi);localStorage.setItem(Pi,fl),fl===null&&localStorage.removeItem(Pi)}catch(t){if(t.code===t.SECURITY_ERR||t.code===t.QUOTA_EXCEEDED_ERR)ro=!1;else throw t}var xm=ro,Pm=(function(){function t(){Tm(this,t)}return Om(t,[{key:"findAllUploads",value:function(){var r=this._findEntries("tus::");return Promise.resolve(r)}},{key:"findUploadsByFingerprint",value:function(r){var n=this._findEntries("tus::".concat(r,"::"));return Promise.resolve(n)}},{key:"removeUpload",value:function(r){return localStorage.removeItem(r),Promise.resolve()}},{key:"addUpload",value:function(r,n){var s=Math.round(Math.random()*1e12),i="tus::".concat(r,"::").concat(s);return localStorage.setItem(i,JSON.stringify(n)),Promise.resolve(i)}},{key:"_findEntries",value:function(r){for(var n=[],s=0;s<localStorage.length;s++){var i=localStorage.key(s);if(i.indexOf(r)===0)try{var o=JSON.parse(localStorage.getItem(i));o.urlStorageKey=i,n.push(o)}catch{}}return n}}])})();function qr(t){"@babel/helpers - typeof";return qr=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},qr(t)}function Cm(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function Im(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,Tc(n.key),n)}}function Lm(t,e,r){return r&&Im(t,r),Object.defineProperty(t,"prototype",{writable:!1}),t}function Dm(t,e,r){return e=Ls(e),Um(t,Ec()?Reflect.construct(e,r||[],Ls(t).constructor):e.apply(t,r))}function Um(t,e){if(e&&(qr(e)==="object"||typeof e=="function"))return e;if(e!==void 0)throw new TypeError("Derived constructors may only return object or undefined");return jm(t)}function jm(t){if(t===void 0)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return t}function Ec(){try{var t=!Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],function(){}))}catch{}return(Ec=function(){return!!t})()}function Ls(t){return Ls=Object.setPrototypeOf?Object.getPrototypeOf.bind():function(r){return r.__proto__||Object.getPrototypeOf(r)},Ls(t)}function Nm(t,e){if(typeof e!="function"&&e!==null)throw new TypeError("Super expression must either be null or a function");t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,writable:!0,configurable:!0}}),Object.defineProperty(t,"prototype",{writable:!1}),e&&no(t,e)}function no(t,e){return no=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(n,s){return n.__proto__=s,n},no(t,e)}function pl(t,e){var r=Object.keys(t);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(t);e&&(n=n.filter(function(s){return Object.getOwnPropertyDescriptor(t,s).enumerable})),r.push.apply(r,n)}return r}function xr(t){for(var e=1;e<arguments.length;e++){var r=arguments[e]!=null?arguments[e]:{};e%2?pl(Object(r),!0).forEach(function(n){qm(t,n,r[n])}):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(r)):pl(Object(r)).forEach(function(n){Object.defineProperty(t,n,Object.getOwnPropertyDescriptor(r,n))})}return t}function qm(t,e,r){return e=Tc(e),e in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}function Tc(t){var e=Bm(t,"string");return qr(e)=="symbol"?e:e+""}function Bm(t,e){if(qr(t)!="object"||!t)return t;var r=t[Symbol.toPrimitive];if(r!==void 0){var n=r.call(t,e);if(qr(n)!="object")return n;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(t)}var ml=xr(xr({},Is.defaultOptions),{},{httpStack:new Sm,fileReader:new mm,urlStorage:xm?new Pm:new gp,fingerprint:gm}),Mm=(function(t){function e(){var r=arguments.length>0&&arguments[0]!==void 0?arguments[0]:null,n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{};return Cm(this,e),n=xr(xr({},ml),n),Dm(this,e,[r,n])}return Nm(e,t),Lm(e,null,[{key:"terminate",value:function(n){var s=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{};return s=xr(xr({},ml),s),Is.terminate(n,s)}}])})(Is),it=Uint8Array,Ac=Uint16Array,Fm=Int32Array,Wm=new it([0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0,0,0,0]),Hm=new it([0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,0,0]),Oc=function(t,e){for(var r=new Ac(31),n=0;n<31;++n)r[n]=e+=1<<t[n-1];for(var s=new Fm(r[30]),n=1;n<30;++n)for(var i=r[n];i<r[n+1];++i)s[i]=i-r[n]<<5|n;return{b:r,r:s}},Rc=Oc(Wm,2),Gm=Rc.b,Vm=Rc.r;Gm[28]=258,Vm[258]=28;Oc(Hm,0);var zm=new Ac(32768);for(var Z=0;Z<32768;++Z){var Dt=(Z&43690)>>1|(Z&21845)<<1;Dt=(Dt&52428)>>2|(Dt&13107)<<2,Dt=(Dt&61680)>>4|(Dt&3855)<<4,zm[Z]=((Dt&65280)>>8|(Dt&255)<<8)>>1}var ni=new it(288);for(var Z=0;Z<144;++Z)ni[Z]=8;for(var Z=144;Z<256;++Z)ni[Z]=9;for(var Z=256;Z<280;++Z)ni[Z]=7;for(var Z=280;Z<288;++Z)ni[Z]=8;var Km=new it(32);for(var Z=0;Z<32;++Z)Km[Z]=5;var Jm=function(t,e,r){return(r==null||r>t.length)&&(r=t.length),new it(t.subarray(e,r))},Ym=["unexpected EOF","invalid block type","invalid length/literal","invalid distance","stream finished","no stream handler",,"no callback","invalid UTF-8 data","extra field too long","date not in range 1980-2099","filename too long","stream finishing","invalid zip data"],Nt=function(t,e,r){var n=new Error(e||Ym[t]);if(n.code=t,Error.captureStackTrace&&Error.captureStackTrace(n,Nt),!r)throw n;return n},Xm=new it(0),Qm=(function(){for(var t=new Int32Array(256),e=0;e<256;++e){for(var r=e,n=9;--n;)r=(r&1&&-306674912)^r>>>1;t[e]=r}return t})(),Zm=function(){var t=-1;return{p:function(e){for(var r=t,n=0;n<e.length;++n)r=Qm[r&255^e[n]]^r>>>8;t=r},d:function(){return~t}}},eg=function(t,e){var r={};for(var n in t)r[n]=t[n];for(var n in e)r[n]=e[n];return r},ae=function(t,e,r){for(;r;++e)t[e]=r,r>>>=8},gl=typeof TextEncoder<"u"&&new TextEncoder,tg=typeof TextDecoder<"u"&&new TextDecoder,rg=0;try{tg.decode(Xm,{stream:!0}),rg=1}catch{}function so(t,e){var r;if(gl)return gl.encode(t);for(var n=t.length,s=new it(t.length+(t.length>>1)),i=0,o=function(c){s[i++]=c},r=0;r<n;++r){if(i+5>s.length){var a=new it(i+8+(n-r<<1));a.set(s),s=a}var l=t.charCodeAt(r);l<128||e?o(l):l<2048?(o(192|l>>6),o(128|l&63)):l>55295&&l<57344?(l=65536+(l&1047552)|t.charCodeAt(++r)&1023,o(240|l>>18),o(128|l>>12&63),o(128|l>>6&63),o(128|l&63)):(o(224|l>>12),o(128|l>>6&63),o(128|l&63))}return Jm(s,0,i)}var ys=function(t){var e=0;if(t)for(var r in t){var n=t[r].length;n>65535&&Nt(9),e+=n+4}return e},yl=function(t,e,r,n,s,i,o,a){var l=n.length,c=r.extra,u=a&&a.length,d=ys(c);ae(t,e,o!=null?33639248:67324752),e+=4,o!=null&&(t[e++]=20,t[e++]=r.os),t[e]=20,e+=2,t[e++]=r.flag<<1|(i<0&&8),t[e++]=s&&8,t[e++]=r.compression&255,t[e++]=r.compression>>8;var f=new Date(r.mtime==null?Date.now():r.mtime),h=f.getFullYear()-1980;if((h<0||h>119)&&Nt(10),ae(t,e,h<<25|f.getMonth()+1<<21|f.getDate()<<16|f.getHours()<<11|f.getMinutes()<<5|f.getSeconds()>>1),e+=4,i!=-1&&(ae(t,e,r.crc),ae(t,e+4,i<0?-i-2:i),ae(t,e+8,r.size)),ae(t,e+12,l),ae(t,e+14,d),e+=16,o!=null&&(ae(t,e,u),ae(t,e+6,r.attrs),ae(t,e+10,o),e+=14),t.set(n,e),e+=l,d)for(var y in c){var v=c[y],_=v.length;ae(t,e,+y),ae(t,e+2,_),t.set(v,e+4),e+=4+_}return u&&(t.set(a,e),e+=u),e},ng=function(t,e,r,n,s){ae(t,e,101010256),ae(t,e+8,r),ae(t,e+10,r),ae(t,e+12,n),ae(t,e+16,s)},sg=(function(){function t(e){this.filename=e,this.c=Zm(),this.size=0,this.compression=0}return t.prototype.process=function(e,r){this.ondata(null,e,r)},t.prototype.push=function(e,r){this.ondata||Nt(5),this.c.p(e),this.size+=e.length,r&&(this.crc=this.c.d()),this.process(e,r||!1)},t})(),ig=(function(){function t(e){this.ondata=e,this.u=[],this.d=1}return t.prototype.add=function(e){var r=this;if(this.ondata||Nt(5),this.d&2)this.ondata(Nt(4+(this.d&1)*8,0,1),null,!1);else{var n=so(e.filename),s=n.length,i=e.comment,o=i&&so(i),a=s!=e.filename.length||o&&i.length!=o.length,l=s+ys(e.extra)+30;s>65535&&this.ondata(Nt(11,0,1),null,!1);var c=new it(l);yl(c,0,e,n,a,-1);var u=[c],d=function(){for(var _=0,R=u;_<R.length;_++){var g=R[_];r.ondata(null,g,!1)}u=[]},f=this.d;this.d=0;var h=this.u.length,y=eg(e,{f:n,u:a,o,t:function(){e.terminate&&e.terminate()},r:function(){if(d(),f){var _=r.u[h+1];_?_.r():r.d=1}f=1}}),v=0;e.ondata=function(_,R,g){if(_)r.ondata(_,R,g),r.terminate();else if(v+=R.length,u.push(R),g){var m=new it(16);ae(m,0,134695760),ae(m,4,e.crc),ae(m,8,v),ae(m,12,e.size),u.push(m),y.c=v,y.b=l+v+16,y.crc=e.crc,y.size=e.size,f&&y.r(),f=1}else f&&d()},this.u.push(y)}},t.prototype.end=function(){var e=this;if(this.d&2){this.ondata(Nt(4+(this.d&1)*8,0,1),null,!0);return}this.d?this.e():this.u.push({r:function(){e.d&1&&(e.u.splice(-1,1),e.e())},t:function(){}}),this.d=3},t.prototype.e=function(){for(var e=0,r=0,n=0,s=0,i=this.u;s<i.length;s++){var o=i[s];n+=46+o.f.length+ys(o.extra)+(o.o?o.o.length:0)}for(var a=new it(n+22),l=0,c=this.u;l<c.length;l++){var o=c[l];yl(a,e,o,o.f,o.u,-o.c-2,r,o.o),e+=46+o.f.length+ys(o.extra)+(o.o?o.o.length:0),r+=o.b}ng(a,e,this.u.length,n,r),this.ondata(null,a,!0),this.d=2},t.prototype.terminate=function(){for(var e=0,r=this.u;e<r.length;e++){var n=r[e];n.t()}this.d=2},t})();
const og = "1.26.0",
  Oo = "https://pgvvwqlapzrzcadzsnuv.supabase.co",
  ag = "sb_publishable_xibqmJAhIt0OEkD8ybItDA_xua9qYtx",
  ut = "gym-videos",
  lg = ["Shoulders", "Legs", "Back", "Chest", "Biceps", "Triceps"],
  qt = "__motivation__",
  cg = "battle-angel-theme",
  dr = 150,
  Ro = 3,
  ug = 6 * 1024 * 1024,
  vs = 50 * 1024 * 1024,
  $c = 12 * 1024 * 1024,
  dg = 45 * 1024 * 1024,
  hg = 1280,
  vl = 25e5,
  fg = 3e5,
  pg = 128e3,
  mg = 1600,
  gg = 0.82,
  Ds = new Set(["mp4", "mov", "m4v", "webm"]),
  qn = new Set(["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"]),
  yg = 6,
  ws = 4,
  vg = 720 * 60 * 1e3,
  xc = 4320 * 60 * 1e3,
  wg = "battle-angel-offline",
  Ft = "videos",
  Us = 120,
  js = 320,
  Pc = 120,
  Cc = 20,
  Ns = 120,
  Bn = 160,
  qs = 3,
  jr = 5,
  si = "standard",
  hr = "sleeping_tiger",
  Ic = 400,
  Bs = 2e3,
  _g = [0, 1, 2, 3, 4, 5, 6],
  Ms = [
    [1, "Mo", "Monday"],
    [2, "Tu", "Tuesday"],
    [3, "We", "Wednesday"],
    [4, "Th", "Thursday"],
    [5, "Fr", "Friday"],
    [6, "Sa", "Saturday"],
    [0, "Su", "Sunday"],
  ],
  O = tp(Oo, ag),
  ot = document.querySelector("#app");
let I = null,
  $e = [],
  Bt = null,
  fe = [],
  B = null,
  F = [],
  oe = !1,
  Ie = !1,
  j = null,
  ue = null,
  Xe = dr,
  hn = null,
  Wt = null,
  le = [],
  Me = 0,
  _s = null,
  un = 0,
  io = Promise.resolve(),
  fr = !0,
  Mt = [],
  yt = !0,
  Je = new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  X = null,
  pt = [],
  Fe = [],
  Fs = !0,
  Br = !0,
  Be = !0,
  Oe = "",
  oo = [];
const Ci = new Map();
let fn = new Map(),
  Re = 0,
  G = "",
  Ht = !1,
  wl = 0,
  Ws = 0,
  nt = null,
  er = null,
  bs = 0,
  ao = "",
  Rt = !0,
  sr = [],
  se = [],
  Se = null,
  $t = !0,
  _e = [],
  ke = [],
  Le = U(),
  ct = !0,
  at = !0,
  Rn = null,
  $o = "",
  ii = 0,
  ir = null,
  Y = [],
  de = [],
  mt = U(),
  De = !0,
  $n = null,
  xo = "",
  oi = 0,
  or = null,
  Mr = 0,
  We = [],
  Qe = [],
  Fr = !0,
  ar = "",
  cs = null,
  Ce = new Date().getDay(),
  Hs = Promise.resolve(),
  lo = !1;
const _l = 3600 * 12,
  Lc = "battle-angel-motivation-sound",
  bg = 1200,
  Po = 4e3,
  Sg = 6e3,
  kg =
    "id,name,video_path,sort_order,video_order,exercise_group,created_at,sets_target,reps_target,last_weight,cue_1,cue_2,cue_3,backup_exercise";
function T(t = "") {
  return String(t).replace(
    /[&<>'"]/g,
    (e) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        e
      ],
  );
}
function Ee(t, e, r) {
  return Math.min(r, Math.max(e, t));
}
function ai(t = "✦") {
  const e = String(t || "✦");
  (!ar || e.includes("GOLDEN")) && (ar = e);
}
function Dc() {
  if (!ar) return;
  const t = ar;
  ((ar = ""),
    cs && window.clearTimeout(cs),
    document.querySelector(".gold-hint-toast")?.remove());
  const e = document.createElement("div");
  ((e.className = "gold-hint-toast"),
    (e.textContent = t),
    document.body.appendChild(e),
    (cs = window.setTimeout(() => {
      (e.classList.add("is-leaving"),
        window.setTimeout(() => e.remove(), 220),
        (cs = null));
    }, 760)));
}
function pr(t = new Date()) {
  const e = t.getFullYear(),
    r = String(t.getMonth() + 1).padStart(2, "0"),
    n = String(t.getDate()).padStart(2, "0");
  return `${e}-${r}-${n}`;
}
function Gt(t) {
  const e = String(t || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return e
    ? new Date(Number(e[1]), Number(e[2]) - 1, Number(e[3]))
    : new Date();
}
function U() {
  return pr(new Date());
}
function gt(t, e) {
  const r = Gt(t);
  return (r.setDate(r.getDate() + Number(e || 0)), pr(r));
}
function xn(t, e = {}) {
  const r = Gt(t);
  return new Intl.DateTimeFormat(void 0, {
    weekday: e.short ? "short" : "long",
    month: "short",
    day: "numeric",
  }).format(r);
}
function Eg(t) {
  return new Intl.DateTimeFormat(void 0, {
    month: "long",
    year: "numeric",
  }).format(t);
}
function Gs() {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}
function Tg(t) {
  const e = t === "light" ? "light" : "dark";
  document.documentElement.dataset.theme = e;
  const r = document.querySelector('meta[name="theme-color"]');
  r && r.setAttribute("content", e === "dark" ? "#0d0f10" : "#f5f5f2");
  try {
    window.localStorage.setItem(cg, e);
  } catch {}
}
function Uc() {
  Tg(Gs() === "dark" ? "light" : "dark");
  const t = document.querySelector("#theme-toggle");
  t && (t.textContent = Gs() === "dark" ? "Light mode" : "Dark mode");
}
function te(t) {
  return (
    t
      .replace(/\.[^/.]+$/, "")
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim() || "Exercise"
  );
}
function lt(t = "") {
  return (
    String(t)
      .toLowerCase()
      .match(/\.([a-z0-9]+)$/)?.[1] || ""
  );
}
function xt(t) {
  return t
    ? String(t.type || "")
        .toLowerCase()
        .startsWith("video/")
      ? !0
      : Ds.has(lt(t.name))
    : !1;
}
function Co(t) {
  return t
    ? String(t.type || "")
        .toLowerCase()
        .startsWith("image/")
      ? !0
      : qn.has(lt(t.name))
    : !1;
}
function jc(t) {
  return xt(t) || Co(t);
}
function Mn(t = "") {
  return qn.has(lt(t));
}
function Nc(t) {
  const e = String(t?.type || "").toLowerCase();
  if (e.startsWith("image/")) return e;
  const r = lt(t?.name);
  return r === "png"
    ? "image/png"
    : r === "webp"
      ? "image/webp"
      : r === "gif"
        ? "image/gif"
        : r === "heic"
          ? "image/heic"
          : r === "heif"
            ? "image/heif"
            : "image/jpeg";
}
function Ag(t) {
  return Co(t) && !xt(t) ? Nc(t) : qc(t);
}
function qc(t) {
  const e = String(t?.type || "").toLowerCase();
  if (e.startsWith("video/")) return e;
  const r = lt(t?.name);
  return r === "mov"
    ? "video/quicktime"
    : r === "m4v"
      ? "video/x-m4v"
      : r === "webm"
        ? "video/webm"
        : "video/mp4";
}
function Ss(t) {
  const e = Number(t) || 0;
  return e < 1024 * 1024
    ? `${Math.max(1, Math.round(e / 1024))} KB`
    : `${(e / (1024 * 1024)).toFixed(e >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}
function Og(t, e = Ro) {
  return [...(t || [])].filter(xt).slice(0, e);
}
function Io(t) {
  const e = lt(t);
  return Ds.has(e) || qn.has(e)
    ? `${crypto.randomUUID()}.${e}`
    : `${crypto.randomUUID()}.mp4`;
}
function Rg(t) {
  const e = lt(t?.name);
  if (qn.has(e)) return `${crypto.randomUUID()}.${e}`;
  const r = Nc(t).split("/")[1];
  return `${crypto.randomUUID()}.${r === "jpeg" ? "jpg" : r}`;
}
function li(t = {}) {
  return {
    sets_target: Ee(Number.parseInt(t.sets_target, 10) || 3, 1, 10),
    reps_target:
      String(t.reps_target || "8-12")
        .trim()
        .slice(0, 24) || "8-12",
    last_weight: String(t.last_weight || "")
      .trim()
      .slice(0, 40),
    cue_1: String(t.cue_1 || "")
      .trim()
      .slice(0, 100),
    cue_2: String(t.cue_2 || "")
      .trim()
      .slice(0, 100),
    cue_3: String(t.cue_3 || "")
      .trim()
      .slice(0, 100),
    backup_exercise: String(t.backup_exercise || "")
      .trim()
      .slice(0, 100),
  };
}
function Vs() {
  return I ? `gymflow-workout-${I.id}` : "gymflow-workout";
}
function Bc() {
  return I ? `gymflow-timer-${I.id}` : "gymflow-timer";
}
function bl() {
  return I ? `battle-angel-day-mode-${I.id}` : "battle-angel-day-mode";
}
function ci(t) {
  try {
    t === "daily"
      ? window.localStorage.setItem(bl(), t)
      : window.localStorage.removeItem(bl());
  } catch {}
}
function ui(t, e = Date.now()) {
  return !t || typeof t.folderId != "string"
    ? null
    : {
        folderId: t.folderId,
        currentIndex: Math.max(0, Number.parseInt(t.currentIndex, 10) || 0),
        setsDone:
          t.setsDone &&
          typeof t.setsDone == "object" &&
          !Array.isArray(t.setsDone)
            ? t.setsDone
            : {},
        completedGroupIds: Array.isArray(t.completedGroupIds)
          ? t.completedGroupIds
          : [],
        backupGroupIds: Array.isArray(t.backupGroupIds) ? t.backupGroupIds : [],
        currentGroupId:
          typeof t.currentGroupId == "string" ? t.currentGroupId : null,
        status: t.status === "paused" ? "paused" : "active",
        updatedAt: Number(t.updatedAt || e),
      };
}
function zt() {
  if (!I) return null;
  try {
    const t = window.localStorage.getItem(Vs());
    if (!t) return null;
    const e = ui(JSON.parse(t));
    return e
      ? Date.now() - e.updatedAt > xc
        ? (window.localStorage.removeItem(Vs()), null)
        : e
      : null;
  } catch {
    return null;
  }
}
function Mc(t) {
  if (!(!I || !t))
    try {
      window.localStorage.setItem(Vs(), JSON.stringify(t));
    } catch {}
}
function Lo(t) {
  const e = `${t?.code || ""} ${t?.message || ""}`.toLowerCase();
  return (
    e.includes("42p01") ||
    e.includes("pgrst205") ||
    (e.includes("workout_progress") && e.includes("not") && e.includes("find"))
  );
}
function Fc(t) {
  const e = `${t?.code || ""} ${t?.message || ""}`.toLowerCase();
  return (
    e.includes("42p01") ||
    e.includes("pgrst205") ||
    (e.includes("workout_schedule") && e.includes("not") && e.includes("find"))
  );
}
function Wc(t) {
  const e = `${t?.code || ""} ${t?.message || ""}`.toLowerCase();
  return (
    e.includes("42p01") ||
    e.includes("pgrst205") ||
    e.includes("exercise_weight_log")
  );
}
function Ii(t) {
  const e = `${t?.code || ""} ${t?.message || ""}`.toLowerCase();
  return (
    e.includes("workout_weekly_plan") ||
    e.includes("workout_history") ||
    e.includes("is_skipped") ||
    e.includes("backup_group_ids")
  );
}
async function Kt() {
  if (!I || !yt) {
    ((Mt = []), (pt = []), (Fe = ks([])));
    return;
  }
  let t = await O.from("workout_schedule")
    .select("id,workout_date,folder_id,is_skipped,created_at,updated_at")
    .order("workout_date", { ascending: !0 });
  if (
    (t.error &&
      Ii(t.error) &&
      ((Be = !1),
      (t = await O.from("workout_schedule")
        .select("id,workout_date,folder_id,created_at,updated_at")
        .order("workout_date", { ascending: !0 }))),
    t.error)
  ) {
    if (Fc(t.error)) {
      ((yt = !1), (Mt = []), (pt = []), (Fe = ks([])));
      return;
    }
    throw t.error;
  }
  const e = (t.data || []).map((l) => ({ ...l, is_skipped: !!l.is_skipped }));
  let r = [],
    n = [];
  const s = Be && Fs,
    i = Be && Br,
    [o, a] = await Promise.all([
      s
        ? O.from("workout_weekly_plan")
            .select("id,weekday,folder_id,created_at,updated_at")
            .order("weekday", { ascending: !0 })
            .order("created_at", { ascending: !0 })
        : null,
      i
        ? O.from("workout_history")
            .select("id,workout_date,folder_id,completed_at")
            .gte("workout_date", gt(U(), -400))
            .order("workout_date", { ascending: !1 })
        : null,
    ]);
  if (o)
    if (o.error)
      if (Ii(o.error)) ((Fs = !1), (Be = !1));
      else throw o.error;
    else r = o.data || [];
  if (a)
    if (a.error)
      if (Ii(a.error)) ((Br = !1), (Be = !1));
      else throw a.error;
    else n = a.data || [];
  ((Mt = e), (pt = r), (Fe = ks(n)));
}
function Hc(t) {
  const e = `${t?.code || ""} ${t?.message || ""}`.toLowerCase();
  return (
    e.includes("42p01") ||
    e.includes("pgrst205") ||
    e.includes("daily_steps") ||
    e.includes("daily_progress") ||
    e.includes("substeps") ||
    e.includes("skipped_step_ids") ||
    e.includes("substep_positions") ||
    e.includes("later_step_ids") ||
    e.includes("stack_order") ||
    e.includes("active_days") ||
    e.includes("day_mode") ||
    e.includes("day_order")
  );
}
function Gc(t) {
  const e = `${t?.code || ""} ${t?.message || ""}`.toLowerCase();
  return (
    e.includes("42p01") ||
    e.includes("pgrst205") ||
    e.includes("daily_meds") ||
    e.includes("daily_med_log")
  );
}
function $g(t) {
  const e = `${t?.code || ""} ${t?.message || ""}`.toLowerCase();
  return (
    e.includes("routine_step_id") &&
    (e.includes("column") || e.includes("schema cache") || e.includes("pgrst"))
  );
}
function co(t) {
  const e = `${t?.code || ""} ${t?.message || ""}`.toLowerCase();
  return (
    e.includes("42p01") ||
    e.includes("pgrst205") ||
    e.includes("power_todos") ||
    e.includes("power_action_plan")
  );
}
function xg(t) {
  const e = `${t?.code || ""} ${t?.message || ""}`.toLowerCase();
  return (
    e.includes("42p01") ||
    e.includes("pgrst205") ||
    e.includes("changed_board_entries") ||
    e.includes("changed_story_entries")
  );
}
async function Yr() {
  if (!I) {
    We = [];
    Qe = [];
    return;
  }
  const userId = I.id;
  const results = await Promise.allSettled([
    O.from("changed_board_entries")
      .select("id,side,body,sort_order,created_at,updated_at")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    O.from("changed_story_entries")
      .select("id,body,sort_order,created_at,updated_at")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);
  if (I?.id !== userId) return;
  const board =
    results[0].status === "fulfilled"
      ? results[0].value
      : { error: results[0].reason };
  const stories =
    results[1].status === "fulfilled"
      ? results[1].value
      : { error: results[1].reason };
  if (!board.error && Array.isArray(board.data)) We = board.data;
  if (!stories.error && Array.isArray(stories.data)) {
    Qe = stories.data;
    Fr = true;
  } else if (stories.error && xg(stories.error)) {
    Fr = false;
  }
  // A missing table or interrupted request must never erase cached writing.
  const error = [board.error, stories.error].find((item) => item && !xg(item));
  if (error) throw error;
}
function Vc() {
  if (!Qe.length) return null;
  const t = Gt(Ct(U())),
    e = Math.floor(t.getTime() / (10080 * 60 * 1e3));
  return Qe[Math.abs(e) % Qe.length] || Qe[0];
}
function Pg(t) {
  return t === "absent" ? "Absent" : "Present";
}
function wt(t) {
  return Array.isArray(t)
    ? t
        .filter((e) => typeof e == "string")
        .map((e) => e.trim().slice(0, Pc))
        .filter(Boolean)
        .slice(0, Cc)
    : [];
}
function zc(t = "") {
  return String(t)
    .split(/\r?\n/)
    .map((e) => e.trim().slice(0, Pc))
    .filter(Boolean)
    .slice(0, Cc);
}
function Cg(t) {
  return wt(t?.substeps).join(`
`);
}
function Ot(t) {
  const e = Array.isArray(t) ? t : _g;
  return [
    ...new Set(
      e
        .map((r) => Number.parseInt(r, 10))
        .filter((r) => Number.isInteger(r) && r >= 0 && r <= 6),
    ),
  ].sort((r, n) => r - n);
}
function Fn(t) {
  if (!t || typeof t != "object" || Array.isArray(t)) return {};
  const e = {};
  return (
    Object.entries(t).forEach(([r, n]) => {
      const s = Number.parseInt(r, 10),
        i = Number.parseInt(n, 10);
      Number.isInteger(s) &&
        s >= 0 &&
        s <= 6 &&
        Number.isInteger(i) &&
        i > 0 &&
        (e[String(s)] = i);
    }),
    e
  );
}
function Sl(t, e) {
  const r = Fn(t?.day_order);
  return Number(r[String(e)]) || Number(t?.sort_order) || 0;
}
function di(t) {
  return se
    .filter((e) => Ot(e.active_days).includes(t))
    .sort(
      (e, r) =>
        Sl(e, t) - Sl(r, t) ||
        (Number(e.sort_order) || 0) - (Number(r.sort_order) || 0) ||
        String(e.created_at || "").localeCompare(String(r.created_at || "")),
    );
}
function Wn(t = U()) {
  return di(Gt(t).getDay());
}
function Ig(t) {
  const e = Ot(t);
  return e.length
    ? e.length === 7
      ? "EVERY DAY"
      : Ms.filter(([r]) => e.includes(r))
          .map(([, r]) => r)
          .join(" · ")
    : "OFF";
}
function Wr(t = U()) {
  return {
    progress_date: t,
    completed_step_ids: [],
    skipped_step_ids: [],
    later_step_ids: [],
    stack_order: [],
    day_mode: si,
    substep_positions: {},
    is_complete: !1,
    started_at: null,
    updated_at: null,
  };
}
function Hn(t, e = U()) {
  if (!t || t.progress_date !== e) return Wr(e);
  const r =
    t.substep_positions &&
    typeof t.substep_positions == "object" &&
    !Array.isArray(t.substep_positions)
      ? Object.fromEntries(
          Object.entries(t.substep_positions)
            .filter(
              ([n, s]) => typeof n == "string" && Number.isFinite(Number(s)),
            )
            .map(([n, s]) => [n, Math.max(0, Number.parseInt(s, 10) || 0)]),
        )
      : {};
  return {
    progress_date: e,
    completed_step_ids: Array.isArray(t.completed_step_ids)
      ? [...new Set(t.completed_step_ids.filter((n) => typeof n == "string"))]
      : [],
    skipped_step_ids: Array.isArray(t.skipped_step_ids)
      ? [...new Set(t.skipped_step_ids.filter((n) => typeof n == "string"))]
      : [],
    later_step_ids: Array.isArray(t.later_step_ids)
      ? [...new Set(t.later_step_ids.filter((n) => typeof n == "string"))]
      : [],
    stack_order: Array.isArray(t.stack_order)
      ? [
          ...new Set(
            t.stack_order.filter(
              (n) => typeof n == "string" && /^(routine|todo):/.test(n),
            ),
          ),
        ]
      : [],
    day_mode: t.day_mode === hr ? hr : si,
    substep_positions: r,
    is_complete: !!t.is_complete,
    started_at: t.started_at || null,
    updated_at: t.updated_at || null,
  };
}
function Kc(date = U()) {
  const value = J().dailyProgressByDate[date];
  return value ? Hn(value, date) : null;
}
async function wr() {
  const t = U(),
    userId = I?.id;
  if (!I || !$t) {
    ((se = []), (Se = Wr(t)));
    return;
  }
  const [e, r] = await Promise.all([
      O.from("daily_steps")
        .select(
          "id,title,note,substeps,active_days,day_order,sort_order,created_at,updated_at",
        )
        .eq("user_id", userId)
        .order("sort_order", { ascending: !0 })
        .order("created_at", { ascending: !0 }),
      O.from("daily_progress")
        .select(
          "progress_date,completed_step_ids,skipped_step_ids,later_step_ids,stack_order,day_mode,substep_positions,is_complete,started_at,updated_at",
        )
        .eq("user_id", userId)
        .eq("progress_date", t)
        .maybeSingle(),
    ]),
    n = e.error || r.error;
  if (I?.id !== userId || U() !== t) return;
  if (n) {
    if (Hc(n)) {
      (($t = !1), (se = []), (Se = Wr(t)));
      return;
    }
    throw n;
  }
  se = (e.data || []).map((l) => ({
    ...l,
    substeps: wt(l.substeps),
    active_days: Ot(l.active_days),
    day_order: Fn(l.day_order),
  }));
  const s = Hn(r.data, t),
    i = Kc(t),
    o = Date.parse(s.updated_at || "") || 0,
    a = Date.parse(i?.updated_at || "") || 0;
  Se = i && a >= o ? i : s;
}
function Lg(t = U()) {
  const e = J().medToggles;
  return Object.values(e).filter(
    (r) => r?.taken_date === t && typeof r?.med_id == "string",
  );
}
function Pn(t = [], e = U()) {
  const r = new Set(t.filter((s) => typeof s == "string"));
  Lg(e).forEach((s) => {
    s.is_taken ? r.add(s.med_id) : r.delete(s.med_id);
  });
  const n = new Set(_e.map((s) => s.id));
  return [...r].filter((s) => n.has(s));
}
async function Hr() {
  const t = U(),
    userId = I?.id;
  if (!I || !ct) {
    ((_e = []), (ke = []), (Le = t));
    return;
  }
  let e = await O.from("daily_meds")
    .select("id,name,routine_step_id,sort_order,created_at,updated_at")
    .eq("user_id", userId)
    .order("sort_order", { ascending: !0 })
    .order("created_at", { ascending: !0 });
  if (I?.id !== userId || U() !== t) return;
  e.error && $g(e.error)
    ? ((at = !1),
      (e = await O.from("daily_meds")
        .select("id,name,sort_order,created_at,updated_at")
        .eq("user_id", userId)
        .order("sort_order", { ascending: !0 })
        .order("created_at", { ascending: !0 })))
    : e.error || (at = !0);
  if (I?.id !== userId || U() !== t) return;
  const r = await O.from("daily_med_log")
      .select("med_id,taken_date,taken_at")
      .eq("user_id", userId)
      .eq("taken_date", t),
    n = e.error || r.error;
  if (I?.id !== userId || U() !== t) return;
  if (n) {
    if (Gc(n)) {
      ((ct = !1), (_e = []), (ke = []), (Le = t));
      return;
    }
    throw n;
  }
  ((_e = (e.data || []).map((s) => ({
    ...s,
    routine_step_id: s.routine_step_id || null,
  }))),
    (Le = t),
    (ke = Pn(
      (r.data || []).map((s) => s.med_id),
      t,
    )));
}
function Jc(todos, plans, date = U()) {
  const pending = J(),
    all = new Map(todos.map((row) => [row.id, { ...row }])),
    assigned = new Map(plans.map((row) => [row.id, { ...row }]));
  for (const [id, item] of Object.entries(pending.powerTodoWrites)) {
    if (item.operation === "delete") all.delete(id);
    else all.set(id, { ...all.get(id), ...item.payload, id });
  }
  for (const [id, item] of Object.entries(pending.powerPlanWrites)) {
    if (item.operation === "delete") {
      assigned.delete(item.plan_id || id);
      continue;
    }
    const planId = item.plan_id || id,
      old = assigned.get(planId);
    if (old || item.operation === "upsert")
      assigned.set(planId, {
        ...old,
        id: planId,
        todo_id: item.todo_id,
        action_date: item.action_date,
        status: item.status,
        sort_order: item.sort_order,
        started_at: item.started_at,
        updated_at: item.updated_at,
      });
    if (Object.prototype.hasOwnProperty.call(item, "todo_completed_at")) {
      const oldTodo = all.get(item.todo_id) || {
        id: item.todo_id,
        title: item.todo_title,
        sort_order: item.todo_sort_order,
        created_at: item.todo_created_at,
      };
      if (oldTodo.title)
        all.set(item.todo_id, {
          ...oldTodo,
          completed_at: item.todo_completed_at,
          updated_at: item.updated_at,
        });
    }
  }
  const sorted = [...all.values()].sort(
    (a, b) =>
      (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0) ||
      String(a.created_at || "").localeCompare(String(b.created_at || "")),
  );
  return {
    todos: sorted.filter((row) => !row.completed_at),
    allTodos: sorted,
    plans: [...assigned.values()].sort(
      (a, b) =>
        String(a.action_date).localeCompare(String(b.action_date)) ||
        (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0),
    ),
  };
}
async function Gr() {
  if (!I) return;
  mt = U();
  if (navigator.onLine === false) {
    const state = Jc([...Y, ...baActionArchive], de);
    Y = state.todos;
    baActionArchive = state.allTodos.filter((row) => row.completed_at);
    de = state.plans;
    return;
  }
  const user = I.id,
    revision = baPowerRevision;
  try {
    const [todos, plans] = await Promise.all([
      baReadPowerTable(
        "power_todos",
        "id,title,sort_order,completed_at,created_at,updated_at",
      ),
      baReadPowerTable(
        "power_action_plan",
        "id,todo_id,action_date,status,sort_order,started_at,created_at,updated_at",
      ),
    ]);
    if (I?.id !== user || revision !== baPowerRevision) return;
    const state = Jc(todos, plans);
    Y = state.todos;
    baActionArchive = state.allTodos.filter((row) => row.completed_at);
    de = state.plans;
    De = true;
    K();
  } catch (error) {
    if (I?.id === user) {
      if (!Y.length && !de.length && !baActionArchive.length && co(error))
        De = false;
      throw error;
    }
  }
}
function It(t) {
  return Y.find((e) => e.id === t) || null;
}
function zs() {
  mt = U();
  return de.filter((row) => row.action_date === mt);
}
function Jt() {
  return zs()
    .filter((t) => t.status === "pending" && It(t.todo_id))
    .sort(
      (t, e) =>
        (Number(t.sort_order) || 0) - (Number(e.sort_order) || 0) ||
        String(t.created_at || "").localeCompare(String(e.created_at || "")),
    );
}
function hi() {
  return Jt().length;
}
function Do() {
  return true;
}
function fi(t = z()) {
  return t?.day_mode === hr;
}
function Dg(t) {
  const e = z();
  return (
    (e.day_mode = si),
    (e.stack_order = Ue(e)),
    (e.is_complete = !1),
    Ve(e),
    e
  );
}
function Ug() {
  Dg();
  zr();
}
function jg() {
  const progress = z();
  progress.day_mode = hr;
  progress.stack_order = Ue(progress);
  progress.is_complete = false;
  Ve(progress);
  zr();
}
function Yc(t) {
  return `routine:${t}`;
}
function Xc(t) {
  return `todo:${t}`;
}
function Ue(t = z()) {
  const e = Array.isArray(t?.stack_order) ? t.stack_order : [],
    n = Wn(U()).map((a) => Yc(a.id)),
    s = t?.day_mode === hr ? [] : Jt().map((a) => Xc(a.todo_id)),
    i = new Set([...n, ...s]),
    o = [];
  return (
    e.forEach((a) => {
      i.has(a) && !o.includes(a) && o.push(a);
    }),
    n.forEach((a) => {
      o.includes(a) || o.push(a);
    }),
    s.forEach((a) => {
      o.includes(a) || o.push(a);
    }),
    o
  );
}
function _r(t = z()) {
  const e = Ue(t),
    r = new Map(Wn(U()).map((i) => [i.id, i])),
    n = new Map(Jt().map((i) => [i.todo_id, i])),
    s = [];
  return (
    e.forEach((i) => {
      const [o, a] = String(i).split(":", 2);
      if (a) {
        if (o === "routine") {
          const l = r.get(a);
          l &&
            s.push({ type: "routine", id: a, key: i, title: l.title, step: l });
          return;
        }
        if (o === "todo") {
          const l = n.get(a),
            c = l ? It(a) : null;
          l &&
            c &&
            s.push({
              type: "todo",
              id: a,
              key: i,
              title: c.title,
              todo: c,
              plan: l,
            });
        }
      }
    }),
    s
  );
}
function Qc(t = z()) {
  const e = Vn(t);
  for (const r of _r(t)) {
    if (r.type === "todo") {
      if (r.plan?.status === "pending") return r;
      continue;
    }
    if (e.has(r.id)) continue;
    const n = r.step,
      s = wt(n.substeps);
    if (!s.length)
      return {
        ...r,
        step: n,
        substeps: s,
        substepIndex: -1,
        title: n.title,
        isSubstep: !1,
      };
    const i = Ee(
      Number.parseInt(t.substep_positions?.[n.id], 10) || 0,
      0,
      Math.max(0, s.length - 1),
    );
    return {
      ...r,
      step: n,
      substeps: s,
      substepIndex: i,
      title: s[i],
      isSubstep: !0,
    };
  }
  return null;
}
function Gn(t = z()) {
  const e = Vn(t);
  let r = 0;
  return (
    _r(t).forEach((n) => {
      if (n.type === "todo") {
        n.plan?.status === "pending" && (r += 1);
        return;
      }
      if (e.has(n.id)) return;
      const s = wt(n.step.substeps);
      if (!s.length) {
        r += 1;
        return;
      }
      const i = Ee(
        Number.parseInt(t.substep_positions?.[n.id], 10) || 0,
        0,
        s.length,
      );
      r += Math.max(0, s.length - i);
    }),
    r
  );
}
function Zc(t) {
  const e = z(),
    r = Ue(e),
    n = r.indexOf(t);
  return n < 0 || n === r.length - 1
    ? !1
    : (r.splice(n, 1),
      r.push(t),
      (e.stack_order = r),
      (e.is_complete = !1),
      Ve(e),
      !0);
}
function Xr(plan, todo, completed = "unchanged") {
  const pending = J(),
    old = pending.powerPlanWrites[plan.id];
  pending.powerPlanWrites[plan.id] = {
    ...old,
    operation: old?.operation === "upsert" ? "upsert" : "update",
    plan_id: plan.id,
    todo_id: plan.todo_id,
    action_date: plan.action_date,
    status: plan.status,
    sort_order: Number(plan.sort_order) || 0,
    started_at: plan.started_at || null,
    updated_at: new Date().toISOString(),
    todo_title: todo?.title || "",
    todo_sort_order: Number(todo?.sort_order) || 0,
    todo_created_at: todo?.created_at || null,
  };
  if (completed !== "unchanged") {
    pending.powerPlanWrites[plan.id].todo_completed_at = completed;
    if (todo) {
      const updated = {
        ...todo,
        completed_at: completed,
        updated_at: new Date().toISOString(),
      };
      baPutTodo(updated, pending);
      const all = [...Y, ...baActionArchive].filter(
        (row) => row.id !== todo.id,
      );
      all.push(updated);
      baCommitPowerState(pending, all, de);
      return;
    }
  }
  if (we(pending)) {
    K();
    Lt();
  }
}
function kl(t) {
  const e = J();
  e.powerPlanWrites[t] && (delete e.powerPlanWrites[t], we(e));
}
function Qr(t, e) {
  return (
    (de = de.map((r) => (r.id === t ? { ...r, ...e } : r))),
    K(),
    de.find((r) => r.id === t) || null
  );
}
function Ks() {
  (or && window.clearTimeout(or),
    (or = null),
    ($n = null),
    (xo = ""),
    (oi = 0));
}
function Uo(t, e, r, n = !1) {
  (or && window.clearTimeout(or),
    (or = null),
    ($n = {
      plan: JSON.parse(JSON.stringify(t)),
      todo: e ? JSON.parse(JSON.stringify(e)) : null,
      todoCompletionChanged: n,
      dailyProgress: tu(),
    }),
    (xo = r),
    (oi = Date.now() + 5e3));
}
function Ng() {
  return !$n || Date.now() >= oi
    ? ""
    : `
    <div class="day-undo-toast" id="power-undo-toast" role="status">
      <span>${T(xo)}</span>
      <button type="button" id="undo-power-action">Undo</button>
    </div>`;
}
function qg() {
  const t = document.querySelector("#power-undo-toast"),
    e = document.querySelector("#undo-power-action");
  if (!t || !e || !$n) return;
  e.addEventListener("click", () => {
    const n = $n;
    Ks();
    const s = Qr(n.plan.id, n.plan);
    (n.todo &&
      !Y.some((i) => i.id === n.todo.id) &&
      (Y.push(n.todo),
      Y.sort(
        (i, o) => (Number(i.sort_order) || 0) - (Number(o.sort_order) || 0),
      )),
      s && Xr(s, n.todo, n.todoCompletionChanged ? null : "unchanged"),
      K(),
      n.dailyProgress && Ve(n.dailyProgress),
      ze());
  });
  const r = Math.max(0, oi - Date.now());
  or = window.setTimeout(() => {
    (t.classList.add("is-hiding"),
      window.setTimeout(() => {
        (t.remove(), Ks());
      }, 180));
  }, r);
}
function Bg(planId) {
  const plan = de.find((row) => row.id === planId && row.status === "pending");
  if (plan && baCompleteTodo(plan.todo_id, false)) ze();
}
function Mg(planId) {
  const plan = de.find((row) => row.id === planId && row.status === "pending"),
    todo = plan ? It(plan.todo_id) : null;
  if (!plan || !todo) return;
  const previous = { ...plan },
    now = new Date().toISOString(),
    next = { ...plan, status: "skipped", updated_at: now },
    pending = J();
  pending.powerPlanWrites[planId] = {
    ...next,
    operation:
      pending.powerPlanWrites[planId]?.operation === "upsert"
        ? "upsert"
        : "update",
    plan_id: planId,
  };
  if (
    !baCommitPowerState(
      pending,
      [...Y, ...baActionArchive],
      de.map((row) => (row.id === planId ? next : row)),
    )
  )
    return;
  ze();
  baToast("Set aside for today", () => {
    const p = J();
    p.powerPlanWrites[planId] = {
      ...previous,
      updated_at: new Date().toISOString(),
      operation: "upsert",
      plan_id: planId,
    };
    if (
      baCommitPowerState(
        p,
        [...Y, ...baActionArchive],
        de.map((row) => (row.id === planId ? previous : row)),
      )
    )
      baRenderCurrent();
  });
}
function Fg(planId) {
  const plan = de.find((row) => row.id === planId && row.status === "pending");
  if (!plan) return;
  const key = Xc(plan.todo_id);
  if (!Zc(key)) return;
  const todo = It(plan.todo_id),
    next = Qr(planId, {
      sort_order:
        Math.max(0, ...Jt().map((row) => Number(row.sort_order) || 0)) + 1,
      updated_at: new Date().toISOString(),
    });
  Xr(next, todo);
  ze();
  baToast("Moved to later");
}
function eu(t) {
  return t ? _e.filter((e) => e.routine_step_id === t) : [];
}
function El(t = "") {
  const e = t || "";
  return [
    `<option value="" ${e ? "" : "selected"}>ANYTIME</option>`,
    ...se.map(
      (r) =>
        `<option value="${T(r.id)}" ${r.id === e ? "selected" : ""}>${T(r.title)}</option>`,
    ),
  ].join("");
}
function Tl(t) {
  if (!ct || !at) return "";
  const e = eu(t);
  if (!e.length) return "";
  const r = jo();
  return `
    <div class="day-step-boosters" aria-label="Boosters for this activity">
      <div class="day-step-boosters-label">BOOSTERS</div>
      <div class="day-step-boosters-list">
        ${e
          .map((n) => {
            const s = r.has(n.id);
            return `<button type="button" class="day-step-booster ${s ? "is-taken" : ""}" data-daily-med-toggle="${n.id}" aria-pressed="${s ? "true" : "false"}"><span class="day-step-booster-check" aria-hidden="true">${s ? "✓" : ""}</span><span>${T(n.name)}</span></button>`;
          })
          .join("")}
      </div>
    </div>`;
}
function jo() {
  const t = U();
  return (Le !== t && ((Le = t), (ke = Pn([], t))), new Set(ke));
}
function Wg(id) {
  if (!_e.some((item) => item.id === id) || !ct) return;
  const day = U(),
    taken = jo(),
    value = !taken.has(id),
    pending = J();
  pending.medToggles[`${day}|${id}`] = {
    med_id: id,
    taken_date: day,
    is_taken: value,
    updated_at: new Date().toISOString(),
  };
  if (!we(pending)) return;
  if (value) taken.add(id);
  else taken.delete(id);
  Le = day;
  ke = [...taken];
  K();
  Lt();
  if (G === "day-runner") ze();
  else if (G === "day-preview") Vo();
  else if (G === "day-booster-setup") en();
  else ee("", { forceOverview: true });
}
function z() {
  const day = U();
  if (!Se || Se.progress_date !== day) Se = Hn(Kc(day), day);
  return Hn(Se, day);
}
function Ve(progress) {
  const day = progress?.progress_date || U(),
    value = Hn(progress, day);
  value.updated_at = new Date().toISOString();
  const pending = J();
  pending.dailyProgressByDate[day] = value;
  pending.dailyProgress = day === U() ? value : pending.dailyProgress;
  if (!we(pending)) return false;
  if (day === U()) Se = value;
  K();
  Lt();
  return true;
}
function Vn(t = z()) {
  return new Set([
    ...(t.completed_step_ids || []),
    ...(t.skipped_step_ids || []),
  ]);
}
function Hg(t = z()) {
  const e = Vn(t),
    r = Wn(U()),
    n = new Set(r.map((s) => s.id));
  return (t.later_step_ids || []).filter((s) => n.has(s) && !e.has(s));
}
function Gg(t = z()) {
  const e = Vn(t),
    r = Hg(t),
    n = new Set(r),
    s = Wn(U()),
    i = s.filter((l) => !e.has(l.id) && !n.has(l.id)),
    o = new Map(s.map((l) => [l.id, l])),
    a = r.map((l) => o.get(l)).filter(Boolean);
  return [...i, ...a];
}
function Vg() {
  return Gg()[0] || null;
}
function tu(t = z()) {
  return Hn(JSON.parse(JSON.stringify(t)), U());
}
function Js() {
  (ir && window.clearTimeout(ir),
    (ir = null),
    (Rn = null),
    ($o = ""),
    (ii = 0));
}
function ru(t, e) {
  (ir && window.clearTimeout(ir),
    (ir = null),
    (Rn = tu(t)),
    ($o = e),
    (ii = Date.now() + 5e3));
}
function zg() {
  return !Rn || Date.now() >= ii
    ? ""
    : `
    <div class="day-undo-toast" id="day-undo-toast" role="status">
      <span>${T($o)}</span>
      <button type="button" id="undo-daily-action">Undo</button>
    </div>`;
}
function Kg() {
  const t = document.querySelector("#day-undo-toast"),
    e = document.querySelector("#undo-daily-action");
  if (!t || !e || !Rn) return;
  e.addEventListener("click", () => {
    const n = Rn;
    (Js(), Ve(n), ze());
  });
  const r = Math.max(0, ii - Date.now());
  ir = window.setTimeout(() => {
    (t.classList.add("is-hiding"),
      window.setTimeout(() => {
        (t.remove(), Js());
      }, 180));
  }, r);
}
function nu(step) {
  const title = String(step?.title || "")
    .trim()
    .toLowerCase();
  return (
    ["gym", "workout", "training", "power body"].includes(title) &&
    wt(step?.substeps).length === 0
  );
}
function No(t = Vg()) {
  if (!nu(t)) return null;
  const e = He(U()),
    r = e.filter((n) => !Yt(U(), n.id));
  return { planned: e, remaining: r };
}
function su() {
  const progress = z();
  progress.stack_order = Ue(progress);
  if (!progress.stack_order.length || Gn(progress) <= 0) {
    ee("", { forceOverview: true });
    return;
  }
  ci("daily");
  if (!progress.started_at) progress.started_at = new Date().toISOString();
  progress.is_complete = false;
  if (Ve(progress)) ze();
}
function pi(t, e = false, r = {}) {
  if (!r.bypassGuard && !baAcceptActionEvent(r)) return false;
  const progress = z();
  const step = se.find((item) => item.id === t);
  if (!step) return false;
  if (r.rememberUndo !== false)
    ru(progress, r.undoLabel || (e ? "Skipped" : "Done"));
  const substeps = wt(step.substeps);
  const completed = new Set(progress.completed_step_ids || []);
  const skipped = new Set(progress.skipped_step_ids || []);
  const positions = { ...(progress.substep_positions || {}) };
  if (e) {
    // Skipping a ritual also skips its remaining substeps. It never counts as done.
    skipped.add(t);
    completed.delete(t);
  } else if (substeps.length) {
    const next =
      Ee(Number.parseInt(positions[t], 10) || 0, 0, substeps.length - 1) + 1;
    positions[t] = next;
    skipped.delete(t);
    if (next >= substeps.length) completed.add(t);
  } else {
    completed.add(t);
    skipped.delete(t);
  }
  progress.completed_step_ids = [...completed];
  progress.skipped_step_ids = [...skipped];
  progress.later_step_ids = (progress.later_step_ids || []).filter(
    (id) => id !== t,
  );
  progress.substep_positions = positions;
  const today = Wn(U());
  progress.is_complete =
    today.length > 0 &&
    today.every((item) => completed.has(item.id) || skipped.has(item.id)) &&
    Jt().length === 0;
  if (!progress.started_at) progress.started_at = new Date().toISOString();
  if (Ve(progress) === false) return false;
  if (!e) ai("✦");
  if (r.render !== false) ze();
  return true;
}
function Jg(id, options = {}) {
  return pi(id, false, { ...options, undoLabel: "Done" });
}
function Yg(id, options = {}) {
  return pi(id, true, { ...options, undoLabel: "Skipped" });
}
function Xg(id, options = {}) {
  if (!baAcceptActionEvent(options) || !se.find((step) => step.id === id))
    return;
  const key = Yc(id);
  if (Ue(z()).filter((item) => item !== key).length === 0) return;
  ru(z(), "Moved to later");
  if (Zc(key)) ze();
}
function Qg(step, options = {}) {
  if (!baAcceptActionEvent(options)) return;
  const gym = No(step);
  if (gym) {
    const next = gym.remaining?.[0] || null;
    if (next) Ge(next.id, { mode: "workout" });
    else mr();
    return;
  }
  Jg(step.id, options);
}
function Zg() {
  const t = z();
  if (!t.started_at || t.is_complete) return !1;
  const e = Qc();
  if (!e || e.type !== "routine" || e.isSubstep || !nu(e.step)) return !1;
  const r = No(e.step);
  return r
    ? ((r.planned.length ? r.remaining.length === 0 : !0) &&
        pi(e.step.id, !1, { bypassGuard: !0, rememberUndo: !1, render: !1 }),
      !0)
    : !1;
}
function iu(t) {
  return Mt.filter((e) => e.workout_date === t);
}
function ey(t) {
  return iu(t).length > 0;
}
function ty(t) {
  const e = Gt(t).getDay();
  return pt.filter((r) => Number(r.weekday) === e);
}
function qo(t) {
  const e = new Set(ty(t).map((r) => r.folder_id));
  return $e.filter((r) => e.has(r.id));
}
function He(t) {
  const e = iu(t);
  if (e.length) {
    const r = new Set(
      e.filter((n) => !n.is_skipped && n.folder_id).map((n) => n.folder_id),
    );
    return $e.filter((n) => r.has(n.id));
  }
  return qo(t);
}
function Yt(t, e) {
  return Fe.some((r) => r.workout_date === t && r.folder_id === e);
}
function ou() {
  if (!Br || !Be || He(U()).length) return [];
  const t = gt(U(), -1);
  return He(t).filter((e) => !Yt(t, e.id));
}
function mi(task) {
  if (!I || !fr) return;
  const userId = I.id;
  io = io
    .catch(() => {})
    .then(async () => {
      if (I?.id !== userId) return;
      try {
        await task();
      } catch (error) {
        console.warn("Workout cloud sync failed:", error);
      }
    });
}
async function au(t) {
  if (!I || !t || !fr) return;
  const e = ui(t);
  if (!e) return;
  const { error: r } = await O.from("workout_progress").upsert(
    {
      user_id: I.id,
      folder_id: e.folderId,
      current_index: e.currentIndex,
      sets_done: e.setsDone,
      completed_group_ids: e.completedGroupIds,
      backup_group_ids: e.backupGroupIds,
      status: e.status,
      updated_at: new Date(e.updatedAt).toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (r) throw (Lo(r) && (fr = !1), r);
}
async function ry() {
  if (!I || !fr) return null;
  const { data: t, error: e } = await O.from("workout_progress")
    .select(
      "folder_id,current_index,sets_done,completed_group_ids,backup_group_ids,status,updated_at",
    )
    .eq("user_id", I.id)
    .maybeSingle();
  if (e) {
    if (Lo(e))
      return (
        (fr = !1),
        console.warn(
          "Cloud workout progress is not enabled yet. Run the latest supabase/schema.sql.",
        ),
        null
      );
    throw e;
  }
  if (!t) return null;
  const r = ui({
    folderId: t.folder_id,
    currentIndex: t.current_index,
    setsDone: t.sets_done,
    completedGroupIds: t.completed_group_ids,
    backupGroupIds: t.backup_group_ids,
    status: t.status,
    updatedAt: Date.parse(t.updated_at) || Date.now(),
  });
  return r && Date.now() - r.updatedAt > xc
    ? (mi(async () => {
        const { error: n } = await O.from("workout_progress")
          .delete()
          .eq("user_id", I.id);
        if (n) throw n;
      }),
      null)
    : r;
}
async function uo() {
  const t = zt();
  let e = null;
  try {
    e = await ry();
  } catch (n) {
    console.warn("Could not read workout progress from cloud:", n);
  }
  const r = e ? (t ? (e.updatedAt >= t.updatedAt ? e : t) : e) : t;
  if (((j = r || null), r && Mc(r), t && (!e || t.updatedAt > e.updatedAt))) {
    const n =
      typeof structuredClone == "function"
        ? structuredClone(t)
        : JSON.parse(JSON.stringify(t));
    mi(() => au(n));
  }
  return r;
}
function Ze(t = j) {
  if (!I || !t) return;
  const e = ui(t);
  if (!e) return;
  ((e.updatedAt = Date.now()), (j = e), Mc(e));
  const r =
    typeof structuredClone == "function"
      ? structuredClone(e)
      : JSON.parse(JSON.stringify(e));
  mi(() => au(r));
}
function gi() {
  if (((j = null), !!I)) {
    try {
      window.localStorage.removeItem(Vs());
    } catch {}
    mi(async () => {
      const { error: t } = await O.from("workout_progress")
        .delete()
        .eq("user_id", I.id);
      if (t)
        if (Lo(t)) fr = !1;
        else throw t;
    });
  }
}
function lu() {
  if (I)
    try {
      const t = window.localStorage.getItem(Bc());
      if (!t) return;
      const e = JSON.parse(t);
      ((Wt = typeof e.motivationId == "string" ? e.motivationId : null),
        (le = Array.isArray(e.queue)
          ? e.queue.filter((r) => typeof r == "string")
          : []),
        (Me = Ee(
          Number.parseInt(e.queueIndex, 10) || 0,
          0,
          Math.max(0, le.length - 1),
        )),
        e.endAt && Number(e.endAt) > Date.now()
          ? ((ue = Number(e.endAt)),
            (Xe = Math.max(0, Math.ceil((ue - Date.now()) / 1e3))),
            vr(),
            (hn = window.setInterval(qu, 250)))
          : Number.isFinite(Number(e.pausedSeconds)) &&
            ((ue = null), (Xe = Ee(Number(e.pausedSeconds), 0, dr))));
    } catch {}
}
function zn() {
  if (I)
    try {
      window.localStorage.setItem(
        Bc(),
        JSON.stringify({
          endAt: ue,
          pausedSeconds: Yn(),
          motivationId: Wt,
          queue: le,
          queueIndex: Me,
        }),
      );
    } catch {}
}
function Li(t, e = "item") {
  return (
    String(t || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._ -]+/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 60) || e
  );
}
function Di(t) {
  return String(Math.max(1, Number.parseInt(t, 10) || 1)).padStart(2, "0");
}
function Al(t, e, r) {
  const n = new sg(e);
  (t.add(n), n.push(r, !0));
}
function ny(t, e) {
  const r = e.get(t.folder_id);
  if (r?.name === qt) {
    const a = lt(t.video_path),
      l = Ds.has(a) || qn.has(a) ? a : "mp4";
    return `videos/motivation/${Di(t.sort_order)}-${Li(t.name, "motivation")}.${l}`;
  }
  const n = Li(r?.name, "folder"),
    s = Li(t.name, "exercise"),
    i = String(t.exercise_group || t.id || "").slice(0, 8),
    o = Ds.has(lt(t.video_path)) ? lt(t.video_path) : "mp4";
  return `videos/${Di(r?.sort_order)}-${n}/${Di(t.sort_order)}-${s}-${i}/reference-${Math.max(1, Number(t.video_order) || 1)}.${o}`;
}
async function cu() {
  const button = document.querySelector("#backup-library");
  const status = document.querySelector("#backup-status");
  if (!button || !status || !I || button.disabled) return;
  const owner = I.id;
  const email = I.email || "";
  const originalLabel = button.textContent;
  button.disabled = true;
  button.textContent = "Backing up…";
  status.textContent = "Preparing your data and media. Keep battle angel open.";
  try {
    const read = async (table, fields, order, label = table) => {
      const rows = [];
      const tieBreak = fields.split(",").includes("id")
        ? "id"
        : table === "exercise_weight_log"
          ? "exercise_group"
          : table === "daily_med_log"
            ? "med_id"
            : null;
      for (let offset = 0; ; offset += 500) {
        if (I?.id !== owner)
          throw new Error(
            "Your account changed. Start a new backup after signing in.",
          );
        let query = O.from(table).select(fields).eq("user_id", owner);
        if (order) query = query.order(order, { ascending: true });
        if (tieBreak && tieBreak !== order)
          query = query.order(tieBreak, { ascending: true });
        const page = await baBackupRead(
          query.range(offset, offset + 499),
          label,
        );
        rows.push(...page);
        if (page.length < 500) return rows;
      }
    };
    const [folders, exercises] = await Promise.all([
      read(
        "folders",
        "id,name,sort_order,created_at",
        "sort_order",
        "workouts",
      ),
      read(
        "exercises",
        "id,folder_id,exercise_group,name,video_path,sort_order,video_order,created_at,sets_target,reps_target,last_weight,cue_1,cue_2,cue_3,backup_exercise",
        "sort_order",
        "exercises and motivation",
      ),
    ]);
    const folderMap = new Map(folders.map((folder) => [folder.id, folder]));
    const motivationIds = new Set(
      folders.filter((folder) => folder.name === qt).map((folder) => folder.id),
    );
    const rows = exercises.map((row) => ({
      ...row,
      backup_file: ny(row, folderMap),
    }));
    const warnings = [];
    const optional = (available, table, fields, order, label) => {
      if (available) return read(table, fields, order, label);
      warnings.push(
        `${label} could not be read because this feature is currently unavailable. Its cached data may be in local_state.`,
      );
      return Promise.resolve(null);
    };
    const [
      schedule,
      weeklyPlan,
      history,
      weightLog,
      dailySteps,
      dailyProgress,
      dailyMeds,
      dailyMedLog,
      powerTodos,
      powerPlan,
      board,
      story,
    ] = await Promise.all([
      optional(
        yt,
        "workout_schedule",
        "id,workout_date,folder_id,is_skipped,created_at,updated_at",
        "workout_date",
        "Workout schedule",
      ),
      optional(
        Be && Fs,
        "workout_weekly_plan",
        "id,weekday,folder_id,created_at,updated_at",
        "weekday",
        "Weekly workout plan",
      ),
      optional(
        Be && Br,
        "workout_history",
        "id,workout_date,folder_id,completed_at",
        "workout_date",
        "Workout history",
      ),
      optional(
        Rt,
        "exercise_weight_log",
        "exercise_group,folder_id,workout_date,weight,updated_at",
        "workout_date",
        "Weight history",
      ),
      optional(
        $t,
        "daily_steps",
        "id,title,note,substeps,active_days,day_order,sort_order,created_at,updated_at",
        "sort_order",
        "Repetition",
      ),
      optional(
        $t,
        "daily_progress",
        "progress_date,completed_step_ids,skipped_step_ids,later_step_ids,stack_order,day_mode,substep_positions,is_complete,started_at,updated_at",
        "progress_date",
        "Momentum history",
      ),
      optional(
        ct,
        "daily_meds",
        at
          ? "id,name,routine_step_id,sort_order,created_at,updated_at"
          : "id,name,sort_order,created_at,updated_at",
        "sort_order",
        "Boosters",
      ),
      optional(
        ct,
        "daily_med_log",
        "med_id,taken_date,taken_at",
        "taken_date",
        "Booster history",
      ),
      optional(
        De,
        "power_todos",
        "id,title,sort_order,completed_at,created_at,updated_at",
        "created_at",
        "Power actions",
      ),
      optional(
        De,
        "power_action_plan",
        "id,todo_id,action_date,status,sort_order,started_at,created_at,updated_at",
        "action_date",
        "Power action dates",
      ),
      optional(
        Fr,
        "changed_board_entries",
        "id,side,body,sort_order,created_at,updated_at",
        "sort_order",
        "Reflections",
      ),
      optional(
        Fr,
        "changed_story_entries",
        "id,body,sort_order,created_at,updated_at",
        "sort_order",
        "Reflection history",
      ),
    ]);
    if (I?.id !== owner)
      throw new Error(
        "Your account changed. Start a new backup after signing in.",
      );
    const backup = {
      format: "battle-angel-backup",
      version: 14,
      exported_at: new Date().toISOString(),
      account_email: email,
      backup_status: warnings.length ? "partial" : "complete",
      backup_warnings: warnings,
      folders: folders.filter((folder) => folder.name !== qt),
      exercises: rows.filter((row) => !motivationIds.has(row.folder_id)),
      motivation_videos: rows.filter((row) => motivationIds.has(row.folder_id)),
      schedule,
      weekly_plan: weeklyPlan,
      history,
      weight_log: weightLog,
      daily_steps: dailySteps,
      daily_progress: dailyProgress,
      daily_meds: dailyMeds,
      daily_med_log: dailyMedLog,
      power_todos: powerTodos,
      power_action_plan: powerPlan,
      changed_board_entries: board,
      changed_story_entries: story,
      local_state: {
        pending_changes: J(),
        snapshot: Zr(uu(), null),
        active_workout: zt(),
        timer: Zr(Bc(), null),
        capture_draft: baReadCaptureDraft(baCaptureDraftKey()),
      },
    };
    const chunks = [];
    let pieces = [];
    let bytes = 0;
    let resolveZip, rejectZip;
    const ready = new Promise((resolve, reject) => {
      resolveZip = resolve;
      rejectZip = reject;
    });
    // A rejected ZIP promise can occur while media is still being downloaded.
    ready.catch(() => {});
    const archive = new ig((error, data, final) => {
      if (error) {
        rejectZip(error);
        return;
      }
      pieces.push(data);
      bytes += data.length;
      if (bytes >= 16 * 1024 * 1024 || final) {
        chunks.push(new Blob(pieces));
        pieces = [];
        bytes = 0;
      }
      if (final) resolveZip(new Blob(chunks, { type: "application/zip" }));
    });
    Al(
      archive,
      "battle-angel-backup.json",
      so(JSON.stringify(backup, null, 2)),
    );
    for (let index = 0; index < rows.length; index += 1) {
      if (I?.id !== owner)
        throw new Error(
          "Your account changed. Start a new backup after signing in.",
        );
      const row = rows[index];
      status.textContent = `Backing up media ${index + 1} of ${rows.length}…`;
      let media = await xu(row.video_path);
      if (!media) {
        const download = await O.storage.from(ut).download(row.video_path);
        if (download.error || !download.data)
          throw new Error(
            `Could not back up ${row.name}: ${download.error?.message || "Media unavailable."}`,
          );
        media = download.data;
      }
      Al(archive, row.backup_file, new Uint8Array(await media.arrayBuffer()));
    }
    archive.end();
    const blob = await ready;
    const date = U();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `battle-angel-${warnings.length ? "partial-" : ""}backup-${date}.zip`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    status.textContent = warnings.length
      ? `Partial backup downloaded. ${warnings.length} data section${warnings.length === 1 ? " was" : "s were"} unavailable; see backup_warnings in the JSON file. Reconnect and retry for a complete backup.`
      : `Backup ready: your data, local unsynced changes, and ${rows.length} media file${rows.length === 1 ? "" : "s"}. Save the ZIP somewhere safe.`;
  } catch (error) {
    console.error("Backup failed:", error);
    status.textContent = `Backup was not completed. ${error.message || "Reconnect and try again."}`;
  } finally {
    button.disabled = false;
    button.textContent = originalLabel;
  }
}
function ho(t = "") {
  (document.documentElement.classList.remove("day-runner-active"),
    document.body.classList.remove("day-runner-active"),
    (oe = !1),
    (Re += 1),
    (G = "login"),
    (ot.innerHTML = `
    <main class="shell login-wrap">
      <section class="login-card" aria-labelledby="login-title">
        <div class="brand-name">battle angel</div>
        <div class="brand-slogan">a warrior's spirit needs a warrior's body</div>
        <h1 id="login-title">ENTER.</h1>
        <form class="login-form" id="login-form">
          <label for="email" class="eyebrow">EMAIL</label>
          <input id="email" type="email" autocomplete="username" inputmode="email" autocapitalize="none" spellcheck="false" required placeholder="you@example.com" />
          <label for="password" class="eyebrow">PASSWORD</label>
          <input id="password" type="password" autocomplete="current-password" required minlength="6" placeholder="your battle angel password" />
          <button class="primary-button" type="submit">ENTER</button>
        </form>
        <div id="login-status" class="status-line" aria-live="polite">${T(t)}</div>
      </section>
    </main>`));
  const e = document.querySelector("#login-form"),
    r = document.querySelector("#login-status");
  e.addEventListener("submit", async (n) => {
    n.preventDefault();
    const s = document.querySelector("#email").value.trim(),
      i = document.querySelector("#password").value,
      o = e.querySelector("button");
    ((o.disabled = !0), (o.textContent = "ENTERING..."), (r.textContent = ""));
    const { error: a } = await O.auth.signInWithPassword({
      email: s,
      password: i,
    });
    if (a) {
      const l = a.message.toLowerCase().includes("invalid login credentials")
        ? "Email or password is incorrect."
        : a.message;
      ((r.textContent = l), (o.disabled = !1), (o.textContent = "Sign in"));
      return;
    }
    o.textContent = "opening battle angel...";
  });
}
async function sy() {
  const { data: t, error: e } = await O.from("folders")
    .select("id,name,sort_order,created_at")
    .order("sort_order", { ascending: !0 })
    .order("created_at", { ascending: !0 });
  if (e) throw e;
  if (t.filter((o) => o.name !== qt).length) return t;
  const n = lg.map((o, a) => ({ user_id: I.id, name: o, sort_order: a + 1 })),
    { data: s, error: i } = await O.from("folders")
      .insert(n)
      .select("id,name,sort_order,created_at");
  if (i) throw i;
  return [...t, ...s.sort((o, a) => o.sort_order - a.sort_order)];
}
async function iy(t = []) {
  const e = t.find((o) => o.name === qt);
  if (e) return e;
  const { data: r, error: n } = await O.from("folders")
    .select("id,name,sort_order,created_at")
    .eq("name", qt)
    .maybeSingle();
  if (n) throw n;
  if (r) return r;
  const { data: s, error: i } = await O.from("folders")
    .insert({ user_id: I.id, name: qt, sort_order: 9999 })
    .select("id,name,sort_order,created_at")
    .single();
  if (i) throw i;
  return s;
}
async function Cn() {
  if (!Bt) {
    fe = [];
    return;
  }
  const { data: t, error: e } = await O.from("exercises")
    .select("id,name,video_path,sort_order,created_at")
    .eq("folder_id", Bt.id)
    .order("sort_order", { ascending: !0 })
    .order("created_at", { ascending: !0 });
  if (e) throw e;
  fe = await Bo(t || []);
}
async function Bo(t) {
  const e = new Set(t.map((r) => r.video_path));
  for (const [r, n] of Ci) e.has(r) || (URL.revokeObjectURL(n), Ci.delete(r));
  return t.length ? gu(t, null, Ci) : [];
}
async function Vr() {
  const t = await sy();
  Bt = await iy(t);
  const e = t.filter((s) => s.name !== qt),
    [r] = await Promise.all([
      O.from("exercises").select("folder_id,exercise_group"),
      Cn(),
      Kt(),
      wr(),
      Hr(),
      Gr(),
      Yr(),
    ]);
  if (r.error) throw r.error;
  const n = {};
  ((r.data || []).forEach((s) => {
    (n[s.folder_id] || (n[s.folder_id] = new Set()),
      n[s.folder_id].add(s.exercise_group));
  }),
    ($e = e.map((s) => ({ ...s, count: n[s.id]?.size || 0 }))),
    (Ht = !1),
    K(),
    Lt());
}
function uu() {
  return `battle-angel-snapshot-${I?.id || "anon"}`;
}
function du(t) {
  return `battle-angel-rows-${I?.id || "anon"}-${t}`;
}
function hu() {
  return `battle-angel-pending-${I?.id || "anon"}`;
}
function Zr(t, e) {
  try {
    const r = window.localStorage.getItem(t);
    return r ? JSON.parse(r) : e;
  } catch {
    return e;
  }
}
function Kn(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    baFailedStorageKeys.delete(key);
    baStorageError = baFailedStorageKeys.size > 0;
    return true;
  } catch {
    baFailedStorageKeys.add(key);
    baStorageError = true;
    baUpdateSyncStatus();
    return false;
  }
}
function Mo(t) {
  return t.map(({ signedUrl: e, offline: r, ...n }) => n);
}
function K() {
  I &&
    Kn(uu(), {
      savedAt: Date.now(),
      folders: $e,
      motivationFolder: Bt,
      motivationRows: Mo(fe),
      scheduleEntries: Mt,
      weeklyPlanEntries: pt,
      workoutHistory: Fe,
      dailySteps: se,
      dailyProgress: Se,
      dailyMeds: _e,
      dailyMedTakenIds: ke,
      dailyMedsDate: Le,
      powerTodos: Y,
      completedPowerTodos: baActionArchive,
      powerPlans: de,
      powerActionsDate: mt,
      changedBoardEntries: We,
      changedStoryEntries: Qe,
    });
}
async function oy() {
  const t = Zr(uu(), null);
  if (!t || !Array.isArray(t.folders)) return !1;
  (($e = t.folders),
    (Bt = t.motivationFolder || null),
    (Mt = t.scheduleEntries || []),
    (pt = t.weeklyPlanEntries || []),
    (Fe = ks(t.workoutHistory || [])),
    (se = Array.isArray(t.dailySteps)
      ? t.dailySteps.map((n) => ({
          ...n,
          substeps: wt(n.substeps),
          active_days: Ot(n.active_days),
          day_order: Fn(n.day_order),
        }))
      : []),
    (Se = Hn(t.dailyProgress, U())));
  const e = Kc(U());
  (e && (Se = e),
    (_e = Array.isArray(t.dailyMeds) ? t.dailyMeds : []),
    (Le = t.dailyMedsDate === U() ? t.dailyMedsDate : U()),
    (ke =
      t.dailyMedsDate === U() && Array.isArray(t.dailyMedTakenIds)
        ? t.dailyMedTakenIds
        : []),
    (ke = Pn(ke, U())),
    (Y = Array.isArray(t.powerTodos) ? t.powerTodos : []),
    (baActionArchive = Array.isArray(t.completedPowerTodos)
      ? t.completedPowerTodos
      : []),
    (mt = t.powerActionsDate === U() ? t.powerActionsDate : U()),
    (de = Array.isArray(t.powerPlans) ? t.powerPlans : []));
  const r = Jc([...Y, ...baActionArchive], de, mt);
  return (
    (Y = r.todos),
    (baActionArchive = r.allTodos.filter((row) => row.completed_at)),
    (de = r.plans),
    (We = Array.isArray(t.changedBoardEntries) ? t.changedBoardEntries : []),
    (Qe = Array.isArray(t.changedStoryEntries) ? t.changedStoryEntries : []),
    (fe = await Bo(t.motivationRows || [])),
    !0
  );
}
function fu(t, e) {
  Kn(du(t), Mo(e));
}
function ay(t) {
  const e = Zr(du(t), null);
  return Array.isArray(e) ? e : null;
}
function yi(t, e) {
  let r;
  const n = new Promise((s, i) => {
    r = window.setTimeout(() => i(new Error("Network timeout")), e);
  });
  return Promise.race([t, n]).finally(() => window.clearTimeout(r));
}
function ie(t) {
  const e = `${t?.name || ""} ${t?.message || t || ""}`.toLowerCase();
  return (
    navigator.onLine === !1 ||
    /fetch|network|timeout|load failed|offline|retryable/.test(e)
  );
}
async function pu(t) {
  const e = ay(t);
  if (navigator.onLine === !1 && e) return { rows: e, fromCache: !0 };
  try {
    const r = O.from("exercises")
        .select(kg)
        .eq("folder_id", t)
        .order("sort_order", { ascending: !0 })
        .order("video_order", { ascending: !0 })
        .order("created_at", { ascending: !0 }),
      { data: n, error: s } = e ? await yi(r, Po) : await r;
    if (s) throw s;
    const i = n || [];
    return (fu(t, i), { rows: i, fromCache: !1 });
  } catch (r) {
    if (e) return { rows: e, fromCache: !0 };
    throw r;
  }
}
async function mu(t) {
  const e = Date.now(),
    r = [...new Set(t.filter(Boolean))],
    n = r.filter((s) => {
      const i = fn.get(s);
      return !i || i.expiresAt - e < 3600 * 1e3;
    });
  if (n.length && navigator.onLine !== !1)
    try {
      const { data: s, error: i } = await yi(
        O.storage.from(ut).createSignedUrls(n, _l),
        Sg,
      );
      if (i) throw i;
      ((s || []).forEach((o, a) => {
        const l = o?.path || n[a];
        o?.signedUrl &&
          fn.set(l, { url: o.signedUrl, expiresAt: e + _l * 1e3 });
      }),
        (bs = e));
    } catch (s) {
      console.warn("Could not sign video URLs:", s);
    }
  return Object.fromEntries(r.map((s) => [s, fn.get(s)?.url || ""]));
}
async function gu(t, e = oo, r = null) {
  const n = await Promise.all(
      t.map(async (o) =>
        r?.has(o.video_path)
          ? { row: o, existingUrl: r.get(o.video_path) }
          : { row: o, blob: await xu(o.video_path) },
      ),
    ),
    s = n.filter((o) => !o.blob && !o.existingUrl).map((o) => o.row.video_path),
    i = s.length ? await mu(s) : {};
  return n.map(({ row: o, blob: a, existingUrl: l }) => {
    if (l) return { ...o, signedUrl: l, offline: !0 };
    if (a) {
      const c = URL.createObjectURL(a);
      return (
        r ? r.set(o.video_path, c) : e.push(c),
        { ...o, signedUrl: c, offline: !0 }
      );
    }
    return { ...o, signedUrl: i[o.video_path] || "", offline: !1 };
  });
}
function J() {
  const value = Zr(hu(), {});
  const object = (x) =>
    x && typeof x === "object" && !Array.isArray(x) ? x : {};
  const days = { ...object(value.dailyProgressByDate) };
  if (
    value.dailyProgress?.progress_date &&
    !days[value.dailyProgress.progress_date]
  )
    days[value.dailyProgress.progress_date] = value.dailyProgress;
  return {
    ...value,
    weights: object(value.weights),
    completions: Array.isArray(value.completions) ? value.completions : [],
    uncompletions: Array.isArray(value.uncompletions)
      ? value.uncompletions
      : [],
    weightLogs: object(value.weightLogs),
    dailyProgress: days[U()] || null,
    dailyProgressByDate: days,
    medToggles: object(value.medToggles),
    powerPlanWrites: object(value.powerPlanWrites),
    powerTodoWrites: object(value.powerTodoWrites),
  };
}
function we(value) {
  return Kn(hu(), value);
}
function ks(t) {
  const e = I ? J() : { completions: [], uncompletions: [] },
    r = e.completions,
    n = new Set(e.uncompletions.map((i) => `${i.workout_date}|${i.folder_id}`)),
    s = t.filter((i) => !n.has(`${i.workout_date}|${i.folder_id}`));
  return (
    r.forEach((i) => {
      s.some(
        (o) => o.workout_date === i.workout_date && o.folder_id === i.folder_id,
      ) || s.unshift({ id: `pending-${i.folder_id}-${i.workout_date}`, ...i });
    }),
    s
  );
}
let Ui = !1;
async function Lt() {
  if (!I || navigator.onLine === false) {
    baUpdateSyncStatus();
    return;
  }
  if (Ui) {
    baSyncAgain = true;
    return;
  }
  if (!baQueueCount()) {
    baUpdateSyncStatus();
    return;
  }
  Ui = true;
  baSyncAgain = false;
  clearTimeout(baSyncRetry);
  const userId = I.id;
  const sameUser = () => I?.id === userId;
  const ensure = () => {
    if (!sameUser()) throw new Error("Account changed");
  };
  const checked = async (query) => {
    const result = await query;
    ensure();
    if (result.error) throw result.error;
    return result;
  };
  const consume = (kind, key, expected) => {
    ensure();
    const p = J();
    if (JSON.stringify(p[kind][key]) === JSON.stringify(expected)) {
      delete p[kind][key];
      if (kind === "dailyProgressByDate" && key === U()) p.dailyProgress = null;
      we(p);
    }
  };
  const consumeArray = (kind, row) => {
    ensure();
    const p = J();
    p[kind] = p[kind].filter(
      (item) => JSON.stringify(item) !== JSON.stringify(row),
    );
    we(p);
  };
  try {
    // Stable client IDs make offline creates safe to retry after an ambiguous response.
    for (const [key, item] of Object.entries(J().powerTodoWrites)) {
      ensure();
      if (item.operation === "delete")
        await checked(
          O.from("power_todos").delete().eq("id", key).eq("user_id", userId),
        );
      else
        await checked(
          O.from("power_todos").upsert(
            { ...item.payload, id: key, user_id: userId },
            { onConflict: "id" },
          ),
        );
      consume("powerTodoWrites", key, item);
    }
    for (const [key, item] of Object.entries(J().powerPlanWrites)) {
      ensure();
      if (item.operation === "delete")
        await checked(
          O.from("power_action_plan")
            .delete()
            .eq("id", item.plan_id || key)
            .eq("user_id", userId),
        );
      else if (item.operation === "upsert")
        await checked(
          O.from("power_action_plan").upsert(
            {
              id: item.plan_id || key,
              user_id: userId,
              todo_id: item.todo_id,
              action_date: item.action_date,
              status: item.status,
              sort_order: item.sort_order || 0,
              started_at: item.started_at || null,
              updated_at: item.updated_at,
            },
            { onConflict: "id" },
          ),
        );
      else
        await checked(
          O.from("power_action_plan")
            .update({
              status: item.status,
              sort_order: item.sort_order,
              started_at: item.started_at || null,
              updated_at: item.updated_at,
            })
            .eq("id", item.plan_id)
            .eq("user_id", userId),
        );
      if (Object.prototype.hasOwnProperty.call(item, "todo_completed_at"))
        await checked(
          O.from("power_todos")
            .update({
              completed_at: item.todo_completed_at,
              updated_at: item.updated_at,
            })
            .eq("id", item.todo_id)
            .eq("user_id", userId),
        );
      consume("powerPlanWrites", key, item);
    }
    for (const [date, progress] of Object.entries(J().dailyProgressByDate)) {
      ensure();
      await checked(
        O.from("daily_progress").upsert(
          { user_id: userId, ...Hn(progress, date) },
          { onConflict: "user_id,progress_date" },
        ),
      );
      consume("dailyProgressByDate", date, progress);
    }
    for (const [key, item] of Object.entries(J().medToggles)) {
      ensure();
      if (item.is_taken)
        await checked(
          O.from("daily_med_log").upsert(
            {
              user_id: userId,
              med_id: item.med_id,
              taken_date: item.taken_date,
              taken_at: item.updated_at,
            },
            { onConflict: "user_id,med_id,taken_date" },
          ),
        );
      else
        await checked(
          O.from("daily_med_log")
            .delete()
            .eq("med_id", item.med_id)
            .eq("taken_date", item.taken_date)
            .eq("user_id", userId),
        );
      consume("medToggles", key, item);
    }
    for (const [key, weight] of Object.entries(J().weights)) {
      ensure();
      await checked(
        O.from("exercises")
          .update({ last_weight: weight })
          .eq("exercise_group", key)
          .eq("user_id", userId),
      );
      consume("weights", key, weight);
    }
    for (const item of J().completions) {
      ensure();
      await checked(
        O.from("workout_history").upsert(
          {
            user_id: userId,
            workout_date: item.workout_date,
            folder_id: item.folder_id,
            completed_at: item.completed_at,
          },
          { onConflict: "user_id,workout_date,folder_id" },
        ),
      );
      consumeArray("completions", item);
    }
    for (const item of J().uncompletions) {
      ensure();
      await checked(
        O.from("workout_history")
          .delete()
          .eq("workout_date", item.workout_date)
          .eq("folder_id", item.folder_id)
          .eq("user_id", userId),
      );
      consumeArray("uncompletions", item);
    }
    for (const [key, item] of Object.entries(J().weightLogs)) {
      ensure();
      await checked(
        O.from("exercise_weight_log").upsert(
          {
            user_id: userId,
            folder_id: item.folder_id,
            exercise_group: item.exercise_group,
            workout_date: item.workout_date,
            weight: item.weight,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,exercise_group,workout_date" },
        ),
      );
      consume("weightLogs", key, item);
    }
    if (sameUser()) {
      baSyncError = "";
      Ht = false;
      K();
    }
  } catch (error) {
    if (sameUser()) {
      baSyncError = ie(error)
        ? "Your changes are saved on this device. Reconnect to sync."
        : "Your changes are saved on this device. Try syncing again from More.";
    }
  } finally {
    Ui = false;
    if (sameUser()) {
      baUpdateSyncStatus();
      if (baQueueCount() && navigator.onLine !== false)
        baSyncRetry = setTimeout(
          () => Lt(),
          baSyncAgain && !baSyncError ? 100 : 30000,
        );
    } else if (I && navigator.onLine !== false) {
      baSyncRetry = setTimeout(() => Lt(), 100);
    }
  }
}
function Ys() {
  return JSON.stringify([
    $e,
    Mt,
    pt,
    Fe.map((t) => [t.workout_date, t.folder_id]),
    fe.map((t) => t.id),
    se.map((t) => [
      t.id,
      t.title,
      t.note,
      t.substeps,
      t.active_days,
      t.day_order,
      t.sort_order,
    ]),
    Se,
    _e.map((t) => [t.id, t.name, t.routine_step_id, t.sort_order]),
    Le,
    ke,
    Y.map((t) => [t.id, t.title, t.sort_order]),
    de.map((t) => [
      t.id,
      t.todo_id,
      t.action_date,
      t.status,
      t.sort_order,
      t.started_at,
    ]),
    We.map((t) => [t.id, t.side, t.body, t.sort_order]),
    Qe.map((t) => [t.id, t.body, t.sort_order]),
  ]);
}
async function Xs() {
  if (!I) return;
  const t = Re,
    e = Ys(),
    r = Ht;
  try {
    await Vr();
  } catch (n) {
    console.warn("Background refresh failed:", n);
    return;
  }
  Re !== t ||
    (Ys() === e && !r) ||
    (G === "day"
      ? ee()
      : G === "day-overview"
        ? ee("", { forceOverview: !0 })
        : G === "home"
          ? Pt()
          : G === "workouts"
            ? mr()
            : G === "changed" && tn());
}
function yu() {
  try {
    navigator.storage?.persist?.().catch(() => {});
  } catch {}
}
async function vi(t) {
  const e = (t || []).filter(Boolean);
  if (e.length) {
    try {
      const r = await Yo();
      (await new Promise((n) => {
        const s = r.transaction(Ft, "readwrite"),
          i = s.objectStore(Ft);
        (e.forEach((o) => i.delete(o)), (s.oncomplete = n), (s.onerror = n));
      }),
        r.close());
    } catch {}
    e.forEach((r) => fn.delete(r));
  }
}
function ly(t) {
  const e = [...t];
  for (let r = e.length - 1; r > 0; r -= 1) {
    const n = Math.floor(Math.random() * (r + 1));
    [e[r], e[n]] = [e[n], e[r]];
  }
  return e;
}
function vu(t = null) {
  const e = fe.filter((n) => n.signedUrl).map((n) => n.id),
    r = ly(e);
  return (r.length > 1 && r[0] === t && r.push(r.shift()), r);
}
function wu() {
  ((le = vu(Wt)), (Me = 0), (Wt = le[0] || null), (un = 0));
}
function fo() {
  return (le.length && fe.find((t) => t.id === le[Me] && t.signedUrl)) || null;
}
function _u() {
  (_s && window.clearTimeout(_s), (_s = null));
}
function Fo(t = !1) {
  _u();
  const e = document.querySelector("#rest-motivation-video");
  if (e && (e.pause(), t))
    try {
      e.currentTime = 0;
    } catch {}
}
function po() {
  G !== "rest" ||
    !ue ||
    ((Me += 1),
    Me >= le.length && ((le = vu(le[le.length - 1])), (Me = 0)),
    (Wt = le[Me] || null),
    zn(),
    bu());
}
function bu() {
  _u();
  const t = document.querySelector("#rest-motivation-video"),
    e = document.querySelector("#rest-motivation-image");
  if (!t || !e) return;
  let r = fo(),
    n = le.length;
  for (; !r && n > 0 && le.length;)
    ((Me = (Me + 1) % le.length), (r = fo()), (n -= 1));
  if (!r) {
    (t.classList.add("hidden"), e.classList.add("hidden"));
    return;
  }
  if (((Wt = r.id), Mn(r.video_path))) {
    (t.pause(),
      t.classList.add("hidden"),
      e.classList.remove("hidden"),
      (e.src = r.signedUrl),
      (_s = window.setTimeout(po, yg * 1e3)),
      Ol());
    return;
  }
  (e.classList.add("hidden"),
    e.removeAttribute("src"),
    t.classList.remove("hidden"),
    t.getAttribute("src") !== r.signedUrl && (t.src = r.signedUrl),
    (t.muted = !wi()));
  const s = t.play();
  (s?.catch &&
    s.catch((i) => {
      i?.name === "NotAllowedError" &&
        !t.muted &&
        ((t.muted = !0), Wo(!1), t.play()?.catch?.(() => {}));
    }),
    Ol());
}
function Ol() {
  const t = le[Me + 1],
    e = fe.find((r) => r.id === t);
  if (e?.signedUrl && Mn(e.video_path)) {
    const r = new Image();
    r.src = e.signedUrl;
  }
}
function Wo(enabled) {
  const button = document.querySelector("#rest-sound-toggle");
  if (button) {
    button.textContent = enabled ? "Sound on" : "Sound off";
    button.setAttribute("aria-pressed", String(!!enabled));
  }
  const hint = document.querySelector("#rest-sound-hint");
  if (hint) hint.textContent = enabled ? "Sound on" : "Sound off";
}
function wi() {
  try {
    return window.localStorage.getItem(Lc) === "on";
  } catch {
    return !1;
  }
}
function cy(t) {
  try {
    window.localStorage.setItem(Lc, t ? "on" : "off");
  } catch {}
}
const uy = 350,
  dy = 12,
  hy = 300;
function Su() {
  if (!ue && G !== "rest") return;
  Re += 1;
  G = "rest";
  const running = !!ue;
  if (running) Xn();
  else jn();
  if (!fo() && fe.length) wu();
  const hasMedia = fe.some((item) => item.signedUrl);
  const hasVideo = fe.some((item) => item.signedUrl && !Mn(item.video_path));
  const sound = wi();
  ot.innerHTML = `
    <main class="rest-lock-screen rest-accessible" aria-labelledby="rest-heading">
      ${
        hasMedia
          ? `
        <video id="rest-motivation-video" class="rest-lock-video hidden" playsinline webkit-playsinline preload="metadata" ${sound ? "" : "muted"} aria-label="Motivation video"></video>
        <img id="rest-motivation-image" class="rest-lock-image hidden" alt="" />`
          : '<div class="rest-lock-blank" aria-hidden="true"></div>'
      }
      <div class="rest-accessible-heading">
        <h1 id="rest-heading" tabindex="-1">Rest</h1>
        <p id="rest-running-state" role="status">${running ? "A little space to recover." : "Paused. Take the time you need."}</p>
      </div>
      <div id="timer-value" class="rest-lock-timer" role="timer" aria-label="Rest time remaining" aria-live="off" aria-atomic="true">${ju(Yn())}</div>
      <div class="rest-visible-controls">
        ${hasVideo ? `<button type="button" class="rest-sound-button" id="rest-sound-toggle" aria-label="Rest video sound" aria-pressed="${sound}">${sound ? "Sound on" : "Sound off"}</button>` : ""}
        <div class="rest-main-controls">
          <button type="button" class="rest-pause-button" id="rest-pause">${running ? "Pause" : "Resume"}</button>
          <button type="button" class="rest-finish-button" id="rest-finish">Finish rest <span aria-hidden="true">→</span></button>
        </div>
      </div>
    </main>`;
  if (hasMedia) {
    const video = document.querySelector("#rest-motivation-video");
    const picture = document.querySelector("#rest-motivation-image");
    video.loop = false;
    video.addEventListener("ended", () => {
      un = 0;
      po();
    });
    const onMediaError = () => {
      un += 1;
      if (un < Math.max(1, le.length)) po();
    };
    video.addEventListener("error", onMediaError);
    picture.addEventListener("error", onMediaError);
    picture.addEventListener("load", () => {
      un = 0;
    });
    if (running) bu();
    else {
      const current = fo();
      if (current && Mn(current.video_path)) {
        picture.src = current.signedUrl;
        picture.classList.remove("hidden");
      } else if (current) {
        video.src = current.signedUrl;
        video.classList.remove("hidden");
        video.muted = !sound;
      }
    }
    fy(video);
  }
  document.querySelector("#rest-pause").addEventListener("click", () => {
    if (ue) {
      Xv();
      Su();
    } else vo();
    document.querySelector("#rest-pause")?.focus({ preventScroll: true });
  });
  document
    .querySelector("#rest-finish")
    .addEventListener("click", baFinishRest);
  document
    .querySelector("#rest-sound-toggle")
    ?.addEventListener("click", baToggleRestSound);
  document
    .querySelector(".rest-lock-screen")
    .addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        baFinishRest();
      }
    });
  ta();
  document.querySelector("#rest-heading")?.focus({ preventScroll: true });
}
function fy(video) {
  const screen = document.querySelector(".rest-lock-screen");
  if (!screen) return;
  const opened = Date.now();
  let down = null;
  let previousTap = 0;
  screen.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button, input, a, summary")) {
      down = null;
      return;
    }
    down = {
      x: event.clientX,
      y: event.clientY,
      at: Date.now(),
      id: event.pointerId,
    };
  });
  screen.addEventListener("pointercancel", () => {
    down = null;
    previousTap = 0;
  });
  screen.addEventListener("pointerup", (event) => {
    const start = down;
    down = null;
    if (
      !start ||
      start.id !== event.pointerId ||
      event.target.closest("button, input, a, summary")
    )
      return;
    const now = Date.now();
    if (
      now - opened < 700 ||
      Math.hypot(event.clientX - start.x, event.clientY - start.y) > dy ||
      now - start.at > hy
    ) {
      previousTap = 0;
      return;
    }
    if (now - previousTap > uy) {
      previousTap = now;
      return;
    }
    previousTap = 0;
    if (video) baToggleRestSound();
  });
}
function py() {
  if (G === "rest") {
    if (oe && B && j) {
      br();
      return;
    }
    if (B) {
      yr(F);
      return;
    }
    Pt();
  }
}
function my(tab) {
  const active = tab === "plan" ? "gym" : tab;
  return `<nav class="bottom-nav" aria-label="Main navigation">${[
    ["day", "Momentum", "momentum"],
    ["gym", "Power Body", "body"],
    ["changed", "i changed.", "changed"],
    ["more", "More", "more"],
  ]
    .map(
      ([id, label, icon]) =>
        `<button type="button" class="bottom-nav-button ${active === id ? "active" : ""}" data-nav-tab="${id}" ${active === id ? 'aria-current="page"' : ""}>${baIcon(icon)}<span>${label}</span></button>`,
    )
    .join("")}</nav>`;
}
function gy() {
  document.querySelectorAll("[data-nav-tab]").forEach((button) =>
    button.addEventListener("click", () => {
      const tab = button.dataset.navTab;
      if (tab === "day") ee("", { forceOverview: true });
      else if (tab === "gym") Pt();
      else if (tab === "changed") tn();
      else if (tab === "more") Un();
    }),
  );
}
function re(content, options = {}) {
  const previous = G,
    scroll = window.scrollY,
    title = options.title || (B ? B.name : "Today"),
    account = options.showAccount !== false,
    timer = options.showTimer !== false,
    header = options.showHeader !== false;
  Re += 1;
  G = options.view || options.navTab || "";
  const runner = G === "day-runner";
  document.documentElement.classList.toggle("day-runner-active", runner);
  document.body.classList.toggle("day-runner-active", runner);
  ot.innerHTML = `<main id="main-view" class="shell ${oe ? "workout-shell" : ""} ${options.navTab ? "has-bottom-nav" : ""} ${header ? "" : "shell-no-header"}" tabindex="-1">
    ${header ? `<header class="topbar"><div class="topbar-title"><div class="brand-name brand-name-compact">battle angel</div><h1 id="page-title">${T(title)}</h1></div>${timer ? '<div class="topbar-actions"><button type="button" id="timer-toggle" class="timer-chip">rest <span id="timer-mini">2:30</span></button></div>' : ""}</header>` : ""}
    <div id="ba-sync-status" class="ba-sync-status" role="status" hidden></div><div id="main-content">${content}</div>
    ${account ? `<details class="account-menu"><summary>More</summary><div class="account-panel"><div class="account-email">${T(I?.email || "")}</div><div class="account-actions"><button type="button" class="secondary-button" id="theme-toggle">${Gs() === "dark" ? "Light mode" : "Dark mode"}</button><button type="button" class="secondary-button" id="backup-library">Backup</button><button type="button" class="secondary-button" id="sign-out">Sign out</button></div><div id="backup-status" class="status-line backup-status" aria-live="polite"></div></div></details>` : ""}${options.navTab ? my(options.navTab) : ""}</main>`;
  if (timer) {
    Yv();
    ta();
  }
  if (account) {
    document.querySelector("#theme-toggle")?.addEventListener("click", Uc);
    document.querySelector("#sign-out")?.addEventListener("click", baSignOut);
    document.querySelector("#backup-library")?.addEventListener("click", cu);
  }
  if (options.navTab) gy();
  baUpdateSyncStatus();
  // View changes have a predictable reading position; same-view updates retain scroll.
  if (previous !== G) {
    window.scrollTo(0, 0);
    const heading = document.querySelector(
      "#main-content h2,#page-title,#main-view",
    );
    heading?.setAttribute("tabindex", "-1");
    heading?.focus({ preventScroll: true });
  } else window.scrollTo(0, scroll);
  if (ar) window.requestAnimationFrame(Dc);
  baRefreshClock();
}
function yy(t) {
  const e = j || zt();
  return e?.folderId === t ? e : null;
}
function vy() {
  const t = fe
    .map(
      (e) => `
    <article class="motivation-item">
      ${Mn(e.video_path) ? `<img src="${T(e.signedUrl)}" alt="${T(e.name)}" loading="lazy" />` : `<video controls playsinline webkit-playsinline preload="metadata" src="${T(e.signedUrl)}" aria-label="${T(e.name)}"></video>`}
      <div class="motivation-item-row">
        <div class="motivation-item-name">${T(e.name)}</div>
        <button type="button" class="text-button danger-text motivation-remove" data-remove-motivation="${e.id}" data-motivation-path="${T(e.video_path)}">REMOVE</button>
      </div>
    </article>`,
    )
    .join("");
  return `
    <details class="motivation-library">
      <summary>
        <span>MOTIVATION</span>
        <span class="motivation-count">${fe.length}</span>
      </summary>
      <div class="motivation-editor-body">
        <label class="file-picker motivation-picker">
          <span class="file-picker-button">ADD MEDIA</span>
          <input id="motivation-videos" type="file" accept="video/*,image/*,.mp4,.mov,.m4v,.webm,.jpg,.jpeg,.png,.webp,.gif,.heic,.heif" multiple aria-label="Choose motivation videos or photos" />
        </label>
        <div id="motivation-status" class="status-line motivation-status" aria-live="polite"></div>
        ${t ? `<div class="motivation-list">${t}</div>` : ""}
      </div>
    </details>`;
}
function wy(t = Ce) {
  return Ms.find(([e]) => e === t) || Ms[0];
}
function _y() {
  repetitionCapture();
  const progress = z(),
    [, , dayName] = wy(),
    today = new Date().getDay();
  const routines = di(Ce),
    available = se.filter((item) => !Ot(item.active_days).includes(Ce));
  const userId = I?.id || "anonymous",
    key = String(Ce),
    state = repetitionState(userId);
  const draft = state.drafts[key] || {
    title: "",
    note: "",
    substeps: "",
    detailsOpen: false,
  };
  const busy = state.pending.has(key);
  const status = busy
    ? "Adding…"
    : state.drafts[key]
      ? repetitionDraftMessage(state)
      : state.notices[key] || "";
  delete state.notices[key];
  const weekdays = Ms.map(([day, short, full]) => {
    const count = se.filter((item) =>
      Ot(item.active_days).includes(day),
    ).length;
    return `<button type="button" class="routine-week-day ${day === Ce ? "is-selected" : ""} ${day === today ? "is-today" : ""}" data-routine-weekday="${day}" aria-pressed="${day === Ce}" aria-label="${full}, ${count} routine${count === 1 ? "" : "s"}${day === today ? ", today" : ""}"><strong>${short}</strong><span>${count}</span></button>`;
  }).join("");
  const rows = routines
    .map((item, index) => {
      const boosters = eu(item.id).length;
      return `<div class="routine-order-row" data-routine-order-id="${T(item.id)}">
      <span class="routine-order-number" data-reorder-number>${index + 1}</span>
      <span class="routine-week-row-copy"><strong>${T(item.title)}</strong>${boosters ? `<small>${boosters} booster${boosters === 1 ? "" : "s"}</small>` : ""}</span>
      <button type="button" class="routine-day-remove" data-routine-day-toggle="${T(item.id)}" aria-label="Remove ${T(item.title)} from ${T(dayName)}">×</button>
      <button type="button" class="day-reorder-handle routine-reorder-handle" data-routine-drag aria-label="Reorder ${T(item.title)}. Use the up and down arrow keys.">≡</button>
    </div>`;
    })
    .join("");
  const existing = available
    .map(
      (item) =>
        `<button type="button" class="routine-add-existing-row" data-routine-day-toggle="${T(item.id)}" aria-label="Add ${T(item.title)} to ${T(dayName)}"><span>${T(item.title)}</span><strong aria-hidden="true">+</strong></button>`,
    )
    .join("");
  const library = se
    .map((item) => {
      const steps = wt(item.substeps),
        days = Ot(item.active_days);
      return `<details class="daily-edit-item">
      <summary><span class="daily-edit-summary-copy"><strong>${T(item.title)}</strong><small>${T(Ig(days))}${steps.length ? ` · ${steps.length} small steps` : ""}</small></span><span class="daily-edit-more">Edit</span></summary>
      <form class="daily-edit-form" data-daily-edit="${T(item.id)}">
        <label><span class="eyebrow">Routine name</span><input name="title" type="text" maxlength="${Us}" required value="${T(item.title)}" /></label>
        <label><span class="eyebrow">Note</span><textarea name="note" maxlength="${js}" rows="2">${T(item.note || "")}</textarea></label>
        <details class="daily-substeps-editor" ${steps.length ? "open" : ""}><summary>Small steps${steps.length ? ` · ${steps.length}` : ""}</summary><label><span class="eyebrow">One step per line</span><textarea name="substeps" rows="${Math.min(6, Math.max(3, steps.length + 1))}">${T(Cg(item))}</textarea></label></details>
        <div class="daily-edit-actions"><button type="submit" class="primary-button">Save</button><button type="button" class="ghost-danger" data-daily-delete="${T(item.id)}">Delete</button></div>
      </form>
    </details>`;
    })
    .join("");
  return `<section class="day-setup-section routine-week-setup repetition-setup">
    <div class="routine-week-strip" role="group" aria-label="Routine weekdays">${weekdays}</div>
    <div class="routine-week-head"><strong>${T(dayName)}</strong><span>${routines.length} routine${routines.length === 1 ? "" : "s"}</span></div>
    <div class="routine-order-list" id="routine-order-list">${rows || '<p class="repetition-empty">No routines for this day yet.</p>'}</div>
    <form id="add-daily-step" class="repetition-quick-add" data-repetition-owner="${T(userId)}" data-repetition-day="${Ce}" aria-busy="${busy}">
      <label for="daily-step-title" class="repetition-add-label">New routine</label>
      <div class="repetition-quick-line"><input id="daily-step-title" name="title" type="text" maxlength="${Math.max(Us, draft.title.length)}" required placeholder="Name a routine" autocomplete="off" value="${T(draft.title)}" ${busy ? "readonly" : ""} /><button type="submit" class="primary-button repetition-add-button" ${busy || !draft.title.trim() ? "disabled" : ""}>${busy ? "Adding…" : `Add to ${T(dayName)}`}</button></div>
      <details class="daily-substeps-editor repetition-optional" ${draft.detailsOpen || draft.note || draft.substeps ? "open" : ""}>
        <summary>Note or small steps <span>· optional</span></summary>
        <div class="repetition-optional-fields">
          <label for="daily-step-note">Note</label><textarea id="daily-step-note" name="note" maxlength="${Math.max(js, draft.note.length)}" rows="2" ${busy ? "readonly" : ""}>${T(draft.note)}</textarea>
          <label for="daily-step-substeps">Small steps <span>· one per line</span></label><textarea id="daily-step-substeps" name="substeps" rows="3" ${busy ? "readonly" : ""}>${T(draft.substeps)}</textarea>
        </div>
      </details>
      <div id="daily-editor-status" class="repetition-status" role="status" aria-live="polite" aria-atomic="true">${T(status)}</div>
    </form>
    ${available.length ? `<details class="routine-day-add repetition-existing" id="routine-day-add" ${lo ? "open" : ""}><summary>Add an existing routine <span>${available.length}</span></summary><div class="routine-add-existing-list">${existing}</div></details>` : ""}
    ${library ? `<details class="routine-edit-library"><summary>Edit routines <span>${se.length}</span></summary><div class="daily-edit-list">${library}</div></details>` : ""}
    ${progress.started_at ? '<button type="button" class="text-button danger-text daily-reset" id="reset-day-progress">Reset today</button>' : ""}
  </section>`;
}
function by(t) {
  if (!t.length) return;
  const e = String(Ce),
    r = new Map(t.map((s, i) => [s, i + 1])),
    n = [];
  ((se = se.map((s) => {
    if (!r.has(s.id)) return s;
    const i = Fn(s.day_order),
      o = r.get(s.id);
    if (Number(i[e]) === o) return s;
    const a = { ...i, [e]: o },
      l = { ...s, day_order: a };
    return (n.push(l), l);
  })),
    K(),
    n.length &&
      (Hs = Hs.then(async () => {
        const i = (
          await Promise.all(
            n.map((o) =>
              O.from("daily_steps")
                .update({
                  day_order: o.day_order,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", o.id),
            ),
          )
        ).find((o) => o.error);
        if (i?.error) throw i.error;
      }).catch(async (s) => {
        (console.error(s),
          await wr().catch(() => {}),
          K(),
          G === "day-routine-setup" && Vt(),
          window.setTimeout(
            () => alert(ie(s) ? "OFFLINE." : "COULD NOT SAVE ORDER."),
            0,
          ));
      })));
}
async function Sy(t) {
  const e = se.find((a) => a.id === t);
  if (!e || !I || !$t) return;
  const r = Ot(e.active_days),
    n = r.includes(Ce),
    s = n ? r.filter((a) => a !== Ce) : [...r, Ce].sort((a, l) => a - l),
    i = String(Ce),
    o = Fn(e.day_order);
  (n ? delete o[i] : (o[i] = di(Ce).length + 1),
    (e.active_days = s),
    (e.day_order = o),
    K(),
    Vt(),
    (Hs = Hs.then(async () => {
      const { error: a } = await O.from("daily_steps")
        .update({
          active_days: s,
          day_order: o,
          updated_at: new Date().toISOString(),
        })
        .eq("id", t);
      if (a) throw a;
    }).catch(async (a) => {
      (console.error(a),
        await wr().catch(() => {}),
        K(),
        G === "day-routine-setup" && Vt(),
        window.setTimeout(
          () => alert(ie(a) ? "OFFLINE." : "COULD NOT SAVE."),
          0,
        ));
    })));
}
function ky() {
  document.querySelectorAll("[data-routine-weekday]").forEach((button) => {
    button.addEventListener("click", () => {
      repetitionCapture();
      Ce = Number.parseInt(button.dataset.routineWeekday, 10);
      lo = false;
      Vt();
      document
        .querySelector(`[data-routine-weekday="${Ce}"]`)
        ?.focus({ preventScroll: true });
    });
  });
  document
    .querySelector("#routine-day-add")
    ?.addEventListener("toggle", (event) => {
      lo = event.currentTarget.open;
    });
  document.querySelectorAll("[data-routine-day-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      repetitionCapture();
      Sy(button.dataset.routineDayToggle);
    });
  });
  ku({
    listSelector: "#routine-order-list",
    rowSelector: "[data-routine-order-id]",
    handleSelector: "[data-routine-drag]",
    keyName: "routineOrderId",
    onCommit: by,
  });
  const form = document.querySelector("#add-daily-step");
  if (form) {
    const onInput = () => {
      const draft = repetitionCapture(form);
      repetitionControls(form);
      repetitionStatus(
        form,
        draft
          ? repetitionDraftMessage(
              repetitionState(form.dataset.repetitionOwner),
            )
          : "",
      );
    };
    form.addEventListener("submit", By);
    form.querySelectorAll("input,textarea").forEach((field) => {
      field.addEventListener("input", onInput);
      field.addEventListener("change", onInput);
      field.addEventListener("compositionend", onInput);
    });
    form
      .querySelector(".repetition-optional")
      ?.addEventListener("toggle", () => repetitionCapture(form));
    repetitionControls(form);
  }
  document
    .querySelectorAll("[data-daily-edit]")
    .forEach((item) => item.addEventListener("submit", My));
  document
    .querySelectorAll("[data-daily-delete]")
    .forEach((button) =>
      button.addEventListener("click", () => Fy(button.dataset.dailyDelete)),
    );
  document.querySelector("#reset-day-progress")?.addEventListener("click", Wy);
  if (!ky.repetitionListening) {
    ky.repetitionListening = true;
    window.addEventListener("pagehide", () => repetitionCapture());
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") repetitionCapture();
    });
  }
}
function Ho() {
  (document.querySelectorAll("[data-daily-med-toggle]").forEach((t) => {
    t.addEventListener("click", () => Wg(t.dataset.dailyMedToggle));
  }),
    document.querySelector("#add-daily-med")?.addEventListener("submit", Ey),
    document.querySelectorAll("[data-booster-anchor]").forEach((t) => {
      t.addEventListener("change", () =>
        Ay(t.dataset.boosterAnchor, t.value || null),
      );
    }),
    document
      .querySelectorAll("[data-daily-med-edit]")
      .forEach((t) => t.addEventListener("submit", Ty)),
    document.querySelectorAll("[data-daily-med-delete]").forEach((t) => {
      t.addEventListener("click", () => Oy(t.dataset.dailyMedDelete));
    }));
}
async function Ey(t) {
  if ((t.preventDefault(), !I || !ct)) return;
  const e = document.querySelector("#daily-med-name"),
    r = document.querySelector("#daily-meds-status"),
    n = e?.value.trim().slice(0, Ns);
  if (!n) return;
  r && (r.textContent = "SAVING...");
  const s = Math.max(0, ..._e.map((l) => Number(l.sort_order) || 0)) + 1,
    i =
      (at && document.querySelector("#daily-med-routine-step")?.value) || null,
    o = {
      user_id: I.id,
      name: n,
      sort_order: s,
      updated_at: new Date().toISOString(),
    };
  at && (o.routine_step_id = i);
  const { error: a } = await O.from("daily_meds").insert(o);
  if (a) {
    r && (r.textContent = ie(a) ? "Connect to edit boosters." : a.message);
    return;
  }
  (await Hr(), K(), en());
}
async function Ty(t) {
  t.preventDefault();
  const e = t.currentTarget,
    r = e.dataset.dailyMedEdit,
    n = e.elements.name.value.trim().slice(0, Ns);
  if (!n) return;
  const s = { name: n, updated_at: new Date().toISOString() };
  at &&
    e.elements.routine_step_id &&
    (s.routine_step_id = e.elements.routine_step_id.value || null);
  const { error: i } = await O.from("daily_meds").update(s).eq("id", r);
  if (i) {
    alert(ie(i) ? "Connect to edit boosters." : i.message);
    return;
  }
  (await Hr(), K(), en());
}
async function Ay(t, e) {
  if (!at) return;
  const r = _e.find((o) => o.id === t);
  if (!r) return;
  const n = r.routine_step_id || null,
    s = e || null;
  if (n === s) return;
  ((r.routine_step_id = s), K());
  const { error: i } = await O.from("daily_meds")
    .update({ routine_step_id: s, updated_at: new Date().toISOString() })
    .eq("id", t);
  i &&
    ((r.routine_step_id = n),
    K(),
    en(),
    window.setTimeout(() => alert(ie(i) ? "OFFLINE." : "COULD NOT SAVE."), 0));
}
async function Oy(t) {
  const e = _e.find((s) => s.id === t);
  if (!e || !confirm(`Delete "${e.name}"?`)) return;
  const { error: r } = await O.from("daily_meds").delete().eq("id", t);
  if (r) {
    alert(ie(r) ? "Connect to edit boosters." : r.message);
    return;
  }
  ke = ke.filter((s) => s !== t);
  const n = J();
  (Object.keys(n.medToggles).forEach((s) => {
    n.medToggles[s]?.med_id === t && delete n.medToggles[s];
  }),
    we(n),
    await Hr(),
    K(),
    en());
}
function Go() {
  if (!De) return "";
  const draft = baCaptureValue();
  return `<section class="day-capture-card ba-capture" aria-label="Add a power action">
    <form id="add-power-todo">
      <div class="ba-capture-line"><label class="sr-only" for="power-todo-title">Power action</label><input id="power-todo-title" name="title" type="text" maxlength="${Bn}" required placeholder="Add a power action…" value="${T(draft.title)}" autocomplete="off"><button type="submit" class="day-capture-button" aria-label="Add power action">+</button></div>
      <details class="ba-capture-schedule"><summary id="ba-capture-date-summary">${baIcon("calendar")}<span>${draft.date ? T(baDateLabel(draft.date)) : "Assign a day"}<span class="ba-optional">${draft.date ? "" : " · optional"}</span></span></summary>
        <div class="ba-week-choices">${baDateChoices("data-capture-date", draft.date)}</div>
        <div class="ba-custom-date"><label for="power-todo-date">Choose a date</label><input id="power-todo-date" name="action_date" type="date" min="${U()}" value="${draft.date}"><button type="button" class="text-button" id="clear-capture-date">No day</button></div>
      </details>
    </form><div id="power-todos-status" class="micro-status day-capture-status" aria-live="polite"></div>
  </section>`;
}
function Rl(t) {
  t?.querySelectorAll("[data-reorder-number]").forEach((e, r) => {
    e.textContent = String(r + 1);
  });
}
function ku({
  listSelector: t,
  rowSelector: e,
  handleSelector: r,
  keyName: n,
  onCommit: s,
}) {
  const i = document.querySelector(t);
  if (!i) return;
  const o = () => [...i.querySelectorAll(e)],
    a = () => {
      Rl(i);
      const l = o()
        .map((c) => c.dataset[n])
        .filter(Boolean);
      s(l);
    };
  i.querySelectorAll(r).forEach((l) => {
    const c = l.closest(e);
    c &&
      (l.addEventListener("keydown", (u) => {
        if (!["ArrowUp", "ArrowDown"].includes(u.key)) return;
        u.preventDefault();
        const d = o(),
          f = d.indexOf(c),
          h = u.key === "ArrowUp" ? f - 1 : f + 1;
        h < 0 ||
          h >= d.length ||
          (u.key === "ArrowUp"
            ? i.insertBefore(c, d[h])
            : i.insertBefore(d[h], c),
          a(),
          l.focus());
      }),
      l.addEventListener("pointerdown", (u) => {
        if (u.pointerType === "mouse" && u.button !== 0) return;
        u.preventDefault();
        const d = o()
            .map((v) => v.dataset[n])
            .join("|"),
          f = u.pointerId;
        (c.classList.add("is-dragging"), i.classList.add("is-reordering"));
        try {
          l.setPointerCapture?.(f);
        } catch {}
        const h = (v) => {
            if (v.pointerId !== f) return;
            v.preventDefault();
            const _ = v.clientY,
              g = o()
                .filter((m) => m !== c)
                .find((m) => {
                  const k = m.getBoundingClientRect();
                  return _ < k.top + k.height / 2;
                });
            (g ? i.insertBefore(c, g) : i.appendChild(c),
              Rl(i),
              _ < 72
                ? window.scrollBy(0, -10)
                : _ > window.innerHeight - 72 && window.scrollBy(0, 10));
          },
          y = (v) => {
            if (v.pointerId !== f) return;
            (window.removeEventListener("pointermove", h),
              window.removeEventListener("pointerup", y),
              window.removeEventListener("pointercancel", y));
            try {
              l.releasePointerCapture?.(f);
            } catch {}
            (c.classList.remove("is-dragging"),
              i.classList.remove("is-reordering"),
              o()
                .map((R) => R.dataset[n])
                .join("|") !== d && a());
          };
        (window.addEventListener("pointermove", h, { passive: !1 }),
          window.addEventListener("pointerup", y),
          window.addEventListener("pointercancel", y));
      }));
  });
}
function Ry(t) {
  const e = z(),
    r = new Set(Ue(e));
  ((e.stack_order = t.filter((n) => r.has(n))), (e.is_complete = !1), Ve(e));
}
function $y() {
  ku({
    listSelector: "#today-order-list",
    rowSelector: "[data-stack-row]",
    handleSelector: "[data-stack-drag]",
    keyName: "stackRow",
    onCommit: Ry,
  });
}
async function Eu(title, date = "") {
  if (!I || !De)
    return {
      error: new Error(
        "Power Actions could not load. Reconnect and try again.",
      ),
    };
  const clean = String(title || "")
    .trim()
    .slice(0, Bn);
  if (!clean) return { error: new Error("Write an action first.") };
  const now = new Date().toISOString(),
    todo = {
      id: crypto.randomUUID(),
      title: clean,
      sort_order:
        Math.max(0, ...Y.map((row) => Number(row.sort_order) || 0)) + 1,
      completed_at: null,
      created_at: now,
      updated_at: now,
    };
  if (date && (!baValidDate(date) || date < U()))
    return { error: new Error("Choose today or a future day.") };
  const pending = baPutTodo(todo),
    plans = [...de];
  if (date) {
    const plan = {
      id: crypto.randomUUID(),
      todo_id: todo.id,
      action_date: date,
      status: "pending",
      sort_order:
        Math.max(
          0,
          ...de
            .filter((row) => row.action_date === date)
            .map((row) => Number(row.sort_order) || 0),
        ) + 1,
      started_at: null,
      created_at: now,
      updated_at: now,
    };
    plans.push(plan);
    pending.powerPlanWrites[plan.id] = {
      ...plan,
      operation: "upsert",
      plan_id: plan.id,
      todo_title: todo.title,
    };
  }
  if (!baCommitPowerState(pending, [...Y, ...baActionArchive, todo], plans))
    return {
      error: new Error(
        "Your device could not save this action. Your text is still here.",
      ),
    };
  if (date === U()) {
    const progress = z();
    progress.day_mode = si;
    progress.stack_order = Ue(progress);
    progress.is_complete = false;
    Ve(progress);
  }
  return { data: todo };
}
function xy() {
  if (document.querySelector("#runner-capture-sheet")) return;
  const screen = document.querySelector(".day-runner-screen");
  if (!screen) return;
  const returnFocus = document.activeElement;
  const draftKey = baCaptureDraftKey();
  const dialog = document.createElement("dialog");
  dialog.id = "runner-capture-sheet";
  dialog.className = "runner-capture-sheet capture-accessible";
  dialog.setAttribute("aria-labelledby", "runner-capture-title");
  dialog.setAttribute("aria-describedby", "runner-capture-help");
  dialog.setAttribute("aria-modal", "true");
  dialog.innerHTML = `
    <form id="runner-capture-form" class="runner-capture-form">
      <h2 id="runner-capture-title" class="runner-capture-title">Save a power action</h2>
      <p id="runner-capture-help" class="runner-capture-help">Get it out of your head. Your place stays here.</p>
      <label class="sr-only" for="runner-capture-input">Power action</label>
      <input id="runner-capture-input" name="title" type="text" maxlength="${Bn}" required placeholder="What needs doing?" autocomplete="off" />
      <div class="runner-capture-actions">
        <button type="button" class="secondary-button" id="runner-capture-cancel">Close</button>
        <button type="submit" class="primary-button" id="runner-capture-save">Save</button>
      </div>
      <div id="runner-capture-status" class="micro-status" role="status" aria-live="polite"></div>
    </form>`;
  screen.appendChild(dialog);
  const input = dialog.querySelector("#runner-capture-input");
  const save = dialog.querySelector("#runner-capture-save");
  const status = dialog.querySelector("#runner-capture-status");
  input.value = baReadCaptureDraft(draftKey);
  let saving = false;
  let closed = false;
  const fallbackSiblings = [];
  const viewport = window.visualViewport;
  const fitViewport = () => {
    dialog.style.height = `${viewport?.height || window.innerHeight}px`;
    dialog.style.top = `${viewport?.offsetTop || 0}px`;
  };
  viewport?.addEventListener("resize", fitViewport);
  viewport?.addEventListener("scroll", fitViewport);
  const close = () => {
    if (closed) return;
    closed = true;
    if (!saving) baWriteCaptureDraft(draftKey, input.value);
    if (dialog.open && typeof dialog.close === "function") dialog.close();
    dialog.remove();
    viewport?.removeEventListener("resize", fitViewport);
    viewport?.removeEventListener("scroll", fitViewport);
    for (const [node, wasInert] of fallbackSiblings) node.inert = wasInert;
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
  };
  input.addEventListener("input", () =>
    baWriteCaptureDraft(draftKey, input.value),
  );
  dialog
    .querySelector("#runner-capture-cancel")
    .addEventListener("click", close);
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    close();
  });
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== "Tab") return;
    const controls = [
      ...dialog.querySelectorAll("button, input, textarea, select, [tabindex]"),
    ].filter(
      (node) =>
        !node.disabled && node.tabIndex >= 0 && node.getClientRects().length,
    );
    if (!controls.length) {
      event.preventDefault();
      return;
    }
    const first = controls[0],
      last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  dialog
    .querySelector("#runner-capture-form")
    .addEventListener("submit", async (event) => {
      event.preventDefault();
      if (saving || !input.value.trim()) return;
      const text = input.value;
      saving = true;
      save.disabled = true;
      input.disabled = true;
      status.textContent = "Saving…";
      baWriteCaptureDraft(draftKey, text);
      try {
        const result = await Eu(text);
        if (result.error) throw result.error;
        if (baReadCaptureDraft(draftKey) === text)
          baWriteCaptureDraft(draftKey, "");
        input.value = "";
        saving = false;
        close();
      } catch (error) {
        status.textContent = ie(error)
          ? "Could not save yet. Your draft is kept here. Try again when connected."
          : error.message || "Could not save. Your draft is still here.";
        saving = false;
        save.disabled = false;
        input.disabled = false;
        if (!closed) input.focus();
      }
    });
  if (typeof dialog.showModal === "function") dialog.showModal();
  else {
    dialog.setAttribute("open", "");
    dialog.setAttribute("role", "dialog");
    for (const node of screen.children) {
      if (node === dialog) continue;
      fallbackSiblings.push([node, node.inert]);
      node.inert = true;
    }
  }
  fitViewport();
  input.focus({ preventScroll: true });
}
function _i() {
  const bind = (selector, type, handler) =>
    document.querySelectorAll(selector).forEach((el) => {
      const key = "baBound" + type;
      if (el.dataset[key]) return;
      el.dataset[key] = "1";
      el.addEventListener(type, handler);
    });
  bind("#add-power-todo", "submit", Py);
  bind("#power-todo-title", "input", baCaptureSave);
  bind("#power-todo-date", "change", () => {
    baCaptureSave();
    baUpdateCaptureDate();
  });
  bind("[data-capture-date]", "click", (event) => {
    document.querySelector("#power-todo-date").value =
      event.currentTarget.dataset.captureDate;
    baCaptureSave();
    baUpdateCaptureDate();
    document.querySelector(".ba-capture-schedule").open = false;
  });
  bind("#clear-capture-date", "click", () => {
    document.querySelector("#power-todo-date").value = "";
    baCaptureSave();
    baUpdateCaptureDate();
    document.querySelector(".ba-capture-schedule").open = false;
  });
  bind("[data-power-today]", "click", (event) =>
    Tu(event.currentTarget.dataset.powerToday),
  );
  bind("[data-power-todo-edit]", "submit", Cy);
  bind("[data-power-todo-delete]", "click", (event) =>
    Iy(event.currentTarget.dataset.powerTodoDelete),
  );
  bind("[data-power-schedule]", "click", (event) =>
    baOpenSchedule(event.currentTarget.dataset.powerSchedule),
  );
  bind("[data-power-complete]", "click", (event) =>
    baCompleteTodo(event.currentTarget.dataset.powerComplete),
  );
  bind("[data-power-restore]", "click", (event) => {
    baRestoreTodo(
      baActionArchive.find(
        (row) => row.id === event.currentTarget.dataset.powerRestore,
      ),
    );
    baRenderCurrent();
    baToast("Action restored");
  });
}
function In(view = G) {
  if (view === "day-plan") zr();
  else if (view === "day-inbox") Au();
  else if (view === "day-power") Ln();
  else if (view === "day-preview") Vo();
  else ee("", { forceOverview: true });
}
async function Py(event) {
  event.preventDefault();
  const form = event.currentTarget,
    button = form.querySelector('[type="submit"]');
  if (button.disabled) return;
  const title = form.elements.title.value,
    date = form.elements.action_date?.value || "";
  if (date && (!baValidDate(date) || date < U())) {
    form.elements.action_date.setCustomValidity(
      "Choose today or a future day.",
    );
    form.elements.action_date.reportValidity();
    form.elements.action_date.setCustomValidity("");
    return;
  }
  if (!title.trim()) return;
  button.disabled = true;
  const assigned = date || (G === "day-power" ? U() : "");
  const result = await Eu(title, assigned);
  if (result.error) {
    button.disabled = false;
    document.querySelector("#power-todos-status").textContent =
      result.error.message;
    return;
  }
  Kn(baCaptureKey(), { title: "", date: "" });
  In();
  const status = document.querySelector("#power-todos-status");
  if (status)
    status.textContent = assigned
      ? `Added for ${baDateLabel(assigned)}.`
      : "Added to Power Actions.";
  document.querySelector("#power-todo-title")?.focus({ preventScroll: true });
}
async function Tu(todoId) {
  const plan = baAssignedPlan(todoId);
  baAssignDate(todoId, plan?.action_date === U() ? "" : U());
}
async function Cy(event) {
  event.preventDefault();
  const form = event.currentTarget,
    todo = It(form.dataset.powerTodoEdit);
  if (!todo) return;
  const title = form.elements.title.value.trim().slice(0, Bn);
  if (!title) return;
  const updated = { ...todo, title, updated_at: new Date().toISOString() },
    pending = baPutTodo(updated);
  if (
    baCommitPowerState(
      pending,
      [...Y.filter((row) => row.id !== todo.id), ...baActionArchive, updated],
      de,
    )
  ) {
    In();
    baToast("Action saved");
  }
}
async function Iy(todoId) {
  const todo = It(todoId);
  if (!todo || !confirm(`Delete “${todo.title}”?`)) return;
  const pending = J();
  pending.powerTodoWrites[todoId] = {
    operation: "delete",
    updated_at: new Date().toISOString(),
  };
  for (const [id, item] of Object.entries(pending.powerPlanWrites))
    if (item.todo_id === todoId) delete pending.powerPlanWrites[id];
  if (
    baCommitPowerState(
      pending,
      [...Y.filter((row) => row.id !== todoId), ...baActionArchive],
      de.filter((row) => row.todo_id !== todoId),
    )
  ) {
    In();
    baToast("Action deleted");
  }
}
function Ly() {
  if (!ct || !_e.length) return "";
  const t = _e.filter((s) => !s.routine_step_id);
  if (!t.length) return "";
  const e = jo(),
    r = t.filter((s) => !e.has(s.id)).length,
    n = t
      .map((s) => {
        const i = e.has(s.id);
        return `
      <button type="button" class="day-med-quick-row ${i ? "is-taken" : ""}" data-daily-med-toggle="${s.id}" aria-pressed="${i ? "true" : "false"}">
        <span class="day-med-quick-check" aria-hidden="true">${i ? "✓" : ""}</span>
        <span class="day-med-quick-copy"><strong>${T(s.name)}</strong></span>
      </button>`;
      })
      .join("");
  return `
    <section class="day-med-quick-card day-anytime-boosters" aria-label="Anytime boosters">
      <div class="day-compact-head"><strong>ANYTIME</strong><span>${r ? `${r} LEFT` : "CLEAR ✓"}</span></div>
      <div class="day-med-quick-list">${n}</div>
    </section>`;
}
function Dy() {
  if (!ct)
    return `
      <section class="day-setup-section">
        <div class="daily-editor-empty">SUPABASE UPDATE REQUIRED.</div>
      </section>`;
  const t = _e
    .map(
      (e) => `
    <div class="booster-row">
      <strong class="booster-name">${T(e.name)}</strong>
      ${at ? `<select class="booster-anchor-select" data-booster-anchor="${e.id}" aria-label="Activity for ${T(e.name)}">${El(e.routine_step_id)}</select>` : ""}
      <details class="booster-more">
        <summary aria-label="Edit ${T(e.name)}">•••</summary>
        <form class="booster-edit-sheet" data-daily-med-edit="${e.id}">
          <input name="name" type="text" maxlength="${Ns}" required value="${T(e.name)}" aria-label="Booster name" />
          <div class="booster-edit-actions">
            <button type="submit" class="small-button">SAVE</button>
            <button type="button" class="text-button danger-text" data-daily-med-delete="${e.id}">DELETE</button>
          </div>
        </form>
      </details>
    </div>`,
    )
    .join("");
  return `
    <section class="day-setup-section booster-setup-section">
      ${at ? "" : '<div class="notice info">SUPABASE UPDATE REQUIRED.</div>'}
      <form id="add-daily-med" class="booster-add-form">
        <input id="daily-med-name" type="text" maxlength="${Ns}" required placeholder="Booster" aria-label="Booster name" />
        ${at ? `<select id="daily-med-routine-step" aria-label="Activity">${El("")}</select>` : ""}
        <button type="submit" class="primary-button">ADD</button>
      </form>
      ${t ? `<div class="booster-list">${t}</div>` : '<div class="daily-editor-empty">—</div>'}
      <div id="daily-meds-status" class="status-line" aria-live="polite"></div>
    </section>`;
}
function us(t, e, r = "") {
  return `<button type="button" class="day-command-button" id="${t}"><strong>${T(e)}</strong>${r !== "" ? `<span>${T(String(r))}</span>` : ""}</button>`;
}
function Uy() {
  const t = _r();
  return t.length
    ? `<div class="day-plan-list" id="today-order-list">${t
        .map(
          (e, r) => `
    <div class="day-plan-row ${e.type === "todo" ? "is-todo" : ""}" data-stack-row="${T(e.key)}">
      <span class="day-plan-number" data-reorder-number>${r + 1}</span>
      <span class="day-plan-copy">
        <strong>${T(e.title)}</strong>
        <small>${e.type === "todo" ? "POWER" : "RITUAL"}</small>
      </span>
      <span class="day-plan-controls">
        ${e.type === "todo" ? `<button type="button" class="is-remove" data-power-today="${e.id}" aria-label="Remove ${T(e.title)} from today">×</button>` : ""}
        <button type="button" class="day-reorder-handle" data-stack-drag aria-label="Reorder ${T(e.title)}">≡</button>
      </span>
    </div>`,
        )
        .join("")}</div>`
    : '<div class="day-plan-empty">—</div>';
}
function zr() {
  const progress = z();
  progress.stack_order = Ue(progress);
  re(
    `<div class="day-subview-top"><button type="button" class="day-subview-back" id="back-day-home">‹ Momentum</button></div><div class="ba-page-heading"><div><div class="today-label">${T(baDateLabel(U()))}</div><h2>Today's order</h2></div></div><p class="ba-helper">Drag a handle to reorder. With a keyboard, focus the handle and use ↑ or ↓.</p><section class="day-plan-card">${Uy()}</section><button type="button" class="secondary-button full-button" id="edit-power-mode">Choose today's power actions</button>${fi(progress) ? '<p class="ba-helper">Routines only today. Your power actions are still saved.</p>' : ""}<button type="button" class="day-primary-footer" id="plan-start-day" ${Gn(progress) ? "" : "disabled"}>${progress.started_at ? "Continue" : "Start next"} <span aria-hidden="true">→</span></button>`,
    {
      title: "Today's order",
      showAccount: false,
      showTimer: false,
      showHeader: false,
      navTab: "day",
      view: "day-plan",
    },
  );
  document
    .querySelector("#back-day-home")
    .addEventListener("click", () => ee("", { forceOverview: true }));
  document.querySelector("#edit-power-mode").addEventListener("click", Ln);
  document.querySelector("#plan-start-day").addEventListener("click", su);
  $y();
  _i();
}
function Ln() {
  const selected = new Set(Jt().map((row) => row.todo_id));
  re(
    `<div class="day-subview-top"><button type="button" class="day-subview-back" id="back-power-day">‹ Momentum</button></div><div class="ba-page-heading"><h2>Today's actions</h2><span class="ba-count">${selected.size}</span></div><p class="ba-helper">Choose what fits today. One action is enough.</p><section class="power-gate-list" aria-label="Today's power actions">${
      [...Y]
        .sort((a, b) => Number(selected.has(b.id)) - Number(selected.has(a.id)))
        .map(
          (todo) =>
            `<button type="button" class="power-gate-row ${selected.has(todo.id) ? "is-selected" : ""}" data-power-today="${todo.id}" aria-pressed="${selected.has(todo.id)}"><span class="power-gate-number">${selected.has(todo.id) ? "✓" : "+"}</span><span><strong>${T(todo.title)}</strong>${!selected.has(todo.id) && baAssignedPlan(todo.id) ? `<small class="ba-helper">${T(baDateLabel(baAssignedPlan(todo.id).action_date))}</small>` : ""}</span></button>`,
        )
        .join("") || '<p class="ba-empty">Add your first action below.</p>'
    }</section>${Go()}<button type="button" class="primary-button full-button" id="confirm-power-actions">Use this plan</button><button type="button" class="text-button full-button" id="sleeping-tiger-day">Routines only today</button>`,
    {
      title: "Today's actions",
      showHeader: false,
      showAccount: false,
      showTimer: false,
      navTab: "day",
      view: "day-power",
    },
  );
  document
    .querySelector("#back-power-day")
    .addEventListener("click", () => ee("", { forceOverview: true }));
  document
    .querySelector("#confirm-power-actions")
    .addEventListener("click", Ug);
  document.querySelector("#sleeping-tiger-day").addEventListener("click", jg);
  _i();
}
function $l() {
  if (Gn() > 0) su();
  else {
    Au();
    document.querySelector("#power-todo-title")?.focus();
  }
}
function jy() {
  ee("", { forceOverview: true });
}
function mo(id) {
  return `<button type="button" class="day-eye-button ba-glance-button" id="${id}" aria-label="Day at a glance">${baIcon("eye")}<span>At a glance</span></button>`;
}
function Vo() {
  const progress = z(),
    completed = new Set(progress.completed_step_ids),
    skipped = new Set(progress.skipped_step_ids),
    remaining = _r(progress).filter(
      (item) =>
        item.type === "todo" ||
        (!completed.has(item.id) && !skipped.has(item.id)),
    ),
    boosters = _e.filter((item) => !jo().has(item.id)),
    completedActions = baActionArchive.filter(
      (todo) => pr(new Date(todo.completed_at)) === U(),
    ),
    doneRoutines = Wn().filter((item) => completed.has(item.id)),
    setAside = Wn().filter((item) => skipped.has(item.id));
  const rows = remaining
    .map(
      (item) =>
        `<div class="ba-glance-row"><span class="ba-glance-copy"><strong>${T(item.title)}</strong><small>${item.type === "todo" ? "Power action" : wt(item.step.substeps).length ? `${progress.substep_positions[item.id] || 0} of ${wt(item.step.substeps).length} small steps done` : "Routine"}</small></span><button type="button" class="ba-done-button" data-glance-done="${T(item.key)}" aria-label="Mark ${T(item.title)} done">${baIcon("check")}<span>Done</span></button></div>`,
    )
    .join("");
  re(
    `<div class="day-subview-top"><button type="button" class="day-subview-back" id="back-preview-day">‹ Momentum</button></div><div class="ba-page-heading"><div><div class="today-label">${T(baDateLabel(U()))}</div><h2>At a glance</h2></div><span class="ba-count" aria-label="${remaining.length + boosters.length} items remaining">${remaining.length + boosters.length}</span></div><section class="ba-glance-list" aria-label="Remaining actions">${rows || '<p class="ba-empty">Your planned actions are clear.</p>'}</section>${boosters.length ? `<section class="ba-glance-boosters" aria-label="Remaining boosters"><h3>Boosters</h3>${boosters.map((item) => `<div class="ba-glance-row"><span class="ba-glance-copy"><strong>${T(item.name)}</strong>${item.routine_step_id ? `<small>${T(se.find((row) => row.id === item.routine_step_id)?.title || "")}</small>` : ""}</span><button type="button" class="ba-done-button" data-glance-booster="${item.id}" aria-label="Mark ${T(item.name)} done">${baIcon("check")}<span>Done</span></button></div>`).join("")}</section>` : ""}
    ${
      doneRoutines.length || completedActions.length || jo().size
        ? `<details class="ba-completed-list"><summary>Completed today <span>${doneRoutines.length + completedActions.length + jo().size}</span></summary>${doneRoutines.map((item) => `<div class="ba-completed-row"><span>${T(item.title)}</span><button type="button" class="text-button" data-restore-routine="${item.id}" aria-label="Undo ${T(item.title)}">Undo</button></div>`).join("")}${completedActions.map((item) => `<div class="ba-completed-row"><span>${T(item.title)}</span><button type="button" class="text-button" data-power-restore="${item.id}" aria-label="Undo ${T(item.title)}">Undo</button></div>`).join("")}${_e
            .filter((item) => jo().has(item.id))
            .map(
              (item) =>
                `<div class="ba-completed-row"><span>${T(item.name)}</span><button type="button" class="text-button" data-glance-booster="${item.id}" aria-label="Undo ${T(item.name)}">Undo</button></div>`,
            )
            .join("")}</details>`
        : ""
    }
    ${setAside.length ? `<details class="ba-completed-list"><summary>Set aside <span>${setAside.length}</span></summary>${setAside.map((item) => `<div class="ba-completed-row"><span>${T(item.title)}</span><button type="button" class="text-button" data-restore-routine="${item.id}">Bring back</button></div>`).join("")}</details>` : ""}`,
    {
      title: "At a glance",
      showHeader: false,
      showAccount: false,
      showTimer: false,
      navTab: "day",
      view: "day-preview",
    },
  );
  document.querySelector("#back-preview-day").addEventListener("click", jy);
  document.querySelectorAll("[data-glance-done]").forEach((button) =>
    button.addEventListener("click", () => {
      Ny([button.dataset.glanceDone]);
      document
        .querySelector(
          "[data-glance-done],[data-glance-booster],#back-preview-day",
        )
        ?.focus({ preventScroll: true });
    }),
  );
  document.querySelectorAll("[data-restore-routine]").forEach((button) =>
    button.addEventListener("click", () => {
      baRestoreRoutine(button.dataset.restoreRoutine);
      Vo();
    }),
  );
  document.querySelectorAll("[data-glance-booster]").forEach((button) =>
    button.addEventListener("click", () => {
      Wg(button.dataset.glanceBooster);
      Vo();
    }),
  );
  _i();
}
function Ny(keys) {
  for (const key of keys) {
    const [type, id] = String(key).split(":", 2);
    if (type === "todo") {
      baCompleteTodo(id, false);
      continue;
    }
    if (type !== "routine") continue;
    const step = se.find((row) => row.id === id);
    if (!step) continue;
    const progress = z(),
      old = {
        completed: progress.completed_step_ids.includes(id),
        skipped: progress.skipped_step_ids.includes(id),
        position: progress.substep_positions[id] || 0,
      };
    if (old.completed) continue;
    progress.completed_step_ids = [
      ...new Set([...progress.completed_step_ids, id]),
    ];
    progress.skipped_step_ids = progress.skipped_step_ids.filter(
      (value) => value !== id,
    );
    progress.later_step_ids = progress.later_step_ids.filter(
      (value) => value !== id,
    );
    progress.substep_positions = {
      ...progress.substep_positions,
      [id]: wt(step.substeps).length,
    };
    progress.is_complete = Gn(progress) === 0;
    if (!Ve(progress)) return;
    baToast("Routine done", () => {
      baRestoreRoutine(id, old);
      baRenderCurrent();
    });
  }
  K();
  Vo();
}
function Au() {
  const archive = [...baActionArchive].sort((a, b) =>
    String(b.completed_at).localeCompare(String(a.completed_at)),
  );
  re(
    `<div class="day-subview-top"><button type="button" class="day-subview-back" id="back-day-home">‹ Momentum</button></div><div class="ba-page-heading"><div><div class="today-label">A place for everything</div><h2>Power Actions</h2></div><span class="ba-count">${Y.length}</span></div>${Go()}
    <div class="ba-action-tools">${Y.length > 5 ? `<label class="sr-only" for="ba-action-search">Find a power action</label><input id="ba-action-search" type="search" placeholder="Find an action" value="${T(baActionSearch)}">` : ""}<div class="ba-filter-bar" role="group" aria-label="Filter power actions">${[
      ["all", "All"],
      ["today", "Today"],
      ["planned", "Planned"],
      ["unscheduled", "No day"],
    ]
      .map(
        ([value, label]) =>
          `<button type="button" data-action-filter="${value}" aria-pressed="${baActionFilter === value}" class="${baActionFilter === value ? "is-selected" : ""}">${label}</button>`,
      )
      .join("")}</div></div>
    <section id="ba-action-list" aria-label="Open power actions">${baActionRows()}</section>
    ${archive.length ? `<details class="ba-completed-list"><summary>Completed <span>${archive.length}</span></summary>${archive.map((todo) => `<div class="ba-completed-row"><span>${T(todo.title)}</span><button type="button" class="text-button" data-power-restore="${todo.id}" aria-label="Restore ${T(todo.title)}">Restore</button></div>`).join("")}</details>` : ""}`,
    {
      title: "Power Actions",
      showHeader: false,
      showAccount: false,
      showTimer: false,
      navTab: "day",
      view: "day-inbox",
    },
  );
  document
    .querySelector("#back-day-home")
    .addEventListener("click", () => ee("", { forceOverview: true }));
  const update = () => {
    document.querySelector("#ba-action-list").innerHTML = baActionRows();
    _i();
  };
  document
    .querySelector("#ba-action-search")
    ?.addEventListener("input", (event) => {
      baActionSearch = event.target.value;
      update();
    });
  document.querySelectorAll("[data-action-filter]").forEach((button) =>
    button.addEventListener("click", () => {
      baActionFilter = button.dataset.actionFilter;
      document.querySelectorAll("[data-action-filter]").forEach((el) => {
        const selected = el === button;
        el.classList.toggle("is-selected", selected);
        el.setAttribute("aria-pressed", String(selected));
      });
      update();
    }),
  );
  _i();
}
function Vt() {
  re(
    `<div class="day-subview-top"><button type="button" class="day-subview-back" id="back-day-setup">‹ Momentum</button></div><div class="ba-page-heading"><h2>Repetition</h2></div><p class="ba-helper">Choose a weekday. These routines return each week.</p>${_y()}`,
    {
      title: "Repetition",
      showAccount: false,
      showTimer: false,
      showHeader: false,
      navTab: "day",
      view: "day-routine-setup",
    },
  );
  document
    .querySelector("#back-day-setup")
    .addEventListener("click", () => ee("", { forceOverview: true }));
  ky();
}
function en() {
  re(
    `<div class="day-subview-top"><button type="button" class="day-subview-back" id="back-day-setup">‹ Momentum</button></div><div class="ba-page-heading"><h2>Boosters</h2></div>${Dy()}`,
    {
      title: "Boosters",
      showAccount: false,
      showTimer: false,
      showHeader: false,
      navTab: "day",
      view: "day-booster-setup",
    },
  );
  document
    .querySelector("#back-day-setup")
    .addEventListener("click", () => ee("", { forceOverview: true }));
  Ho();
}
function Ou() {
  const t = z();
  ((t.is_complete = !0), Ve(t), Js(), Ks(), ci(null), qy());
}
function qy() {
  const t = fe.filter((i) => i?.signedUrl && !Mn(i.video_path));
  if (!t.length) {
    ee("", { forceOverview: !0 });
    return;
  }
  const e = t[Math.floor(Math.random() * t.length)];
  ((Re += 1),
    (G = "day-finale"),
    document.documentElement.classList.remove("day-runner-active"),
    document.body.classList.remove("day-runner-active"),
    (ot.innerHTML = `
    <main class="day-finale-screen" aria-label="Day complete">
      <video id="day-finale-video" playsinline webkit-playsinline preload="auto"></video>
    </main>`));
  const r = document.querySelector("#day-finale-video"),
    n = () => ee("", { forceOverview: !0 });
  ((r.src = e.signedUrl),
    (r.muted = !wi()),
    r.addEventListener("ended", n, { once: !0 }),
    r.addEventListener("error", n, { once: !0 }),
    r.play()?.catch?.(() => {
      ((r.muted = !0), r.play()?.catch?.(n));
    }),
    ar && window.requestAnimationFrame(Dc));
}
function ee(message = "", options = {}) {
  B = null;
  F = [];
  oe = false;
  Ie = false;
  const progress = z();
  progress.stack_order = Ue(progress);
  const next = Qc(progress),
    count = Gn(progress),
    done =
      progress.completed_step_ids.length +
      baActionArchive.filter((todo) => pr(new Date(todo.completed_at)) === U())
        .length;
  re(
    `${typeof message === "string" && message ? `<div class="notice error">${T(message)}</div>` : ""}${!$t ? '<div class="notice error">Your routines could not load. Reconnect and reload to try again.</div>' : ""}
    <section class="day-home-hero ba-momentum-hero"><div class="day-hero-line"><div><div class="today-label">${T(baDateLabel(U()))}</div><div class="ba-now">Now <time data-ba-clock></time></div></div>${mo("preview-day")}</div><h2>Momentum</h2>
      ${next ? `<p class="ba-next-label">Your next step</p><p class="ba-next-title">${T(next.title)}</p><div class="ba-momentum-meta"><span>${count} ${count === 1 ? "step" : "steps"} left</span>${done ? `<span>${done} done</span>` : ""}</div><button type="button" class="start-workout-button day-start-button" id="start-day">${progress.started_at ? "Continue" : "Start next"} <span aria-hidden="true">→</span></button>` : `<p class="ba-next-title">${done ? "Room to breathe." : "A little space to begin."}</p><p class="ba-helper">${done ? "Your planned actions are done." : "Add an action below, then choose Today when you’re ready."}</p>${Y.length ? '<button type="button" class="start-workout-button day-start-button" id="choose-today-actions">Choose an action <span aria-hidden="true">→</span></button>' : ""}`}
      ${fi(progress) && Jt().length ? '<button type="button" class="text-button" id="include-power-actions">Include my power actions</button>' : ""}
    </section>${Go()}${Ly()}<section class="day-command-grid" aria-label="Momentum controls">${us("open-day-inbox", "Power Actions", Y.length)}${us("open-day-plan", "Today's order", _r(progress).length)}${us("open-routine-setup", "Repetition")}${us("open-booster-setup", "Boosters", _e.length)}</section>`,
    {
      title: "Momentum",
      showHeader: false,
      showAccount: false,
      showTimer: false,
      navTab: "day",
      view: "day-overview",
    },
  );
  document.querySelector("#start-day")?.addEventListener("click", su);
  document
    .querySelector("#choose-today-actions")
    ?.addEventListener("click", Ln);
  document.querySelector("#preview-day").addEventListener("click", Vo);
  document.querySelector("#open-day-inbox").addEventListener("click", Au);
  document.querySelector("#open-day-plan").addEventListener("click", zr);
  document.querySelector("#open-routine-setup").addEventListener("click", Vt);
  document.querySelector("#open-booster-setup").addEventListener("click", en);
  document
    .querySelector("#include-power-actions")
    ?.addEventListener("click", () => {
      Dg();
      ee();
    });
  Ho();
  _i();
}
function ze() {
  ci("daily");
  const progress = z();
  progress.stack_order = Ue(progress);
  const current = Qc();
  if (!current) {
    Ou();
    return;
  }
  const left = Gn();
  let content = "",
    primary = "Done",
    gym = null;
  if (current.type === "todo") {
    content = `<div class="day-step-parent">Power action</div><h2>${T(current.title)}</h2>`;
  } else {
    const { step, substeps, substepIndex, title, isSubstep } = current;
    gym = isSubstep ? null : No(step);
    if (gym?.planned.length && gym.remaining.length === 0) {
      if (
        pi(step.id, false, {
          bypassGuard: true,
          rememberUndo: false,
          render: false,
        })
      )
        ze();
      else
        ee(
          "Your workout is complete. Its routine progress could not be saved on this device yet.",
          { forceOverview: true },
        );
      return;
    }
    if (gym) {
      const names = gym.planned.map((folder) => folder.name).join(" + ");
      primary = gym.remaining[0] ? "Start workout" : "Choose workout";
      content = `
        <div class="day-step-parent">Routine · Power Body</div>
        <h2>${T(names || "Power Body")}</h2>
        ${step.note ? `<p>${T(step.note)}</p>` : ""}
        ${Tl(step.id)}
        ${gym.planned.length ? "" : '<p class="day-gym-empty">Choose the workout that fits today.</p>'}`;
    } else {
      content = `
        <div class="day-step-parent">${isSubstep ? `${T(step.title)} <span>${substepIndex + 1} of ${substeps.length}</span>` : "Routine"}</div>
        <h2>${T(title)}</h2>
        ${step.note ? `<p>${T(step.note)}</p>` : ""}
        ${Tl(step.id)}`;
    }
  }
  const completed = Vn(progress);
  const hasOther = _r().some(
    (item) =>
      item.key !== current.key &&
      (item.type === "todo"
        ? item.plan?.status === "pending"
        : !completed.has(item.id)),
  );
  const undo = zg() || Ng();
  re(
    `
    <div class="day-runner-screen">
      <div class="day-runner-top ba-runner-top">
        <div class="ba-runner-meta">
          <div class="ba-runner-clock">Now <time data-ba-clock></time></div>
          <div class="day-runner-position">${left} ${left === 1 ? "step" : "steps"} left</div>
        </div>
        <button type="button" class="ba-runner-home" id="exit-day-runner">‹ Momentum</button>
        <div class="day-runner-tools ba-runner-quick-tools">
          ${mo("runner-preview-day")}
          <button type="button" class="day-runner-capture ba-runner-capture" id="runner-capture" aria-label="Save a power action"><span aria-hidden="true">+</span> Save a thought</button>
        </div>
      </div>
      <section class="day-step-card ${gym ? "day-step-card-gym" : ""} ${current.type === "todo" ? "day-step-card-todo" : ""}" id="day-step-card" aria-label="Current action: ${T(current.title)}">
        ${content}
      </section>
      <div class="day-action-controls" aria-label="Current action controls">
        <div class="day-secondary-actions">
          ${hasOther ? '<button type="button" class="day-option-button" id="later-current-action">Later</button>' : ""}
          <button type="button" class="day-option-button" id="skip-current-action">Skip today</button>
        </div>
        <button type="button" class="day-primary-action" id="primary-current-action">${T(primary)} <span aria-hidden="true">→</span></button>
      </div>
      ${undo}
    </div>`,
    {
      title: "Momentum",
      showAccount: false,
      showTimer: false,
      showHeader: false,
      view: "day-runner",
    },
  );
  const revision = Re;
  const bindCurrent = (selector, handler) => {
    document.querySelector(selector)?.addEventListener("click", (event) => {
      const options = { source: event.currentTarget, renderRevision: revision };
      if (baAcceptActionEvent(options)) handler(options);
    });
  };
  document.querySelector("#runner-preview-day")?.addEventListener("click", Vo);
  document.querySelector("#runner-capture")?.addEventListener("click", xy);
  document
    .querySelector("#exit-day-runner")
    ?.addEventListener("click", () => ee("", { forceOverview: true }));
  if (current.type === "todo") {
    bindCurrent("#primary-current-action", (options) =>
      Bg(current.plan.id, options),
    );
    bindCurrent("#skip-current-action", (options) =>
      Mg(current.plan.id, options),
    );
    bindCurrent("#later-current-action", (options) =>
      Fg(current.plan.id, options),
    );
  } else {
    bindCurrent("#primary-current-action", (options) =>
      Qg(current.step, options),
    );
    bindCurrent("#skip-current-action", (options) =>
      Yg(current.step.id, options),
    );
    bindCurrent("#later-current-action", (options) =>
      Xg(current.step.id, options),
    );
  }
  Kg();
  qg();
  Ho();
}
async function By(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (
    !form?.dataset.repetitionOwner ||
    !/^[0-6]$/.test(form.dataset.repetitionDay || "")
  )
    return;
  const userId = form.dataset.repetitionOwner,
    key = form.dataset.repetitionDay,
    day = Number(key),
    state = repetitionState(userId);
  if (state.pending.has(key)) return;
  const draft = repetitionCapture(form);
  if (!draft || !draft.title.trim()) return;
  const title = draft.title.trim(),
    note = draft.note.trim();
  const lines = draft.substeps
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (title.length > Us || note.length > js) {
    repetitionStatus(
      form,
      `Use up to ${Us} characters for the name and ${js} for the note. Your draft is still here.`,
      true,
    );
    return;
  }
  if (lines.length > Cc || lines.some((line) => line.length > Pc)) {
    repetitionStatus(
      form,
      `Use up to ${Cc} small steps, with ${Pc} characters in each. Your draft is still here.`,
      true,
    );
    return;
  }
  if (!I || I.id !== userId || !$t) {
    repetitionStatus(
      form,
      `Routines can’t be saved right now. ${repetitionDraftMessage(state)}`,
      true,
    );
    return;
  }
  if (navigator.onLine === false) {
    repetitionStatus(
      form,
      `You’re offline. ${repetitionDraftMessage(state)} Add it when you reconnect.`,
      true,
    );
    return;
  }
  try {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        draft.id || "",
      )
    )
      draft.id = crypto.randomUUID();
    repetitionPersist(userId);
    state.pending.add(key);
    repetitionControls(form);
    repetitionStatus(form, "Adding…");
    const saved = await repetitionWrite({
      id: draft.id,
      user_id: userId,
      title,
      note,
      substeps: zc(draft.substeps),
      active_days: [day],
      day_order: { [key]: di(day).length + 1 },
      sort_order:
        Math.max(0, ...se.map((item) => Number(item.sort_order) || 0)) + 1,
      updated_at: new Date().toISOString(),
    });
    delete state.drafts[key];
    repetitionPersist(userId);
    state.pending.delete(key);
    state.notices[key] = `Added to ${wy(day)[2]}.`;
    if (I?.id !== userId) return;
    const row = {
      ...saved,
      active_days: Ot(saved.active_days),
      day_order: Fn(saved.day_order),
      substeps: wt(saved.substeps),
    };
    se = se.some((item) => item.id === row.id)
      ? se.map((item) => (item.id === row.id ? { ...item, ...row } : item))
      : [...se, row];
    K();
    const current = repetitionCurrentForm(userId, key);
    if (current) {
      current.querySelectorAll("input,textarea").forEach((field) => {
        field.value = "";
      });
      Vt();
    }
  } catch (error) {
    const reason = ie(error)
      ? "The connection was interrupted."
      : error?.code === "23505"
        ? "A routine with that name may already exist."
        : "Couldn’t add this routine.";
    repetitionStatus(
      repetitionCurrentForm(userId, key),
      `${reason} ${repetitionDraftMessage(state)} Try again.`,
      true,
    );
  } finally {
    state.pending.delete(key);
    repetitionControls(repetitionCurrentForm(userId, key));
  }
}
async function My(t) {
  t.preventDefault();
  const e = t.currentTarget,
    r = e.dataset.dailyEdit,
    n = e.elements.title.value.trim().slice(0, Us),
    s = e.elements.note.value.trim().slice(0, js),
    i = zc(e.elements.substeps?.value || ""),
    o = Ot(se.find((l) => l.id === r)?.active_days);
  if (!n) return;
  const { error: a } = await O.from("daily_steps")
    .update({
      title: n,
      note: s,
      substeps: i,
      active_days: o,
      updated_at: new Date().toISOString(),
    })
    .eq("id", r);
  if (a) {
    alert(ie(a) ? "OFFLINE." : a.message);
    return;
  }
  (await wr(), K(), Vt());
}
async function Fy(t) {
  const e = se.find((i) => i.id === t);
  if (!e || !confirm(`Delete "${e.title}"?`)) return;
  const { error: r } = await O.from("daily_steps").delete().eq("id", t);
  if (r) {
    alert(ie(r) ? "OFFLINE." : r.message);
    return;
  }
  const n = z();
  ((n.completed_step_ids = n.completed_step_ids.filter((i) => i !== t)),
    (n.skipped_step_ids = (n.skipped_step_ids || []).filter((i) => i !== t)),
    (n.later_step_ids = (n.later_step_ids || []).filter((i) => i !== t)));
  const s = { ...(n.substep_positions || {}) };
  (delete s[t],
    (n.substep_positions = s),
    (n.is_complete = !1),
    Ve(n),
    await wr(),
    K(),
    Vt());
}
function Wy() {
  confirm("Reset today?") && (Ve(Wr(U())), ee("", { forceOverview: !0 }));
}
function Pt(t = "") {
  ((B = null), (F = []), (oe = !1), (Ie = !1));
  const e = j || zt(),
    r = e ? $e.find((d) => d.id === e.folderId) : null,
    n = U(),
    s = He(n),
    i = r ? [] : ou(),
    o = new Set(s.map((d) => d.id)),
    a =
      r && !o.has(r.id)
        ? `
    <button type="button" class="resume-home" id="resume-home">
      <span>RESUME</span>
      <strong>${T(r.name)}</strong>
    </button>`
        : "",
    l = s
      .map((d) => {
        const f = e?.folderId === d.id,
          h = Yt(n, d.id);
        return `
      <div class="today-workout-row">
        <div class="today-workout-name">${T(d.name)}</div>
        <button type="button" class="start-workout-button today-module-start" data-start-today="${d.id}" ${h ? "disabled" : ""}>${h ? "DONE" : f ? "RESUME" : "START"}</button>
      </div>`;
      })
      .join(""),
    c = `
    <section class="today-card">
      <div class="today-label">TODAY</div>
      ${
        s.length
          ? `
        <div class="today-workout-list">${l}</div>
        <button type="button" class="quiet-action" id="preload-today">Save videos offline</button>
        <div id="preload-status" class="micro-status" aria-live="polite"></div>`
          : `
        <div class="today-empty">NO WORKOUT.</div>
        <button type="button" class="secondary-button full-button today-choose" id="choose-workout">CHOOSE</button>`
      }
    </section>`,
    u = i.length
      ? `
    <button type="button" class="missed-card" id="move-missed-today">
      <span>YESTERDAY</span>
      <strong>${T(i.map((d) => d.name).join(" + "))}</strong>
      <small>MOVE →</small>
    </button>`
      : "";
  (re(
    `
    ${t ? `<div class="notice error">${T(t)}</div>` : ""}
    ${Ht ? '<div class="offline-note">OFFLINE</div>' : ""}
    ${a}
    ${c}
    ${u}
    ${Br && Be ? `<section class="week-card"><div class="today-label">Training this week</div>${$u(n, { streak: !0 })}</section>` : ""}
    <div class="ba-body-links"><button type="button" class="ba-body-link" id="open-all-workouts">${baIcon("body")}<span><strong>Workouts</strong><small>Your training library</small></span><span aria-hidden="true">→</span></button><button type="button" class="ba-body-link" id="open-future">${baIcon("calendar")}<span><strong>The Future</strong><small>Plan your training</small></span><span aria-hidden="true">→</span></button></div>`,
    {
      title: "Power Body",
      showAccount: !1,
      showTimer: !1,
      navTab: "gym",
      view: "home",
    },
  ),
    document.querySelectorAll("[data-start-today]").forEach((d) => {
      d.addEventListener("click", () =>
        Ge(d.dataset.startToday, { mode: "workout" }),
      );
    }),
    document
      .querySelector("#resume-home")
      ?.addEventListener("click", () => Ge(r.id, { mode: "workout" })),
    document
      .querySelector("#choose-workout")
      ?.addEventListener("click", () => mr()),
    document
      .querySelector("#open-all-workouts")
      ?.addEventListener("click", () => mr()),
    document
      .querySelector("#open-future")
      ?.addEventListener("click", baOpenFuture),
    document.querySelector("#move-missed-today")?.addEventListener("click", av),
    document
      .querySelector("#preload-today")
      ?.addEventListener("click", () => hv(s)));
}
function mr(t = "") {
  ((B = null), (F = []), (oe = !1), (Ie = !1));
  const e = j || zt(),
    r = $e
      .map(
        (n) => `
    <button type="button" class="folder-card" data-folder-id="${n.id}">
      <span class="folder-name">${T(n.name)}</span>
      ${e?.folderId === n.id ? '<span class="resume-dot">resume</span>' : ""}
    </button>`,
      )
      .join("");
  (re(
    `
    ${t ? `<div class="notice error">${T(t)}</div>` : ""}
    <section class="folder-grid" aria-label="Workouts">${r}</section>
    <details class="add-folder compact-editor">
      <summary>EDIT WORKOUTS</summary>
      <form id="add-folder-form">
        <input id="folder-name" type="text" maxlength="28" required placeholder="Workout" aria-label="Folder name" />
        <button class="primary-button" type="submit">Add</button>
      </form>
      <div id="folder-status" class="status-line inline-status" aria-live="polite"></div>
    </details>`,
    {
      title: "WORKOUTS.",
      showAccount: !1,
      showTimer: !1,
      navTab: "gym",
      view: "workouts",
    },
  ),
    document.querySelectorAll("[data-folder-id]").forEach((n) => {
      n.addEventListener("click", () => Ge(n.dataset.folderId));
    }),
    document.querySelector("#add-folder-form")?.addEventListener("submit", uv));
}
function tn(message = "", notice = "") {
  reflectionCapture();
  B = null;
  F = [];
  oe = false;
  Ie = false;
  const state = reflectionState();
  const entries = reflectionEntries();
  const savedNotice =
    typeof notice === "string" && notice ? notice : state.notice;
  state.notice = "";
  const rows = entries
    .map((entry) => {
      const source = entry.reflectionSource;
      const key = reflectionDraftKey(source, entry.id);
      return `<article class="reflection-entry" data-reflection-note="${T(key)}">
      <div class="reflection-entry-meta">
        ${reflectionDate(entry)}
        <button type="button" class="reflection-edit" data-reflection-edit="${T(entry.id)}" data-reflection-source="${source}" aria-label="${state.drafts[key] ? "Continue editing entry" : "Edit entry"}">${state.drafts[key] ? "Edit draft" : "Edit"}</button>
      </div>
      <p class="reflection-note-body">${T(entry.body || "")}</p>
    </article>`;
    })
    .join("");
  re(
    `
    <section class="reflection-journal" aria-label="Your journal">
      ${typeof message === "string" && message ? `<div class="notice error" role="alert">${T(message)}</div>` : ""}
      ${!Fr ? '<div class="reflection-availability" role="status">Saving is unavailable right now. You can still write a draft.</div>' : ""}
      ${reflectionEditorMarkup(null, "story", savedNotice)}
      ${rows ? `<section class="reflection-entries" aria-label="Saved entries">${rows}</section>` : ""}
    </section>`,
    {
      title: "i changed.",
      showAccount: false,
      showTimer: false,
      navTab: "changed",
      view: "changed",
    },
  );
  reflectionAttach(document.querySelector("[data-reflection-editor]"));
  document.querySelectorAll("[data-reflection-edit]").forEach((button) => {
    button.addEventListener("click", () =>
      xl(button.dataset.reflectionEdit, button.dataset.reflectionSource),
    );
  });
}
function xl(id = null, source = "board") {
  reflectionCapture();
  if (!id) {
    tn();
    document.querySelector("#changed-story-body")?.focus();
    return;
  }
  const collection = source === "board" ? We : Qe;
  const entry = collection.find((item) => item.id === id);
  if (!entry) {
    tn("This entry is no longer available.");
    return;
  }
  re(
    `
    <section class="reflection-journal" aria-label="Edit journal entry">
      <button type="button" class="back-button reflection-back" id="back-changed">‹ i changed.</button>
      ${reflectionEditorMarkup(entry, source)}
    </section>`,
    {
      title: "i changed.",
      showAccount: false,
      showTimer: false,
      navTab: "changed",
      view: "changed-entry",
    },
  );
  const form = document.querySelector("[data-reflection-editor]");
  reflectionAttach(form, entry.body || "");
  document
    .querySelector("#back-changed")
    ?.addEventListener("click", () => tn());
  form
    ?.querySelector("[data-reflection-delete]")
    ?.addEventListener("click", () => (source === "board" ? Gy(id) : Ky(id)));
  form?.querySelector("textarea")?.focus({ preventScroll: true });
}
async function Hy(event) {
  return reflectionSave(event);
}
async function Gy(id) {
  return reflectionDelete("board", id);
}
function Dn() {
  tn();
}
async function Vy(event) {
  return reflectionSave(event);
}
async function zy(event) {
  return reflectionSave(event);
}
async function Ky(id) {
  return reflectionDelete("story", id);
}
function Un(message = "") {
  B = null;
  F = [];
  oe = false;
  Ie = false;
  re(
    `${typeof message === "string" && message ? `<div class="notice error">${T(message)}</div>` : ""}${vy()}<section class="more-card ba-more-card"><button type="button" class="secondary-button full-button" id="theme-toggle">${Gs() === "dark" ? "Switch to light mode" : "Switch to dark mode"}</button><button type="button" class="secondary-button full-button" id="backup-library">Download backup</button><div id="backup-status" class="status-line backup-status" aria-live="polite"></div><div class="ba-sync-card"><strong>Your data</strong><p id="ba-sync-detail" class="ba-helper"></p><button type="button" class="text-button" id="ba-retry-sync">Sync now</button></div><button type="button" class="secondary-button full-button" id="sign-out">Sign out</button><div class="app-version">battle angel v${og}</div></section>`,
    { title: "More", showAccount: false, showTimer: false, navTab: "more" },
  );
  document.querySelector("#theme-toggle").addEventListener("click", () => {
    Uc();
    Un();
  });
  document.querySelector("#backup-library").addEventListener("click", cu);
  document.querySelector("#sign-out").addEventListener("click", baSignOut);
  document
    .querySelector("#ba-retry-sync")
    .addEventListener("click", async (event) => {
      const button = event.currentTarget;
      button.disabled = true;
      await Lt();
      baUpdateSyncStatus();
      button.disabled = false;
    });
  document.querySelector("#motivation-videos")?.addEventListener("change", kv);
  document
    .querySelectorAll("[data-remove-motivation]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        Ev(button.dataset.removeMotivation, button.dataset.motivationPath),
      ),
    );
  baUpdateSyncStatus();
}
function Jy(t) {
  return t.length
    ? `${t
        .slice(0, 2)
        .map((r) => r.name)
        .join(" · ")}${t.length > 2 ? ` +${t.length - 2}` : ""}`
    : "";
}
function zo(t) {
  const e = new Set(
    Fe.filter((r) => r.workout_date === t).map((r) => r.folder_id),
  );
  return $e.filter((r) => e.has(r.id));
}
function Ko(t) {
  const e = He(t),
    r = new Set(e.map((n) => n.id));
  return [...e, ...zo(t).filter((n) => !r.has(n.id))];
}
function Ru(t) {
  let e = 0;
  for (let r = 0; r < 7; r += 1) zo(gt(t, r)).length > 0 && (e += 1);
  return e;
}
function Kr(t) {
  return Ru(t) >= ws;
}
function Yy(t, e) {
  const r = Ko(t),
    n = zo(t).length,
    s = r.length > 0 && n === r.length,
    i = t === U(),
    o = t === X;
  return `
    <button type="button" class="calendar-day ${i ? "is-today" : ""} ${r.length ? "is-planned" : ""} ${s ? "is-done" : ""} ${o ? "is-selected" : ""}" data-plan-date="${t}" aria-label="${T(xn(t))}${r.length ? `: ${T(r.map((a) => a.name).join(", "))}` : ""}${n ? `, ${n} done` : ""}">
      <span class="calendar-number">${e}${n ? '<span class="calendar-done" aria-hidden="true">&#10003;</span>' : ""}</span>
      ${r.length ? `<span class="calendar-workout">${T(Jy(r))}</span>` : ""}
    </button>`;
}
function Xy(t) {
  const e = t.getFullYear(),
    r = t.getMonth(),
    n = (new Date(e, r, 1).getDay() + 6) % 7,
    s = new Date(e, r + 1, 0).getDate(),
    i = [];
  for (let a = 0; a < n; a += 1) i.push(null);
  for (let a = 1; a <= s; a += 1) i.push(a);
  for (; i.length % 7;) i.push(null);
  const o = [];
  for (let a = 0; a < i.length; a += 7) {
    const l = i.slice(a, a + 7),
      c = l.find((h) => h !== null),
      u = Ct(pr(new Date(e, r, c))),
      d = Kr(u),
      f = l
        .map((h) =>
          h === null
            ? '<div class="calendar-blank" aria-hidden="true"></div>'
            : Yy(pr(new Date(e, r, h)), h),
        )
        .join("");
    o.push(
      `<div class="calendar-week ${d ? "is-golden" : ""}"${d ? ' aria-label="Golden week"' : ""}>${f}</div>`,
    );
  }
  return o.join("");
}
function Qy() {
  let t = Ct(U());
  Kr(t) || (t = gt(t, -7));
  let e = 0;
  for (; e < 60 && Kr(t);) ((e += 1), (t = gt(t, -7)));
  return e;
}
function Zy() {
  const t = Qy();
  if (!t) return "";
  const e = Kr(Ct(U()));
  return t === 1
    ? e
      ? ""
      : '<div class="golden-streak">1 WEEK STREAK</div>'
    : `<div class="golden-streak">${t} WEEK STREAK</div>`;
}
function $u(t, e = {}) {
  const r = Ru(Ct(t)),
    n = e.streak ? Zy() : "";
  return r >= ws
    ? `<div class="week-progress is-golden">GOLDEN · ${r}</div>${n}`
    : `<div class="week-progress"><span class="week-pips" aria-hidden="true">${Array.from({ length: ws }, (i, o) => `<span class="week-pip ${o < r ? "filled" : ""}"></span>`).join("")}</span>${r} / ${ws}</div>${n}`;
}
function ev(t) {
  if (t > U()) return "";
  const e = Ko(t);
  return e.length
    ? bi()
      ? `<div class="plan-done-list">${e
          .map((n) => {
            const s = Yt(t, n.id);
            return `
      <div class="plan-done-row">
        <span class="plan-done-name">${T(n.name)}</span>
        <button type="button" class="plan-done-toggle ${s ? "done" : ""}" data-done-folder="${n.id}" aria-pressed="${s}">${s ? "&#10003; DONE" : "DONE"}</button>
      </div>`;
          })
          .join("")}</div>`
      : '<div class="plan-done-empty">SUPABASE UPDATE REQUIRED.</div>'
    : "";
}
function ce(t = "") {
  ((oe = !1), (B = null), (F = []), (Ie = !1), X || (X = U()));
  const e = He(X),
    r = new Set(e.map((l) => l.id)),
    n = qo(X),
    s = gt(X, 1),
    i = $e
      .map(
        (l) => `
    <button type="button" class="plan-muscle-button ${r.has(l.id) ? "selected" : ""}" data-schedule-folder="${l.id}">${T(l.name)}</button>`,
      )
      .join(""),
    o = e.map((l) => `<option value="${l.id}">${T(l.name)}</option>`).join("");
  (re(
    `
    <button type="button" class="back-button ba-future-back" id="back-power-body">‹ Power Body</button>
    <div class="planner-toolbar">
      <div class="month-nav">
        <button type="button" class="small-button" id="month-prev" aria-label="Previous month">&larr;</button>
        <strong>${T(Eg(Je))}</strong>
        <button type="button" class="small-button" id="month-next" aria-label="Next month">&rarr;</button>
      </div>
      <div class="planner-tools">
        <button type="button" class="small-button" id="weekly-plan">Repetition</button>
        <button type="button" class="small-button" id="repeat-last-week">REPEAT</button>
      </div>
    </div>
    ${yt ? "" : '<div class="notice error">PLAN · SUPABASE UPDATE REQUIRED.</div>'}
    ${Be ? "" : '<div class="notice info">SUPABASE UPDATE REQUIRED.</div>'}
    ${t ? `<div class="notice error">${T(t)}</div>` : ""}
    ${Oe ? `<div class="status-line planner-status">${T(Oe)}</div>` : ""}
    <div class="calendar-weekdays" aria-hidden="true">
      <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
    </div>
    <div class="calendar-grid" aria-label="Workout calendar">${Xy(Je)}</div>
    
    <section class="plan-day-editor">
      <div class="plan-day-title">${T(xn(X))}</div>
      ${$u(X, { streak: Ct(X) === Ct(U()) })}
      <div class="plan-muscle-grid">${i}</div>
      ${ev(X)}
      ${
        e.length
          ? `<div class="plan-day-actions">
        <details class="move-plan">
          <summary>MOVE</summary>
          <form id="move-plan-form" class="move-plan-form">
            ${e.length > 1 ? `<select id="move-plan-folder" aria-label="Workout to move">${o}</select>` : `<input id="move-plan-folder" type="hidden" value="${e[0].id}" />`}
            <input id="move-plan-date" type="date" value="${s}" aria-label="Move workout to date" />
            <button type="submit" class="secondary-button">Move</button>
          </form>
        </details>
        <button type="button" class="text-button danger-text" id="clear-plan">CLEAR</button>
        ${ey(X) && n.length ? '<button type="button" class="text-button" id="reset-weekly">Restore repetition</button>' : ""}
      </div>`
          : ey(X) && n.length
            ? '<div class="plan-day-actions"><button type="button" class="text-button" id="reset-weekly">Restore repetition</button></div>'
            : ""
      }
    </section>`,
    {
      title: "The Future",
      showAccount: !1,
      showTimer: !1,
      navTab: "gym",
      view: "plan",
    },
  ),
    document
      .querySelector("#back-power-body")
      ?.addEventListener("click", () => Pt()),
    document.querySelector("#month-prev").addEventListener("click", () => {
      ((Je = new Date(Je.getFullYear(), Je.getMonth() - 1, 1)),
        (X = pr(Je)),
        (Oe = ""),
        ce());
    }),
    document.querySelector("#month-next").addEventListener("click", () => {
      ((Je = new Date(Je.getFullYear(), Je.getMonth() + 1, 1)),
        (X = pr(Je)),
        (Oe = ""),
        ce());
    }),
    document
      .querySelector("#weekly-plan")
      ?.addEventListener("click", () => go()),
    document.querySelector("#repeat-last-week")?.addEventListener("click", iv));
  const a = 450;
  (document.querySelectorAll("[data-plan-date]").forEach((l) => {
    let c = null,
      u = null,
      d = !1;
    const f = () => {
      (c && window.clearTimeout(c),
        (c = null),
        l.classList.remove("is-pressing"));
    };
    (l.addEventListener("pointerdown", (h) => {
      ((d = !1),
        (u = { x: h.clientX, y: h.clientY }),
        l.classList.add("is-pressing"),
        (c = window.setTimeout(() => {
          ((c = null),
            (d = !0),
            l.classList.remove("is-pressing"),
            cv(l.dataset.planDate));
        }, a)));
    }),
      l.addEventListener("pointermove", (h) => {
        u && Math.hypot(h.clientX - u.x, h.clientY - u.y) > 10 && f();
      }),
      l.addEventListener("pointerup", f),
      l.addEventListener("pointercancel", f),
      l.addEventListener("pointerleave", f),
      l.addEventListener("contextmenu", (h) => h.preventDefault()),
      l.addEventListener("click", () => {
        if (d) {
          d = !1;
          return;
        }
        ((X = l.dataset.planDate), (Oe = ""), ce());
      }));
  }),
    document.querySelectorAll("[data-schedule-folder]").forEach((l) => {
      l.addEventListener("click", () => tv(X, l.dataset.scheduleFolder));
    }),
    document.querySelectorAll("[data-done-folder]").forEach((l) => {
      l.addEventListener("click", () => {
        const c = l.dataset.doneFolder;
        lv(X, c, !Yt(X, c));
      });
    }),
    document
      .querySelector("#clear-plan")
      ?.addEventListener("click", () => rv(X)),
    document
      .querySelector("#reset-weekly")
      ?.addEventListener("click", () => nv(X)),
    document
      .querySelector("#move-plan-form")
      ?.addEventListener("submit", (l) => {
        (l.preventDefault(),
          sv(
            X,
            document.querySelector("#move-plan-date").value,
            document.querySelector("#move-plan-folder").value,
          ));
      }));
}
function go(t = "") {
  if (!Be || !Fs) {
    ((Oe = "Run the planning upgrade SQL first."), ce());
    return;
  }
  const r = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ]
    .map((n, s) => {
      const i = new Set(
          pt.filter((a) => Number(a.weekday) === s).map((a) => a.folder_id),
        ),
        o = $e
          .map(
            (a) =>
              `<button type="button" class="weekly-muscle-button ${i.has(a.id) ? "selected" : ""}" data-weekly-day="${s}" data-weekly-folder="${a.id}">${T(a.name)}</button>`,
          )
          .join("");
      return `<section class="weekly-row"><div class="weekly-day-label">${n}</div><div class="weekly-muscle-grid">${o}</div></section>`;
    })
    .join("");
  (re(
    `
    <button type="button" class="back-button" id="weekly-back">‹ The Future</button>
    ${t ? `<div class="notice error">${T(t)}</div>` : ""}
    <div class="weekly-plan-list">${r}</div>
    <div id="weekly-status" class="status-line planner-status" aria-live="polite"></div>`,
    { title: "WEEKLY.", showAccount: !1, showTimer: !1 },
  ),
    document
      .querySelector("#weekly-back")
      .addEventListener("click", () => ce()),
    document
      .querySelectorAll("[data-weekly-day][data-weekly-folder]")
      .forEach((n) => {
        n.addEventListener("click", () =>
          ov(Number(n.dataset.weeklyDay), n.dataset.weeklyFolder),
        );
      }));
}
async function gr(date, folderIds) {
  const owner = I?.id;
  if (!owner) throw new Error("Sign in to save your workout plan.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date)) || pr(Gt(date)) !== date)
    throw new Error("Choose a valid date.");
  const desired = [
    ...new Set((folderIds || []).filter((id) => typeof id === "string" && id)),
  ];
  const columns = Be ? "id,folder_id,is_skipped" : "id,folder_id";
  const read = await O.from("workout_schedule")
    .select(columns)
    .eq("user_id", owner)
    .eq("workout_date", date);
  if (read.error) throw read.error;
  const existing = read.data || [];
  const targets = desired.map((id) => ({
    folder_id: id,
    ...(Be ? { is_skipped: false } : {}),
  }));
  if (!targets.length && Be && qo(date).length)
    targets.push({ folder_id: null, is_skipped: true });
  const keepIds = new Set();
  const missing = [];
  for (const target of targets) {
    const match = existing.find(
      (row) =>
        row.folder_id === target.folder_id &&
        !!row.is_skipped === !!target.is_skipped &&
        !keepIds.has(row.id),
    );
    if (match) keepIds.add(match.id);
    else
      missing.push({
        user_id: owner,
        workout_date: date,
        ...target,
        updated_at: new Date().toISOString(),
      });
  }
  if (missing.length) {
    // Save the replacement before touching the previous plan.
    const inserted = await O.from("workout_schedule").insert(missing);
    if (inserted.error) throw inserted.error;
  }
  if (I?.id !== owner)
    throw new Error(
      "Your account changed. Open the plan again before making another change.",
    );
  const obsolete = existing
    .filter((row) => !keepIds.has(row.id))
    .map((row) => row.id);
  if (obsolete.length) {
    const removed = await O.from("workout_schedule")
      .delete()
      .eq("user_id", owner)
      .eq("workout_date", date)
      .in("id", obsolete);
    if (removed.error) {
      throw new Error(
        `${missing.length ? "The new plan was saved, but the previous entries could not be cleared." : "The plan could not be cleared."} Please try again. ${removed.error.message || ""}`.trim(),
      );
    }
  }
}
async function tv(date, folderId) {
  if (!yt || !date || !folderId) return;
  const controls = [...document.querySelectorAll("[data-schedule-folder]")];
  if (controls.some((button) => button.disabled)) return;
  const revision = Re;
  controls.forEach((button) => {
    button.disabled = true;
  });
  const selected = new Set(He(date).map((folder) => folder.id));
  if (selected.has(folderId)) selected.delete(folderId);
  else selected.add(folderId);
  try {
    await gr(date, [...selected]);
    await Kt();
    K();
    Oe = "";
    if (Re === revision) ce();
  } catch (error) {
    await Kt().catch(() => {});
    if (Re === revision)
      ce(
        ie(error)
          ? "Could not save the change. Your previous plan has been kept where possible. Reconnect and try again."
          : error.message,
      );
  } finally {
    controls.forEach((button) => {
      if (button.isConnected) button.disabled = false;
    });
  }
}
async function rv(t) {
  if (!(!yt || !t))
    try {
      (await gr(t, []), await Kt(), (Oe = ""), ce());
    } catch (e) {
      ce(e.message);
    }
}
async function nv(t) {
  try {
    const { error: e } = await O.from("workout_schedule")
      .delete()
      .eq("workout_date", t);
    if (e) throw e;
    (await Kt(), (Oe = ""), ce());
  } catch (e) {
    ce(e.message);
  }
}
async function sv(fromDate, toDate, folderId) {
  if (!yt || !fromDate || !toDate || fromDate === toDate || !folderId) return;
  const original = He(fromDate).map((folder) => folder.id);
  if (!original.includes(folderId)) return;
  const destination = [
    ...new Set([...He(toDate).map((folder) => folder.id), folderId]),
  ];
  const revision = Re;
  const submit = document.querySelector("#move-plan-form button[type=submit]");
  if (submit?.disabled) return;
  if (submit) submit.disabled = true;
  let destinationSaved = false;
  let sourceSaved = false;
  try {
    await gr(toDate, destination);
    destinationSaved = true;
    await gr(
      fromDate,
      original.filter((id) => id !== folderId),
    );
    sourceSaved = true;
    await Kt();
    K();
    if (Re === revision) {
      X = toDate;
      Je = new Date(Gt(toDate).getFullYear(), Gt(toDate).getMonth(), 1);
      Oe = "Workout moved.";
      ce();
    }
  } catch (error) {
    await Kt().catch(() => {});
    if (Re === revision) {
      const message =
        destinationSaved && !sourceSaved
          ? `The workout is saved on ${xn(toDate)}. Check the original day before retrying the move.`
          : sourceSaved
            ? "The workout moved, but the calendar could not refresh. Reopen it when connected."
            : ie(error)
              ? "Could not finish the move. Reconnect and try again."
              : error.message;
      ce(message);
    }
  } finally {
    if (submit?.isConnected) submit.disabled = false;
  }
}
function Ct(t) {
  const e = Gt(t),
    r = (e.getDay() + 6) % 7;
  return (e.setDate(e.getDate() - r), pr(e));
}
async function iv() {
  if (!yt) return;
  const t = Ct(X || U());
  if (!(
    Array.from({ length: 7 }, (r, n) => He(gt(t, n)).length > 0).some(
      Boolean,
    ) && !confirm("Replace this week with last week?")
  ))
    try {
      for (let r = 0; r < 7; r += 1) {
        const n = gt(t, r),
          s = gt(n, -7),
          i = He(s).map((o) => o.id);
        await gr(n, i);
      }
      (await Kt(), (Oe = "Last week copied."), ce());
    } catch (r) {
      ce(r.message);
    }
}
async function ov(t, e) {
  const r = document.querySelector("#weekly-status"),
    n = pt.some((s) => Number(s.weekday) === t && s.folder_id === e);
  r && (r.textContent = "SAVING...");
  try {
    if (n) {
      const { error: s } = await O.from("workout_weekly_plan")
        .delete()
        .eq("weekday", t)
        .eq("folder_id", e);
      if (s) throw s;
    } else {
      const { error: s } = await O.from("workout_weekly_plan").upsert(
        {
          user_id: I.id,
          weekday: t,
          folder_id: e,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,weekday,folder_id" },
      );
      if (s) throw s;
    }
    (await Kt(), go());
  } catch (s) {
    go(s.message);
  }
}
async function av() {
  const t = gt(U(), -1),
    e = ou();
  if (e.length)
    try {
      const r = He(U()).map((s) => s.id);
      await gr(U(), [...new Set([...r, ...e.map((s) => s.id)])]);
      const n = He(t)
        .filter((s) => Yt(t, s.id))
        .map((s) => s.id);
      (await gr(t, n), await Kt(), Pt());
    } catch (r) {
      Pt(r.message);
    }
}
function Jo(t, e, r) {
  const n = Ct(t),
    s = Kr(n),
    i = (a) => a.workout_date === t && a.folder_id === e,
    o = J();
  if (
    ((o.completions = o.completions.filter((a) => !i(a))),
    (o.uncompletions = o.uncompletions.filter((a) => !i(a))),
    r)
  ) {
    const a = new Date().toISOString();
    (Yt(t, e) ||
      (Fe = [
        {
          id: `local-${e}-${t}`,
          workout_date: t,
          folder_id: e,
          completed_at: a,
        },
        ...Fe,
      ]),
      o.completions.push({ workout_date: t, folder_id: e, completed_at: a }));
  } else
    ((Fe = Fe.filter((a) => !i(a))),
      o.uncompletions.push({ workout_date: t, folder_id: e }));
  (we(o), r && !s && Kr(n) && ai("GOLDEN WEEK."));
}
function bi() {
  return Br && Be;
}
async function lv(t, e, r) {
  !I || !t || !e || t > U() || !bi() || (Jo(t, e, r), K(), ce(), await Lt());
}
async function cv(t) {
  if (((X = t), t > U())) {
    ((Oe = "Future days can't be marked done yet."), ce());
    return;
  }
  if (!bi()) {
    ((Oe = "Run schema.sql in Supabase to turn on marking days done."), ce());
    return;
  }
  const e = Ko(t);
  if (!e.length) {
    ((Oe = "Pick the muscles you trained below, then hold the day again."),
      ce());
    return;
  }
  const r = e.every((s) => Yt(t, s.id));
  (e.forEach((s) => Jo(t, s.id, !r)), K());
  const n = e.map((s) => s.name).join(" + ");
  ((Oe = r
    ? `${n} on ${xn(t, { short: !0 })}: undone.`
    : `${n} on ${xn(t, { short: !0 })}: done.`),
    ce(),
    await Lt());
}
async function uv(t) {
  t.preventDefault();
  const e = document.querySelector("#folder-name"),
    r = document.querySelector("#folder-status"),
    n = e.value.trim();
  if (!n) return;
  if ($e.some((o) => o.name.toLowerCase() === n.toLowerCase())) {
    r.textContent = "That folder already exists.";
    return;
  }
  const s = $e.reduce((o, a) => Math.max(o, a.sort_order || 0), 0) + 1,
    { error: i } = await O.from("folders").insert({
      user_id: I.id,
      name: n,
      sort_order: s,
    });
  if (i) {
    r.textContent = i.message;
    return;
  }
  (await Vr(), mr());
}
function Yo() {
  return new Promise((t, e) => {
    if (!("indexedDB" in window)) {
      e(new Error("Offline video storage is not supported in this browser."));
      return;
    }
    const r = indexedDB.open(wg, 1);
    ((r.onupgradeneeded = () => {
      const n = r.result;
      n.objectStoreNames.contains(Ft) ||
        n.createObjectStore(Ft, { keyPath: "path" });
    }),
      (r.onsuccess = () => t(r.result)),
      (r.onerror = () =>
        e(r.error || new Error("Could not open offline video storage."))));
  });
}
async function xu(t) {
  try {
    const e = await Yo();
    return await new Promise((r, n) => {
      const s = e.transaction(Ft, "readonly"),
        i = s.objectStore(Ft).get(t);
      ((i.onsuccess = () => r(i.result?.blob || null)),
        (i.onerror = () => n(i.error)),
        (s.oncomplete = () => e.close()));
    });
  } catch {
    return null;
  }
}
async function Pu(t, e, r = "") {
  const n = await Yo();
  (await new Promise((s, i) => {
    const o = n.transaction(Ft, "readwrite");
    (o.objectStore(Ft).put({ path: t, blob: e, name: r, storedAt: Date.now() }),
      (o.oncomplete = s),
      (o.onerror = () => i(o.error)));
  }),
    n.close());
}
function dv() {
  (oo.forEach((t) => URL.revokeObjectURL(t)), (oo = []));
}
async function hv(t) {
  const e = document.querySelector("#preload-today"),
    r = document.querySelector("#preload-status");
  if (!(!e || !r || !t?.length)) {
    ((e.disabled = !0), yu());
    try {
      for (let n = 0; n < t.length; n += 1)
        ((r.textContent = `Saving ${n + 1}/${t.length} workouts...`),
          await fv(t[n].id, {
            sharedButton: e,
            sharedStatus: r,
            quietFinish: !0,
          }));
      (fe.length &&
        ((r.textContent = "Saving motivation..."),
        await Cu(fe, r, "motivation"),
        (fe = await Bo(Mo(fe)))),
        (r.textContent = "Videos ready. This phone can train offline."),
        (e.textContent = "Videos ready"));
    } catch (n) {
      ((r.textContent = n.message || "Could not save videos."),
        (e.disabled = !1));
    }
  }
}
async function Cu(t, e, r = "videos") {
  const n = t.filter((o) => o.video_path),
    s = [];
  for (const o of n) (await xu(o.video_path)) || s.push(o);
  if (!s.length) return;
  const i = await mu(s.map((o) => o.video_path));
  for (let o = 0; o < s.length; o += 1) {
    const a = s[o];
    e && (e.textContent = `Saving ${r} ${o + 1}/${s.length}`);
    const l = i[a.video_path];
    if (!l) throw new Error(`Could not save ${a.name}.`);
    const c = await fetch(l);
    if (!c.ok) throw new Error(`Could not save ${a.name}.`);
    const u = await c.blob();
    await Pu(a.video_path, u, a.name);
  }
}
async function fv(t, e = {}) {
  const r = e.sharedButton || document.querySelector("#preload-today"),
    n = e.sharedStatus || document.querySelector("#preload-status");
  if (!t || !r || !n) return;
  ((r.disabled = !0), e.quietFinish || (n.textContent = "Preparing..."));
  const { rows: s } = await pu(t);
  if (!s?.length) {
    e.quietFinish || (n.textContent = "No videos yet.");
    return;
  }
  (await Cu(s, n),
    e.quietFinish ||
      ((n.textContent = "Videos ready."), (r.textContent = "Videos ready")));
}
function Qs(t) {
  return `battle-angel-weightlog-${I?.id || "anon"}-${t}`;
}
function yo(t, e) {
  const r = Object.values(J().weightLogs).filter((s) => s.folder_id === e),
    n = new Map(t.map((s) => [`${s.exercise_group}|${s.workout_date}`, s]));
  return (
    r.forEach((s) => n.set(`${s.exercise_group}|${s.workout_date}`, s)),
    [...n.values()].sort((s, i) =>
      String(i.workout_date).localeCompare(String(s.workout_date)),
    )
  );
}
async function pv(t) {
  const e = Zr(Qs(t), []);
  if (
    ((sr = yo(Array.isArray(e) ? e : [], t)), !(!Rt || navigator.onLine === !1))
  )
    try {
      const { data: r, error: n } = await yi(
        O.from("exercise_weight_log")
          .select("exercise_group,folder_id,workout_date,weight")
          .eq("folder_id", t)
          .order("workout_date", { ascending: !1 })
          .limit(400),
        Po,
      );
      if (n) {
        Wc(n) && (Rt = !1);
        return;
      }
      (Kn(Qs(t), r || []), B?.id === t && (sr = yo(r || [], t)));
    } catch {}
}
function mv(t) {
  return sr.filter((e) => e.exercise_group === t);
}
function Iu(t, e = U()) {
  const r = String(t?.last_weight || "")
    .trim()
    .slice(0, 40);
  if (!I || !B || !t || !r || !Rt) return;
  const n = {
    exercise_group: t.id,
    folder_id: B.id,
    workout_date: e,
    weight: r,
  };
  if (
    sr.find((a) => a.exercise_group === t.id && a.workout_date === e)
      ?.weight === r
  )
    return;
  sr = yo(
    sr
      .filter((a) => !(a.exercise_group === t.id && a.workout_date === e))
      .concat(n),
    B.id,
  );
  const i = J();
  ((i.weightLogs[`${t.id}|${e}`] = n), we(i));
  const o = Zr(Qs(B.id), []);
  (Kn(Qs(B.id), [
    n,
    ...(Array.isArray(o) ? o : []).filter(
      (a) => !(a.exercise_group === t.id && a.workout_date === e),
    ),
  ]),
    Lt());
}
function gv(t) {
  if (!Rt)
    return '<div class="weight-history-empty">WEIGHT LOG · SUPABASE UPDATE REQUIRED.</div>';
  const e = mv(t.id);
  if (!e.length) return '<div class="weight-history-empty">—</div>';
  const r = e
    .slice(0, 8)
    .map(
      (n) => `
    <li><span>${T(xn(n.workout_date, { short: !0 }))}</span><strong>${T(n.weight)}</strong></li>`,
    )
    .join("");
  return `
    <details class="weight-history">
      <summary>LOG <span class="weight-history-count">${e.length}</span></summary>
      <ol class="weight-history-list">${r}</ol>
    </details>`;
}
function yv(t) {
  const e = new Map();
  return (
    t.forEach((r) => {
      const n = r.exercise_group;
      (e.has(n) ||
        e.set(n, {
          id: n,
          name: r.name,
          sort_order: r.sort_order,
          created_at: r.created_at,
          ...li(r),
          videos: [],
        }),
        e.get(n).videos.push(r));
    }),
    [...e.values()]
      .map((r) => ({
        ...r,
        videos: r.videos.sort(
          (n, s) => (n.video_order || 1) - (s.video_order || 1),
        ),
      }))
      .sort(
        (r, n) =>
          r.sort_order - n.sort_order ||
          String(r.created_at).localeCompare(String(n.created_at)),
      )
  );
}
async function Ge(t, e = {}) {
  const r = $e.find((a) => a.id === t) || B;
  if (!r) return;
  const n = B?.id || null;
  ((B = r),
    (F = []),
    (oe = !1),
    n !== r.id
      ? (Ie = !!e.editMode)
      : typeof e.editMode == "boolean" && (Ie = e.editMode),
    wv());
  const s = Re;
  let i;
  try {
    i = await pu(r.id);
  } catch (a) {
    if (Re !== s) return;
    vv(r.id, e, a);
    return;
  }
  if (Re !== s) return;
  dv();
  const [o] = await Promise.all([gu(i.rows), pv(r.id)]);
  if (Re === s) {
    if (((F = yv(o)), e.mode === "workout" && F.length)) {
      Du();
      return;
    }
    yr(
      F,
      "",
      i.fromCache ? "Offline · showing the saved copy of this workout." : "",
    );
  }
}
function vv(t, e, r) {
  const n =
    navigator.onLine === !1 ||
    /fetch|network|abort|timeout/i.test(String(r?.message || r));
  (re(
    `
    <section class="load-error-card">
      <div class="load-error-title">${n ? "OFFLINE." : "LOAD FAILED."}</div>
      <p>${n ? "NOT SAVED OFFLINE." : T(r?.message || "RETRY.")}</p>
      <div class="load-error-actions">
        <button type="button" class="primary-button" id="retry-folder">Try again</button>
        <button type="button" class="secondary-button" id="error-back">Back</button>
      </div>
    </section>`,
    { showAccount: !1, showTimer: !1 },
  ),
    document
      .querySelector("#retry-folder")
      .addEventListener("click", () => Ge(t, e)),
    document.querySelector("#error-back").addEventListener("click", () => {
      ((B = null), Pt());
    }));
}
function wv() {
  re('<div class="notice info">Loading...</div>', {
    showAccount: !1,
    showTimer: !1,
  });
}
function _v(t) {
  const e = [t.cue_1, t.cue_2, t.cue_3].filter(Boolean);
  return e.length
    ? `<div class="cue-list">${e.map((r) => `<span class="cue-chip">${T(r)}</span>`).join("")}</div>`
    : "";
}
function bv(t, e, r, n = !1) {
  if (!n)
    return `
      <article class="exercise-card compact-plan-card" data-exercise-group="${t.id}">
        <div class="exercise-heading">
          <div class="exercise-number">${e + 1}</div>
          <div class="exercise-name-wrap">
            <div class="exercise-name">${T(t.name)}</div>
            <div class="exercise-prescription">${t.sets_target} x ${T(t.reps_target)}${t.last_weight ? ` &middot; ${T(t.last_weight)}` : ""}</div>
          </div>
        </div>
      </article>`;
  const s = t.videos
      .map(
        (a, l) => `
    <div class="reference-video">
      <div class="reference-label">Reference ${l + 1}</div>
      <video controls playsinline webkit-playsinline preload="metadata" src="${T(a.signedUrl)}" aria-label="${T(t.name)} reference ${l + 1}"></video>
      ${t.videos.length > 1 ? `<button type="button" class="text-button danger-text" data-remove-video="${a.id}" data-video-path="${T(a.video_path)}" data-video-group="${t.id}">Remove video</button>` : ""}
    </div>`,
      )
      .join(""),
    i = t.videos.length < Ro,
    o = t.videos.length + 1;
  return `
    <article class="exercise-card plan-card" data-exercise-group="${t.id}">
      <div class="exercise-heading">
        <div class="exercise-number">${e + 1}</div>
        <div class="exercise-name-wrap">
          <div class="exercise-name">${T(t.name)}</div>
          <div class="exercise-prescription">${t.sets_target} x ${T(t.reps_target)}${t.last_weight ? ` &middot; ${T(t.last_weight)}` : ""}</div>
        </div>
      </div>
      <div class="reference-grid">${s}</div>
      <details class="manage-exercise">
        <summary>Edit</summary>
        <form class="edit-exercise-form" data-edit-form="${t.id}">
          <label class="field-span-2"><span class="eyebrow">NAME</span><input name="name" type="text" maxlength="80" value="${T(t.name)}" required /></label>
          <label><span class="eyebrow">SETS</span><input name="sets_target" type="number" inputmode="numeric" min="1" max="10" value="${t.sets_target}" required /></label>
          <label><span class="eyebrow">REPS</span><input name="reps_target" type="text" maxlength="24" value="${T(t.reps_target)}" placeholder="8-12" required /></label>
          <label class="field-span-2"><span class="eyebrow">LAST WEIGHT</span><input name="last_weight" type="text" maxlength="40" value="${T(t.last_weight)}" placeholder="25 kg" /></label>
          <label class="field-span-2"><span class="eyebrow">CUE 1</span><input name="cue_1" type="text" maxlength="100" value="${T(t.cue_1)}" /></label>
          <label class="field-span-2"><span class="eyebrow">CUE 2</span><input name="cue_2" type="text" maxlength="100" value="${T(t.cue_2)}" /></label>
          <label class="field-span-2"><span class="eyebrow">CUE 3</span><input name="cue_3" type="text" maxlength="100" value="${T(t.cue_3)}" /></label>
          <label class="field-span-2"><span class="eyebrow">BACKUP</span><input name="backup_exercise" type="text" maxlength="100" value="${T(t.backup_exercise)}" /></label>
          <div class="edit-actions field-span-2">
            <button type="submit" class="primary-button">SAVE</button>
            <button type="button" class="secondary-button" data-move-group="${t.id}" data-direction="up" ${e === 0 ? "disabled" : ""}>Up</button>
            <button type="button" class="secondary-button" data-move-group="${t.id}" data-direction="down" ${e === r - 1 ? "disabled" : ""}>Down</button>
            ${i ? `<label class="secondary-button add-reference">Add video ${o}<input type="file" accept="video/*,.mp4,.mov,.m4v,.webm" data-add-video="${t.id}" aria-label="Choose reference video ${o}" /></label>` : ""}
            <button type="button" class="danger-button" data-delete-group="${t.id}">DELETE</button>
          </div>
          <div class="status-line field-span-2" data-edit-status="${t.id}" aria-live="polite"></div>
        </form>
      </details>
    </article>`;
}
function yr(t, e = "", r = "") {
  ((oe = !1), jn(), t.length || (Ie = !0));
  const n = Ie,
    s = t.map((c, u) => bv(c, u, t.length, n)).join(""),
    i = yy(B.id),
    o = i?.completedGroupIds?.length || 0,
    a = i ? `RESUME${o ? ` · ${o}/${t.length}` : ""}` : "START";
  (re(
    `
    <div class="folder-header">
      <button type="button" class="back-button" id="back-home">‹ Power Body</button>
      ${n ? '<button type="button" class="ghost-danger" id="delete-folder">DELETE</button>' : ""}
    </div>
    ${t.length ? `<button type="button" class="start-workout-button" id="start-workout">${T(a)} <span aria-hidden="true">&rarr;</span></button>` : ""}
    <button type="button" class="secondary-button full-button edit-workout-button ${n ? "editing" : ""}" id="toggle-edit-workout">${n ? "DONE" : "EDIT"}</button>
    ${e ? `<div class="notice error">${T(e)}</div>` : ""}
    ${r ? `<div class="offline-note">${T(r)}</div>` : ""}
    ${
      n
        ? `<details class="add-exercise" id="add-exercise-box" ${t.length ? "" : "open"}>
      <summary>+ EXERCISE</summary>
      <form id="add-exercise-form" class="add-exercise-form">
        <label class="field-span-2">
          <span class="eyebrow">EXERCISE</span>
          <input id="exercise-name" type="text" maxlength="80" placeholder="e.g. Bayesian cable curl" />
        </label>
        <label>
          <span class="eyebrow">SETS</span>
          <input id="exercise-sets" type="number" inputmode="numeric" min="1" max="10" value="3" />
        </label>
        <label>
          <span class="eyebrow">REPS</span>
          <input id="exercise-reps" type="text" maxlength="24" value="8-12" />
        </label>
        <div class="video-create-grid field-span-2">
          <label class="file-picker compact-file-picker">
            <span class="eyebrow">VIDEO 1</span>
            <span class="file-picker-button">CHOOSE</span>
            <span id="picked-video-1" class="picked-files">REQUIRED</span>
            <input id="exercise-video-1" type="file" accept="video/*,.mp4,.mov,.m4v,.webm" required aria-label="Choose first reference video" />
          </label>
          <label class="file-picker compact-file-picker">
            <span class="eyebrow">VIDEO 2</span>
            <span class="file-picker-button">CHOOSE</span>
            <span id="picked-video-2" class="picked-files">OPTIONAL</span>
            <input id="exercise-video-2" type="file" accept="video/*,.mp4,.mov,.m4v,.webm" aria-label="Choose second reference video" />
          </label>
          <label class="file-picker compact-file-picker">
            <span class="eyebrow">VIDEO 3</span>
            <span class="file-picker-button">CHOOSE</span>
            <span id="picked-video-3" class="picked-files">OPTIONAL</span>
            <input id="exercise-video-3" type="file" accept="video/*,.mp4,.mov,.m4v,.webm" aria-label="Choose third reference video" />
          </label>
        </div>
        <details class="optional-details field-span-2">
          <summary>+ DETAILS</summary>
          <div class="optional-grid">
            <label class="field-span-2">
              <span class="eyebrow">LAST WEIGHT</span>
              <input id="exercise-weight" type="text" maxlength="40" placeholder="e.g. 25 kg" />
            </label>
            <label class="field-span-2"><span class="eyebrow">CUE 1</span><input id="exercise-cue-1" type="text" maxlength="100" placeholder="Keep elbows back" /></label>
            <label class="field-span-2"><span class="eyebrow">CUE 2</span><input id="exercise-cue-2" type="text" maxlength="100" placeholder="Control the negative" /></label>
            <label class="field-span-2"><span class="eyebrow">CUE 3</span><input id="exercise-cue-3" type="text" maxlength="100" placeholder="Full stretch" /></label>
            <label class="field-span-2"><span class="eyebrow">BACKUP</span><input id="exercise-backup" type="text" maxlength="100" placeholder="If the machine is busy" /></label>
          </div>
        </details>
        <button class="primary-button field-span-2" id="save-exercise" type="submit">Add to workout</button>
      </form>
      <div id="add-exercise-status" class="status-line inline-status" aria-live="polite"></div>
    </details>
    <div id="upload-status" class="upload-status hidden" aria-live="polite">
      <div id="upload-label">Uploading...</div>
      <div class="progress-track"><div id="upload-progress" class="progress-bar"></div></div>
    </div>`
        : ""
    }
    ${
      t.length
        ? `<section class="exercise-list">${s}</section>`
        : `
      <section class="empty-state">
        <div class="empty-title">EMPTY.</div>
      </section>`
    }`,
    { showAccount: !1, showTimer: !1 },
  ),
    document.querySelector("#back-home").addEventListener("click", () => {
      ((Ie = !1), mr(), Xs());
    }),
    document.querySelector("#delete-folder")?.addEventListener("click", Uv),
    document
      .querySelector("#toggle-edit-workout")
      .addEventListener("click", () => {
        ((Ie = !n), yr(F));
      }));
  const l = document.querySelector("#start-workout");
  (l && l.addEventListener("click", () => Du()),
    document
      .querySelector("#add-exercise-form")
      ?.addEventListener("submit", $v),
    [1, 2, 3].forEach((c) => {
      document
        .querySelector(`#exercise-video-${c}`)
        ?.addEventListener("change", (u) => Sv(u, c));
    }),
    document.querySelectorAll("[data-edit-form]").forEach((c) => {
      c.addEventListener("submit", xv);
    }),
    document.querySelectorAll("[data-move-group]").forEach((c) => {
      c.addEventListener("click", () =>
        Iv(c.dataset.moveGroup, c.dataset.direction),
      );
    }),
    document.querySelectorAll("[data-delete-group]").forEach((c) => {
      c.addEventListener("click", () => Dv(c.dataset.deleteGroup));
    }),
    document.querySelectorAll("[data-remove-video]").forEach((c) => {
      c.addEventListener("click", () =>
        Lv(c.dataset.removeVideo, c.dataset.videoPath, c.dataset.videoGroup),
      );
    }),
    document.querySelectorAll("[data-add-video]").forEach((c) => {
      c.addEventListener("change", () => Pv(c.dataset.addVideo, c));
    }));
}
function Sv(t, e) {
  const r = [...(t.currentTarget.files || [])].find(xt) || null,
    n = document.querySelector(`#picked-video-${e}`),
    s = document.querySelector("#add-exercise-status");
  if (n) {
    if (!r) {
      ((n.textContent = e === 1 ? "Required" : "Optional"),
        t.currentTarget.files?.length &&
          s &&
          (s.textContent = "Choose an MP4, MOV, M4V, or WebM video."));
      return;
    }
    if (((n.textContent = `${te(r.name)} · ${Ss(r.size)}`), r.size > $c && s))
      s.textContent = `${te(r.name)} will be compressed before uploading.`;
    else if (s) {
      const i = [1, 2, 3]
        .map((o) => document.querySelector(`#exercise-video-${o}`)?.files?.[0])
        .filter(xt);
      s.textContent = `${i.length} video${i.length === 1 ? "" : "s"} ready.`;
    }
  }
}
async function kv(t) {
  const e = t.currentTarget,
    r = document.querySelector("#motivation-status"),
    n = [...(e.files || [])].filter(jc);
  if (((e.value = ""), !n.length)) {
    r &&
      (r.textContent =
        "Choose a video (MP4, MOV, M4V, WebM) or a photo (JPG, PNG, WebP, GIF, HEIC).");
    return;
  }
  if (!Bt) {
    r &&
      (r.textContent = "Motivation storage is still loading. Try once more.");
    return;
  }
  e.disabled = !0;
  let s = 0;
  const i = [],
    o = [],
    a = fe.reduce((l, c) => Math.max(l, Number(c.sort_order) || 0), 0) + 1;
  try {
    for (let c = 0; c < n.length; c += 1) {
      const u = n[c];
      r &&
        (r.textContent = `Preparing ${c + 1} of ${n.length}: ${te(u.name)}...`);
      const d = await Xo(u, (_) => {
          r &&
            (r.textContent = `Compressing ${c + 1} of ${n.length}: ${te(u.name)} · ${Math.round(_)}%`);
        }),
        f = xt(d) ? Io(d.name) : Rg(d),
        h = `${I.id}/${Bt.id}/${f}`;
      (r &&
        (r.textContent = `Uploading ${c + 1} of ${n.length}: ${te(d.name)}...`),
        await Zo(
          d,
          h,
          (_) => {
            r &&
              (r.textContent = `Uploading ${c + 1} of ${n.length}: ${te(d.name)} · ${Math.round(_)}%`);
          },
          { allowImages: !0 },
        ),
        i.push(h));
      const { data: y, error: v } = await O.from("exercises")
        .insert({
          user_id: I.id,
          folder_id: Bt.id,
          name: te(d.name).slice(0, 80),
          video_path: h,
          sort_order: a + c,
          video_order: 1,
        })
        .select("id")
        .single();
      if (v) throw v;
      (o.push(y.id), (s += 1));
    }
    (await Cn(), Un());
    const l = document.querySelector("#motivation-status");
    l &&
      (l.textContent = `${s} item${s === 1 ? "" : "s"} saved. They play in random order during rest.`);
  } catch (l) {
    for (let u = o.length; u < i.length; u += 1)
      await O.storage.from(ut).remove([i[u]]);
    (await Cn().catch(() => {}), Un());
    const c = document.querySelector("#motivation-status");
    c && (c.textContent = Qo(l));
  }
}
async function Ev(id, videoPath) {
  const userId = I?.id,
    state = mediaSafetyState(userId),
    key = `motivation:${id}`,
    revision = Re;
  if (!userId || !id || !videoPath || state.operations.has(key)) return;
  state.operations.add(key);
  try {
    if (!confirm("Remove this from motivation?")) return;
    await mediaDeleteDatabaseRows("exercises", "id", id, userId);
    const cleanup = mediaQueueCleanup(userId, [videoPath]);
    cleanup.then((clean) => mediaCleanupNotice("Item", clean, userId));
    vi([videoPath]);
    if (I?.id !== userId) return;
    fe = fe.filter((entry) => entry.id !== id);
    if (Wt === id) Wt = null;
    le = le.filter((entry) => entry !== id);
    Me = Ee(Me, 0, Math.max(0, le.length - 1));
    K();
    if (Re === revision) Un();
  } catch (error) {
    if (I?.id === userId)
      alert(
        ie(error)
          ? "Couldn’t confirm removal. Your media has been kept. Reconnect and try again."
          : error.message,
      );
  } finally {
    state.operations.delete(key);
  }
}
function Ye(t, e = 0, r = !0) {
  const n = document.querySelector("#upload-status"),
    s = document.querySelector("#upload-label"),
    i = document.querySelector("#upload-progress");
  !n ||
    !s ||
    !i ||
    (n.classList.toggle("hidden", !r),
    (s.textContent = t),
    (i.style.width = `${Ee(e, 0, 100)}%`));
}
class ft extends Error {}
function Pl(t) {
  return Math.max(2, Math.round(t / 2) * 2);
}
function Lu(t, e) {
  return `${String(t || "upload").replace(/\.[^/.]+$/, "") || "upload"}.${e}`;
}
async function Tv(t) {
  if (typeof createImageBitmap == "function")
    try {
      return await createImageBitmap(t, { imageOrientation: "from-image" });
    } catch {}
  const e = URL.createObjectURL(t);
  try {
    const r = new Image();
    return ((r.src = e), await r.decode(), r);
  } finally {
    URL.revokeObjectURL(e);
  }
}
async function Av(t) {
  if (lt(t.name) === "gif" || String(t.type).toLowerCase() === "image/gif")
    return t;
  const e = await Tv(t),
    r = e.width || e.naturalWidth,
    n = e.height || e.naturalHeight;
  if (!r || !n) return t;
  const s = Math.min(1, mg / Math.max(r, n)),
    i = document.createElement("canvas");
  ((i.width = Math.round(r * s)), (i.height = Math.round(n * s)));
  const o = i.getContext("2d");
  ((o.fillStyle = "#000"),
    o.fillRect(0, 0, i.width, i.height),
    o.drawImage(e, 0, 0, i.width, i.height),
    e.close?.());
  const a = await new Promise((l) => i.toBlob(l, "image/jpeg", gg));
  return (
    (i.width = 0),
    (i.height = 0),
    !a || a.size >= t.size
      ? t
      : new File([a], Lu(t.name, "jpg"), { type: "image/jpeg" })
  );
}
async function Ov(t, e, { keepAudio: r = !0 } = {}) {
  if (typeof VideoEncoder > "u" || typeof VideoDecoder > "u")
    throw new ft(
      "This browser cannot compress video. Update iOS, or export the clip smaller than 50 MB.",
    );
  const {
    Input: n,
    Output: s,
    Conversion: i,
    BlobSource: o,
    BufferTarget: a,
    Mp4OutputFormat: l,
    ALL_FORMATS: c,
    Quality: u,
    canEncodeVideo: d,
  } = await Wu(async () => {
    const {
      Input: h,
      Output: y,
      Conversion: v,
      BlobSource: _,
      BufferTarget: R,
      Mp4OutputFormat: g,
      ALL_FORMATS: m,
      Quality: k,
      canEncodeVideo: A,
    } = await import("./media-dc82b5ea0a08.js");
    return {
      Input: h,
      Output: y,
      Conversion: v,
      BlobSource: _,
      BufferTarget: R,
      Mp4OutputFormat: g,
      ALL_FORMATS: m,
      Quality: k,
      canEncodeVideo: A,
    };
  }, []);
  if (!(await d("avc")))
    throw new ft(
      "This phone cannot compress video in the browser. Export the clip smaller than 50 MB.",
    );
  const f = new n({ source: new o(t), formats: c });
  try {
    const h = await f.getPrimaryVideoTrack();
    if (!h) throw new ft(`${te(t.name)} has no video track.`);
    const y = await f.computeDuration(),
      v = r ? pg : 0,
      _ = y > 0 ? Math.floor((dg * 8) / y) - v : vl,
      R = Ee(_, fg, vl),
      g = h.displayWidth || 1280,
      m = h.displayHeight || 720,
      k = Math.min(1, hg / Math.max(g, m)),
      A = new s({ format: new l({ fastStart: "in-memory" }), target: new a() }),
      C = await i.init({
        input: f,
        output: A,
        video: {
          width: Pl(g * k),
          height: Pl(m * k),
          fit: "contain",
          codec: "avc",
          quality: new u(R),
          forceTranscode: !0,
        },
        audio: r ? {} : { discard: !0 },
        showWarnings: !1,
      });
    if (!C.isValid)
      throw new ft(`${te(t.name)} could not be compressed on this phone.`);
    ((C.onProgress = (W) => e?.(Ee(W * 100, 0, 100))), await C.execute());
    const x = A.target.buffer;
    if (!x) throw new ft(`${te(t.name)} could not be compressed.`);
    return new File([x], Lu(t.name, "mp4"), { type: "video/mp4" });
  } finally {
    f.dispose?.();
  }
}
async function Xo(t, e, { keepAudio: r = !0 } = {}) {
  if (Co(t) && !xt(t)) {
    let i = t;
    try {
      i = await Av(t);
    } catch (o) {
      console.warn("Photo compression skipped:", o);
    }
    if (i.size > vs)
      throw new ft(`${te(t.name)} is too large (${Ss(i.size)}).`);
    return i;
  }
  if (t.size <= $c) return t;
  let n = null;
  Xn();
  try {
    n = await Ov(t, e, { keepAudio: r });
  } catch (i) {
    if (
      (console.warn("Video compression failed:", i),
      !oe && !ue && jn(),
      t.size <= vs)
    )
      return t;
    throw i instanceof ft
      ? i
      : new ft(
          `${te(t.name)} (${Ss(t.size)}) could not be compressed on this phone. Trim it or export it smaller than 50 MB.`,
        );
  }
  !oe && !ue && jn();
  const s = n.size < t.size ? n : t;
  if (s.size > vs)
    throw new ft(
      `${te(t.name)} is still ${Ss(s.size)} after compressing. Trim it shorter and try again.`,
    );
  return s;
}
function Qo(t, e = null) {
  if (t instanceof ft) return t.message;
  const r = String(t?.message || t || "Upload failed"),
    n = r.toLowerCase();
  return (e && e.size > vs) ||
    n.includes("maximum") ||
    n.includes("too large") ||
    n.includes("413")
    ? "This clip is too large for the current Supabase Free file limit (50 MB). Trim it or export it smaller, then try again."
    : n.includes("network") || n.includes("fetch") || n.includes("offline")
      ? "The upload was interrupted. Keep battle angel open, reconnect to Wi-Fi/cellular, and try again."
      : `Upload failed: ${r}`;
}
async function Rv() {
  const { data: t, error: e } = await O.from("exercises")
    .select("sort_order")
    .eq("folder_id", B.id)
    .order("sort_order", { ascending: !1 })
    .limit(1);
  if (e) throw e;
  return (t?.[0]?.sort_order || 0) + 1;
}
async function $v(t) {
  if ((t.preventDefault(), !B)) return;
  const e = document.querySelector("#exercise-name"),
    r = document.querySelector("#add-exercise-status"),
    n = document.querySelector("#save-exercise"),
    s = [1, 2, 3]
      .map((c) => document.querySelector(`#exercise-video-${c}`)?.files?.[0])
      .filter(xt);
  if (!s.length) {
    r.textContent = "Choose at least video 1.";
    return;
  }
  const i = e.value.trim() || te(s[0].name),
    o = li({
      sets_target: document.querySelector("#exercise-sets").value,
      reps_target: document.querySelector("#exercise-reps").value,
      last_weight: document.querySelector("#exercise-weight").value,
      cue_1: document.querySelector("#exercise-cue-1").value,
      cue_2: document.querySelector("#exercise-cue-2").value,
      cue_3: document.querySelector("#exercise-cue-3").value,
      backup_exercise: document.querySelector("#exercise-backup").value,
    }),
    a = crypto.randomUUID(),
    l = [];
  ((n.disabled = !0), (n.textContent = "Adding..."), (r.textContent = ""));
  try {
    const c = await Rv();
    for (let u = 0; u < s.length; u += 1) {
      const d = s[u];
      Ye(`Preparing reference ${u + 1} of ${s.length}: ${te(d.name)}`, 0);
      const f = await Xo(
          d,
          (v) => {
            Ye(
              `Compressing reference ${u + 1} of ${s.length}: ${te(d.name)} · ${Math.round(v)}%`,
              v,
            );
          },
          { keepAudio: !1 },
        ),
        h = `${I.id}/${B.id}/${Io(f.name)}`;
      (Ye(`Uploading reference ${u + 1} of ${s.length}: ${te(f.name)}`, 0),
        await Zo(f, h, (v) => {
          Ye(
            `Uploading reference ${u + 1} of ${s.length}: ${te(f.name)} · ${Math.round(v)}%`,
            v,
          );
        }),
        l.push(h));
      const { error: y } = await O.from("exercises").insert({
        user_id: I.id,
        folder_id: B.id,
        exercise_group: a,
        name: i.slice(0, 80),
        video_path: h,
        sort_order: c,
        video_order: u + 1,
        ...o,
      });
      if (y) throw y;
    }
    (Ye("Exercise added", 100), await Ge(B.id));
  } catch (c) {
    (l.length &&
      (await O.storage.from(ut).remove(l),
      await O.from("exercises").delete().eq("exercise_group", a)),
      Ye(Qo(c), 0),
      (n.disabled = !1),
      (n.textContent = "Add to workout"));
  }
}
async function xv(t) {
  t.preventDefault();
  const e = t.currentTarget,
    r = e.dataset.editForm,
    n = document.querySelector(`[data-edit-status="${r}"]`),
    s = e.querySelector('button[type="submit"]'),
    i = li({
      sets_target: e.elements.sets_target.value,
      reps_target: e.elements.reps_target.value,
      last_weight: e.elements.last_weight.value,
      cue_1: e.elements.cue_1.value,
      cue_2: e.elements.cue_2.value,
      cue_3: e.elements.cue_3.value,
      backup_exercise: e.elements.backup_exercise.value,
    });
  if (((i.name = e.elements.name.value.trim().slice(0, 80)), !i.name)) {
    n.textContent = "Give the exercise a name.";
    return;
  }
  ((s.disabled = !0), (n.textContent = "Saving..."));
  const { error: o } = await O.from("exercises")
    .update(i)
    .eq("exercise_group", r);
  if (o) {
    ((n.textContent = o.message), (s.disabled = !1));
    return;
  }
  ((n.textContent = "Saved"), await Ge(B.id));
}
async function Pv(groupId, input) {
  const file = Og(input.files, 1)[0],
    userId = I?.id,
    folderId = B?.id;
  input.value = "";
  if (!file || !userId || !folderId) return;
  const group = F.find((entry) => entry.id === groupId);
  if (!group || group.videos.length >= Ro) return;
  const state = mediaSafetyState(userId),
    key = `reference-add:${groupId}`;
  if (state.operations.has(key)) return;
  state.operations.add(key);
  input.disabled = true;
  const metadata = li(group);
  let prepared = file;
  try {
    const count = await mediaRenumberReferences(groupId, userId, true);
    if (!count)
      throw new ft(
        "This exercise could not be found. Reopen the workout and try again.",
      );
    if (count >= Ro)
      throw new ft("This exercise already has three references.");
    const position = count + 1;
    Ye(`Preparing reference ${position}: ${te(file.name)}`, 0);
    prepared = await Xo(
      file,
      (percent) => {
        Ye(
          `Compressing reference ${position}: ${te(file.name)} · ${Math.round(percent)}%`,
          percent,
        );
      },
      { keepAudio: false },
    );
    if (I?.id !== userId)
      throw new Error("Your account changed. Please sign in again.");
    const videoPath = `${userId}/${folderId}/${Io(prepared.name)}`;
    Ye(`Adding reference ${position}: ${te(prepared.name)}`, 0);
    await Zo(prepared, videoPath, (percent) => {
      Ye(
        `Adding reference ${position}: ${te(prepared.name)} · ${Math.round(percent)}%`,
        percent,
      );
    });
    if (I?.id !== userId)
      throw new Error("Your account changed. Please sign in again.");
    const { error } = await O.from("exercises").insert({
      user_id: userId,
      folder_id: folderId,
      exercise_group: group.id,
      name: group.name,
      video_path: videoPath,
      sort_order: group.sort_order,
      video_order: position,
      ...metadata,
    });
    if (error) throw (await O.storage.from(ut).remove([videoPath]), error);
    if (I?.id !== userId) return;
    Ye(`Reference ${position} added`, 100);
    if (B?.id === folderId) await Ge(folderId);
  } catch (error) {
    if (I?.id === userId) Ye(Qo(error, prepared), 0);
  } finally {
    state.operations.delete(key);
    input.disabled = false;
  }
}
async function Zo(t, e, r, { allowImages: n = !1 } = {}) {
  if (!(n ? jc(t) : xt(t)))
    throw new Error("Choose an MP4, MOV, M4V, or WebM video.");
  const s = Ag(t);
  if (t.size <= ug) {
    r(5);
    const { error: i } = await O.storage
      .from(ut)
      .upload(e, t, { cacheControl: "31536000", contentType: s, upsert: !1 });
    if (i) throw i;
    r(100);
  } else await Cv(t, e, r, s);
  Pu(e, t, te(t.name))
    .then(yu)
    .catch(() => {});
}
async function Cv(t, e, r, n = qc(t)) {
  const {
    data: { session: s },
    error: i,
  } = await O.auth.getSession();
  if (i || !s)
    throw i || new Error("Your session expired. Please sign in again.");
  const a = `https://${new URL(Oo).hostname.split(".")[0]}.storage.supabase.co/storage/v1/upload/resumable`;
  return new Promise((l, c) => {
    new Mm(t, {
      endpoint: a,
      retryDelays: [0, 3e3, 5e3, 1e4, 2e4],
      headers: {
        authorization: `Bearer ${s.access_token}`,
        "x-upsert": "false",
      },
      uploadDataDuringCreation: !0,
      removeFingerprintOnSuccess: !0,
      storeFingerprintForResuming: !1,
      metadata: {
        bucketName: ut,
        objectName: e,
        contentType: n,
        cacheControl: "31536000",
      },
      chunkSize: 6291456,
      onError: c,
      onProgress: (d, f) => r(f ? (d / f) * 100 : 0),
      onSuccess: l,
    }).start();
  });
}
async function Iv(t, e) {
  const r = F.findIndex((o) => o.id === t);
  if (r < 0) return;
  const n = e === "up" ? r - 1 : r + 1;
  if (n < 0 || n >= F.length) return;
  const s = [...F],
    [i] = s.splice(r, 1);
  s.splice(n, 0, i);
  for (let o = 0; o < s.length; o += 1) {
    const a = o + 1;
    if (s[o].sort_order === a) continue;
    const { error: l } = await O.from("exercises")
      .update({ sort_order: a })
      .eq("exercise_group", s[o].id);
    if (l) {
      alert(l.message);
      break;
    }
  }
  await Ge(B.id);
}
async function Lv(id, videoPath, groupId) {
  const userId = I?.id,
    state = mediaSafetyState(userId),
    key = `reference:${id}`;
  const group = F.find((entry) => entry.id === groupId),
    folderId = B?.id,
    revision = Re;
  if (
    !userId ||
    !group ||
    group.videos.length <= 1 ||
    state.operations.has(key)
  )
    return;
  state.operations.add(key);
  try {
    if (!confirm("Remove this reference video?")) return;
    await mediaDeleteDatabaseRows("exercises", "id", id, userId);
    const cleanup = mediaQueueCleanup(userId, [videoPath]);
    cleanup.then((clean) => mediaCleanupNotice("Reference", clean, userId));
    vi([videoPath]);
    if (I?.id !== userId) return;
    if (B?.id === folderId) {
      F = F.map((entry) =>
        entry.id === groupId
          ? {
              ...entry,
              videos: entry.videos
                .filter((video) => video.id !== id)
                .map((video, index) => ({ ...video, video_order: index + 1 })),
            }
          : entry,
      );
      fu(
        folderId,
        F.flatMap((entry) => entry.videos),
      );
      if (Re === revision) yr(F);
    }
    mediaRenumberReferences(groupId, userId);
  } catch (error) {
    if (I?.id === userId)
      alert(
        ie(error)
          ? "Couldn’t confirm removal. Your reference has been kept. Reconnect and try again."
          : error.message,
      );
  } finally {
    state.operations.delete(key);
  }
}
async function Dv(groupId) {
  const userId = I?.id,
    state = mediaSafetyState(userId),
    key = `exercise:${groupId}`;
  const groups = [...F],
    group = groups.find((entry) => entry.id === groupId),
    folderId = B?.id,
    revision = Re;
  if (!userId || !group || !folderId || state.operations.has(key)) return;
  state.operations.add(key);
  try {
    if (
      !confirm(
        `Delete ${group.name} and its ${group.videos.length} video${group.videos.length === 1 ? "" : "s"}?`,
      )
    )
      return;
    const paths = group.videos.map((entry) => entry.video_path).filter(Boolean);
    await mediaDeleteDatabaseRows(
      "exercises",
      "exercise_group",
      groupId,
      userId,
    );
    const cleanup = mediaQueueCleanup(userId, paths);
    cleanup.then((clean) => mediaCleanupNotice("Exercise", clean, userId));
    vi(paths);
    if (I?.id !== userId) return;
    if (Rt)
      O.from("exercise_weight_log")
        .delete()
        .eq("exercise_group", groupId)
        .eq("user_id", userId)
        .then(
          () => {},
          () => {},
        );
    const workout = j || zt();
    if (workout?.folderId === folderId) {
      const remaining = groups.filter((entry) => entry.id !== groupId);
      if (!remaining.length) gi();
      else {
        const setsDone = { ...(workout.setsDone || {}) };
        delete setsDone[groupId];
        const next = {
          ...workout,
          setsDone,
          completedGroupIds: workout.completedGroupIds.filter(
            (id) => id !== groupId,
          ),
          backupGroupIds: (workout.backupGroupIds || []).filter(
            (id) => id !== groupId,
          ),
        };
        if (next.currentGroupId === groupId) {
          const index = groups.findIndex((entry) => entry.id === groupId),
            current =
              remaining[Math.min(Math.max(index, 0), remaining.length - 1)];
          next.currentGroupId = current.id;
          next.currentIndex = remaining.indexOf(current);
        }
        Ze(next);
      }
    }
    if (B?.id === folderId) {
      F = F.filter((entry) => entry.id !== groupId);
      fu(
        folderId,
        F.flatMap((entry) => entry.videos),
      );
      $e = $e.map((entry) =>
        entry.id === folderId ? { ...entry, count: F.length } : entry,
      );
      K();
      if (Re === revision) yr(F);
    }
  } catch (error) {
    if (I?.id === userId)
      alert(
        ie(error)
          ? "Couldn’t confirm deletion. Your videos have been kept. Reconnect and try again."
          : error.message,
      );
  } finally {
    state.operations.delete(key);
  }
}
async function Uv() {
  const userId = I?.id,
    folder = B,
    state = mediaSafetyState(userId),
    revision = Re;
  if (!userId || !folder) return;
  const key = `folder:${folder.id}`;
  if (state.operations.has(key)) return;
  state.operations.add(key);
  try {
    if (!confirm(`Delete ${folder.name} and every exercise/video inside it?`))
      return;
    // Keep the exact object list before the confirmed folder delete cascades.
    const allRows = [];
    for (let offset = 0; ; offset += 500) {
      if (I?.id !== userId)
        throw new Error(
          "Your account changed. Please try again after signing in.",
        );
      const rows = await yi(
        O.from("exercises")
          .select("id,video_path")
          .eq("folder_id", folder.id)
          .eq("user_id", userId)
          .order("id", { ascending: true })
          .range(offset, offset + 499),
        20000,
      );
      if (rows.error) throw rows.error;
      if (!Array.isArray(rows.data))
        throw new Error("The workout could not be loaded. Please try again.");
      allRows.push(...rows.data);
      if (rows.data.length < 500) break;
    }
    const paths = [
      ...new Set(allRows.map((entry) => entry.video_path).filter(Boolean)),
    ];
    await mediaDeleteDatabaseRows("folders", "id", folder.id, userId);
    const cleanup = mediaQueueCleanup(userId, paths);
    cleanup.then((clean) => mediaCleanupNotice("Workout", clean, userId));
    vi(paths);
    if (I?.id !== userId) return;
    if ((j || zt())?.folderId === folder.id) gi();
    $e = $e.filter((entry) => entry.id !== folder.id);
    Mt = Mt.filter((entry) => entry.folder_id !== folder.id);
    pt = pt.filter((entry) => entry.folder_id !== folder.id);
    fu(folder.id, []);
    K();
    if (B?.id === folder.id && Re === revision) mr();
  } catch (error) {
    if (I?.id === userId)
      alert(
        ie(error)
          ? "Couldn’t confirm deletion. Your videos have been kept. Reconnect and try again."
          : error.message,
      );
  } finally {
    state.operations.delete(key);
  }
}
function jv() {
  return {
    folderId: B.id,
    currentIndex: 0,
    currentGroupId: F[0]?.id || null,
    setsDone: {},
    completedGroupIds: [],
    backupGroupIds: [],
    status: "active",
    updatedAt: Date.now(),
  };
}
function Du() {
  if (!B || !F.length) return;
  Ie = !1;
  const t = j || zt();
  (t?.folderId === B.id ? ((j = t), (j.status = "active")) : (j = jv()),
    Jn(),
    Ze(),
    (oe = !0),
    Xn(),
    br());
}
function Si(t) {
  !j ||
    !F.length ||
    ((j.currentIndex = Ee(t, 0, F.length - 1)),
    (j.currentGroupId = F[j.currentIndex].id));
}
function Jn() {
  if (!j || !F.length) return null;
  const t = j.currentGroupId
    ? F.findIndex((e) => e.id === j.currentGroupId)
    : -1;
  return (Si(t >= 0 ? t : j.currentIndex), F[j.currentIndex]);
}
function lr(t) {
  return !!j?.completedGroupIds?.includes(t);
}
function ea(t) {
  const e = F.length;
  for (let r = 1; r <= e; r += 1) {
    const n = (t + r) % e;
    if (!lr(F[n].id)) return n;
  }
  return -1;
}
function Nv(t) {
  const e = t.videos.filter((i) => i.signedUrl);
  if (!e.length) return "";
  const r = (i, o, a) =>
    `<video controls playsinline webkit-playsinline muted loop ${a ? 'autoplay preload="auto"' : 'preload="none"'} src="${T(i.signedUrl)}" aria-label="${T(t.name)} reference video ${o + 1}"></video>`;
  if (e.length === 1)
    return `
      <div class="workout-video-frame">${r(e[0], 0, !0)}</div>`;
  const n = e
      .map(
        (i, o) => `
    <button type="button" class="video-tab ${o === 0 ? "active" : ""}" data-video-tab="${o}" aria-pressed="${o === 0}">Video ${o + 1}</button>`,
      )
      .join(""),
    s = e
      .map(
        (i, o) => `
    <div class="workout-video-frame ${o === 0 ? "" : "hidden"}" data-video-panel="${o}">${r(i, o, o === 0)}</div>`,
      )
      .join("");
  return `
    <div class="video-switcher" data-video-switcher>
      <div class="video-tabs" role="group" aria-label="Reference videos">${n}</div>
      ${s}
    </div>`;
}
function qv(t, e, r) {
  return Array.from({ length: t.sets_target }, (n, s) => {
    const i = r || s < e,
      o = !r && s === e,
      a = i ? `Set ${s + 1} done. Tap to undo.` : `Mark set ${s + 1} done`;
    return `<button type="button" class="set-dot ${i ? "done" : ""} ${o ? "current" : ""}" data-set-dot="${s}" aria-label="${a}">${i ? "&#10003;" : s + 1}</button>`;
  }).join("");
}
function Bv(t, e) {
  const r = F.find((i) => i.id === t);
  if (!r || !j) return;
  const n = Ee(e, 0, r.sets_target);
  j.setsDone[t] = n;
  const s = new Set(j.completedGroupIds);
  (n >= r.sets_target ? s.add(t) : s.delete(t),
    (j.completedGroupIds = [...s]),
    Ze(),
    br());
}
function br() {
  oe = !0;
  const t = Jn();
  if (!t) {
    yr(F);
    return;
  }
  if (ue) {
    Su();
    return;
  }
  const e = lr(t.id),
    r = Ee(Number(j.setsDone[t.id] || 0), 0, t.sets_target),
    n = Math.min(r + 1, t.sets_target),
    s = F.filter((g) => lr(g.id)).length,
    i = s === F.length,
    o = F.length ? (s / F.length) * 100 : 0,
    a = F.every((g) => g.id === t.id || lr(g.id)),
    l = n >= t.sets_target;
  let c = `SET ${n} DONE → 2:30`;
  (l && !a && (c = "FINISH → 2:30"),
    l && a && (c = "FINISH WORKOUT"),
    e && (c = i ? "FINISH WORKOUT" : "DONE"));
  const u = e && !i,
    d = [t.cue_1, t.cue_2, t.cue_3].filter(Boolean),
    f = !e && ea(j.currentIndex) !== -1,
    h = ao;
  ao = "";
  const y = j.backupGroupIds?.includes(t.id),
    v = y && t.backup_exercise ? t.backup_exercise : t.name;
  (re(
    `
    <section class="workout-mode-header">
      <details class="workout-exit-menu">
        <summary>•••</summary>
        <div class="workout-exit-actions">
          <button type="button" class="secondary-button" id="exit-workout">PAUSE</button>
          <button type="button" class="danger-button" id="cancel-workout">CANCEL</button>
        </div>
      </details>
      <div class="workout-position">${j.currentIndex + 1} / ${F.length}</div>
    </section>
    <div class="workout-progress" role="progressbar" aria-label="Workout progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${o}"><span style="width:${o}%"></span></div>

    <article class="focus-card">
      <h2>${T(v)}</h2>
      <div class="focus-prescription">${t.sets_target} × ${T(t.reps_target)}${t.last_weight ? ` · ${T(t.last_weight)}` : ""}</div>

      ${d.length ? _v(t) : ""}

      ${Nv(t)}

      ${h ? `<div class="skip-notice" role="status">${T(h)}</div>` : ""}

      ${t.backup_exercise ? `<button type="button" class="backup-toggle ${y ? "active" : ""}" id="toggle-backup">${y ? `BACKUP · ${T(t.backup_exercise)}` : `BACKUP · ${T(t.backup_exercise)}`}</button>` : ""}
      ${f ? '<button type="button" class="skip-exercise" id="skip-exercise">SKIP MACHINE</button>' : ""}

      <div class="set-section">
        <div class="set-topline">
          <div>
            <div class="eyebrow">SETS</div>
            <div class="set-label">${e ? "DONE" : `SET ${n} / ${t.sets_target}`}</div>
          </div>
          <label class="weight-inline">
            <span>WEIGHT</span>
            <input id="workout-weight" type="text" maxlength="40" value="${T(t.last_weight)}" placeholder="" inputmode="decimal" />
          </label>
        </div>
        <div class="set-dots">${qv(t, r, e)}</div>
        <div id="weight-status" class="micro-status" aria-live="polite"></div>
        ${gv(t)}
      </div>

      <button type="button" id="complete-set" class="big-action" ${u ? "disabled" : ""}>${T(c)}</button>

      <div class="workout-nav">
        <button type="button" class="secondary-button" id="previous-exercise" ${j.currentIndex === 0 ? "disabled" : ""}>← PREV</button>
        ${e ? '<button type="button" class="secondary-button" id="reopen-exercise">REOPEN</button>' : ""}
        <button type="button" class="secondary-button" id="next-exercise" ${j.currentIndex === F.length - 1 ? "disabled" : ""}>NEXT →</button>
      </div>
    </article>`,
    { title: `${B.name}`, showAccount: !1 },
  ),
    document.querySelector("#exit-workout").addEventListener("click", Kv),
    document.querySelector("#cancel-workout").addEventListener("click", zv),
    document
      .querySelector("#toggle-backup")
      ?.addEventListener("click", () => Mv(t.id)),
    document.querySelector("#skip-exercise")?.addEventListener("click", Gv),
    document.querySelector("#complete-set").addEventListener("click", () => {
      if (i) {
        (ra(), Uu());
        return;
      }
      Hv();
    }),
    document.querySelectorAll("[data-set-dot]").forEach((g) => {
      g.addEventListener("click", () => {
        const m = Number(g.dataset.setDot),
          k = e ? t.sets_target : r;
        Bv(t.id, m < k ? m : m + 1);
      });
    }),
    document
      .querySelector("#previous-exercise")
      .addEventListener("click", () => Cl(-1)),
    document
      .querySelector("#next-exercise")
      .addEventListener("click", () => Cl(1)));
  const _ = document.querySelector("#reopen-exercise");
  _ && _.addEventListener("click", Vv);
  const R = document.querySelector("#workout-weight");
  (R.addEventListener("input", () => {
    t.last_weight = R.value;
  }),
    R.addEventListener("change", () => Wv(t.id, R.value)),
    R.addEventListener("keydown", (g) => {
      g.key === "Enter" && (g.preventDefault(), R.blur());
    }),
    Fv(),
    Xn());
}
function Mv(t) {
  if (!j) return;
  const e = new Set(j.backupGroupIds || []);
  (e.has(t) ? e.delete(t) : e.add(t), (j.backupGroupIds = [...e]), Ze(), br());
}
function Fv() {
  const t = document.querySelector("[data-video-switcher]");
  if (!t) return;
  const e = [...t.querySelectorAll("[data-video-tab]")],
    r = [...t.querySelectorAll("[data-video-panel]")];
  e.forEach((n) => {
    n.addEventListener("click", () => {
      const s = n.dataset.videoTab;
      (e.forEach((i) => {
        i.classList.toggle("active", i === n);
        i.setAttribute("aria-pressed", String(i === n));
      }),
        r.forEach((i) => {
          const o = i.dataset.videoPanel === s;
          i.classList.toggle("hidden", !o);
          const a = i.querySelector("video");
          o ? a?.play()?.catch?.(() => {}) : a?.pause();
        }));
    });
  });
}
async function Wv(t, e) {
  const r = String(e || "")
      .trim()
      .slice(0, 40),
    n = document.querySelector("#weight-status"),
    s = F.find((c) => c.id === t);
  s &&
    ((s.last_weight = r),
    s.videos.forEach((c) => {
      c.last_weight = r;
    }),
    B &&
      fu(
        B.id,
        F.flatMap((c) => c.videos),
      ));
  const i = J();
  if (
    ((i.weights[t] = r),
    we(i),
    s && oe && Number(j?.setsDone?.[t] || 0) > 0 && Iu(s),
    navigator.onLine === !1)
  ) {
    n && (n.textContent = "Saved on this phone · syncs later");
    return;
  }
  n && (n.textContent = "SAVING...");
  let o = null;
  try {
    o = (
      await yi(
        O.from("exercises").update({ last_weight: r }).eq("exercise_group", t),
        Po * 2,
      )
    ).error;
  } catch (c) {
    o = c;
  }
  const a = document.querySelector("#weight-status");
  if (o) {
    a && (a.textContent = "Saved on this phone · syncs later");
    return;
  }
  const l = J();
  (l.weights[t] === r && delete l.weights[t],
    we(l),
    a && (a.textContent = "Saved"));
}
function Hv() {
  const t = Date.now();
  if (t - wl < bg) return;
  ((wl = t), ra());
  const e = Jn();
  if (!e || lr(e.id)) return;
  const r = Ee(Number(j.setsDone[e.id] || 0), 0, e.sets_target),
    n = Math.min(e.sets_target, r + 1);
  if (((j.setsDone[e.id] = n), Iu(e), n >= e.sets_target)) {
    lr(e.id) || j.completedGroupIds.push(e.id);
    const s = ea(j.currentIndex);
    if (s === -1) {
      (Ze(), Uu());
      return;
    }
    (Si(s), Ze(), vo(!0));
    return;
  }
  (Ze(), vo(!0));
}
function Gv() {
  const t = Jn();
  if (!t || lr(t.id)) return;
  const e = ea(j.currentIndex);
  if (e === -1) return;
  const r =
    j.backupGroupIds?.includes(t.id) && t.backup_exercise
      ? t.backup_exercise
      : t.name;
  (Si(e),
    Ze(),
    (ao = `${r} skipped. It comes back before the workout ends.`),
    br());
}
function Cl(t) {
  j && (Si(j.currentIndex + t), Ze(), br());
}
function Vv() {
  const t = Jn();
  t &&
    ((j.completedGroupIds = j.completedGroupIds.filter((e) => e !== t.id)),
    (j.setsDone[t.id] = Math.max(0, t.sets_target - 1)),
    Ze(),
    br());
}
function zv() {
  confirm("Cancel workout?") && (gi(), Nu(), (oe = !1), (Ie = !1), jn(), yr(F));
}
function Kv() {
  if ((ue && Xv(), !j)) {
    yr(F);
    return;
  }
  ((j.status = "paused"), Ze(), (oe = !1), yr(F));
}
async function Jv(t, e) {
  !I || !bi() || !t || (Jo(e, t, !0), K(), await Lt());
}
function Uu() {
  const t = B?.id;
  t && Jv(t, U());
  const e = Zg();
  if ((gi(), Nu(), (oe = !1), jn(), e)) {
    ((B = null), (F = []), ze(), Xs());
    return;
  }
  (re(
    `
    <section class="finish-card">
      <div class="finish-check">&#10003;</div>
      <h2>${T(B.name)} · DONE.</h2>
      <button type="button" class="start-workout-button" id="finish-home">Done</button>
    </section>`,
    { title: "Workout complete", showAccount: !1, showTimer: !1 },
  ),
    document.querySelector("#finish-home").addEventListener("click", () => {
      (Pt(), Xs());
    }));
}
function Yv() {
  document.querySelector("#timer-toggle")?.addEventListener("click", () => {
    (ra(), vo(!0));
  });
}
function Yn() {
  return ue ? Math.max(0, Math.ceil((ue - Date.now()) / 1e3)) : Xe;
}
function ju(t) {
  const e = Ee(Number.isFinite(t) ? t : 0, 0, 3599);
  return `${Math.floor(e / 60)}:${String(e % 60).padStart(2, "0")}`;
}
function vo(t = !1) {
  const e = t || Xe <= 0;
  (t && (vr(), (Xe = dr), (ue = null)),
    (e || !le.length) && wu(),
    Xe <= 0 && (Xe = dr),
    (ue = Date.now() + Xe * 1e3),
    vr(),
    (hn = window.setInterval(qu, 250)),
    zn(),
    Su());
}
function Xv() {
  ((Xe = Yn()), (ue = null), vr(), zn(), Fo(!1));
}
function Nu() {
  ((ue = null), (Xe = dr), vr(), zn(), Fo(!0));
}
function qu() {
  if (Yn() <= 0) {
    ((ue = null),
      (Xe = dr),
      vr(),
      zn(),
      Fo(!0),
      Qv(),
      window.setTimeout(py, 180));
    return;
  }
  ta();
}
function vr() {
  (hn && window.clearInterval(hn), (hn = null));
}
function ta() {
  const t = Yn(),
    e = ju(t),
    r = document.querySelector("#timer-mini"),
    n = document.querySelector("#timer-value");
  (r && (r.textContent = ue ? e : "2:30"), n && (n.textContent = e));
}
function ra() {
  try {
    const t = window.AudioContext || window.webkitAudioContext;
    if (!t) return;
    ((nt = nt || new t()),
      nt.state === "suspended" && nt.resume().catch(() => {}));
  } catch {}
}
function Qv() {
  try {
    if (!nt) return;
    nt.state === "suspended" && nt.resume().catch(() => {});
    const t = nt.currentTime + 0.02;
    [0, 0.22, 0.44].forEach((e, r) => {
      const n = nt.createOscillator(),
        s = nt.createGain();
      (n.connect(s),
        s.connect(nt.destination),
        (n.frequency.value = r === 2 ? 988 : 740),
        s.gain.setValueAtTime(1e-4, t + e),
        s.gain.exponentialRampToValueAtTime(0.18, t + e + 0.02),
        s.gain.exponentialRampToValueAtTime(1e-4, t + e + 0.18),
        n.start(t + e),
        n.stop(t + e + 0.2));
    });
  } catch {}
}
let wo = !1,
  ji = !1;
async function Xn() {
  if (
    ((wo = !0),
    !(
      er ||
      ji ||
      !("wakeLock" in navigator) ||
      document.visibilityState !== "visible"
    ))
  ) {
    ji = !0;
    try {
      const t = await navigator.wakeLock.request("screen");
      if (!wo) {
        t.release().catch(() => {});
        return;
      }
      ((er = t),
        t.addEventListener("release", () => {
          er === t && (er = null);
        }));
    } catch {
      er = null;
    } finally {
      ji = !1;
    }
  }
}
function jn() {
  wo = !1;
  const t = er;
  ((er = null), t?.release?.().catch?.(() => {}));
}
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") return;
  (oe || ue) && Xn();
  baUpdateDay();
  I &&
    bs &&
    Date.now() - bs > 660 * 60 * 1e3 &&
    ((bs = Date.now()),
    oe && B && !ue ? Ge(B.id, { mode: "workout" }) : Cn().catch(() => {}));
});
document.addEventListener("selectstart", (t) => {
  (t.target?.nodeType === Node.TEXT_NODE
    ? t.target.parentElement
    : t.target
  )?.closest?.(".calendar-grid, .rest-lock-screen") && t.preventDefault();
});
window.addEventListener("online", () => {
  (Lt(), Ht && Xs());
});
function Zv() {
  ((Re += 1),
    (G = "boot"),
    (ot.innerHTML = `
    <main class="shell boot-shell">
      <div class="brand-name">battle angel</div>
      <div class="boot-pulse" aria-label="Loading"></div>
    </main>`));
}
function Bu(t) {
  const e = t && $e.find((r) => r.id === t.folderId);
  return e && t.status === "active" && Date.now() - t.updatedAt < vg ? e : null;
}
async function Ni(t) {
  const e = Bu(t);
  if (e) {
    await Ge(e.id, { mode: "workout" });
    return;
  }
  (t?.status === "active" && ((t.status = "paused"), Ze(t)), ee());
}
function ew() {
  try {
    const t = new URL(Oo).hostname.split(".")[0],
      e = JSON.parse(
        window.localStorage.getItem(`sb-${t}-auth-token`) || "null",
      );
    return e?.user?.id ? e.user : null;
  } catch {
    return null;
  }
}
async function tw() {
  baInitialize();
  const t = ew(),
    e = !!(t && Zr(`battle-angel-snapshot-${t.id}`, null));
  let r = null;
  if (e) ((I = t), (r = O.auth.getSession()));
  else {
    const {
      data: { session: n },
    } = await O.auth.getSession();
    I = n?.user || null;
  }
  if (!I) ho();
  else {
    mediaSafetyInit();
    lu();
    const n = await oy();
    if (((Ht = n && navigator.onLine === !1), n)) {
      j = zt();
      try {
        await Ni(j);
      } catch (a) {
        ee(a.message);
      }
      const s = Re,
        i = Ys(),
        o = j?.updatedAt || 0;
      try {
        if (r) {
          const {
            data: { session: c },
            error: u,
          } = await r;
          if (!c) {
            if (u && ie(u)) throw u;
            ((I = null),
              ho(u ? "Please sign in again." : ""),
              O.auth.onAuthStateChange((d, f) => {
                window.setTimeout(() => Il(f), 0);
              }));
            return;
          }
          I = c.user;
        }
        await Vr();
        const a = await uo(),
          l = (a?.updatedAt || 0) > o;
        Re === s &&
          ["day", "day-overview", "home"].includes(G) &&
          (Ys() !== i || l) &&
          (l && Bu(a)
            ? await Ni(a)
            : ["day", "day-overview"].includes(G)
              ? ee()
              : Pt());
      } catch (a) {
        (console.warn("Working offline:", a),
          (Ht = !0),
          Re === s && ["day", "day-overview"].includes(G)
            ? ee()
            : Re === s && G === "home" && Pt());
      }
    } else {
      Zv();
      try {
        await Vr();
        const s = await uo();
        await Ni(s);
      } catch (s) {
        ee(s.message);
      }
    }
  }
  O.auth.onAuthStateChange((n, s) => {
    (!s && n !== "SIGNED_OUT" && I) || window.setTimeout(() => Il(s), 0);
  });
}
async function Il(t) {
  const e = t?.user || null;
  if (e?.id !== I?.id) {
    baActionArchive = [];
    baActionFilter = "all";
    baActionSearch = "";
    baSyncError = "";
    baStorageError = false;
    if (
      ((I = e),
      (B = null),
      (F = []),
      (oe = !1),
      (j = null),
      (fr = !0),
      (io = Promise.resolve()),
      (Mt = []),
      (pt = []),
      (Fe = []),
      (yt = !0),
      (Fs = !0),
      (Br = !0),
      (Be = !0),
      (Rt = !0),
      (sr = []),
      (se = []),
      (Se = null),
      ($t = !0),
      (_e = []),
      (ke = []),
      (Le = U()),
      (ct = !0),
      (Y = []),
      (de = []),
      (mt = U()),
      (De = !0),
      (X = null),
      (fn = new Map()),
      (Ht = !1),
      vr(),
      (ue = null),
      (Xe = dr),
      !I)
    ) {
      ho();
      return;
    }
    try {
      (mediaSafetyInit(), lu(), await Vr(), await uo(), ee());
    } catch (r) {
      ee(r.message);
    }
  }
}
"serviceWorker" in navigator &&
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .catch((t) => console.warn("Offline shell unavailable:", t));
  });
window.addEventListener("error", (t) => {
  !ot ||
    (ot.textContent.trim() && G !== "boot") ||
    (ot.innerHTML = `<main class="shell"><div class="notice error"><strong>battle angel could not open.</strong><br>${T(t?.error?.message || t?.message || "Refresh the app.")}</div></main>`);
});
window.addEventListener("unhandledrejection", (t) => {
  if (!ot || ot.textContent.trim()) return;
  const e = t?.reason?.message || String(t?.reason || "Refresh the app.");
  ot.innerHTML = `<main class="shell"><div class="notice error"><strong>battle angel could not open.</strong><br>${T(e)}</div></main>`;
});
let baActionArchive = [];

let baSyncError = "";

let baStorageError = false;

let baSyncRetry = null;

let baSyncAgain = false;

let baToastTimer = null;

let baInitialized = false;

let baActionFilter = "all";

let baActionSearch = "";

let baCaptureDraft = "";

let baCaptureDate = "";

function baIcon(name) {
  const paths = {
    momentum: '<path d="m13 2-9 12h7l-1 8 10-12h-7z"/>',
    body: '<path d="m6.5 6.5 11 11M4 9l5-5M15 20l5-5M2 7l5-5M17 22l5-5M8 16l8-8"/>',
    changed: '<path d="M12 20h9M16 3a2.1 2.1 0 0 1 3 3L8 17l-4 1 1-4z"/>',
    more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    calendar:
      '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M16 3v4M8 3v4M3 11h18"/>',
    eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    repeat:
      '<path d="m17 2 4 4-4 4M3 11V8a2 2 0 0 1 2-2h16M7 22l-4-4 4-4M21 13v3a2 2 0 0 1-2 2H3"/>',
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.check}</svg>`;
}

function baToast(message, undo = null) {
  clearTimeout(baToastTimer);
  document.querySelector("#ba-toast")?.remove();
  const el = document.createElement("div");
  el.id = "ba-toast";
  el.className = "ba-toast";
  el.setAttribute("role", "status");
  const text = document.createElement("span");
  text.textContent = message;
  el.append(text);
  if (undo) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Undo";
    button.addEventListener("click", () => {
      clearTimeout(baToastTimer);
      el.remove();
      undo();
    });
    el.append(button);
  }
  const close = document.createElement("button");
  close.type = "button";
  close.className = "ba-toast-close";
  close.setAttribute("aria-label", "Dismiss message");
  close.textContent = "×";
  close.addEventListener("click", () => el.remove());
  el.append(close);
  document.body.append(el);
  if (!undo) baToastTimer = setTimeout(() => el.remove(), 6000);
}

function baQueueCount() {
  if (!I) return 0;
  const p = J();
  return (
    Object.keys(p.weights).length +
    p.completions.length +
    p.uncompletions.length +
    Object.keys(p.weightLogs).length +
    Object.keys(p.dailyProgressByDate).length +
    Object.keys(p.medToggles).length +
    Object.keys(p.powerPlanWrites).length +
    Object.keys(p.powerTodoWrites).length
  );
}

function baUpdateSyncStatus() {
  const el = document.querySelector("#ba-sync-status");
  if (!el) return;
  const count = baQueueCount(),
    storageMessage =
      "Your device could not save changes. Keep this app open and make a backup.";
  const message = baStorageError
    ? storageMessage
    : baSyncError
      ? "Saved on this device · sync needs attention"
      : navigator.onLine === false
        ? count
          ? "Offline · changes saved on this device"
          : "Offline · using your saved data"
        : count
          ? "Saved on this device · syncing…"
          : "";
  el.textContent = message;
  el.hidden = !message;
  el.classList.toggle("is-error", baStorageError);
  const details = document.querySelector("#ba-sync-detail");
  if (details)
    details.textContent = baStorageError
      ? storageMessage
      : baSyncError ||
        (count
          ? `${count} changes waiting to sync.`
          : "Your changes are synced.");
}

async function baReadPowerTable(table, columns) {
  if (!I) return [];
  const userId = I.id,
    rows = [];
  for (let start = 0; start < 50000; start += 500) {
    if (I?.id !== userId) throw new Error("Account changed");
    const result = await O.from(table)
      .select(columns)
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(start, start + 499);
    if (I?.id !== userId) throw new Error("Account changed");
    if (result.error) throw result.error;
    rows.push(...(result.data || []));
    if ((result.data || []).length < 500) return rows;
  }
  throw new Error(
    "Your action list is too large to load in one session. Your data is still saved.",
  );
}

function baValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && pr(Gt(value)) === value;
}

function baDateLabel(value) {
  if (!baValidDate(value)) return "Choose a day";
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(value.slice(0, 4) !== U().slice(0, 4) ? { year: "numeric" } : {}),
  }).format(Gt(value));
}

function baAssignedPlan(todoId) {
  return (
    de
      .filter((row) => row.todo_id === todoId && row.status === "pending")
      .sort((a, b) => a.action_date.localeCompare(b.action_date))[0] || null
  );
}

function baTodoPayload(todo) {
  return {
    id: todo.id,
    title: todo.title,
    sort_order: Number(todo.sort_order) || 0,
    completed_at: todo.completed_at || null,
    created_at: todo.created_at || new Date().toISOString(),
    updated_at: todo.updated_at || new Date().toISOString(),
  };
}

function baPutTodo(todo, pending = J()) {
  pending.powerTodoWrites[todo.id] = {
    operation: "upsert",
    payload: baTodoPayload(todo),
    updated_at: todo.updated_at,
  };
  return pending;
}

function baCommitPowerState(pending, todos, plans) {
  if (!we(pending)) return false;
  baPowerRevision += 1;
  const merged = Jc(todos, plans);
  Y = merged.todos;
  baActionArchive = merged.allTodos.filter((row) => row.completed_at);
  de = merged.plans;
  K();
  Lt();
  return true;
}

function baAssignDate(todoId, date, render = true) {
  const todo = It(todoId);
  if (!todo) return false;
  if (date && (!baValidDate(date) || date < U())) {
    baToast("Choose today or a future date.");
    return false;
  }
  const pending = J(),
    now = new Date().toISOString(),
    existing = de.filter(
      (row) => row.todo_id === todoId && row.status === "pending",
    ),
    matching = date
      ? de.find((row) => row.todo_id === todoId && row.action_date === date)
      : null;
  let target = date
    ? {
        ...(matching || existing[0] || {}),
        id: matching?.id || existing[0]?.id || crypto.randomUUID(),
        todo_id: todoId,
        action_date: date,
        status: "pending",
        sort_order:
          matching?.sort_order ||
          Math.max(
            0,
            ...de
              .filter((row) => row.action_date === date)
              .map((row) => Number(row.sort_order) || 0),
          ) + 1,
        started_at: null,
        created_at: matching?.created_at || now,
        updated_at: now,
      }
    : null;
  let plans = de.filter((row) => !existing.some((old) => old.id === row.id));
  for (const old of existing)
    if (old.id !== target?.id)
      pending.powerPlanWrites[old.id] = {
        operation: "delete",
        plan_id: old.id,
        todo_id: todoId,
        updated_at: now,
      };
  if (target) {
    plans = plans.filter((row) => row.id !== target.id);
    plans.push(target);
    pending.powerPlanWrites[target.id] = {
      ...target,
      operation: "upsert",
      plan_id: target.id,
      todo_title: todo.title,
    };
  }
  if (!baCommitPowerState(pending, [...Y, ...baActionArchive], plans))
    return false;
  const progress = z();
  if (date === U()) progress.day_mode = si;
  progress.stack_order = Ue(progress);
  progress.is_complete = Gn(progress) === 0 && !!progress.started_at;
  Ve(progress);
  if (render) In();
  return true;
}

function baCompleteTodo(todoId, render = true) {
  const todo = It(todoId);
  if (!todo) return false;
  const prior = { ...todo },
    priorPlans = de
      .filter((row) => row.todo_id === todoId)
      .map((row) => ({ ...row })),
    now = new Date().toISOString(),
    updated = { ...todo, completed_at: now, updated_at: now },
    pending = baPutTodo(updated);
  const plans = de.map((row) => {
    if (row.todo_id !== todoId || row.status !== "pending") return row;
    const next = { ...row, status: "done", updated_at: now };
    pending.powerPlanWrites[row.id] = {
      ...next,
      operation:
        pending.powerPlanWrites[row.id]?.operation === "upsert"
          ? "upsert"
          : "update",
      plan_id: row.id,
    };
    return next;
  });
  if (
    !baCommitPowerState(
      pending,
      [...Y.filter((row) => row.id !== todoId), ...baActionArchive, updated],
      plans,
    )
  )
    return false;
  const progress = z();
  progress.stack_order = Ue(progress);
  progress.is_complete = !!progress.started_at && Gn(progress) === 0;
  Ve(progress);
  if (render) baRenderCurrent();
  baToast("Action done", () => {
    baRestoreTodo(prior, priorPlans);
    baRenderCurrent();
  });
  return true;
}

function baRestoreTodo(todo, plans = null) {
  if (!todo) return;
  const now = new Date().toISOString(),
    updated = { ...todo, completed_at: null, updated_at: now },
    pending = baPutTodo(updated);
  let nextPlans = de;
  if (plans) {
    nextPlans = de.filter((row) => row.todo_id !== todo.id);
    for (const row of plans) {
      const next = { ...row, updated_at: now };
      nextPlans.push(next);
      pending.powerPlanWrites[row.id] = {
        ...next,
        operation: "upsert",
        plan_id: row.id,
      };
    }
  } else {
    const old = de.find(
      (row) => row.todo_id === todo.id && row.action_date === U(),
    );
    if (old) {
      const next = { ...old, status: "pending", updated_at: now };
      nextPlans = de.map((row) => (row.id === old.id ? next : row));
      pending.powerPlanWrites[old.id] = {
        ...next,
        operation: "upsert",
        plan_id: old.id,
      };
    }
  }
  baCommitPowerState(
    pending,
    [...Y, ...baActionArchive.filter((row) => row.id !== todo.id), updated],
    nextPlans,
  );
  const progress = z();
  progress.is_complete = false;
  progress.stack_order = Ue(progress);
  Ve(progress);
}

function baRenderCurrent() {
  if (G === "day-preview") Vo();
  else if (G === "day-runner") ze();
  else In();
}

function baCaptureKey() {
  return `battle-angel-capture-${I?.id || "anon"}`;
}

function baCaptureValue() {
  const draft = Zr(baCaptureKey(), {});
  return {
    title: typeof draft.title === "string" ? draft.title : "",
    date: baValidDate(draft.date) && draft.date >= U() ? draft.date : "",
  };
}

function baCaptureSave() {
  const title = document.querySelector("#power-todo-title")?.value || "",
    date = document.querySelector("#power-todo-date")?.value || "";
  Kn(baCaptureKey(), { title, date });
}

function baDateChoices(attribute, selected = "") {
  return Array.from({ length: 7 }, (_, offset) => {
    const date = gt(U(), offset);
    const label =
      offset === 0
        ? "Today"
        : new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(
            Gt(date),
          );
    return `<button type="button" ${attribute}="${date}" class="ba-day-choice ${selected === date ? "is-selected" : ""}" aria-label="${T(baDateLabel(date))}" aria-pressed="${selected === date}"><strong>${T(label)}</strong><span>${Gt(date).getDate()}</span></button>`;
  }).join("");
}

function baUpdateCaptureDate() {
  const date = document.querySelector("#power-todo-date")?.value || "",
    label = document.querySelector("#ba-capture-date-summary");
  if (label)
    label.innerHTML =
      baIcon("calendar") +
      `<span>${date ? T(baDateLabel(date)) : 'Assign a day<span class="ba-optional"> · optional</span>'}</span>`;
  document.querySelectorAll("[data-capture-date]").forEach((button) => {
    const chosen = button.dataset.captureDate === date;
    button.classList.toggle("is-selected", chosen);
    button.setAttribute("aria-pressed", String(chosen));
  });
}

function baOpenSchedule(todoId) {
  const todo = It(todoId);
  if (!todo) return;
  document.querySelector("#ba-date-dialog")?.remove();
  const opener = document.activeElement,
    dialog = document.createElement("dialog"),
    assigned = baAssignedPlan(todoId)?.action_date || "";
  dialog.id = "ba-date-dialog";
  dialog.className = "ba-dialog";
  dialog.setAttribute("aria-labelledby", "ba-date-title");
  dialog.innerHTML = `<div class="ba-dialog-head"><h2 id="ba-date-title">Choose a day</h2><button type="button" class="ba-dialog-close" aria-label="Close day picker">×</button></div><p class="ba-dialog-action">${T(todo.title)}</p><p class="ba-helper">Appears in Momentum on the day you choose.</p><div class="ba-week-choices">${baDateChoices("data-assign-date", assigned)}</div><form id="ba-date-form"><label for="ba-scheduled-date">Another date</label><div class="ba-custom-date"><input type="date" id="ba-scheduled-date" required min="${U()}" value="${assigned >= U() ? assigned : U()}"><button type="submit" class="primary-button">Set day</button></div></form><div class="ba-dialog-footer">${assigned ? '<button type="button" class="text-button" id="ba-unschedule">Clear assigned day</button>' : ""}<button type="button" class="secondary-button" id="ba-date-cancel">Cancel</button></div>`;
  document.body.append(dialog);
  const close = () => {
    dialog.close();
    dialog.remove();
    if (opener?.isConnected) opener.focus({ preventScroll: true });
  };
  const choose = (date) => {
    if (baAssignDate(todoId, date, false)) {
      close();
      baRenderCurrent();
      baToast(date ? `Assigned ${baDateLabel(date)}` : "Assigned day cleared");
    }
  };
  dialog.querySelector(".ba-dialog-close").addEventListener("click", close);
  dialog.querySelector("#ba-date-cancel").addEventListener("click", close);
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    close();
  });
  dialog
    .querySelectorAll("[data-assign-date]")
    .forEach((button) =>
      button.addEventListener("click", () => choose(button.dataset.assignDate)),
    );
  dialog
    .querySelector("#ba-unschedule")
    ?.addEventListener("click", () => choose(""));
  dialog.querySelector("#ba-date-form").addEventListener("submit", (event) => {
    event.preventDefault();
    choose(dialog.querySelector("#ba-scheduled-date").value);
  });
  dialog.showModal();
}

function baActionRows() {
  const today = U(),
    query = baActionSearch.trim().toLocaleLowerCase();
  const rows = Y.filter((todo) => {
    const date = baAssignedPlan(todo.id)?.action_date;
    return (
      (!query || todo.title.toLocaleLowerCase().includes(query)) &&
      (baActionFilter === "all" ||
        (baActionFilter === "today" && date === today) ||
        (baActionFilter === "planned" && date >= today) ||
        (baActionFilter === "unscheduled" && !date))
    );
  });
  if (!rows.length)
    return `<p class="ba-empty">${Y.length ? "No actions in this view." : "A clear space. Add an action whenever you need it."}</p>`;
  return rows
    .map((todo) => {
      const plan = baAssignedPlan(todo.id),
        date = plan?.action_date || "",
        label = date
          ? (date < today
              ? "Still open · "
              : date === today
                ? "Today · "
                : "") + baDateLabel(date)
          : "Assign day";
      return `<article class="ba-action-row" data-action-id="${todo.id}">
    <div class="ba-action-main"><strong class="ba-action-title">${T(todo.title)}</strong><button type="button" class="ba-done-button" data-power-complete="${todo.id}" aria-label="Mark ${T(todo.title)} done">${baIcon("check")}<span>Done</span></button></div>
    <div class="ba-action-meta"><button type="button" class="ba-date-badge ${date ? "is-assigned" : ""} ${date && date < today ? "is-earlier" : ""}" data-power-schedule="${todo.id}" aria-label="${T(todo.title)}: ${T(label)}">${baIcon("calendar")}${T(label)}</button>${date !== today ? `<button type="button" class="ba-today-button" data-power-today="${todo.id}">Today</button>` : ""}<details class="ba-action-edit"><summary aria-label="Edit ${T(todo.title)}">•••</summary><form data-power-todo-edit="${todo.id}"><label for="edit-action-${todo.id}">Action</label><input id="edit-action-${todo.id}" name="title" type="text" required maxlength="${Bn}" value="${T(todo.title)}"><div class="ba-edit-actions"><button type="submit" class="small-button">Save</button><button type="button" class="text-button danger-text" data-power-todo-delete="${todo.id}">Delete</button></div></form></details></div>
  </article>`;
    })
    .join("");
}

function baSignOut() {
  if (
    baQueueCount() &&
    !confirm(
      "Some changes are still saved only on this device. Sign out anyway?",
    )
  )
    return;
  baActionArchive = [];
  baActionFilter = "all";
  baActionSearch = "";
  document.querySelector("#ba-toast")?.remove();
  O.auth.signOut();
}

function baRefreshClock() {
  document.querySelectorAll("[data-ba-clock]").forEach((el) => {
    el.textContent = new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date());
  });
}

function baRestoreRoutine(id, old = null) {
  const progress = z();
  progress.completed_step_ids = progress.completed_step_ids.filter(
    (value) => value !== id,
  );
  progress.skipped_step_ids = progress.skipped_step_ids.filter(
    (value) => value !== id,
  );
  progress.substep_positions = {
    ...progress.substep_positions,
    [id]: old?.position || 0,
  };
  if (old?.skipped) progress.skipped_step_ids.push(id);
  if (old?.completed) progress.completed_step_ids.push(id);
  progress.is_complete = false;
  Ve(progress);
}

function baOpenFuture() {
  Je = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  X = U();
  Oe = "";
  ce();
}

function baUpdateDay() {
  baRefreshClock();
  baUpdateSyncStatus();
  if (!I || !Se) return;
  const day = U(),
    userId = I.id;
  if (Se.progress_date === day && Le === day && mt === day) return;
  if (Se.progress_date !== day) {
    Se = Hn(Kc(day), day);
    Ks();
    Js();
    ci(null);
    document.querySelector("#ba-toast")?.remove();
  }
  Le = day;
  ke = Pn([], day);
  mt = day;
  K();
  const refreshDayView = () => {
    if (
      [
        "day",
        "day-overview",
        "day-preview",
        "day-inbox",
        "day-plan",
        "day-power",
        "day-runner",
      ].includes(G)
    )
      In();
  };
  // Render from saved local state before any network work.
  refreshDayView();
  const revision = Re;
  if (navigator.onLine !== false) {
    Promise.allSettled([wr(), Hr(), Gr()]).then(() => {
      if (I?.id === userId && U() === day && Re === revision) refreshDayView();
    });
  }
}

function baInitialize() {
  if (baInitialized) return;
  baInitialized = true;
  window.addEventListener("offline", baUpdateSyncStatus);
  window.addEventListener("online", () => {
    baUpdateDay();
    baUpdateSyncStatus();
    Lt();
  });
  setInterval(baUpdateDay, 30000);
}

function reflectionState(userId = I?.id || "anonymous") {
  const users = reflectionState.users || (reflectionState.users = new Map());
  if (users.has(userId)) return users.get(userId);
  const state = { drafts: {}, busy: new Map(), durable: true, notice: "" };
  try {
    const saved = JSON.parse(
      window.localStorage.getItem(`battle-angel-reflection-drafts-${userId}`) ||
        "{}",
    );
    if (saved && typeof saved === "object" && !Array.isArray(saved)) {
      for (const [key, draft] of Object.entries(saved)) {
        if (
          (key === "new" || /^(board|story):.+$/.test(key)) &&
          draft &&
          typeof draft.body === "string"
        ) {
          state.drafts[key] = {
            body: draft.body,
            id: typeof draft.id === "string" ? draft.id : "",
            updatedAt: draft.updatedAt || "",
          };
        }
      }
    }
  } catch {
    state.durable = false;
  }
  users.set(userId, state);
  return state;
}

function reflectionPersistState(userId) {
  const state = reflectionState(userId);
  try {
    window.localStorage.setItem(
      `battle-angel-reflection-drafts-${userId}`,
      JSON.stringify(state.drafts),
    );
    state.durable = true;
  } catch {
    state.durable = false;
  }
  return state.durable;
}

function reflectionDraftKey(source, id) {
  return id ? `${source === "board" ? "board" : "story"}:${id}` : "new";
}

function reflectionDraftMessage(durable) {
  return durable
    ? "Draft saved on this device."
    : "Draft kept while this app stays open. Device storage is unavailable.";
}

function reflectionCapture(
  form = document.querySelector("[data-reflection-editor]"),
) {
  if (!form?.isConnected) return null;
  const userId = form.dataset.ownerId;
  const key = form.dataset.draftKey;
  const field = form.querySelector("textarea");
  if (!userId || !key || !field) return null;
  const state = reflectionState(userId);
  if (state.busy.has(key)) return state.drafts[key] || null;
  const body = field.value;
  const old = state.drafts[key];
  if (
    (key === "new" && body === "") ||
    (key !== "new" && body === form.reflectionOriginalBody)
  ) {
    delete state.drafts[key];
    reflectionPersistState(userId);
    return null;
  }
  state.drafts[key] = {
    body,
    id: old?.id || "",
    updatedAt: new Date().toISOString(),
  };
  reflectionPersistState(userId);
  return state.drafts[key];
}

function reflectionSetStatus(form, message, error = false) {
  if (!form?.isConnected || form.dataset.ownerId !== (I?.id || "anonymous"))
    return;
  const status = form.querySelector("[data-reflection-status]");
  if (status) {
    status.textContent = message;
    status.classList.toggle("is-error", error);
  }
}

function reflectionCurrentForm(userId, key) {
  const form = document.querySelector("[data-reflection-editor]");
  return form?.dataset.ownerId === userId && form.dataset.draftKey === key
    ? form
    : null;
}

function reflectionUpdateControls(form) {
  if (!form?.isConnected) return;
  const state = reflectionState(form.dataset.ownerId);
  const busy = state.busy.has(form.dataset.draftKey);
  const deleting = state.busy.get(form.dataset.draftKey) === "delete";
  const field = form.querySelector("textarea");
  const save = form.querySelector('button[type="submit"]');
  const remove = form.querySelector("[data-reflection-delete]");
  form.setAttribute("aria-busy", busy ? "true" : "false");
  if (field) field.readOnly = busy;
  if (save) {
    save.disabled = busy || !field?.value.trim();
    save.textContent =
      busy && !deleting
        ? "Saving…"
        : form.dataset.entryId
          ? "Save changes"
          : "Save entry";
  }
  if (remove) {
    remove.disabled = busy;
    remove.textContent = deleting ? "Deleting…" : "Delete entry";
  }
}

function reflectionAttach(form, originalBody = "") {
  if (!form) return;
  form.reflectionOriginalBody = originalBody;
  const field = form.querySelector("textarea");
  const onInput = () => {
    const draft = reflectionCapture(form);
    reflectionUpdateControls(form);
    reflectionSetStatus(
      form,
      draft
        ? reflectionDraftMessage(reflectionState(form.dataset.ownerId).durable)
        : "",
    );
  };
  field?.addEventListener("input", onInput);
  field?.addEventListener("change", onInput);
  field?.addEventListener("compositionend", onInput);
  form.addEventListener("submit", form.dataset.entryId ? Hy : Vy);
  reflectionUpdateControls(form);
  if (!reflectionAttach.listening) {
    // These listeners are installed only after the journal has been opened.
    reflectionAttach.listening = true;
    window.addEventListener("pagehide", () => reflectionCapture());
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") reflectionCapture();
    });
  }
}

function reflectionDate(entry) {
  const raw = entry.created_at || entry.updated_at;
  const date = raw ? new Date(raw) : null;
  if (!date || !Number.isFinite(date.getTime())) return "";
  const label = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
  return `<time datetime="${T(date.toISOString())}">${T(label)}</time>`;
}

function reflectionEntries() {
  return [
    ...We.map((entry, index) => ({
      ...entry,
      reflectionSource: "board",
      reflectionIndex: index,
    })),
    ...Qe.map((entry, index) => ({
      ...entry,
      reflectionSource: "story",
      reflectionIndex: We.length + index,
    })),
  ].sort((a, b) => {
    const aDate = Date.parse(a.created_at || a.updated_at || "") || 0;
    const bDate = Date.parse(b.created_at || b.updated_at || "") || 0;
    return (
      bDate - aDate ||
      (Number(b.sort_order) || 0) - (Number(a.sort_order) || 0) ||
      a.reflectionIndex - b.reflectionIndex
    );
  });
}

function reflectionEditorMarkup(entry = null, source = "story", notice = "") {
  const userId = I?.id || "anonymous";
  const state = reflectionState(userId);
  const key = reflectionDraftKey(source, entry?.id);
  const draft = state.drafts[key];
  const body = draft ? draft.body : entry?.body || "";
  const busy = state.busy.has(key);
  const deleting = state.busy.get(key) === "delete";
  const maxLength = Math.max(
    source === "board" ? Ic : Bs,
    String(entry?.body || "").length,
    body.length,
  );
  const status = busy
    ? deleting
      ? "Deleting…"
      : "Saving…"
    : draft
      ? reflectionDraftMessage(state.durable)
      : notice;
  const fieldId = entry ? "changed-entry-body" : "changed-story-body";
  return `
    <form id="${entry ? "changed-entry-form" : "add-changed-story"}" class="reflection-editor" data-reflection-editor data-owner-id="${T(userId)}" data-entry-id="${T(entry?.id || "")}" data-entry-source="${source === "board" ? "board" : "story"}" data-draft-key="${T(key)}" aria-busy="${busy ? "true" : "false"}">
      <label for="${fieldId}" class="reflection-editor-label">${entry ? "Edit entry" : "New entry"}</label>
      <textarea id="${fieldId}" name="body" class="reflection-textarea" rows="${entry ? "7" : "4"}" maxlength="${maxLength}" required aria-describedby="${entry ? "changed-entry-status" : "changed-story-status"}" ${busy ? "readonly" : ""}>${T(body)}</textarea>
      <div class="reflection-editor-actions">
        <button type="submit" class="primary-button reflection-save" ${busy || !body.trim() ? "disabled" : ""}>${busy && !deleting ? "Saving…" : entry ? "Save changes" : "Save entry"}</button>
        ${entry ? `<button type="button" class="text-button reflection-delete" data-reflection-delete ${busy ? "disabled" : ""}>${deleting ? "Deleting…" : "Delete entry"}</button>` : ""}
      </div>
      <div id="${entry ? "changed-entry-status" : "changed-story-status"}" class="reflection-status" data-reflection-status role="status" aria-live="polite" aria-atomic="true">${T(status)}</div>
    </form>`;
}

function reflectionUUID() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function reflectionSaveError(error, durable) {
  const draft = durable
    ? "Your draft is saved on this device."
    : "Your draft is kept while this app stays open.";
  if (ie(error))
    return `You’re offline or the connection was interrupted. ${draft} Try saving again when connected.`;
  if (error?.code === "23505")
    return `An entry with these words is already saved. ${draft}`;
  return `Couldn’t save this entry. ${draft} Please try again.`;
}

async function reflectionWriteEntry(source, id, body, userId, newId) {
  const table =
    source === "board" ? "changed_board_entries" : "changed_story_entries";
  const fields =
    source === "board"
      ? "id,side,body,sort_order,created_at,updated_at"
      : "id,body,sort_order,created_at,updated_at";
  const updated_at = new Date().toISOString();
  if (id) {
    // Editing a legacy board entry deliberately leaves its side and ordering intact.
    const result = await yi(
      O.from(table)
        .update({ body, updated_at })
        .eq("id", id)
        .eq("user_id", userId)
        .select(fields)
        .single(),
      20000,
    );
    if (result.error) throw result.error;
    if (!result.data?.id) throw new Error("Save could not be confirmed");
    return result.data;
  }
  const sort_order =
    Math.max(0, ...Qe.map((entry) => Number(entry.sort_order) || 0)) + 1;
  const result = await yi(
    O.from("changed_story_entries")
      .insert({ id: newId, user_id: userId, body, sort_order, updated_at })
      .select(fields)
      .single(),
    20000,
  );
  if (!result.error && result.data?.id) return result.data;
  if (result.error?.code === "23505") {
    // The first request may have succeeded even if its response was lost.
    const previous = await yi(
      O.from("changed_story_entries")
        .select(fields)
        .eq("id", newId)
        .eq("user_id", userId)
        .maybeSingle(),
      20000,
    );
    if (previous.error) throw previous.error;
    if (previous.data?.id) {
      if (previous.data.body === body) return previous.data;
      return reflectionWriteEntry("story", newId, body, userId, "");
    }
  }
  throw result.error || new Error("Save could not be confirmed");
}

async function reflectionSave(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form?.matches("[data-reflection-editor]")) return;
  const userId = form.dataset.ownerId;
  const state = reflectionState(userId);
  const key = form.dataset.draftKey;
  if (state.busy.has(key)) return;
  reflectionCapture(form);
  const field = form.querySelector("textarea");
  const body = field?.value || "";
  if (!body.trim()) {
    reflectionSetStatus(form, "Write something before saving.", true);
    field?.focus();
    return;
  }
  if (!I || I.id !== userId) {
    reflectionSetStatus(
      form,
      `Sign in to save. ${reflectionDraftMessage(state.durable)}`,
      true,
    );
    return;
  }
  if (!Fr) {
    reflectionSetStatus(
      form,
      `Saving is unavailable right now. ${reflectionDraftMessage(state.durable)}`,
      true,
    );
    return;
  }
  if (navigator.onLine === false) {
    reflectionSetStatus(
      form,
      `You’re offline. ${reflectionDraftMessage(state.durable)} Save it when you reconnect.`,
      true,
    );
    return;
  }
  const id = form.dataset.entryId || null;
  const source = form.dataset.entrySource === "board" ? "board" : "story";
  const draft = state.drafts[key] || {
    body,
    id: "",
    updatedAt: new Date().toISOString(),
  };
  state.drafts[key] = draft;
  try {
    if (
      !id &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        draft.id || "",
      )
    )
      draft.id = reflectionUUID();
    reflectionPersistState(userId);
    state.busy.set(key, "save");
    reflectionUpdateControls(form);
    reflectionSetStatus(form, "Saving…");
    const saved = await reflectionWriteEntry(
      source,
      id,
      body,
      userId,
      draft.id,
    );
    if (state.drafts[key]?.body === body) delete state.drafts[key];
    reflectionPersistState(userId);
    state.busy.delete(key);
    state.notice = "Saved to your account.";
    if (I?.id !== userId) return;
    if (source === "board") {
      We = We.map((entry) =>
        entry.id === saved.id ? { ...entry, ...saved } : entry,
      );
    } else {
      const existing = Qe.findIndex((entry) => entry.id === saved.id);
      Qe =
        existing < 0
          ? [...Qe, saved]
          : Qe.map((entry) =>
              entry.id === saved.id ? { ...entry, ...saved } : entry,
            );
    }
    K();
    const currentForm = reflectionCurrentForm(userId, key);
    if (currentForm) {
      // Avoid capturing the successfully saved text as a fresh draft on render.
      currentForm.reflectionOriginalBody = "";
      currentForm.querySelector("textarea").value = "";
      tn();
    }
  } catch (error) {
    reflectionSetStatus(
      reflectionCurrentForm(userId, key),
      reflectionSaveError(error, state.durable),
      true,
    );
  } finally {
    state.busy.delete(key);
    reflectionUpdateControls(reflectionCurrentForm(userId, key));
  }
}

async function reflectionDelete(source, id) {
  const userId = I?.id;
  const state = reflectionState(userId || "anonymous");
  const key = reflectionDraftKey(source, id);
  const form = document.querySelector("[data-reflection-editor]");
  const entry = (source === "board" ? We : Qe).find((item) => item.id === id);
  if (!userId || !entry || state.busy.has(key)) return;
  reflectionCapture(form);
  if (!window.confirm("Delete this entry? This can’t be undone.")) return;
  if (navigator.onLine === false) {
    reflectionSetStatus(
      form,
      "You’re offline. This entry hasn’t been deleted.",
      true,
    );
    return;
  }
  state.busy.set(key, "delete");
  reflectionUpdateControls(form);
  reflectionSetStatus(form, "Deleting…");
  try {
    const result = await yi(
      O.from(
        source === "board" ? "changed_board_entries" : "changed_story_entries",
      )
        .delete()
        .eq("id", id)
        .eq("user_id", userId)
        .select("id"),
      20000,
    );
    if (result.error) throw result.error;
    delete state.drafts[key];
    reflectionPersistState(userId);
    state.busy.delete(key);
    state.notice = "Entry deleted.";
    if (I?.id !== userId) return;
    if (source === "board") We = We.filter((item) => item.id !== id);
    else Qe = Qe.filter((item) => item.id !== id);
    K();
    const currentForm = reflectionCurrentForm(userId, key);
    if (currentForm) {
      currentForm.reflectionOriginalBody = "";
      currentForm.querySelector("textarea").value = "";
      tn();
    }
  } catch (error) {
    reflectionSetStatus(
      reflectionCurrentForm(userId, key),
      ie(error)
        ? "Couldn’t confirm deletion. Please try again when connected."
        : "Couldn’t delete this entry. Please try again.",
      true,
    );
  } finally {
    state.busy.delete(key);
    reflectionUpdateControls(reflectionCurrentForm(userId, key));
  }
}

function baAcceptActionEvent(options = {}) {
  if (options.source && !options.source.isConnected) return false;
  if (options.renderRevision != null && options.renderRevision !== Re)
    return false;
  return true;
}

function baFinishRest() {
  // This leaves the already recorded set intact and returns to the same workout.
  Nu();
  py();
}

function baToggleRestSound() {
  const video = document.querySelector("#rest-motivation-video");
  const enabled = !wi();
  cy(enabled);
  Wo(enabled);
  if (!video) return;
  video.muted = !enabled;
  if (ue && !video.classList.contains("hidden")) {
    video.play()?.catch?.(() => {
      video.muted = true;
      cy(false);
      Wo(false);
    });
  }
}

function baCaptureDraftKey() {
  return `battle-angel-capture-draft-${I?.id || "anon"}`;
}

function baReadCaptureDraft(key) {
  try {
    return String(window.localStorage.getItem(key) || "").slice(0, Bn);
  } catch {
    return "";
  }
}

function baWriteCaptureDraft(key, value) {
  try {
    if (value) window.localStorage.setItem(key, value);
    else window.localStorage.removeItem(key);
  } catch {
    /* The current text remains in the dialog if storage is unavailable. */
  }
}

async function baBackupRead(query, label) {
  const result = await query;
  if (result.error)
    throw new Error(
      `Could not back up ${label}: ${result.error.message || "Please reconnect and try again."}`,
    );
  return result.data || [];
}

let baFailedStorageKeys = new Set();

let baPowerRevision = 0;

function repetitionState(userId = I?.id || "anonymous") {
  const users = repetitionState.users || (repetitionState.users = new Map());
  if (users.has(userId)) return users.get(userId);
  const state = { drafts: {}, pending: new Set(), notices: {}, durable: true };
  try {
    const saved = JSON.parse(
      window.localStorage.getItem(`battle-angel-repetition-drafts-${userId}`) ||
        "{}",
    );
    if (saved && typeof saved === "object" && !Array.isArray(saved)) {
      for (const [key, value] of Object.entries(saved)) {
        if (/^[0-6]$/.test(key) && value && typeof value === "object") {
          state.drafts[key] = {
            title: typeof value.title === "string" ? value.title : "",
            note: typeof value.note === "string" ? value.note : "",
            substeps: typeof value.substeps === "string" ? value.substeps : "",
            id: typeof value.id === "string" ? value.id : "",
            detailsOpen: !!value.detailsOpen,
          };
        }
      }
    }
  } catch {
    state.durable = false;
  }
  users.set(userId, state);
  return state;
}

function repetitionPersist(userId) {
  const state = repetitionState(userId);
  try {
    window.localStorage.setItem(
      `battle-angel-repetition-drafts-${userId}`,
      JSON.stringify(state.drafts),
    );
    state.durable = true;
  } catch {
    state.durable = false;
  }
  return state.durable;
}

function repetitionDraftMessage(state) {
  return state.durable
    ? "Draft saved on this device."
    : "Draft kept while this app stays open. Device storage is unavailable.";
}

function repetitionCapture(form = document.querySelector("#add-daily-step")) {
  if (
    !form?.isConnected ||
    !form.dataset.repetitionOwner ||
    !/^[0-6]$/.test(form.dataset.repetitionDay || "")
  )
    return null;
  const userId = form.dataset.repetitionOwner,
    key = form.dataset.repetitionDay;
  const state = repetitionState(userId);
  if (state.pending.has(key)) return state.drafts[key] || null;
  const title = form.querySelector("#daily-step-title")?.value || "";
  const note = form.querySelector("#daily-step-note")?.value || "";
  const substeps = form.querySelector("#daily-step-substeps")?.value || "";
  if (!title && !note && !substeps) {
    delete state.drafts[key];
    repetitionPersist(userId);
    return null;
  }
  state.drafts[key] = {
    title,
    note,
    substeps,
    id: state.drafts[key]?.id || "",
    detailsOpen: !!form.querySelector(".daily-substeps-editor")?.open,
  };
  repetitionPersist(userId);
  return state.drafts[key];
}

function repetitionCurrentForm(userId, key) {
  const form = document.querySelector("#add-daily-step");
  return form?.dataset.repetitionOwner === userId &&
    form.dataset.repetitionDay === String(key)
    ? form
    : null;
}

function repetitionStatus(form, message, error = false) {
  if (
    !form?.isConnected ||
    form.dataset.repetitionOwner !== (I?.id || "anonymous")
  )
    return;
  const status = form.querySelector("#daily-editor-status");
  if (status) {
    status.textContent = message;
    status.classList.toggle("is-error", error);
  }
}

function repetitionControls(form) {
  if (!form?.isConnected) return;
  const state = repetitionState(form.dataset.repetitionOwner),
    key = form.dataset.repetitionDay;
  const busy = state.pending.has(key),
    title = form.querySelector("#daily-step-title");
  form.setAttribute("aria-busy", String(busy));
  form.querySelectorAll("input,textarea").forEach((field) => {
    field.readOnly = busy;
  });
  const button = form.querySelector('button[type="submit"]');
  if (button) {
    button.disabled = busy || !title?.value.trim();
    button.textContent = busy ? "Adding…" : `Add to ${wy(Number(key))[2]}`;
  }
}

async function repetitionWrite(payload) {
  const fields =
    "id,title,note,substeps,active_days,day_order,sort_order,created_at,updated_at";
  const result = await yi(
    O.from("daily_steps").insert(payload).select(fields).single(),
    20000,
  );
  if (!result.error && result.data?.id) return result.data;
  if (result.error?.code === "23505") {
    const previous = await yi(
      O.from("daily_steps")
        .select(fields)
        .eq("id", payload.id)
        .eq("user_id", payload.user_id)
        .maybeSingle(),
      20000,
    );
    if (previous.error) throw previous.error;
    if (previous.data?.id) {
      if (
        previous.data.title === payload.title &&
        previous.data.note === payload.note &&
        JSON.stringify(previous.data.substeps) ===
          JSON.stringify(payload.substeps)
      )
        return previous.data;
      // Preserve any weekdays assigned after an earlier request succeeded.
      const updated = await yi(
        O.from("daily_steps")
          .update({
            title: payload.title,
            note: payload.note,
            substeps: payload.substeps,
            updated_at: payload.updated_at,
          })
          .eq("id", payload.id)
          .eq("user_id", payload.user_id)
          .select(fields)
          .single(),
        20000,
      );
      if (updated.error) throw updated.error;
      if (updated.data?.id) return updated.data;
    }
  }
  throw result.error || new Error("The new routine could not be confirmed");
}

function mediaSafetyState(userId = I?.id) {
  if (!userId) return null;
  const users = mediaSafetyState.users || (mediaSafetyState.users = new Map());
  if (users.has(userId)) return users.get(userId);
  const state = {
    pending: new Set(),
    operations: new Set(),
    cleaning: null,
    timer: null,
    durable: true,
  };
  try {
    const saved = JSON.parse(
      window.localStorage.getItem(`battle-angel-media-cleanup-${userId}`) ||
        "[]",
    );
    if (Array.isArray(saved))
      saved
        .filter((value) => typeof value === "string" && value)
        .forEach((value) => state.pending.add(value));
  } catch {
    state.durable = false;
  }
  users.set(userId, state);
  return state;
}

function mediaPersistCleanup(userId) {
  const state = mediaSafetyState(userId);
  if (!state) return;
  try {
    if (state.pending.size)
      window.localStorage.setItem(
        `battle-angel-media-cleanup-${userId}`,
        JSON.stringify([...state.pending]),
      );
    else window.localStorage.removeItem(`battle-angel-media-cleanup-${userId}`);
    state.durable = true;
  } catch {
    state.durable = false;
  }
}

function mediaSafetyInit() {
  if (!mediaSafetyInit.listening) {
    mediaSafetyInit.listening = true;
    window.addEventListener("online", () => {
      if (I?.id) mediaRetryCleanup(I.id);
    });
  }
  if (I?.id) mediaRetryCleanup(I.id);
}

async function mediaRetryCleanup(userId = I?.id) {
  const state = mediaSafetyState(userId);
  if (!state || !state.pending.size) return true;
  if (state.cleaning) return state.cleaning;
  if (I?.id !== userId || navigator.onLine === false) return false;
  if (state.timer) {
    window.clearTimeout(state.timer);
    state.timer = null;
  }
  const paths = [...state.pending];
  state.cleaning = (async () => {
    try {
      for (let offset = 0; offset < paths.length; offset += 100) {
        if (I?.id !== userId) return false;
        const batch = paths.slice(offset, offset + 100);
        const result = await yi(O.storage.from(ut).remove(batch), 20000);
        if (result.error) throw result.error;
        batch.forEach((path) => state.pending.delete(path));
        mediaPersistCleanup(userId);
      }
      return true;
    } catch (error) {
      console.warn("Deleted media file cleanup is pending:", error);
      return false;
    } finally {
      state.cleaning = null;
      if (state.pending.size && I?.id === userId && !state.timer) {
        state.timer = window.setTimeout(() => {
          state.timer = null;
          mediaRetryCleanup(userId);
        }, 30000);
      }
    }
  })();
  return state.cleaning;
}

async function mediaQueueCleanup(userId, paths) {
  const state = mediaSafetyState(userId);
  if (!state) return false;
  paths.filter(Boolean).forEach((path) => state.pending.add(path));
  mediaPersistCleanup(userId);
  mediaSafetyInit();
  await mediaRetryCleanup(userId);
  return paths.every((path) => !state.pending.has(path));
}

function mediaCleanupNotice(label, clean, userId) {
  if (clean || I?.id !== userId) return;
  const state = mediaSafetyState(userId);
  const message = state?.durable
    ? `${label} removed. File cleanup will retry when connected.`
    : `${label} removed. Keep the app open to finish file cleanup.`;
  if (typeof baToast === "function") baToast(message);
  else alert(message);
}

async function mediaDeleteDatabaseRows(table, field, value, userId) {
  if (I?.id !== userId)
    throw new Error("Your account changed. Please try again after signing in.");
  const result = await yi(
    O.from(table).delete().eq(field, value).eq("user_id", userId).select("id"),
    20000,
  );
  if (I?.id !== userId)
    throw new Error("Your account changed. Please try again after signing in.");
  if (result.error) throw result.error;
  if (!Array.isArray(result.data))
    throw new Error("Deletion could not be confirmed. Please try again.");
  if (!result.data.length) {
    // A retry may target rows already removed by the first request.
    const check = await yi(
      O.from(table)
        .select("id")
        .eq(field, value)
        .eq("user_id", userId)
        .limit(1),
      20000,
    );
    if (I?.id !== userId)
      throw new Error(
        "Your account changed. Please try again after signing in.",
      );
    if (check.error) throw check.error;
    if (!Array.isArray(check.data) || check.data.length)
      throw new Error("Deletion could not be confirmed. Please try again.");
  }
}

async function mediaRenumberReferences(groupId, userId, strict = false) {
  try {
    if (I?.id !== userId)
      throw new Error("Your account changed. Please sign in again.");
    const remaining = await yi(
      O.from("exercises")
        .select("id,video_order")
        .eq("exercise_group", groupId)
        .eq("user_id", userId)
        .order("video_order", { ascending: true })
        .order("id", { ascending: true }),
      20000,
    );
    if (I?.id !== userId)
      throw new Error("Your account changed. Please sign in again.");
    if (remaining.error) throw remaining.error;
    if (!Array.isArray(remaining.data))
      throw new Error("Reference order could not be loaded. Please try again.");
    for (const [index, entry] of remaining.data.entries()) {
      if (I?.id !== userId)
        throw new Error("Your account changed. Please sign in again.");
      if (entry.video_order !== index + 1) {
        const changed = await yi(
          O.from("exercises")
            .update({ video_order: index + 1 })
            .eq("id", entry.id)
            .eq("user_id", userId)
            .select("id"),
          20000,
        );
        if (I?.id !== userId)
          throw new Error("Your account changed. Please sign in again.");
        if (changed.error) throw changed.error;
        if (
          !Array.isArray(changed.data) ||
          !changed.data.some((row) => row.id === entry.id)
        )
          throw new Error(
            "Reference order could not be saved. Please try again.",
          );
      }
    }
    return remaining.data.length;
  } catch (error) {
    if (strict) throw error;
    console.warn(
      "Reference removed; display order will use remaining positions:",
      error,
    );
    return null;
  }
}

tw();
