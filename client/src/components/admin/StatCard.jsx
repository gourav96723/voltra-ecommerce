export default function StatCard({ label, value, icon: Icon, tone = 'default' }) {
  const tones = {
    default: 'bg-white',
    teal: 'bg-[var(--color-teal)]/5 border-[var(--color-teal)]/20',
    amber: 'bg-[var(--color-amber)]/5 border-[var(--color-amber)]/20',
  };
  return (
    <div className={`border border-[var(--color-line)] rounded-xl p-5 ${tones[tone]}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        {Icon && <Icon size={18} className="text-[var(--color-teal)]" />}
      </div>
      <p className="font-display text-2xl font-bold mt-2 text-[var(--color-ink)]">{value}</p>
    </div>
  );
}
