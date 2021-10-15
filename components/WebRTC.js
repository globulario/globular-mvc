
import { AppLayoutBehavior } from '@polymer/app-layout/app-layout-behavior/app-layout-behavior';
import { LogInfo, LogRqst } from 'globular-web-client/log/log_pb';
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

const offerOptions = {
    offerToReceiveAudio: 1,
    offerToReceiveVideo: 1
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
        this.pendingCanditates = [];

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
            <div id="local-video-div">
            </div>
            <div class="peers-video">
            </div>
        </div>
        `

        this.peersVideo = this.shadowRoot.querySelector(".peers-video")

        // Start a new video conversation with a remote participant
        Model.eventHub.subscribe(`start_video_conversation_${conversationUuid}_evt`,
            (uuid) => {

            },
            (participant) => {

                // Create offer to each participants
                if (participant != Application.account._id) {

                    let connectionId = this.conversationUuid + "_" + participant

                    // That will set the on iceconnection ready callback to create offer.
                    this.getConnection(connectionId, rtcPeerConnection => {
                        rtcPeerConnection.onnegotiationneeded = () => {
                            // Set the connection.
                            rtcPeerConnection
                                .createOffer(offerOptions)
                                .then((offer) => {
                                    rtcPeerConnection.setLocalDescription(offer).then(() => {
                                        Model.eventHub.publish(`on_webrtc_offer_${connectionId}_evt`, JSON.stringify({ "offer": offer, "connectionId": this.conversationUuid + "_" + Application.account._id }), false);
                                    })
                                })
                                .catch((err) => {
                                    ApplicationView.displayMessage(err, 3000)
                                });
                        }
                    });

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
                if (evt.participant == Application.account._id) {
                    // Here I will close all conversation connections.
                    for (let connectionId in this.connections) {
                        if (connectionId.startsWith(conversationUuid)) {
                            this.closeConnection(connectionId)
                        }
                    }
                }else{
                    let connectionId =  this.conversationUuid + "_" + evt.participant
                    if(this.connections[connectionId]!=null){
                        this.closeConnection(connectionId)
                    }
                }
            },
            false);

        // When we receive peer connection offer...
        Model.eventHub.subscribe(`on_webrtc_offer_${conversationUuid + "_" + Application.account._id}_evt`, (uuid) => { }, (evt) => {

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
                                Model.eventHub.publish(`on_webrtc_answer_${connectionId}_evt`, JSON.stringify({ "answer": answer, "connectionId": this.conversationUuid + "_" + Application.account._id }), false);
                            })
                        })
                        .catch((err) => {
                            ApplicationView.displayMessage(err, 3000)
                        });

                }, err => {
                    ApplicationView.displayMessage(err, 3000)
                })
            })

        }, false)

        // When we receive peers connection answer...
        Model.eventHub.subscribe(`on_webrtc_answer_${conversationUuid + "_" + Application.account._id}_evt`, (uuid) => { }, (evt) => {
            let event = JSON.parse(evt)
            let rtcPeerConnection = this.connections[event.connectionId]
            let answer = new RTCSessionDescription(event.answer)
            rtcPeerConnection.setRemoteDescription(answer);

        }, false)

        // When we receive a ace candidate answer
        Model.eventHub.subscribe(`on_webrtc_candidate_${conversationUuid + "_" + Application.account._id}_evt`, (uuid) => { }, (event) => {
            let evt = JSON.parse(event)
            this.getConnection(evt.connectionId, rtcPeerConnection => {
                let icecandidate = new RTCIceCandidate(evt.candidate);
                if (rtcPeerConnection.remoteDescription) {
                    rtcPeerConnection.addIceCandidate(icecandidate);
                } else {
                    this.pendingCanditates.push(icecandidate)
                }
            })
        }, false)

    }

    closeConnection(connectionId){
        
        let peerVideo = this.peersVideo.querySelector("#_" + connectionId + "_video")
        console.log("----------> close connection event! ", peerVideo)

        if(peerVideo == undefined){
            return
        }

        this.peersVideo.removeChild(peerVideo)

        
        if (this.peersVideo.children.length == 0) {
            // Get the local video display...
            let localVideo = this.shadowRoot.querySelector("#local-video")
            console.log(localVideo)
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
        }

        this.connections[connectionId].close()
        delete this.connections[connectionId]
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
            // when video is received from the remote side.
            rtcPeerConnection.ontrack = evt => {
                this.initRemoteVideoStream(connectionId, evt)
            }

            rtcPeerConnection.onicecandidate = (evt) => {
                if (evt.candidate) {
                    Model.eventHub.publish(`on_webrtc_candidate_${connectionId}_evt`, JSON.stringify({ "candidate": evt.candidate.toJSON(), "connectionId": this.conversationUuid + "_" + Application.account._id }), false);
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
                        console.log("connected event!")
                        break;
                    case "disconnected":
                    case "failed":
                    case "closed":
                        console.log("close event!")
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
