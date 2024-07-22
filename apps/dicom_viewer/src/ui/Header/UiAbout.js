import React, { useState } from 'react';

import packageJson from '../../../package.json';
import UiSkelAni from '../UiSkelAni';
import { UIButton } from '../Button/Button';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '../Modals/ModalBase';
import { useSelector } from 'react-redux';
import logo from './immersive-1.png';

export const UiAbout = () => {
  const [modalShow, setModalShow] = useState(false);
  const strVer = packageJson.version;
  const strName = packageJson.name;
  const strDescription = packageJson.description;
  const strAuthor = packageJson.author;
  const strYear = packageJson.year;
  const { graphics2d } = useSelector((state) => state);

  const onShow = () => {
    graphics2d.clear();
    setModalShow(true);
  };

  const onHide = () => {
    setModalShow(false);
  };
  let imazeSizer = () => {
    const screenWidth = window.innerWidth;
    let imgSize = 60;

    if (screenWidth < 768) {
      imgSize = 40;
    } else if (screenWidth > 768 && screenWidth < 1024) {
      imgSize = 50;
    } else if (screenWidth > 1024 && screenWidth < 3500) {
      imgSize = 60;
    } else if (screenWidth > 3500) {
      imgSize = 150;
    }
    return imgSize;
  };

  return (
    <>
      <img src={logo} alt="Logo" width={imazeSizer()} height={imazeSizer()} onClick={onShow} />
      {modalShow && (
        <Modal isOpen={modalShow} close={onHide}>
          <ModalHeader title={strName} />
          <ModalBody>
            <center>
              <UiSkelAni />
              <p>{strDescription}</p>
              <p>
                <b>Version: </b> {strVer}
              </p>
              <p>
                <b>Copyright: </b> {strYear} {strAuthor}
              </p>
            </center>
          </ModalBody>
          <ModalFooter>
            <UIButton handler={onHide} caption="Ok" type="submit" mode="accent" />
          </ModalFooter>
        </Modal>
      )}
    </>
  );
};
