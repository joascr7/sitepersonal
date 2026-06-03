export default function InputField({ label, value, onChange, type = "text", className = "", disabled = false }: any) {
  return (
    <div className="w-full">
      <label className="block text-[10px] font-black text-neutral-500 uppercase mb-2 px-1 tracking-widest">{label}</label>
      <input 
        type={type} 
        disabled={disabled}
        className={`w-full p-4 bg-black/40 border border-white/5 rounded-2xl text-sm font-bold text-white focus:border-blue-500 outline-none transition-all ${className}`} 
        value={value} 
        onChange={(e) => onChange?.(e.target.value)} 
      />
    </div>
  );
}