
import { AppLayoutBehavior } from '@polymer/app-layout/app-layout-behavior/app-layout-behavior';
import { LogInfo, LogRqst } from 'globular-web-client/log/log_pb';
import { Application } from '../Application';
import { applicationView, ApplicationView } from '../ApplicationView';
import { Model } from '../Model';

import { setMoveable } from './moveable'
import { setResizeable } from './rezieable'

import '@polymer/iron-icons/communication-icons'
import { fireResize } from './utility';

// Contains the stun server URL we will be using.
let connectionConfig = {
    'iceServers': [{
        'urls': 'stun:stun.stunprotocol.org:3478'
    },
    {
        'urls': 'stun:stun.l.google.com:19302'
    },
    ],
    sdpSemantics: 'unified-plan'
};

const offerOptions = {
    offerToReceiveAudio: 1,
    offerToReceiveVideo: 1
};

/**
 * Video conversation.
 */
export class VideoConversation extends HTMLElement {
    // attributes.


    // Create conversation view.
    constructor(conversationUuid, domain) {
        super()

        // Keep reference to the conversation
        this.conversationUuid = conversationUuid
        this.domain = domain
        this.eventHub = Model.getGlobule(this.domain).eventHub

        this.localStream = null;
        this.pendingCanditates = [];
        this.listeners = {};

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // The connections with other participants.
        this.connections = {};

        let hideheader = this.getAttribute("hideheader") != undefined

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           
            #container{
                width: 720px;
                position: fixed;
                max-height: calc(100vh - 100px)
            }

            .header{
                display: flex;
                align-items: center;
                color: var(--palette-text-accent);
                background-color: var(--palette-primary-accent);
            }

            .header span{
                flex-grow: 1;
                text-align: center;
                font-size: 1.1rem;
                font-weight: 500;
                display: inline-block;
                white-space: nowrap;
                overflow: hidden !important;
                text-overflow: ellipsis;
            }

            #local-video{
                width: 200px; 
                position: absolute;
                bottom: 0px;
                right: 0px;
            }

            .peers-video{
                display: flex;
                position: relative;
            }

           .peers-video video{
                width: 100%; 
                height: auto;
            }

            #tool-bar {
                display: flex;
            }

            #start-share-screen{
                display: none;
            }

            #stop-share-screen{
                display: none;
            }

            #title-span{
                flex-grow: 1;
            }

            paper-card{
                background-color: var(--palette-background-paper);
                color: var(--palette-text-primary);
            }

            @media (max-width: 500px) {
                #local-video{
                    width: 100px; 
                    position: absolute;
                    bottom: 0px;
                    right: 0px;
                }

                #container{
                    display: flex;
                    flex-direction: column;
                    top: 0px;
                    left: 0px;
                    width: 100vw;
                    
                }

                video{
                    max-height: 40vh;
                    background-color: black;
                }
            }

        </style>
        <paper-card id="container" class="no-select">
            
            <div class="header" style="${hideheader ? "display:none;" : ""}">
                <paper-icon-button id="video-close-btn" icon="icons:close" style="min-width: 40px; --iron-icon-fill-color: var(--palette-text-accent);"></paper-icon-button>
                <paper-icon-button id="video-options-btn" icon="icons:arrow-drop-down" style="margin-left: 20px; min-width: 40px; --iron-icon-fill-color: var(--palette-text-accent);"></paper-icon-button>
                <span id="title-span"></span>
                <paper-icon-button id="start-share-screen" icon="communication:screen-share" ></paper-icon-button>
            </div>
         
            <div class="peers-video">
                <div id="local-video-div">
            </div>
            
         
        </paper-card>
        `
        let container = this.shadowRoot.querySelector("#container")

        this.shadowRoot.querySelector("#video-close-btn").onclick = () => {
            this.eventHub.publish(`leave_conversation_${conversationUuid}_evt`, JSON.stringify({ "conversationUuid": conversationUuid, "participants": [], "participant": Application.account.id }), false)
        }

        let optionsBtn = this.shadowRoot.querySelector("#video-options-btn")
        optionsBtn.onclick = () => {

            let optionsPanel = this.shadowRoot.querySelector("#options-panel")
            if (!optionsPanel) {
                let html = `
                <style>
                    #options-panel{
                        display: flex;
                        flex-direction: column;
                        background-color: var(--palette-background-paper);
                        color: var(--palette-text-primary);
                        position: absolute;
                        top: 0px;
                        left: 0px;
                        font-size: 1rem;
                    }

                    #options-div{
                        display: flex;
                        flex-direction: column;
                    }

                    .table-row {
                        display: flex;
                        font-size: 1.1rem;
                        padding: 5px;
                    }

                    .option {
                       padding: 5px;
                    }

                    .label {
                        padding: 5px;
                        min-width: 200px;
                    }

                    paper-toggle-button{
                        --paper-toggle-button-label-color: var(--palette-text-primary);
                    }

                    paper-toggle-button[checked]{
                        --paper-toggle-button-label-color: var(--palette-text-accent);
                    }

                </style>
                <paper-card id="options-panel">
                        <div id="options-div">
                            <div class="table-row">
                            <div class="label">Local video</div>
                            <paper-toggle-button id="local-video-toggle" class="option" checked>Visible</paper-toggle-button>
                        </div>
                        <div class="table-row">
                            <div class="label">Video streaming</div>
                            <paper-toggle-button id="video-toggle" class="option" checked>Enable</paper-toggle-button>
                        </div>
                        <div class="table-row">
                            <div class="label">Audio streaming</div>
                            <paper-toggle-button id="audio-toggle" class="option" checked>Enable</paper-toggle-button>
                        </div>
                    </div>

                    <div style="display: flex; width: 100%; justify-content: flex-end;">
                        <paper-button id="close-btn">Close</paper-button>
                    </div>

                </paper-card>
                `

                let range = document.createRange()
                container.querySelector(".peers-video").appendChild(range.createContextualFragment(html))

                optionsPanel = this.shadowRoot.querySelector("#options-panel")

                let hideShowLocalVideoToggle = container.querySelector("#local-video-toggle")
                hideShowLocalVideoToggle._enabled_ = true;
                hideShowLocalVideoToggle.onclick = () => {
                    let localVideo = this.shadowRoot.querySelector("#local-video")
                    if (hideShowLocalVideoToggle.checked) {
                        localVideo.style.display = ""
                        hideShowLocalVideoToggle.innerHTML = "Visible"
                        hideShowLocalVideoToggle._enabled_ = true
                    } else {
                        localVideo.style.display = "none"
                        hideShowLocalVideoToggle.innerHTML = "Hidden"
                        hideShowLocalVideoToggle._enabled_ = false

                    }
                }

                let hideShowVideoToggle = container.querySelector("#video-toggle")
                hideShowVideoToggle.onclick = () => {
                    let localVideo = this.shadowRoot.querySelector("#local-video")
                    if (hideShowVideoToggle.checked) {
                        let stream = localVideo.srcObject;
                        // now get all tracks
                        let tracks = stream.getTracks();
                        // now close each track by having forEach loop
                        tracks.forEach((track) => {
                            // stopping every track
                            if (track.kind == "video") {
                                track.enabled = true;
                            }
                        });
                        localVideo.style.display = ""
                        if (hideShowLocalVideoToggle._enabled_) {
                            hideShowLocalVideoToggle.innerHTML = "Visible"
                            hideShowLocalVideoToggle.checked = true
                            localVideo.style.display = ""
                        } else {
                            hideShowLocalVideoToggle.innerHTML = "Hidden"
                            hideShowLocalVideoToggle.checked = false
                            localVideo.style.display = "none"
                        }

                        hideShowVideoToggle.innerHTML = "Enable"

                    } else {
                        let stream = localVideo.srcObject;
                        // now get all tracks
                        let tracks = stream.getTracks();
                        // now close each track by having forEach loop
                        tracks.forEach((track) => {
                            // stopping every track
                            if (track.kind == "video") {
                                track.enabled = false;
                            }
                        });
                        localVideo.style.display = "none"
                        hideShowLocalVideoToggle.innerHTML = "Disable"
                        hideShowVideoToggle.innerHTML = "Disable"
                        if (hideShowLocalVideoToggle.checked) {
                            hideShowLocalVideoToggle._enabled_ = hideShowLocalVideoToggle.checked
                            hideShowLocalVideoToggle.checked = false;
                        }
                    }
                }

                let muteUnmuteVideoToggle = container.querySelector("#audio-toggle")
                muteUnmuteVideoToggle.onclick = () => {

                    let localVideo = this.shadowRoot.querySelector("#local-video")
                    if (muteUnmuteVideoToggle.checked) {
                        let stream = localVideo.srcObject;
                        // now get all tracks
                        let tracks = stream.getTracks();
                        // now close each track by having forEach loop
                        tracks.forEach((track) => {
                            // stopping every track
                            if (track.kind == "audio") {
                                track.enabled = true;
                            }
                        });
                        muteUnmuteVideoToggle.innerHTML = "Enable"
                    } else {
                        let stream = localVideo.srcObject;
                        // now get all tracks
                        let tracks = stream.getTracks();
                        // now close each track by having forEach loop
                        tracks.forEach((track) => {
                            // stopping every track
                            if (track.kind == "audio") {
                                track.enabled = false;
                            }
                        });
                        muteUnmuteVideoToggle.innerHTML = "Muted"
                    }
                }

                let closeBtn = container.querySelector("#close-btn")
                closeBtn.onclick = () => {
                    optionsPanel.style.display = "none"
                }
            } else {
                if (optionsPanel.style.display == "none") {
                    optionsPanel.style.display = ""
                } else {
                    optionsPanel.style.display = "none"
                }
            }
        }

        let offsetTop = this.shadowRoot.querySelector(".header").offsetHeight
        if (offsetTop == 0) {
            offsetTop = 60
        }
        container.style.top = offsetTop + "px"
        this.peersVideo = this.shadowRoot.querySelector(".peers-video")
        this.startShareScreenBtn = this.shadowRoot.querySelector("#start-share-screen")
        container.name = "webrtc_window"

        if (localStorage.getItem("__webrtc_panel_dimension__")) {

            let dimension = JSON.parse(localStorage.getItem("__webrtc_panel_dimension__"))
            if (!dimension) {
                dimension = { with: 400, height: 400 }
            }

            // be sure the dimension is no zeros...
            if (dimension.width < 400) {
                dimension.width = 400
            }

            if (dimension.height < 400) {
                dimension.height = 400
            }

            container.style.width = dimension.width + "px"
            container.style.height = dimension.height + "px"
            localStorage.setItem("__webrtc_panel_dimension__", JSON.stringify({ width: dimension.width, height: dimension.height }))

        } else {
            container.style.width = "400px"
            container.style.height = "400px"
            localStorage.setItem("__webrtc_panel_dimension__", JSON.stringify({ width: 400, height: 400 }))
        }


        setResizeable(container, (width, height) => {
            // fix min size.
            if (height < 400) {
                height = 400
            }

            if (width < 400) {
                width = 400
            }

            localStorage.setItem("__webrtc_panel_dimension__", JSON.stringify({ width: width, height: height }))
            container.style.height = "auto"
            let w = ApplicationView.layout.width();
            if (w < 500) {
                this.container.style.width = "100vw"
            } else {
                this.container.style.width = width + "px"
            }
        })

        container.resizeHeightDiv.style.display = "none"
        container.style.height = "auto"

        setMoveable(this.shadowRoot.querySelector(".header"), container, (left, top) => {
            /** */
        }, this, offsetTop)

        // This will replace all sender video withe the screen capture.
        this.startShareScreenBtn.onclick = () => {
            // Replace all video with the screen sharing button.
            this.initScreenCaptureStream(track => {
                for (var id in this.connections) {
                    this.connections[id].getSenders().forEach(sender => {
                        if (sender.track.kind === 'video') {
                            sender.replaceTrack(track)
                        }
                    })
                }
            }, err => {
                ApplicationView.displayMessage(err, 3000)
            })
        }


        // Start a new video conversation with a remote participant
        if (this.listeners[`start_video_conversation_${this.conversationUuid}_evt`] == undefined) {
            Model.eventHub.subscribe(`start_video_conversation_${this.conversationUuid}_evt`,
                (uuid) => {
                    this.listeners[`start_video_conversation_${this.conversationUuid}_evt`] = uuid
                },
                (participant) => {

                    // Create offer to each participants
                    if (participant.id != Application.account._id) {

                        let connectionId = this.conversationUuid + "_" + participant.id

                        // That will set the on iceconnection ready callback to create offer.
                        this.getConnection(connectionId, rtcPeerConnection => {
                            rtcPeerConnection.onnegotiationneeded = () => {
                                // Set the connection.
                                rtcPeerConnection
                                    .createOffer(offerOptions)
                                    .then((offer) => {
                                        rtcPeerConnection.setLocalDescription(offer).then(() => {
                                            this.eventHub.publish(`on_webrtc_offer_${connectionId}_evt`, JSON.stringify({ "offer": offer, "connectionId": this.conversationUuid + "_" + Application.account._id }), false);
                                        })
                                    })
                                    .catch((err) => {
                                        ApplicationView.displayMessage(err, 3000)
                                    });
                            }
                        });

                    }

                }, true, this)
        }

        if (this.listeners[`leave_conversation_${this.conversationUuid}_evt`] == undefined) {
            this.eventHub.subscribe(`leave_conversation_${this.conversationUuid}_evt`,
                (uuid) => {
                    // todo remove listeners...
                    this.listeners[`leave_conversation_${this.conversationUuid}_evt`] = uuid
                },
                (evt_) => {
                    // Remove the participant.
                    let evt = JSON.parse(evt_)

                    // Close the connection with the client
                    if (evt.participant == Application.account._id) {
                        // Here I will close all conversation connections.
                        for (let connectionId in this.connections) {
                            if (connectionId.startsWith(this.conversationUuid)) {
                                this.closeConnection(connectionId)
                            }
                        }

                    } else {
                        let connectionId = this.conversationUuid + "_" + evt.participant
                        if (this.connections[connectionId] != null) {
                            this.closeConnection(connectionId)
                        }
                    }
                },
                false, this);
        }

        // When we receive peer connection offer...
        if (this.listeners[`on_webrtc_offer_${this.conversationUuid + "_" + Application.account._id}_evt`] == undefined) {
            this.eventHub.subscribe(`on_webrtc_offer_${this.conversationUuid + "_" + Application.account._id}_evt`,
                (uuid) => {
                    this.listeners[`on_webrtc_offer_${this.conversationUuid + "_" + Application.account._id}_evt`] = uuid
                }, (evt) => {

                    let event = JSON.parse(evt)
                    let connectionId = event.connectionId

                    // Get the connections.
                    this.getConnection(connectionId, rtcPeerConnection => {
                        //let offer = new RTCSessionDescription(event.offer)
                        rtcPeerConnection.setRemoteDescription(event.offer).then(() => {
                            // Append pending ice candidate.
                            while (this.pendingCanditates.length > 0) {
                                rtcPeerConnection.addIceCandidate(this.pendingCanditates.pop()).catch(e => {
                                    console.error(e)
                                });
                            }
                            // create the answer.
                            rtcPeerConnection
                                .createAnswer()
                                .then(answer => {
                                    rtcPeerConnection.setLocalDescription(answer).then(() => {
                                        this.eventHub.publish(`on_webrtc_answer_${connectionId}_evt`, JSON.stringify({ "answer": answer, "connectionId": this.conversationUuid + "_" + Application.account._id }), false);
                                    })
                                })
                                .catch((err) => {
                                    ApplicationView.displayMessage(err, 3000)
                                });

                        }, err => {
                            ApplicationView.displayMessage(err, 3000)
                        })
                    })

                }, false, this)
        }

        // When we receive peers connection answer...
        if (this.listeners[`on_webrtc_answer_${this.conversationUuid + "_" + Application.account._id}_evt`] == undefined) {
            this.eventHub.subscribe(`on_webrtc_answer_${this.conversationUuid + "_" + Application.account._id}_evt`,
                (uuid) => {
                    this.listeners[`on_webrtc_answer_${this.conversationUuid + "_" + Application.account._id}_evt`] = uuid
                }, (evt) => {
                    let event = JSON.parse(evt)
                    let rtcPeerConnection = this.connections[event.connectionId]
                    //let answer = new RTCSessionDescription(event.answer)
                    rtcPeerConnection.setRemoteDescription(event.answer);

                }, false, this)
        }

        // When we receive a ace candidate answer
        if (this.listeners[`on_webrtc_candidate_${this.conversationUuid + "_" + Application.account._id}_evt`] == undefined) {
            this.eventHub.subscribe(`on_webrtc_candidate_${this.conversationUuid + "_" + Application.account._id}_evt`,
                (uuid) => {
                    this.listeners[`on_webrtc_candidate_${this.conversationUuid + "_" + Application.account._id}_evt`] = uuid
                }, (event) => {
                    let evt = JSON.parse(event)
                    this.getConnection(evt.connectionId, rtcPeerConnection => {
                        let icecandidate = new RTCIceCandidate(evt.candidate);
                        if (rtcPeerConnection.remoteDescription) {
                            rtcPeerConnection.addIceCandidate(icecandidate);
                        } else {
                            this.pendingCanditates.push(icecandidate)
                        }
                    })
                }, false, this)
        }

    }

    closeConnection(connectionId) {

        let peerVideo = this.peersVideo.querySelector("#_" + connectionId + "_video")
        if (peerVideo != undefined) {
            this.peersVideo.removeChild(peerVideo)
        }

        // Get the local video display...
        let localVideo = this.shadowRoot.querySelector("#local-video")

        if (localVideo != null) {
            // now get the steam 
            let stream = localVideo.srcObject;
            // now get all tracks
            let tracks = stream.getTracks();
            // now close each track by having forEach loop
            tracks.forEach((track) => {
                // stopping every track
                track.stop();
            });
            // assign null to srcObject of video
            localVideo.srcObject = null;
            localVideo.parentNode.removeChild(localVideo)
        }

        this.connections[connectionId].close()
        delete this.connections[connectionId]

        if (Object.keys(this.connections).length == 0) {
            this.startShareScreenBtn.style.display = "none"
            this.parentNode.removeChild(this)
        }

        this.eventHub.publish(`video_conversation_close_${connectionId}_evt`, {}, false);

        if (this.conversationUuid != connectionId)
            this.eventHub.publish(`video_conversation_close_${this.conversationUuid}_evt`, {}, false);
    }

    // init a new peer connections.
    getConnection(connectionId, callback, onconnected) {

        // Get existing
        let rtcPeerConnection = this.connections[connectionId]
        if (rtcPeerConnection == null) {
            rtcPeerConnection = new RTCPeerConnection(connectionConfig);
            this.connections[connectionId] = rtcPeerConnection;
        } else {
            callback(rtcPeerConnection)
            //  connection already exist...
            return
        }

        // when video is received from the remote side.
        rtcPeerConnection.ontrack = evt => {
            this.initRemoteVideoStream(connectionId, evt)
        }

        this.initLocalVideoStream(stream => {
            // keep a ref for further use...
            this.localStream = stream;

            rtcPeerConnection.onicecandidate = (evt) => {
                if (evt.candidate) {
                    this.eventHub.publish(`on_webrtc_candidate_${connectionId}_evt`, JSON.stringify({ "candidate": evt.candidate.toJSON(), "connectionId": this.conversationUuid + "_" + Application.account._id }), false);
                }
            }

            // Add audio track and video track.
            stream.getTracks().forEach((track) => {
                rtcPeerConnection.addTrack(track, stream);
            });


            // connections state handler.
            rtcPeerConnection.oniceconnectionstatechange = (event) => {
                switch (rtcPeerConnection.iceConnectionState) {
                    case "connected":
                        // The connection has become fully connected
                        if (onconnected != undefined) {
                            onconnected(rtcPeerConnection)
                        }

                        this.eventHub.publish(`video_conversation_open_${connectionId}_evt`, {}, false);

                        if (this.conversationUuid + "_" + Application.account._id != connectionId)
                            this.eventHub.publish(`video_conversation_open_${this.conversationUuid + "_" + Application.account._id}_evt`, {}, false);

                        break;
                    case "disconnected":
                    case "failed":
                    case "closed":

                        // The connection has been closed
                        this.closeConnection(connectionId)

                        break;
                }
            }

            // Callback when done...
            if (callback != null) {
                callback(rtcPeerConnection)
            }

        }, err => {
            ApplicationView.displayMessage(err, 3000)
        })
    }

    // Init the local screen capture...
    initScreenCaptureStream(callback, errorCallback) {
        // Get the stream id from the user...
        navigator.mediaDevices.getDisplayMedia({ cursor: true }).then(stream => {
            const screenTrack = stream.getTracks()[0];
            this.startShareScreenBtn.style.display = "none"

            screenTrack.onended = () => {
                callback(this.localStream.getTracks()[1])
                this.startShareScreenBtn.style.display = "block"
            }
            callback(screenTrack)

        }).catch(err => { errorCallback(err) })

    }

    // Initialyse the local video stream object.
    initLocalVideoStream(callback, errorCallback) {

        // First i will retreived the video object.
        let localVideo = this.shadowRoot.getElementById("local-video");

        if (localVideo != undefined) {
            return
        }


        localVideo = document.createElement("video")
        localVideo.id = "local-video"
        this.shadowRoot.querySelector("#local-video-div").appendChild(localVideo)

        // Remove the echo...
        localVideo.muted = true;
        localVideo.volume = 0;

        // Display the share connection button.
        this.startShareScreenBtn.style.display = "block"


        // Connect the user video
        navigator.mediaDevices
            .getUserMedia({
                audio: true,
                video: true,
            })
            /*.then((stream) => {
                
                localVideo.srcObject = stream;
                localVideo.onloadedmetadata = (e) => {
                    localVideo.play();
                    fireResize()
                    callback(stream)
                };

            })*/
            .then(function (stream) {
                if ("srcObject" in localVideo) {
                    localVideo.srcObject = stream;
                } else {
                    localVideo.src = window.URL.createObjectURL(stream);
                }
                localVideo.onloadedmetadata = (e) => {
                    localVideo.play();
                    fireResize()
                    callback(stream)
                };
            })
            .catch((err) => {
                /* handle the error */
                errorCallback(err)
            });
    }

    /**
     * Create the remote video player.
     * @param {*} id Must be the id of the remote user.
     * @param {*} stream The stream given by the web-rtc.
     */
    initRemoteVideoStream(connectionId, e) {
        let remoteVideo = this.peersVideo.querySelector("#_" + connectionId + "_video")
        if (remoteVideo == null) {
            remoteVideo = document.createElement("video")
            remoteVideo.id = "_" + connectionId + "_video"
            remoteVideo.autoplay = true
            remoteVideo.playsinline = true
            this.peersVideo.appendChild(remoteVideo)
            remoteVideo.srcObject = new MediaStream();
        }
        remoteVideo.srcObject.addTrack(e.track);
    }

}

customElements.define('globular-video-conversation', VideoConversation)
