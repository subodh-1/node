import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { CollapsibleGroup } from './Layout/collapseElements';

import Tools2dType from '../engine/tools2d/ToolTypes';
import StoreActionType from '../store/ActionTypes';
import { buttonsBuilder } from './Button/Button';
// import FullScreenToggle from './Toolbars/FullScreen';

const UiZoomTools = (props) => {
  const MIN_ZOOM_THRESHOLD = 0.8;
  const [activeButton, setActiveButton] = useState();
  // const [isFullMode, setIsFullMode] = useState(false);

  // const startFullMode = () => {
  //   document.documentElement
  //     .requestFullscreen()
  //     .then(() => {
  //       setIsFullMode(true);
  //       console.log(`%cFullscreen entered`, 'color:green');
  //     })
  //     .catch((err) => {
  //       console.log(`%cFullscreen error: ${err.message}`, 'color:red');
  //     });
  // };

  // const endFullMode = () => {
  //   document
  //     .exitFullscreen()
  //     .then(() => {
  //       setIsFullMode(false);
  //       console.log(`%cFullscreen exited`, 'color:green');
  //     })
  //     .catch((err) => {
  //       console.log(`%cFullscreen error: ${err.message}`, 'color:red');
  //     });
  // };

  // const handleFullMode = () => {
  //   const fn = isFullMode ? endFullMode : startFullMode;
  //   fn();
  // };

  const zoomImage = (step, buttonId) => {
    const currentZoom = props.render2dZoom;
    let newZoom = Math.round((currentZoom + step) * 10) / 10;
    const objCanvas = props.graphics2d.m_mount.current;
    const canvasRect = objCanvas.getBoundingClientRect();
    let xPosNew;
    let yPosNew;

    if (buttonId === Tools2dType.ZOOM_IN && newZoom > 0) {
      xPosNew = props.render2dxPos + (canvasRect.width / 2) * Math.abs(step);
      yPosNew = props.render2dyPos + (canvasRect.height / 2) * Math.abs(step);
    } else if (buttonId === Tools2dType.ZOOM_OUT && newZoom < 1) {
      const centerX = (canvasRect.width * newZoom) / 2 + props.render2dxPos;
      const centerY = (canvasRect.height * newZoom) / 2 + props.render2dyPos;
      xPosNew = centerX - (centerX - props.render2dxPos) * (newZoom / currentZoom);
      yPosNew = centerY - (centerY - props.render2dyPos) * (newZoom / currentZoom);
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
    props.dispatch({ type: StoreActionType.SET_2D_ZOOM, render2dZoom: newZoom });
    props.dispatch({ type: StoreActionType.SET_2D_X_POS, render2dxPos: xPosNew });
    props.dispatch({ type: StoreActionType.SET_2D_Y_POS, render2dyPos: yPosNew });
  };

  const mediator = (buttonId) => {
    setActiveButton(buttonId);
    props.dispatch({ type: StoreActionType.SET_2D_TOOLS_INDEX, indexTools2d: buttonId });

    if (buttonId === Tools2dType.ZOOM_100 || (buttonId === Tools2dType.ZOOM_OUT && props.render2dZoom > MIN_ZOOM_THRESHOLD)) {
      props.dispatch({ type: StoreActionType.SET_2D_ZOOM, render2dZoom: 1.0 });
      props.dispatch({ type: StoreActionType.SET_2D_X_POS, render2dxPos: 0.0 });
      props.dispatch({ type: StoreActionType.SET_2D_Y_POS, render2dyPos: 0.0 });
    } else if (buttonId === Tools2dType.HAND) {
      return;
    } else {
      zoomImage(buttonId === Tools2dType.ZOOM_IN ? -0.1 : 0.1, buttonId);
    }
  };

  useEffect(() => {
    props.graphics2d.forceUpdate();
    props.graphics2d.forceRender();
  }, [props.render2dZoom]);

  const buttons = [
    {
      id: Tools2dType.HAND,
      icon: 'hand',
      caption: 'Explore model',
      handler: mediator.bind(null, Tools2dType.HAND),
    },
    {
      icon: 'zoom_in',
      caption: 'Zoom in',
      handler: mediator.bind(null, Tools2dType.ZOOM_IN),
      id: Tools2dType.ZOOM_IN,
    },
    {
      icon: 'zoom_out',
      caption: 'Zoom out',
      handler: mediator.bind(null, Tools2dType.ZOOM_OUT),
      id: Tools2dType.ZOOM_OUT,
    },
    {
      icon: 'zoom_100',
      caption: 'Zoom to default',
      handler: mediator.bind(null, Tools2dType.ZOOM_100),
      id: Tools2dType.ZOOM_100,
    },
  ];
  let keepDragable = false;
  return (
    <CollapsibleGroup
      toggleName="Zoom Tools"
      appearance="horizontal"
      iconName="zoom_tools_1.png"
      isCircular="true"
      keepDragable={keepDragable}
    >
      <span>
        {buttonsBuilder(buttons, { activeButton }, 'top', keepDragable)}
        {/* <FullScreenToggle isFullMode={isFullMode} handler={handleFullMode} /> */}
      </span>
    </CollapsibleGroup>
  );
};

export default connect((store) => store)(UiZoomTools);
