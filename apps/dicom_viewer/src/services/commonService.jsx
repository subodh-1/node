import React, { useState } from 'react';
import { Tooltip } from '../ui/Tooltip/Tooltip';

export const IconLoader = ({ name, width, height, isCircular, borderRadius, caption, tooltipPosition }) => {
  const svgPath = `/images/${name}`; // Assuming images are stored in the public/images folder
  const [isHovered, setIsHovered] = useState(false);

  const style = {
    width: `${width}px`,
    height: `${height}px`,
    borderRadius: isCircular ? '20%' : `${borderRadius}px`,
    filter: isHovered ? 'invert(0%)' : 'invert(100%)', // Invert back to 0% when hovered
    transition: 'filter 0.3s ease', // Add a transition for smooth effect
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <Tooltip content={caption} placement={tooltipPosition || 'top'}>
        <img src={svgPath} alt={name} style={style} />
      </Tooltip>
    </div>
  );
};
