import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { TestimonialsService } from './testimonials.service';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';
import { TestimonialResponseDto } from './dto/testimonial-response.dto';
import { PaginationDto } from '@common/dto/pagination.dto';
import { User } from '@common/decorators/user.decorator';
import { IUserSession } from '@modules/auth/interfaces/auth.interface';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { AuthGuard } from '@common/guards/auth.guard';
import { RESOURCES, ROLES } from '@common/constants';
import { RequireRoles } from '@common/decorators/roles.decorator';
import {
  ApiOkData,
  ApiCreatedData,
  ApiPaginatedResponse,
} from '@common/decorators/api-response.decorator';

@ApiTags('Testimonials')
@Controller({
  path: RESOURCES.TESTIMONIALS,
  version: '1',
})
export class TestimonialsController {
  constructor(private readonly testimonialsService: TestimonialsService) {}

  @Get()
  @ApiOperation({
    summary: 'List testimonials',
    description: 'Retrieve a paginated list of testimonials with optional search and sorting.',
  })
  @ApiPaginatedResponse(TestimonialResponseDto)
  findAll(@Query() query: PaginationDto) {
    return this.testimonialsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get testimonial by ID',
    description: 'Retrieve a single testimonial by its unique identifier.',
  })
  @ApiOkData(TestimonialResponseDto)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.testimonialsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AuthGuard)
  @ApiBearerAuth('authorization')
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Create testimonial',
    description: 'Create a new testimonial.',
  })
  @ApiCreatedData(TestimonialResponseDto)
  create(@Body() dto: CreateTestimonialDto, @User() user: IUserSession) {
    return this.testimonialsService.create(dto, user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AuthGuard)
  @ApiBearerAuth('authorization')
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Update testimonial',
    description: 'Update an existing testimonial by its unique identifier.',
  })
  @ApiOkData(TestimonialResponseDto)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTestimonialDto,
    @User() user: IUserSession,
  ) {
    return this.testimonialsService.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, AuthGuard)
  @ApiBearerAuth('authorization')
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Delete testimonial',
    description: 'Soft-delete a testimonial by its unique identifier.',
  })
  @ApiNoContentResponse({ description: 'Testimonial deleted successfully' })
  remove(@Param('id', ParseUUIDPipe) id: string, @User() user: IUserSession) {
    return this.testimonialsService.remove(id, user);
  }
}
