import { Model } from "../Model";
import { theme } from "./Theme";

// Set WebRTC configuration values
window.RTCPeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
window.RTCSessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;
window.RTCIceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;

navigator.getUserMedia = navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
window.URL = window.webkitURL || window.URL;
window.iceServers = {
    iceServers: [{
            url: 'stun:23.21.150.121'
        }
    ]
};

/**
 *    
 */
export class PeerRTC extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()

        this.isOffer = false

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${theme}
        </style>

        <div>
            <video id="local-video" autoplay controls style="width:40%;"></video>
            <video id="remote-video" autoplay controls style="width:40%;"></video>
        <div>
        `

        // The connection
        this.configuration = { 'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }] }

        // The peer connection.
        this.peerConnection = new RTCPeerConnection(window.iceServers);


        // Listen for connectionstatechange on the local RTCPeerConnection
        this.peerConnection.onconnectionstatechange = (event) => {
            console.log("-------> connection state change ", event)
            if (this.peerConnection.connectionState === 'connected') {
                // Peers connected!
                console.log("connection state change!")
            }
        };

        // Listen for local ICE candidates on the local RTCPeerConnection
        this.peerConnection.onicecandidate = (event) => {
            console.log("-------> ace candidate ",event.candidate)
            if (!event || !event.candidate) return;
            
                this.send({ 'new-ice-candidate': event.candidate });
            
        };

        // Get the video element...
        this.localVideo = this.shadowRoot.getElementById('local-video');
        this.remoteVideo = this.shadowRoot.getElementById('remote-video');

        // Display the local video
        this.getUserMedia((localStream) => {
            // Here is an example how to create an offer.
            localStream.getTracks().forEach(track => {
                this.peerConnection.addTrack(track, localStream);
            });

            // display the stream into the local video.
            this.localVideo.srcObject = localStream
        })

        // Here I will use the event service for signaling web-rtc
        Model.eventHub.subscribe("signaling_message_evt", (uuid)=>{
            /** On subscribe event */
        },(message)=>{
            // Send message.
            this.onMessage(message)
        }, false)

    }

    // Display the local 

    // Return the user media stream.
    getUserMedia(callback) {
        navigator.getUserMedia({
            audio: true,
            video: true
        }, callback, onerror);

        function onerror(e) {
            console.error(e);
        }
    }

    /**
     * Create offer message.
     */
    async makeCall() {
        this.isOffer = true
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        this.send({ 'offer': offer });
    }

    /**
     * Send a signaling message.
     * @param {*} message 
     */
    send(message) {
       Model.eventHub.publish("signaling_message_evt", JSON.stringify(message), false);
    }

    // The signaling message handler...
    async onMessage(message) {
        
        let msg = JSON.parse(message)

        if (msg.answer && this.isOffer) {
            const remoteDesc = new RTCSessionDescription(msg.answer);
            await this.peerConnection.setRemoteDescription(remoteDesc);

        } else if (msg.offer && !this.isOffer) {

            this.peerConnection.setRemoteDescription(new RTCSessionDescription(msg.offer));
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);
            this.send({ 'answer': answer });

        } else if (msg.iceCandidate) {
            try {
                await this.peerConnection.addIceCandidate(msg.iceCandidate);
            } catch (e) {
                console.error('Error adding received ice candidate', e);
            }
        }
    }

}

customElements.define('globular-peer-rtc', PeerRTC)