export default function PhaseProgress({ currentPhase }) {
  const phases = ['ideation', 'creation', 'reflection'];
  const currentIndex = phases.indexOf(currentPhase);

  return (
    <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
      {phases.map((phase, index) => (
        <div key={phase} className="flex items-center">
          <div 
            className={`w-2 h-2 rounded-full 
              ${index <= currentIndex ? 'bg-green-500' : 'bg-green-500/30'}`}
          />
          {index < phases.length - 1 && (
            <div className={`w-4 h-px 
              ${index < currentIndex ? 'bg-green-500' : 'bg-green-500/30'}`} 
            />
          )}
        </div>
      ))}
    </div>
  );
} 