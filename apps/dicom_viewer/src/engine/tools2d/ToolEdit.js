/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileOverview ToolEdit
 * @author Epam
 * @version 1.0.0
 */

// **********************************************
// Imports
// **********************************************

import ToolDistance from './ToolDistance';

// **********************************************
// Class
// **********************************************

class ToolEdit {
  constructor(objGra) {
    this.m_objGraphics2d = objGra;
    this.m_wScreen = 0;
    this.m_hScreen = 0;

    this.m_xPixelSize = 0;
    this.m_yPixelSize = 0;

    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);

    //SUBODH :: Touch events
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);

    this.render = this.render.bind(this);

    this.m_mousePressed = false;
    this.m_pointTracked = null;
    this.m_toolTracked = null;
  }

  setScreenDim(wScr, hScr) {
    this.m_wScreen = wScr;
    this.m_hScreen = hScr;
  }

  setPixelSize(xs, ys) {
    this.m_xPixelSize = xs;
    this.m_yPixelSize = ys;
  }

  clear() {
    this.m_mousePressed = false;
    this.m_pointTracked = null;
    this.m_toolTracked = null;
  }

  /**
   * When mouse pressed down
   *
   * @param {number} xScr - x coordinate of click on screen
   * @param {number} yScr - y coordinate of click on screen
   * @param {object} store - global storage
   */
  onMouseDown() {
    // ommited args: xScr, yScr, store
    this.m_mousePressed = true;
  }

  onMouseMove(xScr, yScr, store) {
    if (!this.m_mousePressed) {
      // fly mouse over objects on 2d screen
      // const vTex = ToolDistance.screenToTexture(xScr, yScr, this.m_wScreen, this.m_hScreen, store);
      const vScr = {
        x: xScr,
        y: yScr,
      };

      const toolDist = this.m_objGraphics2d.m_toolDistance;
      const toolAngle = this.m_objGraphics2d.m_toolAngle;
      const toolArea = this.m_objGraphics2d.m_toolArea;
      const toolRect = this.m_objGraphics2d.m_toolRect;
      const toolText = this.m_objGraphics2d.m_toolText;
      const tools = [toolDist, toolAngle, toolArea, toolRect, toolText];
      const trackedBefore = this.m_pointTracked !== null;
      this.m_pointTracked = null;
      const numTools = tools.length;
      for (let i = 0; i < numTools; i++) {
        const objTool = tools[i];
        const vDetect = objTool.getEditPoint(vScr, store);
        if (vDetect !== null) {
          // console.log(`ToolEdit. point tracked: ${vDetect.x}, ${vDetect.y}`);
          this.m_pointTracked = vDetect;
          this.m_toolTracked = objTool;
          break;
        }
      } // for i all tools
      const trackedNow = this.m_pointTracked !== null;
      if (trackedNow || (trackedBefore && !trackedNow)) {
        // invoke forced 2d render
        this.m_objGraphics2d.forceUpdate();
      }
    } else {
      if (this.m_pointTracked !== null) {
        const vTexNew = ToolDistance.screenToTexture(xScr, yScr, this.m_wScreen, this.m_hScreen, store);
        this.m_toolTracked.moveEditPoint(this.m_pointTracked, vTexNew);
        // invoke forced 2d render
        this.m_objGraphics2d.forceUpdate();
      } // if we have tracked point
    }
  }

  onMouseUp() {
    // ommited args : xScr, yScr, store
    this.m_mousePressed = false;
  }
  // SUBODH :: Touch events
  // SUBODH :: onTouchStart
  onTouchStart() {
    this.m_mousePressed = true;
  } // End onTouchStart

  // SUBODH on onTouchMove
  onTouchMove(xScr, yScr, store) {
    // Check if the mouse is not pressed
    if (!this.m_mousePressed) {
      // Convert touch coordinates to screen coordinates
      const vScr = {
        x: xScr,
        y: yScr,
      };

      // Get tools from the 2D graphics object
      const toolDist = this.m_objGraphics2d.m_toolDistance;
      const toolAngle = this.m_objGraphics2d.m_toolAngle;
      const toolArea = this.m_objGraphics2d.m_toolArea;
      const toolRect = this.m_objGraphics2d.m_toolRect;
      const toolText = this.m_objGraphics2d.m_toolText;
      const tools = [toolDist, toolAngle, toolArea, toolRect, toolText];

      // Track if a point was tracked before
      const trackedBefore = this.m_pointTracked !== null;
      this.m_pointTracked = null;

      // Iterate over each tool to detect the edit point
      for (let i = 0; i < tools.length; i++) {
        const objTool = tools[i];
        const vDetect = objTool.getEditPoint(vScr, store);
        if (vDetect !== null) {
          this.m_pointTracked = vDetect;
          this.m_toolTracked = objTool;
          break;
        }
      }

      // Track if a point is currently being tracked
      const trackedNow = this.m_pointTracked !== null;

      // If a point is currently tracked or was tracked before but not anymore, force update the 2D render
      if (trackedNow || (trackedBefore && !trackedNow)) {
        this.m_objGraphics2d.forceUpdate();
      }
    } else {
      // If the mouse is pressed and a point is tracked
      if (this.m_pointTracked !== null) {
        // Convert touch coordinates to texture coordinates
        const vTexNew = ToolDistance.screenToTexture(xScr, yScr, this.m_wScreen, this.m_hScreen, store);
        // Move the tracked edit point
        this.m_toolTracked.moveEditPoint(this.m_pointTracked, vTexNew);
        // Force update the 2D render
        this.m_objGraphics2d.forceUpdate();
      }
    }
  }
  // End onTouchMove
  // SUBODH :: onTouchEnd
  onTouchEnd() {
    this.m_mousePressed = false;
  } //End onTouchEnd

  /**
   * Render all areas on screen in 2d mode
   *
   * @param {object} ctx - html5 canvas context
   * @param {object} store - global store with app parameters
   */
  render(ctx, store) {
    if (this.m_pointTracked !== null) {
      const vScr = ToolDistance.textureToScreen(this.m_pointTracked.x, this.m_pointTracked.y, this.m_wScreen, this.m_hScreen, store);
      const RAD_CIRCLE_EDIT = 4;
      //ctx.lineWidth = 2;
      //ctx.strokeStyle = 'green';
      ctx.fillStyle = 'rgb(120, 250, 120)';
      ctx.beginPath();
      ctx.arc(vScr.x, vScr.y, RAD_CIRCLE_EDIT, 0.0, 2 * 3.1415962, false);
      // ctx.stroke();
      ctx.fill();
    }
  } // end render
} // end class ToolText

export default ToolEdit;
