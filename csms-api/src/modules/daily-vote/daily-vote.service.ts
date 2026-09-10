import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { randomUUID } from 'crypto';

export interface VoteSubmitDto {
  uuid: string;
  selector: string;
  comment?: string;
}

@Injectable()
export class DailyVoteService {
  constructor(private prisma: PrismaService) {}

  private get model(): any {
    const p = this.prisma as any;
    if (p.dailyVote) return p.dailyVote;
    if (p.daily_votes) return p.daily_votes;
    if (p.epaperVote) return p.epaperVote;
    if (p.epaper_votes) return p.epaper_votes;

    const key = Object.keys(p).find(
      (k) => k.toLowerCase().includes('daily') || k.toLowerCase().includes('vote'),
    );
    if (key && p[key] && typeof p[key].findMany === 'function') {
      return p[key];
    }

    // Direct DB SQL Fallback if ORM delegate is missing in container
    return {
      findMany: async (args: any) => {
        try {
          const rows: any[] = await p.$queryRawUnsafe(
            `SELECT id, selector, is_voted as isVoted, comment, created_at as createdAt FROM daily_votes WHERE is_voted = 1 ORDER BY created_at DESC`,
          );
          return rows || [];
        } catch (e) {
          return [];
        }
      },
      findUnique: async (args: any) => {
        try {
          const rows: any[] = await p.$queryRawUnsafe(
            `SELECT id, selector, is_voted as isVoted, comment, created_at as createdAt, updated_at as updatedAt FROM daily_votes WHERE id = ? LIMIT 1`,
            args.where.id,
          );
          if (rows && rows.length > 0) {
            const r = rows[0];
            return {
              ...r,
              isVoted: Boolean(r.isVoted),
            };
          }
          return null;
        } catch (e) {
          return null;
        }
      },
      upsert: async (args: any) => {
        const targetId = args.where?.id || args.create?.id;
        const selectorVal = args.update?.selector || args.create?.selector || null;
        const commentVal = args.update?.comment || args.create?.comment || null;
        const ua = args.update?.userAgent || args.create?.userAgent || null;
        const ip = args.update?.ipAddress || args.create?.ipAddress || null;
        const isVotedVal = args.update?.isVoted !== undefined ? args.update?.isVoted : args.create?.isVoted;

        await p.$executeRawUnsafe(
          `INSERT INTO daily_votes (id, selector, is_voted, comment, user_agent, ip_address, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW()) 
           ON DUPLICATE KEY UPDATE selector = VALUES(selector), is_voted = VALUES(is_voted), comment = VALUES(comment), user_agent = VALUES(user_agent), ip_address = VALUES(ip_address), updated_at = NOW()`,
          targetId,
          selectorVal,
          isVotedVal ? 1 : 0,
          commentVal,
          ua,
          ip,
        );

        return {
          id: targetId,
          selector: selectorVal,
          isVoted: Boolean(isVotedVal),
          comment: commentVal,
          updatedAt: new Date(),
        };
      },
      create: async (args: any) => {
        const { id, selector, isVoted, comment, userAgent, ipAddress } = args.data;
        await p.$executeRawUnsafe(
          `INSERT INTO daily_votes (id, selector, is_voted, comment, user_agent, ip_address, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          id,
          selector || null,
          isVoted ? 1 : 0,
          comment || null,
          userAgent || null,
          ipAddress || null,
        );
        return {
          id,
          selector,
          isVoted: Boolean(isVoted),
          comment,
          createdAt: new Date(),
        };
      },
    };
  }

  async getStatus() {
    let totalTargetVoters = 0;
    try {
      const countRes: any[] = await (this.prisma as any).$queryRawUnsafe(`SELECT COUNT(*) as cnt FROM daily_votes`);
      if (countRes && countRes[0]) {
        totalTargetVoters = Number(countRes[0].cnt ?? countRes[0]['COUNT(*)']) || 0;
      }
    } catch {
      totalTargetVoters = 0;
    }

    const votes = await this.model.findMany({
      where: { isVoted: true },
      orderBy: { createdAt: 'desc' },
    });

    const completedCount = votes.length;
    const denominator = totalTargetVoters > 0 ? totalTargetVoters : 1;
    const progressPercent = totalTargetVoters > 0
      ? Math.min(100, Math.round((completedCount / denominator) * 100))
      : 0;

    const tallies = Array.from({ length: 9 }, (_, i) => {
      const selectorStr = String(i + 1);
      const count = votes.filter((v: any) => String(v.selector) === selectorStr).length;
      const pct =
        completedCount > 0
          ? Math.round((count / completedCount) * 100)
          : 0;
      return { selector: selectorStr, count, pct };
    });

    const topDraft = [...tallies].sort((a, b) => b.count - a.count)[0];

    return {
      totalTargetVoters,
      completedCount,
      progressPercent,
      tallies,
      topSelector: topDraft && topDraft.count > 0 ? topDraft.selector : null,
      votes: votes.map((v: any) => ({
        id: v.id,
        selector: v.selector,
        comment: v.comment,
        isVoted: Boolean(v.isVoted),
        createdAt: v.createdAt,
      })),
    };
  }

  async checkVoteStatus(uuid?: string) {
    if (!uuid) {
      return {
        valid: false,
        isVoted: false,
        message: 'UUID가 누락되었습니다.',
      };
    }

    const voteRecord = await this.model.findUnique({
      where: { id: uuid },
    });

    if (!voteRecord) {
      return {
        valid: false,
        exists: false,
        isVoted: false,
        uuid,
        message: '유효하지 않거나 등록되지 않은 UUID 링크입니다.',
      };
    }

    return {
      valid: true,
      exists: true,
      isVoted: Boolean(voteRecord.isVoted),
      uuid: voteRecord.id,
      votedSelector: voteRecord.selector,
      comment: voteRecord.comment,
      votedAt: voteRecord.updatedAt || voteRecord.createdAt,
      message: voteRecord.isVoted
        ? '이미 투표를 완료한 UUID입니다.'
        : '투표 가능한 UUID입니다.',
    };
  }

  async submitVote(dto: VoteSubmitDto, userAgent?: string, ipAddress?: string) {
    const trimmedUuid = (dto.uuid || '').trim();
    if (!trimmedUuid) {
      throw new BadRequestException('유효한 UUID가 필요합니다.');
    }

    if (!dto.selector) {
      throw new BadRequestException('올바른 시안(selector)을 선택해 주세요.');
    }

    // 1. 기존 레코드 확인 (미리 생성된 UUID만 투표 가능)
    const existing = await this.model.findUnique({
      where: { id: trimmedUuid },
    });

    if (!existing) {
      throw new BadRequestException('유효하지 않거나 등록되지 않은 UUID입니다.');
    }

    if (existing.isVoted) {
      throw new BadRequestException('이미 투표가 완료된 UUID입니다.');
    }

    // 2. 투표 반영 (isVoted: true)
    const updatedVote = await this.model.upsert({
      where: { id: trimmedUuid },
      update: {
        selector: String(dto.selector),
        isVoted: true,
        comment: dto.comment ? dto.comment.substring(0, 255) : null,
        userAgent: userAgent ? userAgent.substring(0, 250) : null,
        ipAddress: ipAddress ? ipAddress.substring(0, 45) : null,
      },
      create: {
        id: trimmedUuid,
        selector: String(dto.selector),
        isVoted: true,
        comment: dto.comment ? dto.comment.substring(0, 255) : null,
        userAgent: userAgent ? userAgent.substring(0, 250) : null,
        ipAddress: ipAddress ? ipAddress.substring(0, 45) : null,
      },
    });

    return {
      success: true,
      message: `시안(${updatedVote.selector}) 투표가 성공적으로 완료되었습니다!`,
      vote: {
        id: updatedVote.id,
        selector: updatedVote.selector,
        isVoted: true,
        comment: updatedVote.comment,
        votedAt: updatedVote.updatedAt || new Date(),
      },
      status: await this.getStatus(),
    };
  }

  async seedUuids(countInput?: number) {
    const rawCount = Number(countInput) || 8;
    const count = Math.min(100, Math.max(1, rawCount));

    const generatedUuids: string[] = [];
    for (let i = 0; i < count; i++) {
      generatedUuids.push(randomUUID());
    }

    for (const uuid of generatedUuids) {
      await this.model.create({
        data: {
          id: uuid,
          isVoted: false,
        },
      });
    }

    return {
      success: true,
      message: `${count}개의 랜덤 UUID가 성공적으로 생성되었습니다.`,
    };
  }

  async getUnusedUuids(limitInput?: number) {
    const limit = Math.min(100, Math.max(1, Number(limitInput) || 8));
    try {
      const rows: any[] = await (this.prisma as any).$queryRawUnsafe(
        `SELECT id FROM daily_votes WHERE is_voted = 0 AND (assigned_email IS NULL OR assigned_email = '') ORDER BY created_at ASC LIMIT ?`,
        limit,
      );
      return {
        success: true,
        count: rows ? rows.length : 0,
        uuids: rows ? rows.map((r) => r.id) : [],
      };
    } catch (e) {
      return { success: false, count: 0, uuids: [] };
    }
  }

  async assignEmailToUuid(uuid: string, email: string) {
    try {
      await (this.prisma as any).$executeRawUnsafe(
        `UPDATE daily_votes SET assigned_email = ? WHERE id = ?`,
        email,
        uuid,
      );
      return { success: true };
    } catch (e) {
      return { success: false };
    }
  }
}
