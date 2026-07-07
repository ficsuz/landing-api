import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';
import { IPagination } from '@common/interfaces/pagination.interface';
import { paginate } from '@common/utils/api-response.util';
import { PrismaService } from '@common/services/prisma/prisma.service';
import { AppException } from '@common/exceptions/app.exception';
import { ErrorCodes } from '@common/constants/error-codes';
import { IUserSession } from '@modules/auth/interfaces/auth.interface';

const TESTIMONIAL_SELECT = {
  id: true,
  fullName: true,
  position: true,
  captionId: true,
  logoId: true,
  videoSource: true,
  order: true,
  status: true,
  createdAt: true,
} satisfies Prisma.TestimonialsSelect;

@Injectable()
export class TestimonialsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: IPagination) {
    const { limit, page, search, sortBy, order } = query;

    const where: Prisma.TestimonialsWhereInput = {
      isDeleted: false,
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: Prisma.QueryMode.insensitive } },
              { position: { contains: search, mode: Prisma.QueryMode.insensitive } },
            ],
          }
        : {}),
    };

    const orderBy =
      sortBy && Object.keys(TESTIMONIAL_SELECT).includes(sortBy)
        ? { [sortBy]: order }
        : [{ order: Prisma.SortOrder.asc }, { createdAt: Prisma.SortOrder.desc }];

    const [testimonials, total] = await Promise.all([
      this.prisma.testimonials.findMany({
        take: limit,
        skip: limit * (page - 1),
        where,
        select: TESTIMONIAL_SELECT,
        orderBy,
      }),
      this.prisma.testimonials.count({ where }),
    ]);

    return paginate(testimonials, total, page, limit);
  }

  async findById(id: string) {
    const testimonial = await this.prisma.testimonials.findUnique({
      where: { id, isDeleted: false },
      select: TESTIMONIAL_SELECT,
    });

    if (!testimonial) {
      throw new AppException(ErrorCodes.TESTIMONIAL_NOT_FOUND, { details: { id } });
    }

    return testimonial;
  }

  async create(dto: CreateTestimonialDto, user: IUserSession) {
    const testimonial = await this.prisma.testimonials.create({
      data: {
        fullName: dto.fullName,
        position: dto.position,
        captionId: dto.captionId,
        logoId: dto.logoId,
        videoSource: dto.videoSource,
        order: dto.order,
        status: dto.status,
        createdById: user.id,
      },
      select: TESTIMONIAL_SELECT,
    });

    return testimonial;
  }

  async update(id: string, dto: UpdateTestimonialDto, user: IUserSession) {
    const existing = await this.prisma.testimonials.findUnique({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      throw new AppException(ErrorCodes.TESTIMONIAL_NOT_FOUND, { details: { id } });
    }

    const testimonial = await this.prisma.testimonials.update({
      where: { id, isDeleted: false },
      data: {
        fullName: dto.fullName,
        position: dto.position,
        captionId: dto.captionId,
        logoId: dto.logoId,
        videoSource: dto.videoSource,
        order: dto.order,
        status: dto.status,
        updatedById: user.id,
      },
      select: TESTIMONIAL_SELECT,
    });

    return testimonial;
  }

  async remove(id: string, user: IUserSession): Promise<void> {
    const existing = await this.prisma.testimonials.findUnique({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      throw new AppException(ErrorCodes.TESTIMONIAL_NOT_FOUND, { details: { id } });
    }

    await this.prisma.testimonials.update({
      where: { id, isDeleted: false },
      data: { isDeleted: true, deletedAt: new Date(), deletedById: user.id },
    });
  }
}
