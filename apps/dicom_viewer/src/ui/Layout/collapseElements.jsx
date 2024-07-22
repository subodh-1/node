import React, { useState, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import { IconLoader } from '../../services/commonService';
import './CollapsibleGroup.css';
function buttonSizeSet() {
  const screenWidth = window.innerWidth;
  // console.log('innerWidth :', screenWidth);
  let buttonSize = 45;
  if (screenWidth < 768) {
    buttonSize = 35;
  } else if (screenWidth > 768 && screenWidth < 1024) {
    buttonSize = 45;
  } else if (screenWidth > 1024 && screenWidth < 3500) {
    buttonSize = 50;
  } else if (screenWidth > 3500) {
    buttonSize = 85;
  }
  // console.log('buttonSize--', buttonSize);
  return buttonSize;
}
export const CollapsibleGroup = ({
  children,
  toggleName,
  keepDragable = true,
  appearance,
  iconSize = buttonSizeSet(),
  isCircular = false,
  iconName,
}) => {
  const [collapsed, setCollapsed] = useState(true);
  const groupRef = useRef();

  let iconHeight = iconSize + 15;
  let iconWidth = isCircular ? iconSize + 15 : iconSize + 68;

  // Function to handle the toggle of collapse
  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (groupRef.current && !groupRef.current.contains(event.target)) {
        setCollapsed(true);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside); // Add touchstart event
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside); // Remove touchstart event
    };
  }, []);

  // Set the collapse type
  const containerStyle = {};

  let collapseElementStyle = {
    display: collapsed ? 'none' : 'block',
    position: appearance && appearance === 'horizontal' ? 'static' : 'absolute', // Adjust position for horizontal appearance
  };

  return (
    <Draggable disabled={!keepDragable}>
      <div ref={groupRef} className="collapsible-container" style={containerStyle}>
        {
          <div style={{ zIndex: 1000, marginLeft: '5px', alignContent: 'center', height: iconHeight * 1.26 }}>
            <button
              className={`btn  collapsible-button ${isCircular ? '' : 'rounded'} ${collapsed ? '' : 'active'}`}
              type="button"
              onClick={toggleCollapse} // Add onTouchStart event
              {...(keepDragable ? { onTouchStart: toggleCollapse } : {})}
              aria-expanded={!collapsed}
              aria-controls="collapseWidthExample"
              style={{
                width: iconWidth,
                height: iconHeight,
              }}
            >
              {iconName ? (
                <IconLoader name={iconName} width={iconWidth - 25} height={iconHeight - 25} isCircular={isCircular} caption={toggleName} />
              ) : (
                toggleName
              )}
            </button>
          </div>
        }

        <div
          className={`collapsible-element ${appearance == 'horizontal' ? 'horizontal' : ''} ${collapsed ? '' : 'show'}`}
          style={collapseElementStyle}
        >
          <div className="card card">
            <div className="card-body collapsible-card-body">{children}</div>
          </div>
        </div>
      </div>
    </Draggable>
  );
};
