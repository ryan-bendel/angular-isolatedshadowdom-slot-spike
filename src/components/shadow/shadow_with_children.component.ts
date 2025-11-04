import { Component, ViewEncapsulation } from '@angular/core';
import { ButtonComponent } from '../button.component';

@Component({
  selector: 'shadow-with-children',
  encapsulation: ViewEncapsulation.ShadowDom,
  templateUrl: './shadow_with_children.component.html',
  styleUrl: './shadow_with_children.component.scss',
  imports: [ButtonComponent],
})
export class ShadowDomWithChildrenComponent {}
