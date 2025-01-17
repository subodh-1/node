/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable no-magic-numbers */
/**
 * 3D volume processing engine: transfer texture
 * @module lib/scripts/graphics3d/transferTexture
 */
import * as THREE from 'three';
import customConfig from '../config/customConfig.json';
/** Class for transfer texture computation and rendering */
export default class TransferTexture {
  constructor() {
    this.selectedROIs = null;
    this.transferFuncRgba = null;
    this.transferFuncTexture = null;
    this.texRoiColor = null;
    this.texRoiId = null;
    this.numRois = 256;
    this.m_handleColors = [
      { r: 0, g: 0, b: 0 },
      { r: 255, g: 128, b: 64 },
      { r: 255, g: 0, b: 0 },
      { r: 128, g: 64, b: 64 },
      { r: 128, g: 0, b: 0 },
      { r: 64, g: 64, b: 64 },
      { r: 128, g: 128, b: 128 },
      { r: 192, g: 192, b: 192 },
      { r: 255, g: 255, b: 255 },
      { r: 255, g: 255, b: 255 },
    ];
  }

  /**
   * Filtering the source data and building the normals on the GPU
   * @param isRoiVolume
   * @param roiColors Array of roi colors in RGBA format
   */
  init(isRoiVolume, roiColors) {
    const c4 = 4;
    // eslint-disable-next-line
    this.selectedROIs = new Uint8Array(c4 * this.numRois);
    this.numTfPixels = 256;
    // eslint-disable-next-line
    this.transferFuncRgba = new Uint8Array(c4 * this.numTfPixels);
    this.texRoiColor = null;
    if (isRoiVolume) {
      this.texRoiId = this.createSelectedRoiMap();
      this.texRoiColor = this.createRoiColorMap(roiColors);
    }
  }

  /**
   * Create 2D texture containing transfer func colors
   */
  createTransferFuncTexture() {
    const boneColor = hexToRgb(customConfig.boneColorHex);
    const redColor = hexToRgb(customConfig.redColorHex);
    let textureOut = null;
    let alpha = 0;
    const SCALE = 255;
    const SCALE1 = customConfig.boneOpacity; // Adjusted for more opacity
    const SCALE2 = customConfig.boneTranspacity; // Adjusted for more transparency
    const A1 = 0.09;
    const A2 = 0.2;
    const A3 = 0.3;
    const A4 = 0.43;
    const A5 = 0.53;
    const a1 = A1 * SCALE;
    const a2 = A2 * SCALE;
    const a3 = A3 * SCALE;
    const a4 = A4 * SCALE;
    const a5 = A5 * SCALE;

    // Convert hex colors to RGB
    function hexToRgb(hex) {
      const bigint = parseInt(hex.slice(1), 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      return { r, g, b };
    }

    const FOUR = 4;
    for (let pix = 0; pix < this.numTfPixels; pix++) {
      if (pix > a1 && pix < a2) {
        alpha = (pix - a1) / (a2 - a1);
      } else if (pix > a2 && pix < a3) {
        alpha = (a3 - pix) / (a3 - a2);
      } else if (pix > a4 && pix < a5) {
        alpha = (pix - a4) / (a5 - a4);
      } else if (pix > a5) {
        alpha = 1;
      } else {
        alpha = 0; // Ensure alpha is 0 for other areas
      }

      // Apply red color element for non-bone
      this.transferFuncRgba[pix * FOUR + 0] = redColor.r;
      this.transferFuncRgba[pix * FOUR + 1] = redColor.g;
      this.transferFuncRgba[pix * FOUR + 2] = redColor.b;
      this.transferFuncRgba[pix * FOUR + 3] = (SCALE * alpha) / SCALE1;

      // Apply bone color
      if (pix > a4) {
        this.transferFuncRgba[pix * FOUR + 0] = boneColor.r;
        this.transferFuncRgba[pix * FOUR + 1] = boneColor.g;
        this.transferFuncRgba[pix * FOUR + 2] = boneColor.b;
        this.transferFuncRgba[pix * FOUR + 3] = (SCALE * alpha) / SCALE2;
      }
    }

    textureOut = new THREE.DataTexture(this.transferFuncRgba, this.numTfPixels, 1, THREE.RGBAFormat);
    textureOut.wrapS = THREE.ClampToEdgeWrapping;
    textureOut.wrapT = THREE.ClampToEdgeWrapping;
    textureOut.magFilter = THREE.LinearFilter;
    textureOut.minFilter = THREE.LinearFilter;
    textureOut.needsUpdate = true;
    this.transferFuncTexture = textureOut;
    return textureOut;
  }

  /**
   * Creates transfer function color map
   * @param ctrlPts Array of control points of type HEX  = color value
   */
  setTransferFuncColors(colors) {
    this.transferFuncCtrlPtsRgb = [];
    for (let i = 0; i < colors.length; i++) {
      this.transferFuncCtrlPtsRgb.push(new THREE.Vector3(colors[i].r, colors[i].g, colors[i].b));
    }
  }

  /**
   * Creates transfer function color map
   * @param ctrlPts Array of Vector2 where (x,y) = x coordinate in [0, 1], alpha value in [0, 1]
   */
  updateTransferFuncTexture(intensities, opacities) {
    if (this.transferFuncRgba === null) {
      return null;
    }
    for (let curPt = 0; curPt < intensities.length - 1; curPt++) {
      const pixStart = Math.floor(intensities[curPt]);
      const pixEnd = Math.floor(intensities[curPt + 1]);
      for (let pix = pixStart; pix < pixEnd; pix++) {
        const lerpVal = (pix - pixStart) / (pixEnd - pixStart);
        const colorX = (1.0 - lerpVal) * this.m_handleColors[curPt].r + lerpVal * this.m_handleColors[curPt + 1].r;
        const colorY = (1.0 - lerpVal) * this.m_handleColors[curPt].g + lerpVal * this.m_handleColors[curPt + 1].g;
        const colorZ = (1.0 - lerpVal) * this.m_handleColors[curPt].b + lerpVal * this.m_handleColors[curPt + 1].b;
        // eslint-disable-next-line
        this.transferFuncRgba[pix * 4 + 0] = colorX;
        // eslint-disable-next-line
        this.transferFuncRgba[pix * 4 + 1] = colorY;
        // eslint-disable-next-line
        this.transferFuncRgba[pix * 4 + 2] = colorZ;
        // eslint-disable-next-line
        const op1 = opacities[curPt] > 0.0 ? opacities[curPt] : 0.0;
        const op2 = opacities[curPt + 1] > 0.0 ? opacities[curPt + 1] : 0.0;
        this.transferFuncRgba[pix * 4 + 3] = (op2 * lerpVal + (1.0 - lerpVal) * op1) * 255;
      }
    }
    this.transferFuncTexture.needsUpdate = true;
    return this.transferFuncRgba;
  }

  /**
   * Create 2D texture containing roi color map
   * @param colorArray 256 RGBA roi colors
   */
  createRoiColorMap(colorArray) {
    let textureOut = null;
    if (colorArray !== null) {
      //textureOut = new THREE.DataTexture(colorArray, this.numRois, 1, THREE.RGBAFormat);
      textureOut = new THREE.DataTexture(colorArray, 256, 1, THREE.RGBAFormat);
    } else {
      // eslint-disable-next-line
      const colorROIs = new Uint8Array(4 * this.numRois);
      for (let pix = 0; pix < this.numRois; pix++) {
        // eslint-disable-next-line
        colorROIs[pix * 4 + 0] = 255;
        // eslint-disable-next-line
        colorROIs[pix * 4 + 1] = 0;
        // eslint-disable-next-line
        colorROIs[pix * 4 + 2] = 0;
        // eslint-disable-next-line
        colorROIs[pix * 4 + 3] = 255;
      }
      textureOut = new THREE.DataTexture(colorROIs, this.numRois, 1, THREE.RGBAFormat);
    }
    textureOut.wrapS = THREE.ClampToEdgeWrapping;
    textureOut.wrapT = THREE.ClampToEdgeWrapping;
    textureOut.magFilter = THREE.NearestFilter;
    textureOut.minFilter = THREE.NearestFilter;
    textureOut.needsUpdate = true;
    return textureOut;
  }

  /**
   * Create 2D texture containing selected ROIs
   */
  createSelectedRoiMap() {
    const a1 = 50;
    const a2 = 240;
    const c1 = 1;
    const c2 = 2;
    const c3 = 3;
    const BYTES_IN_COLOR = 4;
    for (let pix = 0; pix < this.numRois; pix++) {
      if (pix < a1 || pix > a2) {
        this.selectedROIs[pix * BYTES_IN_COLOR] = 0;
      } else {
        this.selectedROIs[pix * BYTES_IN_COLOR] = 255;
      }
      this.selectedROIs[pix * BYTES_IN_COLOR + c1] = 0;
      this.selectedROIs[pix * BYTES_IN_COLOR + c2] = 0;
      this.selectedROIs[pix * BYTES_IN_COLOR + c3] = 0;
    }
    //const textureOut = new THREE.DataTexture(this.selectedROIs, this.numRois, 1, THREE.RGBAFormat);
    const textureOut = new THREE.DataTexture(this.selectedROIs, 256, 1, THREE.RGBAFormat);
    textureOut.wrapS = THREE.ClampToEdgeWrapping;
    textureOut.wrapT = THREE.ClampToEdgeWrapping;
    textureOut.magFilter = THREE.NearestFilter;
    textureOut.minFilter = THREE.NearestFilter;
    textureOut.needsUpdate = true;
    return textureOut;
  }

  /**
   * Create 2D texture containing selected ROIs
   * @param selectedROIs 256 byte roi values
   */
  updateSelectedRoiMap(selectedROI) {
    const roiTexelBpp = 4;
    const roiSelectedTrue = 255;
    const roiSelectedFalse = 0;
    for (let pix = 0; pix < this.numRois; pix++) {
      if (selectedROI.indexOf(pix) !== -1) {
        this.selectedROIs[pix * roiTexelBpp] = roiSelectedTrue;
      } else {
        this.selectedROIs[pix * roiTexelBpp] = roiSelectedFalse;
      }
    }
    this.texRoiId.needsUpdate = true;
  }
  /**
   * Update roi selection map
   * @param roiId ROI id from 0..255
   * @param selectedState True if roi must be visible
   */
  // eslint-disable-next-line
  updateSelectedRoi(roiId, selectedState) {
    const roiTexelBpp = 4;
    const roiChecked = 255;
    const roiUnchecked = 0;
    if (selectedState) {
      this.selectedROIs[roiTexelBpp * roiId] = roiChecked;
    } else {
      this.selectedROIs[roiTexelBpp * roiId] = roiUnchecked;
    }
    console.log(`initMatBlure: ${this.initMatBlure}`);
    this.texRoiId.needsUpdate = true;
    //this.setVolumeTexture(1.0);
  }
} // class TransferTexture
