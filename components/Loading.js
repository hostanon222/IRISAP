export default function Loading() {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        <div className="text-green-500 font-mono animate-pulse">
          Processing...
        </div>
      </div>
    </div>
  );
} 