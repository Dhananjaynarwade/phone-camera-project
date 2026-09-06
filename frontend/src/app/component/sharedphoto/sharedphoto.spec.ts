import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Sharedphoto } from './sharedphoto';

describe('Sharedphoto', () => {
  let component: Sharedphoto;
  let fixture: ComponentFixture<Sharedphoto>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sharedphoto],
    }).compileComponents();

    fixture = TestBed.createComponent(Sharedphoto);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
