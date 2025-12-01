import { Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'isolated-shadow-dom-component',
  encapsulation: ViewEncapsulation.ExperimentalIsolatedShadowDom,
  templateUrl: './isolatedshadowdom.component.html',
  styleUrl: './isolatedshadowdom.component.scss',
})
export class IsolatedShadowDomComponent {}
