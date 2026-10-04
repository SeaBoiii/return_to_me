import { useEffect, useState } from 'react';

export function usePortrait() {
  const [portrait, setPortrait] = useState(() => window.matchMedia('(orientation: portrait)').matches);
  useEffect(() => {
    const query = window.matchMedia('(orientation: portrait)');
    const update = () => setPortrait(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return portrait;
}
