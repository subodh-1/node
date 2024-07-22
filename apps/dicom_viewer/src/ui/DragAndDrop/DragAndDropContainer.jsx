import React, { useState } from 'react';
import css from '../Main.module.css';

export const DragAndDropContainer = ({ children }) => {
  const [position, setPosition] = useState({ bottom: 20, right: 10 });
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const startDrag = (e) => {
    // Prevent default touch behavior
    if (e.target.tagName.toLowerCase() !== 'span') {
      setIsDragging(true);
      const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
      const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

      setOffset({
        x: clientX,
        y: clientY,
        right: position.right,
        bottom: position.bottom,
      });
    }
  };

  const stopDrag = () => {
    setIsDragging(false);
  };

  const handleDrag = (e) => {
    // Prevent default touch behavior
    if (isDragging) {
      const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
      const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

      const x = offset.right - (clientX - offset.x);
      const y = offset.bottom - (clientY - offset.y);

      setPosition({ right: x, bottom: y });
    }
  };

  return (
    <div
      onMouseDown={startDrag}
      onMouseUp={stopDrag}
      onMouseMove={handleDrag}
      onTouchStart={startDrag}
      onTouchEnd={stopDrag}
      onTouchMove={handleDrag}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        bottom: position.bottom,
        right: position.right,
        position: 'absolute', // Ensure the element is positioned absolutely
        touchAction: 'none', // Disable touch action to prevent browser interference
      }}
      className={css.settings}
    >
      {children}
    </div>
  );
};
