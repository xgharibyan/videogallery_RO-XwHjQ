import * as RODIN from 'rodin/core';

/**
 * a class for thumbnails
 */
export class Thumbnail extends RODIN.Sculpt {
    constructor(params, videoPlayer, blinkAnimation) {
        super();

        this.videoPlayer = videoPlayer;
        this.transition = blinkAnimation;
        this.element = null;
        this.main = null;
        this.params = params;
        this.more = new RODIN.Element({
            width: 1.6,
            height: 0.15,
            background: {
                image: {url: './src/assets/more_bg.png'}
            },
            border: {
                radius: {leftBottom: 0.05, rightBottom: 0.05}
            },
            transparent: true
        });
        this.isDescriptionMode = false;
        this.more.name = 'more';
        this.more.visible = false;

        this.active = false;
        let moretext = new RODIN.Text({
            text: 'More About Video',
            fontSize: 0.065,
            color: 0xffffff
        });
        this.more.on(RODIN.CONST.READY, evt => {
            let more = evt.target;
            more.visible = false;
            more.add(moretext);
            moretext.position.z = 0.01;
            more._threeObject.geometry.center();
            more.on(RODIN.CONST.GAMEPAD_HOVER, Thumbnail.moreHover.bind(this));
            more.on(RODIN.CONST.GAMEPAD_HOVER_OUT, Thumbnail.moreHoverOut.bind(this));
            more.on(RODIN.CONST.GAMEPAD_BUTTON_DOWN, this.showHideDescription.bind(this));
            more.position.y = -0.38;
            more.position.z = 0.01;
        });
    }

    /**
     * hover animation for more
     * @param evt
     */
    static moreHover(evt) {
        Thumbnail.thumbAnimation(evt.target._children[0], {position: {z: 0.02}}, 'moreHover', 50);
    }

    /**
     * hover our animation for more
     * @param evt
     */
    static moreHoverOut(evt) {
        Thumbnail.thumbAnimation(evt.target._children[0], {position: {z: 0.01}}, 'moreHoverOut', 50);
    }


    /**
     * renders our thumbnail
     * @param id
     * @returns {Thumbnail}
     */
    draw(id) {
        this.element = new RODIN.Element({
            name: this.params.name,
            width: 1.6,
            height: 0.9,
            background: {
                image: {url: this.params.thumbnail}
            },
            border: {
                radius: 0.05
            },
            transparent: false
        });
        this.element.id = id;
        this.id = id;

        this.element.on(RODIN.CONST.READY, el => {
            this.add(this.element);
            this.element.container = this;

            this.element.add(this.getDescription(id));
            let title = new RODIN.Element({
                width: 1.6,
                height: 0.3,
                background: {
                    image: {url: './src/assets/title.png'}
                },
                border: {
                    radius: {leftTop: 0.05, rightTop: 0.05}
                },
                label: {text: this.params.title, fontSize: 0.12, color: 0xffffff, position: {v: 50, h: 0}}
            });
            title.on(RODIN.CONST.READY, text => {
                let {target} = text;
                target.position.y = 0.3;
                target.position.z = 0.01;
                el.target.add(target);
                el.target.add(this.more);
            });
        });
        this._lastButtonDown = 0;

        this.element.on(RODIN.CONST.GAMEPAD_BUTTON_DOWN, this.onButtonDown.bind(this));
        this.element.on(RODIN.CONST.GAMEPAD_BUTTON_UP, this.onButtonUp.bind(this));
        this.element.on(RODIN.CONST.GAMEPAD_HOVER, this.onElementHover.bind(this));
        this.element.on(RODIN.CONST.GAMEPAD_HOVER_OUT, this.onElementHoverOut.bind(this));
        this.element.on(RODIN.CONST.GAMEPAD_MOVE, Thumbnail.onButtonMove.bind(this));
        return this;
    }

    onElementHover(e) {
        if (!this.active) {
            this.more.visible = true;
            Thumbnail.reset(e.target.container.parent);
            Thumbnail.thumbAnimation(e.target, {position: {z: .05}}, 'elementShow', 100);
            this.active = true;
        }
    }
    onElementHoverOut(e) {
        if(!this.description.visible) {
            Thumbnail.reset(e.target.container.parent);
        }
    }

    static onButtonMove(e) {
        e.stopPropagation();
    }

    /**
     * button down event
     * @param e
     */
    onButtonDown(e) {
        this._lastButtonDown = RODIN.Time.now;
    }


    /**
     * button up event
     * @param e
     */
    onButtonUp(e) {
        if (RODIN.Time.now - this._lastButtonDown > 200)
            return;
        if (!this.description._threeObject.visible) {
            this.transition.camera = RODIN.Scene.HMDCamera;
            this.transition.close();

            const onclose = (evt) => {
                this.transition.removeEventListener('Closed', onclose);
                RODIN.Scene.go('videoPlayerScene');
                RODIN.Scene.HMDCamera.name = 'videoCamera';
                this.videoPlayer.playVideo(this.params.url, this.params.title, './src/assets/icons/rodin.jpg', this.transition);
                this.transition.camera = RODIN.Scene.HMDCamera;
                // we need this timeout because of a bug in lib
                // remove this when lib is fixed
                setTimeout(() => {
                    this.transition.open();
                }, 0);
            };

            this.transition.on('Closed', onclose);

        }
    }

    /**
     * gets a description object
     * @param id
     * @returns {RODIN.Element}
     */

    getDescription(id) {
        this.description = new RODIN.Element({
            name: 'description',
            width: 1.6,
            height: 0.9,
            background: {
                opacity: 0.5,
                color: '0x000000'
            },
            border: {
                radius: 0.05
            }
        });

        this.description.visible = false;
        this.description.id = id;
        let description = new RODIN.DynamicText({
            width: 1.45,
            text: this.params.description,
            fontSize: 0.07,
            lineHeight: 0.1,
            color: 0xffffff
        });
        description._threeObject.renderOrder = 1;
        description.position.z = .01;
        description.position.x = 0;
        let close = new RODIN.Text({
            text: 'Click To Close',
            fontSize: 0.065,
            color: 0xffffff
        });
        close._threeObject.renderOrder = 1;
        this.description.on(RODIN.CONST.READY, evt => {
            evt.target.add(description);
            description.position.y = 0.39 - description._threeObject.geometry.parameters.height / 2 ;
            evt.target.add(close);
            close.position.y = -0.38;
            close.position.z = .01;
            close.on(RODIN.CONST.GAMEPAD_BUTTON_DOWN, this.showHideDescription.bind(this));
            close.on(RODIN.CONST.GAMEPAD_HOVER, this.clickToCloseHover.bind(this));
            close.on(RODIN.CONST.GAMEPAD_HOVER_OUT, this.clickToCloseHoverOut.bind(this));
        });
        return this.description;
    }

    clickToCloseHover (e) {
        Thumbnail.thumbAnimation(e.target, {position: {z: 0.02}}, 'clickToCloseHover', 50);
    }

    clickToCloseHoverOut (e) {
        Thumbnail.thumbAnimation(e.target, {position: {z: 0.01}}, 'clickToCloseHoverOut', 50);
    }
    /**
     * toggle description visibility
     * @param evt
     */
    showHideDescription(evt) {
        evt && evt.stopPropagation();
        for (let i = 0; i < this.element._children.length; i++) {
            const el = this.element._children[i];
            el.visible = !el.visible;
        }
        if(!this.active) {
            this.more.visible = false;
        }
        this.isDescriptionMode = !this.isDescriptionMode;
    }

    /**
     * animation for the thumbnail
     * @param obj
     * @param params
     * @param name
     * @param duration
     */
    static thumbAnimation(obj, params, name, duration) {
        const navigationAnimation = new RODIN.AnimationClip(name, params);
        navigationAnimation.duration(duration);
        obj.animation.add(navigationAnimation);
        obj.animation.start(name);
    }

    /**
     * resets all thumbnail's views to default
     * @param thumbnailContainer
     */
    static reset(thumbnailContainer) {
        if(!thumbnailContainer) return;
        let thumbs;
        if(thumbnailContainer && thumbnailContainer._children) {
            thumbs = thumbnailContainer._children;
        } else {
            thumbs = thumbnailContainer;
        }
        for (let i = 0; i < thumbs.length; i++) {
            const ch = thumbs[i];
            if (!ch.active) {
                continue;
            }
            ch.active = false;
            ch.more.visible = false;
            Thumbnail.thumbAnimation(ch.element, {position: {z: 0}}, 'elementHide', 100);
            if (ch.isDescriptionMode) {
                ch.showHideDescription();
            }
        }

    }
}