import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TextContent } from './entities/text-content.entity.js';
import { CreateTextContentDto } from './dto/create-text-content.dto.js';
import { UpdateTextContentDto } from './dto/update-text-content.dto.js';
import { Content } from '../../modules/content/entities/content.entity.js';
import { Text } from '../../modules/text/entities/text.entity.js';

@Injectable()
export class TextContentService {
  constructor(
    @InjectRepository(TextContent)
    private readonly textContentRepository: Repository<TextContent>,

    @InjectRepository(Content)
    private readonly contentRepository: Repository<Content>,

    @InjectRepository(Text)
    private readonly textRepository: Repository<Text>,
  ) {}

  async create(
    createTextContentDto: CreateTextContentDto,
  ): Promise<TextContent> {
    const {
      contentId,
      textId,
      type,
    } = createTextContentDto;

    const content = await this.contentRepository.findOneBy({
      id: contentId,
    });

    if (!content) {
      throw new NotFoundException(
        `Content with id ${contentId} not found`,
      );
    }

    let text: Text | null = null;

    if (textId !== undefined) {
      text = await this.textRepository.findOneBy({
        id: textId,
      });

      if (!text) {
        throw new NotFoundException(
          `Text with id ${textId} not found`,
        );
      }
    }

    const textContent = this.textContentRepository.create({
      type,
      content,
      text,
    });

    return await this.textContentRepository.save(textContent);
  }

  async findAll(): Promise<TextContent[]> {
    return this.textContentRepository.find({
      relations: {
        content: true,
        text: true,
      },
    });
  }

  async findOne(id: number): Promise<TextContent> {
    const textContent =
      await this.textContentRepository.findOne({
        where: { id },
        relations: {
          content: true,
          text: true,
        },
      });

    if (!textContent) {
      throw new NotFoundException(
        `TextContent with id ${id} not found`,
      );
    }

    return textContent;
  }

  async update(
    id: number,
    updateTextContentDto: UpdateTextContentDto,
  ): Promise<TextContent> {
    const textContent =
      await this.textContentRepository.findOne({
        where: { id },
        relations: {
          content: true,
          text: true,
        },
      });

    if (!textContent) {
      throw new NotFoundException(
        `TextContent with id ${id} not found`,
      );
    }

    if (Object.keys(updateTextContentDto).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    if (updateTextContentDto.type !== undefined) {
      textContent.type = updateTextContentDto.type;
    }

    if (updateTextContentDto.contentId !== undefined) {
      const content = await this.contentRepository.findOneBy({
        id: updateTextContentDto.contentId,
      });

      if (!content) {
        throw new NotFoundException(
          `Content with id ${updateTextContentDto.contentId} not found`,
        );
      }

      textContent.content = content;
    }

    if (updateTextContentDto.textId !== undefined) {
      const text = await this.textRepository.findOneBy({
        id: updateTextContentDto.textId,
      });

      if (!text) {
        throw new NotFoundException(
          `Text with id ${updateTextContentDto.textId} not found`,
        );
      }

      textContent.text = text;
    }

    return await this.textContentRepository.save(textContent);
  }

  async remove(id: number): Promise<void> {
    const result =
      await this.textContentRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(
        `TextContent with id ${id} not found`,
      );
    }
  }
}
