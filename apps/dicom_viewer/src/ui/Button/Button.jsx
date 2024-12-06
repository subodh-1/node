/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import cx from 'classnames';

import { SVG } from './SVG';
import { Tooltip } from '../Tooltip/Tooltip';

import css from './Button.module.css';

export const ButtonContainer = ({ children, onClick, type = 'button', caption, cx: styles, customStyle, testId, keepDragable = false }) => (
  <button
    type={type}
    data-testid={testId}
    className={cx(css.reset, styles, customStyle)}
    onClick={onClick}
    caption={caption}
    {...(keepDragable ? { onTouchStart: onClick } : {})}
  >
    {children}
  </button>
);

export const UIButton = ({ icon, caption, handler, active, rounded, type, mode, cx: customStyle, testId, text, keepDragable = false }) => {
  const modeStyle = (mode === 'light' && css.light) || (mode === 'accent' && css.accent);
  const isOnlyCaption = icon === undefined && caption;

  return (
    <ButtonContainer
      type={type}
      cx={cx(css.button, active && css.active, rounded && css.rounded, isOnlyCaption && css.captionButton, modeStyle, customStyle)}
      onClick={handler}
      testId={testId}
      caption={icon && caption}
      keepDragable={keepDragable}
    >
      {icon ? <SVG name={icon} title={caption} /> : caption}
      {text ? <span>{text}</span> : ''}
    </ButtonContainer>
  );
};

export const buttonsBuilder = (buttons, options = { activeButton: null }, tooltipPosition, keepDragable = true) =>
  buttons.map(({ id, caption, ...props }) => (
    <Tooltip content={caption} placement={tooltipPosition || 'top'} key={id.toString()}>
      <UIButton {...props} key={id} active={id === options.activeButton} keepDragable={keepDragable} />
    </Tooltip>
  ));
