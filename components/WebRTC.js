import { Application } from '../Application';
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
        </style>

        <div id="video-chat-room">
            <video id="user-video"></video>
            <video id="peer-video"></video>
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
            this.onOffer(JSON.parse(event))
        }, false)

        // Get the video objects...
        this.userVideo = this.shadowRoot.getElementById("user-video");
        this.peerVideo = this.shadowRoot.getElementById("peer-video");

        // Connect the user video
        navigator.mediaDevices
            .getUserMedia({
                audio: true,
                video: { width: 1280, height: 720 },
            })
            .then((stream) => {
                /* use the stream */
                this.userStream = stream;
                this.userVideo.srcObject = stream;
                this.userVideo.onloadedmetadata = (e) => {
                    this.userVideo.play();
                };
            })
            .catch(function (err) {
                /* handle the error */
                alert("Couldn't Access User Media");
            });
    }

    // Event received when a user join a conversation.
    onReady(event) {
        console.log("on ready", event)
        if (event.participant == Application.account.id) {
            // Create offer to each participants
            event.participants.forEach(participant => {
                if (participant != Application.account.id) {
                    let rtcPeerConnection = new RTCPeerConnection(iceServers);
                    rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
                    rtcPeerConnection.ontrack = OnTrackFunction;
                    rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
                    rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
                    rtcPeerConnection
                        .createOffer()
                        .then((offer) => {
                            rtcPeerConnection.setLocalDescription(offer);
                            this.connections[this.conversationUuid + "_" + participant] = rtcPeerConnection;
                            Model.eventHub.publish(`on_webrtc_offer_${this.conversationUuid + "_" + participant}_evt`, JSON.stringify({ "offer": offer, "id": this.conversationUuid + "_" + participant }), false);
                        })
                        .catch((error) => {
                            console.log(error);
                        });
                }
            });
        }
    }

    onOffer(event) {
        console.log("on offer", event)
        if (event.participant != Application.account.id) {
            let rtcPeerConnection = new RTCPeerConnection(iceServers);
            rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
            rtcPeerConnection.ontrack = OnTrackFunction;
            rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
            rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
            rtcPeerConnection.setRemoteDescription(offer);
            rtcPeerConnection
                .createAnswer()
                .then((answer) => {
                    rtcPeerConnection.setLocalDescription(answer);
                    this.connections[this.conversationUuid + "_" + event.participant] = rtcPeerConnection;
                    Model.eventHub.publish(`on_webrtc_answer_${this.conversationUuid + "_" + participant}_evt`, JSON.stringify({ "answer": answer, "id": this.conversationUuid + "_" + Application.account.id }), false);
                })
                .catch((error) => {
                    console.log(error);
                });
        }
    }

    onAnwser(event) {
        console.log("on answer", event)
        let rtcPeerConnection = this.connections[this.conversationUuid + "_" + event.participant]
        rtcPeerConnection.setRemoteDescription(event.answer);
    }

    OnIceCandidateFunction(event) {
        console.log("Candidate");
        if (event.candidate) {
            Model.eventHub.publish(`on_webrtc_candidate_${this.conversationUuid}_evt`, JSON.stringify(candidate), false);
        }
    }

    OnTrackFunction(event) {
        this.peerVideo.srcObject = event.streams[0];
        this.peerVideo.onloadedmetadata = (e) => {
            this.peerVideo.play();
        };
    }
}

customElements.define('globular-video-conversation', VideoConversation)
