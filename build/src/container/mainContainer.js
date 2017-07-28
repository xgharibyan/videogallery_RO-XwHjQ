System.register(['rodin/core', '../components/BlinkAnimation.js', './videoContainer.js', '../components/Navigation.js', '../components/Thumbnail.js'], function (_export, _context) {
    "use strict";

    var RODIN, blinkAnimation, VideoContainer, Navigation, Thumbnail;
    return {
        setters: [function (_rodinCore) {
            RODIN = _rodinCore;
        }, function (_componentsBlinkAnimationJs) {
            blinkAnimation = _componentsBlinkAnimationJs.blinkAnimation;
        }, function (_videoContainerJs) {
            VideoContainer = _videoContainerJs.VideoContainer;
        }, function (_componentsNavigationJs) {
            Navigation = _componentsNavigationJs.Navigation;
        }, function (_componentsThumbnailJs) {
            Thumbnail = _componentsThumbnailJs.Thumbnail;
        }],
        execute: function () {

            /**
             * Crates switch buttons on the bottom,
             * Eyelid animation,
             * Loader
             */
            class MainContainer extends RODIN.Sculpt {
                constructor() {
                    super();
                    /**
                     * skybox for all the environment
                     * at first it has space texture
                     * later the texture is changed to
                     * another environment
                     * @type {RODIN.Sphere}
                     */
                    this.enviroment = new RODIN.Sphere(90, 720, 4, new THREE.MeshBasicMaterial({
                        side: THREE.BackSide,
                        map: RODIN.Loader.loadTexture('./src/assets/space.jpg')
                    }));
                    this.enviroment.on(RODIN.CONST.READY, () => {
                        this.enviroment.on(RODIN.CONST.GAMEPAD_BUTTON_DOWN, this.onButtonDown.bind(this));
                    });
                    /**
                     * Loading placeholder
                     * @type {RODIN.Plane}
                     */
                    this.loader = new RODIN.Plane(8, 4.5, new THREE.MeshBasicMaterial({
                        transparent: true,
                        map: RODIN.Loader.loadTexture('./src/assets/loader.png')
                    }));
                    this.loader.on(RODIN.CONST.READY, env => {
                        this.enviroment.add(env.target);
                        env.target.position.z = -10;
                        env.target.position.y = 2.25;
                    });
                    this.enviroment.needsUpdate = true;
                    this.transition = blinkAnimation.get();
                    this.containers = {};
                }

                onButtonDown() {
                    if (this.containers.videoContainer && this.containers.videoContainer.thumbs) {
                        Thumbnail.reset(this.containers.videoContainer.thumbs);
                    }
                }

                /**
                 * Entry point for our application
                 */
                run() {
                    /**
                     * add our skybox to the scene so it can be rendered
                     */
                    RODIN.Scene.add(this.enviroment);
                    RODIN.Scene.HMDCamera.name = 'mainCamera';
                    /**
                     * set the camera for our eyelid transition
                     */
                    this.transition.camera = RODIN.Scene.HMDCamera;

                    /**
                     * Dummy loading time with a splash screen
                     * if you have something to load
                     * do it here
                     */
                    setTimeout(() => {
                        // start our closing animation
                        this.transition.close();
                    }, 5000);

                    /**
                     * eyelid transition event
                     * when the lids are closed we change the environment
                     * and start opening them again
                     * This way environment is changed in a "blink" of an eye
                     * @param evt
                     */
                    const onclose = evt => {
                        this.transition.removeEventListener('Closed', onclose);
                        this.changeEnvironment();
                        this.transition.open();
                    };
                    this.transition.on('Closed', onclose);
                }

                /**
                 * changes our environment from splash screen to actual experience
                 */
                changeEnvironment() {
                    this.loader.visible = false;
                    this.enviroment._threeObject.material.map = RODIN.Loader.loadTexture('./src/assets/env.jpg');
                    let videoContainer = new VideoContainer(this.transition);
                    this.containers.navigation = new Navigation(videoContainer);
                    this.containers.videoContainer = videoContainer;
                }
            }

            _export('MainContainer', MainContainer);
        }
    };
});