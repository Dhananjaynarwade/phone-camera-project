
import { Component } from '@angular/core';
import { Webrtc } from './webrtc/webrtc';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Webrtc],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
}
