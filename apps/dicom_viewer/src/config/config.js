/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

const config = {
  // special demo dialog file locations

  demoUrls: [
    //'https://daentjnvnffrh.cloudfront.net/demo/01_lungs/20101108.ktx',
    '/demo/20101108.ktx',
    '/demo/brain_ct_scan_new.nii',
    //'/demo/brain256.ktx',
    '/demo/gm3_512_512_165.nii',
    '/demo/04_woman_pelvis/file_list.txt',
    '/demo/05_lungs_00cba/file_list.txt',
    //'/demo/ct_256_256_256.ktx',
    '/demo/t1_ax_3d_volume.nii',
    '/demo/lungs_256_256_256.ktx',
    '/demo/brain_ct_scan_new.nii',
    //'/demo/set_intn.hdr',
  ],
  iconsUrls: './images/',

  googleCloudDemoActivce: false,
  arrMenuGoogle: [
    {
      text: 'Demo lungs AA',
      tooltip: 'Load some lungs model',
    },
    {
      text: 'Demo head BB',
      tooltip: 'Load some strange head',
    },
    {
      text: 'Demo alien CC',
      tooltip: 'Write here smth please',
    },
  ],
  demoWomanPelvisPrefix: '',
  demoWomanPelvisUrls: [],
  demoLungsPrefix: '',
  demoLungsUrls: [],
};

export default config;
