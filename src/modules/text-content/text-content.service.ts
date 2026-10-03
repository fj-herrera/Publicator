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
      content_id,
      text_id,
      type,
    } = createTextContentDto;

    const content = await this.contentRepository.findOneBy({
      id: content_id,
    });

    if (!content) {
      throw new NotFoundException(
        `Content with id ${content_id} not found`,
      );
    }

    let text: Text | null = null;

    if (text_id !== undefined) {
      text = await this.textRepository.findOneBy({
        id: text_id,
      });

      if (!text) {
        throw new NotFoundException(
          `Text with id ${text_id} not found`,
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

    if (updateTextContentDto.content_id !== undefined) {
      const content = await this.contentRepository.findOneBy({
        id: updateTextContentDto.content_id,
      });

      if (!content) {
        throw new NotFoundException(
          `Content with id ${updateTextContentDto.content_id} not found`,
        );
      }

      textContent.content = content;
    }

    if (updateTextContentDto.text_id !== undefined) {
      const text = await this.textRepository.findOneBy({
        id: updateTextContentDto.text_id,
      });

      if (!text) {
        throw new NotFoundException(
          `Text with id ${updateTextContentDto.text_id} not found`,
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
