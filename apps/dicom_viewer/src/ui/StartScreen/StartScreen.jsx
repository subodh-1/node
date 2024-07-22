import React from 'react';
import css from './StartScreen.module.css';
import SmartContainer from './SmartContainer/SmartContainer';
import { SVG } from '../Button/SVG';
import { GithubLink } from '../GithubLink/GithubLink';

import logo from './logo.png';
import backgroundImage from './BG-DICOM3.jpg';

const StartScreen = () => {
  return (
    <div className="vn-bg" style={{ backgroundImage: `url(${backgroundImage})`, height: '100%', backgroundSize: 'cover' }}>
      <div className={css.screen}>
        <SVG />
        <img src={logo} alt="CADAVIZ Logo" width={560} height={90} />
        <h1 className={css.header_text}>DICOM Viewer</h1>
        <div className={css.subheader}>
          <GithubLink />
          {/*<h3 className={css.subheader_text}>CADAVIZ Dicom Viewer developed by ImmersiveLabz. Supports DICOM, NIFTI, KTX, HDR.</h3>*/}
        </div>

        <div className={css.container}>
          <SmartContainer />
        </div>
      </div>
    </div>
  );
};

export default StartScreen;
