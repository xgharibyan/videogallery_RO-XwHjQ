import * as RODIN from 'rodin/core';

/**
 * A singleton class for blinking eye animation
 */
export class blinkAnimation extends RODIN.EventEmitter {
    constructor() {
        super();
        blinkAnimation.instance = this;
        /**
         * empty sculpt for containing our eyelids
         * @type {RODIN.Sculpt}
         */
        this.eyelidContainer = new RODIN.Sculpt();

        /**
         * top eyelid
         * @type {RODIN.Plane}
         */
        this.topEyelid = new RODIN.Plane(1, 0.05, new THREE.MeshBasicMaterial({
            side: THREE.DoubleSide,
            color: 0x000000
        }));
        this.topEyelid.position.z = -0.02;
        this.topEyelid.position.y = 0.12;
        /**
         * bottom eyelid
         * @type {RODIN.Plane}
         */
        this.bottomEyelid = new RODIN.Plane(1, 0.05, new THREE.MeshBasicMaterial({
            side: THREE.DoubleSide,
            color: 0x000000
        }));
        this.eyelidContainer._threeObject.renderOrder = 10000;
        this.bottomEyelid.position.z = -0.02;
        this.bottomEyelid.position.y = -0.12;
        this.eyelidContainer.add(this.topEyelid);
        this.eyelidContainer.add(this.bottomEyelid);

        /**
         * emit events for when our eye is closed or opened
         */
        this.topEyelid.on(RODIN.CONST.ANIMATION_COMPLETE, (evt) => {
            if (evt.animation === 'close') {
                this.emit('Closed', new RODIN.RodinEvent());
            } else {
                this.emit('Opened', new RODIN.RodinEvent());
            }
        });

        /**
         * add animations to our eyelids
         */
        this.topEyelid.animation.add(blinkAnimation._makeAnimation(0.12, 'open', 1500));
        this.bottomEyelid.animation.add(blinkAnimation._makeAnimation(-0.12, 'open', 1500));

        this.topEyelid.animation.add(blinkAnimation._makeAnimation(0.025, 'close', 1500));
        this.bottomEyelid.animation.add(blinkAnimation._makeAnimation(-0.025, 'close', 1500));

    }

    /**
     * gives user ability to change the parent camera
     * @param camera
     */
    set camera(camera) {
        camera.add(this.eyelidContainer);
    }

    /**
     * creates an animation with given parameters
     * @param pos
     * @param type
     * @param duration
     * @returns {RODIN.AnimationClip}
     * @private
     */
    static _makeAnimation(pos, type, duration) {
        let animate = new RODIN.AnimationClip(type, {
            position: {
                y: pos,
            },
        });
        animate.duration(duration);
        return animate;
    }

    /**
     * run the close animation
     */
    close() {
        this.topEyelid.animation.start('close');
        this.bottomEyelid.animation.start('close');

    }

    /**
     * run the open animation
     */
    open() {
        this.topEyelid.animation.start('open');
        this.bottomEyelid.animation.start('open');
    }

    /**
     * our instance for singleton
     * @type {null}
     */
    static instance = null;

    /**
     * if there is an instance returns it
     * otherwise creates an instance then returns it
     * @returns {null}
     */
    static get() {
        if (!blinkAnimation.instance) {
            new blinkAnimation();
        }
        return blinkAnimation.instance;
    }
}