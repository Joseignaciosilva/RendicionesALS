import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';

@Component({
  selector: 'app-branding',
  standalone: true,
  imports: [NgIf],
  template: `
    <div class="branding">
      @if(options.theme === 'light') {
     <a href="/" style="display: flex; align-items: center; text-decoration: none; color: inherit;">
  <img
    src="./assets/images/logos/als_logo_1.png"
    class="align-middle m-2"
    alt="logo"
    style="width: 50px; height: 100%; object-fit: cover;"
  />
  <h4 class="page-title m-0 f-s-20 " style="margin-left: 10px !important; color: inherit;">Rendiciones ALS</h4>
</a>



      } @if(options.theme === 'dark') {
     <a href="/" style="display: flex; align-items: center; text-decoration: none; color: inherit;">
  <img
    src="./assets/images/logos/als_logo_1.png"
    class="align-middle m-2"
    alt="logo"
    style="width: 50px; height: 100%; object-fit: cover;"
  />
  <h4 class="page-title m-0 f-s-20 " style="margin-left: 10px !important; color: inherit;">Rendiciones ALS</h4>
</a>



      }
    </div>
  `,
})
export class BrandingComponent {
  options = this.settings.getOptions();

  constructor(private settings: CoreService) {}
}
