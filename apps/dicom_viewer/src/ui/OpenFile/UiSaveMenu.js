/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

import { useSelector } from 'react-redux';

import { UiModalSaveNifti } from '../Modals/UiModalSaveNifti';
import { UIButton } from '../Button/Button';
import { Tooltip } from '../Tooltip/Tooltip';
import css from './UISaveMenu.module.css';
import cx from 'classnames';

export const UiSaveMenu = (keepDragable = false) => {
  /**
   * @param {object} props - props from up level object
   */
  const [showModalSaveNifti, setShowModalSaveNifti] = useState(false);
  const { isLoaded } = useSelector((state) => state);

  const onModalSaveNiftiShow = () => {
    setShowModalSaveNifti(true);
  };

  const onModalSaveNiftiHide = () => {
    setShowModalSaveNifti(false);
  };
  return (
    <>
      <Tooltip content="Download">
        <UIButton
          cx={cx(css.button, css['download__link'])}
          rounded
          icon="download"
          handler={(evt) => onModalSaveNiftiShow(evt)}
          mode={isLoaded ? 'accent' : ''}
          keepDragable={keepDragable}
        />
      </Tooltip>
      <UiModalSaveNifti stateVis={showModalSaveNifti} onHide={onModalSaveNiftiHide} />
    </>
  );
};
