import {
  Component,
  ElementRef,
  ViewChild
} from '@angular/core';

import { CommonModule } from '@angular/common';
import QRCode from 'qrcode';
import { BrowserQRCodeReader } from '@zxing/browser';
import { Capturephoto } from '../component/capturephoto/capturephoto';
import { Sharedphoto } from '../component/sharedphoto/sharedphoto';

@Component({
  selector: 'app-webrtc',
  standalone: true,
  imports: [CommonModule, Capturephoto,Sharedphoto],
  templateUrl: './webrtc.html',
  styleUrl: './webrtc.css'
})
export class Webrtc {

  // =====================================================
  // QR SCANNER
  // =====================================================

  qrScanner = new BrowserQRCodeReader();

  scanningQR = false;

  private qrControls: any = null;

  @ViewChild('qrVideo')
  qrVideo!: ElementRef<HTMLVideoElement>;


  // =====================================================
  // VIDEO
  // =====================================================

  @ViewChild('localVideo')
  localVideo!: ElementRef<HTMLVideoElement>;

  @ViewChild('remoteVideo')
  remoteVideo!: ElementRef<HTMLVideoElement>;


  // =====================================================
  // STREAMS
  // =====================================================

  localStream: MediaStream | null = null;

  remoteStream: MediaStream | null = null;

  devicePaired = false;


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
// SESSION MANAGEMENT
// =====================================================

sessionActive = false;
connectionLost = false;


  // =====================================================
  // ROLE
  // =====================================================

  // sender   = PHONE
  // receiver = LAPTOP

  role: 'sender' | 'receiver' | '' = '';


  // =====================================================
  // PAIRING
  // =====================================================

  pairingId = '';

  qrCodeData = '';


  // =====================================================
  // ICE
  // =====================================================

  private pendingIceCandidates: RTCIceCandidateInit[] = [];
  receivedPhoto: string | null = null;
// =====================================================
// SET ROLE
// =====================================================

setRole(
  selectedRole: 'sender' | 'receiver'
): void {

  this.role = selectedRole;

  console.log(
    'Role:',
    selectedRole
  );

  if (selectedRole === 'sender') {

    this.status =
      '📱 Phone selected';

  } else {

    this.status =
      '💻 Laptop selected';

  }
}


// =====================================================
// SEND CAPTURED PHOTO
// =====================================================

sendPhoto(photo: string): void {

  console.log('📸 Sending captured photo...');

  if (
    !this.socket ||
    this.socket.readyState !== WebSocket.OPEN
  ) {

    console.error(
      '❌ WebSocket not connected'
    );

    return;
  }

  this.socket.send(
    JSON.stringify({
      type: 'photo',
      photo: photo
    })
  );

  console.log(
    '📤 Photo sent to other device'
  );
}

  // =====================================================
  // CONNECT WEBSOCKET
  // =====================================================

  connectWebSocket(): void {

    console.log(
      '🔌 Connecting WebSocket...'
    );


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


    // YOUR WIFI IP
    const socket =
      new WebSocket(
        'ws://192.168.0.105:8000/ws/signaling/'
      );


    this.socket = socket;


    // =================================================
    // OPEN
    // =================================================

    socket.onopen = () => {

      console.log(
        '✅ WebSocket connected'
      );
      this.connectionLost = false;


      this.status =
        'WebSocket Connected';



      socket.send(

        JSON.stringify({

          type: 'role',

          role: this.role

        })

      );


      console.log(
        '📤 Role sent:',
        this.role
      );


      // -------------------------------------------------
      // IF PHONE ALREADY SCANNED QR
      // -------------------------------------------------

      if (
        this.role === 'sender' &&
        this.pairingId
      ) {

        console.log(
          '📱 Joining existing pairing:',
          this.pairingId
        );


        socket.send(

          JSON.stringify({

            type: 'pair',

            pairingId:
              this.pairingId

          })

        );

      }

    };


    // =================================================
    // MESSAGE
    // =================================================

    socket.onmessage =
      async (event: MessageEvent) => {

        try {

          const message =
            JSON.parse(
              event.data
            );


          console.log(
            '📥 Received from Django:',
            message
          );

// =====================================================
// RECEIVE PHOTO
// =====================================================

if (message.type === 'photo') {

  console.log('📸 PHOTO RECEIVED FROM OTHER DEVICE');

  this.receivedPhoto = message.photo;

  console.log('✅ Received photo stored');

  return;
}

          // =============================================
          // NORMAL CONNECTION
          // =============================================

          if (
            message.type === 'connection'
          ) {

            this.status =
              'WebSocket Connected';

            return;
          }


          // =============================================
          // PAIRING MESSAGE
          // LAPTOP RECEIVES:
          // { type: "pairing", data: ... }
          // =============================================

          if (
            message.type === 'pairing'
          ) {

            console.log(
              '🔗 Pairing message:',
              message
            );


            const data =
              message.data;


            if (
              data &&
              data.type === 'paired'
            ) {

              this.devicePaired =
                true;


              this.pairingId =
                data.pairingId ||
                this.pairingId;


              this.status =
                '✅ Phone paired with Laptop';


              console.log(
                '✅ PAIRING SUCCESS'
              );

            }


            return;
          }


          // =============================================
          // PHONE RECEIVES:
          // { type: "paired" }
          // =============================================

          if (
            message.type === 'paired'
          ) {

            console.log(
              '✅ Phone pairing confirmed'
            );


            this.devicePaired =
              true;


            if (
              message.pairingId
            ) {

              this.pairingId =
                message.pairingId;

            }


            this.status =
              '✅ Phone paired with Laptop';


            return;
          }


          // =============================================
          // PHONE PAIRED MESSAGE
          // LAPTOP CAN RECEIVE THIS
          // =============================================

          if (
            message.type === 'phone-paired'
          ) {

            console.log(
              '📱 Phone joined pairing'
            );


            this.devicePaired =
              true;


            this.status =
              '📱 Phone connected - Ready for camera';


            return;
          }


          // =============================================
          // SIGNAL
          // =============================================

          if (
            message.type !== 'signal'
          ) {

            return;
          }


          const data =
            message.data;


          if (!data) {

            console.error(
              '❌ Signal data missing'
            );

            return;
          }


          console.log(
            '📡 WebRTC signal:',
            data
          );


          // =============================================
          // ROLE
          // =============================================

          if (
            data.type === 'role'
          ) {

            console.log(
              'Remote role:',
              data.role
            );

            return;
          }


          // =============================================
          // OFFER
          // =============================================

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


          // =============================================
          // ANSWER
          // =============================================

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


          // =============================================
          // ICE
          // =============================================

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
            '❌ WebSocket message error:',
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
          '❌ WebSocket error:',
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
          '🔌 WebSocket disconnected'
        );
        this.connectionLost=true;
        this.sessionActive=false;


        this.status =
            '🔴 Connection Lost - Create a new session';

      };

  }


  // =====================================================
  // GENERATE QR CODE
  // LAPTOP ONLY
  // =====================================================

  async generateQRCode(): Promise<void> {

    console.log(
      '🔗 Generate QR clicked'
    );


    if (
      this.role !== 'receiver'
    ) {

      this.status =
        'Select Laptop first';

      return;
    }


    if (
      !this.socket ||
      this.socket.readyState !== WebSocket.OPEN
    ) {

      this.status =
        'Connect WebSocket first';

      return;
    }


    // Generate pairing ID

    this.pairingId =
      Math.random()
        .toString(36)
        .substring(2, 11)
        .toUpperCase();


    console.log(
      '🔗 Pairing ID:',
      this.pairingId
    );


    // =============================================
    // TELL DJANGO TO CREATE PAIRING
    // =============================================

    this.socket.send(

      JSON.stringify({

        type: 'pair-create',

        pairingId:
          this.pairingId

      })

    );


    console.log(
      '📤 Pairing created request sent'
    );


    // =============================================
    // CREATE QR
    // =============================================

    const qrData =
      JSON.stringify({

        type:
          'phone-camera-pair',

        pairingId:
          this.pairingId

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
        '📱 QR ready - Scan with Phone';

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
  // START QR SCANNER
  // PHONE ONLY
  // =====================================================

  async startQRScanner(): Promise<void> {

    console.log(
      '📷 SCAN LAPTOP QR CLICKED'
    );


    if (
      this.role !== 'sender'
    ) {

      this.status =
        'Select Phone first';

      return;
    }


    // =============================================
    // SECURE CONTEXT
    // =============================================

    if (
      !window.isSecureContext
    ) {

      console.error(
        '❌ HTTPS required'
      );


      this.status =
        'HTTPS is required for camera';

      return;
    }


    // =============================================
    // CAMERA API
    // =============================================

    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {

      this.status =
        'Camera API not available';

      return;
    }


    this.scanningQR =
      true;


    this.status =
      'Opening QR scanner...';


    // Wait for Angular DOM

    setTimeout(
      async () => {

        try {

          if (!this.qrVideo) {

            console.error(
              '❌ qrVideo not found'
            );


            this.status =
              'QR video not ready';


            this.scanningQR =
              false;


            return;
          }


          console.log(
            '✅ QR video found'
          );


          const devices =
            await BrowserQRCodeReader
              .listVideoInputDevices();


          console.log(
            '📷 Cameras:',
            devices
          );


          if (
            !devices ||
            devices.length === 0
          ) {

            this.status =
              'No camera found';


            this.scanningQR =
              false;


            return;
          }


          // =========================================
          // FIND REAR CAMERA
          // =========================================

          let deviceId =
            devices[
              devices.length - 1
            ].deviceId;


          for (
            const device of devices
          ) {

            const label =
              device.label
                .toLowerCase();


            if (
              label.includes('back') ||
              label.includes('rear') ||
              label.includes('environment')
            ) {

              deviceId =
                device.deviceId;

              break;
            }

          }


          console.log(
            '📷 Selected camera:',
            deviceId
          );


          this.status =
            '📷 Camera opened - Scan Laptop QR';


          // =========================================
          // START ZXING
          // =========================================

          await this.qrScanner
            .decodeFromVideoDevice(

              deviceId,

              this.qrVideo
                .nativeElement,

              (
                result,
                error,
                controls
              ) => {

                // Save controls

                if (
                  controls &&
                  !this.qrControls
                ) {

                  this.qrControls =
                    controls;

                }


                if (!result) {

                  return;
                }


                console.log(
                  '✅ QR CODE FOUND'
                );


                const qrText =
                  result.getText();


                console.log(
                  '📦 QR:',
                  qrText
                );


                // =================================
                // STOP SCANNER
                // =================================

                if (controls) {

                  controls.stop();

                }


                this.qrControls =
                  null;


                this.scanningQR =
                  false;


                // =================================
                // PROCESS QR
                // =================================

                this.handleQRCode(
                  qrText
                );

              }

            );

        }

        catch (error) {

          console.error(
            '❌ QR scanner error:',
            error
          );


          this.scanningQR =
            false;


          this.status =
            'Could not open camera';

        }

      },

      500

    );

  }


  // =====================================================
  // STOP QR SCANNER
  // =====================================================

  stopQRScanner(): void {

    console.log(
      '🛑 Stop QR scanner'
    );


    this.scanningQR =
      false;


    if (
      this.qrControls
    ) {

      this.qrControls.stop();

      this.qrControls =
        null;

    }


    if (this.qrVideo) {

      const video =
        this.qrVideo
          .nativeElement;


      const stream =
        video.srcObject;


      if (
        stream instanceof MediaStream
      ) {

        stream
          .getTracks()
          .forEach(
            track =>
              track.stop()
          );

      }


      video.srcObject =
        null;

    }


    this.status =
      'QR scanner stopped';

  }


  // =====================================================
  // HANDLE QR CODE
  // =====================================================

 // =====================================================
// HANDLE QR CODE
// =====================================================

async handleQRCode(qrText: string): Promise<void> {

  console.log('📱 QR data:', qrText);

  try {

    const data = JSON.parse(qrText);

    console.log('📦 QR JSON:', data);

    if (data.type !== 'phone-camera-pair') {

      this.status = 'Invalid QR code';

      return;
    }

    if (!data.pairingId) {

      this.status = 'Pairing ID missing';

      return;
    }

    // Save pairing ID
    this.pairingId = data.pairingId;

    console.log(
      '🔗 Pairing ID:',
      this.pairingId
    );

    // Mark paired
    this.devicePaired = true;

    this.status =
      '✅ QR scanned - Phone paired with Laptop';

    // ---------------------------------------------
    // CHECK WEBSOCKET
    // ---------------------------------------------

    if (
      !this.socket ||
      this.socket.readyState !== WebSocket.OPEN
    ) {

      console.error(
        '❌ WebSocket not connected'
      );

      this.status =
        'QR scanned, but WebSocket is not connected';

      return;
    }

    // ---------------------------------------------
    // SEND PAIR REQUEST
    // ---------------------------------------------

    this.socket.send(
      JSON.stringify({

        type: 'pair',

        pairingId:
          this.pairingId

      })
    );

    console.log(
      '📤 Pair request sent to Django'
    );

    this.status =
      '✅ Pairing successful - Starting phone camera...';

    // ---------------------------------------------
    // START PHONE CAMERA
    // ---------------------------------------------

    await this.startCamera();

    // ---------------------------------------------
    // CREATE WEBRTC OFFER
    // ---------------------------------------------

    if (this.localStream) {

      console.log(
        '📡 Creating WebRTC offer...'
      );

      await this.createOffer();

    } else {

      console.error(
        '❌ Local camera stream not available'
      );

      this.status =
        'Pairing successful, but phone camera failed';

    }

  }

  catch (error) {

    console.error(
      '❌ QR parsing error:',
      error
    );

    this.status =
      'Invalid QR code';

  }

}


  // =====================================================
  // START PHONE CAMERA
  // =====================================================
async startCamera(): Promise<void> {

  console.log('📷 Starting phone camera...');

  if (this.role !== 'sender') {

    this.status =
      'Only Phone can start camera';

    return;
  }

  try {

    this.status =
      '📷 Requesting phone camera permission...';

    this.localStream =
      await navigator.mediaDevices.getUserMedia({

        video: {
          facingMode: {
            ideal: 'environment'
          }
        },

        audio: false

      });

    console.log(
      '✅ Phone camera stream obtained'
    );

    if (this.localVideo) {

      const video =
        this.localVideo.nativeElement;

      video.srcObject =
        this.localStream;

      await video.play();

    }

    this.status =
      '📷 Phone camera started';

    console.log(
      '📷 Camera tracks:',
      this.localStream.getTracks()
    );

  }

  catch (error) {

    console.error(
      '❌ Phone camera error:',
      error
    );

    this.status =
      '❌ Phone camera permission/error';

  }

}


  // =====================================================
  // STOP CAMERA
  // =====================================================

  stopCamera(): void {

    if (
      this.localStream
    ) {

      this.localStream
        .getTracks()
        .forEach(
          track =>
            track.stop()
        );


      this.localStream =
        null;

    }


    if (
      this.localVideo
    ) {

      this.localVideo
        .nativeElement
        .srcObject =
        null;

    }


    console.log(
      '📷 Camera stopped'
    );


    this.status =
      'Camera stopped';

  }


  // =====================================================
  // CREATE WEBRTC CONNECTION
  // PHONE ONLY
  // =====================================================

  createConnection(): boolean {

    if (
      this.role !== 'sender'
    ) {

      this.status =
        'Only Phone creates connection';

      return false;
    }


    if (
      !this.localStream
    ) {

      this.status =
        'Start phone camera first';

      return false;
    }


    // Close old connection

    if (
      this.peerConnection
    ) {

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
      '✅ RTCPeerConnection created'
    );


    // =============================================
    // ADD PHONE CAMERA TRACK
    // =============================================

    this.localStream
      .getTracks()
      .forEach(
        track => {

          if (
            this.peerConnection
          ) {

            this.peerConnection
              .addTrack(
                track,
                this.localStream!
              );

          }

        }
      );


    // =============================================
    // REMOTE STREAM
    // =============================================

    this.peerConnection.ontrack =
      (event: RTCTrackEvent) => {

        console.log(
          '🎥 Remote stream received'
        );


        if (
          event.streams.length > 0
        ) {

          this.remoteStream =
            event.streams[0];


          if (
            this.remoteVideo
          ) {

            this.remoteVideo
              .nativeElement
              .srcObject =
              this.remoteStream;


            this.remoteVideo
              .nativeElement
              .play()
              .catch(
                error => {

                  console.error(
                    'Remote video play error:',
                    error
                  );

                }
              );

          }

        }


        this.status =
          '🎥 Remote Camera Connected';

      };


    // =============================================
    // ICE
    // =============================================

    this.peerConnection.onicecandidate =
      (
        event:
          RTCPeerConnectionIceEvent
      ) => {

        if (
          !event.candidate
        ) {

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


    // =============================================
    // CONNECTION STATE
    // =============================================

  // =============================================
// CONNECTION STATE
// =============================================

this.peerConnection.onconnectionstatechange = () => {

  if (!this.peerConnection) {
    return;
  }

  const state = this.peerConnection.connectionState;

  console.log('WebRTC state:', state);


  // CONNECTION STARTING
  if (state === 'connecting') {

    this.status = 'WebRTC connecting...';

  }


  // CONNECTION SUCCESS
  if (state === 'connected') {

    this.sessionActive = true;
    this.connectionLost = false;

    this.status = '🟢 Live Video Connected';

    console.log('🟢 SESSION ACTIVE');

  }


  // CONNECTION LOST
  if (
    state === 'disconnected' ||
    state === 'failed' ||
    state === 'closed'
  ) {

    this.sessionActive = false;
    this.connectionLost = true;

    this.status =
      '🔴 Connection Lost - Create a new session';

    console.log('🔴 SESSION LOST');

  }

};


    return true;

  }


  // =====================================================
  // CREATE OFFER
  // PHONE ONLY
  // =====================================================

  async createOffer(): Promise<void> {

    console.log(
      '📡 Create offer'
    );


    if (
      this.role !== 'sender'
    ) {

      this.status =
        'Only Phone creates offer';

      return;
    }


    if (
      !this.localStream
    ) {

      this.status =
        'Start camera first';

      return;
    }


    if (
      !this.socket ||
      this.socket.readyState !==
      WebSocket.OPEN
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
        'Creating WebRTC offer...';


      const offer =
        await this.peerConnection
          .createOffer();


      await this.peerConnection
        .setLocalDescription(
          offer
        );


      console.log(
        '📤 OFFER:',
        offer
      );


      // =============================================
      // SEND OFFER THROUGH DJANGO
      // =============================================

      this.sendSignal({

        type:
          'offer',

        offer:
          offer

      });


      this.status =
        '📡 Offer sent to Laptop';

    }


    catch (error) {

      console.error(
        '❌ Offer error:',
        error
      );


      this.status =
        'Offer creation failed';

    }

  }


  // =====================================================
  // HANDLE OFFER
  // LAPTOP ONLY
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

      this.peerConnection =
        new RTCPeerConnection({

          iceServers: [

            {
              urls:
                'stun:stun.l.google.com:19302'
            }

          ]

        });


      // =============================================
      // PHONE VIDEO
      // =============================================

      this.peerConnection.ontrack =
        (
          event: RTCTrackEvent
        ) => {

          console.log(
            '🎥 Phone camera received'
          );


          if (
            event.streams.length > 0
          ) {

            this.remoteStream =
              event.streams[0];


            if (
              this.remoteVideo
            ) {

              this.remoteVideo
                .nativeElement
                .srcObject =
                this.remoteStream;


              this.remoteVideo
                .nativeElement
                .play()
                .catch(
                  error => {

                    console.error(
                      'Remote video error:',
                      error
                    );

                  }
                );

            }

          }


          this.status =
            '🎥 Live Video Connected';

        };


      // =============================================
      // ICE
      // =============================================

      this.peerConnection.onicecandidate =
        (
          event:
            RTCPeerConnectionIceEvent
        ) => {

          if (
            !event.candidate
          ) {

            return;
          }


          this.sendSignal({

            type:
              'ice-candidate',

            candidate:
              event.candidate

          });

        };


     // =============================================
// LAPTOP CONNECTION STATE
// =============================================

this.peerConnection.onconnectionstatechange = () => {

  if (!this.peerConnection) {
    return;
  }

  const state =
    this.peerConnection.connectionState;

  console.log(
    'Laptop WebRTC state:',
    state
  );

  if (state === 'connecting') {

    this.status =
      'WebRTC connecting...';

  }

  if (state === 'connected') {

    this.sessionActive = true;
    this.connectionLost = false;

    this.status =
      '🟢 Live Video Connected';

    console.log(
      '🟢 LAPTOP SESSION ACTIVE'
    );

  }

  if (
    state === 'disconnected' ||
    state === 'failed' ||
    state === 'closed'
  ) {

    this.sessionActive = false;
    this.connectionLost = true;

    this.status =
      '🔴 Connection Lost - Create a new session';

    console.log(
      '🔴 LAPTOP SESSION LOST'
    );

  }

};
      // =============================================
      // SET OFFER
      // =============================================

      await this.peerConnection
        .setRemoteDescription(
          new RTCSessionDescription(
            offer
          )
        );


      console.log(
        '✅ Remote offer set'
      );


      // =============================================
      // ADD QUEUED ICE
      // =============================================

      await this.addPendingIceCandidates();


      // =============================================
      // CREATE ANSWER
      // =============================================

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
        '📡 Answer sent to Phone';

    }


    catch (error) {

      console.error(
        '❌ Offer handling error:',
        error
      );


      this.status =
        'Offer handling failed';

    }

  }


  // =====================================================
  // HANDLE ANSWER
  // PHONE ONLY
  // =====================================================

  async handleAnswer(
    answer: RTCSessionDescriptionInit
  ): Promise<void> {

    if (
      this.role !== 'sender'
    ) {

      return;
    }


    if (
      !this.peerConnection
    ) {

      console.error(
        '❌ PeerConnection missing'
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
        '✅ WebRTC Answer received';

    }


    catch (error) {

      console.error(
        '❌ Answer error:',
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

    if (
      !this.peerConnection
    ) {

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
        '❌ ICE error:',
        error
      );

    }

  }


  // =====================================================
  // ADD PENDING ICE
  // =====================================================

  private async addPendingIceCandidates():
    Promise<void> {

    if (
      !this.peerConnection
    ) {

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
          '❌ Pending ICE error:',
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

    if (
      !this.socket ||
      this.socket.readyState !==
      WebSocket.OPEN
    ) {

      console.error(
        '❌ WebSocket not connected'
      );


      this.status =
        'WebSocket not connected';


      return;
    }


    this.socket.send(

      JSON.stringify(
        signal
      )

    );


    console.log(
      '📤 Signal sent:',
      signal
    );

  }
// =====================================================
// END SESSION
// =====================================================

endSession(): void {

  console.log('🛑 Ending session...');

  // Stop QR scanner
  this.stopQRScanner();

  // Stop camera
  this.stopCamera();

  // Close WebRTC
  if (this.peerConnection) {
    this.peerConnection.close();
    this.peerConnection = null;
  }

  // Close WebSocket
  if (this.socket) {
    this.socket.close();
    this.socket = null;
  }

  // Clear remote video
  this.remoteStream = null;

  if (this.remoteVideo) {
    this.remoteVideo.nativeElement.srcObject = null;
  }

  // Clear session data
  this.pendingIceCandidates = [];
  this.devicePaired = false;
  this.pairingId = '';
  this.qrCodeData = '';

  // Session state
  this.sessionActive = false;
  this.connectionLost = false;

  this.status = 'Session ended';

  console.log('✅ Session ended successfully');
}
// =====================================================
// CREATE NEW SESSION
// =====================================================

createNewSession(): void {

  console.log('🔄 Creating new session...');

  // Reset everything
  this.endSession();

  // Reset status
  this.status = 'Ready for new session';

  console.log('🆕 New session ready');
}

  // =====================================================
  // DISCONNECT
  // =====================================================

  disconnect(): void {

    // Stop QR

    this.stopQRScanner();


    // Stop camera

    this.stopCamera();


    // Close WebRTC

    if (
      this.peerConnection
    ) {

      this.peerConnection.close();

      this.peerConnection =
        null;

    }


    // Close WebSocket

    if (
      this.socket
    ) {

      this.socket.close();

      this.socket =
        null;

    }


    // Clear remote stream

    this.remoteStream =
      null;


    if (
      this.remoteVideo
    ) {

      this.remoteVideo
        .nativeElement
        .srcObject =
        null;

    }


    // Clear ICE

    this.pendingIceCandidates =
      [];


    this.devicePaired =
      false;


    this.pairingId =
      '';


    this.qrCodeData =
      '';


    this.status =
      'Disconnected';


    console.log(
      '🔌 Everything disconnected'
    );

    
  }
  // =====================================================
// SEND CAPTURED PHOTO TO OTHER DEVICE
// =====================================================


}

