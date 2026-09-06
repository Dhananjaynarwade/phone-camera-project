import { Routes } from '@angular/router';
import { Home } from './component/home/home';
import { Webrtc } from './webrtc/webrtc';
import { Footer } from './footer/footer';

export const routes: Routes = [

    {path: '', component:Home},
    {path: 'webcam', component:Webrtc},
    {path:'footer',component:Footer}
];
