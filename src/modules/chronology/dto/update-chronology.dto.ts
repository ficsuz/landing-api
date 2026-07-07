import { PartialType } from '@nestjs/swagger';
import { CreateChronologyDto } from './create-chronology.dto';

export class UpdateChronologyDto extends PartialType(CreateChronologyDto) {}
