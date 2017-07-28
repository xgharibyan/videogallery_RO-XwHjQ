import * as RODIN from 'rodin/core';
import {videos} from '../data/videos.js';
import {Thumbnail} from '../components/Thumbnail.js';
import {linearView, cylindricalView, gridView} from '../components/Gallery.js';
import {VideoPlayer} from './videoPlayerConatainer.js';

/**
 * Here we create 3 different layouts for thumbnails and a video player
 * Layout types are;
 * linear
 * flat
 * cylinder
 */
export class VideoContainer {
    constructor(blinkAnimation) {
        this.blinkAnimation = blinkAnimation;
        this.videoPlayer = new VideoPlayer();
        this.thumbs = videos.map(v => new Thumbnail(v, this.videoPlayer, this.blinkAnimation));
        this.standingArea = new RODIN.Plane(8, 8, new THREE.MeshBasicMaterial({
            transparent: true,
            map: RODIN.Loader.loadTexture('./src/assets/floor1.png')
        }));
        this.standingArea.on(RODIN.CONST.READY, evt => {
            RODIN.Scene.add(this.standingArea);
            evt.target.position.z = -.3;
            evt.target.position.y = -1;
            evt.target.rotation.x = -Math.PI / 2;
        });
    }

    setView(type = 'linear') {
        type = type.toLowerCase();
        switch (type) {
            case 'linear':
                linearView(this.thumbs);
                break;
            case 'flat':
                gridView(this.thumbs);
                break;
            case 'cylinder':
                cylindricalView(this.thumbs);
                break;
            default:
                linearView(this.thumbs);
        }
    }
}