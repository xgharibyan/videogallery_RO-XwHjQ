System.register(['rodin/core', '../data/videos.js', '../components/Thumbnail.js', '../components/Gallery.js', './videoPlayerConatainer.js'], function (_export, _context) {
    "use strict";

    var RODIN, videos, Thumbnail, linearView, cylindricalView, gridView, VideoPlayer;
    return {
        setters: [function (_rodinCore) {
            RODIN = _rodinCore;
        }, function (_dataVideosJs) {
            videos = _dataVideosJs.videos;
        }, function (_componentsThumbnailJs) {
            Thumbnail = _componentsThumbnailJs.Thumbnail;
        }, function (_componentsGalleryJs) {
            linearView = _componentsGalleryJs.linearView;
            cylindricalView = _componentsGalleryJs.cylindricalView;
            gridView = _componentsGalleryJs.gridView;
        }, function (_videoPlayerConatainerJs) {
            VideoPlayer = _videoPlayerConatainerJs.VideoPlayer;
        }],
        execute: function () {

            /**
             * Here we create 3 different layouts for thumbnails and a video player
             * Layout types are;
             * linear
             * flat
             * cylinder
             */
            class VideoContainer {
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

            _export('VideoContainer', VideoContainer);
        }
    };
});