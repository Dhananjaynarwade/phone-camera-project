import { Component } from '@angular/core';
import { RouterLinkActive ,RouterLink} from '@angular/router';
import { Navbar } from "../../navbar/navbar";

@Component({
  imports: [RouterLink, RouterLinkActive, Navbar],
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {}
