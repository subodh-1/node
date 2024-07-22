/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useState } from 'react';
import { usePopper } from 'react-popper';

import css from './Tooltip.module.css';

export const Tooltip = ({ children, content, placement = 'bottom' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [refEl, setRefEl] = useState(null);
  const [popperEl, setPopperEl] = useState(null);
  const [arrowEl, setArrowEl] = useState(null);

  const { styles, attributes } = usePopper(refEl, popperEl, {
    modifiers: [
      { name: 'offset', enabled: true, options: { offset: [0, 10] } },
      { name: 'arrow', options: { element: arrowEl } },
    ],
    placement,
  });

  const hide = useCallback((event) => {
    let timeOut = 0;
    if (event.type === 'touchend') {
      timeOut = 300;
    }
    setTimeout(() => {
      setIsOpen(false), [];
    }, timeOut);
  });
  const show = useCallback(() => setIsOpen(true), []);

  return (
    <>
      <div ref={setRefEl} onMouseLeave={hide} onMouseEnter={show} onTouchStart={show} onTouchEnd={hide} className={css.wrapper}>
        {children}
      </div>
      {isOpen && (
        <div className={css.tooltip} ref={setPopperEl} style={{ ...styles.popper }} {...attributes.popper}>
          <div className={css.body}>{content}</div>
          <div ref={setArrowEl} style={styles.arrow} className={css.arrow} {...attributes.popper} />
        </div>
      )}
    </>
  );
};
