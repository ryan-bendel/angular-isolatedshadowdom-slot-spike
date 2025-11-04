import { Component, ViewEncapsulation } from '@angular/core';
import { ButtonComponent } from '../button.component';

@Component({
  selector: 'isolated-with-children',
  encapsulation: ViewEncapsulation.IsolatedShadowDom,
  templateUrl: './isolated_with_children.component.html',
  styleUrl: './isolated_with_children.component.scss',
  imports: [ButtonComponent],
})
export class IsolatedShadowDomWithChildrenComponent {}
