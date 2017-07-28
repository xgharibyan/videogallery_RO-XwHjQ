import * as RODIN from 'rodin/core';

/**
 * this file handles video player controls, buttons, scrollbar...
 */

let bufferAnimation = new RODIN.AnimationClip("bufferAnimation", {
    rotation: {
        x: 0,
        y: {
            from: -Math.PI / 2,
            to: Math.PI / 2,
        },
        z: 0
    }
});
bufferAnimation.loop(true);
bufferAnimation.duration(1000);

let hoverAnimation = new RODIN.AnimationClip("hoverAnimation", {
    scale: {
        x: 1.1,
        y: 1.1,
        z: 1.1
    }
});
hoverAnimation.duration(200);

let hoverOutAnimation = new RODIN.AnimationClip("hoverOutAnimation", {
    scale: {
        x: 1,
        y: 1,
        z: 1
    }
});
hoverOutAnimation.duration(200);

let scaleOutAnimation = new RODIN.AnimationClip("scaleOutAnimation", {
    scale: {
        x: 0.01,
        y: 0.01,
        z: 0.01
    }
});
scaleOutAnimation.duration(150);

let scaleInAnimation = new RODIN.AnimationClip("scaleInAnimation", {
    scale: {
        x: 1,
        y: 1,
        z: 1
    }
});
scaleInAnimation.duration(150);


const secondsToH_MM_SS = (length, separator = ":") => {
    length = Math.round(length);
    let hours = Math.floor(length / 3600);
    length %= 3600;
    let minutes = Math.floor(length / 60);
    if (minutes < 10 && hours !== 0) {
        minutes = "0" + minutes;
    }
    let seconds = length % 60;

    if (seconds < 10) {
        seconds = "0" + seconds;
    }
    return ((hours !== 0 ? hours + separator : "") + minutes + separator + seconds);
};

export class VPcontrolPanel extends RODIN.Sculpt {

    constructor({
        player,
        title = "Untitled Video",
        cover = null,
        distance = 1.5,
        width = 1.5
    }, transition) {

        super(new THREE.Object3D());
        this.transition = transition;
        this.scene = RODIN.Scene.getByName("videoPlayerScene");
        this.panel = new RODIN.Sculpt();
        this.player = player;
        this.cover = cover;
        this.width = width;
        this.elementsPending = 0;
        this.timeBarButton = null;
        this.coverEl = null;
        this.title = title;

        this.panelCenter = new RODIN.Sculpt();

        this.panel.parent = this.panelCenter;
        this.panel.position.set(0, 0, -distance);
        this.panelCenter.parent = this;
        this.panelCenter.position.set(0, 0, 0);

        this.createTitle();
        this.createBackButton();
        this.createPlayPauseButtons();
        this.createTimeLine();
        this.createTimeBar();
        this.createAudioToggle();
        this.createHDToggle();
        this.createBackGround(distance, width);
        this.createBufferingLogo(distance);
        this.cover && this.createCover(distance, width);
        this.hoverOutTime = Infinity;
        this.hasCloseAction = false;


        this.hoverAction = (evt) => {
            this.hoverOutTime = Infinity;
        };
        this.hoverOutAction = (evt) => {
            this.hoverOutTime = RODIN.Time.now;
        };

        this.player.onBufferStart = () => {
            this.bufferEl.visible = true;
            console.log("buffering START");
        };

        this.player.onBufferEnd = () => {
            this.bufferEl.visible = false;
            console.log("buffering STOP");
        };

        this.init();
    }

    loadVideo(title, url, cover, sphere) {
        this.destroy();
        this.init();
        this.container = sphere;
        this.container.visible = false;
        this.isPlayed = false;
        this.title = title;
        this.player.loadVideo(url);
        this.cover = cover;
        this.createTitle();
        this.createCover();
        this.createTimeBar();
        this.createHDToggle();

        this.hideControls();
        this.showControls();
    }

    init() {
        this.onButtonDown = () => {
            this.buttonDownTime = RODIN.Time.now;
        };
        this.scene.on(RODIN.CONST.GAMEPAD_BUTTON_DOWN, this.onButtonDown);


        this.onButtonUp = () => {
            if (this.buttonDownTime && RODIN.Time.now - this.buttonDownTime >= 250) return;
            this.toggleControls();
        };
        this.scene.on(RODIN.CONST.GAMEPAD_BUTTON_UP, this.onButtonUp);


        this.onUpdate = () => {
            if (RODIN.Time.now - this.hoverOutTime > 3000 && !this.hasCloseAction) {
                this.hideControls();
                this.hasCloseAction = true;
            }
        };
        this.scene.on(RODIN.CONST.UPDATE, this.onUpdate);
    }
    hideControls() {
        this.panel.parent = null;
    }

    showControls() {
        this.panel.parent = this.panelCenter;
        let vector = this.scene.avatar.HMDCamera._threeObject.getWorldDirection();
        let newRot = Math.atan(vector.x / vector.z) + (vector.z < 0 ? Math.PI : 0) + Math.PI;
        if (Math.abs(this.rotation.y - newRot) >= Math.PI / 3) {
            this.panelCenter.rotation.y = newRot;
        }
        this.hasCloseAction = false;
        this.hoverOutTime = RODIN.Time.now;
    }

    toggleControls() {
        if (this.panel.parent === this.panelCenter) {
            this.hideControls();
        } else {
            this.showControls();
        }
    }

    readyCheck() {
        if (!this.elementsPending) {
            this.emitAsync(RODIN.CONST.READY, new RODIN.RodinEvent(this));
        }
    }

    createBackGround(distance, width) {
        let r = Math.sqrt(distance * distance + width * width / 4) * 2;

        let sphere = new RODIN.Sculpt(new THREE.Mesh(
            new THREE.SphereBufferGeometry(r, 12, 12),
            new THREE.MeshBasicMaterial({
                color: 0x000000,
                transparent: true,
                opacity: 0.3,
                side: THREE.BackSide
            })
        ));

        sphere._threeObject.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0, -r));
        sphere.parent = this.panel;
        sphere.position.set(0, 0, r);
    }

    createCover(distance, width) {
        let r = Math.sqrt(distance * distance + width * width / 4) * 3;

        if (this.coverEl && this.coverEl._threeObject) {
            this.coverEl._threeObject.material.map = new THREE.TextureLoader().load(this.cover);
            return;
        }
        let coverMesh = new THREE.Mesh(
            new THREE.SphereBufferGeometry(r, 720, 4),
            new THREE.MeshBasicMaterial({
                color: 0xffffff,
                map: new THREE.TextureLoader().load(this.cover),
                side: THREE.DoubleSide
            })
        );

        coverMesh.scale.set(-1, 1, 1);

        this.coverEl = new RODIN.Sculpt(coverMesh);
        this.coverEl.on(RODIN.CONST.READY, (evt) => {
            // this.coverEl.parent = this;
            this.add(this.coverEl);
        });
    }

    createBackButton() {
        let backParams = {
            name: "back",
            width: this.width / 8,
            height: this.width / 8,
            ppm: 500
        };

        backParams.background = {
            image: {
                url: "./src/assets/icons/backButton.png"
            },
            opacity: 0.5
        };
        this.elementsPending++;

        let back = new RODIN.Element(backParams);
        back.on(RODIN.CONST.READY, (evt) => {
            evt.target.parent = this.panel;
            evt.target.position.set(-this.width / 2.2, this.width / 4, 0);
            evt.target.animation.add(hoverAnimation, hoverOutAnimation);
            this.elementsPending--;
            this.readyCheck();
        });
        back.on(RODIN.CONST.GAMEPAD_HOVER, (evt) => {
            evt.target.animation.start("hoverAnimation");
        });
        back.on(RODIN.CONST.GAMEPAD_HOVER_OUT, (evt) => {
            evt.target.animation.start("hoverOutAnimation");
        });
        back.on(RODIN.CONST.GAMEPAD_BUTTON_DOWN, (evt) => {
            evt.stopPropagation();
            if (this.container) {
                this.container.visible = false;
            }
            this.pauseButton.scale.set(1, 1, 1);
            this.playButton.scale.set(1, 1, 1);
            if (this.pauseButton && this.pauseButton.parent) {
                // this.pauseButton.parent = null;
                // this.playButton.parent = this.panel;

                this.pauseButton.parent && this.pauseButton.parent.remove(this.pauseButton);
                this.panel.add(this.playButton);
                this.player.pause();
            }

            if (this.player.getLength()) {
                this.player.jumpTo(0);
            }
            this.transition.close();

            const onclose = (evt) => {
                this.transition.removeEventListener('Closed', onclose);

                RODIN.Scene.go('Main');
                RODIN.Scene.HMDCamera.name = 'mainCamera';
                this.transition.camera = RODIN.Scene.HMDCamera;

                // we need this timeout because of a bug in lib
                // remove this when lib is fixed
                setTimeout(() => {
                    this.transition.open();
                }, 0);
            };

            this.transition.on('Closed', onclose);
        });
    }

    createTitle() {
        let titleParams = {
            text: this.title,
            color: 0xffffff,
            fontFamily: "Arial",
            fontSize: this.width * 0.04,
            ppm: 1000
        };
        if (this.titleButton) {
            this.panel.remove(this.titleButton);
            this.titleButton = null;
            delete this.titleButton;
        }
        this.titleButton = new RODIN.Text(titleParams);
        this.elementsPending++;

        this.titleButton.on(RODIN.CONST.READY, (evt) => {
            this.panel.add(this.titleButton);
            this.titleButton.position.set(0, this.width / 4, 0);
            this.elementsPending--;
            this.readyCheck();
        });
    }

    createPlayPauseButtons() {
        let playParams = {
            name: "play",
            width: this.width / 5,
            height: this.width / 5
        };

        playParams.background = {
            color: 0x666666,
            opacity: 0.3
        };

        playParams.border = {
            radius: this.width / 10
        };

        playParams.image = {
            url: "./src/assets/icons/play.png",
            width: this.width / 15,
            height: this.width / 15,
            position: {
                h: 54,
                v: 50
            }
        };

        let playButton = new RODIN.Element(playParams);
        this.playButton = playButton;
        this.elementsPending++;

        playButton.on(RODIN.CONST.READY, (evt) => {
            // playButton.parent = this.panel;
            this.panel.add(playButton);
            playButton.position.set(0, 0, 0);
            playButton.animation.add(hoverAnimation, hoverOutAnimation, scaleOutAnimation, scaleInAnimation);
            this.elementsPending--;
            this.readyCheck();
        });

        playButton.on(RODIN.CONST.GAMEPAD_HOVER, (evt) => {
            this.hoverAction(evt);
            !evt.target.animation.isPlaying() && evt.target.animation.start("hoverAnimation");
        });

        playButton.on(RODIN.CONST.GAMEPAD_HOVER_OUT, (evt) => {
            this.hoverOutAction(evt);
            !evt.target.animation.isPlaying() && evt.target.animation.start("hoverOutAnimation");
        });

        playButton.on(RODIN.CONST.GAMEPAD_BUTTON_DOWN, (evt) => {
            evt.stopPropagation();
            if (this.visible) {
                evt.target.animation.start("scaleOutAnimation");
            }
        });

        playButton.on(RODIN.CONST.ANIMATION_COMPLETE, (evt) => {
            if (evt.animation === "scaleOutAnimation") {
                // playButton.parent = null;
                // pauseButton.parent = this.panel;

                playButton.parent && playButton.parent.remove(playButton);
                this.panel.add(pauseButton);
                pauseButton.animation.start("scaleInAnimation");
                if (this.cover && this.coverEl) {
                    this.coverEl.visible = false;
                }
                this.canGo = true;
                this.player.play();
            }
        });


        let pauseParams = {
            name: "pause",
            width: this.width / 5,
            height: this.width / 5
        };

        pauseParams.background = {
            color: 0x666666,
            opacity: 0.3
        };

        pauseParams.border = {
            radius: this.width / 10
        };

        pauseParams.image = {
            url: "./src/assets/icons/pause.png",
            width: this.width * 0.04,
            height: this.width * 0.06,
            position: {
                h: 50,
                v: 50
            }
        };

        let pauseButton = new RODIN.Element(pauseParams);
        this.pauseButton = pauseButton;
        this.elementsPending++;

        pauseButton.on(RODIN.CONST.READY, (evt) => {
            // pauseButton.parent = this.panel;
            this.panel.add(pauseButton);
            pauseButton.position.set(0, 0, 0);
            pauseButton.parent = null;
            evt.target.animation.add(hoverAnimation, hoverOutAnimation, scaleOutAnimation, scaleInAnimation);
            this.elementsPending--;
            this.readyCheck();
        });

        pauseButton.on(RODIN.CONST.GAMEPAD_HOVER, (evt) => {
            this.hoverAction(evt);
            !evt.target.animation.isPlaying() && evt.target.animation.start("hoverAnimation");
        });

        pauseButton.on(RODIN.CONST.GAMEPAD_HOVER_OUT, (evt) => {
            this.hoverOutAction(evt);
            !evt.target.animation.isPlaying() && evt.target.animation.start("hoverOutAnimation");
        });

        pauseButton.on(RODIN.CONST.GAMEPAD_BUTTON_DOWN, (evt) => {
            evt.stopPropagation();
            if (this.visible) {
                evt.target.animation.start("scaleOutAnimation");
            }
        });

        pauseButton.on(RODIN.CONST.ANIMATION_COMPLETE, (evt) => {
            if (evt.animation === "scaleOutAnimation") {
                // pauseButton.parent = null;
                // playButton.parent = this.panel;

                pauseButton.parent && pauseButton.parent.remove(pauseButton);
                this.panel.add(playButton);
                playButton.animation.start("scaleInAnimation");
                this.player.pause();
            }

            if (evt.animation === 'scaleInAnimation') {
                console.log(pauseButton.scale.valueOf());
            }
        });
    }

    createBufferingLogo(distance) {
        const bufferingParams = {
            name: "buffering",
            width: this.width / 6,
            height: this.width / 6
        };

        bufferingParams.background = {
            color: 0x666666,
            opacity: 0.3
        };

        bufferingParams.border = {
            radius: this.width / 12,
            width: this.width / 500,
            color: 0xffffff
        };

        bufferingParams.image = {
            url: "./src/assets/icons/rodin.png",
            width: this.width / 30,
            height: this.width / 25,
            position: {
                h: 54,
                v: 35
            }
        };
        bufferingParams.label = {
            text: "loading",
            fontSize: this.width / 37.5,
            color: 0xffffff,
            position: {
                h: 50,
                v: 65
            }
        };

        this.bufferEl = new RODIN.Element(bufferingParams);
        this.elementsPending++;

        this.bufferEl.on(RODIN.CONST.READY, (evt) => {
            this.panel.add(this.bufferEl);
            this.bufferEl.position.set(0, 0, -distance + bufferingParams.width / 2);
            this.bufferEl.visible = false;
            this.bufferEl.animation.add(bufferAnimation);
            this.bufferEl.animation.start("bufferAnimation");
            this.elementsPending--;
            this.readyCheck();
        });
    }

    createTimeLine() {
        const color = 0xff9a2b;

        const timeLineBGParams = {
            name: "timeLineBG",
            width: this.width,
            height: this.width / 50,
            background: {
                color: 0xaaaaaa,
                opacity: 0.5
            }
        };

        const timeLineParams = {
            name: "timeLine",
            width: this.width,
            height: this.width / 50,
            background: {
                color: color
            },
            transparent: false
        };

        const caretParams = {
            name: "caret",
            width: this.width * 0.024,
            height: this.width * 0.024,
            border: {
                radius: this.width * 0.012
            },
            background: {
                color: 0xffffff
            },
            transparent: false
        };

        const pointerParams = {
            name: "pointer",
            width: this.width * 0.046,
            height: this.width * 0.046,
            border: {
                width: this.width / 500,
                color: 0xffffff,
                radius: this.width * 0.023
            },
            label: {
                text: "I",
                fontSize: this.width / 37.5,
                color: 0xff0000,
                position: {
                    h: 50,
                    v: 55
                }
            }
        };

        const pointerTimeParams = {
            name: "pointerTimeParams",
            text: "0:00",
            color: 0xffffff,
            fontFamily: "Arial",
            fontSize: this.width / 37.5,
            ppm: 1000
        };

        let timeLineBG = new RODIN.Element(timeLineBGParams);
        this.elementsPending++;


        timeLineBG.on(RODIN.CONST.READY, (evt) => {
            this.isVideoReady = true;
            timeLineBG.parent = this.panel;
            timeLineBG.position.set(0, -this.width / 3.75, 0);
            this.elementsPending--;
            this.readyCheck();
        });


        timeLineBG.on(RODIN.CONST.GAMEPAD_MOVE, (evt) => {
            this.hoverAction(evt);
            if (pointer.isReady) {
                pointer.visible = true;
                pointer.position.x = evt.uv.x - this.width / 2;
            }

            if (pointerTime.isReady) {
                let time = secondsToH_MM_SS(this.player.getLength() * evt.uv.x / this.width);
                pointerTime.position.x = evt.uv.x - this.width / 2;
                if (time === pointerTime.lastTime && pointerTime.visible) return;
                pointerTimeParams.text = time;
                pointerTime.reDraw(pointerTimeParams);
                pointerTime.visible = true;
                pointerTime.lastTime = time;
            }
        });

        timeLineBG.on(RODIN.CONST.GAMEPAD_HOVER_OUT, (evt) => {
            this.hoverOutAction(evt);
            if (pointer.isReady) {
                pointer.visible = false;
            }
            if (pointerTime.isReady) {
                pointerTime.visible = false;
            }
        });

        timeLineBG.on(RODIN.CONST.GAMEPAD_BUTTON_DOWN, (evt) => {
            evt.stopPropagation();
            this.player.jumpTo(evt.uv.x / this.width);
        });

        let timeLine = new RODIN.Element(timeLineParams);
        this.elementsPending++;

        timeLine.on(RODIN.CONST.READY, () => {
            timeLine.parent = this.panel;
            timeLine.position.set(0, -this.width / 3.75, 0.0001);
            timeLine.scale.set(0.0001, 1, 1);
            this.elementsPending--;
            this.readyCheck();
        });

        this.timeLine = timeLine;
        timeLine.on(RODIN.CONST.UPDATE, (evt) => {
            let time = this.player.getTime();
            time = time ? time : 0.0001;
            let duration = this.player.getLength();
            if (!duration) return;
            let scale = time / duration;
            timeLine.scale.set(scale, 1, 1);
            timeLine.position.x = (scale - 1) * this.width / 2;
        });


        let caret = new RODIN.Element(caretParams);
        this.elementsPending++;

        caret.on(RODIN.CONST.READY, (evt) => {
            caret.parent = this.panel;
            caret.position.y = -this.width / 3.75;
            caret.position.z = 0.0002;
            caret.position.x = -this.width / 2;
            this.elementsPending--;
            this.readyCheck();
        });

        caret.on('update', (evt) => {
            if (timeLine.isReady) {
                caret.position.x = timeLine.scale.x * this.width - this.width / 2;
            }
        });


        let pointer = new RODIN.Element(pointerParams);
        this.elementsPending++;

        pointer.on(RODIN.CONST.READY, (evt) => {
            pointer.parent = this.panel;
            pointer.position.y = -this.width / 3.75;
            pointer.position.z = 0.0004;
            pointer._threeObject.material.depthWrite = false;
            pointer.position.x = -this.width / 2;
            pointer.visible = false;
            this.elementsPending--;
            this.readyCheck();
        });

        let pointerTime = new RODIN.Text(pointerTimeParams);
        this.elementsPending++;

        pointerTime.on(RODIN.CONST.READY, (evt) => {
            pointerTime.parent = this.panel;
            pointerTime.position.y = -this.width * 0.21;
            pointerTime.position.z = 0.0004;
            pointerTime.position.x = 0;
            pointerTime.visible = false;
            this.elementsPending--;
            this.readyCheck();
        });

        this.caret = caret;
        this.pointer = pointer;
        this.pointerTime = pointerTime;
    }

    createTimeBar() {
        let timeBarParams = {
            text: "0:00/0:00",
            color: 0xffffff,
            fontFamily: "Arial",
            fontSize: this.width / 30,
            ppm: 1000
        };
        if (this.timeBarButton) {
            this.panel.remove(this.timeBarButton);
            this.timeBarButton = null;
            delete this.timeBarButton;
        }
        this.timeBarButton = new RODIN.Text(timeBarParams);
        this.elementsPending++;
        this.timeBarButton.on(RODIN.CONST.READY, (evt) => {
            // this.timeBarButton.parent = this.panel;
            this.panel.add(this.timeBarButton);
            this.timeBarButton.position.set(-this.width / 2, -this.width / 3, 0);
            this.elementsPending--;
            this.readyCheck();
        });

        this.timeBarButton.on('update', (evt) => {
            let time = secondsToH_MM_SS(this.player.getTime());
            let total = secondsToH_MM_SS(this.player.getLength());
            if (time === evt.target.lastTime) return;
            timeBarParams.text = time + "/" + total;
            evt.target.reDraw(timeBarParams);
            if (!isNaN(this.player.getLength())) {
                if (this.container) {
                    this.container.visible = true;
                }
                evt.target.lastTime = time;
                if (!this.isPlayed) {
                    // this.playButton.parent = null;
                    // this.pauseButton.parent = this.panel;

                    this.playButton.parent && this.playButton.parent.remove(this.playButton);
                    this.panel.add(this.pauseButton);

                    this.pauseButton.animation.start("scaleInAnimation");
                    if (this.cover && this.coverEl) {
                        this.coverEl.visible = false;
                    }
                    this.isPlayed = true;
                    this.player.play();
                }
            }

            evt.target._threeObject.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(evt.target._threeObject.geometry.parameters.width / 2, 0, 0));
        });
    }

    createAudioToggle() {
        let muteParams = {
            name: "mute",
            width: this.width * 0.04,
            height: this.width * 0.04,
            ppm: 1000
        };

        muteParams.image = {
            url: "./src/assets/icons/audioON.png",
            width: this.width * 0.04,
            height: this.width * 0.04,
            position: {
                h: 50,
                v: 50
            }
        };

        let muteButton = new RODIN.Element(muteParams);
        this.elementsPending++;

        muteButton.on(RODIN.CONST.READY, (evt) => {
            muteButton.parent = this.panel;
            muteButton.position.set(-this.width / 2, -this.width / 3.02, 0);
            evt.target.animation.add(hoverAnimation, hoverOutAnimation);
            this.elementsPending--;
            this.readyCheck();
        });

        muteButton.on('update', (evt) => {
            if (this.timeBarButton) {
                muteButton.position.x = this.timeBarButton.position.x + this.timeBarButton.scale.x * this.timeBarButton._threeObject.geometry.parameters.width + this.width / 30;
            }
        });

        muteButton.on(RODIN.CONST.GAMEPAD_HOVER, (evt) => {
            this.hoverAction(evt);
            evt.target.animation.start("hoverAnimation");
        });

        muteButton.on(RODIN.CONST.GAMEPAD_HOVER_OUT, (evt) => {
            this.hoverOutAction(evt);
            evt.target.animation.start("hoverOutAnimation");
        });

        muteButton.on(RODIN.CONST.GAMEPAD_BUTTON_DOWN, (evt) => {
            evt.stopPropagation();
            this.player.mute(true);
            muteButton.parent = null;
            unmuteButton.parent = this.panel;
            unmuteButton.position.set(-this.width / 2, -this.width / 3.02, 0);
        });

        let unmuteParams = {
            name: "unmute",
            width: this.width * 0.04,
            height: this.width * 0.04,
            ppm: 1000
        };

        unmuteParams.image = {
            url: "./src/assets/icons/audioOFF.png",
            width: this.width * 0.04,
            height: this.width * 0.04,
            opacity: 0.6,
            position: {
                h: 50,
                v: 50
            }
        };

        let unmuteButton = new RODIN.Element(unmuteParams);
        this.elementsPending++;

        unmuteButton.on(RODIN.CONST.READY, (evt) => {
            unmuteButton.parent = this.panel;
            unmuteButton.position.set(-this.width / 2, -this.width / 3.02, 0);
            evt.target.animation.add(hoverAnimation, hoverOutAnimation);
            this.elementsPending--;
            this.readyCheck();
            unmuteButton.parent = null;
        });

        unmuteButton.on('update', (evt) => {
            if (this.timeBarButton) {
                unmuteButton.position.x = this.timeBarButton.position.x + this.timeBarButton.scale.x * this.timeBarButton._threeObject.geometry.parameters.width + this.width / 30;
            }
        });

        unmuteButton.on(RODIN.CONST.GAMEPAD_HOVER, (evt) => {
            this.hoverAction(evt);
            evt.target.animation.start("hoverAnimation");
        });

        unmuteButton.on(RODIN.CONST.GAMEPAD_HOVER_OUT, (evt) => {
            this.hoverOutAction(evt);
            evt.target.animation.start("hoverOutAnimation");
        });

        unmuteButton.on(RODIN.CONST.GAMEPAD_BUTTON_DOWN, (evt) => {
            evt.stopPropagation();
            this.player.mute(false);
            unmuteButton.parent = null;
            muteButton.parent = this.panel;
            muteButton.position.set(-this.width / 2, -this.width / 3.02, 0);
        });

    }

    createHDToggle() {
        let HDParams = {
            text: "HD",
            color: 0xffffff,
            fontFamily: "Arial",
            fontSize: this.width / 30,
            ppm: 1000
        };


        if (this.HDButton && this.HDButton.parent) {
            this.panel.remove(this.HDButton);
            // this.HDButton.parent = null;
            this.HDButton.parent && this.HDButton.parent.remove(this.HDButton);
            this.HDButton = null;
            delete this.HDButton;
        }
        if (this.SDButton && this.SDButton.parent) {
            this.panel.remove(this.SDButton);
            // this.SDButton.parent = null;
            this.SDButton.parent && this.SDButton.parent.remove(this.SDButton);
            this.SDButton = null;
            delete this.SDButton;
        }
        this.HDButton = new RODIN.Text(HDParams);

        this.elementsPending++;

        this.HDButton.on(RODIN.CONST.READY, (evt) => {
            // this.HDButton.parent = this.panel;
            this.panel.add(this.HDButton);
            this.HDButton.position.set(this.width * 0.48, -this.width / 3.02, 0);
            evt.target.animation.add(hoverAnimation, hoverOutAnimation);
            this.elementsPending--;
            this.readyCheck();
        });

        this.HDButton.on(RODIN.CONST.GAMEPAD_HOVER, (evt) => {
            this.hoverAction(evt);
            evt.target.animation.start("hoverAnimation");
        });

        this.HDButton.on(RODIN.CONST.GAMEPAD_HOVER_OUT, (evt) => {
            this.hoverOutAction(evt);
            evt.target.animation.start("hoverOutAnimation");
        });

        this.HDButton.on(RODIN.CONST.GAMEPAD_BUTTON_DOWN, (evt) => {
            evt.stopPropagation();
            let playAfter = this.player.isPlaying();
            this.player.switchTo("SD");

            // this.HDButton.parent = null;
            // this.SDButton.parent = this.panel;

            this.HDButton.parent && this.HDButton.parent.remove(this.HDButton);
            this.panel.add(this.SDButton);
            this.SDButton.position.set(this.width * 0.48, -this.width / 3.02, 0);

            if (playAfter) {
                this.player.play();
            }
        });


        let SDParams = {
            text: "SD",
            color: 0xffffff,
            fontFamily: "Arial",
            fontSize: this.width / 30,
            ppm: 1000
        };
        this.SDButton = new RODIN.Text(SDParams);

        this.elementsPending++;

        this.SDButton.on(RODIN.CONST.READY, (evt) => {
            // this.SDButton.parent = this.panel;
            this.panel.add(this.SDButton);
            this.SDButton.position.set(this.width * 0.48, -this.width / 3.02, 0);
            evt.target.animation.add(hoverAnimation, hoverOutAnimation);
            this.elementsPending--;
            this.readyCheck();
            // this.SDButton.parent = null;
            this.SDButton.parent && this.SDButton.parent.remove(this.SDButton);
        });

        this.SDButton.on(RODIN.CONST.GAMEPAD_HOVER, (evt) => {
            this.hoverAction(evt);
            evt.target.animation.start("hoverAnimation");
        });

        this.SDButton.on(RODIN.CONST.GAMEPAD_HOVER_OUT, (evt) => {
            this.hoverOutAction(evt);
            evt.target.animation.start("hoverOutAnimation");
        });

        this.SDButton.on(RODIN.CONST.GAMEPAD_BUTTON_DOWN, (evt) => {
            evt.stopPropagation();

            let playAfter = this.player.isPlaying();
            this.player.switchTo("HD");

            // this.SDButton.parent = null;
            // this.HDButton.parent = this.panel;

            this.SDButton.parent && this.SDButton.parent.remove(this.SDButton);
            this.panel.add(this.HDButton);
            this.HDButton.position.set(this.width * 0.48, -this.width / 3.02, 0);

            if (playAfter) {
                this.player.play();
            }
        });
    }

    destroy() {
        this.scene.removeEventListener(RODIN.CONST.GAMEPAD_BUTTON_DOWN, this.onButtonDown);
        this.scene.removeEventListener(RODIN.CONST.GAMEPAD_BUTTON_UP, this.onButtonUp);
        this.scene.removeEventListener(RODIN.CONST.UPDATE, this.onUpdate);
    }
}