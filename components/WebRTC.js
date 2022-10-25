
import { AppLayoutBehavior } from '@polymer/app-layout/app-layout-behavior/app-layout-behavior';
import { LogInfo, LogRqst } from 'globular-web-client/log/log_pb';
import { Application } from '../Application';
import { applicationView, ApplicationView } from '../ApplicationView';
import { Model } from '../Model';
import { getTheme } from "./Theme";
import { setMoveable } from './moveable'
import { setResizeable } from './rezieable'

import '@polymer/iron-icons/communication-icons'

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

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // The connections with other participants.
        this.connections = {};

        let hideheader = this.getAttribute("hideheader") != undefined

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${getTheme()}
            #container{
                width: 720px;
                position: fixed;
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

        </style>
        <paper-card id="container" class="no-select">
            <div class="header" style="${hideheader ? "display:none;" : ""}">
                <paper-icon-button id="video-close-btn" icon="icons:close" style="min-width: 40px; --iron-icon-fill-color: var(--palette-text-accent);"></paper-icon-button>
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
            this.eventHub.publish(`leave_conversation_${conversationUuid}_evt`, JSON.stringify({ "participants": [], "participant": Application.account.id }), false)
        }

        let offsetTop = this.shadowRoot.querySelector(".header").offsetHeight
        if (offsetTop == 0) {
            offsetTop = 60
        }
        container.style.top = offsetTop + "px"
        this.peersVideo = this.shadowRoot.querySelector(".peers-video")
        this.startShareScreenBtn = this.shadowRoot.querySelector("#start-share-screen")

        container.resizeHeightDiv.style.display = "none"

        container.name = "webrtc_window"

        setResizeable(container, (width, height) => {
            localStorage.setItem("__webrtc_panel_position__", JSON.stringify({ width: width, height: height }))
            container.style.height = "auto"
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
        Model.eventHub.subscribe(`start_video_conversation_${this.conversationUuid}_evt`,
            (uuid) => {

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

        this.eventHub.subscribe(`leave_conversation_${this.conversationUuid}_evt`,
            (uuid) => {
                // todo remove listeners...
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

        // When we receive peer connection offer...
        this.eventHub.subscribe(`on_webrtc_offer_${this.conversationUuid + "_" + Application.account._id}_evt`, (uuid) => { }, (evt) => {

            let event = JSON.parse(evt)
            let connectionId = event.connectionId

            // Get the connections.
            this.getConnection(connectionId, rtcPeerConnection => {
                let offer = new RTCSessionDescription(event.offer)
                rtcPeerConnection.setRemoteDescription(offer).then(() => {
                    // Append pending ice candidate.
                    while (this.pendingCanditates.length > 0) {
                        rtcPeerConnection.addIceCandidate(this.pendingCanditates.pop())
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

        // When we receive peers connection answer...
        this.eventHub.subscribe(`on_webrtc_answer_${this.conversationUuid + "_" + Application.account._id}_evt`, (uuid) => { }, (evt) => {
            let event = JSON.parse(evt)
            let rtcPeerConnection = this.connections[event.connectionId]
            let answer = new RTCSessionDescription(event.answer)
            rtcPeerConnection.setRemoteDescription(answer);

        }, false, this)

        // When we receive a ace candidate answer
        this.eventHub.subscribe(`on_webrtc_candidate_${this.conversationUuid + "_" + Application.account._id}_evt`, (uuid) => { }, (event) => {
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

    closeConnection(connectionId) {

        let peerVideo = this.peersVideo.querySelector("#_" + connectionId + "_video")
        if (peerVideo == undefined) {
            return
        }

        this.peersVideo.removeChild(peerVideo)


        // Get the local video display...
        let localVideo = this.shadowRoot.querySelector("#local-video")

        if (localVideo != null) {
            // now get the steam 
            let stream = localVideo.srcObject;
            // now get all tracks
            let tracks = stream.getTracks();
            // now close each track by having forEach loop
            tracks.forEach(function (track) {
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
        this.eventHub.publish(`video_conversation_close_${this.conversationUuid + "_" + Application.account._id}_evt`, {}, false);
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

        this.initLocalVideoStream(stream => {
            // keep a ref for further use...
            this.localStream = stream;

            // when video is received from the remote side.
            rtcPeerConnection.ontrack = evt => {
                this.initRemoteVideoStream(connectionId, evt)
            }

            rtcPeerConnection.onicecandidate = (evt) => {
                if (evt.candidate) {
                    this.eventHub.publish(`on_webrtc_candidate_${connectionId}_evt`, JSON.stringify({ "candidate": evt.candidate.toJSON(), "connectionId": this.conversationUuid + "_" + Application.account._id }), false);
                }
            }

            // Add audio track and video track.
            stream.getTracks().forEach(function (track) {
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
            .then((stream) => {
                /* use the stream */
                localVideo.srcObject = stream;
                localVideo.onloadedmetadata = (e) => {
                    localVideo.play();
                    callback(stream)
                };
            })
            .catch(function (err) {
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
