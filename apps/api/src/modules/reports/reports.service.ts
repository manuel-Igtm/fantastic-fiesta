import { Injectable, NotFoundException } from '@nestjs/common';
import { Report } from '@prisma/client';

import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../database/prisma.service';

import { GenerateReportDto } from './dto/generate-report.dto';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  async generate(userId: string, dto: GenerateReportDto): Promise<Report> {
    const report = await this.prisma.report.create({
      data: {
        userId,
        reportType: dto.reportType,
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
        fileRef: `reports/${userId}/${Date.now()}-${dto.reportType}.pdf`
      }
    });

    await this.auditService.log({
      actorUserId: userId,
      action: 'report.generated',
      objectType: 'report',
      objectId: report.id
    });

    return report;
  }

  async list(userId: string): Promise<Report[]> {
    return this.prisma.report.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async download(userId: string, reportId: string): Promise<{ downloadUrl: string }> {
    const report = await this.prisma.report.findFirst({
      where: { id: reportId, userId }
    });
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return {
      // Placeholder URL until object storage signed URL integration.
      downloadUrl: `https://storage.local/${report.fileRef}`
    };
  }
}
