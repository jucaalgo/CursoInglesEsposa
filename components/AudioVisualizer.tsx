import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  isActive: boolean;
  isDark: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isActive, isDark }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const animate = () => {
      if (!isActive) {
         ctx.clearRect(0, 0, canvas.width, canvas.height);
         return;
      }
      
      time += 0.1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, isDark ? '#60a5fa' : '#3b82f6');
      gradient.addColorStop(0.5, isDark ? '#a78bfa' : '#8b5cf6');
      gradient.addColorStop(1, isDark ? '#60a5fa' : '#3b82f6');
      
      ctx.fillStyle = gradient;
      
      const bars = 20;
      const barWidth = canvas.width / bars;
      
      for (let i = 0; i < bars; i++) {
        const height = Math.sin(time + i * 0.5) * 20 + Math.random() * 10 + 10;
        const x = i * barWidth;
        const y = (canvas.height - height) / 2;
        
        // Rounded bars
        ctx.beginPath();
        ctx.roundRect(x + 2, y, barWidth - 4, height, 4);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    if (isActive) {
      animate();
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(animationRef.current);
    }

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isActive, isDark]);

  return <canvas ref={canvasRef} width={300} height={60} className="w-full h-[60px]" />;
};

export default AudioVisualizer;