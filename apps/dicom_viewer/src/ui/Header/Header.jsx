/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UIButton } from '../Button/Button';
import { useOnEvent } from '../hooks/useOnEvent';
import { ModalSelectFile } from '../Modals/ModalSelectFile';
import { OpenDemoComponent } from '../FileReaders';
// import { OpenFromURLComponent, OpenDemoComponent } from '../FileReaders';
import { Tooltip } from '../Tooltip/Tooltip';
// import { UiSaveMenu } from '../OpenFile/UiSaveMenu';
import { UiReportMenu } from '../OpenFile/UiReportMenu';
import { CollapsibleGroup } from '../Layout/collapseElements';

import { MriEvents } from '../../engine/lib/enums';

import css from './Header.module.css';
import StoreActionType from '../../store/ActionTypes';

export function Header() {
  const [showOpenFromDeviceModal, setShowOpenFromDeviceModal] = useState(false);
  const { showModalSelectFiles } = useSelector((state) => state);
  const dispatch = useDispatch();

  const onButtonOpenLocalFileClick = () => {
    setShowOpenFromDeviceModal(true);
    dispatch({ type: StoreActionType.SET_SHOW_MODAL_SELECT_FILES, showModalSelectFiles: true });
    dispatch({ type: StoreActionType.SET_SHOW_WINDOW_RANGE, showWindowRangeSlider: false });
    dispatch({ type: StoreActionType.SET_SHOW_WINDOW_RANGE, showWindowRangeSlider: false });
  };

  const onHide = () => {
    setShowOpenFromDeviceModal(false);
  };

  useOnEvent(MriEvents.VOLUME_LOAD_SUCCESS, onHide);
  let keepDragable = true;
  return (
    <header className={css.header}>
      <CollapsibleGroup
        toggleName="Import Studies"
        appearance="vertical"
        iconName="ImportStudies.svg"
        isCircular="true"
        keepDragable={keepDragable}
      >
        {/* <UiSaveMenu keepDragable={keepDragable} /> */}
        <UiReportMenu keepDragable={keepDragable} />
        <Tooltip content="Open file or folder">
          <UIButton icon="folder" handler={onButtonOpenLocalFileClick} cx={css.header_button} keepDragable={keepDragable} />
        </Tooltip>
        {/* <Tooltip content="Open external URL">
        <OpenFromURLComponent cx={css.header_button} />
      </Tooltip> */}
        <Tooltip content="Open demo data">
          <OpenDemoComponent cx={css.header_button} keepDragable={keepDragable} />
        </Tooltip>
        {showOpenFromDeviceModal && <ModalSelectFile stateVis={showModalSelectFiles} onHide={onHide} />}
      </CollapsibleGroup>
    </header>
  );
}
