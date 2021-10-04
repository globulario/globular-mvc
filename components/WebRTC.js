import { Application } from '../Application';
import { ApplicationView } from '../ApplicationView';
import { Model } from '../Model';
import { theme } from "./Theme";

// Contains the stun server URL we will be using.
let iceServers = {
    iceServers: [
        { urls: "stun:stun.services.mozilla.com" },
        { urls: "stun:stun.l.google.com:19302" },
    ],
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

        </style>

        <div id="video-chat-room">
            <video id="local-video"></video>
            <div class="peers-video">

            </div>
        </div>
        `

        // When a new participant join the room...
        Model.eventHub.subscribe(`ready_conversation_${conversationUuid}_evt`, (uuid) => { }, (event) => {
            this.onReady(JSON.parse(event))
        }, false)

        // When we receive peer connection offer...
        Model.eventHub.subscribe(`on_webrtc_offer_${conversationUuid + "_" + Application.account.id}_evt`, (uuid) => { }, (event) => {
            this.onOffer(JSON.parse(event))
        }, false)

        // When we receive peer connection answer...
        Model.eventHub.subscribe(`on_webrtc_answer_${conversationUuid + "_" + Application.account.id}_evt`, (uuid) => { }, (event) => {
            this.onAnwser(JSON.parse(event))
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
            videoElement.muted= true;
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
    initRemoteVideoStream(id, stream){
        let peersVideo = this.shadowRoot.querySelector(".peersVideo")
        let peerVideo = peerVideo.querySelector(id + "_video")
        if(peerVideo == undefined){
            peerVideo = document.createElement("video")
            peerVideo.id = id + "_video"
            peersVideo.appendChild(peerVideo)
        }

        peerVideo.srcObject = stream;
        peerVideo.onloadedmetadata = function (e) {
          peerVideo.play();
        };
    }

    // Event received when a user join a conversation.
    onReady(event) {
        if (event.participant == Application.account.id) {
            // Create offer to each participants
            event.participants.forEach(participant => {
                if (participant != Application.account.id) {
                    this.initLocalVideoStream( stream => {
                        let rtcPeerConnection = new RTCPeerConnection(iceServers);
                        rtcPeerConnection.onicecandidate = (candidate) => {
                            console.log("Candidate ", candidate);
                            if (candidate) {
                                Model.eventHub.publish(`on_webrtc_candidate_${this.conversationUuid + "_" + participant}_evt`, JSON.stringify(candidate), false);
                            }
                        }

                        rtcPeerConnection.ontrack = evt => {
                            this.initRemoteVideoStream(participant, evt.streams[0])
                        }

                        // Add audio track and video track.
                        rtcPeerConnection.addTrack(stream.getTracks()[0], stream);
                        rtcPeerConnection.addTrack(stream.getTracks()[1], stream);

                        // Set the connection.
                        rtcPeerConnection
                            .createOffer()
                            .then((offer) => {
                                rtcPeerConnection.setLocalDescription(offer);
                                this.connections[this.conversationUuid + "_" + participant] = rtcPeerConnection;
                                Model.eventHub.publish(`on_webrtc_offer_${this.conversationUuid + "_" + participant}_evt`, JSON.stringify({ "offer": offer, "id": this.conversationUuid + "_" + participant }), false);
                            })
                            .catch((err) => {
                                ApplicationView.displayMessage(err, 3000)
                            });
                    }, err => {
                        ApplicationView.displayMessage(err, 3000)
                    })

                }
            });
        }
    }

    onOffer(event) {
        console.log("on offer", event)

        initLocalVideoStream(stream => {
            // Init the new connection
            let rtcPeerConnection = new RTCPeerConnection(iceServers);
            rtcPeerConnection.onicecandidate = (candidate) => {
                console.log("Candidate ", candidate);
                if (candidate) {
                    Model.eventHub.publish(`on_webrtc_candidate_${this.conversationUuid + "_" + event.participant}_evt`, JSON.stringify(candidate), false);
                }
            }

            let offer = new RTCSessionDescription(event.offer)
            rtcPeerConnection.ontrack = evt => {
                this.initRemoteVideoStream(event.participant, evt.streams[0])
            }

            // Add the track to the webrtc connection.
            rtcPeerConnection.addTrack(stream.getTracks()[0], stream);
            rtcPeerConnection.addTrack(stream.getTracks()[1], stream);
            rtcPeerConnection.setRemoteDescription(offer);

            // create the answer.
            rtcPeerConnection
                .createAnswer()
                .then(answer => {
                    rtcPeerConnection.setLocalDescription(answer);
                    this.connections[this.conversationUuid + "_" + event.participant] = rtcPeerConnection;
                    Model.eventHub.publish(`on_webrtc_answer_${this.conversationUuid + "_" + event.participant}_evt`, JSON.stringify({ "answer": answer, "connectionId": this.conversationUuid + "_" + Application.account.id }), false);
                })
                .catch((err) => {
                    ApplicationView.displayMessage(err, 3000)
                });
        }, err => {
            ApplicationView.displayMessage(err, 3000)
        })

    }

    // Set the remote descriptor
    onAnwser(event) {
        console.log("on answer", event)
        let rtcPeerConnection = this.connections[event.connectionId]
        let answer = new RTCSessionDescription(event.answer)
        rtcPeerConnection.setRemoteDescription(answer);
    }


}

customElements.define('globular-video-conversation', VideoConversation)
