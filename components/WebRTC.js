import { theme } from "./Theme";

// Set WebRTC configuration values
window.RTCPeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
window.RTCSessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;
window.RTCIceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;

navigator.getUserMedia = navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
window.URL = window.webkitURL || window.URL;

/**
 *    
 */
export class PeerRTC extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
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
        this.peerConnection = new RTCPeerConnection(this.configuration);

        // Listen for connectionstatechange on the local RTCPeerConnection
        this.peerConnection.addEventListener('connectionstatechange', event => {
            if (peerConnection.connectionState === 'connected') {
                // Peers connected!
                console.log("connection state change!")
            }
        });

        // Listen for local ICE candidates on the local RTCPeerConnection
        this.peerConnection.addEventListener('icecandidate', event => {
            if (event.candidate) {
                this.send({ 'new-ice-candidate': event.candidate });
            }
        });

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

    }

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
     * Create offer
     */
    async makeCall() {
        const offer = await peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        this.send({ 'offer': offer });
    }

    send(message) {
        // Implement it.
    }

    // The signaling message handler...
    async onMessage(message) {
        if (message.answer) {
            const remoteDesc = new RTCSessionDescription(message.answer);
            await this.peerConnection.setRemoteDescription(remoteDesc);
        } else if (message.offer) {
            peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));
            const answer = await peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);
            signalingChannel.send({ 'answer': answer });
        } else if (message.iceCandidate) {
            try {
                await this.peerConnection.addIceCandidate(message.iceCandidate);
            } catch (e) {
                console.error('Error adding received ice candidate', e);
            }
        }
    }

}

customElements.define('globular-peer-rtc', PeerRTC)