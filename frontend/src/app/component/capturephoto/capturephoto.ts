import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-capturephoto',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './capturephoto.html',
  styleUrl: './capturephoto.css'
})
export class Capturephoto {
  

  // Video that should be captured
  @Input() videoElement!: HTMLVideoElement;

  // Send captured photo to parent Webrtc component
  @Output() photoCaptured = new EventEmitter<string>();

  // Photo displayed locally
  capturedPhoto: string | null = null;


  // =====================================================
  // CAPTURE PHOTO
  // =====================================================

  capturePhoto(): void {

    console.log('📸 Capture Photo clicked');

    if (!this.videoElement) {

      console.error('❌ Video element not found');

      return;
    }

    const video = this.videoElement;


    // Check video is actually displaying a frame

    if (
      video.videoWidth === 0 ||
      video.videoHeight === 0
    ) {

      console.error(
        '❌ Video is not ready'
      );

      return;
    }


    // Create canvas

    const canvas =
      document.createElement('canvas');


    canvas.width =
      video.videoWidth;

    canvas.height =
      video.videoHeight;


    const context =
      canvas.getContext('2d');


    if (!context) {

      console.error(
        '❌ Canvas not supported'
      );

      return;
    }


    // Capture current video frame

    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );


    // Convert to JPEG

    const photo =
      canvas.toDataURL(
        'image/jpeg',
        0.9
      );


    // Show locally

    this.capturedPhoto =
      photo;


    console.log(
      '✅ Photo captured locally'
    );


    // Send photo to Webrtc parent

    this.photoCaptured.emit(
      photo
    );


    console.log(
      '📤 Photo sent to Webrtc component'
    );

  }


  // =====================================================
  // SAVE PHOTO
  // =====================================================

  savePhoto(): void {

    if (!this.capturedPhoto) {

      console.error(
        '❌ No photo to save'
      );

      return;
    }


    const link =
      document.createElement('a');


    link.href =
      this.capturedPhoto;


    link.download =
      `phone-camera-${Date.now()}.jpg`;


    link.click();


    console.log(
      '💾 Photo saved'
    );

  }


  // =====================================================
  // DELETE PHOTO
  // =====================================================

  deletePhoto(): void {

    this.capturedPhoto =
      null;


    console.log(
      '🗑 Photo deleted'
    );

  }


  // =====================================================
  // RECEIVE PHOTO FROM OTHER DEVICE
  // =====================================================

  showRemotePhoto(
    photo: string
  ): void {

    console.log(
      '📥 Photo received from other device'
    );


    this.capturedPhoto =
      photo;

  }

}