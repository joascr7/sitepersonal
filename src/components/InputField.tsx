'use client';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMPONENTE DE INPUT PREMIUM (Design System)
// Mantive a estrutura original, mas apliquei as variáveis de tema 
// para garantir que este campo funcione perfeitamente tanto no Dark 
// quanto no Light Mode, respeitando o padrão "AuraFit".
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function InputField({ 
  label, 
  value, 
  onChange, 
  type = "text", 
  className = "", 
  disabled = false 
}: any) {
  
  return (
    <div className="w-full">
      <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase mb-2 px-1 tracking-widest">
        {label}
      </label>
      
      <input 
        type={type} 
        disabled={disabled}
        value={value} 
        onChange={(e) => onChange?.(e.target.value)}
        className={`
          w-full p-4 
          bg-[var(--surface-sec)] 
          border border-[var(--border)] 
          rounded-[1.2rem] 
          text-sm font-bold 
          text-[var(--text-primary)] 
          outline-none 
          transition-all duration-300
          focus:border-[var(--primary)] 
          focus:ring-1 
          focus:ring-[var(--primary)]
          shadow-inner
          disabled:opacity-50
          disabled:cursor-not-allowed
          placeholder:text-[var(--text-secondary)]/50
          ${className}
        `} 
      />
    </div>
  );
}