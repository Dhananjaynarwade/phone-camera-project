import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Capturephoto } from './capturephoto';

describe('Capturephoto', () => {
  let component: Capturephoto;
  let fixture: ComponentFixture<Capturephoto>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Capturephoto],
    }).compileComponents();

    fixture = TestBed.createComponent(Capturephoto);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
