import{r as i,j as s,c as j,R as I}from"./client-YuXkKMHE.js";import{b as P,V as M,P as E}from"./voice-DllyErQb.js";function D(){const[p,g]=i.useState("begin"),[X,v]=i.useState("right"),[h,w]=i.useState(!1),[b,f]=i.useState(null),[k,x]=i.useState(!1),a=i.useRef(null),l=i.useRef([]),c=i.useRef(null);i.useEffect(()=>{var t,n,r;const e=window.electronAPI;e&&((t=e.onAnimState)==null||t.call(e,o=>{g(o),o!=="listening"&&x(!1)}),(n=e.onDirectionChange)==null||n.call(e,o=>{(o==="left"||o==="right")&&v(o)}),(r=e.onVoiceTranscribing)==null||r.call(e,o=>{x(o)}))},[]),i.useEffect(()=>{var e,t;if(p==="listening"){let n=!1;return Promise.resolve((t=(e=window.electronAPI)==null?void 0:e.getSettings)==null?void 0:t.call(e)).then(r=>navigator.mediaDevices.getUserMedia(P(r==null?void 0:r.voiceInputDevice))).then(r=>{if(n){r.getTracks().forEach(d=>d.stop());return}const o=new AudioContext,m=o.createMediaStreamSource(r),u=o.createAnalyser();u.fftSize=256,m.connect(u),c.current={actx:o,stream:r},f(u)}).catch(()=>{}),()=>{n=!0,c.current&&(c.current.stream.getTracks().forEach(r=>r.stop()),c.current.actx.close(),c.current=null),f(null)}}else c.current&&(c.current.stream.getTracks().forEach(n=>n.stop()),c.current.actx.close(),c.current=null),f(null)},[p]);const C=i.useCallback(e=>{var t,n;g(e),(n=(t=window.electronAPI)==null?void 0:t.animStateChanged)==null||n.call(t,e)},[]),S=i.useCallback(e=>{var r;if(e.button!==0)return;const t=window.screenX+e.clientX,n=window.screenY+e.clientY;a.current={screenX:t,screenY:n,moved:!1},(r=window.electronAPI)==null||r.startDrag(t,n)},[]);i.useEffect(()=>{const e=n=>{var d;if(!a.current)return;const r=window.screenX+n.clientX,o=window.screenY+n.clientY,m=r-a.current.screenX,u=o-a.current.screenY;!a.current.moved&&(Math.abs(m)>3||Math.abs(u)>3)&&(a.current.moved=!0,w(!0)),a.current.moved&&((d=window.electronAPI)==null||d.dragMove(r,o))},t=()=>{var n;a.current&&(a.current.moved&&((n=window.electronAPI)==null||n.stopDrag(),w(!1)),a.current=null)};return window.addEventListener("mousemove",e),window.addEventListener("mouseup",t),()=>{window.removeEventListener("mousemove",e),window.removeEventListener("mouseup",t)}},[]);const y=i.useCallback(()=>{var t,n;if(h)return;const e=Date.now();if(l.current.push(e),l.current=l.current.filter(r=>e-r<500),l.current.length>=3){l.current=[],(t=window.electronAPI)==null||t.rapidClick();return}(n=window.electronAPI)==null||n.toggleChat()},[h]),A=i.useCallback(e=>{var t;e.preventDefault(),(t=window.electronAPI)==null||t.showContextMenu()},[]);return s.jsxs(s.Fragment,{children:[s.jsx("style",{children:`
        body { background: transparent !important; }

        .pet-container {
          width: 200px;
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          cursor: grab;
          user-select: none;
          -webkit-app-region: no-drag;
        }
        .pet-container:active { cursor: grabbing; }

        .pet-body {
          position: relative;
          width: 100%;
          height: 100%;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.15));
          transition: transform 0.2s ease;
        }

        .pet-video {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .pet-waveform {
          position: absolute;
          top: 16%;
          left: 50%;
          transform: translateX(-50%) scale(0.65);
          transform-origin: center bottom;
          z-index: 2;
          animation: petWaveIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes petWaveIn {
          from { opacity: 0; transform: translateX(-50%) scale(0.55) translateY(6px); }
          to { opacity: 1; transform: translateX(-50%) scale(0.65) translateY(0); }
        }

        .pet-thinking {
          position: absolute;
          top: 16%;
          left: 50%;
          transform: translateX(-50%) scale(0.65);
          transform-origin: center bottom;
          z-index: 2;
          overflow: hidden;
          background: rgba(10, 10, 10, 0.94);
          border-radius: 100px;
          padding: 4px 16px;
          font-size: 16px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.6);
          white-space: nowrap;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 6px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          height: 34px;
          min-width: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
        }
        .pet-thinking-text { position: relative; z-index: 1; }
        .pet-thinking-shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.06) 45%,
            rgba(255, 255, 255, 0.12) 50%,
            rgba(255, 255, 255, 0.06) 55%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: petShimmer 1.8s ease-in-out infinite;
        }
        @keyframes petShimmer {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
      `}),s.jsxs("div",{className:"pet-container",onMouseDown:S,onClick:y,onContextMenu:A,children:[b?s.jsx("div",{className:"pet-waveform",children:s.jsx(M,{analyser:b,barCount:12,onCancel:()=>{var e,t;return(t=(e=window.electronAPI)==null?void 0:e.voiceCancel)==null?void 0:t.call(e)},onConfirm:()=>{var e,t;return(t=(e=window.electronAPI)==null?void 0:e.voiceConfirm)==null?void 0:t.call(e)}})}):k?s.jsxs("div",{className:"pet-thinking",children:[s.jsx("span",{className:"pet-thinking-text",children:"Thinking"}),s.jsx("div",{className:"pet-thinking-shimmer"})]}):null,s.jsx("div",{className:"pet-body",style:{transform:"scaleX(1)"},children:s.jsx(E,{animState:p,onAnimState:C,className:"pet-video"})})]})]})}j.createRoot(document.getElementById("root")).render(s.jsx(I.StrictMode,{children:s.jsx(D,{})}));
