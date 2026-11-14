import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EnrollmentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AssignBatchDto, UpdateEnrollmentDto } from './dto/enrollment.dto';

@Injectable()
export class EnrollmentService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyEnrollments(candidateId: string) {
    return this.prisma.enrollment.findMany({
      where: { candidateId },
      include: {
        product: { select: { code: true, name: true } },
        batch: { select: { name: true, startDate: true, endDate: true, status: true } },
        payment: { select: { status: true, amount: true, paidAt: true } },
      },
      orderBy: { enrolledAt: 'desc' },
    });
  }

  async assignBatch(enrollmentId: string, dto: AssignBatchDto) {
    const enrollment = await this.prisma.enrollment.findUnique({ where: { id: enrollmentId } });
    if (!enrollment) throw new NotFoundException('Enrollment not found.');
    if (enrollment.status !== EnrollmentStatus.ACTIVE) {
      throw new BadRequestException('Only active enrollments can be assigned to a batch.');
    }

    const batch = await this.prisma.batch.findUnique({ where: { id: dto.batchId } });
    if (!batch) throw new NotFoundException('Batch not found.');
    if (batch.productId !== enrollment.productId) {
      throw new BadRequestException('Batch product does not match enrollment product.');
    }

    const currentCount = await this.prisma.enrollment.count({
      where: {
        batchId: dto.batchId,
        status: { in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.PAUSED] },
      },
    });
    if (currentCount >= batch.capacity) {
      throw new BadRequestException('Batch is at full capacity.');
    }

    return this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { batchId: dto.batchId },
    });
  }

  async updateStatus(enrollmentId: string, dto: UpdateEnrollmentDto) {
    const enrollment = await this.prisma.enrollment.findUnique({ where: { id: enrollmentId } });
    if (!enrollment) throw new NotFoundException('Enrollment not found.');
    return this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: dto.status },
    });
  }

  async getBatchRoster(batchId: string) {
    const batch = await this.prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) throw new NotFoundException('Batch not found.');

    return this.prisma.enrollment.findMany({
      where: {
        batchId,
        status: { in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.PAUSED] },
      },
      include: {
        candidate: {
          select: {
            candidateCode: true,
            fullName: true,
            email: true,
            phone: true,
            targetRole: true,
          },
        },
      },
      orderBy: { enrolledAt: 'asc' },
    });
  }
}
