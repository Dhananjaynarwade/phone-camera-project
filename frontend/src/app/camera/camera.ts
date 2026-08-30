import { Component,ElementRef,ViewChild } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-camera',
  styleUrl: './camera.css',
  templateUrl: './camera.html',
})
export class Camera {
    @ViewChild('video') video!: ElementRef<HTMLVideoElement>;

  stream: MediaStream | null = null;

  async startCamera() {

    try {

      this.stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });

      this.video.nativeElement.srcObject = this.stream;

    } catch (error) {

      console.error('Camera error:', error);

      alert('Camera permission denied or camera is not available.');

    }

  }

  stopCamera() {

    if (this.stream) {

      this.stream.getTracks().forEach(track => track.stop());

      this.stream = null;

      this.video.nativeElement.srcObject = null;

    }

  } 

} 
