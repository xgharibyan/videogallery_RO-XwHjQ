import * as RODIN from 'rodin/core';
import {VPcontrolPanel} from '../components/vpControls.js';
RODIN.start();
/**
 * Create a separate scene for video player
 * @type {RODIN.Scene}
 */
export const videoPlayerScene = new RODIN.Scene('videoPlayerScene');

/**
 * Creates a video player
 * with controls and a video
 */
export class VideoPlayer {
    constructor() {
        this.player = new RODIN.MaterialPlayer({
            HD: '',
            SD: '',
            default: 'HD'
        }, false, 25, false, true);
    }

    /**
     * Play a video with given parameters
     * @param url
     * @param title
     * @param backgroundImage
     * @param transition
     */
    playVideo(url, title, backgroundImage, transition) {
        if (!this.controls) {
            this.controls = new VPcontrolPanel({
                player: this.player,
                title: title,
                cover: backgroundImage,
                distance: 2,
                width: 3
            }, transition);
            this.container();
            this.player.loadVideo(url);
        } else {
            this.controls.loadVideo(title, url, backgroundImage, this.sphere);
        }
    }

    /**
     * Initializes environment for the video player
     */
    container() {
        let controlPanel, material;

        videoPlayerScene.preRender(() => {
            this.player.update(RODIN.Time.delta);
        });
        controlPanel = this.controls;
        controlPanel.on(RODIN.CONST.READY, (evt) => {
            videoPlayerScene.add(evt.target);
            evt.target.position.y = 1.6;
            if (evt.target.coverEl) {
                evt.target.coverEl.rotation.y = -Math.PI / 2;
            }
        });
        material = new THREE.MeshBasicMaterial({
            map: this.player.getTexture()
        });
        this.sphere = new RODIN.Sculpt(new THREE.Mesh(new THREE.SphereBufferGeometry(90, 720, 4), material));
        this.sphere.scale.set(1, 1, -1);
        this.sphere.rotation.y = Math.PI / 2;
        videoPlayerScene.add(this.sphere);
    }

}