
import { Component } from '@angular/core';
import { Webrtc } from './webrtc/webrtc';
import { RouterOutlet } from "@angular/router"
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Webrtc, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
}
