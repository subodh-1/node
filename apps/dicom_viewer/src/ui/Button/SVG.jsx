/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
let svgSize = 25;
const screenWidth = window.innerWidth;
if (screenWidth < 768) {
  svgSize = 30;
} else if (screenWidth > 768 && screenWidth < 1024) {
  svgSize = 40;
} else if (screenWidth > 1024 && screenWidth < 3500) {
  svgSize = 40;
} else if (screenWidth > 3500) {
  svgSize = 75;
}
const DEFAULT_COLOR = '#ffffff';

export const SVG = ({ name, width = svgSize, height = svgSize, title, color = DEFAULT_COLOR }) => {
  return (
    <svg fill={color} width={width} height={height} {...(title ? { 'aria-labelledby': 'title' } : { 'aria-hidden': 'true' })}>
      {title && <title>{title}</title>}
      <use xlinkHref={`/sprite.svg#${name}`} />
    </svg>
  );
};
