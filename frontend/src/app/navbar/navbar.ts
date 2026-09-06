import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  imports: [RouterLink,RouterLinkActive],
  selector: 'app-navbar',
  styleUrl: './navbar.css',
  templateUrl: './navbar.html',
})
export class Navbar {
toggleMenu() {
throw new Error('Method not implemented.');
}
menuOpen: any;
closeMenu() {
throw new Error('Method not implemented.');
}
}
