import { useEffect, useRef } from 'react';

export const useMountEffect = (effect) => {
  const effectRef = useRef(effect);
  effectRef.current = effect;

  useEffect(() => effectRef.current(), []);
};

export default useMountEffect;
