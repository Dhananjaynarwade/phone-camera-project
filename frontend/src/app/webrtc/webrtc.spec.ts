import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Webrtc } from './webrtc';

describe('Webrtc', () => {
  let component: Webrtc;
  let fixture: ComponentFixture<Webrtc>;
  

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Webrtc],
    }).compileComponents();

    fixture = TestBed.createComponent(Webrtc);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });


  
});

