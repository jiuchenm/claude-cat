import{r as o,j as n,c as S,R as I}from"./client-YuXkKMHE.js";import{M as N,r as P}from"./index-Dd5IvaqA.js";const B={credit_insufficient:"Insufficient credits",auth_expired:"Session expired"};function E(){const[u,s]=o.useState(""),[d,c]=o.useState([]),[m,b]=o.useState(!1),[A,R]=o.useState(0),[p,g]=o.useState(""),l=o.useRef(""),x=o.useRef(null),y=o.useRef(null);o.useEffect(()=>{var r,w,k,j,T,v;const e=window.electronAPI;e&&((r=e.onAIRunStart)==null||r.call(e,()=>{clearTimeout(x.current),l.current="",s(""),c([]),b(!0),R(t=>t+1)}),(w=e.onAIChunk)==null||w.call(e,t=>{b(!1),l.current+=t,s(l.current)}),(k=e.onAITool)==null||k.call(e,t=>{b(!1);const a=t.toolCallId||`t-${Date.now()}`;c(h=>h.find(i=>i.id===a)?h.map(i=>i.id===a?{...i,phase:t.phase||i.phase,result:t.result||i.result}:i):[...h,{id:a,name:t.name,phase:t.phase||"start"}])}),(j=e.onAIDone)==null||j.call(e,t=>{b(!1),clearTimeout(x.current),t!=null&&t.aborted?(l.current="",s(""),c([])):x.current=setTimeout(()=>{s(""),c([])},7e3)}),(T=e.onAIFinal)==null||T.call(e,t=>{b(!1),t!=null&&t.content&&(l.current=t.content,s(t.content))}),(v=e.onApiError)==null||v.call(e,t=>{const a=B[t==null?void 0:t.type]||"操作失败";g(a),clearTimeout(y.current),y.current=setTimeout(()=>g(""),5e3)}))},[]);const f=u||d.length>0||m||p;return o.useEffect(()=>{var e,r;(r=(e=window.electronAPI)==null?void 0:e.setBubbleVisible)==null||r.call(e,!!f)},[!!f]),n.jsxs(n.Fragment,{children:[n.jsx("style",{children:`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          background: transparent !important;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif;
        }

        /* Anchor bubble to bottom-left; window overlaps cat's top transparent zone.
           Content grows upward — bubble appears right above the actual cat figure. */
        .bubble-root {
          position: fixed;
          bottom: 0;
          left: 0;
          display: flex;
          align-items: flex-end;
          padding: 0 0 4px 8px;
        }

        .bubble {
          display: inline-block;
          max-width: 106px;
          max-height: 98px;
          overflow: hidden;
          background: rgba(14, 14, 16, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 11px 11px 11px 3px;
          padding: 6px 9px 8px;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          pointer-events: none;
          position: relative;
          animation: bubbleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes bubbleIn {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Tail: bottom-left, points down toward the cat */
        .bubble-tail {
          position: absolute;
          bottom: -7px;
          left: 12px;
          width: 12px;
          height: 8px;
          background: rgba(14, 14, 16, 0.95);
          clip-path: polygon(0 0, 100% 0, 0 100%);
        }

        /* Tool chips */
        .bubble-tools {
          display: flex;
          flex-wrap: wrap;
          gap: 3px;
          margin-bottom: 3px;
        }
        .bubble-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 9.5px;
          font-weight: 500;
          padding: 2px 6px;
          border-radius: 20px;
          white-space: nowrap;
          border: 1px solid transparent;
        }
        .bubble-chip-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .bubble-chip.done {
          background: rgba(74, 222, 128, 0.12);
          color: #4ade80;
          border-color: rgba(74, 222, 128, 0.2);
        }
        .bubble-chip.done .bubble-chip-dot { background: #4ade80; }
        .bubble-chip.running {
          background: rgba(96, 165, 250, 0.1);
          color: #60a5fa;
          border-color: rgba(96, 165, 250, 0.18);
          animation: chipPulse 1.4s ease-in-out infinite;
        }
        .bubble-chip.running .bubble-chip-dot {
          background: #60a5fa;
          animation: dotPulse 1.2s ease-in-out infinite;
        }
        @keyframes chipPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

        /* Thinking dots */
        .bubble-dots {
          display: flex;
          gap: 3px;
          padding: 2px 0;
        }
        .bubble-dots span {
          display: inline-block;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.35);
          animation: dotPulse 1.2s ease-in-out infinite;
        }
        .bubble-dots span:nth-child(2) { animation-delay: 0.2s; }
        .bubble-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes dotPulse {
          0%, 80%, 100% { opacity: 0.25; transform: scale(0.75); }
          40% { opacity: 1; transform: scale(1); }
        }

        /* Text */
        .bubble-text {
          font-size: 11px;
          line-height: 1.45;
          color: rgba(255, 255, 255, 0.85);
          word-break: break-word;
          font-family: inherit;
          max-height: 68px;
          overflow: hidden;
        }
        .bubble-text p { margin: 0 0 3px; }
        .bubble-text p:last-child { margin: 0; }
        .bubble-text strong { color: #fff; font-weight: 600; }
        .bubble-text em { opacity: 0.85; font-style: italic; }
        .bubble-text code {
          background: rgba(255,255,255,0.1);
          padding: 1px 4px;
          border-radius: 3px;
          font-size: 10px;
          font-family: 'SF Mono', Menlo, monospace;
        }
        .bubble-text ul, .bubble-text ol {
          margin: 2px 0;
          padding-left: 14px;
        }
        .bubble-text li { margin-bottom: 1px; }
        .bubble-text a { color: #60a5fa; text-decoration: none; }
        .bubble-text h1, .bubble-text h2, .bubble-text h3 {
          font-size: 11px; font-weight: 600; margin: 2px 0;
        }
        .bubble--error { border-color: rgba(239,68,68,0.3); }
        .bubble-error-text { font-size: 11px; color: #f87171; font-weight: 500; }
      `}),n.jsxs("div",{className:"bubble-root",children:[p&&n.jsxs("div",{className:"bubble bubble--error",children:[n.jsx("span",{className:"bubble-error-text",children:p}),n.jsx("div",{className:"bubble-tail"})]}),!p&&f&&n.jsxs("div",{className:"bubble",children:[d.length>0&&n.jsx("div",{className:"bubble-tools",children:d.slice(-5).map(e=>{const r=e.phase==="done"||e.phase==="end"||e.result;return n.jsxs("span",{className:`bubble-chip ${r?"done":"running"}`,children:[n.jsx("span",{className:"bubble-chip-dot"}),e.name]},e.id)})}),m&&!u?n.jsxs("div",{className:"bubble-dots",children:[n.jsx("span",{}),n.jsx("span",{}),n.jsx("span",{})]}):u?n.jsx("div",{className:"bubble-text",children:n.jsx(N,{remarkPlugins:[P],children:u})}):null,n.jsx("div",{className:"bubble-tail"})]},A)]})]})}S.createRoot(document.getElementById("root")).render(n.jsx(I.StrictMode,{children:n.jsx(E,{})}));
