import { Routes } from '@angular/router';
import { Home } from './component/home/home';
import { Webrtc } from './webrtc/webrtc';

export const routes: Routes = [

    {path: '', component:Home},
    {path: 'webcam', component:Webrtc}
];
