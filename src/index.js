import * as RODIN from 'rodin/core';
import { MainContainer } from './container/mainContainer.js';
RODIN.start();

/**
 * MainContainer class draws and renders everything
 * @type {MainContainer}
 */
let mainContainer = new MainContainer();
mainContainer.run();

RODIN.messenger.on(RODIN.CONST.ACTIVE_SCENE, () => {
    if(RODIN.device.isMobile && RODIN.device.isVR) {
        RODIN.Scene.HMDCamera.add(RODIN.GamePad.cardboard.gazePoint.Sculpt);
    }
});
