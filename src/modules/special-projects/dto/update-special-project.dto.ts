import { PartialType } from '@nestjs/swagger';
import { CreateSpecialProjectDto } from './create-special-project.dto';

export class UpdateSpecialProjectDto extends PartialType(CreateSpecialProjectDto) {}
