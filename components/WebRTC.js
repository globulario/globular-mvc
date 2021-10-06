import { ConversationServiceClient } from 'globular-web-client/conversation/conversation_grpc_web_pb';
import { Application } from '../Application';
import { ApplicationView } from '../ApplicationView';
import { Model } from '../Model';
import { theme } from "./Theme";

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

/**
 * Video conversation.
 */
export class VideoConversation extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(conversationUuid) {
        super()

        this.conversationUuid = conversationUuid
        this.userStream = null;

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // The connections with other participants.
        this.connections = {};

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${theme}

            #local-video{
                width: 200px; 
                height: 200px;
            }

            .peers-video{
                display: flex;
            }

            peers-video video{
                width: 400px; 
                height: 400px;
            }

        </style>

        <div id="video-chat-room">
            <video id="local-video"></video>
            <div class="peers-video">

            </div>
        </div>
        `

        // Set the connction and it's handler.
        let setConnection = (rtcPeerConnection, connectionId) => {
            this.connections[connectionId] = rtcPeerConnection;

            // connection state change handler.
            rtcPeerConnection.onconnectionstatechange = (event) => {
                switch (rtcPeerConnection.connectionState) {
                    case "connected":
                        // The connection has become fully connected
                        console.log("connection whit " + connectionId + " is now open")
                        break;
                    case "disconnected":
                    case "failed":
                    case "closed":
                        // The connection has been closed
                        console.log("connection " + connectionId + " is closed")
                        delete this.connections[event.connectionId]
                        let peerVideo = this.querySelector("#" + connectionId + "_video")
                        if (peerVideo != undefined) {
                            peerVideo.parentNode.removeChild(peerVideo)
                        }
                        break;
                }
            }
        }

        // When a new participant join the room...
        Model.eventHub.subscribe(`start_video_conversation_${conversationUuid}_evt`,
            (uuid) => {

            },
            (participant) => {

                // Create offer to each participants
                if (participant != Application.account.id) {
                    this.initLocalVideoStream(stream => {
                        let rtcPeerConnection = new RTCPeerConnection(connectionConfig);
                        let connectionId = this.conversationUuid + "_" + participant

                        // when video is received from the remote side.
                        rtcPeerConnection.ontrack = evt => {
                            console.log("remote track received!", connectionId)
                            this.initRemoteVideoStream(connectionId, evt)
                        }

                        rtcPeerConnection.onicecandidate = (candidate) => {
                            console.log("Candidate ", candidate);
                            if (candidate) {
                                Model.eventHub.publish(`on_webrtc_candidate_${connectionId}_evt`, JSON.stringify(candidate), false);
                            }
                        }

                        // Add audio track and video track.
                        stream.getTracks().forEach(function (track) {
                            rtcPeerConnection.addTrack(track, stream);
                        });


                        // Set the connection.
                        rtcPeerConnection
                            .createOffer()
                            .then((offer) => {
                                rtcPeerConnection.setLocalDescription(offer).then(() => {
                                    setConnection(rtcPeerConnection, connectionId)
                                    Model.eventHub.publish(`on_webrtc_offer_${connectionId}_evt`, JSON.stringify({ "offer": offer, "connectionId": this.conversationUuid + "_" + Application.account.id }), false);
                                });

                            })
                            .catch((err) => {
                                ApplicationView.displayMessage(err, 3000)
                            });
                    }, err => {
                        ApplicationView.displayMessage(err, 3000)
                    })
                }

            }, true)

        Model.eventHub.subscribe(`leave_conversation_${conversationUuid}_evt`,
            (uuid) => {
                // todo remove listeners...
            },
            (evt_) => {
                // Remove the participant.
                let evt = JSON.parse(evt_)

                // Close the connection with the client
                if (evt.participant == Application.account.Id) {
                    // Here I will close all conversation connections.
                    for (let connectionId in this.connections) {
                        if (connectionId.startsWith(conversationUuid)) {
                            this.connections[connectionId].close()
                        }
                    }
                } else {
                    let connectionId = this.conversationUuid + "_" + evt.participant;
                    if (this.connections[connectionId]) {
                        this.connections[connectionId].close()
                        // I will also remove the video element.
                        let peerVideo = this.querySelector("#_" + connectionId + "_video")
                        if (peerVideo != undefined) {
                            peerVideo.parentNode.removeChild(peerVideo)
                        }
                    }
                }
            },
            false);

        // When we receive peer connection offer...
        Model.eventHub.subscribe(`on_webrtc_offer_${conversationUuid + "_" + Application.account.id}_evt`, (uuid) => { }, (evt) => {
            let event = JSON.parse(evt)
            this.initLocalVideoStream(stream => {
                let connectionId = event.connectionId
                let offer = new RTCSessionDescription(event.offer)

                // Init the new connection
                let rtcPeerConnection = new RTCPeerConnection(connectionConfig);
                rtcPeerConnection.onicecandidate = (candidate) => {
                    console.log("Candidate ", candidate);
                    if (candidate) {
                        Model.eventHub.publish(`on_webrtc_candidate_${connectionId}_evt`, JSON.stringify(candidate), false);
                    }
                }

                rtcPeerConnection.ontrack = evt => {
                    console.log("remote track received!", connectionId)
                    this.initRemoteVideoStream(connectionId, evt)
                }

                // Add the track to the webrtc connection.
                stream.getTracks().forEach(function (track) {
                    rtcPeerConnection.addTrack(track, stream);
                });

                rtcPeerConnection.setRemoteDescription(offer).then(() => {
                    // create the answer.
                    rtcPeerConnection
                        .createAnswer()
                        .then(answer => {
                            rtcPeerConnection.setLocalDescription(answer).then(() => {
                                setConnection(rtcPeerConnection, connectionId)
                                Model.eventHub.publish(`on_webrtc_answer_${connectionId}_evt`, JSON.stringify({ "answer": answer, "connectionId": this.conversationUuid + "_" + Application.account.id }), false);
                            });

                        })
                        .catch((err) => {
                            ApplicationView.displayMessage(err, 3000)
                        });
                });




            }, err => {
                ApplicationView.displayMessage(err, 3000)
            })
        }, false)

        // When we receive peers connection answer...
        Model.eventHub.subscribe(`on_webrtc_answer_${conversationUuid + "_" + Application.account.id}_evt`, (uuid) => { }, (evt) => {
            let event = JSON.parse(evt)
            let rtcPeerConnection = this.connections[event.connectionId]
            let answer = new RTCSessionDescription(event.answer)
            rtcPeerConnection.setRemoteDescription(answer);

        }, false)

        // When we receive a ace candidate answer
        Model.eventHub.subscribe(`on_webrtc_candidate_${conversationUuid + "_" + Application.account.id}_evt`, (uuid) => { }, (event) => {
            let icecandidate = new RTCIceCandidate(JSON.parse(event));
            rtcPeerConnection.addIceCandidate(icecandidate);
        }, false)

    }

    // Initialyse the local video stream object.
    initLocalVideoStream(callback, errorCallback) {

        // First i will retreived the video object.
        let videoElement = this.shadowRoot.getElementById("local-video");
        if (videoElement != undefined) {

            // Remove the echo...
            videoElement.muted = true;
            videoElement.volume = 0;

            if (videoElement.srcObject != undefined) {
                callback(videoElement.srcObject)
                return;
            }
        }

        // Connect the user video
        navigator.mediaDevices
            .getUserMedia({
                audio: {},
                video: {},
            })
            .then((stream) => {
                /* use the stream */
                videoElement.srcObject = stream;
                videoElement.onloadedmetadata = (e) => {
                    videoElement.play();
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
    initRemoteVideoStream(id, e) {
        /*
        let peersVideo = this.shadowRoot.querySelector(".peers-video")
        let peerVideo = peersVideo.querySelector("#_" + id + "_video")
        if (peerVideo == undefined) {
            peerVideo = document.createElement("video")
            peerVideo.id = "_" + id + "_video"
            peerVideo.autoplay = true;
            peerVideo.muted = true;
            peersVideo.appendChild(peerVideo)

            console.log("remote peer video created")
            peerVideo.srcObject = new MediaStream();
        }

        // set tracks.
        peerVideo.srcObject.addTrack(event.track, peerVideo.srcObject);
        */
        if (e.streams[0].getVideoTracks().length > 0) {

            if (e.streams && e.streams[0]) {
                if (e.transceiver.mid == screenTransceiver.mid) {
                    displayStream.addTrack(e.track);
                } else if (e.transceiver.mid == camTransceiver.mid) {
                    remoteVideo.srcObject = e.streams[0];
                }
            } else {
                if (!inboundStream) {
                    inboundStream = new MediaStream();
                    remoteVideo.srcObject = inboundStream;
                }
                inboundStream.addTrack(e.track);
            }
        } else {
            console.log(e)
            document.getElementById('audioOnly').srcObject = e.streams[0];
            document.getElementById('audioOnly').play();
        }
    }

}

customElements.define('globular-video-conversation', VideoConversation)
