import React from 'react';
import { LungsTool } from './Filter/LungsTool';
import { DetectBrainTool } from './Filter/DetectBrainTool';
import { ToolbarContextProvider } from './ToolbarContext';
import { SobelTool } from './Filter/SobelTool';
import { BilateralTool } from './Filter/BilateralTool';
import { CollapsibleGroup } from '../Layout/collapseElements';

export const FilterTools = () => {
  let keepDragable = true;
  return (
    <ToolbarContextProvider>
      <CollapsibleGroup
        direction="horizontal"
        toggleName="Windowing"
        iconName="filtering_tool.png"
        isCircular="true"
        appearance="vertical"
        keepDragable={keepDragable}
      >
        <span className="filter-tools-container">
          <LungsTool keepDragable={keepDragable} />
          <DetectBrainTool keepDragable={keepDragable} />
          <SobelTool keepDragable={keepDragable} />
          <BilateralTool keepDragable={keepDragable} />
        </span>
      </CollapsibleGroup>
    </ToolbarContextProvider>
  );
};
