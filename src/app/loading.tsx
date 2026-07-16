import { LoadingStream } from '../components/ui/LoadingStream';

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="text-brand-cyan animate-pulse">
        <LoadingStream size={64} />
      </div>
      <p className="text-xs font-sans tracking-widest text-text-gray animate-pulse uppercase">
        Loading Repetitions...
      </p>
    </div>
  );
}
