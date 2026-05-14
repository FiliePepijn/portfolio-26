import { } from 'react'

export default function ContactForm() {
  return (
    <section className="py-[10vh] px-6 max-w-[1400px] mx-auto">
      <div className="border-4 border-[#FF7A00] bg-[#121212] p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 bg-[#FF7A00] text-[#121212] px-3 py-0.5 font-brutalist-mono text-xs uppercase">
          SYSTEM_TRANSMISSION // INITIALIZE
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-6">
          <div>
            <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }} className="font-clash tracking-tighter font-black leading-[0.85] text-[#FF7A00] uppercase mb-6">
              Initiate<br />Contact
            </h2>
            <p className="font-satoshi font-black text-sm md:text-base uppercase opacity-60 leading-tight">
              Enter your parameters to begin the data transfer. Responses are processed within 24 standard cycles.
            </p>
          </div>
          
          <form className="space-y-4 md:space-y-5">
            <div className="space-y-1">
              <label className="font-brutalist-mono text-[10px] text-[#FF7A00] uppercase tracking-widest">[IDENTIFIER]</label>
              <input 
                type="text" 
                placeholder="NAME_NULL" 
                className="w-full bg-white/5 border-2 border-white/10 p-3 font-satoshi font-black text-lg md:text-xl focus:border-[#FF7A00] focus:outline-none transition-colors placeholder:opacity-20"
              />
            </div>
            
            <div className="space-y-1">
              <label className="font-brutalist-mono text-[10px] text-[#FF7A00] uppercase tracking-widest">[ENDPOINT]</label>
              <input 
                type="email" 
                placeholder="EMAIL@SYSTEM.COM" 
                className="w-full bg-white/5 border-2 border-white/20 p-3 font-satoshi font-black text-lg md:text-xl focus:border-[#FF7A00] focus:outline-none transition-colors placeholder:opacity-20"
              />
            </div>
            
            <div className="space-y-1">
              <label className="font-brutalist-mono text-[10px] text-[#FF7A00] uppercase tracking-widest">[MESSAGE_PAYLOAD]</label>
              <textarea 
                rows={3}
                placeholder="DESCRIBE_PROJECT_PARAMETERS" 
                className="w-full bg-white/5 border-2 border-white/20 p-3 font-satoshi font-black text-lg md:text-xl focus:border-[#FF7A00] focus:outline-none transition-colors placeholder:opacity-20"
              />
            </div>
            
            <button className="group w-full py-4 bg-[#FF7A00] text-[#121212] text-3xl md:text-4xl font-clash tracking-tighter font-bold uppercase hover:bg-white transition-colors relative overflow-hidden">
              <span className="relative z-10">Send_Transmission</span>
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
