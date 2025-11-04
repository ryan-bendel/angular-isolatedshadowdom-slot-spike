import { Component, ViewEncapsulation } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  IsolatedShadowDomComponent,
  ShadowDomComponent,
  ShadowDomWithChildrenComponent,
  IsolatedShadowDomWithChildrenComponent,
  ButtonComponent,
} from './components';

@Component({
  selector: 'app-root',
  templateUrl: './main.html',
  imports: [
    IsolatedShadowDomComponent,
    ShadowDomComponent,
    ShadowDomWithChildrenComponent,
    IsolatedShadowDomWithChildrenComponent,
    ButtonComponent
  ],
  styleUrl: 'styles.scss',
  encapsulation: ViewEncapsulation.None,
})
export class App {
  name = 'Angular';
}

bootstrapApplication(App);
