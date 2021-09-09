import {Entity, model, property, hasMany} from '@loopback/repository';
import {Button} from './button.model';
import {TemplateButtonsTypes} from './enums';
@model()
export class TemplateButton extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
  })
  name?: string;

  @property({
    type: 'string',
    jsonSchema: {
      enum: Object.values(TemplateButtonsTypes),
    },
    required: true
  })
  type?: string;

  @property({
    type: 'object',
    required: true,
  })
  fields: object;

  @hasMany(() => Button)
  buttons: Button[];

  constructor(data?: Partial<TemplateButton>) {
    super(data);
  }
}

export interface TemplateButtonRelations {
  // describe navigational properties here
}

export type TemplateButtonWithRelations = TemplateButton & TemplateButtonRelations;
