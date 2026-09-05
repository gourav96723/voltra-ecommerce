import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <Compass size={48} className="text-[var(--color-teal)] mb-5" />
      <h1 className="font-display text-5xl font-bold text-[var(--color-ink)]">404</h1>
      <p className="text-gray-500 mt-2 max-w-sm">We couldn't find that page. It may have been moved or the link is broken.</p>
      <Link to="/"><Button className="mt-6">Back to Home</Button></Link>
    </div>
  );
}
