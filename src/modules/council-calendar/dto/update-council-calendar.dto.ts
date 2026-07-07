import { PartialType } from '@nestjs/swagger';
import { CreateCouncilCalendarDto } from './create-council-calendar.dto';

export class UpdateCouncilCalendarDto extends PartialType(CreateCouncilCalendarDto) {}
