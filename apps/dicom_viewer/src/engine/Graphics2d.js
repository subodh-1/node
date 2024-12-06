/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { connect } from 'react-redux';

import Modes2d from '../store/Modes2d';
import StoreActionType from '../store/ActionTypes';
import ToolPick from './tools2d/ToolPick';
import ToolPaint from './tools2d/ToolPaint';
import ToolDistance from './tools2d/ToolDistance';
import ToolAngle from './tools2d/ToolAngle';
import ToolArea from './tools2d/ToolArea';
import ToolRect from './tools2d/ToolRect';
import ToolText from './tools2d/ToolText';
import ToolEdit from './tools2d/ToolEdit';
import ToolDelete from './tools2d/ToolDelete';

import Tools2dType from './tools2d/ToolTypes';
import Segm2d from './Segm2d';

import { getPalette256 } from './loaders/RoiPalette256';

import css from './Graphics2d.module.css';

class Graphics2d extends React.Component {
  constructor(props) {
    super(props);

    this.store = props;
    this.m_mount = React.createRef();
    this.state = {
      lastDistance: null,
    };
    this.onMouseTouchDown = this.onMouseTouchDown.bind(this);
    this.onMouseTouchUp = this.onMouseTouchUp.bind(this);
    this.onMouseTouchMove = this.onMouseTouchMove.bind(this);
    this.onMouseWheel = this.onMouseWheel.bind(this);
    this.setDataWindow = this.setDataWindow.bind(this);

    //Subodh::
    // this.onTouchStartCapture = this.onTouchStartCapture.bind(this);
    // this.onTouchEndCapture = this.onTouchEndCapture.bind(this);
    // this.onTouchMoveCapture = this.onTouchMoveCapture.bind(this);
    // this.onTouchCancelCapture = this.onTouchCancelCapture.bind(this);

    this.m_sliceRatio = 0.5;
    this.m_mode2d = Modes2d.TRANSVERSE;

    // scale
    this.m_zoom = 1;
    this.m_xPos = 0;
    this.m_yPos = 0;

    // mounted
    this.m_isMounted = false;

    // animation
    // this.animate = this.animate.bind(this);
    // this.m_frameId = null;

    // actual render window dimenison
    this.state = {
      wRender: 0,
      hRender: 0,
      stateMouseDown: false,
      xMouse: -1,
      yMouse: -1,
      startX: 0,
      startY: 0,
      lastDistance: null,
    };

    // segm 2d
    this.segm2d = new Segm2d(this);
    this.m_isSegmented = false;
    // data window
    this.m_winRight = 1;
    this.m_winLeft = 0;
    this.m_newWin = false;

    // tools2d
    this.m_toolPick = new ToolPick(this);
    this.m_toolPaint = new ToolPaint(this);
    this.m_toolDistance = new ToolDistance(this);
    this.m_toolAngle = new ToolAngle(this);
    this.m_toolArea = new ToolArea(this);
    this.m_toolRect = new ToolRect(this);
    this.m_toolText = new ToolText(this);
    this.m_toolEdit = new ToolEdit(this);
    this.m_toolDelete = new ToolDelete(this);

    // store
    props.dispatch({ type: StoreActionType.SET_GRAPHICS_2D, graphics2d: this });
  }

  componentDidMount() {
    this.m_isMounted = true;
    this.prepareImageForRender();
    this.renderReadyImage();

    const w = this.m_mount.current.clientWidth;
    const h = this.m_mount.current.clientHeight;
    if (this.state.wRender === 0) {
      this.setState({ wRender: w });
      this.setState({ hRender: h });
    }
  }

  componentWillUnmount() {
    this.m_isMounted = false;
  }

  componentDidUpdate() {
    if (this.m_isMounted) {
      this.renderReadyImage();
    }
  }

  screenshot() {
    return this.m_mount.current.toDataURL();
  }

  setDataWindow(value) {
    const [min, max] = value;
    this.m_winLeft = min;
    this.m_winRight = max;
    this.forceUpdate();
  }

  prepareImageForRender(volIndexArg) {
    //TODO: center the image by click
    const objCanvas = this.m_mount.current; // Canvas HTML element reference
    if (objCanvas === null) {
      return;
    }
    // resetting canvas max sizes, by checking its wrapper's size
    const canvasWrapper = objCanvas.parentNode;
    const w = canvasWrapper.clientWidth;
    const h = canvasWrapper.clientHeight;
    if (w * h === 0) {
      return;
    }

    const ctx = objCanvas.getContext('2d');
    ctx.fillStyle = 'rgb(64, 64, 64)';
    ctx.fillRect(0, 0, w, h);

    const store = this.props;
    const volSet = store.volumeSet;
    const dicom = store.loaderDicom;
    if (dicom != null && !this.props.is16bit) {
      this.m_winRight = dicom.m_winRight;
      this.m_winLeft = dicom.m_winLeft;
    }
    // const volIndex = this.m_volumeIndex;
    const volIndex = volIndexArg !== undefined ? volIndexArg : store.volumeIndex;

    const vol = volSet.getVolume(volIndex);
    const mode2d = this.m_mode2d;
    const sliceRatio = store.sliceRatio;

    if (vol === null) return;

    if (vol.m_dataArray === null) {
      console.log('Graphics2d. Volume has no data array');
      return;
    }
    const xDim = vol.m_xDim;
    const yDim = vol.m_yDim;
    const zDim = vol.m_zDim;
    const xyDim = xDim * yDim;
    let dataSrc = vol.m_dataArray; // 1 or 4 bytes array of pixels
    if (dicom != null && this.props.is16bit) {
      dataSrc = vol.m_dataArray16; // 2 bytes array of pixels
    }
    if (dataSrc.length !== xDim * yDim * zDim * vol.m_bytesPerVoxel) {
      console.log(`Bad src data len = ${dataSrc.length}, but expect ${xDim}*${yDim}*${zDim}`);
    }

    // console.log(`Graphics2d. prepareImageForRender. mode= ${mode2d}`);

    const ONE = 1;
    const FOUR = 4;
    const OFF_3 = 3;

    let imgData = null;
    let dataDst = null;

    const roiPal256 = getPalette256();

    // determine actual render square (not w * h - viewport)
    // calculate area using physical volume dimension
    const TOO_SMALL = 1.0e-5;
    const pbox = vol.m_boxSize;
    if (pbox.x * pbox.y * pbox.z < TOO_SMALL) {
      console.log(`Bad physical dimensions for rendered volume = ${pbox.x}*${pbox.y}*${pbox.z} `);
    }
    let wScreen = 0,
      hScreen = 0;

    if (mode2d === Modes2d.TRANSVERSE) {
      // calc screen rect based on physics volume slice size (z slice)
      const xyRratio = pbox.x / pbox.y;
      wScreen = w;
      hScreen = Math.floor(w / xyRratio);
      if (hScreen > h) {
        hScreen = h;
        wScreen = Math.floor(h * xyRratio);
        if (wScreen > w) {
          console.log(`logic error! wScreen * hScreen = ${wScreen} * ${hScreen}`);
        }
      }
      hScreen = hScreen > 0 ? hScreen : 1;

      // console.log(`gra2d. render: wScreen*hScreen = ${wScreen} * ${hScreen}, but w*h=${w}*${h} `);

      this.m_toolPick.setScreenDim(wScreen, hScreen);
      this.m_toolPaint.setScreenDim(wScreen, hScreen);
      this.m_toolDistance.setScreenDim(wScreen, hScreen);
      this.m_toolAngle.setScreenDim(wScreen, hScreen);
      this.m_toolArea.setScreenDim(wScreen, hScreen);
      this.m_toolRect.setScreenDim(wScreen, hScreen);
      this.m_toolText.setScreenDim(wScreen, hScreen);
      this.m_toolEdit.setScreenDim(wScreen, hScreen);
      this.m_toolDelete.setScreenDim(wScreen, hScreen);

      // setup pixel size for 2d tools
      const xPixelSize = vol.m_boxSize.x / xDim;
      const yPixelSize = vol.m_boxSize.y / yDim;
      // console.log(`xyPixelSize = ${xPixelSize} * ${yPixelSize}`);
      this.m_toolDistance.setPixelSize(xPixelSize, yPixelSize);
      this.m_toolAngle.setPixelSize(xPixelSize, yPixelSize);
      this.m_toolArea.setPixelSize(xPixelSize, yPixelSize);
      this.m_toolRect.setPixelSize(xPixelSize, yPixelSize);
      this.m_toolText.setPixelSize(xPixelSize, yPixelSize);
      this.m_toolEdit.setPixelSize(xPixelSize, yPixelSize);
      this.m_toolDelete.setPixelSize(xPixelSize, yPixelSize);

      // create image data
      imgData = ctx.createImageData(wScreen, hScreen);
      dataDst = imgData.data;
      if (dataDst.length !== wScreen * hScreen * 4) {
        console.log(`Bad dst data len = ${dataDst.length}, but expect ${wScreen}*${hScreen}*4`);
      }

      // z slice
      let zSlice = Math.floor(zDim * sliceRatio);
      zSlice = zSlice < zDim ? zSlice : zDim - 1;
      const zOff = zSlice * xyDim;
      const xStep = xDim / wScreen;
      const yStep = yDim / hScreen;
      let j = 0;
      if (vol.m_bytesPerVoxel === ONE) {
        for (let y = 0; y < hScreen; y++) {
          const ySrc = Math.floor(y * yStep);
          const yOff = ySrc * xDim;
          for (let x = 0; x < wScreen; x++) {
            const xSrc = Math.floor(x * xStep);
            const val = dataSrc[zOff + yOff + xSrc];
            let newVal = val;
            if (dicom != null && this.props.is16bit) {
              const scale = 255 / ((this.m_winRight - this.m_winLeft) * (dicom.m_maxVal - dicom.m_minVal));
              newVal = Math.floor((val - this.m_winLeft * (dicom.m_maxVal - dicom.m_minVal)) * scale);
            }
            if (newVal < 0) newVal = 0;
            if (newVal > 255) newVal = 255;
            dataDst[j + 0] = newVal;
            dataDst[j + 1] = newVal;
            dataDst[j + 2] = newVal;
            dataDst[j + 3] = 255; // opacity
            j += 4;
          } // for (x)
        } // for (y)
      } else if (vol.m_bytesPerVoxel === FOUR) {
        for (let y = 0; y < hScreen; y++) {
          const ySrc = Math.floor(y * yStep);
          const yOff = ySrc * xDim;
          for (let x = 0; x < wScreen; x++) {
            const xSrc = Math.floor(x * xStep);
            const val = dataSrc[(zOff + yOff + xSrc) * FOUR + OFF_3];
            const val4 = val * FOUR;
            const rCol = roiPal256[val4 + 0];
            const gCol = roiPal256[val4 + 1];
            const bCol = roiPal256[val4 + 2];

            dataDst[j + 0] = bCol;
            dataDst[j + 1] = gCol;
            dataDst[j + 2] = rCol;
            dataDst[j + 3] = 255;
            j += 4;
          } // for (x)
        } // for (y)
      } // if 4 bpp
    } else if (mode2d === Modes2d.SAGGITAL) {
      // calc screen rect based on physics volume slice size (x slice)
      const yzRatio = pbox.y / pbox.z;
      wScreen = w;
      hScreen = Math.floor(w / yzRatio);
      if (hScreen > h) {
        hScreen = h;
        wScreen = Math.floor(h * yzRatio);
        if (wScreen > w) {
          console.log(`logic error! wScreen * hScreen = ${wScreen} * ${hScreen}`);
        }
      }
      hScreen = hScreen > 0 ? hScreen : 1;
      // console.log(`gra2d. render: wScreen*hScreen = ${wScreen} * ${hScreen}, but w*h=${w}*${h} `);

      this.m_toolPick.setScreenDim(wScreen, hScreen);
      this.m_toolPaint.setScreenDim(wScreen, hScreen);
      this.m_toolDistance.setScreenDim(wScreen, hScreen);
      this.m_toolAngle.setScreenDim(wScreen, hScreen);
      this.m_toolArea.setScreenDim(wScreen, hScreen);
      this.m_toolRect.setScreenDim(wScreen, hScreen);
      this.m_toolText.setScreenDim(wScreen, hScreen);
      this.m_toolEdit.setScreenDim(wScreen, hScreen);
      this.m_toolDelete.setScreenDim(wScreen, hScreen);

      // setup pixel size for 2d tools
      const xPixelSize = vol.m_boxSize.y / yDim;
      const yPixelSize = vol.m_boxSize.z / zDim;
      // console.log(`xyPixelSize = ${xPixelSize} * ${yPixelSize}`);
      this.m_toolDistance.setPixelSize(xPixelSize, yPixelSize);
      this.m_toolAngle.setPixelSize(xPixelSize, yPixelSize);
      this.m_toolArea.setPixelSize(xPixelSize, yPixelSize);
      this.m_toolRect.setPixelSize(xPixelSize, yPixelSize);
      this.m_toolText.setPixelSize(xPixelSize, yPixelSize);
      this.m_toolEdit.setPixelSize(xPixelSize, yPixelSize);
      this.m_toolDelete.setPixelSize(xPixelSize, yPixelSize);

      // create image data
      imgData = ctx.createImageData(wScreen, hScreen);
      dataDst = imgData.data;
      if (dataDst.length !== wScreen * hScreen * 4) {
        console.log(`Bad dst data len = ${dataDst.length}, but expect ${wScreen}*${hScreen}*4`);
      }

      // x slice
      let xSlice = Math.floor(xDim * sliceRatio);
      xSlice = xSlice < xDim ? xSlice : xDim - 1;

      const yStep = yDim / wScreen;
      const zStep = zDim / hScreen;
      let j = 0;
      if (vol.m_bytesPerVoxel === ONE) {
        for (let y = 0; y < hScreen; y++) {
          const zSrc = Math.floor(y * zStep);
          const zOff = zSrc * xDim * yDim;
          for (let x = 0; x < wScreen; x++) {
            const ySrc = Math.floor(x * yStep);
            const yOff = ySrc * xDim;
            const val = dataSrc[zOff + yOff + xSlice];
            let newVal = val;
            if (dicom != null) {
              const scale = 255 / ((this.m_winRight - this.m_winLeft) * (dicom.m_maxVal - dicom.m_minVal));
              newVal = Math.floor((val - this.m_winLeft * (dicom.m_maxVal - dicom.m_minVal)) * scale);
            }
            if (newVal < 0) newVal = 0;
            if (newVal > 255) newVal = 255;
            dataDst[j + 0] = newVal;
            dataDst[j + 1] = newVal;
            dataDst[j + 2] = newVal;
            dataDst[j + 3] = 255; // opacity
            j += 4;
          } // for (x)
        } // for (y)
      } else if (vol.m_bytesPerVoxel === FOUR) {
        for (let y = 0; y < hScreen; y++) {
          const zSrc = Math.floor(y * zStep);
          const zOff = zSrc * xDim * yDim;
          for (let x = 0; x < wScreen; x++) {
            const ySrc = Math.floor(x * yStep);
            const yOff = ySrc * xDim;
            const val = dataSrc[(zOff + yOff + xSlice) * FOUR + OFF_3];
            const val4 = val * FOUR;
            const rCol = roiPal256[val4 + 0];
            const gCol = roiPal256[val4 + 1];
            const bCol = roiPal256[val4 + 2];

            dataDst[j + 0] = bCol;
            dataDst[j + 1] = gCol;
            dataDst[j + 2] = rCol;
            dataDst[j + 3] = 255; // opacity

            j += 4;
          } // for (x)
        } // for (y)
      } // if 4 bppp
    } else if (mode2d === Modes2d.CORONAL) {
      // calc screen rect based on physics volume slice size (y slice)
      const xzRatio = pbox.x / pbox.z;
      wScreen = w;
      hScreen = Math.floor(w / xzRatio);
      if (hScreen > h) {
        hScreen = h;
        wScreen = Math.floor(h * xzRatio);
        if (wScreen > w) {
          console.log(`logic error! wScreen * hScreen = ${wScreen} * ${hScreen}`);
        }
      }
      hScreen = hScreen > 0 ? hScreen : 1;
      // console.log(`gra2d. render: wScreen*hScreen = ${wScreen} * ${hScreen}, but w*h=${w}*${h} `);

      this.m_toolPick.setScreenDim(wScreen, hScreen);
      this.m_toolPaint.setScreenDim(wScreen, hScreen);
      this.m_toolDistance.setScreenDim(wScreen, hScreen);
      this.m_toolAngle.setScreenDim(wScreen, hScreen);
      this.m_toolArea.setScreenDim(wScreen, hScreen);
      this.m_toolRect.setScreenDim(wScreen, hScreen);
      this.m_toolText.setScreenDim(wScreen, hScreen);
      this.m_toolEdit.setScreenDim(wScreen, hScreen);
      this.m_toolDelete.setScreenDim(wScreen, hScreen);

      // setup pixel size for 2d tools
      const xPixelSize = vol.m_boxSize.x / xDim;
      const yPixelSize = vol.m_boxSize.z / zDim;
      // console.log(`xyPixelSize = ${xPixelSize} * ${yPixelSize}`);
      this.m_toolDistance.setPixelSize(xPixelSize, yPixelSize);
      this.m_toolAngle.setPixelSize(xPixelSize, yPixelSize);
      this.m_toolArea.setPixelSize(xPixelSize, yPixelSize);
      this.m_toolRect.setPixelSize(xPixelSize, yPixelSize);
      this.m_toolText.setPixelSize(xPixelSize, yPixelSize);
      this.m_toolEdit.setPixelSize(xPixelSize, yPixelSize);
      this.m_toolDelete.setPixelSize(xPixelSize, yPixelSize);

      // create image data
      imgData = ctx.createImageData(wScreen, hScreen);
      dataDst = imgData.data;
      if (dataDst.length !== wScreen * hScreen * 4) {
        console.log(`Bad dst data len = ${dataDst.length}, but expect ${wScreen}*${hScreen}*4`);
      }

      // y slice
      let ySlice = Math.floor(yDim * sliceRatio);
      ySlice = ySlice < yDim ? ySlice : yDim - 1;
      const yOff = ySlice * xDim;

      const xStep = xDim / wScreen;
      const zStep = zDim / hScreen;
      let j = 0;
      if (vol.m_bytesPerVoxel === ONE) {
        for (let y = 0; y < hScreen; y++) {
          const zSrc = Math.floor(y * zStep);
          const zOff = zSrc * xDim * yDim;
          for (let x = 0; x < wScreen; x++) {
            const xSrc = Math.floor(x * xStep);
            const val = dataSrc[zOff + yOff + xSrc];
            let newVal = val;
            if (dicom != null) {
              const scale = 255 / ((this.m_winRight - this.m_winLeft) * (dicom.m_maxVal - dicom.m_minVal));
              newVal = Math.floor((val - this.m_winLeft * (dicom.m_maxVal - dicom.m_minVal)) * scale);
            }
            if (newVal < 0) newVal = 0;
            if (newVal > 255) newVal = 255;
            dataDst[j + 0] = newVal;
            dataDst[j + 1] = newVal;
            dataDst[j + 2] = newVal;
            dataDst[j + 3] = 255; // opacity
            j += 4;
          } // for (x)
        } // for (y)
      } else if (vol.m_bytesPerVoxel === FOUR) {
        for (let y = 0; y < hScreen; y++) {
          const zSrc = Math.floor(y * zStep);
          const zOff = zSrc * xDim * yDim;
          for (let x = 0; x < wScreen; x++) {
            const xSrc = Math.floor(x * xStep);
            const val = dataSrc[(zOff + yOff + xSrc) * FOUR + OFF_3];
            const val4 = val * FOUR;
            const rCol = roiPal256[val4 + 0];
            const gCol = roiPal256[val4 + 1];
            const bCol = roiPal256[val4 + 2];

            dataDst[j + 0] = bCol;
            dataDst[j + 1] = gCol;
            dataDst[j + 2] = rCol;
            dataDst[j + 3] = 255; // opacity

            j += 4;
          } // for (x)
        } // for (y)
      } // end if 4 bpp
    }

    // centering: setting canvas image size, to match its HTML element's size
    objCanvas.width = this.m_mount.current.clientWidth;
    objCanvas.height = this.m_mount.current.clientHeight;
    // check is segmentation 2d mode is active
    // const isSegm = store.graphics2dModeSegmentation;
    // console.log("Segm2d mode = " + isSegm);

    this.imgData = imgData;
    this.segm2d.setImageData(imgData);
  } // prepareImageForRender

  fillBackground(ctx) {
    const w = this.m_mount.current.clientWidth;
    const h = this.m_mount.current.clientHeight;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);
  }

  renderReadyImage() {
    const objCanvas = this.m_mount.current;
    const ctx = objCanvas.getContext('2d');
    const store = this.props;
    const zoom = store.render2dZoom;
    const canvasWidth = objCanvas.width;
    const canvasHeight = objCanvas.height;
    const newImgWidth = canvasWidth / zoom;
    const newImgHeight = canvasHeight / zoom;
    const indexTools2d = store.indexTools2d;

    if (indexTools2d === Tools2dType.HAND && !this.state.stateMouseDown) {
      objCanvas.classList.add('cursor-hand');
    } else {
      objCanvas.classList.remove('cursor-hand');
    }

    if (!this.m_isMounted) {
      return;
    }
    if (objCanvas === null) {
      return;
    }
    // prepare canvas
    this.fillBackground(ctx);

    const volSet = store.volumeSet;
    if (volSet.getNumVolumes() === 0) {
      return;
    }
    const volIndex = store.volumeIndex;
    const vol = volSet.getVolume(volIndex);
    if (vol === null) {
      return;
    }

    const isSegm = this.m_isSegmented;
    if (isSegm) {
      const w = this.m_toolPick.m_wScreen;
      const h = this.m_toolPick.m_hScreen;
      this.segm2d.renderImage(ctx, w, h, this.imgData);
    } else {
      createImageBitmap(this.imgData)
        .then((imageBitmap) => {
          const centerX = (canvasWidth - this.imgData.width) / 2;
          const centerY = (canvasHeight - this.imgData.height) / 2;
          const xPos = store.render2dxPos - centerX;
          const yPos = store.render2dyPos - centerY;
          ctx.drawImage(imageBitmap, xPos, yPos, canvasWidth, canvasHeight, 0, 0, newImgWidth, newImgHeight);
        })
        .then(() => {
          this.m_toolPick.render(ctx);
          this.m_toolPaint.render(ctx, store);
          this.m_toolDistance.render(ctx, store);
          this.m_toolAngle.render(ctx, store);
          this.m_toolArea.render(ctx, store);
          this.m_toolRect.render(ctx, store);
          this.m_toolText.render(ctx, store);
          this.m_toolEdit.render(ctx, store);
          this.m_toolDelete.render(ctx, store);
        });
    }
  }

  onMouseWheel(evt) {
    this.handleZoom(evt.deltaY, evt.clientX, evt.clientY);
  }

  onMouseTouchUp(evt) {
    // console.log('612 onMouseUp Captured');
    const objCanvas = this.m_mount.current;
    const store = this.props;
    const indexTools2d = store.indexTools2d;
    let clientX = evt.clientX;
    let clientY = evt.clientY;
    if (evt.touches && evt.touches.length > 0) {
      if (evt.touches.length < 2) {
        this.setState({ lastDistance: null });
      }
      if (evt.touches.length > 2 || evt.touches.length == 2) {
        return;
      }
      clientX = evt.touches[0].clientX;
      clientY = evt.touches[0].clientY;
    }
    this.setState({ stateMouseDown: false });

    if (indexTools2d === Tools2dType.PAINT) {
      const store = this.props;
      const box = this.m_mount.current.getBoundingClientRect();
      const xScr = clientX - box.left;
      const yScr = clientY - box.top;
      this.m_toolPaint.onMouseUp(xScr, yScr, store);
    }
    if (indexTools2d === Tools2dType.DISTANCE) {
      const store = this.props;
      const box = this.m_mount.current.getBoundingClientRect();
      const xScr = clientX - box.left;
      const yScr = clientY - box.top;
      this.m_toolDistance.onMouseUp(xScr, yScr, store);
    }
    if (indexTools2d === Tools2dType.ANGLE) {
      const store = this.props;
      const box = this.m_mount.current.getBoundingClientRect();
      const xScr = clientX - box.left;
      const yScr = clientY - box.top;
      this.m_toolAngle.onMouseUp(xScr, yScr, store);
    }
    if (indexTools2d === Tools2dType.AREA) {
      const store = this.props;
      const box = this.m_mount.current.getBoundingClientRect();
      const xScr = clientX - box.left;
      const yScr = clientY - box.top;
      this.m_toolArea.onMouseUp(xScr, yScr, store);
    }
    if (indexTools2d === Tools2dType.RECT) {
      const store = this.props;
      const box = this.m_mount.current.getBoundingClientRect();
      const xScr = clientX - box.left;
      const yScr = clientY - box.top;
      this.m_toolRect.onMouseUp(xScr, yScr, store);
    }
    if (indexTools2d === Tools2dType.EDIT) {
      const store = this.props;
      const box = this.m_mount.current.getBoundingClientRect();
      const xScr = clientX - box.left;
      const yScr = clientY - box.top;
      this.m_toolEdit.onMouseUp(xScr, yScr, store);
    }
    if (indexTools2d === Tools2dType.DELETE) {
      const store = this.props;
      const box = this.m_mount.current.getBoundingClientRect();
      const xScr = clientX - box.left;
      const yScr = clientY - box.top;
      this.m_toolDelete.onMouseUp(xScr, yScr, store);
    }
    if (store.indexTools2d === Tools2dType.HAND) {
      objCanvas.classList.remove('cursor-grab');
      objCanvas.classList.add('cursor-hand');
    }
  }

  onMouseTouchMove(evt) {
    //console.log('675 onMouseMove Captured');
    let clientX = evt.clientX;
    let clientY = evt.clientY;
    if (evt.touches && evt.touches.length > 0) {
      if (evt.touches.length === 2) {
        const newDistance = this.getDistance(evt.touches);
        const lastDistance = this.state.lastDistance;
        if (lastDistance) {
          const deltaY = (lastDistance - newDistance) * 2; // Adjust the multiplier as needed
          const avgX = (evt.touches[0].clientX + evt.touches[1].clientX) / 2;
          const avgY = (evt.touches[0].clientY + evt.touches[1].clientY) / 2;
          this.handleZoom(deltaY, avgX, avgY);
        }
        this.setState({ lastDistance: newDistance });
        return;
      }
      if (evt.touches.length > 2) {
        return;
      }
      clientX = evt.touches[0].clientX;
      clientY = evt.touches[0].clientY;
    }
    const store = this.props;
    let xPos = store.render2dxPos;
    let yPos = store.render2dyPos;
    const zoom = store.render2dZoom;
    const indexTools2d = store.indexTools2d;
    const box = this.m_mount.current.getBoundingClientRect();
    const xContainer = clientX - box.left;
    const yContainer = clientY - box.top;
    const xScr = xContainer;
    const yScr = yContainer;
    evt = clientX ? evt : evt.touches[0];

    if (indexTools2d === Tools2dType.PAINT) {
      this.m_toolPaint.onMouseMove(xScr, yScr, store);
    }
    if (indexTools2d === Tools2dType.DISTANCE) {
      this.m_toolDistance.onMouseMove(xScr, yScr, store);
    }
    if (indexTools2d === Tools2dType.ANGLE) {
      this.m_toolAngle.onMouseMove(xScr, yScr, store);
    }
    if (indexTools2d === Tools2dType.AREA) {
      this.m_toolArea.onMouseMove(xScr, yScr, store);
    }
    if (indexTools2d === Tools2dType.RECT) {
      this.m_toolRect.onMouseMove(xScr, yScr, store);
    }
    if (indexTools2d === Tools2dType.EDIT) {
      this.m_toolEdit.onMouseMove(xScr, yScr, store);
    }
    if (indexTools2d === Tools2dType.DELETE) {
      this.m_toolDelete.onMouseMove(xScr, yScr, store);
    }
    if (indexTools2d === Tools2dType.HAND && this.state.stateMouseDown) {
      const deltaX = clientX - this.state.startX;
      const deltaY = clientY - this.state.startY;
      const newXPos = xPos - deltaX * zoom;
      const newYPos = yPos - deltaY * zoom;

      this.props.dispatch({ type: StoreActionType.SET_2D_X_POS, render2dxPos: newXPos });
      this.props.dispatch({ type: StoreActionType.SET_2D_Y_POS, render2dyPos: newYPos });

      this.setState({
        startX: clientX,
        startY: clientY,
      });
    }

    if (this.m_isSegmented && this.segm2d.model) {
      // We do not need update segmented image (with model)
      // on mouse move event to performance issues.
      return;
    }
    store.graphics2d.forceUpdate();
  }

  onMouseTouchDown(evt) {
    // console.log('732 onMouseDown Captured');
    let clientX = evt.clientX;
    let clientY = evt.clientY;
    if (evt.touches && evt.touches.length > 0) {
      if (evt.touches.length === 2) {
        this.setState({ lastDistance: this.getDistance(evt.touches) });
        return;
      }
      if (evt.touches.length > 2) {
        return;
      }
      clientX = evt.touches[0].clientX;
      clientY = evt.touches[0].clientY;
    }
    const objCanvas = this.m_mount.current;
    const box = objCanvas.getBoundingClientRect();
    const xContainer = clientX - box.left;
    const yContainer = clientY - box.top;
    const xScr = xContainer;
    const yScr = yContainer;
    // console.log(`onMouseDown. down = ${xScr}, ${yScr}`);

    const store = this.props;
    const indexTools2d = store.indexTools2d;
    // console.log(`onMouseDown. tool index = ${indexTools2d}`);

    this.setState({
      stateMouseDown: true,
      startX: clientX,
      startY: clientY,
    });

    switch (indexTools2d) {
      case Tools2dType.INTENSITY:
        this.m_toolPick.onMouseDown(xScr, yScr, store);
        break;
      case Tools2dType.PAINT:
        this.m_toolPaint.onMouseDown(xScr, yScr, store);
        break;
      case Tools2dType.DISTANCE:
        this.m_toolDistance.onMouseDown(xScr, yScr, store);
        break;
      case Tools2dType.ANGLE:
        this.m_toolAngle.onMouseDown(xScr, yScr, store);
        break;
      case Tools2dType.AREA:
        this.m_toolArea.onMouseDown(xScr, yScr, store);
        break;
      case Tools2dType.RECT:
        this.m_toolRect.onMouseDown(xScr, yScr, store);
        break;
      case Tools2dType.TEXT:
        this.m_toolText.onMouseDown(xScr, yScr, store);
        break;
      case Tools2dType.EDIT:
        this.m_toolEdit.onMouseDown(xScr, yScr, store);
        break;
      case Tools2dType.DELETE:
        this.m_toolDelete.onMouseDown(xScr, yScr, store);
        break;
      case Tools2dType.HAND:
        objCanvas.classList.remove('cursor-hand');
        objCanvas.classList.add('cursor-grab');
        break;
      default:
      // not defined
    } // switch
    // force update
    this.forceUpdate();
  } // onMouseDown
  getDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  handleZoom(deltaY, clientX, clientY) {
    const MIN_ZOOM = 0.1;
    const MAX_ZOOM = 1;
    const objCanvas = this.m_mount.current;
    const canvasRect = objCanvas.getBoundingClientRect();
    let xPosNew;
    let yPosNew;
    const store = this.props;
    const zoom = store.render2dZoom;
    const step = (deltaY * 2 ** -10) / 2;
    let newZoom = zoom + step;
    if (newZoom > MAX_ZOOM) {
      newZoom = MAX_ZOOM;
    }
    if (newZoom < MIN_ZOOM) {
      newZoom = MIN_ZOOM;
      return; // Exit early if the new zoom level is below the minimum
    }
    if (step < 0) {
      const mouseX = (clientX - canvasRect.left) * zoom + store.render2dxPos;
      const mouseY = (clientY - canvasRect.top) * zoom + store.render2dyPos;
      xPosNew = mouseX - (mouseX - store.render2dxPos) * (newZoom / zoom);
      yPosNew = mouseY - (mouseY - store.render2dyPos) * (newZoom / zoom);
    } else {
      const centerX = (canvasRect.width * newZoom) / 2 + store.render2dxPos;
      const centerY = (canvasRect.height * newZoom) / 2 + store.render2dyPos;
      xPosNew = centerX - (centerX - store.render2dxPos) * (newZoom / zoom);
      yPosNew = centerY - (centerY - store.render2dyPos) * (newZoom / zoom);
    }

    if (xPosNew < 0) {
      xPosNew = 0;
    }
    if (yPosNew < 0) {
      yPosNew = 0;
    }
    if (newZoom > 1) {
      newZoom = 1;
      xPosNew = 0;
      yPosNew = 0;
    }
    if (newZoom < 0.1) {
      return;
    }
    store.dispatch({ type: StoreActionType.SET_2D_ZOOM, render2dZoom: newZoom });
    store.dispatch({ type: StoreActionType.SET_2D_X_POS, render2dxPos: xPosNew });
    store.dispatch({ type: StoreActionType.SET_2D_Y_POS, render2dyPos: yPosNew });

    store.graphics2d.forceUpdate();
  }

  /**
   * Invoke clear all tools
   */
  clear() {
    this.m_toolPaint.clear();
    this.m_toolDistance.clear();
    this.m_toolAngle.clear();
    this.m_toolArea.clear();
    this.m_toolRect.clear();
    this.m_toolText.clear();
    this.m_toolEdit.clear();
    this.m_toolDelete.clear();
  }

  /**
   * Invoke forced rendering, after some tool visual changes
   */
  forceUpdate(volIndex) {
    console.log('forceUpdate ...');
    this.prepareImageForRender(volIndex);
    // this.forceRender();
    if (this.m_isSegmented) {
      // need to draw segmented image
      if (this.segm2d.model !== null) {
        // we have loaded model: apply it to image
        // TODO update image only on some specific events: zoom, explore
        this.segm2d.startApplyImage();
      }
    } else {
      this.forceRender();
    } // if not segmented image
  }

  forceRender() {
    if (this.m_isMounted) {
      // console.log('forceRender ...');
      this.setState({ state: this.state });
    }
  }

  /**
   * Main component render func callback
   */
  render() {
    this.m_sliceRatio = this.props.sliderValue;
    this.m_mode2d = this.props.mode2d;
    return (
      <div className={css.wrapperStyles}>
        <canvas
          ref={this.m_mount}
          onMouseDown={this.onMouseTouchDown}
          onMouseUp={this.onMouseTouchUp}
          onMouseMove={this.onMouseTouchMove}
          onWheel={this.onMouseWheel}
          onTouchStart={this.onMouseTouchDown}
          onTouchEnd={this.onMouseTouchUp}
          onTouchMove={this.onMouseTouchMove}
          className={css.canvasStyles}
        />
      </div>
    );
  }
}

export default connect((store) => store)(Graphics2d);
