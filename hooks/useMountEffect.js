import { useEffect } from 'react';

export const useMountEffect = (effect) => {
  useEffect(effect, []);
};

export default useMountEffect;
