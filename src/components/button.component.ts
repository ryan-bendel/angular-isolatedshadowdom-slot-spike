import { Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'button-component',
  encapsulation: ViewEncapsulation.Emulated,
  template: `<button>Test button should be green</button>`,
  styles: [`button {color: green}`],
})
export class ButtonComponent {}
