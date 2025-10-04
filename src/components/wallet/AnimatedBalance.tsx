import React, { useEffect, useState, useCallback } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface AnimatedBalanceProps {
  value: number;
  currency: string;
  duration?: number;
}

export const AnimatedBalance: React.FC<AnimatedBalanceProps> = ({
  value,
  currency = 'CDF',
  duration = 1
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const spring = useSpring(0, { duration: duration * 1000, bounce: 0 });
  const display = useTransform(spring, (latest) => Math.floor(latest).toLocaleString('fr-CD'));

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  const handleChange = useCallback((latest: number) => {
    setDisplayValue(Math.floor(latest));
  }, []);

  useEffect(() => {
    const unsubscribe = spring.on("change", handleChange);
    return unsubscribe;
  }, [spring, handleChange]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="font-bold tracking-tight"
    >
      <motion.span className="text-3xl md:text-4xl">
        {display.get()}
      </motion.span>
      <span className="text-xl md:text-2xl ml-2 opacity-90">{currency}</span>
    </motion.div>
  );
};
