export default function CanvasLoader() {
  return (
    <div className="flex items-center justify-center">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-2 border-green-500/30 rounded-full animate-[spin_3s_linear_infinite]" />
        <div className="absolute inset-2 border-2 border-green-500/40 rounded-full animate-[spin_2s_linear_infinite_reverse]" />
        <div className="absolute inset-4 border-2 border-green-500/50 rounded-full animate-[spin_1s_linear_infinite]" />
      </div>
    </div>
  );
} 