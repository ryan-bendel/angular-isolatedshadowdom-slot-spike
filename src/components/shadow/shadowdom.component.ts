import { Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'shadow-dom-component',
  encapsulation: ViewEncapsulation.ShadowDom,
  templateUrl: './shadowdom.component.html',
  styleUrl: './shadowdom.component.scss',
})
export class ShadowDomComponent {}
