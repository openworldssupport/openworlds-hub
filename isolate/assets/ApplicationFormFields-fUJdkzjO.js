import{j as a}from"./framer-motion-D5IBGcks.js";import{d as o,T as p,I as c}from"./index-Dw4f1_oV.js";function x({sections:t}){return a.jsx("div",{className:"space-y-8",children:t.map(r=>a.jsxs("fieldset",{className:"m-0 min-w-0 space-y-4 border-0 p-0",children:[a.jsx("legend",{className:"w-full border-b border-slate-200 pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500",children:r.title}),a.jsx("div",{className:"grid gap-4 sm:grid-cols-2",children:r.fields.map(e=>{const n=`application-${e.name}`,m=e.wide||e.type==="textarea";return a.jsxs("div",{className:m?"space-y-2 sm:col-span-2":"space-y-2",children:[a.jsxs(o,{htmlFor:n,children:[e.label," ",!e.required&&a.jsx("span",{className:"font-normal text-slate-500",children:"(optional)"})]}),e.type==="textarea"?a.jsx(p,{id:n,name:e.name,rows:e.rows??4,required:e.required,minLength:e.minLength,maxLength:e.maxLength,placeholder:e.placeholder}):e.type==="select"?a.jsxs("select",{id:n,name:e.name,required:e.required,defaultValue:"",className:"h-10 w-full rounded-md border border-input bg-background px-3 text-sm",children:[a.jsx("option",{value:"",disabled:!0,children:"Choose an option…"}),e.options?.map(s=>a.jsx("option",{value:s,children:s},s))]}):a.jsx(c,{id:n,name:e.name,type:e.type??"text",required:e.required,min:e.min,max:e.max,minLength:e.minLength,maxLength:e.maxLength,placeholder:e.placeholder})]},e.name)})})]},r.title))})}function d(t,r){return r.map(e=>[e.title,...e.fields.map(n=>`${n.label}:
${String(t.get(n.name)??"").trim()||"Not provided"}`)].join(`

`)).join(`

---

`)}export{x as A,d as a};
