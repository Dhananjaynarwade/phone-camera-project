import {
  Component,
  ElementRef,
  ViewChild
} from '@angular/core';

import { CommonModule } from '@angular/common';
import QRCode from 'qrcode';
import { BrowserQRCodeReader } from '@zxing/browser';
@Component({
  selector: 'app-webrtc',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './webrtc.html',
  styleUrl: './webrtc.css'
})
export class Webrtc {
  // =====================================================
// QR SCANNER
// =====================================================

qrScanner = new BrowserQRCodeReader();

scanningQR = false;

@ViewChild('qrVideo')
qrVideo!: ElementRef<HTMLVideoElement>;
// =====================================================
// START QR SCANNER
// =====================================================

// =====================================================
// START QR SCANNER
// =====================================================

async startQRScanner(): Promise<void> {

  console.log('📱 SCAN QR BUTTON CLICKED');

  // QR scanner is for Phone
  if (this.role !== 'sender') {

    this.status =
      'Select Phone before scanning QR';

    return;
  }

  this.scanningQR = true;

  this.status =
    'Opening QR scanner...';

  // Wait for Angular to create <video #qrVideo>
  setTimeout(async () => {

    try {

      if (!this.qrVideo) {

        console.error(
          '❌ QR video element not found'
        );

        this.status =
          'QR scanner video not ready';

        this.scanningQR = false;

        return;
      }

      console.log(
        'QR video element found'
      );

      // Get available cameras
      const devices =
        await BrowserQRCodeReader
          .listVideoInputDevices();

      console.log(
        'Available cameras:',
        devices
      );

      if (
        !devices ||
        devices.length === 0
      ) {

        this.status =
          'No camera found';

        this.scanningQR = false;

        return;
      }

      // Prefer last camera
      // Usually phone rear camera
      const deviceId =
        devices[devices.length - 1]
          .deviceId;

      console.log(
        'Using camera:',
        deviceId
      );

      this.status =
        'Camera opened - Scan laptop QR';

      await this.qrScanner
        .decodeFromVideoDevice(

          deviceId,

          this.qrVideo.nativeElement,

          (result, error) => {

            if (result) {

              console.log(
                '✅ QR CODE FOUND'
              );

              console.log(
                result.getText()
              );

              this.handleQRCode(
                result.getText()
              );

              this.stopQRScanner();

            }

          }

        );

    }

    catch (error) {

      console.error(
        '❌ QR SCANNER ERROR:',
        error
      );

      this.status =
        'Could not open camera';

      this.scanningQR = false;

    }

  }, 300);

}
// =====================================================
// HANDLE QR CODE
// =====================================================

handleQRCode(
  qrText: string
): void {

  console.log(
    'QR data:',
    qrText
  );

  try {

    const data =
      JSON.parse(qrText);

    if (
      data.type !==
      'phone-camera-pair'
    ) {

      this.status =
        'Invalid QR code';

      return;

    }

    this.pairingId =
      data.pairingId;

    console.log(
      '🔗 Pairing ID:',
      this.pairingId
    );

    this.status =
      'QR scanned - Pairing...';

    // Send pairing information to Django

    this.sendSignal({

      type: 'pair',

      pairingId:
        this.pairingId

    });

  }

  catch (error) {

    console.error(
      'Invalid QR:',
      error
    );

    this.status =
      'Invalid QR code';

  }

}// =====================================================
// STOP QR SCANNER
// =====================================================
// =====================================================
// STOP QR SCANNER
// =====================================================

stopQRScanner(): void {

  console.log(
    '🛑 Stopping QR scanner'
  );

  this.scanningQR = false;

  if (this.qrVideo) {

    const video =
      this.qrVideo.nativeElement;

    const stream =
      video.srcObject as MediaStream | null;

    if (stream) {

      stream
        .getTracks()
        .forEach(track => {

          track.stop();

        });

    }

    video.srcObject = null;

  }

  this.status =
    'QR scanner stopped';

}

  // =====================================================
  // VIDEO ELEMENTS
  // =====================================================

  @ViewChild('localVideo')
  localVideo!: ElementRef<HTMLVideoElement>;

  @ViewChild('remoteVideo')
  remoteVideo!: ElementRef<HTMLVideoElement>;


  // =====================================================
  // CAMERA
  // =====================================================

  localStream: MediaStream | null = null;


  // =====================================================
  // WEBRTC
  // =====================================================

  peerConnection: RTCPeerConnection | null = null;


  // =====================================================
  // WEBSOCKET
  // =====================================================

  socket: WebSocket | null = null;


  // =====================================================
  // STATUS
  // =====================================================

  status = 'Not connected';


  // =====================================================
  // ROLE
  // =====================================================

  // sender   = Phone
  // receiver = Laptop

  role: 'sender' | 'receiver' | '' = '';


  // =====================================================
  // ICE
  // =====================================================

  private pendingIceCandidates: RTCIceCandidateInit[] = [];


  // =====================================================
  // QR / PAIRING
  // =====================================================

  pairingId = '';

  qrCodeData = '';


  // =====================================================
  // SET ROLE
  // =====================================================

  setRole(
    selectedRole: 'sender' | 'receiver'
  ): void {

    this.role = selectedRole;

    console.log('Role:', selectedRole);

    if (selectedRole === 'sender') {

      this.status = 'Phone selected';

    } else {

      this.status = 'Laptop selected';

    }

  }


  // =====================================================
  // WEBSOCKET
  // =====================================================

  connectWebSocket(): void {

    if (this.role === '') {

      this.status =
        'Please select Phone or Laptop first';

      return;
    }


    if (
      this.socket &&
      this.socket.readyState === WebSocket.OPEN
    ) {

      this.status =
        'WebSocket already connected';

      return;
    }


    this.status =
      'Connecting WebSocket...';


    /*
     * IMPORTANT:
     *
     * Angular is running on HTTPS.
     *
     * Therefore WebSocket should use WSS.
     *
     * But your Django development server may currently
     * only support WS.
     *
     * For now we use ws:// because your current
     * Django/Daphne setup is working with it.
     */

    const socket =
      new WebSocket(
        'ws://192.168.0.116:8000/ws/signaling/'
      );


    this.socket = socket;


    // =================================================
    // OPEN
    // =================================================

    socket.onopen = () => {

      console.log(
        'WebSocket connected'
      );

      this.status =
        'WebSocket Connected';


      socket.send(

        JSON.stringify({

          type: 'role',

          role: this.role

        })

      );


      console.log(
        'Role sent:',
        this.role
      );

    };


    // =================================================
    // MESSAGE
    // =================================================

    socket.onmessage =
      async (event: MessageEvent) => {

        try {

          const message =
            JSON.parse(event.data);


          console.log(
            'Received from Django:',
            message
          );


          // -------------------------------------------
          // Connection
          // -------------------------------------------

          if (
            message.type === 'connection'
          ) {

            this.status =
              'WebSocket Connected';

            return;
          }


          // -------------------------------------------
          // Signal
          // -------------------------------------------

          if (
            message.type !== 'signal'
          ) {

            return;
          }


          const data =
            message.data;


          if (!data) {

            console.error(
              'Signal data missing'
            );

            return;
          }


          console.log(
            'WebRTC signal:',
            data
          );


          // -------------------------------------------
          // Remote role
          // -------------------------------------------

          if (
            data.type === 'role'
          ) {

            console.log(
              'Remote role:',
              data.role
            );

            return;
          }


          // -------------------------------------------
          // OFFER
          // -------------------------------------------

          if (
            data.type === 'offer'
          ) {

            console.log(
              '📥 OFFER RECEIVED'
            );


            if (
              this.role === 'receiver'
            ) {

              await this.handleOffer(
                data.offer
              );

            }

            return;
          }


          // -------------------------------------------
          // ANSWER
          // -------------------------------------------

          if (
            data.type === 'answer'
          ) {

            console.log(
              '📥 ANSWER RECEIVED'
            );


            if (
              this.role === 'sender'
            ) {

              await this.handleAnswer(
                data.answer
              );

            }

            return;
          }


          // -------------------------------------------
          // ICE
          // -------------------------------------------

          if (
            data.type === 'ice-candidate'
          ) {

            console.log(
              '📥 ICE CANDIDATE RECEIVED'
            );


            await this.handleIceCandidate(
              data.candidate
            );

            return;
          }

        }

        catch (error) {

          console.error(
            'WebSocket message error:',
            error
          );

          this.status =
            'WebSocket message error';

        }

      };


    // =================================================
    // ERROR
    // =================================================

    socket.onerror =
      (error: Event) => {

        console.error(
          'WebSocket error:',
          error
        );

        this.status =
          'WebSocket Error';

      };


    // =================================================
    // CLOSE
    // =================================================

    socket.onclose =
      () => {

        console.log(
          'WebSocket disconnected'
        );

        this.status =
          'WebSocket Disconnected';

      };

  }


  // =====================================================
  // CAMERA
  // =====================================================

  async startCamera(): Promise<void> {

    console.log(
      '📷 Start camera clicked'
    );


    // Camera only on phone

    if (
      this.role !== 'sender'
    ) {

      this.status =
        'Only Phone/Sender needs the camera';

      return;
    }


    // HTTPS check

    if (
      !window.isSecureContext
    ) {

      this.status =
        'Camera requires HTTPS';

      console.error(
        'Page is not secure'
      );

      return;
    }


    // Browser API check

    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {

      this.status =
        'Camera API not available';

      console.error(
        'getUserMedia not available'
      );

      return;
    }


    try {

      this.status =
        'Requesting camera permission...';


      const stream =
        await navigator.mediaDevices
          .getUserMedia({

            video: {

              facingMode: {
                ideal: 'environment'
              }

            },

            audio: false

          });


      this.localStream =
        stream;


      if (this.localVideo) {

        this.localVideo
          .nativeElement
          .srcObject =
          stream;


        await this.localVideo
          .nativeElement
          .play();

      }


      console.log(
        '📷 Camera started successfully'
      );


      this.status =
        'Camera Started';

    }

    catch (error) {

      console.error(
        'Camera error:',
        error
      );

      this.status =
        'Camera Error';

    }

  }


  // =====================================================
  // STOP CAMERA
  // =====================================================

  stopCamera(): void {

    if (this.localStream) {

      this.localStream
        .getTracks()
        .forEach(
          track => track.stop()
        );

      this.localStream = null;

    }


    if (this.localVideo) {

      this.localVideo
        .nativeElement
        .srcObject = null;

    }


    console.log(
      '📷 Camera stopped'
    );


    this.status =
      'Camera stopped';

  }


  // =====================================================
  // CREATE PEER CONNECTION
  // =====================================================

  createConnection(): boolean {

    if (
      this.role !== 'sender'
    ) {

      this.status =
        'Only Phone can create connection';

      return false;
    }


    if (!this.localStream) {

      this.status =
        'Please start the camera first';

      console.error(
        'Camera stream not available'
      );

      return false;
    }


    // Close previous connection

    if (this.peerConnection) {

      this.peerConnection.close();

    }


    this.peerConnection =
      new RTCPeerConnection({

        iceServers: [

          {
            urls:
              'stun:stun.l.google.com:19302'
          }

        ]

      });


    console.log(
      'RTCPeerConnection created'
    );


    // =================================================
    // ADD CAMERA TRACKS
    // =================================================

    this.localStream
      .getTracks()
      .forEach(
        track => {

          if (this.peerConnection) {

            this.peerConnection.addTrack(
              track,
              this.localStream!
            );

          }

        }
      );


    // =================================================
    // REMOTE VIDEO
    // =================================================

    this.peerConnection.ontrack =
      (event: RTCTrackEvent) => {

        console.log(
          '🎥 Remote stream received'
        );


        if (
          this.remoteVideo &&
          event.streams.length > 0
        ) {

          this.remoteVideo
            .nativeElement
            .srcObject =
            event.streams[0];

        }


        this.status =
          '🎥 Remote Camera Connected';

      };


    // =================================================
    // ICE CANDIDATE
    // =================================================

    this.peerConnection.onicecandidate =
      (event: RTCPeerConnectionIceEvent) => {

        if (!event.candidate) {

          console.log(
            'ICE gathering completed'
          );

          return;
        }


        console.log(
          '📤 Sending ICE candidate'
        );


        this.sendSignal({

          type:
            'ice-candidate',

          candidate:
            event.candidate

        });

      };


    // =================================================
    // CONNECTION STATE
    // =================================================

    this.peerConnection
      .onconnectionstatechange =
      () => {

        if (!this.peerConnection) {
          return;
        }


        const state =
          this.peerConnection
            .connectionState;


        console.log(
          'WebRTC connection state:',
          state
        );


        if (
          state === 'connecting'
        ) {

          this.status =
            'WebRTC connecting...';

        }


        if (
          state === 'connected'
        ) {

          this.status =
            '🎥 Live Video Connected';

        }


        if (
          state === 'disconnected'
        ) {

          this.status =
            'WebRTC disconnected';

        }


        if (
          state === 'failed'
        ) {

          this.status =
            'WebRTC connection failed';

        }


        if (
          state === 'closed'
        ) {

          this.status =
            'WebRTC connection closed';

        }

      };


    // =================================================
    // ICE STATE
    // =================================================

    this.peerConnection
      .oniceconnectionstatechange =
      () => {

        if (!this.peerConnection) {
          return;
        }


        console.log(
          'ICE state:',
          this.peerConnection
            .iceConnectionState
        );

      };


    this.status =
      'WebRTC connection created';


    return true;

  }


  // =====================================================
  // CREATE OFFER
  // =====================================================

  async createOffer(): Promise<void> {

    console.log(
      '📡 Create offer clicked'
    );


    if (
      this.role !== 'sender'
    ) {

      this.status =
        'Only Phone can create an offer';

      return;
    }


    if (!this.localStream) {

      this.status =
        'Please start the camera first';

      return;
    }


    const socket =
      this.socket;


    if (
      !socket ||
      socket.readyState !== WebSocket.OPEN
    ) {

      this.status =
        'WebSocket not connected';

      return;
    }


    try {

      const created =
        this.createConnection();


      if (
        !created ||
        !this.peerConnection
      ) {

        return;
      }


      this.status =
        'Creating WebRTC Offer...';


      const offer =
        await this.peerConnection
          .createOffer();


      await this.peerConnection
        .setLocalDescription(
          offer
        );


      console.log(
        '📤 WEBRTC OFFER:',
        offer
      );


      socket.send(

        JSON.stringify({

          type:
            'offer',

          offer:
            offer

        })

      );


      console.log(
        '✅ Offer sent to Django'
      );


      this.status =
        'Offer sent to Django';

    }

    catch (error) {

      console.error(
        'Offer error:',
        error
      );

      this.status =
        'Offer creation failed';

    }

  }


  // =====================================================
  // HANDLE OFFER
  // =====================================================

  async handleOffer(
    offer: RTCSessionDescriptionInit
  ): Promise<void> {

    if (
      this.role !== 'receiver'
    ) {

      return;
    }


    try {

      // Create receiver connection

      this.peerConnection =
        new RTCPeerConnection({

          iceServers: [

            {
              urls:
                'stun:stun.l.google.com:19302'
            }

          ]

        });


      // Remote video

      this.peerConnection.ontrack =
        (event: RTCTrackEvent) => {

          console.log(
            '🎥 Phone camera received'
          );


          if (
            this.remoteVideo &&
            event.streams.length > 0
          ) {

            this.remoteVideo
              .nativeElement
              .srcObject =
              event.streams[0];

          }


          this.status =
            '🎥 Live Video Connected';

        };


      // Receiver ICE

      this.peerConnection.onicecandidate =
        (event: RTCPeerConnectionIceEvent) => {

          if (!event.candidate) {
            return;
          }


          this.sendSignal({

            type:
              'ice-candidate',

            candidate:
              event.candidate

          });

        };


      // Connection state

      this.peerConnection
        .onconnectionstatechange =
        () => {

          if (!this.peerConnection) {
            return;
          }


          console.log(
            'Receiver state:',
            this.peerConnection
              .connectionState
          );


          if (
            this.peerConnection
              .connectionState ===
            'connected'
          ) {

            this.status =
              '🎥 Live Video Connected';

          }

        };


      // Set offer

      await this.peerConnection
        .setRemoteDescription(
          new RTCSessionDescription(
            offer
          )
        );


      console.log(
        '✅ Remote offer set'
      );


      // Add queued ICE

      await this.addPendingIceCandidates();


      // Create answer

      const answer =
        await this.peerConnection
          .createAnswer();


      await this.peerConnection
        .setLocalDescription(
          answer
        );


      console.log(
        '📤 Answer created'
      );


      this.sendSignal({

        type:
          'answer',

        answer:
          answer

      });


      console.log(
        '✅ Answer sent'
      );


      this.status =
        'Answer sent to Phone';

    }

    catch (error) {

      console.error(
        'Offer handling error:',
        error
      );

      this.status =
        'Offer handling failed';

    }

  }


  // =====================================================
  // HANDLE ANSWER
  // =====================================================

  async handleAnswer(
    answer: RTCSessionDescriptionInit
  ): Promise<void> {

    if (
      this.role !== 'sender'
    ) {

      return;
    }


    if (!this.peerConnection) {

      console.error(
        'PeerConnection does not exist'
      );

      return;
    }


    try {

      await this.peerConnection
        .setRemoteDescription(
          new RTCSessionDescription(
            answer
          )
        );


      console.log(
        '✅ Answer received'
      );


      await this.addPendingIceCandidates();


      this.status =
        'WebRTC Answer received';

    }

    catch (error) {

      console.error(
        'Answer handling error:',
        error
      );

      this.status =
        'Answer handling failed';

    }

  }


  // =====================================================
  // HANDLE ICE
  // =====================================================

  async handleIceCandidate(
    candidate: RTCIceCandidateInit
  ): Promise<void> {

    if (!this.peerConnection) {

      this.pendingIceCandidates
        .push(candidate);

      return;
    }


    if (
      !this.peerConnection
        .remoteDescription
    ) {

      this.pendingIceCandidates
        .push(candidate);

      return;
    }


    try {

      await this.peerConnection
        .addIceCandidate(
          new RTCIceCandidate(
            candidate
          )
        );


      console.log(
        '✅ ICE candidate added'
      );

    }

    catch (error) {

      console.error(
        'ICE error:',
        error
      );

    }

  }


  // =====================================================
  // ADD PENDING ICE
  // =====================================================

  private async addPendingIceCandidates():
    Promise<void> {

    if (!this.peerConnection) {
      return;
    }


    if (
      !this.peerConnection
        .remoteDescription
    ) {

      return;
    }


    const candidates =
      [
        ...this.pendingIceCandidates
      ];


    this.pendingIceCandidates =
      [];


    for (
      const candidate of candidates
    ) {

      try {

        await this.peerConnection
          .addIceCandidate(
            new RTCIceCandidate(
              candidate
            )
          );


        console.log(
          '✅ Pending ICE added'
        );

      }

      catch (error) {

        console.error(
          'Pending ICE error:',
          error
        );

      }

    }

  }


  // =====================================================
  // SEND SIGNAL
  // =====================================================

  private sendSignal(
    signal: Record<string, unknown>
  ): void {

    const socket =
      this.socket;


    if (
      !socket ||
      socket.readyState !== WebSocket.OPEN
    ) {

      console.error(
        'WebSocket not connected'
      );

      this.status =
        'WebSocket not connected';

      return;
    }


    socket.send(
      JSON.stringify(signal)
    );


    console.log(
      '📤 Signal sent:',
      signal
    );

  }


  // =====================================================
  // GENERATE QR CODE
  // =====================================================
async generateQRCode(): Promise<void> {

  // QR should be generated by Laptop

  if (this.role !== 'receiver') {

    this.status =
      'Select Laptop before generating QR';

    return;

  }


  // WebSocket must be connected

  const socket =
    this.socket;


  if (
    !socket ||
    socket.readyState !== WebSocket.OPEN
  ) {

    this.status =
      'Connect WebSocket first';

    return;

  }


  // Generate pairing ID

  this.pairingId =
    Math.random()
      .toString(36)
      .substring(2, 10)
      .toUpperCase();


  console.log(
    '🔗 Pairing ID:',
    this.pairingId
  );


  // Send pairing ID to Django

  socket.send(

    JSON.stringify({

      type:
        'pair-create',

      pairingId:
        this.pairingId

    })

  );


  console.log(
    '📤 Pairing ID sent to Django'
  );


  // QR data

  const qrData =
    JSON.stringify({

      type:
        'phone-camera-pair',

      pairingId:
        this.pairingId,

      server:
        '192.168.0.116:8000'

    });


  try {

    this.qrCodeData =
      await QRCode.toDataURL(

        qrData,

        {
          width: 300,
          margin: 2
        }

      );


    console.log(
      '✅ QR Code generated'
    );


    this.status =
      'QR ready - Scan with phone';

  }

  catch (error) {

    console.error(
      '❌ QR generation error:',
      error
    );


    this.status =
      'QR generation failed';

  }

}

  // =====================================================
  // DISCONNECT EVERYTHING
  // =====================================================

  disconnect(): void {

    // Stop camera

    this.stopCamera();


    // Close WebRTC

    if (this.peerConnection) {

      this.peerConnection.close();

      this.peerConnection =
        null;

    }


    // Close WebSocket

    if (this.socket) {

      this.socket.close();

      this.socket =
        null;

    }


    // Clear remote video

    if (this.remoteVideo) {

      this.remoteVideo
        .nativeElement
        .srcObject =
        null;

    }


    // Clear ICE

    this.pendingIceCandidates =
      [];


    this.status =
      'Disconnected';


    console.log(
      'Disconnected'
    );

  }

}