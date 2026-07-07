import { PartialType } from '@nestjs/swagger';
import { CreateCouncilMemberDto } from './create-council-member.dto';

export class UpdateCouncilMemberDto extends PartialType(CreateCouncilMemberDto) {}
