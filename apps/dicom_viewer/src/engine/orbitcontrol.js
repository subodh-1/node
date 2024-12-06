/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Orbit control
 * @module lib/scripts/controls/orbitcontrol
 */

// ******************************************************************
// imports
// ******************************************************************

// absoulte imports
import * as THREE from 'three';

// import MaterialVlm from '../gfx/matvlm';

// const CONTROL_CAMERA_MIN_ZOOM = 1.1;
const CONTROL_CAMERA_MIN_ZOOM = 0.3;
const CONTROL_CAMERA_MAX_ZOOM = 2.2;
const CONTROL_CAMERA_ROTATION_SPEED = 0.008;
const CONTROL_CAMERA_ZOOM_SPEED = 0.5;

// ******************************************************************
// class
// ******************************************************************

/** Class Graphics2d is used for simple debug style 2d render */
export default class OrbitControl {
  /**
   * Initialize render
   * @return {Object} Intsance of this class (singleton)
   */
  constructor(domElem, camera, scene, mesh, meshRotationCallback) {
    this.m_callback = meshRotationCallback;
    this.m_mesh = mesh;
    this.m_wireMesh = null;
    this.m_camera = camera;
    this.m_target = new THREE.Vector3(0, 0, 0);
    this.m_scene = scene;
    this.m_button = OrbitControl.EVENT_BUTTON_NA;
    this.domElem = domElem;
    this.m_pressedLeft = false;
    this.m_pressedRight = false;
    this.m_prevMouse = { x: -1, y: -1 };
    this.m_prevTime = -1;
    this.m_deltaTime = 0;
    this.m_spherical = new THREE.Spherical();
    this.m_sphericalDelta = new THREE.Spherical();
    this.m_spherical.set(0, 0, 0);
    this.m_sphericalDelta.set(0, 0, 0);
    this.m_autoRotate = false;

    this.m_minDistance = CONTROL_CAMERA_MIN_ZOOM;
    this.m_maxDistance = CONTROL_CAMERA_MAX_ZOOM;

    this.m_minAzimuthAngle = -Infinity; // radians
    this.m_maxAzimuthAngle = Infinity; // radians
    // How far you can orbit vertically, upper and lower limits.
    // Range is 0 to Math.PI radians.
    this.m_minPolarAngle = 0; // radians
    // eslint-disable-next-line
    this.m_maxPolarAngle = Math.PI * 2.0; // radians

    // Set to true to enable damping (inertia)
    // If damping is enabled, you must call controls.update() in your animation loop
    this.m_enableDamping = false;
    this.m_dampingFactor = 0.25;
    //console.log(`Mouse container: ${this.m_container.offsetLeft}, ${this.m_container.offsetTop}`);
    this.isEraserMode = false;
  }

  setEraserMode(isOn) {
    this.isEraserMode = isOn;
  }

  setMesh(mesh) {
    this.m_mesh = mesh;
  }

  setWireMesh(wireMesh) {
    this.m_wireMesh = wireMesh;
  }

  setScene(scene) {
    this.m_scene = scene;
  }

  getX(xx) {
    return xx - this.domElem.offsetLeft;
  }

  getY(yy) {
    return yy - this.domElem.offsetTop;
  }

  // updateTime(dx, dy, useCallback = true) {
  updateTime(dx, dy) {
    if (dx === 0 && dy === 0) {
      return;
    }
    // time update
    const curTimeMs = new Date().getTime();
    this.m_prevTime = this.m_prevTime > 0 ? this.m_prevTime : curTimeMs;
    this.m_deltaTime = curTimeMs - this.m_prevTime;
    this.m_prevTime = curTimeMs;
    if (!this.m_mesh) {
      return;
    }

    // this.m_mesh.rotation.y += dx * CONTROL_CAMERA_ROTATION_SPEED;
    // this.m_mesh.rotation.x += dy * CONTROL_CAMERA_ROTATION_SPEED;

    const rotationY = new THREE.Matrix4();
    const rotationX = new THREE.Matrix4();
    const matrix = new THREE.Matrix4();
    const camDir = new THREE.Vector3();

    camDir.copy(this.m_target).sub(this.m_camera.position).normalize();
    rotationX.makeRotationAxis(this.m_camera.up, dx * CONTROL_CAMERA_ROTATION_SPEED);
    rotationY.makeRotationAxis(camDir.cross(this.m_camera.up), dy * CONTROL_CAMERA_ROTATION_SPEED);
    matrix.identity();
    matrix.multiply(rotationX).multiply(rotationY).multiply(this.m_mesh.matrix);

    this.m_mesh.rotation.setFromRotationMatrix(matrix);
    if (this.m_wireMesh) {
      matrix.identity();
      matrix.multiply(rotationX).multiply(rotationY).multiply(this.m_wireMesh.matrix);
      this.m_wireMesh.rotation.setFromRotationMatrix(matrix);
    }
    this.m_callback();
  }

  onMouseDown(xMouse, yMouse, ctrlKey) {
    this.m_pressedLeft = true;
    this.m_prevMouse = { x: xMouse, y: yMouse };
    this.m_spherical.set(0, 0, 0);
    this.m_sphericalDelta.set(0, 0, 0);
    this.m_prevTime = new Date().getTime(); // -1;
    this.ctrlKey = ctrlKey;
  }

  onMouseUp() {
    this.m_pressedLeft = false;
    this.m_prevMouse.x = -1;
    this.m_prevMouse.y = -1;
  }

  onMouseMove(x, y) {
    if (this.m_prevMouse.x < 0) {
      this.m_prevMouse.x = x;
      this.m_prevMouse.y = y;
    }
    const dx = x - this.m_prevMouse.x;
    const dy = y - this.m_prevMouse.y;
    // const dx = 1;
    // const dy = 0;
    this.m_prevMouse.x = x;
    this.m_prevMouse.y = y;

    if (this.m_pressedLeft) {
      this.updateTime(dx, dy);
    }
  }

  /*addCallbacks() {
    this.m_container.on('mousedown', (event) => {
      event = event || window.event;
      const buttonIndex = event.which - 1;
      this.m_button = buttonIndex;
      // const arrButtonNames = ['Left', 'Center', 'Right'];
      // console.log(`Mouse down event: ${arrButtonNames[buttonIndex]}`);
      if (buttonIndex === OrbitControl.EVENT_BUTTON_LEFT) {
      //console.log("X,Y: "+this.getX(event.clientX)+ " "+ this.getY(event.clientY));
        if (this.isEraserMode && event.ctrlKey) {
          return;
        }
        this.onMouseDown(this.getX(event.clientX), this.getY(event.clientY));
        // this.m_pressedLeft = true;
        // this.m_prevMouse = { x: this.getX(event.clientX), y: this.getY(event.clientY) };
        // this.m_spherical.set(0, 0, 0);
        // this.m_sphericalDelta.set(0, 0, 0);
        // this.m_prevTime = new Date().getTime();// -1;
      }
    });

    this.m_container.on('mouseup', (event) => {
      event = event || window.event;
      const buttonIndex = event.which - 1;
      this.m_button = buttonIndex;
      if (buttonIndex === OrbitControl.EVENT_BUTTON_LEFT) {
        if (this.isEraserMode && event.ctrlKey) {
          return;
        }
        this.onMouseUp();
        // this.m_pressedLeft = false;
        // this.m_prevMouse.x = -1;
        // this.m_prevMouse.y = -1;
      }
    });

    this.m_container.on('mousemove', (event) => {
      const x = this.getX(event.clientX);
      const y = this.getY(event.clientY);
      // console.log(`mouse move event at ${x}, ${y}`);
      if (this.isEraserMode && event.ctrlKey) {
        return;
      }
      this.onMouseMove(x, y);
    });

    this.m_container.on('mousewheel', (event) => {
      const e = window.event || event; // old IE support
      const delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
      // console.log(`mouse wheel event . delta = ${delta}`);
      this.onZoom(delta);
    });

    this.m_container.on('touchstart', (event) => {
      if (event.touches.length === 1) {
        const domElem = this.m_container.get(0);
        const box = domElem.getBoundingClientRect();
        const d = domElem.ownerDocument.documentElement;
        const scrLeft = box.left + window.pageXOffset - d.clientLeft;
        const scrTop = box.top + window.pageYOffset - d.clientTop;
        this.onMouseDown(event.touches[0].pageX - scrLeft, event.touches[0].pageY - scrTop);
        // console.log(`touchstart: ${this.m_prevMouse.x},${this.m_prevMouse.y}`);
      }
    });*/
  /*eslint-disable no-unused-vars*/
  /*
    this.m_container.on('touchend', (event) => {
      this.onMouseUp();
    });*/
  /*eslint-enable no-unused-vars*/
  /*
    this.m_container.on('touchmove', (event) => {
      const domElem = this.m_container.get(0);
      const box = domElem.getBoundingClientRect();
      const d = domElem.ownerDocument.documentElement;
      const scrLeft = box.left + window.pageXOffset - d.clientLeft;
      const scrTop = box.top + window.pageYOffset - d.clientTop;
      const x = event.touches[0].pageX - scrLeft;
      const y = event.touches[0].pageY - scrTop;
      this.onMouseMove(x, y);
    });

    this.m_container.on('DOMMouseScroll', (event) => {
      const e = window.event || event; // old IE support
      const delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
      // console.log(`mouse scroll event . delta = ${delta}`);
      this.onZoom(delta);
    });
  } // addCallbacks
  */
  onZoom(delta) {
    const step = delta * CONTROL_CAMERA_ZOOM_SPEED;
    let camPos = this.m_camera.position.length();
    // console.log(`camPos = ${camPos}`);
    const camDir = this.m_camera.position.sub(this.m_target);
    // console.log(`camDirOld = ${camDir.x}, ${camDir.y}, ${camDir.z}`);
    camDir.normalize();
    camPos += step;
    console.log('camPos', camPos);
    console.log('CONTROL_CAMERA_MIN_ZOOM', CONTROL_CAMERA_MIN_ZOOM, 'CONTROL_CAMERA_MAX_ZOOM', CONTROL_CAMERA_MAX_ZOOM);
    // console.log(`camPosNew = ${camPos}`);
    camPos = Math.max(camPos, CONTROL_CAMERA_MIN_ZOOM);
    camPos = Math.min(camPos, CONTROL_CAMERA_MAX_ZOOM);
    console.log('camPos', camPos);
    // console.log(`camPosNewFixed = ${camPos}`);
    camDir.multiplyScalar(camPos);
    // console.log(`camDirNew = ${camDir.x}, ${camDir.y}, ${camDir.z}`);
    this.m_camera.position.set(camDir.x, camDir.y, camDir.z);
    this.m_camera.lookAt(this.m_target);
    this.m_camera.updateMatrixWorld();
  }
} // class

OrbitControl.EVENT_BUTTON_NA = -1;
OrbitControl.EVENT_BUTTON_LEFT = 0;
OrbitControl.EVENT_BUTTON_CENTER = 1;
OrbitControl.EVENT_BUTTON_RIGHT = 2;
