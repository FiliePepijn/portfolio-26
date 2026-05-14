import React from 'react';

const OGPreview: React.FC = () => {
  return (
    <div className="w-[1200px] h-[630px] bg-[#121212] text-white font-satoshi overflow-hidden relative border-4 border-[#FF7A00] flex flex-col">
      {/* NOISE / GRAIN OVERLAY */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.05] z-50 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      
      {/* GRID BACKGROUND */}
      <div className="absolute inset-0 opacity-10 bg-grid-lines pointer-events-none" />

      {/* TOP BAR: SYSTEM STATUS */}
      <div className="h-12 border-b-2 border-[#FF7A00]/30 bg-[#121212] flex items-center justify-between px-6 z-10">
        <div className="flex gap-3 items-center">
          <div className="w-32 h-2.5 bg-[#FF7A00]/30 rounded-full" />
          <div className="w-3.5 h-3.5 bg-[#FF7A00] rounded-full animate-pulse" />
        </div>
        <div className="flex gap-8">
          <div className="w-20 h-2 bg-[#FF7A00]/20 rounded-full" />
          <div className="w-16 h-2 bg-[#FF7A00]/20 rounded-full" />
          <div className="w-12 h-2 bg-[#FF7A00]/20 rounded-full" />
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex border-b-2 border-[#FF7A00]/30 z-10">
        {/* LEFT COLUMN: IDENTITY */}
        <div className="flex-1 p-16 flex flex-col justify-center gap-8 relative border-r-2 border-[#FF7A00]/30 bg-[#121212]/50">
          <div className="space-y-[-2rem]">
            <h1 className="font-clash font-bold tracking-tighter leading-none text-[#FF7A00] uppercase text-[160px]">
              PEPIJN
            </h1>
          </div>
          
          <div className="bg-[#FF7A00] text-[#121212] px-6 py-2 font-satoshi font-black tracking-tighter text-4xl uppercase transform -rotate-1 shadow-[6px_6px_0px_0px_white] w-fit">
            UX/UI Designer & Developer
          </div>
          
          <div className="w-3/4 h-[1px] bg-[#FF7A00]/30" />
          
          <p className="max-w-xl text-2xl font-bold uppercase opacity-80 leading-tight border-l-4 border-[#FF7A00] pl-8 font-satoshi">
            REDUCING NOISE IN DIGITAL SYSTEMS. <br/>
            DESIGNING FOR HUMAN INTENT.
          </p>
        </div>

        {/* RIGHT COLUMN: SCAN METADATA */}
        <div className="w-[400px] flex flex-col bg-black/40">
           <div className="flex-1 p-12 flex flex-col gap-10 justify-center">
              <div className="space-y-6 font-brutalist-mono text-sm uppercase">
                <div className="flex justify-between border-b border-white/10 pb-3">
                  <span className="opacity-40">Subject_ID</span>
                  <span className="text-[#FF7A00]">Latour, P.</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-3">
                  <span className="opacity-40">Status</span>
                  <span className="text-[#FF7A00]">IDENTIFIED</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-3">
                  <span className="opacity-40">Data_State</span>
                  <span className="text-[#FF7A00]">SYNCED</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-3">
                  <span className="opacity-40">Origin</span>
                  <span className="text-[#FF7A00]">Helmond_NL</span>
                </div>
              </div>

              <div className="p-6 border-2 border-[#FF7A00]/20 bg-[#FF7A00]/5 rounded-sm">
                <div className="font-brutalist-mono text-[10px] text-[#FF7A00] opacity-50 mb-2">SYSTEM_SIGNATURE</div>
                <div className="h-12 flex items-end gap-1">
                   {[40, 70, 45, 90, 65, 30, 85, 50, 75, 40].map((h, i) => (
                     <div key={i} className="flex-1 bg-[#FF7A00]/40" style={{ height: `${h}%` }} />
                   ))}
                </div>
              </div>
           </div>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="h-12 bg-[#121212] flex items-center px-8 justify-between z-10">
        <div className="font-brutalist-mono text-xs text-[#FF7A00] tracking-[0.3em] uppercase opacity-60">
          WWW.PEPIJNLATOUR.COM // V1.0.0_STABLE
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]" />
          <span className="font-brutalist-mono text-[10px] text-[#FF7A00] uppercase tracking-widest">Connection_Secure</span>
        </div>
      </div>
      
      {/* SCANNER LINE EFFECT */}
      <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden opacity-20">
        <div className="w-full h-[2px] bg-[#FF7A00] absolute top-1/4 left-0" />
      </div>
    </div>
  );
};

export default OGPreview;
