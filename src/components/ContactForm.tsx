import { useState, type FormEvent } from 'react'

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    console.log('Form submission:', formData)
    // Add logic for actual data transfer here if needed
    alert('TRANSMISSION_RECEIVED: Data logged to console.')
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <section className="py-[8vh] md:py-[10vh] px-4 md:px-6 max-w-[1400px] mx-auto">
      <div className="@container border-4 border-[#FF7A00] bg-[#121212] p-6 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 bg-[#FF7A00] text-[#121212] px-3 py-0.5 font-brutalist-mono text-[10px] md:text-xs uppercase">
          SYSTEM_TRANSMISSION // INITIALIZE
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 mt-6">
          <div>
            <h2 style={{ fontSize: 'clamp(2.5rem, 12cqw, 4.5rem)' }} className="font-clash tracking-tighter font-black leading-[0.85] text-[#FF7A00] uppercase mb-4 md:mb-6">
              Initiate<br />Contact
            </h2>
            <p className="font-satoshi font-black text-xs md:text-base uppercase opacity-60 leading-tight">
              Enter your parameters to begin the data transfer. Responses are processed within 24 standard cycles.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5 @container">
            <div className="space-y-1">
              <label htmlFor="name" className="font-brutalist-mono text-[8px] md:text-[10px] text-[#FF7A00] uppercase tracking-widest">[IDENTIFIER]</label>
              <input 
                id="name"
                name="name"
                type="text" 
                value={formData.name}
                onChange={handleChange}
                placeholder="NAME_NULL" 
                required
                className="w-full bg-white/5 border-2 border-white/10 p-3 font-satoshi font-black text-base md:text-xl focus:border-[#FF7A00] focus:outline-none transition-colors placeholder:opacity-20"
              />
            </div>
            
            <div className="space-y-1">
              <label htmlFor="email" className="font-brutalist-mono text-[8px] md:text-[10px] text-[#FF7A00] uppercase tracking-widest">[ENDPOINT]</label>
              <input 
                id="email"
                name="email"
                type="email" 
                value={formData.email}
                onChange={handleChange}
                placeholder="EMAIL@SYSTEM.COM" 
                required
                className="w-full bg-white/5 border-2 border-white/20 p-3 font-satoshi font-black text-base md:text-xl focus:border-[#FF7A00] focus:outline-none transition-colors placeholder:opacity-20"
              />
            </div>
            
            <div className="space-y-1">
              <label htmlFor="message" className="font-brutalist-mono text-[8px] md:text-[10px] text-[#FF7A00] uppercase tracking-widest">[MESSAGE_PAYLOAD]</label>
              <textarea 
                id="message"
                name="message"
                rows={3}
                value={formData.message}
                onChange={handleChange}
                placeholder="DESCRIBE_PROJECT_PARAMETERS" 
                required
                className="w-full bg-white/5 border-2 border-white/20 p-3 font-satoshi font-black text-base md:text-xl focus:border-[#FF7A00] focus:outline-none transition-colors placeholder:opacity-20"
              />
            </div>
            
            <button type="submit" className="group w-full py-4 bg-[#FF7A00] text-[#121212] text-2xl md:text-4xl font-clash tracking-tighter font-bold uppercase hover:bg-white transition-colors relative overflow-hidden">
              <span className="relative z-10">Send_Transmission</span>
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
